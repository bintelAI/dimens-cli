import { ResourceTemplate, type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpToolFactoryContext } from './tools';

function jsonText(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function registerDimensResources(
  server: Pick<McpServer, 'registerResource'>,
  toolContext: McpToolFactoryContext
): void {
  server.registerResource(
    'dimens_context',
    'dimens://context',
    {
      title: 'Dimens 当前上下文',
      mimeType: 'application/json',
      description: '当前 MCP 请求解析出的 Dimens 上下文，不包含完整 token。',
    },
    async () => {
      const context = toolContext.getContext();
      return {
        contents: [
          {
            uri: 'dimens://context',
            mimeType: 'application/json',
            text: jsonText(context.toSafeJSON()),
          },
        ],
      };
    }
  );

  server.registerResource(
    'dimens_sheet_structure',
    new ResourceTemplate('dimens://sheet/{sheetId}/structure', { list: undefined }),
    {
      title: 'Dimens 表结构',
      mimeType: 'application/json',
      description: '按 sheetId 读取维表结构。',
    },
    async (uri, variables) => {
      const sheetId = String(variables.sheetId || '');
      if (!sheetId) {
        throw new Error('缺少 sheetId');
      }
      const context = toolContext.getContext();
      const result = await toolContext.createSDK(context).sheet.structure(sheetId);
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: 'application/json',
            text: jsonText(result.data),
          },
        ],
      };
    }
  );
}
