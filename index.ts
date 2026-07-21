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
import { version, getVersion, getUserAgent } from './src/core/version';

export { logger, createLogger } from './src/core/logger';
export { config } from './src/core/config';
export { version, getVersion, getUserAgent };

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

// 导出 MCP 服务
export {
  createDimensMcpServer,
  createDimensMcpHttpApp,
  runDimensMcpServer,
  runDimensMcpHttpServer,
  createMcpContext,
  createMcpSDK,
  createAllMcpTools,
  createHttpMcpContextArgs,
  extractBearerToken,
  handleHttpMcpRequest,
} from './src/mcp';

// 导出技能
export { SKILLS, getSkill, getAllSkills } from './src/skills';

// 导出 SDK
export {
  DimensSDK,
  createSDK,
  DimensClient,
  DimensRequestError,
  AuthSDK,
  CanvasSDK,
  ColumnSDK,
  FlowChatSDK,
  JsonFieldSDK,
  ProjectSDK,
  RichTextFieldSDK,
  RowSDK,
  SheetSDK,
  TeamSDK,
  UploadSDK,
  UserSDK,
  type SDKConfig,
  type APIResponse,
  type DimensClientOptions,
  type ExtendedJsonFieldReference,
  type JsonFieldContent,
  type JsonFieldRootType,
  type JsonFieldSavePayload,
  type JsonFieldSaveResult,
  type JsonFieldValue,
  type ProjectInfo,
  type ProjectPagePayload,
  type ProjectPageResult,
  type TeamInfo,
  type TeamSummary,
  type UserInfo,
} from './src/sdk';

/**
 * 插件初始化函数
 */
export async function initialize() {
  const { registerAllTools } = await import('./src/tools');
  const { registerCommands } = await import('./src/commands');
  
  return {
    name: '@bintel/dimens-cli',
    version: getVersion(),
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
