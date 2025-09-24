import { Navigate, type RouteObject } from "react-router";
import AdminLayout from "@/admin/components/admin-layout";
import AdminGuard from "@/admin/lib/guard";
import DraftsView from "@/admin/views/drafts";
import ApprovalCenterView from "@/admin/views/approval-center";
import AuditCenterView from "@/admin/views/audit-center";
import OpsConfigView from "@/admin/views/ops-config";
import PortalMenusView from "@/admin/views/portal-menus";
import OrgManagementView from "@/admin/views/org-management";
import UserManagementView from "@/admin/views/user-management";
import RoleManagementView from "@/admin/views/role-management";

export const adminRoutes: RouteObject[] = [
	{
		path: "admin",
		element: (
			<AdminGuard>
				<AdminLayout />
			</AdminGuard>
		),
		children: [
			{ index: true, element: <Navigate to="orgs" replace /> },
			{ path: "orgs", element: <OrgManagementView /> },
			{ path: "users", element: <UserManagementView /> },
			{ path: "roles", element: <RoleManagementView /> },
			{ path: "drafts", element: <DraftsView /> },
			{ path: "approval", element: <ApprovalCenterView /> },
			{ path: "audit", element: <AuditCenterView /> },
			{ path: "ops", element: <OpsConfigView /> },
			{ path: "portal-menus", element: <PortalMenusView /> },
			{ path: "*", element: <Navigate to="/403" replace /> },
		],
	},
];
