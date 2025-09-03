/**
 * Keycloak相关类型定义
 * 对应后端DTO对象的TypeScript类型
 */

/**
 * Keycloak用户信息
 */
export interface KeycloakUser {
	id?: string;
	username: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	enabled?: boolean;
	emailVerified?: boolean;
	attributes?: Record<string, string[]>;
	groups?: string[];
	realmRoles?: string[];
	clientRoles?: Record<string, string[]>;
	createdTimestamp?: number;
}

/**
 * Keycloak角色信息
 */
export interface KeycloakRole {
	id?: string;
	name: string;
	description?: string;
	composite?: boolean;
	clientRole?: boolean;
	containerId?: string;
	attributes?: Record<string, string>;
}

/**
 * Keycloak组信息
 */
export interface KeycloakGroup {
	id?: string;
	name: string;
	path?: string;
	attributes?: Record<string, string[]>;
	realmRoles?: string[];
	clientRoles?: Record<string, string[]>;
	subGroups?: KeycloakGroup[];
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
	username: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	enabled?: boolean;
	emailVerified?: boolean;
	attributes?: Record<string, string[]>;
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
	username?: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	enabled?: boolean;
	emailVerified?: boolean;
	attributes?: Record<string, string[]>;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
	password: string;
	temporary?: boolean;
}

/**
 * 设置用户启用状态请求
 */
export interface SetUserEnabledRequest {
	enabled: boolean;
}

/**
 * 创建角色请求
 */
export interface CreateRoleRequest {
	name: string;
	description?: string;
	composite?: boolean;
	clientRole?: boolean;
	attributes?: Record<string, string>;
}

/**
 * 更新角色请求
 */
export interface UpdateRoleRequest {
	name?: string;
	description?: string;
	composite?: boolean;
	clientRole?: boolean;
	attributes?: Record<string, string>;
}

/**
 * 创建组请求
 */
export interface CreateGroupRequest {
	name: string;
	path?: string;
	attributes?: Record<string, string[]>;
	realmRoles?: string[];
	clientRoles?: Record<string, string[]>;
}

/**
 * 更新组请求
 */
export interface UpdateGroupRequest {
	name?: string;
	path?: string;
	attributes?: Record<string, string[]>;
	realmRoles?: string[];
	clientRoles?: Record<string, string[]>;
}

/**
 * API响应通用格式
 */
export interface KeycloakApiResponse<T = any> {
	message?: string;
	error?: string;
	userId?: string;
	groupId?: string;
	data?: T;
}

/**
 * 用户查询参数
 */
export interface UserQueryParams {
	first?: number;
	max?: number;
	username?: string;
}

/**
 * 表格分页参数
 */
export interface PaginationParams {
	current: number;
	pageSize: number;
	total?: number;
}

/**
 * 用户表格行数据
 */
export interface UserTableRow extends KeycloakUser {
	key: string;
}

/**
 * 角色表格行数据
 */
export interface RoleTableRow extends KeycloakRole {
	key: string;
}

/**
 * 组表格行数据
 */
export interface GroupTableRow extends KeycloakGroup {
	key: string;
	memberCount?: number;
}
