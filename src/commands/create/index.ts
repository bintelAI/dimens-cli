import AdmZip from 'adm-zip';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import {
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';

import { createCommand, registerGroupCommand } from '../registry';
import { parseFlags, printError } from '../utils';

const SCAFFOLD_URL = 'https://imgs.bintelai.com/dimens-web.zip';
const DEFAULT_DIR = 'dimens-web';

interface CreatePrompter {
  askText(question: string, defaultValue: string): Promise<string>;
  askConfirm(question: string, defaultValue: boolean): Promise<boolean>;
}

type ZipExtractor = (zipPath: string, destination: string) => Promise<void>;

let testPrompter: CreatePrompter | undefined;
let testZipExtractor: ZipExtractor | undefined;

const defaultPrompter: CreatePrompter = {
  async askText(question, defaultValue) {
    if (!input.isTTY) {
      throw new Error(`非交互环境请显式传入 --dir <path>，例如 dimens-cli create --dir ${defaultValue}`);
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

export function __setZipExtractorForTests(extractor?: ZipExtractor): void {
  testZipExtractor = extractor;
}

export function registerCreateCommands(): void {
  registerGroupCommand(
    'system',
    createCommand(
      'create',
      '创建自定义页面脚手架目录',
      async args => {
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
  const targetDirInput = flags.dir === 'true'
    ? await prompter.askText('请输入自定义页面目录', DEFAULT_DIR)
    : flags.dir;
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

  const zipPath = await downloadScaffoldZip();
  try {
    await extractZip(zipPath, targetDir);
  } finally {
    await rm(zipPath, { force: true });
  }

  console.log(`自定义页面脚手架创建成功: ${targetDir}`);
  console.log('下一步:');
  console.log(`  cd ${targetDir}`);
  console.log('  pnpm install');
  console.log('  pnpm run dev');
}

async function downloadScaffoldZip(): Promise<string> {
  let response: Response;
  try {
    response = await fetch(SCAFFOLD_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`脚手架下载失败，请检查网络后重试: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`脚手架下载失败，请检查网络后重试: HTTP ${response.status}`);
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'dimens-web-'));
  const zipPath = join(tempDir, 'dimens-web.zip');
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(zipPath, buffer);
  return zipPath;
}

async function extractZip(zipPath: string, destination: string): Promise<void> {
  const extractor = testZipExtractor || extractZipWithAdmZip;
  await extractor(zipPath, destination);
}

async function extractZipWithAdmZip(zipPath: string, destination: string): Promise<void> {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  for (const entry of entries) {
    const entryPath = resolve(destination, entry.entryName);
    if (!isPathInside(destination, entryPath)) {
      throw new Error(`压缩包包含非法路径: ${entry.entryName}`);
    }
  }

  zip.extractAllTo(destination, true);
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

function isPathInside(parent: string, candidate: string): boolean {
  const relativePath = relative(resolve(parent), resolve(candidate));
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.startsWith(sep));
}
