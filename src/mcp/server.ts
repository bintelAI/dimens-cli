import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from '../core/config';
import { getVersion } from '../core/version';
import { createMcpContext, createMcpSDK } from './context';
import { registerDimensPrompts } from './prompts';
import { registerDimensResources } from './resources';
import { createAllMcpTools } from './tools';
import type { McpToolDefinition, McpToolFactoryContext } from './tools';

function registerMcpTool(server: McpServer, tool: McpToolDefinition): void {
  const config: {
    title?: string;
    description: string;
    inputSchema: typeof tool.inputSchema;
    annotations?: typeof tool.annotations;
  } = {
    description: tool.description,
    inputSchema: tool.inputSchema,
  };
  if (tool.title) {
    config.title = tool.title;
  }
  if (tool.annotations) {
    config.annotations = tool.annotations;
  }

  server.registerTool(
    tool.name,
    config,
    async (args: unknown) => tool.handler((args ?? {}) as Record<string, unknown>)
  );
}

export async function createDimensMcpServer(): Promise<McpServer> {
  await config.load();
  const profile = config.get('profile');
  const session: Partial<import('./context').McpContextArgs> = {};
  return createMcpServerWithToolContext({
    getContext: (args: Record<string, unknown> = {}) =>
      createMcpContext({ ...session, ...args }, profile),
    createSDK: createMcpSDK,
    setSessionContext: (args: Partial<import('./context').McpContextArgs>) => {
      Object.assign(session, args);
    },
  });
}

export async function createMcpServerWithToolContext(
  toolContext: McpToolFactoryContext
): Promise<McpServer> {
  const server = new McpServer({
    name: 'dimens-mcp-server',
    version: getVersion(),
  });

  createAllMcpTools(toolContext).forEach(tool => registerMcpTool(server, tool));
  registerDimensResources(server, toolContext);
  registerDimensPrompts(server);
  return server;
}

export async function runDimensMcpServer(): Promise<void> {
  const server = await createDimensMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
