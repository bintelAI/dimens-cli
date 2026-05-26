import { beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../../src/core/config';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';
import { registerCommands } from '../../src/commands';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {},
    skills: {},
    preferences: {},
  };

  return {
    config: {
      load: vi.fn(async () => undefined),
      save: vi.fn(async () => undefined),
      get: vi.fn((key: keyof typeof store) => store[key]),
      set: vi.fn((key: keyof typeof store, value: unknown) => {
        (store as Record<string, unknown>)[key] = value;
      }),
      getAll: vi.fn(() => store),
    },
  };
});

vi.mock('../../src/sdk/auth', () => {
  return {
    AuthSDK: class {
      async login() {
        return {
          code: 1000,
          message: '登录成功',
          data: {
            token: 'token-1',
            refreshToken: 'refresh-1',
            userInfo: { username: 'demo' },
          },
        };
      }

      async loginByApiKey() {
        return {
          code: 1000,
          message: '登录成功',
          data: {
            token: 'token-by-key',
            refreshToken: 'refresh-by-key',
          },
        };
      }

      async refreshToken() {
        return {
          code: 1000,
          message: '刷新成功',
          data: { token: 'token-2', refreshToken: 'refresh-2' },
        };
      }

      async me() {
        return {
          code: 1000,
          message: 'success',
          data: { id: 1001, username: 'demo' },
        };
      }
    },
  };
});

vi.mock('../../src/sdk/user', () => {
  return {
    UserSDK: class {
      async me() {
        return {
          code: 1000,
          message: 'success',
          data: { id: 1001, username: 'demo' },
        };
      }
    },
  };
});

vi.mock('../../src/sdk/team', () => {
  return {
    TeamSDK: class {
      async info() {
        return {
          code: 1000,
          message: 'success',
          data: { id: 'TEAM1', name: '团队A' },
        };
      }

      async members() {
        return {
          code: 1000,
          message: 'success',
          data: [
            { id: 1001, name: '张三' },
            { id: 1002, name: '李四' },
          ],
        };
      }
    },
  };
});

vi.mock('../../src/sdk/project', () => {
  return {
    ProjectSDK: class {
      async page() {
        return {
          code: 1000,
          message: 'success',
          data: {
            list: [{ id: 'P1', name: '项目A' }],
          },
        };
      }
    },
  };
});

describe('Auth and Project Commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
    registerCommands();
  });

  it('should persist profile after auth login', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const loginCommand = getCommandGroup('auth')?.commands.find(command => command.name === 'login');
    await loginCommand?.handler([
      '--base-url',
      'https://api.example.com',
      '--username',
      'demo',
      '--password',
      '123456',
    ]);

    expect(config.set).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
        refreshToken: 'refresh-1',
      })
    );
    logSpy.mockRestore();
  });

  it('should persist profile after auth api-key-login', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const apiKeyLoginCommand = getCommandGroup('auth')?.commands.find(
      command => command.name === 'api-key-login'
    );
    await apiKeyLoginCommand?.handler([
      '--base-url',
      'https://api.example.com',
      '--api-key',
      'ak_xxx',
      '--api-secret',
      'sk_xxx',
    ]);

    expect(config.set).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        baseUrl: 'https://api.example.com',
        token: 'token-by-key',
        refreshToken: 'refresh-by-key',
      })
    );
    logSpy.mockRestore();
  });

  it('should persist profile after auth api-key-login with equals style flags', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const apiKeyLoginCommand = getCommandGroup('auth')?.commands.find(
      command => command.name === 'api-key-login'
    );
    await apiKeyLoginCommand?.handler([
      '--base-url=https://api.example.com',
      '--api-key=ak_xxx',
      '--api-secret=sk_xxx',
    ]);

    expect(config.set).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        baseUrl: 'https://api.example.com',
        token: 'token-by-key',
        refreshToken: 'refresh-by-key',
      })
    );
    logSpy.mockRestore();
  });

  it('should save selected team id via use-team command', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const useTeamCommand = getCommandGroup('auth')?.commands.find(
      command => command.name === 'use-team'
    );
    await useTeamCommand?.handler(['TEAM1']);

    expect(config.set).toHaveBeenCalledWith(
      'profile',
      expect.objectContaining({
        teamId: 'TEAM1',
      })
    );
    logSpy.mockRestore();
  });

  it('should print current user info via auth me command', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const meCommand = getCommandGroup('auth')?.commands.find(command => command.name === 'me');
    await meCommand?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('当前用户信息获取成功');
    logSpy.mockRestore();
  });

  it('should print current user info via user me command', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const meCommand = getCommandGroup('user')?.commands.find(command => command.name === 'me');
    await meCommand?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('当前用户信息获取成功');
    logSpy.mockRestore();
  });

  it('should print team info', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const teamInfoCommand = getCommandGroup('team')?.commands.find(command => command.name === 'info');
    await teamInfoCommand?.handler(['--team-id', 'TEAM1']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('团队信息获取成功');
    logSpy.mockRestore();
  });

  it('should print team users', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const teamUsersCommand = getCommandGroup('team')?.commands.find(command => command.name === 'users');
    await teamUsersCommand?.handler(['--team-id', 'TEAM1', '--keyword', '张三']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('团队成员列表获取成功');
    expect(output).toContain('张三');
    expect(output).not.toContain('李四');
    logSpy.mockRestore();
  });

  it('should print project list result', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const projectListCommand = getCommandGroup('project')?.commands.find(
      command => command.name === 'list'
    );
    await projectListCommand?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
