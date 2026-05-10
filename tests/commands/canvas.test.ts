import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://api.example.com',
      token: 'token-1',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
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

const canvasSdkSpies = {
  create: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { sheetId: 'canvas_1', canvasId: 'canvas_1', name: '业务流程画布' },
  })),
  info: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { canvasId: 'canvas_1', sheetId: 'canvas_1', version: 1 },
  })),
  save: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { canvasId: 'canvas_1', sheetId: 'canvas_1', version: 2 },
  })),
  versions: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { list: [], pagination: { page: 1, size: 20, total: 0 } },
  })),
  version: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { canvasId: 'canvas_1', sheetId: 'canvas_1', version: 1 },
  })),
  restore: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { canvasId: 'canvas_1', sheetId: 'canvas_1', version: 3 },
  })),
  listMineResources: vi.fn(async () => ({ code: 1000, message: 'success', data: [] })),
  saveMineResource: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { id: 'res_1', name: '审批节点', nodes: [], edges: [] },
  })),
  removeMineResource: vi.fn(async () => ({ code: 1000, message: 'success', data: true })),
  publishMineResource: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { id: 'res_1', name: '审批节点', nodes: [], edges: [], visibility: 'market' },
  })),
  listMarketResources: vi.fn(async () => ({ code: 1000, message: 'success', data: [] })),
};

vi.mock('../../src/sdk/canvas', () => {
  return {
    CanvasSDK: class {
      async create(...args: unknown[]) {
        return canvasSdkSpies.create(...args);
      }
      async info(...args: unknown[]) {
        return canvasSdkSpies.info(...args);
      }
      async save(...args: unknown[]) {
        return canvasSdkSpies.save(...args);
      }
      async versions(...args: unknown[]) {
        return canvasSdkSpies.versions(...args);
      }
      async version(...args: unknown[]) {
        return canvasSdkSpies.version(...args);
      }
      async restore(...args: unknown[]) {
        return canvasSdkSpies.restore(...args);
      }
      async listMineResources(...args: unknown[]) {
        return canvasSdkSpies.listMineResources(...args);
      }
      async saveMineResource(...args: unknown[]) {
        return canvasSdkSpies.saveMineResource(...args);
      }
      async removeMineResource(...args: unknown[]) {
        return canvasSdkSpies.removeMineResource(...args);
      }
      async publishMineResource(...args: unknown[]) {
        return canvasSdkSpies.publishMineResource(...args);
      }
      async listMarketResources(...args: unknown[]) {
        return canvasSdkSpies.listMarketResources(...args);
      }
    },
  };
});

const validCanvasGraph = {
  version: '1.0',
  timestamp: 1777800000000,
  nodes: [
    {
      id: 'start',
      type: 'PARALLELOGRAM',
      position: { x: 0, y: 0 },
      positionAbsolute: { x: 0, y: 0 },
      width: 150,
      height: 80,
      selected: false,
      dragging: false,
      style: { width: 150, height: 80 },
      data: {
        label: '提交申请',
        backgroundColor: '#f8fafc',
        width: 150,
        height: 80,
        align: 'center',
        verticalAlign: 'center',
      },
    },
    {
      id: 'archive',
      type: 'CYLINDER',
      position: { x: 0, y: 160 },
      positionAbsolute: { x: 0, y: 160 },
      width: 150,
      height: 80,
      selected: false,
      dragging: false,
      style: { width: 150, height: 80 },
      data: {
        label: '写入申请表',
        backgroundColor: '#f8fafc',
        width: 150,
        height: 80,
        align: 'center',
        verticalAlign: 'center',
      },
    },
  ],
  edges: [
    {
      id: 'edge_start_archive',
      source: 'start',
      target: 'archive',
      sourceHandle: 'source-bottom',
      targetHandle: 'target-top',
      type: 'default',
      animated: false,
      selected: false,
      zIndex: 0,
      markerEnd: { type: 'arrowclosed', color: '#94a3b8' },
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

describe('Canvas Commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
  });

  it('should create a canvas resource', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('canvas')?.commands.find(item => item.name === 'create');

    await command?.handler([
      '--name',
      '业务流程画布',
      '--data',
      JSON.stringify(validCanvasGraph),
    ]);

    expect(canvasSdkSpies.create).toHaveBeenCalledWith('PROJ1', {
      name: '业务流程画布',
      data: validCanvasGraph,
    });
    expect(logSpy.mock.calls.flat().join('\n')).toContain('画布创建成功');
    logSpy.mockRestore();
  });

  it('should save a canvas graph', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('canvas')?.commands.find(item => item.name === 'save');

    await command?.handler([
      'canvas_1',
      '--base-version',
      '1',
      '--data',
      JSON.stringify(validCanvasGraph),
      '--summary',
      'AI生成业务工作流',
    ]);

    expect(canvasSdkSpies.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      sheetId: 'canvas_1',
      data: validCanvasGraph,
      baseVersion: 1,
      changeSummary: 'AI生成业务工作流',
    });
    expect(logSpy.mock.calls.flat().join('\n')).toContain('画布保存成功');
    logSpy.mockRestore();
  });

  it('should save a reusable canvas resource', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('canvas')?.commands.find(
      item => item.name === 'resource-save'
    );

    await command?.handler([
      '--name',
      '审批节点',
      '--nodes',
      JSON.stringify(validCanvasGraph.nodes),
      '--edges',
      JSON.stringify(validCanvasGraph.edges),
      '--tags',
      '审批,工作流',
    ]);

    expect(canvasSdkSpies.saveMineResource).toHaveBeenCalledWith('TEAM1', {
      projectId: 'PROJ1',
      name: '审批节点',
      nodes: validCanvasGraph.nodes,
      edges: validCanvasGraph.edges,
      tags: ['审批', '工作流'],
    });
    expect(logSpy.mock.calls.flat().join('\n')).toContain('画布资源保存成功');
    logSpy.mockRestore();
  });

  it('should validate a renderable canvas graph', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('canvas')?.commands.find(item => item.name === 'validate');

    await command?.handler(['--data', JSON.stringify(validCanvasGraph)]);

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('画布数据校验通过');
    expect(output).toContain('"nodeCount": 2');
    expect(output).toContain('"edgeCount": 1');
    logSpy.mockRestore();
  });

  it('should reject an incomplete canvas graph before save', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('canvas')?.commands.find(item => item.name === 'save');

    await command?.handler([
      'canvas_1',
      '--base-version',
      '1',
      '--data',
      '{"nodes":[{"id":"start"}],"edges":[]}',
    ]);

    expect(canvasSdkSpies.save).not.toHaveBeenCalled();
    expect(logSpy.mock.calls.flat().join('\n')).toContain('画布数据校验失败');
    logSpy.mockRestore();
  });

  it('should reject dark node background colors', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const darkGraph = structuredClone(validCanvasGraph);
    darkGraph.nodes[0].data.backgroundColor = '#000000';

    registerCommands();
    const command = getCommandGroup('canvas')?.commands.find(item => item.name === 'validate');

    await command?.handler(['--data', JSON.stringify(darkGraph)]);

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('画布数据校验失败');
    expect(output).toContain('data.backgroundColor');
    logSpy.mockRestore();
  });
});
