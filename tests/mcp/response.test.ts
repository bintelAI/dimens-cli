import { describe, expect, it } from 'vitest';
import { createErrorToolResult, createJsonToolResult } from '../../src/mcp/response';

describe('MCP response', () => {
  it('should return JSON text content for successful tool results', () => {
    const result = createJsonToolResult('查询成功', { id: 'P1' });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe('text');
    expect(JSON.parse(String(result.content[0]?.text))).toEqual({
      success: true,
      message: '查询成功',
      data: { id: 'P1' },
    });
  });

  it('should return sanitized JSON text content for errors', () => {
    const result = createErrorToolResult(new Error('Authorization: Bearer secret-token'));

    expect(result.isError).toBe(true);
    expect(JSON.parse(String(result.content[0]?.text))).toEqual({
      success: false,
      message: 'Authorization: Bearer ***',
    });
  });
});
