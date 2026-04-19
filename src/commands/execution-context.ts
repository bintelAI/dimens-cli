import { getAllSkills } from '../skills';

interface CommandExecutionContext {
  groupName?: string;
  commandName?: string;
}

let currentContext: CommandExecutionContext = {};

export function setExecutionContext(context: CommandExecutionContext): void {
  currentContext = context;
}

export function clearExecutionContext(): void {
  currentContext = {};
}

export function getExecutionContext(): CommandExecutionContext {
  return currentContext;
}

export function getRelatedSkillsForExecutionContext(): string[] {
  const { groupName, commandName } = currentContext;
  if (!groupName) {
    return [];
  }

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

export function getRelatedSkillObjectsForExecutionContext() {
  const relatedSkillNames = new Set(getRelatedSkillsForExecutionContext());
  return getAllSkills().filter(skill => relatedSkillNames.has(skill.name));
}
