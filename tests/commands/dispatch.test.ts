import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://dimens.bintelai.com',
      token: 'token-1',
      teamId: 'TEAM1',
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
      async loginByApiKey() {
        return {
          code: 1000,
          message: 'success',
          data: { token: 'token-by-key', refreshToken: 'refresh-by-key' },
        };
      }

      async login() {
        return {
          code: 1000,
          message: 'success',
          data: { token: 'token-1', refreshToken: 'refresh-1' },
        };
      }

      async refreshToken() {
        return {
          code: 1000,
          message: 'success',
          data: { token: 'token-2', refreshToken: 'refresh-2' },
        };
      }
    },
  };
});

vi.mock('../../src/sdk/flow-chat', () => {
  return {
    FlowChatSDK: class {
      async completions() {
        return {
          code: 1000,
          message: 'success',
          data: {
            choices: [{ message: { role: 'assistant', content: '你好' } }],
          },
        };
      }
    },
  };
});

describe('CLI Dispatch', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should dispatch help command', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI(['help']);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should dispatch auth api-key-login command', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI([
      'auth',
      'api-key-login',
      '--api-key',
      'ak_xxx',
      '--api-secret',
      'sk_xxx',
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should dispatch ai chat-completions command', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI([
      'ai',
      'chat-completions',
      '--message',
      '你好',
      '--team-id',
      'TEAM1',
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should return non-zero exit code when command fails', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI(['project', 'list']);

    expect(exitCode).toBe(1);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('相关 Skill');
    expect(output).toContain('dimens-team');
    logSpy.mockRestore();
  });

  it('should include related skills in json error output', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI(['project', 'list', '--output', 'json']);

    expect(exitCode).toBe(1);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('"success": false');
    expect(output).toContain('"relatedSkills"');
    expect(output).toContain('"dimens-team"');
    logSpy.mockRestore();
  });

  it('should show related skills before command execution when show-skill is enabled', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI([
      'ai',
      'chat-completions',
      '--message',
      '你好',
      '--team-id',
      'TEAM1',
      '--show-skill',
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('执行前建议关注 Skill');
    expect(output).toContain('dimens-workflow');
    logSpy.mockRestore();
  });

  it('should show skill mapping before command execution when show-skill mapping is enabled', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI([
      'ai',
      'chat-completions',
      '--message',
      '你好',
      '--team-id',
      'TEAM1',
      '--show-skill',
      'mapping',
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令组');
    expect(output).toContain('SDK');
    expect(output).toContain('FlowChatSDK');
    logSpy.mockRestore();
  });

  it('should show full skill content before command execution when show-skill full is enabled', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { runCLI } = await import('../../src/cli');

    const exitCode = await runCLI([
      'ai',
      'chat-completions',
      '--message',
      '你好',
      '--team-id',
      'TEAM1',
      '--show-skill',
      'full',
    ]);

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('# 工作流技能（dimens-workflow）');
    expect(output).toContain('执行前建议关注 Skill');
    logSpy.mockRestore();
  });
});
