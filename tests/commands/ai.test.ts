import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://api.example.com',
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
      set: vi.fn(),
      getAll: vi.fn(() => store),
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
            id: 'chatcmpl-1',
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: '你好，我是工作流 AI',
                },
              },
            ],
          },
        };
      }
    },
  };
});

describe('AI Commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
  });

  it('should execute ai chat completions command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('ai')?.commands.find(
      item => item.name === 'chat-completions'
    );

    await command?.handler([
      '--message',
      '你好',
      '--model',
      'default',
    ]);

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
