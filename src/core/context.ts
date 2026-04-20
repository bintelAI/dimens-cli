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

export function resolveContext(
  args: PartialContext = {},
  profile: CLIProfile = {}
): CLIContext {
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

  return context;
}
