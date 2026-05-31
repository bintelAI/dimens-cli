import { z } from 'zod';
import type {
  PermissionMutationPayload,
  PermissionUpdatePayload,
  ResourcePermission,
  ResourcePermissionUpdatePayload,
  ResourceType,
} from '../../sdk/permission';
import { requireMcpProjectId } from '../context';
import {
  asArray,
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

const permissionActionValues = ['view', 'edit', 'delete', 'manage', 'schema'] as const;
const resourceTypeValues = ['sheet', 'document', 'report', 'page', 'micro_module'] as const;

function projectIdFrom(toolContext: McpToolFactoryContext, args: Record<string, unknown>) {
  const context = toolContext.getContext(args);
  return {
    context,
    projectId: requireMcpProjectId(context, { projectId: stringArg(args.projectId) }),
  };
}

function numericIdFrom(args: Record<string, unknown>, fieldName: string): number {
  const id = numberArg(args[fieldName], Number.NaN);
  if (!Number.isFinite(id)) {
    throw new Error(`缺少 ${fieldName}`);
  }
  return id;
}

function sheetIdFrom(args: Record<string, unknown>): string {
  const sheetId = stringArg(args.sheetId);
  if (!sheetId) {
    throw new Error('缺少 sheetId');
  }
  return sheetId;
}

function permissionPayloadFrom(args: Record<string, unknown>): PermissionMutationPayload {
  if (args.data !== undefined) {
    return asObject(args.data, 'data') as PermissionMutationPayload;
  }
  const payload: PermissionMutationPayload = {};
  const roleId = stringArg(args.roleId);
  if (roleId) payload.roleId = roleId;
  const sheetId = stringArg(args.sheetId);
  if (sheetId) payload.sheetId = sheetId;
  const dataAccess = stringArg(args.dataAccess);
  if (dataAccess) payload.dataAccess = dataAccess;
  if (typeof args.canRead === 'boolean') payload.canRead = args.canRead;
  if (typeof args.canWrite === 'boolean') payload.canWrite = args.canWrite;
  if (args.columnVisibility !== undefined) payload.columnVisibility = asObject(args.columnVisibility, 'columnVisibility') as Record<string, boolean>;
  if (args.columnReadonly !== undefined) payload.columnReadonly = asObject(args.columnReadonly, 'columnReadonly') as Record<string, boolean>;
  const resourceId = stringArg(args.resourceId);
  if (resourceId) payload.resourceId = resourceId;
  const resourceType = stringArg(args.resourceType);
  if (resourceType) payload.resourceType = resourceType as ResourceType;
  if (args.resourcePermission !== undefined) {
    payload.resourcePermission = resourcePermissionFrom(args.resourcePermission, 'resourcePermission');
  }
  if (Object.keys(payload).length === 0) {
    throw new Error('缺少权限数据，请传入 roleId/sheetId/canRead/canWrite 或 data');
  }
  return payload;
}

function resourcePermissionFrom(value: unknown, fieldName: string): ResourcePermission {
  const raw = asObject(value, fieldName);
  const permission: Partial<ResourcePermission> = {};
  if (typeof raw.visible === 'boolean') permission.visible = raw.visible;
  if (typeof raw.editable === 'boolean') permission.editable = raw.editable;
  if (permission.visible === undefined || permission.editable === undefined) {
    throw new Error(`${fieldName} 必须包含 visible 和 editable`);
  }
  return {
    visible: permission.visible,
    editable: permission.editable,
  };
}

function numericIdsFrom(args: Record<string, unknown>): number[] {
  return asArray(args.ids, 'ids')
    .map(item => Number(item))
    .filter(Number.isFinite);
}

export function createPermissionTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_permission_list',
      title: '获取权限列表',
      description: '获取当前项目权限列表，可按 sheetId 过滤。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).permission.list(projectId, stringArg(args.sheetId));
        return { message: '权限列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_permission_info',
      title: '获取权限详情',
      description: '获取指定权限配置详情。',
      inputSchema: {
        ...contextSchema,
        id: z.number(),
        sheetId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).permission.info(
          projectId,
          numericIdFrom(args, 'id'),
          sheetIdFrom(args)
        );
        return { message: '权限详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_permission_check',
      title: '检查用户权限',
      description: '检查指定用户对表的操作权限。',
      inputSchema: {
        ...contextSchema,
        userId: z.number(),
        sheetId: z.string(),
        action: z.enum(permissionActionValues),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const action = stringArg(args.action);
        if (!action) {
          throw new Error('缺少 action');
        }
        const result = await toolContext.createSDK(context).permission.check(projectId, {
          userId: numericIdFrom(args, 'userId'),
          sheetId: sheetIdFrom(args),
          action: action as 'view' | 'edit' | 'delete' | 'manage' | 'schema',
        });
        return { message: '权限检查成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_permission_create',
      title: '创建权限配置',
      description: '创建项目权限配置；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        roleId: z.string().optional(),
        sheetId: z.string().optional(),
        dataAccess: z.string().optional(),
        canRead: z.boolean().optional(),
        canWrite: z.boolean().optional(),
        columnVisibility: z.record(z.boolean()).optional(),
        columnReadonly: z.record(z.boolean()).optional(),
        resourceId: z.string().optional(),
        resourceType: z.enum(resourceTypeValues).optional(),
        resourcePermission: z.record(z.unknown()).optional(),
        data: z.record(z.unknown()).optional(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '创建权限配置');
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).permission.create(projectId, permissionPayloadFrom(args));
        return { message: '权限配置创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_permission_update',
      title: '更新权限配置',
      description: '更新项目权限配置；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        id: z.number(),
        sheetId: z.string(),
        data: z.record(z.unknown()),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '更新权限配置');
        const { context, projectId } = projectIdFrom(toolContext, args);
        const payload: PermissionUpdatePayload = {
          id: numericIdFrom(args, 'id'),
          sheetId: sheetIdFrom(args),
          data: asObject(args.data, 'data') as PermissionMutationPayload,
        };
        const result = await toolContext.createSDK(context).permission.update(projectId, payload);
        return { message: '权限配置更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_permission_delete',
      title: '删除权限配置',
      description: '删除一个或多个权限配置；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        ids: z.array(z.number()),
        sheetId: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '删除权限配置');
        const ids = numericIdsFrom(args);
        if (ids.length === 0) {
          throw new Error('缺少 ids');
        }
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).permission.delete(projectId, ids, sheetIdFrom(args));
        return { message: '权限配置删除成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_permission_batch',
      title: '批量设置权限',
      description: '批量写入指定表的权限配置；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        permissions: z.array(z.record(z.unknown())),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '批量设置权限');
        const permissions = asArray(args.permissions, 'permissions').map(item => asObject(item, 'permission') as PermissionMutationPayload);
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).permission.batch(projectId, sheetIdFrom(args), permissions);
        return { message: '权限批量设置成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_permission_update_resource',
      title: '更新资源权限',
      description: '更新角色对资源的可见/可编辑权限；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        roleId: z.string(),
        resourceId: z.string(),
        resourceType: z.enum(resourceTypeValues),
        permission: z.record(z.unknown()),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '更新资源权限');
        const roleId = stringArg(args.roleId);
        const resourceId = stringArg(args.resourceId);
        const resourceType = stringArg(args.resourceType);
        if (!roleId || !resourceId || !resourceType) {
          throw new Error('缺少 roleId、resourceId 或 resourceType');
        }
        const payload: ResourcePermissionUpdatePayload = {
          roleId,
          resourceId,
          resourceType: resourceType as ResourceType,
          permission: asObject(args.permission, 'permission') as ResourcePermissionUpdatePayload['permission'],
        };
        const { context, projectId } = projectIdFrom(toolContext, args);
        const result = await toolContext.createSDK(context).permission.updateResourcePermission(projectId, payload);
        return { message: '资源权限更新成功', data: result.data };
      },
    }),
  ];
}
