import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rename, stat } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { stdin as input, stdout as output, stderr as errorOutput } from 'node:process';
import { createInterface } from 'node:readline/promises';

import { createCommand, registerGroupCommand } from '../registry';
import { parseFlags, printError } from '../utils';

const SCAFFOLD_REPOSITORY = 'https://gitee.com/bintelai/dimens-web.git';
const DEFAULT_DIR = 'dimens-web';

interface CreatePrompter {
  askText(question: string, defaultValue: string): Promise<string>;
  askConfirm(question: string, defaultValue: boolean): Promise<boolean>;
}

type GitRunner = (command: string, args: string[]) => Promise<void>;

let testPrompter: CreatePrompter | undefined;
let testGitRunner: GitRunner | undefined;

const defaultPrompter: CreatePrompter = {
  async askText(question, defaultValue) {
    if (!input.isTTY) {
      throw new Error(
        `非交互环境请显式传入 --dir <path>，例如 dimens-cli create --dir ${defaultValue}`
      );
    }
    const rl = createInterface({ input, output });
    try {
      const answer = await rl.question(`${question} (${defaultValue}): `);
      return answer.trim() || defaultValue;
    } finally {
      rl.close();
    }
  },
  async askConfirm(question, defaultValue) {
    if (!input.isTTY) {
      throw new Error('目标目录已存在且非空，非交互环境无法确认覆盖');
    }
    const rl = createInterface({ input, output });
    const suffix = defaultValue ? 'Y/n' : 'y/N';
    try {
      const answer = (await rl.question(`${question} (${suffix}): `)).trim().toLowerCase();
      if (!answer) return defaultValue;
      return ['y', 'yes', '是', '确认'].includes(answer);
    } finally {
      rl.close();
    }
  },
};

export function __setCreateCommandPrompterForTests(prompter?: CreatePrompter): void {
  testPrompter = prompter;
}

export function __setGitRunnerForTests(runner?: GitRunner): void {
  testGitRunner = runner;
}

export function registerCreateCommands(): void {
  registerGroupCommand(
    'system',
    createCommand(
      'create',
      '创建自定义页面脚手架目录',
      async (args) => {
        try {
          await handleCreateCommand(args);
        } catch (error) {
          printError({ output: 'table' }, error);
        }
      },
      {
        usage: 'create --dir [targetDir]',
        examples: [
          'dimens-cli create --dir',
          'dimens-cli create --dir ./my-custom-page',
          'dimens-cli create --dir=./my-custom-page',
        ],
      }
    )
  );
}

async function handleCreateCommand(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  if (!Object.prototype.hasOwnProperty.call(flags, 'dir')) {
    throw new Error('缺少 --dir，请使用 dimens-cli create --dir <目录> 或 dimens-cli create --dir');
  }

  const prompter = testPrompter || defaultPrompter;
  const targetDirInput =
    flags.dir === 'true' ? await prompter.askText('请输入自定义页面目录', DEFAULT_DIR) : flags.dir;
  if (!targetDirInput) {
    throw new Error('目录不能为空，请传入 --dir <path>');
  }
  const normalizedTarget = targetDirInput.trim();
  if (!normalizedTarget) {
    throw new Error('目录不能为空，请传入 --dir <path>');
  }

  const targetDir = resolve(normalizedTarget);
  const exists = existsSync(targetDir);
  if (exists) {
    const targetStat = await stat(targetDir);
    if (!targetStat.isDirectory()) {
      throw new Error(`目标路径已存在但不是目录: ${targetDir}`);
    }
    const entries = await readdir(targetDir);
    if (entries.length > 0) {
      const confirmed = await prompter.askConfirm(
        `目标目录已存在且非空，是否迁移旧内容到 backupDel 后覆盖: ${targetDir}`,
        false
      );
      if (!confirmed) {
        console.log('已取消创建，目标目录未修改');
        return;
      }
      await backupExistingEntries(targetDir, entries);
    }
  } else {
    await mkdir(targetDir, { recursive: true });
  }

  await cloneScaffold(targetDir);

  console.log(`自定义页面脚手架创建成功: ${targetDir}`);
  console.log('下一步:');
  console.log(`  cd ${targetDir}`);
  console.log('  pnpm install');
  console.log('  pnpm run dev');
}

async function cloneScaffold(targetDir: string): Promise<void> {
  const runner = testGitRunner || runCommand;
  try {
    await runner('git', ['clone', '--depth', '1', SCAFFOLD_REPOSITORY, targetDir]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`脚手架克隆失败，请确认已安装 Git 并检查网络后重试: ${message}`);
  }
}

async function runCommand(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ['inherit', 'inherit', 'pipe'] });
    let stderr = '';

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      errorOutput.write(chunk);
    });
    child.once('error', (error) => reject(new Error(`无法启动 ${command}: ${error.message}`)));
    child.once('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(new Error(stderr.trim() || `${command} 退出码: ${code ?? 'unknown'}`));
    });
  });
}

async function backupExistingEntries(targetDir: string, entries: string[]): Promise<void> {
  const backupRoot = join(dirname(targetDir), 'backupDel');
  const backupDir = join(backupRoot, `${basename(targetDir)}-${createTimestamp()}`);
  await mkdir(backupDir, { recursive: true });

  for (const entry of entries) {
    await rename(join(targetDir, entry), join(backupDir, entry));
  }
}

function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
