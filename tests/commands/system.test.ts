import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://profile.example.com/api',
      token: 'profile-token',
      refreshToken: 'profile-refresh',
      teamId: 'TEAM_PROFILE',
      projectId: 'PROJ_PROFILE',
      appUrl: 'https://profile.example.com/#/TEAM_PROFILE/PROJ_PROFILE',
      output: 'table',
    },
    skills: {},
    preferences: {},
  };

  return {
    config: {
      load: vi.fn(async () => undefined),
      save: vi.fn(async () => undefined),
      get: vi.fn((key: keyof typeof store) => store[key]),
      set: vi.fn(),
      getAll: vi.fn(() => store),
    },
  };
});

describe('system command', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
  });

  it('registers system print command', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();

    const command = getCommandGroup('system')?.commands.find(item => item.name === 'print');

    expect(command).toBeTruthy();
    expect(command?.usage).toBe('system print');
  });

  it('prints current context details and cache sources', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('system')?.commands.find(item => item.name === 'print');

    await command?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('当前上下文信息');
    expect(output).toContain('https://profile.example.com/api');
    expect(output).toContain('TEAM_PROFILE');
    expect(output).toContain('PROJ_PROFILE');
    expect(output).toContain('profile.example.com');
    expect(output).toContain('"hasToken": true');
    expect(output).toContain('"hasRefreshToken": true');
    expect(output).toContain('"sources"');
    expect(output).toContain('"baseUrl": "app-url"');
    expect(output).toContain('"teamId": "app-url"');
    expect(output).toContain('"projectId": "app-url"');
    expect(output).toContain('"appUrl": "profile"');
    expect(output).toContain('"output": "profile"');
    expect(output).toContain('"token": "profile"');
    expect(output).toContain('"refreshToken": "profile"');
    expect(output).toContain('"parsed"');
    expect(output).not.toContain('profile-token');
    expect(output).not.toContain('profile-refresh');
    logSpy.mockRestore();
  });

  it('prints overridden values when cli args are provided', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('system')?.commands.find(item => item.name === 'print');

    await command?.handler([
      '--base-url',
      'https://cli.example.com/api',
      '--team-id',
      'TEAM_CLI',
      '--project-id',
      'PROJ_CLI',
      '--app-url',
      'https://cli.example.com/#/TEAM_CLI/PROJ_CLI',
      '--output',
      'json',
      '--token',
      'cli-token',
      '--refresh-token',
      'cli-refresh',
    ]);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('https://cli.example.com/api');
    expect(output).toContain('TEAM_CLI');
    expect(output).toContain('PROJ_CLI');
    expect(output).toContain('"baseUrl": "cli"');
    expect(output).toContain('"teamId": "cli"');
    expect(output).toContain('"projectId": "cli"');
    expect(output).toContain('"appUrl": "cli"');
    expect(output).toContain('"output": "cli"');
    expect(output).toContain('"token": "cli"');
    expect(output).toContain('"refreshToken": "cli"');
    expect(output).toContain('"parsed"');
    expect(output).not.toContain('cli-token');
    expect(output).not.toContain('cli-refresh');
    logSpy.mockRestore();
  });
});
