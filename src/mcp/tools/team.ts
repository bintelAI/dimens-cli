import { z } from 'zod';
import { requireMcpTeamId } from '../context';
import { contextSchema, createSimpleTool, readOnlyAnnotations, stringArg } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createTeamTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_team_info',
      title: '获取团队详情',
      description: '获取指定团队的详情信息。',
      inputSchema: contextSchema,
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const result = await toolContext.createSDK(context).team.info(teamId);
        return { message: '团队详情获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_team_members',
      title: '获取团队成员列表',
      description: '获取指定团队下的成员列表，支持 keyword 搜索。',
      inputSchema: {
        ...contextSchema,
        projectId: z.string().optional(),
        keyword: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const teamId = requireMcpTeamId(context, { teamId: stringArg(args.teamId) });
        const query: { projectId?: string; keyword?: string } = {};
        const projectId = stringArg(args.projectId);
        if (projectId) query.projectId = projectId;
        const keyword = stringArg(args.keyword);
        if (keyword) query.keyword = keyword;
        const result = await toolContext.createSDK(context).team.members(teamId, query);
        return { message: '团队成员获取成功', data: result.data };
      },
    }),
  ];
}