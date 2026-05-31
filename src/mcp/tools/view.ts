import { z } from 'zod';
import type { ViewMutationPayload } from '../../sdk/view';
import { asObject, contextSchema, createSimpleTool, getTeamProjectSheet, readOnlyAnnotations, stringArg, writeAnnotations } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createViewTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_view_list',
      title: '获取视图列表',
      description: '获取指定维表视图列表。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, teamId, projectId, sheetId } = getTeamProjectSheet(toolContext, args);
        const result = await toolContext.createSDK(context).view.list(teamId, projectId, sheetId);
        return { message: '视图列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_view_create',
      title: '创建视图',
      description: '为指定维表创建视图。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        name: z.string(),
        type: z.string().optional(),
        isPublic: z.boolean().optional(),
        config: z.record(z.unknown()).optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const { context, teamId, projectId, sheetId } = getTeamProjectSheet(toolContext, args);
        const name = stringArg(args.name);
        if (!name) {
          throw new Error('缺少 name，请传入视图名称');
        }
        const payload: ViewMutationPayload = { name };
        const type = stringArg(args.type);
        if (type) {
          payload.type = type;
        }
        if (typeof args.isPublic === 'boolean') {
          payload.isPublic = args.isPublic;
        }
        if (args.config !== undefined) {
          payload.config = asObject(args.config, 'config');
        }
        const result = await toolContext.createSDK(context).view.create(teamId, projectId, sheetId, payload);
        return { message: '视图创建成功', data: result.data };
      },
    }),
  ];
}
