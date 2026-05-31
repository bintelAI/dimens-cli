import { z } from 'zod';
import type { ColumnMutationPayload } from '../../sdk/column';
import { asObject, contextSchema, createSimpleTool, getTeamProjectSheet, readOnlyAnnotations, requireConfirm, stringArg, writeAnnotations } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createColumnTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_column_list',
      title: '获取字段列表',
      description: '获取指定维表字段列表。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, teamId, projectId, sheetId } = getTeamProjectSheet(toolContext, args);
        const result = await toolContext.createSDK(context).column.list(teamId, projectId, sheetId);
        return { message: '字段列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_column_create',
      title: '创建字段',
      description: '在指定维表中创建字段。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        label: z.string(),
        type: z.string().optional(),
        config: z.record(z.unknown()).optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const { context, teamId, projectId, sheetId } = getTeamProjectSheet(toolContext, args);
        const label = stringArg(args.label);
        if (!label) {
          throw new Error('缺少 label，请传入字段名称');
        }
        const payload: ColumnMutationPayload = { label };
        const type = stringArg(args.type);
        if (type) {
          payload.type = type;
        }
        if (args.config !== undefined) {
          payload.config = asObject(args.config, 'config');
        }
        const result = await toolContext.createSDK(context).column.create(teamId, projectId, sheetId, payload);
        return { message: '字段创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_column_update',
      title: '更新字段',
      description: '更新指定维表字段。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        fieldId: z.string(),
        label: z.string().optional(),
        type: z.string().optional(),
        config: z.record(z.unknown()).optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = stringArg(args.sheetId);
        const fieldId = stringArg(args.fieldId);
        if (!sheetId || !fieldId) {
          throw new Error('缺少 sheetId 或 fieldId');
        }
        const payload: ColumnMutationPayload = {};
        const label = stringArg(args.label);
        if (label) {
          payload.label = label;
        }
        const type = stringArg(args.type);
        if (type) {
          payload.type = type;
        }
        if (args.config !== undefined) {
          payload.config = asObject(args.config, 'config');
        }
        if (Object.keys(payload).length === 0) {
          throw new Error('缺少可更新字段，请传入 label、type 或 config');
        }
        const result = await toolContext.createSDK(context).column.update(sheetId, fieldId, payload);
        return { message: '字段更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_column_delete',
      title: '删除字段',
      description: '删除指定维表字段；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        fieldId: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '删除字段');
        const context = toolContext.getContext(args);
        const sheetId = stringArg(args.sheetId);
        const fieldId = stringArg(args.fieldId);
        if (!sheetId || !fieldId) {
          throw new Error('缺少 sheetId 或 fieldId');
        }
        const result = await toolContext.createSDK(context).column.delete(sheetId, fieldId);
        return { message: '字段删除成功', data: result.data };
      },
    }),
  ];
}
