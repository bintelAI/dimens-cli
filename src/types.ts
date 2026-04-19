/**
 * 核心类型定义
 */

export type OutputMode = 'table' | 'json' | 'raw';

/**
 * 技能定义
 */
export interface Skill {
  name: string;
  description: string;
  version?: string;
  author?: string;
  tags?: string[];
  examples?: SkillExample[];
  references?: string[];
  skillPath?: string;
  referencesDir?: string;
  commandGroups?: string[];
  commands?: string[];
  sdkModules?: string[];
  toolNames?: string[];
}

/**
 * 技能示例
 */
export interface SkillExample {
  title: string;
  description: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

/**
 * 工具定义
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameters;
  handler: ToolHandler;
}

/**
 * 工具参数定义
 */
export interface ToolParameters {
  type: 'object';
  properties: Record<string, ToolParameter>;
  required?: string[];
}

/**
 * 单个工具参数
 */
export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  default?: unknown;
  items?: ToolParameter;
}

/**
 * 工具处理函数
 */
export type ToolHandler = (params: Record<string, unknown>) => Promise<ToolResult>;

/**
 * 工具执行结果
 */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

/**
 * CLI Profile
 */
export interface CLIProfile {
  baseUrl?: string;
  token?: string;
  refreshToken?: string;
  teamId?: string;
  projectId?: string;
  output?: OutputMode;
}

/**
 * CLI 上下文
 */
export interface CLIContext {
  baseUrl?: string;
  token?: string;
  refreshToken?: string;
  teamId?: string;
  projectId?: string;
  output: OutputMode;
}

/**
 * 命令定义
 */
export interface CLICommand {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  examples?: string[];
  handler: CLICommandHandler;
}

/**
 * 命令处理函数
 */
export type CLICommandHandler = (args: string[]) => Promise<void>;

/**
 * 命令组定义
 */
export interface CLICommandGroup {
  name: string;
  description: string;
  commands: CLICommand[];
}

/**
 * 插件配置
 */
export interface PluginConfig {
  name: string;
  version: string;
  skills: Skill[];
  tools: Tool[];
  commands: CLICommand[];
}

/**
 * 日志级别
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}
