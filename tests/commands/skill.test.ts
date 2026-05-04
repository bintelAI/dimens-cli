import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://dimens.bintelai.com',
      output: 'table',
    },
    skills: {},
    preferences: {},
  };

  return {
    config: {
      load: vi.fn(async () => undefined),
      save: vi.fn(async () => undefined),
      get: vi.fn((key: keyof typeof store) => store[key]),
      set: vi.fn(),
      getAll: vi.fn(() => store),
    },
  };
});

describe('Skill Commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
  });

  it('should list discovered skills', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'list'
    );

    await command?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('dimens-manager');
    expect(output).toContain('dimens-manager');
    expect(output).toContain('dimens-manager');
    logSpy.mockRestore();
  });

  it('should print skill info', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'info'
    );

    await command?.handler(['dimens-manager']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('dimens-manager');
    expect(output).toContain('references');
    expect(output).toContain('命令组');
    expect(output).toContain('column');
    expect(output).toContain('SDK');
    expect(output).toContain('RowSDK');
    expect(output).toContain('CanvasSDK');
    logSpy.mockRestore();
  });

  it('should print system orchestrator skill info', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'info'
    );

    await command?.handler(['dimens-system-orchestrator']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('dimens-system-orchestrator');
    expect(output).toContain('skill recommend');
    expect(output).toContain('system_decomposition');
    expect(output).toContain('推荐关键词示例');
    expect(output).toContain('帮我生成一个客户管理系统');
    logSpy.mockRestore();
  });

  it('should show system orchestrator canvas guidance in references', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'show'
    );

    await command?.handler(['dimens-system-orchestrator', '--references']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('系统级画布说明');
    expect(output).toContain('系统级节点职责与用法');
    expect(output).toContain('每个节点必须能说清业务职责');
    expect(output).toContain('CUSTOM_AGENT` 是画布内 AI 智能体，不要滥用');
    expect(output).toContain('"version": "1.0"');
    expect(output).toContain('"timestamp"');
    expect(output).toContain('style.width/height');
    expect(output).toContain('sourceHandle');
    expect(output).toContain('targetHandle');
    expect(output).toContain('arrowclosed');
    expect(output).toContain('type: "default"');
    expect(output).toContain('type: "smoothstep"');
    expect(output).toContain('PPT 画布要求 `16:9`');
    expect(output).toContain('一页 PPT 对应一个分区');
    expect(output).toContain('PPT 演示稿画布');
    expect(output).toContain('每页推荐 `1280 x 720`');
    expect(output).toContain('INFOGRAPHIC');
    expect(output).toContain('data.infographicSyntax');
    expect(output).toContain('AntV Infographic DSL');
    expect(output).toContain('PARALLELOGRAM');
    expect(output).toContain('CYLINDER');
    expect(output).toContain('CUSTOM_AGENT');
    expect(output).toContain('dimens-manager/references/canvas/references/generation-guide.md');
    logSpy.mockRestore();
  });

  it('should print project skill info', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'info'
    );

    await command?.handler(['dimens-manager']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('dimens-manager');
    expect(output).toContain('project');
    expect(output).toContain('sheet create');
    expect(output).toContain('doc create');
    expect(output).toContain('doc info');
    expect(output).toContain('doc update');
    expect(output).toContain('doc delete');
    expect(output).toContain('doc versions');
    expect(output).toContain('doc version');
    expect(output).toContain('doc restore');
    expect(output).toContain('upload file');
    expect(output).toContain('ProjectSDK');
    expect(output).toContain('UploadSDK');
    expect(output).toContain('dimens-manager/references/project/references/bootstrap-flow.md');
    logSpy.mockRestore();
  });

  it('should show skill content with references', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'show'
    );

    await command?.handler(['dimens-manager', '--references']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('维表智联业务管理技能');
    expect(output).toContain('dimens-manager/references/workflow/references/model-routing.md');
    expect(output).toContain('dimens-manager/references/canvas/references/command-mapping.md');
    logSpy.mockRestore();
  });

  it('should show manager canvas node usage guidance in references', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'show'
    );

    await command?.handler(['dimens-manager', '--references']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('dimens-manager/references/canvas/references/generation-guide.md');
    expect(output).toContain('节点类型详解');
    expect(output).toContain('流程节点选型');
    expect(output).toContain('每个节点必须说明业务职责');
    expect(output).toContain('可渲染字段模板');
    expect(output).toContain('positionAbsolute');
    expect(output).toContain('sourceHandle');
    expect(output).toContain('targetHandle');
    expect(output).toContain('markerEnd');
    expect(output).toContain('arrowclosed');
    expect(output).toContain('style.stroke');
    expect(output).toContain('type: "default"');
    expect(output).toContain('type: "smoothstep"');
    expect(output).toContain('source-bottom');
    expect(output).toContain('target-top');
    expect(output).toContain('"version": "1.0"');
    expect(output).toContain('"timestamp"');
    expect(output).toContain('--team-id <teamId> --project-id <projectId>');
    expect(output).toContain('width=150');
    expect(output).toContain('PPT / 演示稿画布规则');
    expect(output).toContain('PPT 画布必须是 `16:9` 比例');
    expect(output).toContain('一页 PPT 对应一个 `SECTION`');
    expect(output).toContain('1280 x 720');
    expect(output).toContain('parentNode: "<slide_section_id>"');
    expect(output).toContain('slide_01');
    expect(output).toContain('PPT 演示稿画布');
    expect(output).toContain('slideRule');
    expect(output).toContain('INFOGRAPHIC');
    expect(output).toContain('信息图节点');
    expect(output).toContain('data.infographicSyntax');
    expect(output).toContain('AntV Infographic DSL');
    expect(output).toContain('infographic list-row-horizontal-icon-arrow');
    expect(output).toContain('客户增长路径信息图');
    expect(output).toContain('infographicRule');
    expect(output).toContain('PARALLELOGRAM');
    expect(output).toContain('CYLINDER');
    expect(output).toContain('CUSTOM_AGENT');
    expect(output).toContain('不要把它当成普通“AI 分析步骤”滥用');
    logSpy.mockRestore();
  });

  it('should print skill list in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'list'
    );

    await command?.handler(['--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('"success": true');
    expect(output).toContain('"name": "dimens-manager"');
    logSpy.mockRestore();
  });

  it('should print skill info in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'info'
    );

    await command?.handler(['dimens-manager', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('"name": "dimens-manager"');
    expect(output).toContain('"commands"');
    expect(output).toContain('"sdkModules"');
    expect(output).toContain('"recommendExamples"');
    expect(output).toContain('"api-key token 第三方鉴权"');
    expect(output).toContain('"信息图 PPT 复杂展示"');
    logSpy.mockRestore();
  });

  it('should show mapping only', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'show'
    );

    await command?.handler(['dimens-manager', '--mapping-only']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('命令组');
    expect(output).toContain('sheet');
    expect(output).not.toContain('# 多维表格技能');
    logSpy.mockRestore();
  });

  it('should show references only', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'show'
    );

    await command?.handler(['dimens-manager', '--references-only']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('dimens-manager/references/workflow/references/model-routing.md');
    expect(output).not.toContain('# 维表智联业务管理技能（dimens-manager）');
    logSpy.mockRestore();
  });

  it('should recommend skills from free text', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['工作流', '默认模型', 'AI', '分析']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('推荐 Skill');
    expect(output).toContain('dimens-manager');
    logSpy.mockRestore();
  });

  it('should recommend system orchestrator for system generation text', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['生成一个客户管理系统']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('推荐 Skill');
    expect(output).toContain('dimens-system-orchestrator');
    logSpy.mockRestore();
  });

  it('should rank system orchestrator first for project management platform text', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['帮我做一个项目管理平台', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-system-orchestrator');
    expect(payload.data[0]?.matchedBy).toContain('system-build-intent');
    expect(payload.data[0]?.reason).toContain('系统建设意图');
    logSpy.mockRestore();
  });

  it('should rank system orchestrator first for approval system text', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['生成一个审批系统', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-system-orchestrator');
    expect(payload.data[0]?.matchedBy).toContain('system-build-intent');
    logSpy.mockRestore();
  });

  it('should rank system orchestrator first for approval system with canvas text', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['生成一个带业务场景画布的审批系统', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-system-orchestrator');
    expect(payload.data[0]?.matchedBy).toContain('system-build-intent');
    expect(payload.data[0]?.reason).toContain('系统建设意图');
    logSpy.mockRestore();
  });

  it('should rank system orchestrator first for customer management system text', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['帮我生成一个客户管理系统', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-system-orchestrator');
    expect(payload.data[0]?.matchedBy).toContain('system-build-intent');
    logSpy.mockRestore();
  });

  it('should not include flag values in recommend query text', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['帮我生成一个客户管理系统', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-system-orchestrator');
    expect(payload.data[0]?.score).toBe(22);
    expect(payload.data[0]?.matchedBy).toContain('system-build-intent');
    logSpy.mockRestore();
  });

  it('should explain workflow intent in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['工作流', '默认模型', 'AI', '分析', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('workflow-intent');
    expect(payload.data[0]?.reason).toContain('工作流意图');
    logSpy.mockRestore();
  });

  it('should route approval workflow generation to manager workflow intent', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['AI', '自动生成审批工作流', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('workflow-intent');
    expect(payload.data[0]?.reason).toContain('工作流意图');
    logSpy.mockRestore();
  });

  it('should route canvas intent to manager in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['AI', '一键生成', '业务工作流画布', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('canvas-intent');
    expect(payload.data[0]?.reason).toContain('画布意图');
    logSpy.mockRestore();
  });

  it('should route ppt canvas intent to manager in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['创建', 'PPT', '演示稿画布', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('canvas-intent');
    expect(payload.data[0]?.reason).toContain('画布意图');
    logSpy.mockRestore();
  });

  it('should route infographic canvas intent to manager in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['信息图', 'PPT', '复杂展示', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('canvas-intent');
    expect(payload.data[0]?.reason).toContain('画布意图');
    logSpy.mockRestore();
  });

  it('should explain auth intent in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['api-key', 'token', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('auth-intent');
    expect(payload.data[0]?.reason).toContain('鉴权接入意图');
    logSpy.mockRestore();
  });

  it('should explain table intent in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['多维表格', '字段', 'row', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('table-intent');
    expect(payload.data[0]?.reason).toContain('多维表格意图');
    logSpy.mockRestore();
  });

  it('should explain permission intent in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['行级权限', '公开访问', '只读', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('permission-intent');
    expect(payload.data[0]?.reason).toContain('权限意图');
    logSpy.mockRestore();
  });

  it('should explain report intent in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['报表', '图表', '参数筛选', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = String(logSpy.mock.calls.at(-1)?.[0] ?? '');
    const payload = JSON.parse(output);
    expect(payload.data[0]?.skill?.name).toBe('dimens-manager');
    expect(payload.data[0]?.matchedBy).toContain('report-intent');
    expect(payload.data[0]?.reason).toContain('报表意图');
    logSpy.mockRestore();
  });

  it('should recommend skills in json mode', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('skill')?.commands.find(
      item => item.name === 'recommend'
    );

    await command?.handler(['api-key', 'token', '--output', 'json']);

    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('"success": true');
    expect(output).toContain('"dimens-manager"');
    expect(output).toContain('"matchedBy"');
    expect(output).toContain('"reason"');
    logSpy.mockRestore();
  });
});
