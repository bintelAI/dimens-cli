import { z } from 'zod';
import { requireMcpProjectId, requireMcpSheetId } from '../context';
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

export function createRowPolicyTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_row_policy_list',
      title: '获取行策略列表',
      description: '获取指定维表的行级数据策略列表。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).rowPolicy.list(projectId, sheetId);
        return { message: '行策略列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_policy_info',
      title: '获取行策略详情',
      description: '获取指定行策略的详细信息。',
      inputSchema: {
        ...contextSchema,
        id: z.string(),
        sheetId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const id = stringArg(args.id);
        if (!id) throw new Error('缺少 id');
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).rowPolicy.info(projectId, id, sheetId);
        return { message: '行策略详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_policy_create',
      title: '创建行策略',
      description: '创建行级数据策略；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string().optional(),
        roleId: z.string().optional(),
        name: z.string().optional(),
        effect: z.string().optional(),
        actions: z.array(z.string()).optional(),
        priority: z.number().optional(),
        conditions: z.array(z.record(z.unknown())).optional(),
        conditionMatchType: z.string().optional(),
        isActive: z.boolean().optional(),
        data: z.record(z.unknown()).optional(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '创建行策略');
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const payload: Record<string, unknown> = {};
        if (args.data !== undefined) {
          Object.assign(payload, asObject(args.data, 'data'));
        } else {
          const sheetId = stringArg(args.sheetId);
          if (sheetId) payload.sheetId = sheetId;
          const roleId = stringArg(args.roleId);
          if (roleId) payload.roleId = roleId;
          const name = stringArg(args.name);
          if (name) payload.name = name;
          const effect = stringArg(args.effect);
          if (effect) payload.effect = effect;
          if (Array.isArray(args.actions)) payload.actions = args.actions;
          const priority = numberArg(args.priority, Number.NaN);
          if (Number.isFinite(priority)) payload.priority = priority;
          if (Array.isArray(args.conditions)) payload.conditions = args.conditions;
          const conditionMatchType = stringArg(args.conditionMatchType);
          if (conditionMatchType) payload.conditionMatchType = conditionMatchType;
          if (typeof args.isActive === 'boolean') payload.isActive = args.isActive;
        }
        if (Object.keys(payload).length === 0) {
          throw new Error('缺少策略数据，请传入 sheetId/name/actions 或 data');
        }
        const result = await toolContext.createSDK(context).rowPolicy.create(projectId, payload);
        return { message: '行策略创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_policy_update',
      title: '更新行策略',
      description: '更新行级数据策略；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        id: z.string(),
        sheetId: z.string(),
        data: z.record(z.unknown()),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '更新行策略');
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const id = stringArg(args.id);
        if (!id) throw new Error('缺少 id');
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).rowPolicy.update(projectId, {
          id,
          sheetId,
          data: asObject(args.data, 'data'),
        });
        return { message: '行策略更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_policy_delete',
      title: '删除行策略',
      description: '删除一个或多个行级数据策略；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        ids: z.array(z.string()),
        sheetId: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '删除行策略');
        const ids = Array.isArray(args.ids)
          ? args.ids.filter((item): item is string => typeof item === 'string')
          : [];
        if (ids.length === 0) throw new Error('缺少 ids');
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).rowPolicy.delete(projectId, ids, sheetId);
        return { message: '行策略删除成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_policy_toggle',
      title: '切换行策略状态',
      description: '启用或停用行级数据策略；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        id: z.string(),
        sheetId: z.string(),
        isActive: z.boolean(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '切换行策略状态');
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const id = stringArg(args.id);
        if (!id) throw new Error('缺少 id');
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).rowPolicy.toggle(projectId, {
          id,
          sheetId,
          isActive: args.isActive === true,
        });
        return { message: '行策略状态切换成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_policy_check',
      title: '检查行数据权限',
      description: '根据策略检查指定行数据在特定操作下的权限结果。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowData: z.record(z.unknown()),
        action: z.string(),
        userId: z.number().optional(),
        deptId: z.number().optional(),
        deptIds: z.array(z.number()).optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const action = stringArg(args.action);
        if (!action) throw new Error('缺少 action');
        const contextPayload: { userId?: number; deptId?: number; deptIds?: number[] } = {};
        const userId = numberArg(args.userId, Number.NaN);
        if (Number.isFinite(userId)) contextPayload.userId = userId;
        const deptId = numberArg(args.deptId, Number.NaN);
        if (Number.isFinite(deptId)) contextPayload.deptId = deptId;
        if (Array.isArray(args.deptIds)) contextPayload.deptIds = args.deptIds.filter((item): item is number => typeof item === 'number');
        const result = await toolContext.createSDK(context).rowPolicy.check(projectId, {
          sheetId,
          rowData: asObject(args.rowData, 'rowData'),
          action,
          context: contextPayload,
        });
        return { message: '行数据权限检查成功', data: result.data };
      },
    }),
  ];
}