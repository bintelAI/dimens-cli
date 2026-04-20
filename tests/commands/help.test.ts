import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearCommands,
  getCommand,
} from '../../src/commands/registry';
import { registerCommands } from '../../src/commands';

describe('Help Command', () => {
  beforeEach(() => {
    clearCommands();
    registerCommands();
  });

  it('should print command group help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await getCommand('help')?.handler(['project']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令组: project');
    expect(output).toContain('相关 Skill');
    expect(output).toContain('dimens-team');
    expect(output).toContain('dimens-project');
    logSpy.mockRestore();
  });

  it('should print skill group in root help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('skill');
    expect(output).toContain('技能查看与提示语文档');
    expect(output).toContain('使用 "help skill"');
    logSpy.mockRestore();
  });

  it('should print related skills for command help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['ai', 'chat-completions']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: ai chat-completions');
    expect(output).toContain('相关 Skill');
    expect(output).toContain('dimens-workflow');
    logSpy.mockRestore();
  });
});
