import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

function sanitizeErrorMessage(message: string): string {
  return message.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer ***');
}

function createTextResult(payload: unknown, isError?: boolean): CallToolResult {
  return {
    ...(isError ? { isError: true } : {}),
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function createJsonToolResult(message: string, data?: unknown): CallToolResult {
  return createTextResult({
    success: true,
    message,
    data,
  });
}

export function createErrorToolResult(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return createTextResult(
    {
      success: false,
      message: sanitizeErrorMessage(message),
    },
    true
  );
}

export async function runToolHandler(
  handler: () => Promise<CallToolResult>
): Promise<CallToolResult> {
  try {
    return await handler();
  } catch (error) {
    return createErrorToolResult(error);
  }
}
