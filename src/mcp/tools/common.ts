import { z } from 'zod';
import {
  requireMcpProjectId,
  requireMcpSheetId,
  requireMcpTeamId,
} from '../context';
import { createJsonToolResult, runToolHandler } from '../response';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

export const contextSchema = {
  baseUrl: z.string().url().optional(),
  token: z.string().optional(),
  refreshToken: z.string().optional(),
  teamId: z.string().optional(),
  projectId: z.string().optional(),
  appUrl: z.string().url().optional(),
};

export const readOnlyAnnotations = {
  readOnlyHint: true,
};

export const writeAnnotations = {
  readOnlyHint: false,
};

export function asObject(value: unknown, fieldName: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是对象`);
  }
  return value as Record<string, unknown>;
}

export function asArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} 必须是数组`);
  }
  return value;
}

export function requireConfirm(args: Record<string, unknown>, actionName: string): void {
  if (args.confirm !== true) {
    throw new Error(`${actionName} 属于删除/破坏性操作，请传入 confirm: true 后重试`);
  }
}

export function getTeamProjectSheet(
  toolContext: McpToolFactoryContext,
  args: Record<string, unknown>
) {
  const context = toolContext.getContext(args);
  return {
    context,
    teamId: requireMcpTeamId(context, { teamId: stringArg(args.teamId) }),
    projectId: requireMcpProjectId(context, { projectId: stringArg(args.projectId) }),
    sheetId: requireMcpSheetId({ sheetId: stringArg(args.sheetId) }),
  };
}

export function stringArg(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export function numberArg(value: unknown, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

export function createTool(definition: McpToolDefinition): McpToolDefinition {
  return definition;
}

export function createSimpleTool(
  definition: Omit<McpToolDefinition, 'handler'> & {
    run(args: Record<string, unknown>): Promise<{ message: string; data: unknown }>;
  }
): McpToolDefinition {
  return {
    ...definition,
    handler: args =>
      runToolHandler(async () => {
        const result = await definition.run(args);
        return createJsonToolResult(result.message, result.data);
      }),
  };
}
