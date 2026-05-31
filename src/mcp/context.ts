import { resolveContext } from '../core/context';
import { DimensClient } from '../sdk/client';
import { DimensSDK, type SDKConfig } from '../sdk';
import type { CLIContext, CLIProfile } from '../types';

export interface McpContextArgs {
  baseUrl?: string;
  token?: string;
  refreshToken?: string;
  teamId?: string;
  projectId?: string;
  appUrl?: string;
}

export interface SafeMcpContext {
  baseUrl: string | undefined;
  hasToken: boolean;
  tokenPreview: string | undefined;
  teamId: string | undefined;
  projectId: string | undefined;
  appUrl: string | undefined;
}

export interface McpContext extends CLIContext {
  token?: string;
  refreshToken?: string;
  toSafeJSON(): SafeMcpContext;
}

export function maskToken(token?: string): string | undefined {
  if (!token) {
    return undefined;
  }
  if (token.length < 12) {
    return '***';
  }
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export function createMcpContext(
  args: McpContextArgs = {},
  profile: CLIProfile = {}
): McpContext {
  const resolvedProfile: CLIProfile = { ...profile };
  if (args.refreshToken !== undefined) {
    resolvedProfile.refreshToken = args.refreshToken;
  }

  const context = resolveContext(
    {
      ...args,
      output: 'json',
    },
    resolvedProfile
  ) as McpContext;

  if (args.refreshToken !== undefined) {
    context.refreshToken = args.refreshToken;
  }

  context.toSafeJSON = () => ({
    baseUrl: context.baseUrl,
    hasToken: Boolean(context.token),
    tokenPreview: maskToken(context.token),
    teamId: context.teamId,
    projectId: context.projectId,
    appUrl: context.appUrl,
  });

  return context;
}

export function createMcpClient(context: McpContext): DimensClient {
  if (!context.baseUrl) {
    throw new Error('缺少 baseUrl，请传入 baseUrl 或配置 DIMENS_BASE_URL');
  }

  const options: SDKConfig = {
    baseUrl: context.baseUrl,
  };
  if (context.token) {
    options.token = context.token;
  }
  if (context.refreshToken) {
    options.refreshToken = context.refreshToken;
  }
  if (context.teamId) {
    options.teamId = context.teamId;
  }
  if (context.projectId) {
    options.projectId = context.projectId;
  }

  return new DimensClient(options);
}

export function createMcpSDK(context: McpContext): DimensSDK {
  return new DimensSDK(createMcpClient(context).getOptions());
}

export function requireMcpTeamId(
  context: McpContext,
  args: { teamId?: string | undefined }
): string {
  const teamId = args.teamId ?? context.teamId;
  if (!teamId) {
    throw new Error('缺少 teamId，请传入 teamId 或配置 DIMENS_TEAM_ID');
  }
  return teamId;
}

export function requireMcpProjectId(
  context: McpContext,
  args: { projectId?: string | undefined }
): string {
  const projectId = args.projectId ?? context.projectId;
  if (!projectId) {
    throw new Error('缺少 projectId，请传入 projectId 或配置 DIMENS_PROJECT_ID');
  }
  return projectId;
}

export function requireMcpSheetId(args: { sheetId?: string | undefined }): string {
  if (!args.sheetId) {
    throw new Error('缺少 sheetId，请传入 sheetId');
  }
  return args.sheetId;
}
