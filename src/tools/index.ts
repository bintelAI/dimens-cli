/**
 * 工具层入口
 */

export { registerTool, getTool, getAllTools, clearTools, createTool } from './registry';
export { registerProjectTools } from './project';

import { logger } from '../core/logger';
import { registerProjectTools } from './project';

export function registerAllTools(): void {
  logger.info('开始注册所有工具...');
  
  registerProjectTools();
  
  logger.info('所有工具注册完成');
}
