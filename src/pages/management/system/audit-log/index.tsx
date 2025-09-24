import { Button, DatePicker, Form, Input, Modal, Select, Space, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import { Eye } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AuditLog } from "#/entity";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Text } from "@/ui/typography";
import { SAMPLE_AUDIT_LOGS } from "./mock-data";

const { RangePicker } = DatePicker;

type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

type AuditLogFilters = {
	dateRange?: DateRangeValue;
	module?: string;
	ip?: string;
};

const ACTION_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
	CREATE: { label: "创建", color: "green" },
	UPDATE: { label: "更新", color: "blue" },
	DELETE: { label: "删除", color: "red" },
	APPROVE: { label: "批准", color: "green" },
	REJECT: { label: "拒绝", color: "volcano" },
	EXPORT: { label: "导出", color: "purple" },
	LOGIN: { label: "登录", color: "cyan" },
	RESET_PASSWORD: { label: "重置密码", color: "orange" },
	ENABLE: { label: "启用", color: "lime" },
	DISABLE: { label: "停用", color: "magenta" },
};

const resolveActionMeta = (action: string) => {
	const meta = ACTION_TYPE_CONFIG[action.toUpperCase()];
	if (meta) {
		return meta;
	}
	return { label: action, color: "default" };
};

export default function AuditLogPage() {
	const [form] = Form.useForm<AuditLogFilters>();
	const [auditLogs] = useState<AuditLog[]>(() => SAMPLE_AUDIT_LOGS);
	const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(() => SAMPLE_AUDIT_LOGS);
	const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
	const [detailModalVisible, setDetailModalVisible] = useState(false);

	const moduleOptions = useMemo(
		() =>
			Array.from(new Set(auditLogs.map((log) => log.module))).map((module) => ({
				label: module,
				value: module,
			})),
		[auditLogs],
	);

	const applyFilters = useCallback(
		(values: AuditLogFilters) => {
			const { dateRange, module, ip } = values;
			let nextLogs = auditLogs;

			if (dateRange && Array.isArray(dateRange)) {
				const [start, end] = dateRange;
				if (start || end) {
					nextLogs = nextLogs.filter((log) => {
						const timestamp = dayjs(log.at);
						const afterStart = start ? timestamp.isSame(start, "second") || timestamp.isAfter(start) : true;
						const beforeEnd = end ? timestamp.isSame(end, "second") || timestamp.isBefore(end) : true;
						return afterStart && beforeEnd;
					});
				}
			}

			if (module) {
				nextLogs = nextLogs.filter((log) => log.module === module);
			}

			if (ip && ip.trim()) {
				const keyword = ip.trim();
				nextLogs = nextLogs.filter((log) => log.ip.includes(keyword));
			}

			setFilteredLogs(nextLogs);
		},
		[auditLogs],
	);

	useEffect(() => {
		applyFilters(form.getFieldsValue());
	}, [applyFilters, form]);

	const handleValuesChange = useCallback(
		(_: unknown, allValues: AuditLogFilters) => {
			applyFilters(allValues);
		},
		[applyFilters],
	);

	const handleSearch = useCallback(
		(values: AuditLogFilters) => {
			applyFilters(values);
		},
		[applyFilters],
	);

	const handleReset = useCallback(() => {
		form.resetFields();
		applyFilters({});
	}, [applyFilters, form]);

	const handleViewDetail = useCallback((record: AuditLog) => {
		setSelectedLog(record);
		setDetailModalVisible(true);
	}, []);

	const columns: ColumnsType<AuditLog> = [
		{
			title: "ID",
			dataIndex: "id",
			width: 80,
			render: (id: number) => (
				<Text variant="body2" className="font-mono">
					#{id}
				</Text>
			),
		},
		{
			title: "功能模块",
			dataIndex: "module",
			width: 160,
		},
		{
			title: "操作类型",
			dataIndex: "action",
			width: 120,
			render: (action: string) => {
				const meta = resolveActionMeta(action);
				return <Tag color={meta.color}>{meta.label}</Tag>;
			},
		},
		{
			title: "目标",
			dataIndex: "target",
			width: 180,
			ellipsis: true,
			render: (target: string) => (
				<Tooltip title={target}>
					<span>{target}</span>
				</Tooltip>
			),
		},
		{
			title: "操作人",
			dataIndex: "actor",
			width: 120,
		},
		{
			title: "IP地址",
			dataIndex: "ip",
			width: 140,
			render: (ip: string) => (
				<Text variant="body2" className="font-mono">
					{ip}
				</Text>
			),
		},
		{
			title: "内容",
			dataIndex: "details",
			ellipsis: true,
			render: (details: string) => (
				<Tooltip title={details}>
					<span>{details}</span>
				</Tooltip>
			),
		},
		{
			title: "创建时间",
			dataIndex: "at",
			width: 200,
			render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm:ss"),
			sorter: (a, b) => dayjs(a.at).valueOf() - dayjs(b.at).valueOf(),
			defaultSortOrder: "descend",
			sortDirections: ["descend", "ascend"],
		},
		{
			title: "操作",
			key: "action",
			width: 100,
			render: (_, record) => (
				<Button type="link" icon={<Eye className="h-4 w-4" />} onClick={() => handleViewDetail(record)}>
					查看详情
				</Button>
			),
		},
	];

	return (
		<div className="p-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold">日志审计</h2>
							<p className="text-muted-foreground">查看系统操作日志</p>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Form
						form={form}
						layout="inline"
						className="mb-4 flex flex-wrap gap-4"
						onValuesChange={handleValuesChange}
						onFinish={handleSearch}
					>
						<Form.Item label="起止时间" name="dateRange">
							<RangePicker
								allowClear
								showTime={{ format: "HH:mm" }}
								style={{ minWidth: 320 }}
								format="YYYY-MM-DD HH:mm"
								placeholder={["开始时间", "结束时间"]}
							/>
						</Form.Item>
						<Form.Item label="功能模块" name="module">
							<Select allowClear placeholder="请选择模块" options={moduleOptions} className="min-w-[160px]" />
						</Form.Item>
						<Form.Item label="IP地址" name="ip">
							<Input allowClear placeholder="请输入IP地址" style={{ width: 200 }} />
						</Form.Item>
						<Form.Item>
							<Space>
								<Button type="primary" htmlType="submit">
									查询
								</Button>
								<Button onClick={handleReset}>重置</Button>
							</Space>
						</Form.Item>
					</Form>
					<Table
						columns={columns}
						dataSource={filteredLogs}
						pagination={{
							defaultPageSize: 10,
							pageSizeOptions: ["10", "20", "50"],
							showSizeChanger: true,
							showQuickJumper: true,
							showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
						}}
						rowKey="id"
					/>
				</CardContent>
			</Card>

			<Modal
				title="审计日志详情"
				open={detailModalVisible}
				onCancel={() => {
					setDetailModalVisible(false);
					setSelectedLog(null);
				}}
				footer={null}
				width={800}
			>
				{selectedLog && (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Text variant="body2" className="text-muted-foreground">
									ID
								</Text>
								<Text variant="body1">#{selectedLog.id}</Text>
							</div>
							<div>
								<Text variant="body2" className="text-muted-foreground">
									操作类型
								</Text>
								{(() => {
									const meta = resolveActionMeta(selectedLog.action);
									return <Tag color={meta.color}>{meta.label}</Tag>;
								})()}
							</div>
							<div>
								<Text variant="body2" className="text-muted-foreground">
									功能模块
								</Text>
								<Text variant="body1">{selectedLog.module}</Text>
							</div>
							<div>
								<Text variant="body2" className="text-muted-foreground">
									操作人
								</Text>
								<Text variant="body1">{selectedLog.actor}</Text>
							</div>
							<div>
								<Text variant="body2" className="text-muted-foreground">
									目标
								</Text>
								<Text variant="body1">{selectedLog.target || "-"}</Text>
							</div>
							<div>
								<Text variant="body2" className="text-muted-foreground">
									IP地址
								</Text>
								<Text variant="body1" className="font-mono">
									{selectedLog.ip}
								</Text>
							</div>
							<div className="col-span-2">
								<Text variant="body2" className="text-muted-foreground">
									创建时间
								</Text>
								<Text variant="body1">{dayjs(selectedLog.at).format("YYYY-MM-DD HH:mm:ss")}</Text>
							</div>
							{selectedLog.result && (
								<div className="col-span-2">
									<Text variant="body2" className="text-muted-foreground">
										结果
									</Text>
									<Text variant="body1">{selectedLog.result}</Text>
								</div>
							)}
						</div>
						<div>
							<Text variant="body2" className="text-muted-foreground">
								内容详情
							</Text>
							<div className="mt-2 rounded-md bg-muted p-3">
								<Text variant="body1">{selectedLog.details}</Text>
							</div>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
