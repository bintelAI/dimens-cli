import { z } from 'zod';
import { createSimpleTool } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createAuthTools(
  toolContext: McpToolFactoryContext
): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_auth_setup',
      title: '配置 Dimens MCP 认证信息',
      description:
        '用于设置或更新当前会话的 Dimens 认证信息（token、teamId、projectId 等）。当 AI 需要操作维表但未检测到有效认证信息时，应询问用户提供这些信息，然后调用本工具进行配置。配置后的信息在当前 MCP 会话中持久有效，后续工具调用无需再重复传入。',
      inputSchema: {
        token: z.string().optional().describe('维表 API token（通过 dimens-cli auth 或后台获取）'),
        teamId: z.string().optional().describe('团队 ID'),
        projectId: z.string().optional().describe('项目 ID'),
        baseUrl: z.string().url().optional().describe('API 地址，默认 https://dimens.bintelai.com/api'),
        appUrl: z.string().url().optional().describe('维表前端地址'),
        refreshToken: z.string().optional().describe('刷新 token（可选）'),
      },
      annotations: {
        readOnlyHint: false,
      },
      async run(args) {
        const token = typeof args.token === 'string' && args.token.trim() ? args.token.trim() : undefined;
        const teamId = typeof args.teamId === 'string' && args.teamId.trim() ? args.teamId.trim() : undefined;
        const projectId = typeof args.projectId === 'string' && args.projectId.trim() ? args.projectId.trim() : undefined;
        const baseUrl = typeof args.baseUrl === 'string' && args.baseUrl.trim() ? args.baseUrl.trim() : undefined;
        const appUrl = typeof args.appUrl === 'string' && args.appUrl.trim() ? args.appUrl.trim() : undefined;
        const refreshToken = typeof args.refreshToken === 'string' && args.refreshToken.trim() ? args.refreshToken.trim() : undefined;

        if (!token && !teamId && !projectId) {
          throw new Error(
            '请至少提供 token、teamId、projectId 中的一项。用户如果没有这些信息，请引导用户通过 dimens-cli auth 命令登录，或从维表后台获取。'
          );
        }

        const sessionArgs: Record<string, string | undefined> = {};
        if (token !== undefined) sessionArgs.token = token;
        if (teamId !== undefined) sessionArgs.teamId = teamId;
        if (projectId !== undefined) sessionArgs.projectId = projectId;
        if (baseUrl !== undefined) sessionArgs.baseUrl = baseUrl;
        if (appUrl !== undefined) sessionArgs.appUrl = appUrl;
        if (refreshToken !== undefined) sessionArgs.refreshToken = refreshToken;

        toolContext.setSessionContext?.(sessionArgs);

        const context = toolContext.getContext(args);
        return {
          message: '认证信息配置成功，后续调用无需再重复传入',
          data: context.toSafeJSON(),
        };
      },
    }),
  ];
}