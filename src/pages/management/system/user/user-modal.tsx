import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CreateUserRequest, KeycloakRole, KeycloakUser, UpdateUserRequest, UserProfileConfig } from "#/keycloak";
import { KeycloakRoleService, KeycloakUserProfileService, KeycloakUserService } from "@/api/services/keycloakService";
import type { CustomUserAttributeKey } from "@/constants/user";
import {
	CUSTOM_USER_ATTRIBUTE_KEY_SET,
	DEPARTMENT_SUGGESTIONS,
	PERSONNEL_SECURITY_LEVEL_OPTIONS,
	POSITION_SUGGESTIONS,
} from "@/constants/user";
import { Icon } from "@/components/icon";
import { Alert, AlertDescription } from "@/ui/alert";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";
import { UserProfileField } from "./user-profile-field";
import { t } from "@/locales/i18n";
import {
	PERSON_SECURITY_LEVELS,
	deriveDataLevels,
	isApplicationAdminRole,
	isDataRole,
	isGovernanceRole,
} from "@/constants/governance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";

const RESERVED_PROFILE_ATTRIBUTE_NAMES = [
	"username",
	"email",
	"firstName",
	"lastName",
	"fullName",
	"locale",
	"department",
	"position",
	"person_security_level",
	"personnel_security_level",
	"person_level",
	"data_levels",
];

interface UserModalProps {
	open: boolean;
	mode: "create" | "edit";
	user?: KeycloakUser;
	onCancel: () => void;
	onSuccess: () => void;
}

interface FormData {
	username: string;
	fullName: string;
	email: string;
	personnelSecurityLevel: string;
	department: string;
	enabled: boolean;
	emailVerified: boolean;
	attributes: Record<string, string[]>;
}

interface RoleChange {
	role: KeycloakRole;
	action: "add" | "remove";
}

interface FormState {
	originalData: FormData;
	originalRoles: KeycloakRole[];
	roleChanges: RoleChange[];
}

const createEmptyFormData = (): FormData => ({
	username: "",
	fullName: "",
	email: "",
	personnelSecurityLevel: "",
	department: "",
	position: "",
	enabled: true,
	emailVerified: false,
	attributes: {},
});

const createEmptyFormState = (): FormState => ({
	originalData: createEmptyFormData(),
	originalRoles: [],
	roleChanges: [],
});

const RESERVED_ATTRIBUTE_NAMES = new Set<string>(["username", "email", "firstName", "lastName", "locale", "fullname"]);

CUSTOM_USER_ATTRIBUTE_KEY_SET.forEach((key) => RESERVED_ATTRIBUTE_NAMES.add(key));

export default function UserModal({ open, mode, user, onCancel, onSuccess }: UserModalProps) {
	const [formData, setFormData] = useState<FormData>(() => createEmptyFormData());
	const [formData, setFormData] = useState<FormData>({
		username: "",
		fullName: "",
		email: "",
		enabled: true,
		emailVerified: false,
		attributes: {},
	});

	const [formState, setFormState] = useState<FormState>({
		originalData: {
			username: "",
			fullName: "",
			email: "",
			enabled: true,
			emailVerified: false,
			attributes: {},
		},
		originalRoles: [],
		roleChanges: [],
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [roles, setRoles] = useState<KeycloakRole[]>([]);
	const [userRoles, setUserRoles] = useState<KeycloakRole[]>([]);
	const [roleError, setRoleError] = useState<string>("");
	const [personLevel, setPersonLevel] = useState<string>("NON_SECRET");

	// UserProfile相关状态
	const [userProfileConfig, setUserProfileConfig] = useState<UserProfileConfig | null>(null);
	const [profileLoading, setProfileLoading] = useState(false);
	//const [setProfileError] = useState<string>("");

	const normalizeAttributesForState = useCallback(
		(attributes: Record<string, string[]> = {}, level?: string): Record<string, string[]> => {
			const cloned: Record<string, string[]> = {};
			Object.entries(attributes).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					cloned[key] = [...value];
				}
			});

			const candidateLevel = (
				level ||
				cloned.personnel_security_level?.[0] ||
				cloned.person_security_level?.[0] ||
				cloned.person_level?.[0] ||
				""
			).toUpperCase();
			const resolvedLevel = PERSON_SECURITY_LEVELS.some((option) => option.value === candidateLevel)
				? candidateLevel
				: undefined;

			if (resolvedLevel) {
				const derived = deriveDataLevels(resolvedLevel);
				cloned.personnel_security_level = [resolvedLevel];
				cloned.person_security_level = [resolvedLevel];
				cloned.person_level = [resolvedLevel];
				cloned.data_levels = [...derived];
			} else {
				delete cloned.personnel_security_level;
				delete cloned.person_security_level;
				delete cloned.person_level;
				delete cloned.data_levels;
			}

			Object.keys(cloned).forEach((key) => {
				const value = cloned[key];
				if (Array.isArray(value)) {
					const sanitized = value
						.map((item) => (typeof item === "string" ? item.trim() : item))
						.filter((item): item is string => typeof item === "string" && item.length > 0);

					if (sanitized.length > 0) {
						cloned[key] = sanitized;
					} else {
						delete cloned[key];
					}
				}
			});

			return cloned;
		},
		[],
	);

	const buildAttributesPayload = useCallback((): Record<string, string[]> => {
		return normalizeAttributesForState(formData.attributes, personLevel);
	}, [formData.attributes, normalizeAttributesForState, personLevel]);

	const derivedDataLevels = useMemo(() => deriveDataLevels(personLevel), [personLevel]);

	const updateSingleValueAttribute = (key: string, value: string) => {
		setFormData((prev) => {
			const nextAttributes = { ...prev.attributes };
			if (value.trim()) {
				nextAttributes[key] = [value];
			} else {
				delete nextAttributes[key];
			}

			return {
				...prev,
				attributes: nextAttributes,
			};
		});
	};

	// 加载UserProfile配置
	const loadUserProfileConfig = useCallback(async () => {
		setProfileLoading(true);
		//setProfileError("");
		try {
			const config = await KeycloakUserProfileService.getUserProfileConfig();
			setUserProfileConfig(config);
		} catch (err) {
			console.error("Error loading user profile config:", err);
			//setProfileError("加载用户配置文件失败");
		} finally {
			setProfileLoading(false);
		}
	}, []);

	// 加载所有角色
	const loadRoles = useCallback(async () => {
		try {
			const rolesData = await KeycloakRoleService.getAllRealmRoles();
			setRoles(rolesData);
		} catch (err) {
			setRoleError("加载角色列表失败");
			console.error("Error loading roles:", err);
		}
	}, []);

	const loadUserRoles = useCallback(async (userId: string) => {
		try {
			const userRolesData = await KeycloakUserService.getUserRoles(userId);
			setUserRoles(userRolesData);
			return userRolesData;
		} catch (err) {
			setRoleError("加载用户角色失败");
			console.error("Error loading user roles:", err);
			return [];
		}
	}, []);

	// 初始化表单数据
	useEffect(() => {
		if (mode === "edit" && user) {
			const filteredAttributes: Record<string, string[]> = {};
			if (user.attributes) {
				Object.entries(user.attributes).forEach(([key, value]) => {
					if (!CUSTOM_USER_ATTRIBUTE_KEY_SET.has(key)) {
						filteredAttributes[key] = value;
					}
				});
			}

			const initialFormData: FormData = {
				username: user.username || "",
				fullName: user.firstName || user.attributes?.fullname?.[0] || "",
				email: user.email || "",
				personnelSecurityLevel: user.attributes?.personnel_security_level?.[0] || "",
				department: user.attributes?.department?.[0] || "",
				position: user.attributes?.position?.[0] || "",
				enabled: user.enabled ?? true,
				emailVerified: user.emailVerified ?? false,
			const candidateLevel = (
				user.attributes?.personnel_security_level?.[0] ||
				user.attributes?.person_security_level?.[0] ||
				user.attributes?.person_level?.[0] ||
				"NON_SECRET"
			).toUpperCase();
			const resolvedLevel = PERSON_SECURITY_LEVELS.some((option) => option.value === candidateLevel)
				? candidateLevel
				: "NON_SECRET";
			const normalizedAttributes = normalizeAttributesForState(user.attributes || {}, resolvedLevel);

			const initialFormData: FormData = {
				username: user.username || "",
				fullName: user.firstName || user.lastName || "",
				email: user.email || "",
				enabled: user.enabled ?? true,
				emailVerified: user.emailVerified ?? false,
				attributes: normalizedAttributes,
			};

			setPersonLevel(resolvedLevel);
			setFormData(initialFormData);
			setFormState({
				originalData: {
					...initialFormData,
					attributes: { ...initialFormData.attributes },
				},
				originalRoles: [],
				roleChanges: [],
			});

			if (user.id) {
				loadUserRoles(user.id).then((roles) => {
					setFormState((prev) => ({
						...prev,
						originalRoles: roles,
					}));
				});
			}
		} else {
			const emptyData = createEmptyFormData();
			setFormData(emptyData);
			const defaultLevel = "NON_SECRET";
			const baseAttributes = normalizeAttributesForState({}, defaultLevel);
			setPersonLevel(defaultLevel);
			setFormData({
				username: "",
				fullName: "",
				email: "",
				enabled: true,
				emailVerified: false,
				attributes: baseAttributes,
			});
			setFormState({
				originalData: {
					username: "",
					fullName: "",
					email: "",
					enabled: true,
					emailVerified: false,
					attributes: baseAttributes,
				},
				originalRoles: [],
				roleChanges: [],
			});
			setUserRoles([]);
		}
		setError("");
		setRoleError("");
	}, [mode, user, loadUserRoles, normalizeAttributesForState]);

	// 加载所有角色
	useEffect(() => {
		if (open) {
			loadRoles();
			loadUserProfileConfig(); // 加载UserProfile配置
		}
	}, [open, loadRoles, loadUserProfileConfig]);

	const buildAttributesPayload = () => {
		const attributes: Record<string, string[]> = { ...formData.attributes };

		const customAttributes: Array<{
			key: CustomUserAttributeKey;
			value: string;
			originalValue: string;
		}> = [
			{
				key: "personnel_security_level",
				value: formData.personnelSecurityLevel,
				originalValue: formState.originalData.personnelSecurityLevel,
			},
			{
				key: "department",
				value: formData.department.trim(),
				originalValue: formState.originalData.department,
			},
			{
				key: "position",
				value: formData.position.trim(),
				originalValue: formState.originalData.position,
			},
		];

		customAttributes.forEach(({ key, value, originalValue }) => {
			const normalizedOriginal = originalValue.trim();
			if (value) {
				attributes[key] = [value];
			} else if (normalizedOriginal) {
				attributes[key] = [];
			} else {
				delete attributes[key];
			}
		});

		return attributes;
	};

	const handleSubmit = async () => {
		const username = formData.username.trim();
		const fullName = formData.fullName.trim();
		const email = formData.email.trim();

		if (!username) {
			setError("用户名不能为空");
			return;
		}

		if (!fullName) {
			setError("姓名不能为空");
			return;
		}

		// 检查UserProfile中的必填字段
		if (userProfileConfig?.attributes) {
			for (const attribute of userProfileConfig.attributes) {
				// 跳过基础字段，因为它们已经在上面检查过了
				if (
					["username", "email", "firstName", "lastName", "fullName", "department", "position"].includes(attribute.name)
				) {
					continue;
				}

				// 检查是否为必填字段
				if (attribute.required) {
					const value = formData.attributes[attribute.name];
					// 检查值是否为空
					if (
						!value ||
						(Array.isArray(value) && (value.length === 0 || value.every((v) => v === ""))) ||
						(typeof value === "string" && (!(value as string).trim() || (value as string) === ""))
					) {
						console.log(attribute.displayName);
						setError(`"${t(attribute.displayName.replace(/\$\{([^}]*)\}/g, "$1")) || attribute.name}" 是必填字段`);
						return;
					}
				}
			}
		}

		// 检查是否有任何变更
		const hasUserInfoChanges = hasUserInfoChanged();
		const hasRoleChanges = formState.roleChanges.length > 0;

		// 如果没有任何变更，显示提示信息
		if (!hasUserInfoChanges && !hasRoleChanges) {
			toast.info("没有检测到任何变更");
			return;
		}

		setLoading(true);
		setError("");
		const attributesPayload = buildAttributesPayload();

		try {
			const username = formData.username.trim();
			const fullName = formData.fullName.trim();
			const email = formData.email.trim();
			const attributesPayload = buildAttributesPayload();
			const emailPayload = email || (formState.originalData.email ? "" : undefined);

			if (mode === "create") {
				const createData: CreateUserRequest = {
					username,
					email: email || undefined,
					firstName: fullName,
					enabled: formData.enabled,
					emailVerified: formData.emailVerified,
					attributes: attributesPayload,
				};

				if (email) {
					createData.email = email;
				}

				const response = await KeycloakUserService.createUser(createData);
				if (response.userId) {
					toast.success("用户创建请求已提交，等待审批");
				} else {
					toast.success("用户创建请求提交成功");
				}
			} else if (mode === "edit" && user?.id) {
				// 分别处理用户信息变更和角色变更
				const hasUserInfoChanges = hasUserInfoChanged();
				const hasRoleChanges = formState.roleChanges.length > 0;

				// 如果有用户信息变更，提交用户信息更新请求
				if (hasUserInfoChanges) {
					const updateData: UpdateUserRequest = {
						id: user.id,
						username,
						email: emailPayload,
						firstName: fullName,
						email,
						firstName: fullName,
						enabled: formData.enabled,
						emailVerified: formData.emailVerified,
						attributes: attributesPayload,
					};

					const response = await KeycloakUserService.updateUser(user.id, updateData);
					if (response.message) {
						toast.success(`用户信息更新请求提交成功: ${response.message}`);
					} else {
						toast.success("用户信息更新请求提交成功");
					}
				}

				// 如果有角色变更，提交角色变更请求
				if (hasRoleChanges) {
					// 处理添加的角色
					const rolesToAdd = formState.roleChanges.filter((rc) => rc.action === "add").map((rc) => rc.role);

					if (rolesToAdd.length > 0) {
						const response = await KeycloakUserService.assignRolesToUser(user.id, rolesToAdd);
						if (response.message) {
							toast.success(`角色分配请求提交成功: ${response.message}`);
						} else {
							toast.success("角色分配请求提交成功");
						}
					}

					// 处理移除的角色
					const rolesToRemove = formState.roleChanges.filter((rc) => rc.action === "remove").map((rc) => rc.role);

					if (rolesToRemove.length > 0) {
						const response = await KeycloakUserService.removeRolesFromUser(user.id, rolesToRemove);
						if (response.message) {
							toast.success(`角色移除请求提交成功: ${response.message}`);
						} else {
							toast.success("角色移除请求提交成功");
						}
					}
				}
			}

			onSuccess();
		} catch (err: any) {
			setError(err.message || "操作失败");
			console.error("Error saving user:", err);
		} finally {
			setLoading(false);
		}
	};

	// 检查用户信息是否有变更
	const hasUserInfoChanged = (): boolean => {
		const { originalData } = formState;
		const normalizedAttributes = buildAttributesPayload();
		return (
			formData.username !== originalData.username ||
			formData.email !== originalData.email ||
			formData.fullName !== originalData.fullName ||
			formData.personnelSecurityLevel !== originalData.personnelSecurityLevel ||
			formData.department !== originalData.department ||
			formData.enabled !== originalData.enabled ||
			formData.emailVerified !== originalData.emailVerified ||
			JSON.stringify(normalizedAttributes) !== JSON.stringify(originalData.attributes || {})
		);
	};

	const resolveRoleBadgeVariant = (
		roleName: string,
	): "default" | "secondary" | "destructive" | "info" | "warning" | "success" | "error" | "outline" => {
		if (isDataRole(roleName)) return "secondary";
		if (isGovernanceRole(roleName)) return "warning";
		if (isApplicationAdminRole(roleName)) return "info";
		return "default";
	};

	const handleRoleToggle = (role: KeycloakRole) => {
		const hasRole = userRoles.some((r) => r.id === role.id);
		const roleName = role.name;

		if (isDataRole(roleName)) {
			toast.warning("数据密级角色由人员密级自动分配，请在上方调整人员密级。");
			return;
		}

		if (!hasRole) {
			if (isApplicationAdminRole(roleName) && userRoles.some((existing) => isGovernanceRole(existing.name))) {
				toast.error("请先移除治理类角色后再分配应用管理员角色。");
				return;
			}
			if (isGovernanceRole(roleName) && userRoles.some((existing) => isApplicationAdminRole(existing.name))) {
				toast.error("应用管理员角色与治理类角色互斥，请先移除应用管理员角色。");
				return;
			}
		}

		if (hasRole) {
			setUserRoles((prev) => prev.filter((r) => r.id !== role.id));
			setFormState((prev) => ({
				...prev,
				roleChanges: [
					...prev.roleChanges.filter((rc) => rc.role.id !== role.id || rc.action !== "add"),
					{ role, action: "remove" },
				],
			}));
		} else {
			setUserRoles((prev) => [...prev, role]);
			setFormState((prev) => ({
				...prev,
				roleChanges: [
					...prev.roleChanges.filter((rc) => rc.role.id !== role.id || rc.action !== "remove"),
					{ role, action: "add" },
				],
			}));
		}
	};

	const departmentValue = formData.attributes.department?.[0] ?? "";
	const positionValue = formData.attributes.position?.[0] ?? "";

	const title = mode === "create" ? "创建用户" : "编辑用户";

	return (
		<Dialog open={open} onOpenChange={onCancel}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="space-y-6">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* 基本信息 */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">基本信息</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="username">用户名 *</Label>
									<Input
										id="username"
										value={formData.username}
										onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
										placeholder="请输入用户名"
									/>
									<p className="text-xs text-muted-foreground">用户名即登录名，需要保持唯一。</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="fullName">姓名 *</Label>
									<Input
										id="fullName"
										value={formData.fullName}
										onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
										placeholder="请输入姓名"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="fullName">姓名 *</Label>
									<Input
										id="fullName"
										value={formData.fullName}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												fullName: e.target.value,
											}))
										}
										placeholder="请输入姓名"
									/>
								</div>
							</div>
									<Label htmlFor="email">邮箱</Label>
									<Input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
										placeholder="请输入邮箱（可选）"
									/>
									<p className="text-xs text-muted-foreground">邮箱用于接收通知，可选填写。</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="personnelSecurityLevel">人员密级</Label>
									<Select
										value={formData.personnelSecurityLevel || undefined}
										onValueChange={(value) =>
											setFormData((prev) => ({
												...prev,
												personnelSecurityLevel: value,
											}))
										}
									>
										<SelectTrigger id="personnelSecurityLevel" className="w-full">
											<SelectValue placeholder="请选择人员密级" />
										</SelectTrigger>
										<SelectContent>
											{PERSONNEL_SECURITY_LEVEL_OPTIONS.map((option) => (
												<SelectItem key={option} value={option}>
													{option}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
								<div className="space-y-2">
									<Label htmlFor="department">部门</Label>
									<Input
										id="department"
										value={formData.department}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												department: e.target.value,
											}))
										}
										placeholder={`例如：${DEPARTMENT_SUGGESTIONS.join("、")}`}

										value={departmentValue}
										onChange={(e) => updateSingleValueAttribute("department", e.target.value)}
										placeholder="例如：研究所、财务、二级部门A"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="position">职位</Label>
									<Input
										id="position"
										value={formData.position}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												position: e.target.value,
											}))
										}
										value={positionValue}
										onChange={(e) => updateSingleValueAttribute("position", e.target.value)}
										placeholder="例如：所长、副所长、财务主管"
									/>
								</div>
							</div>

							{/* UserProfile字段 (基于realm配置) */}
							{userProfileConfig?.attributes && userProfileConfig.attributes.length > 0 && (
								<div className="">
									{profileLoading ? (
										<div className="flex items-center justify-center py-4">
											<Icon icon="mdi:loading" className="animate-spin mr-2" />
											<span>加载配置中...</span>
										</div>
									) : (
										<div className="grid grid-cols-2 gap-4">
											{userProfileConfig.attributes
												.filter((attr) => !RESERVED_PROFILE_ATTRIBUTE_NAMES.includes(attr.name))
												.map((attribute) => (
													<UserProfileField
														key={attribute.name}
														attribute={attribute}
														value={formData.attributes[attribute.name]}
														onChange={(value) => {
															setFormData((prev) => ({
																...prev,
																attributes: {
																	...prev.attributes,
																	[attribute.name]: Array.isArray(value) ? value : [value],
																},
															}));
														}}
													/>
												))}
										</div>
									)}
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center space-x-2">
									<Switch
										id="enabled"
										checked={formData.enabled}
										onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
									/>
									<Label htmlFor="enabled">启用用户</Label>
								</div>
								<div className="flex items-center space-x-2 hidden">
									<Switch
										id="emailVerified"
										checked={formData.emailVerified}
										onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, emailVerified: checked }))}
									/>
									<Label htmlFor="emailVerified">邮箱已验证</Label>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">安全属性</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label>人员密级 *</Label>
								<Select value={personLevel} onValueChange={(value) => setPersonLevel(value)}>
									<SelectTrigger className="w-full justify-between">
										<SelectValue placeholder="请选择人员密级" />
									</SelectTrigger>
									<SelectContent>
										{PERSON_SECURITY_LEVELS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{option.label}（{option.value}）
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									人员密级决定自动分配的数据访问范围和可授予的数据密级角色。
								</p>
							</div>

							<div className="space-y-2">
								<Label>可访问数据密级（自动派生）</Label>
								<div className="flex flex-wrap gap-2">
									{derivedDataLevels.length > 0 ? (
										derivedDataLevels.map((level) => (
											<Badge key={level} variant="secondary">
												{level.replace("_", " ")}
											</Badge>
										))
									) : (
										<span className="text-muted-foreground text-sm">未配置人员密级</span>
									)}
								</div>
								<p className="text-xs text-muted-foreground">数据密级角色将由系统自动同步，请勿手动调整。</p>
							</div>
						</CardContent>
					</Card>
					{/* 角色分配 (仅编辑模式) */}
					{mode === "edit" && user?.id && (
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">角色分配</CardTitle>
							</CardHeader>
							<CardContent>
								{roleError && (
									<Alert variant="destructive" className="mb-4">
										<AlertDescription>{roleError}</AlertDescription>
									</Alert>
								)}

								<div className="space-y-2">
									<Label>用户角色</Label>
									<div className="flex flex-wrap gap-2 mb-4">
										{userRoles.map((role) => {
											const allowRemoval = !isDataRole(role.name);
											return (
												<Badge key={role.id ?? role.name} variant={resolveRoleBadgeVariant(role.name)}>
													{role.name}
													{allowRemoval && (
														<Button
															variant="ghost"
															size="sm"
															className="ml-1 h-4 w-4 p-0"
															onClick={() => handleRoleToggle(role)}
														>
															<Icon icon="mdi:close" size={12} />
														</Button>
													)}
												</Badge>
											);
										})}
										{userRoles.length === 0 && <span className="text-muted-foreground">暂无分配角色</span>}
									</div>

									<Label>可用角色</Label>
									<div className="flex flex-wrap gap-2">
										{roles
											.filter((role) => !userRoles.some((ur) => ur.id === role.id))
											.filter((role) => !isDataRole(role.name))
											.map((role) => (
												<Badge
													key={role.id ?? role.name}
													variant={resolveRoleBadgeVariant(role.name)}
													className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
													onClick={() => handleRoleToggle(role)}
												>
													{role.name}
													<Icon icon="mdi:plus" size={12} className="ml-1" />
												</Badge>
											))}
									</div>
									<p className="text-xs text-muted-foreground mt-2">
										治理角色与应用管理员角色互斥；数据密级角色由系统根据人员密级自动管理。
									</p>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						取消
					</Button>
					<Button onClick={handleSubmit} disabled={loading}>
						{loading ? "处理中..." : "确定"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
