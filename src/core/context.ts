import type { CLIContext, CLIProfile, OutputMode } from '../types';

export const DEFAULT_BASE_URL = 'https://dimens.bintelai.com/api';

type PartialContext = Partial<Omit<CLIContext, 'output'>> & {
  output?: OutputMode;
};

export function resolveContext(
  args: PartialContext = {},
  profile: CLIProfile = {}
): CLIContext {
  const context: CLIContext = {
    output: args.output ?? profile.output ?? 'table',
  };

  const baseUrl =
    args.baseUrl ?? process.env.DIMENS_BASE_URL ?? profile.baseUrl ?? DEFAULT_BASE_URL;
  const token = args.token ?? process.env.DIMENS_TOKEN ?? profile.token;
  const refreshToken = args.refreshToken ?? profile.refreshToken;
  const teamId = args.teamId ?? process.env.DIMENS_TEAM_ID ?? profile.teamId;
  const projectId =
    args.projectId ?? process.env.DIMENS_PROJECT_ID ?? profile.projectId;

  context.baseUrl = baseUrl;
  if (token !== undefined) context.token = token;
  if (refreshToken !== undefined) context.refreshToken = refreshToken;
  if (teamId !== undefined) context.teamId = teamId;
  if (projectId !== undefined) context.projectId = projectId;

  return context;
}
