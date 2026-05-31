import { z } from 'zod';
import type { RoleAssignUserPayload, RoleMutationPayload, RoleUpdatePayload } from '../../sdk/role';
import { requireMcpProjectId } from '../context';
import {
  asObject,
  contextSchema,
  createSimpleTool,
  numberArg,
  readOnlyAnnotations,
  requireConfirm,
  stringArg,
  writeAnnotations,
} from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

function projectIdFrom(toolContext: McpToolFactoryContext, args: Record<string, unknown>) {
  const context = toolContext.getContext(args);
  return {
    context,
    projectId: requireMcpProjectId(context, { projectId: stringArg(args.projectId) }),
  };
}

function roleIdFrom(args: Record<string, unknown>): string {
  const roleId = stringArg(args.roleId);
  if (!roleId) {
    throw new Error('缺少 roleId');
  }
  return roleId;
}

function userIdFrom(args: Record<string, unknown>): number {
  const userId = numberArg(args.userId, Number.NaN);
  if (!Number.isFinite(userId)) {
    throw new Error('缺少 userId');
  }
  return userId;
}

function rolePayloadFrom(args: Record<string, unknown>): RoleMutationPayload {
  if (args.data !== undefined) {
    return asObject(args.data, 'data') as RoleMutationPayload;
  }
  const payload: RoleMutationPayload = {};
  const name = stringArg(args.name);
  if (name) payload.name = name;
  const description = stringArg(args.description);
  if (description) payload.description = description;
  if (typeof args.isSystem === 'boolean') payload.isSystem = args.isSystem;
  if (typeof args.canManageSheets === 'boolean') payload.canManageSheets = args.canManageSheets;
  if (typeof args.canEditSchema === 'boolean') payload.canEditSchema = args.canEditSchema;
  if (typeof args.canEditData === 'boolean') payload.canEditData = args.canEditData;
  if (Object.keys(payload).length === 0) {
    throw new Error('缺少角色数据，请传入 name 或 data');
  }
  return payload;
}

function roleAssignPayloadFrom(args: Record<string, unknown>): RoleAssignUserPayload {
  const payload: RoleAssignUserPayload = {
    roleId: roleIdFrom(args),
    userId: userIdFrom(args),
  };
  const sheetId = stringArg(args.sheetId);
  if (sheetId) payload.sheetId = sheetId;
  return payload;
}

export function createRoleTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_role_list',
      title: '获取角色列表',
      description: '获取当前项目的角色列表。',
      inputSchema: contextSchema,
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.list(projectId);
        return { message: '角色列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_role_info',
      title: '获取角色详情',
      description: '获取指定角色详情。',
      inputSchema: {
        ...contextSchema,
        roleId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.info(projectId, roleIdFrom(args));
        return { message: '角色详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_role_users',
      title: '获取角色成员',
      description: '获取指定角色下的成员列表。',
      inputSchema: {
        ...contextSchema,
        roleId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.roleUsers(projectId, roleIdFrom(args));
        return { message: '角色成员获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_project_users',
      title: '获取项目成员',
      description: '获取当前项目成员列表。',
      inputSchema: contextSchema,
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.projectUsers(projectId);
        return { message: '项目成员获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_user_roles',
      title: '获取用户角色',
      description: '获取指定用户在项目或表内的角色信息。',
      inputSchema: {
        ...contextSchema,
        userId: z.number(),
        sheetId: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.userRoles(
          projectId,
          userIdFrom(args),
          stringArg(args.sheetId)
        );
        return { message: '用户角色获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_role_create',
      title: '创建角色',
      description: '创建项目角色；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        name: z.string().optional(),
        description: z.string().optional(),
        isSystem: z.boolean().optional(),
        canManageSheets: z.boolean().optional(),
        canEditSchema: z.boolean().optional(),
        canEditData: z.boolean().optional(),
        data: z.record(z.unknown()).optional(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '创建角色');
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.create(projectId, rolePayloadFrom(args));
        return { message: '角色创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_role_update',
      title: '更新角色',
      description: '更新项目角色；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        roleId: z.string(),
        data: z.record(z.unknown()),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '更新角色');
        const { context, projectId } = projectIdFrom(toolContext, args);
        const payload: RoleUpdatePayload = {
          roleId: roleIdFrom(args),
          data: asObject(args.data, 'data') as RoleMutationPayload,
        };
        const result = await toolContext.createSDK(context).role.update(projectId, payload);
        return { message: '角色更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_role_delete',
      title: '删除角色',
      description: '删除一个或多个项目角色；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        roleIds: z.array(z.string()),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '删除角色');
        const roleIds = Array.isArray(args.roleIds)
          ? args.roleIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          : [];
        if (roleIds.length === 0) {
          throw new Error('缺少 roleIds');
        }
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.delete(projectId, roleIds);
        return { message: '角色删除成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_role_assign_user',
      title: '分配用户角色',
      description: '给用户分配项目或表内角色；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        roleId: z.string(),
        userId: z.number(),
        sheetId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '分配用户角色');
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.assignUser(projectId, roleAssignPayloadFrom(args));
        return { message: '用户角色分配成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_role_remove_user',
      title: '移除用户角色',
      description: '移除用户项目或表内角色；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        roleId: z.string(),
        userId: z.number(),
        sheetId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '移除用户角色');
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).role.removeUser(projectId, roleAssignPayloadFrom(args));
        return { message: '用户角色移除成功', data: result.data };
      },
    }),
  ];
}
