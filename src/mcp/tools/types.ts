import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ZodRawShape } from 'zod';
import type { DimensSDK } from '../../sdk';
import type { McpContext, McpContextArgs } from '../context';

export interface McpToolDefinition {
  name: string;
  title?: string;
  description: string;
  inputSchema: ZodRawShape;
  annotations?: ToolAnnotations;
  handler(args: Record<string, unknown>): Promise<CallToolResult>;
}

export interface McpToolFactoryContext {
  getContext(args?: Record<string, unknown>): McpContext;
  createSDK(context: McpContext): DimensSDK;
  setSessionContext?(args: Partial<McpContextArgs>): void;
}
