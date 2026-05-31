import { z } from 'zod';
import { requireMcpProjectId, requireMcpSheetId, requireMcpTeamId } from '../context';
import type { CanvasGraphValue } from '../../sdk/canvas';
import {
  contextSchema,
  createSimpleTool,
  numberArg,
  readOnlyAnnotations,
  requireConfirm,
  stringArg,
  writeAnnotations,
} from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createCanvasTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_canvas_create',
      title: '创建画布',
      description: '在当前项目中创建画布资源节点。',
      inputSchema: {
        ...contextSchema,
        name: z.string(),
        folderId: z.string().optional(),
        data: z.unknown().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const name = stringArg(args.name);
        if (!name) throw new Error('缺少 name，请传入画布名称');
        const payload: { name: string; folderId?: string; data?: CanvasGraphValue } = { name };
        const folderId = stringArg(args.folderId);
        if (folderId) payload.folderId = folderId;
        if (args.data !== undefined) payload.data = args.data as CanvasGraphValue;
        const result = await toolContext.createSDK(context).canvas.create(projectId, payload);
        return { message: '画布创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_info',
      title: '获取画布详情',
      description: '获取指定画布详情。',
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
        const result = await toolContext.createSDK(context).canvas.info(teamId, projectId, sheetId);
        return { message: '画布详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_save',
      title: '保存画布',
      description: '保存画布数据，需提供 baseVersion 做乐观锁。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        data: z.unknown(),
        baseVersion: z.number(),
        changeSummary: z.string().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const baseVersion = numberArg(args.baseVersion, Number.NaN);
        if (!Number.isFinite(baseVersion)) throw new Error('缺少 baseVersion');
        const data = (args.data !== undefined ? args.data : {}) as CanvasGraphValue;
        const payload: { sheetId: string; data: CanvasGraphValue; baseVersion: number; changeSummary?: string } = {
          sheetId,
          data,
          baseVersion,
        };
        const changeSummary = stringArg(args.changeSummary);
        if (changeSummary) payload.changeSummary = changeSummary;
        const result = await toolContext.createSDK(context).canvas.save(teamId, projectId, payload);
        return { message: '画布保存成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_versions',
      title: '获取画布版本列表',
      description: '获取指定画布的版本历史列表。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        page: z.number().optional(),
        size: z.number().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const result = await toolContext.createSDK(context).canvas.versions(teamId, projectId, {
          sheetId,
          page: numberArg(args.page, 1),
          size: numberArg(args.size, 20),
        });
        return { message: '画布版本列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_version',
      title: '获取画布版本详情',
      description: '获取指定画布版本的详细数据。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        version: z.number(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const version = numberArg(args.version, Number.NaN);
        if (!Number.isFinite(version)) throw new Error('缺少 version');
        const result = await toolContext.createSDK(context).canvas.version(teamId, projectId, sheetId, version);
        return { message: '画布版本详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_restore',
      title: '恢复画布版本',
      description: '将画布恢复到指定版本；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        version: z.number(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '恢复画布版本');
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const version = numberArg(args.version, Number.NaN);
        if (!Number.isFinite(version)) throw new Error('缺少 version');
        const result = await toolContext.createSDK(context).canvas.restore(teamId, projectId, {
          sheetId,
          version,
        });
        return { message: '画布版本恢复成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_resource_list_mine',
      title: '获取我的画布资源',
      description: '获取当前用户自己创建的画布资源列表。',
      inputSchema: {
        ...contextSchema,
        keyword: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const result = await toolContext.createSDK(context).canvas.listMineResources(
          teamId,
          stringArg(args.keyword)
        );
        return { message: '我的画布资源获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_resource_save',
      title: '保存画布资源',
      description: '保存或更新画布资源到个人库；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        name: z.string(),
        projectId: z.string().optional(),
        sheetId: z.string().optional(),
        description: z.string().optional(),
        nodes: z.array(z.unknown()).optional(),
        edges: z.array(z.unknown()).optional(),
        tags: z.array(z.string()).optional(),
        cover: z.string().optional(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '保存画布资源');
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const name = stringArg(args.name);
        if (!name) throw new Error('缺少 name');
        const payload: Record<string, unknown> = { name };
        const projectId = stringArg(args.projectId);
        if (projectId) payload.projectId = projectId;
        const sheetId = stringArg(args.sheetId);
        if (sheetId) payload.sheetId = sheetId;
        const description = stringArg(args.description);
        if (description) payload.description = description;
        if (Array.isArray(args.nodes)) payload.nodes = args.nodes;
        if (Array.isArray(args.edges)) payload.edges = args.edges;
        if (Array.isArray(args.tags)) payload.tags = args.tags;
        const cover = stringArg(args.cover);
        if (cover) payload.cover = cover;
        const result = await toolContext.createSDK(context).canvas.saveMineResource(teamId, payload as any);
        return { message: '画布资源保存成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_resource_delete',
      title: '删除画布资源',
      description: '从个人库中删除画布资源；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        id: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '删除画布资源');
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const id = stringArg(args.id);
        if (!id) throw new Error('缺少 id');
        const result = await toolContext.createSDK(context).canvas.removeMineResource(teamId, id);
        return { message: '画布资源删除成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_resource_publish',
      title: '发布画布资源到市场',
      description: '将画布资源发布到团队市场；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        id: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '发布画布资源');
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const id = stringArg(args.id);
        if (!id) throw new Error('缺少 id');
        const result = await toolContext.createSDK(context).canvas.publishMineResource(teamId, id);
        return { message: '画布资源发布成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_canvas_resource_list_market',
      title: '获取市场画布资源',
      description: '获取团队市场的画布资源列表。',
      inputSchema: {
        ...contextSchema,
        keyword: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const result = await toolContext.createSDK(context).canvas.listMarketResources(
          teamId,
          stringArg(args.keyword)
        );
        return { message: '市场画布资源获取成功', data: result.data };
      },
    }),
  ];
}