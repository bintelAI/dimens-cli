import { config } from './core/config';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { registerCommands, clearCommands, getCommand, getCommandGroup, getGroupCommand } from './commands';
import {
  clearExecutionContext,
  getRelatedSkillObjectsForExecutionContext,
  setExecutionContext,
} from './commands/execution-context';
import { parseFlags } from './commands/utils';
import { getSkillsRootPath } from './skills';

function toRelativeSkillPath(filePath: string): string {
  return relative(getSkillsRootPath(), filePath) || filePath;
}

function printSkillSummary(): void {
  const relatedSkills = getRelatedSkillObjectsForExecutionContext();
  if (relatedSkills.length === 0) {
    return;
  }

  console.log('\n执行前建议关注 Skill:\n');
  relatedSkills.forEach(skill => {
    console.log(`- ${skill.name}`);
    console.log(`  ${skill.description.split('\n')[0] ?? skill.description}`);
  });
  console.log('');
}

function printSkillMapping(): void {
  const relatedSkills = getRelatedSkillObjectsForExecutionContext();
  if (relatedSkills.length === 0) {
    return;
  }

  console.log('\n执行前建议关注 Skill:\n');
  relatedSkills.forEach(skill => {
    console.log(`===== ${skill.name} / mapping =====`);
    console.log('命令组:');
    (skill.commandGroups ?? []).forEach(item => console.log(`- ${item}`));
    console.log('命令:');
    (skill.commands ?? []).forEach(item => console.log(`- ${item}`));
    console.log('SDK:');
    (skill.sdkModules ?? []).forEach(item => console.log(`- ${item}`));
    console.log('工具:');
    (skill.toolNames ?? []).forEach(item => console.log(`- ${item}`));
    console.log('');
  });
}

function printSkillFull(): void {
  const relatedSkills = getRelatedSkillObjectsForExecutionContext();
  if (relatedSkills.length === 0) {
    return;
  }

  console.log('\n执行前建议关注 Skill:\n');
  relatedSkills.forEach(skill => {
    if (!skill.skillPath) {
      return;
    }
    console.log(`===== ${skill.name} / ${toRelativeSkillPath(skill.skillPath)} =====\n`);
    console.log(readFileSync(skill.skillPath, 'utf8'));
    console.log('');
  });
}

export async function runCLI(argv: string[]): Promise<number> {
  await config.load();
  clearCommands();
  clearExecutionContext();
  registerCommands();
  process.exitCode = 0;

  const args = argv.filter(Boolean);
  if (args.length === 0) {
    await getCommand('help')?.handler([]);
    return 0;
  }

  const [first, second, ...rest] = args;
  if (!first) {
    await getCommand('help')?.handler([]);
    return 0;
  }

  if (first === 'help' || first === 'version') {
    await getCommand(first)?.handler([second, ...rest].filter(Boolean) as string[]);
    return 0;
  }

  const group = getCommandGroup(first);
  if (!group) {
    console.log(`未找到命令组: ${first}`);
    await getCommand('help')?.handler([]);
    return 1;
  }

  if (!second) {
    await getCommand('help')?.handler([first]);
    return 0;
  }

  const command = getGroupCommand(first, second);
  if (!command) {
    console.log(`未找到命令: ${first} ${second}`);
    await getCommand('help')?.handler([first]);
    return 1;
  }

  setExecutionContext({
    groupName: first,
    commandName: second,
  });
  const flags = parseFlags(rest);
  const showSkillMode = flags['show-skill'];
  if (showSkillMode === 'true' || showSkillMode === 'summary') {
    printSkillSummary();
  } else if (showSkillMode === 'mapping') {
    printSkillMapping();
  } else if (showSkillMode === 'full') {
    printSkillFull();
  }
  await command.handler(rest);
  clearExecutionContext();
  return process.exitCode ?? 0;
}
