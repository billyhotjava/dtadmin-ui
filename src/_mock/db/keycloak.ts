import type { KeycloakGroup, KeycloakRole, KeycloakUser } from "#/keycloak";

const roles: KeycloakRole[] = [
	{
		id: "role-sysadmin",
		name: "SYSADMIN",
		description: "系统管理员，负责平台全局配置",
		composite: true,
		clientRole: false,
		containerId: "realm",
		attributes: { category: "核心" },
	},
	{
		id: "role-authadmin",
		name: "AUTHADMIN",
		description: "授权管理员，审批用户与角色变更",
		composite: false,
		clientRole: false,
		containerId: "realm",
	},
	{
		id: "role-auditadmin",
		name: "AUDITADMIN",
		description: "审计管理员，巡检并导出安全日志",
		composite: false,
		clientRole: false,
		containerId: "realm",
	},
	{
		id: "role-data-steward",
		name: "DATA_STEWARD",
		description: "数据管家，维护数据资产目录",
		composite: false,
		clientRole: false,
		containerId: "realm",
	},
];

const users: KeycloakUser[] = [
	{
		id: "user-zhang-wei",
		username: "张伟",
		email: "zhang.wei@demo.cn",
		firstName: "伟",
		lastName: "张",
		enabled: true,
		attributes: { title: ["平台架构师"], department: ["数据平台组"] },
		groups: ["数据平台组"],
		realmRoles: ["SYSADMIN"],
		createdTimestamp: Date.parse("2024-03-15T08:00:00Z"),
	},
	{
		id: "user-li-xiaomei",
		username: "李晓美",
		email: "li.xiaomei@demo.cn",
		firstName: "晓美",
		lastName: "李",
		enabled: true,
		attributes: { title: ["数据分析师"], department: ["市场洞察组"] },
		groups: ["市场洞察组"],
		realmRoles: ["DATA_STEWARD"],
		createdTimestamp: Date.parse("2024-02-28T10:20:00Z"),
	},
	{
		id: "user-wang-hong",
		username: "王虹",
		email: "wang.hong@demo.cn",
		firstName: "虹",
		lastName: "王",
		enabled: false,
		attributes: { title: ["安全审核员"], department: ["安全审计部"] },
		groups: ["AI创新组"],
		realmRoles: ["AUDITADMIN"],
		createdTimestamp: Date.parse("2024-01-18T06:45:00Z"),
	},
	{
		id: "user-chen-yu",
		username: "陈宇",
		email: "chen.yu@demo.cn",
		firstName: "宇",
		lastName: "陈",
		enabled: true,
		attributes: { title: ["数据治理专员"], department: ["数据治理小组"] },
		groups: ["数据治理小组"],
		realmRoles: ["DATA_STEWARD", "AUTHADMIN"],
		createdTimestamp: Date.parse("2023-12-02T04:15:00Z"),
	},
];

const groups: KeycloakGroup[] = [
	{
		id: "group-data-platform",
		name: "数据平台组",
		path: "/数据平台组",
		attributes: { leader: ["张伟"], orgType: ["DEPARTMENT"], orgCode: ["DPF"] },
		subGroups: [
			{
				id: "group-data-governance",
				name: "数据治理小组",
				path: "/数据平台组/数据治理小组",
				attributes: { leader: ["陈宇"], orgType: ["TEAM"], orgCode: ["DPF-GOV"] },
			},
		],
	},
	{
		id: "group-ai-innovation",
		name: "AI创新组",
		path: "/AI创新组",
		attributes: { leader: ["王强"], orgType: ["TEAM"], orgCode: ["AI-01"] },
		subGroups: [],
	},
];

const groupMembers: Record<string, string[]> = {
	"group-data-platform": ["user-zhang-wei", "user-li-xiaomei"],
	"group-data-governance": ["user-chen-yu"],
	"group-ai-innovation": ["user-wang-hong"],
};

export const keycloakDb: {
	roles: KeycloakRole[];
	users: KeycloakUser[];
	groups: KeycloakGroup[];
	groupMembers: Record<string, string[]>;
} = {
	roles,
	users,
	groups,
	groupMembers,
};
