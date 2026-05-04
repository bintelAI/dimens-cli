/**
 * Dimens CLI 插件入口
 * 
 * 提供两种使用模式：
 * 1. CLI 模式：命令行工具
 * 2. SDK 模式：直接引入 SDK 调用
 */

// 导出核心类型
export * from './src/types';

// 导出核心功能
export { logger, createLogger } from './src/core/logger';
export { config } from './src/core/config';
export { version, getVersion, getUserAgent } from './src/core/version';

// 导出工具
export { registerAllTools, registerTool, getTool, getAllTools } from './src/tools';

// 导出命令
export {
  registerCommands,
  registerCommand,
  getCommand,
  getGroupCommand,
  getAllCommands,
} from './src/commands';
export { runCLI } from './src/cli';

// 导出技能
export { SKILLS, getSkill, getAllSkills } from './src/skills';

// 导出 SDK
export {
  DimensSDK,
  createSDK,
  DimensClient,
  AuthSDK,
  CanvasSDK,
  ColumnSDK,
  FlowChatSDK,
  ProjectSDK,
  RowSDK,
  SheetSDK,
  UploadSDK,
  type SDKConfig,
  type APIResponse,
  type DimensClientOptions,
} from './src/sdk';

/**
 * 插件初始化函数
 */
export async function initialize() {
  const { registerAllTools } = await import('./src/tools');
  const { registerCommands } = await import('./src/commands');
  
  return {
    name: '@bintel/dimens-cli',
    version: '1.0.0',
    registerTools: registerAllTools,
    registerCommands,
  };
}

/**
 * 快速创建 SDK 实例
 */
export async function createDimensSDK(
  config?: import('./src/sdk').SDKConfig
) {
  const { DimensSDK } = await import('./src/sdk');
  if (!config) {
    throw new Error('createDimensSDK 需要传入 baseUrl');
  }
  return new DimensSDK(config);
}

export default initialize;
