import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCommands,
  createCommand,
  createCommandGroup,
  getCommandGroup,
  registerGroupCommand,
} from '../../src/commands/registry';

describe('Command Registry', () => {
  beforeEach(() => {
    clearCommands();
  });

  it('should register command groups', () => {
    createCommandGroup('project', '项目管理');
    const group = getCommandGroup('project');
    expect(group?.name).toBe('project');
  });

  it('should register command into group', () => {
    createCommandGroup('project', '项目管理');
    registerGroupCommand(
      'project',
      createCommand('list', '获取项目列表', async () => undefined)
    );

    const group = getCommandGroup('project');
    expect(group?.commands).toHaveLength(1);
    expect(group?.commands[0]?.name).toBe('list');
  });
});
