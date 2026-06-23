/**
 * 系统命令
 */

import type { CLICommand } from '../types';
import { registerGroupCommand } from './registry';
import { getContextDetails, getProfile, parseFlags, printSuccess } from './utils';

const printCommand: CLICommand = {
  name: 'print',
  description: '打印当前上下文信息',
  usage: 'system print',
  handler: async args => {
    const flags = parseFlags(args);
    const { context, diagnostics } = getContextDetails(flags);
    const profile = getProfile();
    printSuccess(context, '当前上下文信息', {
      baseUrl: context.baseUrl,
      teamId: context.teamId ?? null,
      projectId: context.projectId ?? null,
      appUrl: context.appUrl ?? null,
      output: context.output,
      parsed: diagnostics.cache.parsed,
      profile: {
        baseUrl: profile.baseUrl ?? null,
        teamId: profile.teamId ?? null,
        projectId: profile.projectId ?? null,
        appUrl: profile.appUrl ?? null,
        output: profile.output ?? null,
        hasToken: Boolean(profile.token),
        hasRefreshToken: Boolean(profile.refreshToken),
      },
      env: diagnostics.cache.env,
      token: {
        present: Boolean(context.token),
        source: diagnostics.sources.token,
      },
      refreshToken: {
        present: Boolean(context.refreshToken),
        source: diagnostics.sources.refreshToken,
      },
      sources: diagnostics.sources,
      cache: diagnostics.cache,
    });
  },
};

export function registerSystemCommands(): void {
  registerGroupCommand('system', printCommand);
}
