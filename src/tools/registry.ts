/**
 * 工具注册器
 */

import type { Tool, ToolHandler } from '../types';
import { logger } from '../core/logger';

const registeredTools = new Map<string, Tool>();

export function registerTool(tool: Tool): void {
  if (registeredTools.has(tool.name)) {
    logger.warn(`工具 ${tool.name} 已存在，将被覆盖`);
  }
  registeredTools.set(tool.name, tool);
  logger.debug(`工具已注册: ${tool.name}`);
}

export function getTool(name: string): Tool | undefined {
  return registeredTools.get(name);
}

export function getAllTools(): Tool[] {
  return Array.from(registeredTools.values());
}

export function clearTools(): void {
  registeredTools.clear();
  logger.debug('所有工具已清除');
}

export function createTool(
  name: string,
  description: string,
  parameters: Tool['parameters'],
  handler: ToolHandler
): Tool {
  return {
    name,
    description,
    parameters,
    handler,
  };
}
