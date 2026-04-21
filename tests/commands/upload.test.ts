import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://api.example.com',
      token: 'token-1',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
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

const uploadSdkSpies = {
  uploadFile: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      fileId: 'FILE_1',
      key: '/upload/20260421/demo.txt',
      url: 'https://api.example.com/upload/20260421/demo.txt',
      name: 'demo.txt',
      size: 5,
      type: 'text/plain',
      mimeType: 'text/plain',
      ext: '.txt',
    },
  })),
  getMode: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      mode: 'local',
      type: 'local',
    },
  })),
};

vi.mock('../../src/sdk/upload', () => {
  return {
    UploadSDK: class {
      async uploadFile(...args: unknown[]) {
        return uploadSdkSpies.uploadFile(...args);
      }
      async getMode(...args: unknown[]) {
        return uploadSdkSpies.getMode(...args);
      }
    },
  };
});

describe('Upload Commands', () => {
  beforeEach(() => {
    clearCommands();
    uploadSdkSpies.uploadFile.mockClear();
    uploadSdkSpies.getMode.mockClear();
  });

  it('should register upload group and execute file upload', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();

    const group = getCommandGroup('upload');
    expect(group).toBeTruthy();

    const command = group?.commands.find(item => item.name === 'file');
    expect(command).toBeTruthy();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler([
      '--path',
      '/tmp/demo.txt',
      '--key',
      'docs/demo.txt',
    ]);

    expect(uploadSdkSpies.uploadFile).toHaveBeenCalledWith(
      '/tmp/demo.txt',
      'docs/demo.txt'
    );

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('文件上传成功');
    expect(output).toContain('FILE_1');
    logSpy.mockRestore();
  });

  it('should execute upload mode command', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();

    const command = getCommandGroup('upload')?.commands.find(item => item.name === 'mode');
    expect(command).toBeTruthy();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await command?.handler([]);

    expect(uploadSdkSpies.getMode).toHaveBeenCalledTimes(1);
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('上传模式获取成功');
    expect(output).toContain('local');
    logSpy.mockRestore();
  });

  it('should pass business context to unified upload command', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();

    const command = getCommandGroup('upload')?.commands.find(item => item.name === 'file');
    expect(command).toBeTruthy();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler([
      '--file',
      '/tmp/cover.png',
      '--team-id',
      'TEAM2',
      '--project-id',
      'PROJ2',
      '--scene',
      'project-cover',
      '--biz-type',
      'project',
    ]);

    expect(uploadSdkSpies.uploadFile).toHaveBeenCalledWith('/tmp/cover.png', {
      bizType: 'project',
      projectId: 'PROJ2',
      scene: 'project-cover',
      teamId: 'TEAM2',
    });

    logSpy.mockRestore();
  });
});
