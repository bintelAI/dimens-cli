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
      async generateImage(...args: unknown[]) {
        aiSdkSpies.generateImage(...args);
        return {
          code: 1000,
          message: 'success',
          data: {
            created: 1710000000,
            data: [{ url: 'https://cdn.example.com/poster.png' }],
          },
        };
      }
      async createVideo(...args: unknown[]) {
        aiSdkSpies.createVideo(...args);
        return {
          code: 1000,
          message: 'success',
          data: {
            id: 'video_task_1',
            status: 'queued',
          },
        };
      }
      async getVideo(...args: unknown[]) {
        aiSdkSpies.getVideo(...args);
        return {
          code: 1000,
          message: 'success',
          data: {
            id: 'video_task_1',
            status: 'completed',
          },
        };
      }
      async responses(...args: unknown[]) {
        aiSdkSpies.responses(...args);
        return {
          code: 1000,
          message: 'success',
          data: {
            id: 'resp_1',
          },
        };
      }
      async messages(...args: unknown[]) {
        aiSdkSpies.messages(...args);
        return {
          code: 1000,
          message: 'success',
          data: {
            id: 'msg_1',
          },
        };
      }
      async proxy(...args: unknown[]) {
        aiSdkSpies.proxy(...args);
        return {
          code: 1000,
          message: 'success',
          data: {
            ok: true,
          },
        };
      }
    },
  };
});

const aiSdkSpies = {
  generateImage: vi.fn(),
  createVideo: vi.fn(),
  getVideo: vi.fn(),
  responses: vi.fn(),
  messages: vi.fn(),
  proxy: vi.fn(),
};

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

  it('should execute image generation command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('ai')?.commands.find(
      item => item.name === 'image-generate'
    );

    await command?.handler([
      '--prompt',
      '企业数据驾驶舱海报',
      '--model',
      'default',
      '--size',
      '1024x1024',
      '--project-id',
      'PROJ1',
      '--resource-id',
      'poster_1',
    ]);

    expect(aiSdkSpies.generateImage).toHaveBeenCalledWith('TEAM1', {
      model: 'default',
      prompt: '企业数据驾驶舱海报',
      size: '1024x1024',
      projectId: 'PROJ1',
      resourceId: 'poster_1',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute video create and status commands', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createCommand = getCommandGroup('ai')?.commands.find(
      item => item.name === 'video-create'
    );
    const statusCommand = getCommandGroup('ai')?.commands.find(
      item => item.name === 'video-status'
    );

    await createCommand?.handler([
      '--prompt',
      '数据看板动画展示',
      '--seconds',
      '8',
      '--model',
      'default',
    ]);
    await statusCommand?.handler(['--task-id', 'video_task_1']);

    expect(aiSdkSpies.createVideo).toHaveBeenCalledWith('TEAM1', {
      model: 'default',
      prompt: '数据看板动画展示',
      seconds: '8',
    });
    expect(aiSdkSpies.getVideo).toHaveBeenCalledWith('TEAM1', 'video_task_1');
    logSpy.mockRestore();
  });

  it('should execute responses, messages and proxy commands', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const responsesCommand = getCommandGroup('ai')?.commands.find(
      item => item.name === 'responses'
    );
    const messagesCommand = getCommandGroup('ai')?.commands.find(
      item => item.name === 'messages'
    );
    const proxyCommand = getCommandGroup('ai')?.commands.find(
      item => item.name === 'proxy'
    );

    await responsesCommand?.handler([
      '--payload',
      '{"model":"default","input":"总结项目风险"}',
    ]);
    await messagesCommand?.handler([
      '--payload',
      '{"model":"default","messages":[{"role":"user","content":"总结项目风险"}]}',
    ]);
    await proxyCommand?.handler([
      '--method',
      'GET',
      '--path',
      '/v1beta/models',
      '--query',
      '{"capability":"image"}',
    ]);

    expect(aiSdkSpies.responses).toHaveBeenCalledWith('TEAM1', {
      model: 'default',
      input: '总结项目风险',
    });
    expect(aiSdkSpies.messages).toHaveBeenCalledWith('TEAM1', {
      model: 'default',
      messages: [{ role: 'user', content: '总结项目风险' }],
    });
    expect(aiSdkSpies.proxy).toHaveBeenCalledWith('TEAM1', {
      method: 'GET',
      path: '/v1beta/models',
      query: { capability: 'image' },
    });
    logSpy.mockRestore();
  });
});
