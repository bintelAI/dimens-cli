import { z } from 'zod';
import type { ProjectDictCreatePayload, ProjectDictUpdatePayload } from '../../sdk/project-dict';
import { requireMcpProjectId, requireMcpTeamId } from '../context';
import {
  asArray,
  contextSchema,
  createSimpleTool,
  readOnlyAnnotations,
  requireConfirm,
  stringArg,
  writeAnnotations,
} from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createProjectDictTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  const optionsSchema = z.array(z.record(z.unknown()));
  return [
    createSimpleTool({
      name: 'dimens_project_dict_list',
      title: '获取项目字典列表',
      description: '获取项目内的数据字典列表，可按名称或编码筛选。',
      inputSchema: {
        ...contextSchema,
        keyword: z.string().optional(),
        status: z.number().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const params: { keyword?: string; status?: number } = {};
        const keyword = stringArg(args.keyword);
        if (keyword) params.keyword = keyword;
        if (typeof args.status === 'number') params.status = args.status;
        const result = await toolContext
          .createSDK(context)
          .projectDict.list(teamId, projectId, params);
        return { message: '项目字典列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_project_dict_info',
      title: '获取项目字典详情',
      description: '获取指定项目字典及其选项树。',
      inputSchema: { ...contextSchema, id: z.union([z.string(), z.number()]) },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        if (args.id === undefined || args.id === null || String(args.id).trim() === '')
          throw new Error('缺少字典 id');
        const result = await toolContext
          .createSDK(context)
          .projectDict.info(teamId, projectId, args.id as string | number);
        return { message: '项目字典详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_project_dict_create',
      title: '创建项目字典',
      description: '创建项目数据字典。code 和每个选项的 value 必须手工提供且符合小写编码规则。',
      inputSchema: {
        ...contextSchema,
        name: z.string().min(1),
        code: z.string().min(1),
        options: optionsSchema,
        description: z.string().optional(),
        status: z.number().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        const name = stringArg(args.name);
        const code = stringArg(args.code);
        if (!name || !code) throw new Error('name 和 code 不能为空');
        const payload: ProjectDictCreatePayload = {
          name,
          code,
          options: asArray(args.options, 'options') as ProjectDictCreatePayload['options'],
        };
        if (args.description !== undefined) payload.description = String(args.description);
        if (typeof args.status === 'number') payload.status = args.status;
        const result = await toolContext
          .createSDK(context)
          .projectDict.create(teamId, projectId, payload);
        return { message: '项目字典创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_project_dict_update',
      title: '更新项目字典',
      description: '更新项目字典名称、状态、描述或选项树；字典 code 创建后不可修改。',
      inputSchema: {
        ...contextSchema,
        id: z.union([z.string(), z.number()]),
        name: z.string().optional(),
        description: z.string().optional(),
        status: z.number().optional(),
        options: optionsSchema.optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        if (args.id === undefined || args.id === null || String(args.id).trim() === '')
          throw new Error('缺少字典 id');
        const payload: ProjectDictUpdatePayload = { id: args.id as string | number };
        const name = stringArg(args.name);
        if (name) payload.name = name;
        if (args.description !== undefined) payload.description = String(args.description);
        if (typeof args.status === 'number') payload.status = args.status;
        if (args.options !== undefined) {
          const options = asArray(args.options, 'options');
          payload.options = options as NonNullable<ProjectDictUpdatePayload['options']>;
        }
        if (Object.keys(payload).length === 1) throw new Error('缺少可更新字段');
        const result = await toolContext
          .createSDK(context)
          .projectDict.update(teamId, projectId, payload);
        return { message: '项目字典更新成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_project_dict_delete',
      title: '删除项目字典',
      description: '删除项目字典，必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        id: z.union([z.string(), z.number()]),
        confirm: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
      async run(args) {
        requireConfirm(args, '删除项目字典');
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = requireMcpProjectId(context, { projectId: stringArg(args.projectId) });
        if (args.id === undefined || args.id === null || String(args.id).trim() === '')
          throw new Error('缺少字典 id');
        const result = await toolContext
          .createSDK(context)
          .projectDict.delete(teamId, projectId, args.id as string | number);
        return { message: '项目字典删除成功', data: result.data };
      },
    }),
  ];
}
