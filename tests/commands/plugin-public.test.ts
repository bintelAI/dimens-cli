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

const pluginPublicSpies = {
  publish: vi.fn(),
  list: vi.fn(),
  installFlow: vi.fn(),
};

vi.mock('../../src/sdk/plugin-public', () => {
  return {
    PluginPublicSDK: class {
      async publish(...args: unknown[]) {
        pluginPublicSpies.publish(...args);
        return { code: 1000, message: 'success', data: { success: true } };
      }
      async list(...args: unknown[]) {
        pluginPublicSpies.list(...args);
        return {
          code: 1000,
          message: 'success',
          data: { list: [{ id: 88, resourceType: 'flow_plugin' }] },
        };
      }
      async installFlow(...args: unknown[]) {
        pluginPublicSpies.installFlow(...args);
        return { code: 1000, message: 'success', data: { id: 501 } };
      }
    },
  };
});

describe('plugin-public commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
  });

  it('should publish a team plugin to public flow plugin market', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('plugin-public')?.commands.find(
      item => item.name === 'publish'
    );

    await command?.handler(['--plugin-id', '3']);

    expect(pluginPublicSpies.publish).toHaveBeenCalledWith('TEAM1', 3);
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should list public plugins with flow_plugin defaults', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('plugin-public')?.commands.find(
      item => item.name === 'list'
    );

    await command?.handler(['--keyword', '审批', '--page', '2', '--size', '10']);

    expect(pluginPublicSpies.list).toHaveBeenCalledWith({
      keyword: '审批',
      page: 2,
      size: 10,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should install a public flow plugin into target team', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('plugin-public')?.commands.find(
      item => item.name === 'install-flow'
    );

    await command?.handler([
      '--resource-id',
      '88',
      '--project-scope-type',
      'selected_projects',
      '--project-ids',
      'PROJ1,PROJ2',
      '--instance-name',
      '审批助手',
    ]);

    expect(pluginPublicSpies.installFlow).toHaveBeenCalledWith({
      teamId: 'TEAM1',
      resourceId: 88,
      projectScopeType: 'selected_projects',
      projectIds: ['PROJ1', 'PROJ2'],
      instanceName: '审批助手',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
