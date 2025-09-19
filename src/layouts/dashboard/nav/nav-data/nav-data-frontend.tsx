import { Icon } from "@/components/icon";
import type { NavProps } from "@/components/nav";

export const frontendNavData: NavProps["data"] = [
	{
		//name: "sys.nav.dashboard",
		items: [
			{
				title: "sys.nav.workbench",
				path: "/workbench",
				icon: <Icon icon="local:ic-workbench" size="24" />,
			},
		],
	},
	{
		//name: "sys.nav.mgmtpages",
		items: [
			{
				title: "sys.nav.management",
				path: "/management",
				icon: <Icon icon="local:ic-management" size="24" />,
				children: [
					{
						title: "sys.nav.usermgmt.system.permission",
						path: "/management/system/permission",
						auth: ["NOUSE"], // 只有ROLE_SYS_ADMIN角色可以访问
					},
					{
						title: "sys.nav.usermgmt.system.role",
						path: "/management/system/role",
						auth: ["NOUSE"], // 只有ROLE_SYS_ADMIN角色可以访问
					},
					{
						title: "sys.nav.usermgmt.system.user",
						path: "/management/system/user",
						auth: ["ROLE_SYS_ADMIN"], // 只有ROLE_SYS_ADMIN角色可以访问
					},
					{
						title: "sys.nav.usermgmt.system.approval",
						path: "/management/system/approval",
						auth: ["ROLE_AUTH_ADMIN"], // 只有ROLE_AUTH_ADMIN角色可以访问
					},
					{
						title: "sys.nav.usermgmt.system.audit_log",
						path: "/management/system/auditlog",
						auth: ["ROLE_AUDITOR_ADMIN"], // 只有ROLE_AUDITOR_ADMIN角色可以访问
					},
				],
			},
		],
	},
];
