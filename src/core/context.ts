import type { CLIContext, CLIProfile, OutputMode } from '../types';

export const DEFAULT_BASE_URL = 'https://dimens.bintelai.com/api';

type PartialContext = Partial<Omit<CLIContext, 'output'>> & {
  output?: OutputMode;
};

type AppUrlContext = {
  baseUrl?: string;
  teamId?: string;
  projectId?: string;
};

export type ContextSource = 'cli' | 'app-url' | 'env' | 'profile' | 'default' | 'unset';

export interface ContextDiagnostics {
  sources: {
    baseUrl: ContextSource;
    token: ContextSource;
    refreshToken: ContextSource;
    teamId: ContextSource;
    projectId: ContextSource;
    appUrl: ContextSource;
    output: ContextSource;
  };
  cache: {
    profile: {
      baseUrl?: string;
      teamId?: string;
      projectId?: string;
      appUrl?: string;
      output?: OutputMode;
      hasToken: boolean;
      hasRefreshToken: boolean;
    };
    env: {
      baseUrl: boolean;
      token: boolean;
      teamId: boolean;
      projectId: boolean;
    };
    parsed: {
      baseUrl?: string;
      teamId?: string;
      projectId?: string;
    };
  };
}

export function parseDimensAppUrl(appUrl?: string): AppUrlContext {
  if (!appUrl) {
    return {};
  }

  try {
    const parsed = new URL(appUrl);
    const hashPath = parsed.hash.replace(/^#\/?/, '');
    const segments = hashPath
      .split('/')
      .map(segment => segment.trim())
      .filter(Boolean);

    const [teamId, projectId] = segments;
    const originBaseUrl = `${parsed.origin}/api`;
    const context: AppUrlContext = {
      baseUrl: originBaseUrl,
    };
    if (teamId !== undefined) {
      context.teamId = teamId;
    }
    if (projectId !== undefined) {
      context.projectId = projectId;
    }
    return context;
  } catch {
    return {};
  }
}

function buildContextDiagnostics(args: PartialContext, profile: CLIProfile): ContextDiagnostics {
  const parsedAppContext = parseDimensAppUrl(args.appUrl ?? profile.appUrl);
  const envBaseUrl = process.env.DIMENS_BASE_URL;
  const envToken = process.env.DIMENS_TOKEN;
  const envTeamId = process.env.DIMENS_TEAM_ID;
  const envProjectId = process.env.DIMENS_PROJECT_ID;

  return {
    sources: {
      baseUrl: args.baseUrl !== undefined
        ? 'cli'
        : parsedAppContext.baseUrl !== undefined
          ? 'app-url'
          : envBaseUrl !== undefined
            ? 'env'
            : profile.baseUrl !== undefined
              ? 'profile'
              : 'default',
      token: args.token !== undefined
        ? 'cli'
        : envToken !== undefined
          ? 'env'
          : profile.token !== undefined
            ? 'profile'
            : 'unset',
      refreshToken: args.refreshToken !== undefined
        ? 'cli'
        : profile.refreshToken !== undefined
          ? 'profile'
          : 'unset',
      teamId: args.teamId !== undefined
        ? 'cli'
        : parsedAppContext.teamId !== undefined
          ? 'app-url'
          : envTeamId !== undefined
            ? 'env'
            : profile.teamId !== undefined
              ? 'profile'
              : 'unset',
      projectId: args.projectId !== undefined
        ? 'cli'
        : parsedAppContext.projectId !== undefined
          ? 'app-url'
          : envProjectId !== undefined
            ? 'env'
            : profile.projectId !== undefined
              ? 'profile'
              : 'unset',
      appUrl: args.appUrl !== undefined
        ? 'cli'
        : profile.appUrl !== undefined
          ? 'profile'
          : 'unset',
      output: args.output !== undefined
        ? 'cli'
        : profile.output !== undefined
          ? 'profile'
          : 'default',
    },
    cache: {
      profile: {
        ...(profile.baseUrl !== undefined ? { baseUrl: profile.baseUrl } : {}),
        ...(profile.teamId !== undefined ? { teamId: profile.teamId } : {}),
        ...(profile.projectId !== undefined ? { projectId: profile.projectId } : {}),
        ...(profile.appUrl !== undefined ? { appUrl: profile.appUrl } : {}),
        ...(profile.output !== undefined ? { output: profile.output } : {}),
        hasToken: Boolean(profile.token),
        hasRefreshToken: Boolean(profile.refreshToken),
      },
      env: {
        baseUrl: envBaseUrl !== undefined,
        token: envToken !== undefined,
        teamId: envTeamId !== undefined,
        projectId: envProjectId !== undefined,
      },
      parsed: {
        ...(parsedAppContext.baseUrl !== undefined ? { baseUrl: parsedAppContext.baseUrl } : {}),
        ...(parsedAppContext.teamId !== undefined ? { teamId: parsedAppContext.teamId } : {}),
        ...(parsedAppContext.projectId !== undefined ? { projectId: parsedAppContext.projectId } : {}),
      },
    },
  };
}

export function resolveContext(
  args: PartialContext = {},
  profile: CLIProfile = {}
): CLIContext {
  return resolveContextDetails(args, profile).context;
}

export function resolveContextDetails(
  args: PartialContext = {},
  profile: CLIProfile = {}
): { context: CLIContext; diagnostics: ContextDiagnostics } {
  const parsedAppContext = parseDimensAppUrl(args.appUrl ?? profile.appUrl);
  const context: CLIContext = {
    output: args.output ?? profile.output ?? 'table',
  };

  const baseUrl =
    args.baseUrl ??
    parsedAppContext.baseUrl ??
    process.env.DIMENS_BASE_URL ??
    profile.baseUrl ??
    DEFAULT_BASE_URL;
  const token = args.token ?? process.env.DIMENS_TOKEN ?? profile.token;
  const refreshToken = args.refreshToken ?? profile.refreshToken;
  const teamId =
    args.teamId ?? parsedAppContext.teamId ?? process.env.DIMENS_TEAM_ID ?? profile.teamId;
  const projectId =
    args.projectId ??
    parsedAppContext.projectId ??
    process.env.DIMENS_PROJECT_ID ??
    profile.projectId;

  context.baseUrl = baseUrl;
  if (token !== undefined) context.token = token;
  if (refreshToken !== undefined) context.refreshToken = refreshToken;
  if (teamId !== undefined) context.teamId = teamId;
  if (projectId !== undefined) context.projectId = projectId;
  const appUrl = args.appUrl ?? profile.appUrl;
  if (appUrl !== undefined) context.appUrl = appUrl;

  return {
    context,
    diagnostics: buildContextDiagnostics(args, profile),
  };
}
