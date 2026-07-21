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

const richTextFieldSdkSpies = {
  getContent: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      documentId: 'DOC_RTF_1',
      content: '<p>hello richtext field</p>',
      version: 2,
    },
  })),
  save: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      documentId: 'DOC_RTF_1',
      previewText: 'hello richtext field',
      content: '<p>hello richtext field</p>',
      version: 3,
    },
  })),
};

vi.mock('../../src/sdk/richtext-field', () => {
  return {
    RichTextFieldSDK: class {
      async getContent(...args: unknown[]) {
        return richTextFieldSdkSpies.getContent(...args);
      }
      async save(...args: unknown[]) {
        return richTextFieldSdkSpies.save(...args);
      }
    },
  };
});

describe('RichText Field Commands', () => {
  beforeEach(() => {
    clearCommands();
    richTextFieldSdkSpies.getContent.mockClear();
    richTextFieldSdkSpies.save.mockClear();
    process.exitCode = undefined;
  });

  it('should register richtext-field group and execute content command', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();

    const group = getCommandGroup('richtext-field');
    expect(group).toBeTruthy();

    const command = group?.commands.find(item => item.name === 'content');
    expect(command).toBeTruthy();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_RTF_1',
    ]);

    expect(richTextFieldSdkSpies.getContent).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'DOC_RTF_1');
    expect(logSpy.mock.calls.flat().join('\n')).toContain('富文本字段内容获取成功');
    logSpy.mockRestore();
  });

  it('should execute richtext-field save command with html payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();

    const command = getCommandGroup('richtext-field')?.commands.find(item => item.name === 'save');
    expect(command).toBeTruthy();

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_richtext',
      '--document-id',
      'DOC_RTF_1',
      '--content',
      '<p>hello richtext field</p>',
      '--row-version',
      '7',
      '--title',
      'AI 生成说明',
    ]);

    expect(richTextFieldSdkSpies.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      sheetId: 'sh_1',
      rowId: 'row_1',
      fieldId: 'fld_richtext',
      documentId: 'DOC_RTF_1',
      content: '<p>hello richtext field</p>',
      rowVersion: 7,
      title: 'AI 生成说明',
    });
    expect(logSpy.mock.calls.flat().join('\n')).toContain('富文本字段保存成功');
    logSpy.mockRestore();
  });

  it('should read richtext HTML from a UTF-8 file', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();
    const filePath = join(tmpdir(), `dimens-richtext-field-${Date.now()}.html`);
    const content = '<h1>中文标题</h1><p>字段正文</p>';
    await writeFile(filePath, content, 'utf-8');
    const command = getCommandGroup('richtext-field')?.commands.find(item => item.name === 'save');

    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_richtext',
      '--file',
      filePath,
    ]);

    expect(richTextFieldSdkSpies.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      sheetId: 'sh_1',
      rowId: 'row_1',
      fieldId: 'fld_richtext',
      content,
    });
  });

  it('should reject conflicting richtext content sources', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();
    const command = getCommandGroup('richtext-field')?.commands.find(item => item.name === 'save');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--field-id',
      'fld_richtext',
      '--content',
      '<p>inline</p>',
      '--file',
      '/tmp/content.html',
    ]);

    expect(logSpy.mock.calls.flat().join('\n')).toContain('--content 和 --file 不能同时传入');
    expect(richTextFieldSdkSpies.save).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
