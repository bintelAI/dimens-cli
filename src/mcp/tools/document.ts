import { z } from 'zod';
import type { DocumentCreateWithSheetPayload, DocumentUpdatePayload } from '../../sdk/document';
import { contextSchema, createSimpleTool, numberArg, stringArg, writeAnnotations, readOnlyAnnotations } from './common';
import { requireMcpProjectId, requireMcpTeamId } from '../context';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

const documentFormatValues = ['richtext', 'markdown', 'html'] as const;

export function createDocumentTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_doc_create',
      title: '创建在线文档',
      description: '在当前项目中创建在线文档资源节点。',
      inputSchema: {
        ...contextSchema,
        title: z.string(),
        content: z.string().optional(),
        format: z.enum(documentFormatValues).optional(),
        parentId: z.string().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const title = stringArg(args.title);
        if (!title) {
          throw new Error('缺少 title，请传入文档标题');
        }
        const payload: DocumentCreateWithSheetPayload = { title };
        const content = stringArg(args.content);
        if (content) payload.content = content;
        const format = stringArg(args.format);
        if (format) payload.format = format as 'richtext' | 'markdown' | 'html';
        const parentId = stringArg(args.parentId);
        if (parentId) payload.parentId = parentId;
        const result = await toolContext.createSDK(context).document.createWithSheet(teamId, projectId, payload);
        return { message: '文档创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_doc_info',
      title: '获取在线文档详情',
      description: '通过 documentId 或 sheetId 获取在线文档详情。',
      inputSchema: {
        ...contextSchema,
        documentId: z.string().optional(),
        sheetId: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const documentId = stringArg(args.documentId);
        if (documentId) {
          const result = await toolContext.createSDK(context).document.info(teamId, projectId, documentId);
          return { message: '文档详情获取成功', data: result.data };
        }
        const sheetId = stringArg(args.sheetId);
        if (!sheetId) {
          throw new Error('缺少 documentId 或 sheetId');
        }
        const result = await toolContext.createSDK(context).document.getBySheetId(teamId, projectId, sheetId);
        return { message: '文档详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_doc_update',
      title: '更新在线文档',
      description: '按 version 更新在线文档内容。',
      inputSchema: {
        ...contextSchema,
        documentId: z.string(),
        content: z.string(),
        version: z.number(),
        createVersion: z.boolean().optional(),
        changeSummary: z.string().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const documentId = stringArg(args.documentId);
        const content = typeof args.content === 'string' ? args.content : undefined;
        if (!documentId || content === undefined) {
          throw new Error('缺少 documentId 或 content');
        }
        const version = numberArg(args.version, Number.NaN);
        if (!Number.isFinite(version)) {
          throw new Error('缺少 version，请先读取文档详情后传入 version');
        }
        const payload: DocumentUpdatePayload = { documentId, content, version };
        if (typeof args.createVersion === 'boolean') payload.createVersion = args.createVersion;
        const changeSummary = stringArg(args.changeSummary);
        if (changeSummary) payload.changeSummary = changeSummary;
        const result = await toolContext.createSDK(context).document.update(teamId, projectId, payload);
        return { message: '文档更新成功', data: result.data };
      },
    }),
  ];
}
