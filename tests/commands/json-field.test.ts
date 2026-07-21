import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

const jsonFieldSdkSpies = {
  getContent: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      id: 'json_1',
      content: { enabled: true },
      rootType: 'object',
      sizeBytes: 16,
      version: 2,
    },
  })),
  save: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      storageMode: 'extended',
      id: 'json_1',
      previewText: '{"enabled":true}',
      rootType: 'object',
      sizeBytes: 16,
      version: 3,
    },
  })),
};

vi.mock('../../src/sdk/json-field', () => ({
  JsonFieldSDK: class {
    getContent(...args: unknown[]) {
      return jsonFieldSdkSpies.getContent(...args);
    }

    save(...args: unknown[]) {
      return jsonFieldSdkSpies.save(...args);
    }
  },
}));

describe('JSON Field Commands', () => {
  beforeEach(async () => {
    clearCommands();
    jsonFieldSdkSpies.getContent.mockClear();
    jsonFieldSdkSpies.save.mockClear();
    process.exitCode = undefined;
    const { registerCommands } = await import('../../src/commands');
    registerCommands();
  });

  it('should read extended JSON field content by id', async () => {
    const command = getCommandGroup('json-field')?.commands.find(item => item.name === 'content');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler(['--id', 'json_1']);

    expect(jsonFieldSdkSpies.getContent).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'json_1');
    expect(logSpy.mock.calls.flat().join('\n')).toContain('JSON 字段内容获取成功');
    logSpy.mockRestore();
  });

  it('should save JSON field content with concurrency versions', async () => {
    const command = getCommandGroup('json-field')?.commands.find(item => item.name === 'save');

    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_json',
      '--id',
      'json_1',
      '--content',
      '{"enabled":true}',
      '--json-version',
      '2',
      '--row-version',
      '7',
    ]);

    expect(jsonFieldSdkSpies.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      sheetId: 'sh_1',
      rowId: 'row_1',
      fieldId: 'fld_json',
      id: 'json_1',
      content: '{"enabled":true}',
      jsonVersion: 2,
      rowVersion: 7,
    });
  });

  it('should read UTF-8 JSON content from file', async () => {
    const filePath = join(tmpdir(), `dimens-json-field-${Date.now()}.json`);
    const content = '{"标题":"配置","items":[1,2]}';
    await writeFile(filePath, content, 'utf-8');
    const command = getCommandGroup('json-field')?.commands.find(item => item.name === 'save');

    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_json',
      '--file',
      filePath,
    ]);

    expect(jsonFieldSdkSpies.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      sheetId: 'sh_1',
      rowId: 'row_1',
      fieldId: 'fld_json',
      content,
    });
  });

  it.each(['"text"', '1', 'null', 'true'])(
    'should reject JSON scalar root %s',
    async content => {
      const command = getCommandGroup('json-field')?.commands.find(item => item.name === 'save');

      await command?.handler([
        '--sheet-id',
        'sh_1',
        '--row-id',
        'row_1',
        '--field-id',
        'fld_json',
        '--content',
        content,
      ]);

      expect(jsonFieldSdkSpies.save).not.toHaveBeenCalled();
    }
  );

  it('should reject conflicting content sources and invalid versions', async () => {
    const command = getCommandGroup('json-field')?.commands.find(item => item.name === 'save');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_json',
      '--content',
      '{}',
      '--file',
      '/tmp/config.json',
    ]);
    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_json',
      '--content',
      '{}',
      '--json-version',
      '0',
    ]);

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('--content 和 --file 不能同时传入');
    expect(output).toContain('jsonVersion 必须是大于等于 1 的整数');
    expect(jsonFieldSdkSpies.save).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it.each([
    {
      flags: ['--id', 'json_1'],
      message: '更新扩展 JSON 时必须同时传入 --id 和 --json-version',
    },
    {
      flags: ['--json-version', '2'],
      message: '--json-version 只能与 --id 一起使用',
    },
  ])('should reject incomplete extended JSON version context', async ({ flags, message }) => {
    const command = getCommandGroup('json-field')?.commands.find(item => item.name === 'save');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_json',
      '--content',
      '{}',
      ...flags,
    ]);

    expect(logSpy.mock.calls.flat().join('\n')).toContain(message);
    expect(jsonFieldSdkSpies.save).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
