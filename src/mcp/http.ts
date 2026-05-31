import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { config } from '../core/config';
import { createMcpContext, createMcpSDK, type McpContextArgs } from './context';
import { createMcpServerWithToolContext } from './server';

type HeaderSource = Pick<Headers, 'get'>;

interface HttpMcpHandlerOptions {
  body?: unknown;
  headers?: HeaderSource;
}

type ExpressLikeRequest = IncomingMessage & {
  body?: unknown;
};

type ExpressLikeResponse = ServerResponse;

function sanitizeErrorMessage(message: string): string {
  return message.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer ***');
}

export function extractBearerToken(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

function headerValue(headers: HeaderSource, name: string): string | undefined {
  return headers.get(name) ?? headers.get(name.toLowerCase()) ?? undefined;
}

export function createHttpMcpContextArgs(headers: HeaderSource): McpContextArgs {
  const token =
    extractBearerToken(headerValue(headers, 'authorization')) ??
    headerValue(headers, 'x-dimens-token');
  const args: McpContextArgs = {};
  if (token) {
    args.token = token;
  }
  const teamId = headerValue(headers, 'x-dimens-team-id');
  if (teamId) {
    args.teamId = teamId;
  }
  const projectId = headerValue(headers, 'x-dimens-project-id');
  if (projectId) {
    args.projectId = projectId;
  }
  const baseUrl = headerValue(headers, 'x-dimens-base-url');
  if (baseUrl) {
    args.baseUrl = baseUrl;
  }
  const appUrl = headerValue(headers, 'x-dimens-app-url');
  if (appUrl) {
    args.appUrl = appUrl;
  }
  return args;
}

export function sendJsonRpcError(
  res: Pick<ServerResponse, 'headersSent' | 'writeHead' | 'end'>,
  statusCode: number,
  error: unknown
): void {
  if (res.headersSent) {
    return;
  }
  const message = error instanceof Error ? error.message : String(error);
  res
    .writeHead(statusCode, { 'Content-Type': 'application/json' })
    .end(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: sanitizeErrorMessage(message),
      },
      id: null,
    }));
}

export async function handleHttpMcpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  options: HttpMcpHandlerOptions = {}
): Promise<void> {
  await config.load();
  const profile = config.get('profile');
  const headers = options.headers ?? new Headers(req.headers as Record<string, string>);
  const requestContextArgs = createHttpMcpContextArgs(headers);
  const server = await createMcpServerWithToolContext({
    getContext: args => createMcpContext({ ...requestContextArgs, ...args }, profile),
    createSDK: createMcpSDK,
  });

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    } as unknown as ConstructorParameters<typeof StreamableHTTPServerTransport>[0]);
    await server.connect(transport as unknown as Transport);
    await transport.handleRequest(req, res, options.body);
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
  } catch (error) {
    sendJsonRpcError(res, 500, error);
  }
}

export async function createDimensMcpHttpApp() {
  const app = createMcpExpressApp();
  app.post('/mcp', async (req: ExpressLikeRequest, res: ExpressLikeResponse) => {
    await handleHttpMcpRequest(req, res, {
      body: req.body,
    });
  });
  app.get('/mcp', (_req: ExpressLikeRequest, res: ExpressLikeResponse) => {
    sendJsonRpcError(res, 405, new Error('Method not allowed.'));
  });
  app.delete('/mcp', (_req: ExpressLikeRequest, res: ExpressLikeResponse) => {
    sendJsonRpcError(res, 405, new Error('Method not allowed.'));
  });
  return app;
}

export async function runDimensMcpHttpServer(options: {
  host?: string;
  port?: number;
} = {}): Promise<void> {
  const host = options.host ?? process.env.DIMENS_MCP_HOST ?? '127.0.0.1';
  const port = options.port ?? Number(process.env.DIMENS_MCP_PORT || '3333');
  const app = await createDimensMcpHttpApp();
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve());
  });
  process.stderr.write(`dimens-mcp-http-server listening on http://${host}:${port}/mcp\n`);
}
