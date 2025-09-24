import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Text } from "@/ui/typography";

interface PendingTask {
	id: string;
	module: string;
	action: string;
	target: string;
	description: string;
	submittedAt: string;
	submittedBy: string;
	status: string;
}

interface CompletedTask extends Omit<PendingTask, "status"> {
	decidedAt: string;
	decidedBy: string;
	result: string;
}

const pendingTasks: PendingTask[] = [
	{
		id: "T-202405-001",
		module: "用户管理",
		action: "新增用户",
		target: "dataops",
		description: "为数据运维团队创建 dataops 账号并绑定默认角色",
		submittedAt: "2024-05-12T09:30:00+08:00",
		submittedBy: "sysadmin",
		status: "待审批",
	},
	{
		id: "T-202405-002",
		module: "角色管理",
		action: "新增角色",
		target: "DATA_STEWARD",
		description: "新增数据管家角色并配置数据目录权限",
		submittedAt: "2024-05-12T14:05:00+08:00",
		submittedBy: "sysadmin",
		status: "待审批",
	},
	{
		id: "T-202405-003",
		module: "菜单管理",
		action: "新增菜单",
		target: "资产巡检",
		description: "在门户端新增资产巡检菜单，指向 /portal/inspection",
		submittedAt: "2024-05-13T08:50:00+08:00",
		submittedBy: "sysadmin",
		status: "待审批",
	},
	{
		id: "T-202405-004",
		module: "用户管理",
		action: "停用用户",
		target: "legacy.ops",
		description: "停用长期未登录的 legacy.ops 账号",
		submittedAt: "2024-05-13T10:20:00+08:00",
		submittedBy: "sysadmin",
		status: "待审批",
	},
	{
		id: "T-202405-005",
		module: "菜单管理",
		action: "调整菜单",
		target: "数据地图",
		description: "调整数据地图菜单顺序并更新展示名称",
		submittedAt: "2024-05-13T11:45:00+08:00",
		submittedBy: "sysadmin",
		status: "待审批",
	},
];

const completedTasks: CompletedTask[] = [
	{
		id: "T-202405-006",
		module: "角色管理",
		action: "调整角色权限",
		target: "DATA_ANALYST",
		description: "为数据分析师角色补充审批中心访问权限",
		submittedAt: "2024-05-10T09:10:00+08:00",
		submittedBy: "sysadmin",
		decidedAt: "2024-05-10T13:32:00+08:00",
		decidedBy: "authadmin",
		result: "已通过",
	},
	{
		id: "T-202405-007",
		module: "用户管理",
		action: "重置密码",
		target: "finance.owner",
		description: "为财务负责人重置登录密码",
		submittedAt: "2024-05-11T08:40:00+08:00",
		submittedBy: "sysadmin",
		decidedAt: "2024-05-11T09:05:00+08:00",
		decidedBy: "authadmin",
		result: "已通过",
	},
	{
		id: "T-202405-008",
		module: "菜单管理",
		action: "删除菜单",
		target: "旧版日志中心",
		description: "删除已停用的旧版日志中心菜单",
		submittedAt: "2024-05-09T16:20:00+08:00",
		submittedBy: "sysadmin",
		decidedAt: "2024-05-09T18:00:00+08:00",
		decidedBy: "authadmin",
		result: "已驳回",
	},
	{
		id: "T-202405-009",
		module: "菜单管理",
		action: "更新菜单",
		target: "自助取数",
		description: "更新自助取数菜单的路由信息",
		submittedAt: "2024-05-08T10:15:00+08:00",
		submittedBy: "sysadmin",
		decidedAt: "2024-05-08T12:45:00+08:00",
		decidedBy: "authadmin",
		result: "已通过",
	},
	{
		id: "T-202405-010",
		module: "用户管理",
		action: "调整角色",
		target: "dba.team",
		description: "为数据库团队批量绑定 SYSADMIN 角色",
		submittedAt: "2024-05-07T09:30:00+08:00",
		submittedBy: "sysadmin",
		decidedAt: "2024-05-07T11:05:00+08:00",
		decidedBy: "authadmin",
		result: "已通过",
	},
];

export default function ApprovalCenterView() {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="space-y-2">
					<CardTitle>待审批任务</CardTitle>
					<Text variant="body3" className="text-muted-foreground">
						展示 sysadmin 发起的最新变更，请根据业务影响及时处理。
					</Text>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full table-fixed text-sm">
						<thead className="bg-muted/60">
							<tr className="text-left">
								<th className="px-4 py-3 font-medium">操作编号</th>
								<th className="px-4 py-3 font-medium">所属模块</th>
								<th className="px-4 py-3 font-medium">操作内容</th>
								<th className="px-4 py-3 font-medium">影响对象</th>
								<th className="px-4 py-3 font-medium">提交信息</th>
								<th className="px-4 py-3 font-medium">当前状态</th>
							</tr>
						</thead>
						<tbody>
							{pendingTasks.map((task) => (
								<tr key={task.id} className="border-b last:border-b-0">
									<td className="px-4 py-3 font-medium">{task.id}</td>
									<td className="px-4 py-3">
										<div className="font-medium">{task.module}</div>
										<div className="text-xs text-muted-foreground">{task.action}</div>
									</td>
									<td className="px-4 py-3 text-sm">
										<div>{task.description}</div>
									</td>
									<td className="px-4 py-3">{task.target}</td>
									<td className="px-4 py-3 text-xs text-muted-foreground">
										<div>{formatDateTime(task.submittedAt)}</div>
										<div>提交人：{task.submittedBy}</div>
									</td>
									<td className="px-4 py-3">
										<Badge variant="outline">{task.status}</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-2">
					<CardTitle>已完成审批</CardTitle>
					<Text variant="body3" className="text-muted-foreground">
						历史审批结果会同步记录审批人、审批时间以及最终处理结论。
					</Text>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full table-fixed text-sm">
						<thead className="bg-muted/60">
							<tr className="text-left">
								<th className="px-4 py-3 font-medium">操作编号</th>
								<th className="px-4 py-3 font-medium">所属模块</th>
								<th className="px-4 py-3 font-medium">操作内容</th>
								<th className="px-4 py-3 font-medium">影响对象</th>
								<th className="px-4 py-3 font-medium">审批信息</th>
								<th className="px-4 py-3 font-medium">处理结果</th>
							</tr>
						</thead>
						<tbody>
							{completedTasks.map((task) => (
								<tr key={task.id} className="border-b last:border-b-0">
									<td className="px-4 py-3 font-medium">{task.id}</td>
									<td className="px-4 py-3">
										<div className="font-medium">{task.module}</div>
										<div className="text-xs text-muted-foreground">{task.action}</div>
									</td>
									<td className="px-4 py-3 text-sm">
										<div>{task.description}</div>
									</td>
									<td className="px-4 py-3">{task.target}</td>
									<td className="px-4 py-3 text-xs text-muted-foreground">
										<div>审批时间：{formatDateTime(task.decidedAt)}</div>
										<div>审批人：{task.decidedBy}</div>
										<div>提交时间：{formatDateTime(task.submittedAt)}</div>
									</td>
									<td className="px-4 py-3">
										<Badge variant={task.result === "已驳回" ? "destructive" : "secondary"}>{task.result}</Badge>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	);
}

function formatDateTime(value: string) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toLocaleString("zh-CN", { hour12: false });
}
