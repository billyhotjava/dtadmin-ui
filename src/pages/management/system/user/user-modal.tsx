import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CreateUserRequest, KeycloakRole, KeycloakUser, UpdateUserRequest } from "#/keycloak";
import { KeycloakRoleService, KeycloakUserService } from "@/api/services/keycloakService";
import { Icon } from "@/components/icon";
import { Alert, AlertDescription } from "@/ui/alert";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";

interface UserModalProps {
	open: boolean;
	mode: "create" | "edit";
	user?: KeycloakUser;
	onCancel: () => void;
	onSuccess: () => void;
}

interface FormData {
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	enabled: boolean;
	emailVerified: boolean;
}

export default function UserModal({ open, mode, user, onCancel, onSuccess }: UserModalProps) {
	const [formData, setFormData] = useState<FormData>({
		username: "",
		email: "",
		firstName: "",
		lastName: "",
		enabled: true,
		emailVerified: false,
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [roles, setRoles] = useState<KeycloakRole[]>([]);
	const [userRoles, setUserRoles] = useState<KeycloakRole[]>([]);
	const [roleError, setRoleError] = useState<string>("");

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
		} catch (err) {
			setRoleError("加载用户角色失败");
			console.error("Error loading user roles:", err);
		}
	}, []);

	// 初始化表单数据
	useEffect(() => {
		if (mode === "edit" && user) {
			setFormData({
				username: user.username || "",
				email: user.email || "",
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				enabled: user.enabled ?? true,
				emailVerified: user.emailVerified ?? false,
			});

			// 加载用户角色
			if (user.id) {
				loadUserRoles(user.id);
			}
		} else {
			setFormData({
				username: "",
				email: "",
				firstName: "",
				lastName: "",
				enabled: true,
				emailVerified: false,
			});
			setUserRoles([]);
		}
		setError("");
		setRoleError("");
	}, [mode, user, loadUserRoles]);

	// 加载所有角色
	useEffect(() => {
		if (open) {
			loadRoles();
		}
	}, [open, loadRoles]);

	const handleSubmit = async () => {
		if (!formData.username.trim()) {
			setError("用户名不能为空");
			return;
		}

		if (!formData.email.trim()) {
			setError("邮箱不能为空");
			return;
		}

		setLoading(true);
		setError("");

		try {
			if (mode === "create") {
				const createData: CreateUserRequest = {
					username: formData.username,
					email: formData.email,
					firstName: formData.firstName,
					lastName: formData.lastName,
					enabled: formData.enabled,
					emailVerified: formData.emailVerified,
				};

				await KeycloakUserService.createUser(createData);
				toast.success("用户创建成功");
			} else if (mode === "edit" && user?.id) {
				const updateData: UpdateUserRequest = {
					username: formData.username,
					email: formData.email,
					firstName: formData.firstName,
					lastName: formData.lastName,
					enabled: formData.enabled,
					emailVerified: formData.emailVerified,
				};

				await KeycloakUserService.updateUser(user.id, updateData);
				toast.success("用户更新成功");
			}

			onSuccess();
		} catch (err: any) {
			setError(err.message || "操作失败");
			console.error("Error saving user:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleRoleToggle = async (role: KeycloakRole) => {
		if (!user?.id) return;

		try {
			setRoleError("");
			const hasRole = userRoles.some((r) => r.id === role.id);

			if (hasRole) {
				await KeycloakUserService.removeRolesFromUser(user.id, [role]);
				setUserRoles((prev) => prev.filter((r) => r.id !== role.id));
				toast.success(`已移除角色: ${role.name}`);
			} else {
				await KeycloakUserService.assignRolesToUser(user.id, [role]);
				setUserRoles((prev) => [...prev, role]);
				toast.success(`已分配角色: ${role.name}`);
			}
		} catch (err: any) {
			setRoleError(err.message || "角色操作失败");
			console.error("Error toggling role:", err);
		}
	};

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
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">邮箱 *</Label>
									<Input
										id="email"
										type="email"
										value={formData.email}
										onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
										placeholder="请输入邮箱"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="firstName">名</Label>
									<Input
										id="firstName"
										value={formData.firstName}
										onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
										placeholder="请输入名"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="lastName">姓</Label>
									<Input
										id="lastName"
										value={formData.lastName}
										onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
										placeholder="请输入姓"
									/>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div className="flex items-center space-x-2">
									<Switch
										id="enabled"
										checked={formData.enabled}
										onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
									/>
									<Label htmlFor="enabled">启用用户</Label>
								</div>
								<div className="flex items-center space-x-2">
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
										{userRoles.map((role) => (
											<Badge key={role.id} variant="default">
												{role.name}
												<Button
													variant="ghost"
													size="sm"
													className="ml-1 h-4 w-4 p-0"
													onClick={() => handleRoleToggle(role)}
												>
													<Icon icon="mdi:close" size={12} />
												</Button>
											</Badge>
										))}
										{userRoles.length === 0 && <span className="text-muted-foreground">暂无分配角色</span>}
									</div>

									<Label>可用角色</Label>
									<div className="flex flex-wrap gap-2">
										{roles
											.filter((role) => !userRoles.some((ur) => ur.id === role.id))
											.map((role) => (
												<Badge
													key={role.id}
													variant="outline"
													className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
													onClick={() => handleRoleToggle(role)}
												>
													{role.name}
													<Icon icon="mdi:plus" size={12} className="ml-1" />
												</Badge>
											))}
									</div>
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
