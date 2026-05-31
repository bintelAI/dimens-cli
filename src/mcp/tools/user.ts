import { contextSchema, createSimpleTool, readOnlyAnnotations } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createUserTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_user_me',
      title: '获取当前用户信息',
      description: '获取当前登录用户的个人信息。',
      inputSchema: contextSchema,
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const result = await toolContext.createSDK(context).user.me();
        return { message: '用户信息获取成功', data: result.data };
      },
    }),
  ];
}