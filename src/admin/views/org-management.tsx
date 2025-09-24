import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/admin/api/adminApi";
import type { OrganizationNode } from "@/admin/types";
import { ChangeRequestForm } from "@/admin/components/change-request-form";
import { useAdminLocale } from "@/admin/lib/locale";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { ScrollArea } from "@/ui/scroll-area";
import { Text } from "@/ui/typography";

export default function OrgManagementView() {
	const { data: tree = [], isLoading } = useQuery({
		queryKey: ["admin", "organizations"],
		queryFn: adminApi.getOrganizations,
	});
	const [search, setSearch] = useState("");
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const { translateSensitivity } = useAdminLocale();

	const flattened = useMemo(() => flattenTree(tree), [tree]);
	const filteredTree = useMemo(() => {
		if (!search.trim()) return tree;
		const keyword = search.trim().toLowerCase();
		return filterTree(tree, keyword);
	}, [search, tree]);

	const selected = useMemo(() => {
		if (!selectedId) return null;
		return flattened.find((item) => item.id === selectedId) ?? null;
	}, [flattened, selectedId]);

	const stats = useMemo(() => {
		const totalOrg = flattened.length;
		const totalMembers = flattened.reduce((sum, item) => sum + (item.memberCount || 0), 0);
		const sensitiveOrgs = flattened.filter((item) => item.sensitivity === "SECRET" || item.sensitivity === "TOP_SECRET").length;
		return { totalOrg, totalMembers, sensitiveOrgs };
	}, [flattened]);

	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,0.6fr)_minmax(0,1fr)]">
			<Card>
				<CardHeader className="space-y-3">
					<CardTitle>组织结构</CardTitle>
					<Input
						placeholder="搜索组织 / 负责人"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
					<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
						<span>组织数：{stats.totalOrg}</span>
						<span>成员总数：{stats.totalMembers}</span>
						<span>涉敏组织：{stats.sensitiveOrgs}</span>
					</div>
				</CardHeader>
				<CardContent className="h-[560px] p-0">
					{isLoading ? (
						<Text variant="body3" className="p-4">
							加载中...
						</Text>
					) : (
						<ScrollArea className="h-full">
							<div className="p-4">
								{filteredTree.length === 0 ? (
									<Text variant="body3">未找到匹配的组织。</Text>
								) : (
									<OrganizationTree tree={filteredTree} onSelect={setSelectedId} selectedId={selectedId} />
								)}
							</div>
						</ScrollArea>
					)}
				</CardContent>
			</Card>

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>组织详情</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						{selected ? (
							<>
								<Text variant="body2" className="font-semibold">
									{selected.name}
								</Text>
								<p className="text-muted-foreground">编码：{selected.code}</p>
								<p className="text-muted-foreground">负责人：{selected.leader || "--"}</p>
								<p className="text-muted-foreground">成员数量：{selected.memberCount ?? 0}</p>
								<p className="text-muted-foreground">数据权限范围：{selected.securityDomains?.join("、") || "--"}</p>
								<div className="flex flex-wrap gap-2">
									<Badge variant="outline">层级：{selected.level ?? "--"}</Badge>
								<Badge variant={selected.sensitivity === "TOP_SECRET" ? "destructive" : "secondary"}>
									敏感度：{translateSensitivity(selected.sensitivity, selected.sensitivity || "NORMAL")}
								</Badge>
								</div>
								{selected.description ? <p className="text-muted-foreground">{selected.description}</p> : null}
							</>
						) : (
							<Text variant="body3" className="text-muted-foreground">
								请选择左侧组织查看详情。
							</Text>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>发起组织变更</CardTitle>
					</CardHeader>
					<CardContent>
						<ChangeRequestForm initialTab="org" />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function flattenTree(tree: OrganizationNode[], level = 1, parentPath: string[] = []): (OrganizationNode & { level: number; path: string[] })[] {
	const result: (OrganizationNode & { level: number; path: string[] })[] = [];
	for (const node of tree) {
		const path = [...parentPath, node.name];
		result.push({ ...node, level, path });
		if (node.children?.length) {
			result.push(...flattenTree(node.children, level + 1, path));
		}
	}
	return result;
}

function filterTree(tree: OrganizationNode[], keyword: string): OrganizationNode[] {
	const matchNode = (node: OrganizationNode): OrganizationNode | null => {
		const hit =
			node.name.toLowerCase().includes(keyword) ||
			node.code?.toLowerCase().includes(keyword) ||
			node.leader?.toLowerCase().includes(keyword);
		const children = node.children?.map(matchNode).filter((item): item is OrganizationNode => Boolean(item)) ?? [];
		if (hit || children.length > 0) {
			return { ...node, children };
		}
		return null;
	};
	return tree
		.map(matchNode)
		.filter((item): item is OrganizationNode => Boolean(item));
}

interface TreeProps {
	tree: OrganizationNode[];
	onSelect: (id: number) => void;
	selectedId: number | null;
	depth?: number;
}

function OrganizationTree({ tree, onSelect, selectedId, depth = 0 }: TreeProps) {
	return (
		<ul className="space-y-1">
			{tree.map((node) => {
				const isActive = selectedId === node.id;
				return (
					<li key={node.id}>
						<button
							type="button"
							onClick={() => onSelect(node.id)}
							className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm transition ${
								isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
							}`}
							style={{ paddingLeft: depth * 16 + 8 }}
						>
							<span className="flex-1">{node.name}</span>
							<span className="text-xs text-muted-foreground">
								{node.memberCount ?? 0}
							</span>
						</button>
						{node.children?.length ? (
							<div className="ml-2 border-l border-border pl-2">
								<OrganizationTree tree={node.children} onSelect={onSelect} selectedId={selectedId} depth={depth + 1} />
							</div>
						) : null}
					</li>
				);
			})}
		</ul>
	);
}
