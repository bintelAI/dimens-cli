import { createJsonToolResult, runToolHandler } from '../response';
import { contextSchema, createTool, readOnlyAnnotations } from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createContextTools(
  toolContext: McpToolFactoryContext
): McpToolDefinition[] {
  return [
    createTool({
      name: 'dimens_context_get',
      title: '获取 Dimens MCP 上下文',
      description: '返回当前 MCP 请求解析出的 baseUrl、teamId、projectId 和脱敏 token 状态。',
      inputSchema: contextSchema,
      annotations: readOnlyAnnotations,
      handler: args =>
        runToolHandler(async () => {
          const context = toolContext.getContext(args);
          return createJsonToolResult('上下文获取成功', context.toSafeJSON());
        }),
    }),
  ];
}
