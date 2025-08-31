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
						title: "sys.nav.usermgmt.index",
						path: "/management/system",
						children: [
							{
								title: "sys.nav.usermgmt.permission",
								path: "/management/system/permission",
							},
							{
								title: "sys.nav.usermgmt.role",
								path: "/management/system/role",
							},
							{
								title: "sys.nav.usermgmt.user",
								path: "/management/system/user",
							},
						],
					},
				],
			},
		],
	},
];
