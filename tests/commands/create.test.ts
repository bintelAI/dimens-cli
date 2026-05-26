import { mkdtemp, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearCommands, getCommand, getCommandGroup } from '../../src/commands/registry';
import { registerCommands } from '../../src/commands';
import { runCLI } from '../../src/cli';
import {
  __setCreateCommandPrompterForTests,
  __setZipExtractorForTests,
} from '../../src/commands/create/index';

vi.mock('../../src/core/config', () => {
  return {
    config: {
      load: vi.fn(async () => undefined),
      save: vi.fn(async () => undefined),
      get: vi.fn(() => ({ output: 'table' })),
      set: vi.fn(),
      getAll: vi.fn(() => ({ profile: { output: 'table' } })),
    },
  };
});

describe('create command', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
    registerCommands();
    __setCreateCommandPrompterForTests();
    __setZipExtractorForTests();
    process.exitCode = 0;
  });

  it('registers create as a top-level command and prints help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler([]);
    await getCommand('help')?.handler(['system', 'create']);

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('create');
    expect(output).toContain('自定义页面脚手架目录');
    expect(output).toContain('dimens-cli create --dir');
    expect(output).toContain('dimens-cli create --dir ./my-custom-page');
    expect(output).toContain('dimens-cli create --dir=./my-custom-page');
    logSpy.mockRestore();
  });

  it('downloads and extracts scaffold into explicit target dir', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'demo-page');
    const zipBytes = new Uint8Array([1, 2, 3]);
    vi.stubGlobal('fetch', vi.fn(async () => createZipResponse(zipBytes)));
    __setZipExtractorForTests(async (_zipPath, destination) => {
      await writeFile(join(destination, 'package.json'), '{"name":"demo"}');
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runCLI(['create', '--dir', targetDir]);

    expect(fetch).toHaveBeenCalledWith('https://imgs.bintelai.com/dimens-web.zip');
    await expect(readFile(join(targetDir, 'package.json'), 'utf8')).resolves.toContain('demo');
    expect(process.exitCode).toBe(0);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('自定义页面脚手架创建成功');
    logSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('asks for dir when --dir has no value', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'asked-page');
    vi.stubGlobal('fetch', vi.fn(async () => createZipResponse(new Uint8Array([1]))));
    __setCreateCommandPrompterForTests({
      askText: vi.fn(async () => targetDir),
      askConfirm: vi.fn(async () => true),
    });
    __setZipExtractorForTests(async (_zipPath, destination) => {
      await writeFile(join(destination, 'package.json'), '{"name":"asked"}');
    });

    await getCommandGroup('system')?.commands.find(command => command.name === 'create')?.handler(['--dir']);

    await expect(readFile(join(targetDir, 'package.json'), 'utf8')).resolves.toContain('asked');
    vi.unstubAllGlobals();
  });

  it('keeps non-empty target unchanged when overwrite is rejected', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'existing-page');
    await writeFile(join(targetDir, 'old.txt'), 'old', { flag: 'wx' }).catch(async error => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const { mkdir } = await import('node:fs/promises');
      await mkdir(targetDir, { recursive: true });
      await writeFile(join(targetDir, 'old.txt'), 'old');
    });
    vi.stubGlobal('fetch', vi.fn(async () => createZipResponse(new Uint8Array([1]))));
    __setCreateCommandPrompterForTests({
      askText: vi.fn(async () => targetDir),
      askConfirm: vi.fn(async () => false),
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommandGroup('system')?.commands.find(command => command.name === 'create')?.handler([
      '--dir',
      targetDir,
    ]);

    await expect(readFile(join(targetDir, 'old.txt'), 'utf8')).resolves.toBe('old');
    await expect(readdir(join(cwd, 'backupDel'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(fetch).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join('\n')).toContain('已取消创建');
    logSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('moves existing files into backupDel before overwrite', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'existing-page');
    const { mkdir } = await import('node:fs/promises');
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, 'old.txt'), 'old');
    vi.stubGlobal('fetch', vi.fn(async () => createZipResponse(new Uint8Array([1]))));
    __setCreateCommandPrompterForTests({
      askText: vi.fn(async () => targetDir),
      askConfirm: vi.fn(async () => true),
    });
    __setZipExtractorForTests(async (_zipPath, destination) => {
      await writeFile(join(destination, 'package.json'), '{"name":"new"}');
    });

    await getCommandGroup('system')?.commands.find(command => command.name === 'create')?.handler([
      '--dir',
      targetDir,
    ]);

    const backups = await readdir(join(cwd, 'backupDel'));
    expect(backups[0]).toMatch(/^existing-page-/);
    await expect(readFile(join(cwd, 'backupDel', backups[0] ?? '', 'old.txt'), 'utf8')).resolves.toBe('old');
    await expect(readFile(join(targetDir, 'package.json'), 'utf8')).resolves.toContain('new');
    vi.unstubAllGlobals();
  });

  it('fails when scaffold download fails', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'download-fail');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
        arrayBuffer: async () => new ArrayBuffer(0),
      }))
    );
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommandGroup('system')?.commands.find(command => command.name === 'create')?.handler([
      '--dir',
      targetDir,
    ]);

    expect(process.exitCode).toBe(1);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('脚手架下载失败');
    logSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('rejects zip entries escaping target directory', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'zip-slip');
    const outside = resolve(targetDir, '..', 'evil.txt');
    vi.stubGlobal('fetch', vi.fn(async () => createZipResponse(new Uint8Array([1]))));
    __setZipExtractorForTests(async (_zipPath, destination) => {
      throw new Error(`压缩包包含非法路径: ${outside.replace(destination, '')}`);
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommandGroup('system')?.commands.find(command => command.name === 'create')?.handler([
      '--dir',
      targetDir,
    ]);

    await expect(stat(outside)).rejects.toMatchObject({ code: 'ENOENT' });
    expect(process.exitCode).toBe(1);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('压缩包包含非法路径');
    logSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});

function createZipResponse(bytes: Uint8Array) {
  return {
    ok: true,
    status: 200,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}
