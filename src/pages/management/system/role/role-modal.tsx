import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { CreateRoleRequest, KeycloakRole, UpdateRoleRequest } from "#/keycloak";
import { KeycloakRoleService } from "@/api/services/keycloakService";
import { DATA_SECURITY_LEVEL_OPTIONS } from "@/constants/governance";
import { Alert, AlertDescription } from "@/ui/alert";
import { Button } from "@/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import { Textarea } from "@/ui/textarea";

interface RoleModalProps {
	open: boolean;
	mode: "create" | "edit";
	role?: KeycloakRole;
	onCancel: () => void;
	onSuccess: () => void;
}

interface FormData {
	name: string;
	description: string;
	composite: boolean;
	dataSecurityLevel: string;
}

export default function RoleModal({ open, mode, role, onCancel, onSuccess }: RoleModalProps) {
	const [formData, setFormData] = useState<FormData>({
		name: "",
		description: "",
		composite: false,
		dataSecurityLevel: "DATA_INTERNAL",
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");

	// 初始化表单数据
	useEffect(() => {
		if (mode === "edit" && role) {
			setFormData({
				name: role.name || "",
				description: role.description || "",
				composite: role.composite ?? false,
				dataSecurityLevel: role.attributes?.dataSecurityLevel ?? "DATA_INTERNAL",
			});
		} else {
			setFormData({
				name: "",
				description: "",
				composite: false,
				dataSecurityLevel: "DATA_INTERNAL",
			});
		}
		setError("");
	}, [mode, role]);

	const handleSubmit = async () => {
		if (!formData.name.trim()) {
			setError("角色名称不能为空");
			return;
		}

		// 角色名称验证
		if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
			setError("角色名称只能包含字母、数字、下划线和中划线");
			return;
		}

		setLoading(true);
		setError("");

		try {
			if (mode === "create") {
				const createData: CreateRoleRequest = {
					name: formData.name,
					description: formData.description,
					composite: formData.composite,
					attributes: { dataSecurityLevel: formData.dataSecurityLevel },
				};

				await KeycloakRoleService.createRole(createData);
				toast.success("角色创建成功");
			} else if (mode === "edit" && role?.name) {
				const updateData: UpdateRoleRequest = {
					name: formData.name,
					description: formData.description,
					composite: formData.composite,
					attributes: { ...role.attributes, dataSecurityLevel: formData.dataSecurityLevel },
				};

				await KeycloakRoleService.updateRole(role.name, updateData);
				toast.success("角色更新成功");
			}

			onSuccess();
		} catch (err: any) {
			setError(err.message || "操作失败");
			console.error("Error saving role:", err);
		} finally {
			setLoading(false);
		}
	};

	const title = mode === "create" ? "创建角色" : "编辑角色";

	return (
		<Dialog open={open} onOpenChange={onCancel}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-2">
						<Label htmlFor="name">角色名称 *</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
							placeholder="请输入角色名称"
							disabled={mode === "edit"} // 编辑模式下不允许修改角色名称
						/>
						{mode === "edit" && <p className="text-xs text-muted-foreground">编辑模式下不可修改角色名称</p>}
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">描述</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
							placeholder="请输入角色描述"
							rows={3}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="dataSecurityLevel">数据密级 *</Label>
						<select
							id="dataSecurityLevel"
							className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
							value={formData.dataSecurityLevel}
							onChange={(event) =>
								setFormData((prev) => ({
									...prev,
									dataSecurityLevel: event.target.value,
								}))
							}
						>
							{DATA_SECURITY_LEVEL_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						<p className="text-xs text-muted-foreground">请选择该角色可访问数据的最高密级。</p>
					</div>

					<div className="space-y-3">
						<div className="flex items-center space-x-2">
							<Switch
								id="composite"
								checked={formData.composite}
								onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, composite: checked }))}
							/>
							<Label htmlFor="composite">复合角色</Label>
						</div>
						<p className="text-xs text-muted-foreground">复合角色可以包含其他角色</p>
					</div>
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
