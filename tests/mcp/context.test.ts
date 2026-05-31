import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CLIProfile } from '../../src/types';
import {
  createMcpContext,
  maskToken,
  requireMcpProjectId,
  requireMcpSheetId,
  requireMcpTeamId,
} from '../../src/mcp/context';

describe('MCP context', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should resolve explicit args before environment and profile values', () => {
    vi.stubEnv('DIMENS_TEAM_ID', 'TEAM_ENV');
    const profile: CLIProfile = {
      baseUrl: 'https://profile.example.com/api',
      token: 'profile-token',
      teamId: 'TEAM_PROFILE',
      projectId: 'PROJ_PROFILE',
    };

    const context = createMcpContext(
      {
        baseUrl: 'https://args.example.com/api',
        token: 'args-token',
        teamId: 'TEAM_ARGS',
      },
      profile
    );

    expect(context.baseUrl).toBe('https://args.example.com/api');
    expect(context.token).toBe('args-token');
    expect(context.teamId).toBe('TEAM_ARGS');
    expect(context.projectId).toBe('PROJ_PROFILE');
  });

  it('should mask token without leaking the original value', () => {
    expect(maskToken('abcdef1234567890')).toBe('abcd...7890');
    expect(maskToken('short')).toBe('***');
    expect(maskToken(undefined)).toBeUndefined();
  });

  it('should expose a sanitized context summary', () => {
    const context = createMcpContext(
      {
        baseUrl: 'https://api.example.com',
        token: 'abcdef1234567890',
        teamId: 'TEAM1',
        projectId: 'PROJ1',
      },
      {}
    );

    expect(context.toSafeJSON()).toEqual({
      baseUrl: 'https://api.example.com',
      hasToken: true,
      tokenPreview: 'abcd...7890',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
      appUrl: undefined,
    });
  });

  it('should require teamId, projectId, and sheetId with clear errors', () => {
    const context = createMcpContext({ baseUrl: 'https://api.example.com' }, {});

    expect(() => requireMcpTeamId(context, {})).toThrow('缺少 teamId');
    expect(() => requireMcpProjectId(context, {})).toThrow('缺少 projectId');
    expect(() => requireMcpSheetId({})).toThrow('缺少 sheetId');
  });
});
