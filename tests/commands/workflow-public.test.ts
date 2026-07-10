import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://api.example.com',
      token: 'user-token',
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

const workflowPublicSpies = {
  upsert: vi.fn(),
  resetSecret: vi.fn(),
  invoke: vi.fn(),
};

vi.mock('../../src/sdk/workflow-public', () => {
  return {
    WorkflowPublicSDK: class {
      async upsert(...args: unknown[]) {
        workflowPublicSpies.upsert(...args);
        return { code: 1000, message: 'success', data: { publicId: 'wfpub_1' } };
      }
      async resetSecret(...args: unknown[]) {
        workflowPublicSpies.resetSecret(...args);
        return {
          code: 1000,
          message: 'success',
          data: { publicId: 'wfpub_1', publicSecret: 'wfsk_new' },
        };
      }
      async invoke(...args: unknown[]) {
        workflowPublicSpies.invoke(...args);
        return {
          code: 1000,
          message: 'success',
          data: {
            id: 'chatcmpl_public',
            choices: [{ message: { role: 'assistant', content: '公开调用结果' } }],
          },
        };
      }
    },
  };
});

describe('workflow-public commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
  });

  it('should upsert public workflow access config', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('workflow-public')?.commands.find(
      item => item.name === 'upsert'
    );

    await command?.handler([
      '--flow-id',
      '12',
      '--enabled',
      'true',
      '--run-as-user-id',
      '1001',
      '--project-id',
      'PROJ1',
      '--ip-whitelist',
      '1.2.3.4,5.6.7.8',
      '--rate-limit',
      '{"perMinute":60,"concurrency":5}',
    ]);

    expect(workflowPublicSpies.upsert).toHaveBeenCalledWith('TEAM1', 12, {
      enabled: true,
      runAsUserId: 1001,
      projectId: 'PROJ1',
      ipWhitelist: ['1.2.3.4', '5.6.7.8'],
      rateLimit: { perMinute: 60, concurrency: 5 },
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should invoke public workflow with public id and secret', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('workflow-public')?.commands.find(
      item => item.name === 'invoke'
    );

    await command?.handler([
      '--public-id',
      'wfpub_1',
      '--public-secret',
      'wfsk_public',
      '--message',
      '分析客户风险',
      '--metadata',
      '{"source":"crm"}',
      '--user',
      'external_1',
    ]);

    expect(workflowPublicSpies.invoke).toHaveBeenCalledWith('wfpub_1', 'wfsk_public', {
      model: 'workflow',
      messages: [{ role: 'user', content: '分析客户风险' }],
      stream: false,
      user: 'external_1',
      metadata: { source: 'crm' },
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
