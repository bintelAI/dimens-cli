/**
 * 帮助命令
 */

import type { CLICommand } from '../types';
import { createCommandGroup, registerGroupCommand } from './registry';
import { getAllCommandGroups, getCommandGroup } from './registry';
import { getVersion } from '../core/version';
import { getAllSkills } from '../skills';

function findRelatedSkills(groupName: string, commandName?: string): string[] {
  const qualifiedCommand = commandName ? `${groupName} ${commandName}` : undefined;

  return getAllSkills()
    .filter(skill => {
      const matchesGroup = skill.commandGroups?.includes(groupName) ?? false;
      const matchesCommand = qualifiedCommand
        ? skill.commands?.includes(qualifiedCommand) ?? false
        : false;
      return matchesGroup || matchesCommand;
    })
    .map(skill => skill.name)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function printRelatedSkills(groupName: string, commandName?: string): void {
  const relatedSkills = findRelatedSkills(groupName, commandName);
  if (relatedSkills.length === 0) {
    return;
  }

  console.log('相关 Skill:');
  relatedSkills.forEach(skillName => {
    console.log(`  - ${skillName}`);
  });
}

const helpCommand: CLICommand = {
  name: 'help',
  description: '显示帮助信息',
  usage: 'help [command] [subcommand]',
  aliases: ['h', '?'],
  handler: async (args) => {
    if (args.length > 0) {
      const groupName = args[0];
      const commandName = args[1];
      if (!groupName) {
        return;
      }
      const group = getCommandGroup(groupName);

      if (!group) {
        console.log(`未找到命令组: ${groupName}`);
        return;
      }

      if (commandName) {
        const command = group.commands.find(
          c => c.name === commandName || c.aliases?.includes(commandName)
        );

        if (!command) {
          console.log(`未找到命令: ${groupName} ${commandName}`);
          return;
        }

        console.log(`\n命令: ${group.name} ${command.name}`);
        console.log(`描述: ${command.description}`);
        if (command.usage) {
          console.log(`用法: ${command.usage}`);
        }
        if (command.aliases && command.aliases.length > 0) {
          console.log(`别名: ${command.aliases.join(', ')}`);
        }
        if (command.examples && command.examples.length > 0) {
          console.log('示例:');
          command.examples.forEach(example => {
            console.log(`  ${example}`);
          });
        }
        printRelatedSkills(group.name, command.name);
        console.log('');
        return;
      }

      console.log(`\n命令组: ${group.name}`);
      console.log(`描述: ${group.description}`);
      console.log('可用命令:');
      group.commands.forEach(command => {
        console.log(`  ${command.name.padEnd(15)} ${command.description}`);
      });
      printRelatedSkills(group.name);
      console.log('');
      return;
    }

    console.log('\nDimens CLI - 多维项目开发助手');
    console.log(`版本: ${getVersion()}\n`);
    console.log('可用命令组:\n');

    getAllCommandGroups().forEach(group => {
      console.log(`  ${group.name.padEnd(15)} ${group.description}`);
    });

    console.log('\n使用 "help [group]" 查看命令组，使用 "help [group] [command]" 查看具体命令');
    console.log('使用 "help skill" 查看技能命令组，使用 "skill info <name>" 查看具体 Skill\n');
  },
};

export function registerHelpCommand(): void {
  createCommandGroup('system', '系统命令');
  registerGroupCommand('system', helpCommand);
}
