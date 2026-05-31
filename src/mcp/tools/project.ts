import { z } from 'zod';
import { requireMcpTeamId } from '../context';
import { contextSchema, createSimpleTool, numberArg, readOnlyAnnotations, stringArg } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createProjectTools(
  toolContext: McpToolFactoryContext
): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_project_list',
      title: '获取项目列表',
      description: '按当前团队分页获取维表项目列表。',
      inputSchema: {
        ...contextSchema,
        page: z.number().optional(),
        size: z.number().optional(),
        keyword: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const payload: { page: number; size: number; keyword?: string } = {
          page: numberArg(args.page, 1),
          size: numberArg(args.size, 20),
        };
        const keyword = stringArg(args.keyword);
        if (keyword) {
          payload.keyword = keyword;
        }
        const result = await toolContext.createSDK(context).project.page(teamId, payload);
        return { message: '项目列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_project_info',
      title: '获取项目详情',
      description: '获取指定项目详情。',
      inputSchema: {
        ...contextSchema,
        id: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const projectId = stringArg(args.id) ?? stringArg(args.projectId) ?? context.projectId;
        if (!projectId) {
          throw new Error('缺少 projectId，请传入 projectId 或 id');
        }
        const result = await toolContext.createSDK(context).project.info(teamId, projectId);
        return { message: '项目详情获取成功', data: result.data };
      },
    }),
  ];
}
