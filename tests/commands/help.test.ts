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
    expect(output).toContain('dimens-manager');
    expect(output).toContain('dimens-manager');
    logSpy.mockRestore();
  });

  it('should print skill group in root help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('skill');
    expect(output).toContain('upload');
    expect(output).toContain('技能查看与提示语文档');
    expect(output).toContain('使用 "help skill"');
    logSpy.mockRestore();
  });

  it('should print upload command group help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['upload']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令组: upload');
    expect(output).toContain('file');
    expect(output).toContain('dimens-manager');
    logSpy.mockRestore();
  });

  it('should print related skills for command help', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['ai', 'chat-completions']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: ai chat-completions');
    expect(output).toContain('相关 Skill');
    expect(output).toContain('dimens-manager');
    logSpy.mockRestore();
  });

  it('should print sheet create help with folder usage examples', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['sheet', 'create']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: sheet create');
    expect(output).toContain('--type sheet|folder|document|report|canvas');
    expect(output).toContain('客户中心 --type folder');
    expect(output).toContain('--folder-id folder_customer');
    expect(output).toContain('sheet tree --project-id PROJ1');
    logSpy.mockRestore();
  });

  it('should print sheet group help with menu tree semantics', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['sheet']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令组: sheet');
    expect(output).toContain('项目菜单与多维表资源管理');
    expect(output).toContain('create');
    expect(output).toContain('获取项目菜单树');
    logSpy.mockRestore();
  });

  it('should print sheet tree help with menu lookup examples', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['sheet', 'tree']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: sheet tree');
    expect(output).toContain('获取项目菜单树，回查目录与资源归位');
    expect(output).toContain('sheet tree --project-id PROJ1');
    expect(output).toContain('sheet tree --app-url https://dimens.bintelai.com/#/TEAM1/PROJ1/');
    logSpy.mockRestore();
  });

  it('should print sheet list help with resource type note', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['sheet', 'list']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: sheet list');
    expect(output).toContain('获取项目下的资源列表');
    expect(output).toContain('sheet / folder / document / report');
    logSpy.mockRestore();
  });

  it('should print sheet info help with resource node semantics', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['sheet', 'info']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: sheet info');
    expect(output).toContain('获取资源节点详情，可用于目录、表格、文档、报表');
    expect(output).toContain('sheet info folder_customer --team-id TEAM1 --project-id PROJ1');
    logSpy.mockRestore();
  });

  it('should print sheet update help with menu impact semantics', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['sheet', 'update']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: sheet update');
    expect(output).toContain('目录节点也会影响项目菜单层');
    expect(output).toContain('sheet update folder_customer --team-id TEAM1 --project-id PROJ1 --name 客户中心');
    logSpy.mockRestore();
  });

  it('should print sheet delete help with menu impact semantics', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await getCommand('help')?.handler(['sheet', 'delete']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令: sheet delete');
    expect(output).toContain('目录节点删除会影响项目菜单层');
    expect(output).toContain('sheet delete folder_customer --team-id TEAM1 --project-id PROJ1');
    logSpy.mockRestore();
  });
});
