import { describe, expect, it, vi } from 'vitest';
import { createHttpMcpContextArgs, extractBearerToken, sendJsonRpcError } from '../../src/mcp/http';

function headers(input: Record<string, string>): Headers {
  return new Headers(input);
}

describe('MCP HTTP gateway', () => {
  it('should extract bearer token from authorization header', () => {
    expect(extractBearerToken('Bearer token-123')).toBe('token-123');
    expect(extractBearerToken('bearer token-456')).toBe('token-456');
    expect(extractBearerToken('Token token-123')).toBeUndefined();
    expect(extractBearerToken(undefined)).toBeUndefined();
  });

  it('should create MCP context args from Slawith headers', () => {
    const result = createHttpMcpContextArgs(
      headers({
        authorization: 'Bearer user-token',
        'x-dimens-team-id': 'TEAM1',
        'x-dimens-project-id': 'PROJ1',
        'x-dimens-base-url': 'https://api.example.com',
      })
    );

    expect(result).toEqual({
      token: 'user-token',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
      baseUrl: 'https://api.example.com',
    });
  });

  it('should support lowercase token fallback header for internal gateways', () => {
    const result = createHttpMcpContextArgs(
      headers({
        'x-dimens-token': 'fallback-token',
      })
    );

    expect(result.token).toBe('fallback-token');
  });

  it('should return JSON-RPC error responses without leaking bearer token', () => {
    const res = {
      headersSent: false,
      writeHead: vi.fn().mockReturnThis(),
      end: vi.fn(),
    };

    sendJsonRpcError(res as never, 500, new Error('Authorization: Bearer secret-token'));

    expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'application/json' });
    const body = JSON.parse(String(res.end.mock.calls[0]?.[0]));
    expect(body).toEqual({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Authorization: Bearer ***',
      },
      id: null,
    });
  });
});
