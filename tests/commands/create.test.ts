import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearCommands, getCommand, getCommandGroup } from '../../src/commands/registry';
import { registerCommands } from '../../src/commands';
import { runCLI } from '../../src/cli';
import {
  __setCreateCommandPrompterForTests,
  __setGitRunnerForTests,
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
    __setGitRunnerForTests();
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

  it('shallow clones scaffold into explicit target dir', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'demo-page');
    const gitRunner = vi.fn(async (_command: string, args: string[]) => {
      await writeFile(join(args.at(-1) ?? '', 'package.json'), '{"name":"demo"}');
    });
    __setGitRunnerForTests(gitRunner);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runCLI(['create', '--dir', targetDir]);

    expect(gitRunner).toHaveBeenCalledWith('git', [
      'clone',
      '--depth',
      '1',
      'https://gitee.com/bintelai/dimens-web.git',
      targetDir,
    ]);
    await expect(readFile(join(targetDir, 'package.json'), 'utf8')).resolves.toContain('demo');
    expect(process.exitCode).toBe(0);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('自定义页面脚手架创建成功');
    logSpy.mockRestore();
  });

  it('asks for dir when --dir has no value', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'asked-page');
    __setCreateCommandPrompterForTests({
      askText: vi.fn(async () => targetDir),
      askConfirm: vi.fn(async () => true),
    });
    __setGitRunnerForTests(async (_command, args) => {
      await writeFile(join(args.at(-1) ?? '', 'package.json'), '{"name":"asked"}');
    });

    await getCommandGroup('system')
      ?.commands.find((command) => command.name === 'create')
      ?.handler(['--dir']);

    await expect(readFile(join(targetDir, 'package.json'), 'utf8')).resolves.toContain('asked');
  });

  it('keeps non-empty target unchanged when overwrite is rejected', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'existing-page');
    await writeFile(join(targetDir, 'old.txt'), 'old', { flag: 'wx' }).catch(async (error) => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      const { mkdir } = await import('node:fs/promises');
      await mkdir(targetDir, { recursive: true });
      await writeFile(join(targetDir, 'old.txt'), 'old');
    });
    __setCreateCommandPrompterForTests({
      askText: vi.fn(async () => targetDir),
      askConfirm: vi.fn(async () => false),
    });
    const gitRunner = vi.fn(async () => undefined);
    __setGitRunnerForTests(gitRunner);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommandGroup('system')
      ?.commands.find((command) => command.name === 'create')
      ?.handler(['--dir', targetDir]);

    await expect(readFile(join(targetDir, 'old.txt'), 'utf8')).resolves.toBe('old');
    await expect(readdir(join(cwd, 'backupDel'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(gitRunner).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join('\n')).toContain('已取消创建');
    logSpy.mockRestore();
  });

  it('moves existing files into backupDel before overwrite', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'existing-page');
    const { mkdir } = await import('node:fs/promises');
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, 'old.txt'), 'old');
    __setCreateCommandPrompterForTests({
      askText: vi.fn(async () => targetDir),
      askConfirm: vi.fn(async () => true),
    });
    __setGitRunnerForTests(async (_command, args) => {
      await writeFile(join(args.at(-1) ?? '', 'package.json'), '{"name":"new"}');
    });

    await getCommandGroup('system')
      ?.commands.find((command) => command.name === 'create')
      ?.handler(['--dir', targetDir]);

    const backups = await readdir(join(cwd, 'backupDel'));
    expect(backups[0]).toMatch(/^existing-page-/);
    await expect(
      readFile(join(cwd, 'backupDel', backups[0] ?? '', 'old.txt'), 'utf8')
    ).resolves.toBe('old');
    await expect(readFile(join(targetDir, 'package.json'), 'utf8')).resolves.toContain('new');
  });

  it('fails when scaffold clone fails', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'dimens-create-'));
    const targetDir = join(cwd, 'clone-fail');
    __setGitRunnerForTests(async () => {
      throw new Error('repository unavailable');
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommandGroup('system')
      ?.commands.find((command) => command.name === 'create')
      ?.handler(['--dir', targetDir]);

    expect(process.exitCode).toBe(1);
    expect(logSpy.mock.calls.flat().join('\n')).toContain('脚手架克隆失败');
    expect(logSpy.mock.calls.flat().join('\n')).toContain('repository unavailable');
    logSpy.mockRestore();
  });
});
