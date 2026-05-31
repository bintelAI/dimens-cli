import { z } from 'zod';
import type { SheetMutationPayload } from '../../sdk/sheet';
import { requireMcpProjectId, requireMcpSheetId, requireMcpTeamId } from '../context';
import { contextSchema, createSimpleTool, readOnlyAnnotations, requireConfirm, stringArg, writeAnnotations } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

const sheetTypeValues = ['sheet', 'folder', 'document', 'report', 'canvas'] as const;

export function createSheetTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_sheet_list',
      title: '获取项目资源列表',
      description: '获取项目下的表格、目录、文档、报表等资源列表。',
      inputSchema: contextSchema,
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const result = await toolContext.createSDK(context).sheet.list(projectId);
        return { message: '资源列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_sheet_tree',
      title: '获取项目资源树',
      description: '获取项目左侧菜单资源树。',
      inputSchema: contextSchema,
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const result = await toolContext.createSDK(context).sheet.tree(projectId);
        return { message: '资源树获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_sheet_info',
      title: '获取资源详情',
      description: '获取表格、目录、文档、报表等资源节点详情。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).sheet.info(teamId, projectId, sheetId);
        return { message: '资源详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_sheet_structure',
      title: '获取表结构',
      description: '获取指定维表的字段、视图和结构信息。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).sheet.structure(sheetId);
        return { message: '表结构获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_sheet_create',
      title: '创建项目资源',
      description: '创建表格、目录、文档、报表或画布资源节点。',
      inputSchema: {
        ...contextSchema,
        name: z.string(),
        type: z.enum(sheetTypeValues).optional(),
        folderId: z.string().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const name = stringArg(args.name);
        if (!name) {
          throw new Error('缺少 name，请传入资源名称');
        }
        const payload: SheetMutationPayload = { name };
        const type = stringArg(args.type);
        if (type) {
          payload.type = type as 'sheet' | 'folder' | 'document' | 'report' | 'canvas';
        }
        const folderId = stringArg(args.folderId);
        if (folderId) {
          payload.folderId = folderId;
        }
        const result = await toolContext.createSDK(context).sheet.create(projectId, payload);
        return { message: '资源创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_sheet_update',
      title: '更新项目资源',
      description: '更新表格、目录、文档、报表或画布资源节点。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        name: z.string().optional(),
        folderId: z.string().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const payload: SheetMutationPayload = {};
        const name = stringArg(args.name);
        if (name) {
          payload.name = name;
        }
        const folderId = stringArg(args.folderId);
        if (folderId) {
          payload.parentId = folderId;
        }
        if (Object.keys(payload).length === 0) {
          throw new Error('缺少可更新字段，请传入 name 或 folderId');
        }
        const result = await toolContext.createSDK(context).sheet.update(teamId, projectId, sheetId, payload);
        return { message: '资源更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_sheet_delete',
      title: '删除项目资源',
      description: '删除表格、目录、文档、报表或画布资源节点；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '删除资源');
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).sheet.delete(teamId, projectId, sheetId);
        return { message: '资源删除成功', data: result.data };
      },
    }),
  ];
}
