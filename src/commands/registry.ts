/**
 * 命令注册器
 */

import type { CLICommand, CLICommandGroup, CLICommandHandler } from '../types';
import { logger } from '../core/logger';

const registeredCommands = new Map<string, CLICommand>();
const registeredGroups = new Map<string, CLICommandGroup>();
const qualifiedCommands = new Map<string, CLICommand>();

export function createCommandGroup(
  name: string,
  description: string
): CLICommandGroup {
  const group: CLICommandGroup = {
    name,
    description,
    commands: [],
  };
  registeredGroups.set(name, group);
  return group;
}

export function registerCommand(command: CLICommand): void {
  if (registeredCommands.has(command.name)) {
    logger.warn(`命令 ${command.name} 已存在，将被覆盖`);
  }
  registeredCommands.set(command.name, command);
  
  if (command.aliases) {
    command.aliases.forEach(alias => {
      registeredCommands.set(alias, command);
    });
  }
  
  logger.debug(`命令已注册: ${command.name}`);
}

export function registerGroupCommand(
  groupName: string,
  command: CLICommand
): void {
  const group =
    registeredGroups.get(groupName) || createCommandGroup(groupName, groupName);
  group.commands.push(command);

  const qualifiedName = `${groupName}:${command.name}`;
  qualifiedCommands.set(qualifiedName, command);

  if (groupName === 'system' || groupName === 'auth') {
    registerCommand(command);
    return;
  }

  if (command.aliases) {
    command.aliases.forEach(alias => {
      qualifiedCommands.set(`${groupName}:${alias}`, command);
    });
  }

  logger.debug(`命令已注册: ${qualifiedName}`);
}

export function getCommand(name: string): CLICommand | undefined {
  return registeredCommands.get(name);
}

export function getGroupCommand(
  groupName: string,
  commandName: string
): CLICommand | undefined {
  return qualifiedCommands.get(`${groupName}:${commandName}`);
}

export function getAllCommands(): CLICommand[] {
  const uniqueCommands = new Set(registeredCommands.values());
  return Array.from(uniqueCommands);
}

export function getCommandGroup(name: string): CLICommandGroup | undefined {
  return registeredGroups.get(name);
}

export function getAllCommandGroups(): CLICommandGroup[] {
  return Array.from(registeredGroups.values());
}

export function clearCommands(): void {
  registeredCommands.clear();
  registeredGroups.clear();
  qualifiedCommands.clear();
  logger.debug('所有命令已清除');
}

export function createCommand(
  name: string,
  description: string,
  handler: CLICommandHandler,
  options?: { usage?: string; aliases?: string[]; examples?: string[] }
): CLICommand {
  return {
    name,
    description,
    handler,
    ...options,
  };
}
