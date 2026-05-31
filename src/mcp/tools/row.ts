import { z } from 'zod';
import type { RowPagePayload } from '../../sdk/row';
import {
  asArray,
  asObject,
  contextSchema,
  createSimpleTool,
  getTeamProjectSheet,
  numberArg,
  readOnlyAnnotations,
  requireConfirm,
  stringArg,
  writeAnnotations,
} from './common';
import { requireMcpSheetId } from '../context';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

function rowIdArg(args: Record<string, unknown>): string {
  const rowId = stringArg(args.rowId);
  if (!rowId) {
    throw new Error('缺少 rowId，请传入 rowId');
  }
  return rowId;
}

export function createRowTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_row_page',
      title: '分页查询行数据',
      description: '分页查询指定维表的行数据，支持关键字、过滤和视图。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        page: z.number().optional(),
        size: z.number().optional(),
        viewId: z.string().optional(),
        keyword: z.string().optional(),
        filters: z.array(z.unknown()).optional(),
        filterMatchType: z.string().optional(),
        sortRule: z.unknown().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, teamId, projectId, sheetId } = getTeamProjectSheet(toolContext, args);
        const payload: RowPagePayload = {
          page: numberArg(args.page, 1),
          size: numberArg(args.size, 20),
        };
        const viewId = stringArg(args.viewId);
        if (viewId) payload.viewId = viewId;
        const keyword = stringArg(args.keyword);
        if (keyword) payload.keyword = keyword;
        if (Array.isArray(args.filters)) payload.filters = args.filters;
        const filterMatchType = stringArg(args.filterMatchType);
        if (filterMatchType) payload.filterMatchType = filterMatchType;
        if (args.sortRule !== undefined) payload.sortRule = args.sortRule;
        const result = await toolContext.createSDK(context).row.page(teamId, projectId, sheetId, payload);
        return { message: '行分页获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_info',
      title: '获取行详情',
      description: '获取指定行详情。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const { context, teamId, projectId, sheetId } = getTeamProjectSheet(toolContext, args);
        const result = await toolContext.createSDK(context).row.info(teamId, projectId, sheetId, rowIdArg(args));
        return { message: '行详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_create',
      title: '创建行',
      description: '在指定维表中创建单行数据。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        data: z.record(z.unknown()),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).row.create(sheetId, {
          data: asObject(args.data, 'data'),
        });
        return { message: '行创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_batch_create',
      title: '批量创建行',
      description: '在指定维表中批量创建行数据。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rows: z.array(z.unknown()),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const rows = asArray(args.rows, 'rows').map((row, index) => {
          const rowObject = asObject(row, `rows[${index}]`);
          return 'data' in rowObject ? { data: asObject(rowObject.data, `rows[${index}].data`) } : { data: rowObject };
        });
        const result = await toolContext.createSDK(context).row.batchCreate(sheetId, { rows });
        return { message: '批量创建行成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_update',
      title: '更新行',
      description: '按 version 乐观锁更新指定行。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
        data: z.record(z.unknown()),
        version: z.number().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const version = Number(args.version);
        if (!Number.isFinite(version)) {
          throw new Error('缺少 version，请先读取行详情后传入 version');
        }
        const result = await toolContext.createSDK(context).row.update(
          sheetId,
          rowIdArg(args),
          asObject(args.data, 'data'),
          version
        );
        return { message: '行更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_set_cell',
      title: '更新单元格',
      description: '更新指定行的指定字段值。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
        fieldId: z.string(),
        value: z.unknown(),
        version: z.number().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const fieldId = stringArg(args.fieldId);
        if (!fieldId) {
          throw new Error('缺少 fieldId，请传入 fieldId');
        }
        const result = await toolContext.createSDK(context).row.updateCell(sheetId, {
          rowId: rowIdArg(args),
          fieldId,
          value: args.value,
          ...(Number.isFinite(Number(args.version)) ? { version: Number(args.version) } : {}),
        });
        return { message: '单元格更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_delete',
      title: '删除行',
      description: '删除指定维表行；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '删除行');
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).row.delete(sheetId, rowIdArg(args));
        return { message: '行删除成功', data: result.data };
      },
    }),
  ];
}
