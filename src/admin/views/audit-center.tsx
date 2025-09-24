import { useMemo, useState } from "react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Text } from "@/ui/typography";

interface AuditLogEntry {
	id: string;
	timestamp: string;
	module: string;
	action: string;
	operator: string;
	ip: string;
	result: "成功" | "失败";
	detail: string;
}

interface FilterState {
	from?: string;
	to?: string;
	module?: string;
	ip?: string;
}

const auditLogSamples: AuditLogEntry[] = [
	{
		id: "L-202405-001",
		timestamp: "2024-05-12T09:05:00+08:00",
		module: "用户管理",
		action: "创建用户 dataops",
		operator: "sysadmin",
		ip: "10.10.8.12",
		result: "成功",
		detail: "为数据平台组创建 dataops 账号",
	},
	{
		id: "L-202405-002",
		timestamp: "2024-05-12T09:08:00+08:00",
		module: "用户管理",
		action: "绑定角色 dataops → SYSADMIN",
		operator: "sysadmin",
		ip: "10.10.8.12",
		result: "成功",
		detail: "绑定系统管理员角色以便提交审批",
	},
	{
		id: "L-202405-003",
		timestamp: "2024-05-13T10:20:00+08:00",
		module: "用户管理",
		action: "停用用户 legacy.ops",
		operator: "sysadmin",
		ip: "10.10.8.13",
		result: "成功",
		detail: "停用长期未登录的运维账号",
	},
	{
		id: "L-202405-004",
		timestamp: "2024-05-11T08:55:00+08:00",
		module: "用户管理",
		action: "重置密码 finance.owner",
		operator: "sysadmin",
		ip: "10.10.8.11",
		result: "成功",
		detail: "为财务负责人重置登录密码",
	},
	{
		id: "L-202405-005",
		timestamp: "2024-05-12T10:15:00+08:00",
		module: "角色管理",
		action: "创建角色 DATA_STEWARD",
		operator: "sysadmin",
		ip: "10.10.8.11",
		result: "成功",
		detail: "新增数据管家角色并设置审批流程",
	},
	{
		id: "L-202405-006",
		timestamp: "2024-05-12T10:28:00+08:00",
		module: "角色管理",
		action: "更新权限 DATA_ANALYST",
		operator: "sysadmin",
		ip: "10.10.8.11",
		result: "成功",
		detail: "为数据分析师角色补充审批中心访问",
	},
	{
		id: "L-202405-007",
		timestamp: "2024-05-11T17:40:00+08:00",
		module: "角色管理",
		action: "删除角色 LEGACY_ADMIN",
		operator: "sysadmin",
		ip: "10.10.8.14",
		result: "失败",
		detail: "删除失败：缺少业务审批人确认",
	},
	{
		id: "L-202405-008",
		timestamp: "2024-05-11T18:05:00+08:00",
		module: "角色管理",
		action: "提交审批 角色权限调整",
		operator: "sysadmin",
		ip: "10.10.8.14",
		result: "成功",
		detail: "提交调整 DATA_ANALYST 权限的审批任务",
	},
	{
		id: "L-202405-009",
		timestamp: "2024-05-12T11:10:00+08:00",
		module: "菜单管理",
		action: "新增菜单 资产巡检",
		operator: "sysadmin",
		ip: "10.10.8.10",
		result: "成功",
		detail: "新增门户端资产巡检入口",
	},
	{
		id: "L-202405-010",
		timestamp: "2024-05-13T11:45:00+08:00",
		module: "菜单管理",
		action: "调整菜单顺序 数据地图",
		operator: "sysadmin",
		ip: "10.10.8.10",
		result: "成功",
		detail: "上移数据地图菜单以提升曝光",
	},
	{
		id: "L-202405-011",
		timestamp: "2024-05-09T16:40:00+08:00",
		module: "菜单管理",
		action: "删除菜单 旧版日志中心",
		operator: "sysadmin",
		ip: "10.10.8.15",
		result: "失败",
		detail: "审批被驳回：仍有历史系统依赖",
	},
	{
		id: "L-202405-012",
		timestamp: "2024-05-09T19:00:00+08:00",
		module: "菜单管理",
		action: "同步审批结果 旧版日志中心",
		operator: "authadmin",
		ip: "10.10.9.8",
		result: "成功",
		detail: "记录审批驳回原因并通知 sysadmin",
	},
	{
		id: "L-202405-013",
		timestamp: "2024-05-10T13:35:00+08:00",
		module: "任务审批",
		action: "审批通过 角色权限调整",
		operator: "authadmin",
		ip: "10.10.9.8",
		result: "成功",
		detail: "审批通过 DATA_ANALYST 权限调整任务",
	},
	{
		id: "L-202405-014",
		timestamp: "2024-05-10T13:50:00+08:00",
		module: "任务审批",
		action: "驳回 菜单删除任务",
		operator: "authadmin",
		ip: "10.10.9.8",
		result: "成功",
		detail: "驳回删除旧版日志中心菜单的申请",
	},
	{
		id: "L-202405-015",
		timestamp: "2024-05-13T09:10:00+08:00",
		module: "任务审批",
		action: "领取任务 菜单调整",
		operator: "authadmin",
		ip: "10.10.9.9",
		result: "成功",
		detail: "领取 sysadmin 提交的菜单调整审批",
	},
	{
		id: "L-202405-016",
		timestamp: "2024-05-13T09:45:00+08:00",
		module: "任务审批",
		action: "审批通过 菜单调整",
		operator: "authadmin",
		ip: "10.10.9.9",
		result: "成功",
		detail: "同意调整数据地图菜单显示顺序",
	},
	{
		id: "L-202405-017",
		timestamp: "2024-05-08T21:05:00+08:00",
		module: "系统运维",
		action: "更新配置 airflow.deployment",
		operator: "sysadmin",
		ip: "10.10.8.20",
		result: "成功",
		detail: "更新调度集群版本号至 v2.9.0",
	},
	{
		id: "L-202405-018",
		timestamp: "2024-05-08T21:15:00+08:00",
		module: "系统运维",
		action: "导出审计日志",
		operator: "auditadmin",
		ip: "10.10.7.6",
		result: "成功",
		detail: "导出最近 7 天的审计日志数据",
	},
	{
		id: "L-202405-019",
		timestamp: "2024-05-07T08:30:00+08:00",
		module: "系统运维",
		action: "执行集群巡检",
		operator: "auditadmin",
		ip: "10.10.7.6",
		result: "成功",
		detail: "完成数据平台晨检并生成报告",
	},
	{
		id: "L-202405-020",
		timestamp: "2024-05-07T09:05:00+08:00",
		module: "系统运维",
		action: "登录失败 auditadmin",
		operator: "auditadmin",
		ip: "10.10.7.6",
		result: "失败",
		detail: "口令输入错误连续三次触发告警",
	},
];

export default function AuditCenterView() {
	const [filters, setFilters] = useState<FilterState>({});

	const moduleOptions = useMemo(() => {
		return Array.from(new Set(auditLogSamples.map((item) => item.module)));
	}, []);

	const filteredLogs = useMemo(() => {
		const fromTime = filters.from ? new Date(filters.from).getTime() : NaN;
		const toTime = filters.to ? new Date(filters.to).getTime() : NaN;
		const hasFrom = !Number.isNaN(fromTime);
		const hasTo = !Number.isNaN(toTime);
		const moduleFilter = filters.module?.trim();
		const ipFilter = filters.ip?.trim();

		return auditLogSamples.filter((item) => {
			const timestamp = new Date(item.timestamp).getTime();
			if (hasFrom && timestamp < fromTime) {
				return false;
			}
			if (hasTo && timestamp > toTime) {
				return false;
			}
			if (moduleFilter && item.module !== moduleFilter) {
				return false;
			}
			if (ipFilter && !item.ip.includes(ipFilter)) {
				return false;
			}
			return true;
		});
	}, [filters]);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="space-y-2">
					<CardTitle>查询条件</CardTitle>
					<Text variant="body3" className="text-muted-foreground">
						支持按时间范围、功能模块及访问 IP 快速筛选审计记录。
					</Text>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<div className="space-y-2">
							<Text variant="body3" className="text-muted-foreground">
								起始时间
							</Text>
							<Input
								type="datetime-local"
								value={filters.from ?? ""}
								onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value || undefined }))}
							/>
						</div>
						<div className="space-y-2">
							<Text variant="body3" className="text-muted-foreground">
								终止时间
							</Text>
							<Input
								type="datetime-local"
								value={filters.to ?? ""}
								onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value || undefined }))}
							/>
						</div>
						<div className="space-y-2">
							<Text variant="body3" className="text-muted-foreground">
								功能模块
							</Text>
							<select
								className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
								value={filters.module ?? ""}
								onChange={(event) =>
									setFilters((prev) => ({
										...prev,
										module: event.target.value || undefined,
									}))
								}
							>
								<option value="">全部模块</option>
								{moduleOptions.map((option) => (
									<option key={option} value={option}>
										{option}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-2">
							<Text variant="body3" className="text-muted-foreground">
								IP 地址
							</Text>
							<Input
								placeholder="例如 10.10."
								value={filters.ip ?? ""}
								onChange={(event) => setFilters((prev) => ({ ...prev, ip: event.target.value || undefined }))}
							/>
						</div>
					</div>
					<div className="flex flex-wrap gap-3">
						<Button type="button" variant="outline" onClick={() => setFilters({})}>
							重置条件
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="space-y-2">
					<CardTitle>日志记录</CardTitle>
					<Text variant="body3" className="text-muted-foreground">
						当前展示 {filteredLogs.length} / {auditLogSamples.length} 条记录。
					</Text>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="min-w-full table-fixed text-sm">
						<thead className="bg-muted/60">
							<tr className="text-left">
								<th className="px-4 py-3 font-medium">日志编号</th>
								<th className="px-4 py-3 font-medium">操作时间</th>
								<th className="px-4 py-3 font-medium">功能模块</th>
								<th className="px-4 py-3 font-medium">操作详情</th>
								<th className="px-4 py-3 font-medium">操作者 / IP</th>
								<th className="px-4 py-3 font-medium">结果</th>
							</tr>
						</thead>
						<tbody>
							{filteredLogs.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
										暂无符合条件的日志记录。
									</td>
								</tr>
							) : (
								filteredLogs.map((log) => (
									<tr key={log.id} className="border-b align-top last:border-b-0">
										<td className="px-4 py-3 font-medium">{log.id}</td>
										<td className="px-4 py-3 text-sm">
											<div>{formatDateTime(log.timestamp)}</div>
										</td>
										<td className="px-4 py-3">{log.module}</td>
										<td className="px-4 py-3 text-sm">
											<div className="font-medium">{log.action}</div>
											<div className="text-xs text-muted-foreground">{log.detail}</div>
										</td>
										<td className="px-4 py-3 text-xs text-muted-foreground">
											<div>操作者：{log.operator}</div>
											<div>IP：{log.ip}</div>
										</td>
										<td className="px-4 py-3">
											<Badge variant={log.result === "失败" ? "destructive" : "secondary"}>{log.result}</Badge>
										</td>
									</tr>
								))
							)}
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
