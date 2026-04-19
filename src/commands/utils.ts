import { config } from '../core/config';
import { resolveContext } from '../core/context';
import { formatError, formatSuccess } from '../core/output';
import type { CLIContext, CLIProfile } from '../types';
import { DimensClient } from '../sdk/client';
import { getRelatedSkillsForExecutionContext } from './execution-context';

export function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if (!current?.startsWith('--')) {
      continue;
    }
    const normalized = current.slice(2);
    const equalIndex = normalized.indexOf('=');
    if (equalIndex >= 0) {
      const key = normalized.slice(0, equalIndex);
      const value = normalized.slice(equalIndex + 1);
      flags[key] = value || 'true';
      continue;
    }
    const next = args[index + 1];
    if (next && !next.startsWith('--')) {
      flags[normalized] = next;
      index += 1;
      continue;
    }
    flags[normalized] = 'true';
  }

  return flags;
}

export function getProfile(): CLIProfile {
  return config.get('profile');
}

export function saveProfile(profile: CLIProfile): Promise<void> {
  config.set('profile', profile);
  return config.save();
}

export function mergeProfile(patch: Partial<CLIProfile>): CLIProfile {
  return {
    ...getProfile(),
    ...patch,
  };
}

export function getContext(flags: Record<string, string> = {}): CLIContext {
  const contextArgs: {
    baseUrl?: string;
    token?: string;
    teamId?: string;
    projectId?: string;
    output?: 'table' | 'json' | 'raw';
  } = {};

  if (flags['base-url']) {
    contextArgs.baseUrl = flags['base-url'];
  }
  if (flags.token) {
    contextArgs.token = flags.token;
  }
  if (flags['team-id']) {
    contextArgs.teamId = flags['team-id'];
  }
  if (flags['project-id']) {
    contextArgs.projectId = flags['project-id'];
  }
  if (flags.output === 'json' || flags.output === 'raw' || flags.output === 'table') {
    contextArgs.output = flags.output;
  }

  return resolveContext(
    contextArgs,
    getProfile()
  );
}

export function createClient(context: CLIContext): DimensClient {
  if (!context.baseUrl) {
    throw new Error('缺少 baseUrl，请先执行 auth login 或传入 --base-url');
  }

  const options: {
    baseUrl: string;
    token?: string;
    refreshToken?: string;
    teamId?: string;
    projectId?: string;
  } = {
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

export function printSuccess(
  context: CLIContext,
  message: string,
  data: unknown
): void {
  console.log(formatSuccess(message, data, context.output));
}

export function printError(context: CLIContext, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const relatedSkills = getRelatedSkillsForExecutionContext();
  console.log(formatError(message, context.output, { relatedSkills }));
  process.exitCode = 1;
}

export function requireTeamId(context: CLIContext, flags: Record<string, string>): string {
  const teamId = flags['team-id'] || context.teamId;
  if (!teamId) {
    throw new Error('缺少 teamId，请先执行 auth use-team 或传入 --team-id');
  }
  return teamId;
}

export function requireProjectId(
  context: CLIContext,
  flags: Record<string, string>
): string {
  const projectId = flags['project-id'] || context.projectId;
  if (!projectId) {
    throw new Error('缺少 projectId，请先执行 auth use-project 或传入 --project-id');
  }
  return projectId;
}

export function requireSheetId(
  flags: Record<string, string>,
  args: string[]
): string {
  const sheetId = flags['sheet-id'] || args[0];
  if (!sheetId) {
    throw new Error('缺少 sheetId，请传入 --sheet-id 或 sheet <command> <sheetId>');
  }
  return sheetId;
}
