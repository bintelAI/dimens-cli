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
      set: vi.fn((key: keyof typeof store, value: unknown) => {
        (store as Record<string, unknown>)[key] = value;
      }),
      getAll: vi.fn(() => store),
    },
  };
});

vi.mock('../../src/sdk/sheet', () => {
  return {
    SheetSDK: class {
      async list() {
        return { code: 1000, message: 'success', data: [{ id: 'S1', name: '表1' }] };
      }
      async structure() {
        return { code: 1000, message: 'success', data: { id: 'S1', columns: [] } };
      }
      async create() {
        return { code: 1000, message: 'success', data: { id: 'S1', name: '表1' } };
      }
      async update() {
        return { code: 1000, message: 'success', data: { id: 'S1', name: '表1' } };
      }
      async delete() {
        return { code: 1000, message: 'success', data: true };
      }
    },
  };
});

const viewSdkSpies = {
  list: vi.fn(async () => ({ code: 1000, message: 'success', data: [{ viewId: 'view_1', name: '默认视图' }] })),
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { viewId: 'view_1', name: '默认视图' } })),
};

vi.mock('../../src/sdk/view', () => {
  return {
    ViewSDK: class {
      async list(...args: unknown[]) {
        return viewSdkSpies.list(...args);
      }
      async create(...args: unknown[]) {
        return viewSdkSpies.create(...args);
      }
    },
  };
});

vi.mock('../../src/sdk/column', () => {
  return {
    ColumnSDK: class {
      async list() {
        return { code: 1000, message: 'success', data: [{ id: 'F1', title: '名称' }] };
      }
      async create() {
        return { code: 1000, message: 'success', data: { id: 'F1', title: '名称' } };
      }
      async update() {
        return { code: 1000, message: 'success', data: { id: 'F1', title: '名称' } };
      }
      async delete() {
        return { code: 1000, message: 'success', data: true };
      }
    },
  };
});

const columnSdkSpies = {
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'F1', title: '名称' } })),
};

const rowSdkSpies = {
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'R1' } })),
  update: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'R1' } })),
  updateCell: vi.fn(async () => ({ code: 1000, message: 'success', data: true })),
};

vi.mock('../../src/sdk/row', () => {
  return {
    RowSDK: class {
      async list() {
        return { code: 1000, message: 'success', data: [{ id: 'R1' }] };
      }
      async page() {
        return { code: 1000, message: 'success', data: { list: [{ id: 'R1' }], total: 1 } };
      }
      async create(...args: unknown[]) {
        return rowSdkSpies.create(...args);
      }
      async update(...args: unknown[]) {
        return rowSdkSpies.update(...args);
      }
      async updateCell(...args: unknown[]) {
        return rowSdkSpies.updateCell(...args);
      }
    },
  };
});

describe('Sheet Column Row Commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
    columnSdkSpies.create.mockClear();
    rowSdkSpies.create.mockClear();
    rowSdkSpies.update.mockClear();
    rowSdkSpies.updateCell.mockClear();
    viewSdkSpies.list.mockClear();
    viewSdkSpies.create.mockClear();
  });

  it('should register and execute sheet list command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const sheetList = getCommandGroup('sheet')?.commands.find(command => command.name === 'list');
    await sheetList?.handler([]);

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute column list command from group', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const columnList = getCommandGroup('column')?.commands.find(command => command.name === 'list');
    await columnList?.handler(['--sheet-id', 'S1']);

    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute relation column create command with relationConfig payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F2' } });
      });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createColumn = getCommandGroup('column')?.commands.find(
      command => command.name === 'create'
    );
    await createColumn?.handler([
      '--sheet-id',
      'S1',
      '--label',
      '班级',
      '--type',
      'relation',
      '--target-sheet-id',
      'sh_target',
      '--display-column-id',
      'fld_name',
      '--bidirectional',
      'false',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(columnSdkSpies.create).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      label: '班级',
      type: 'relation',
      config: {
        relationConfig: {
          targetSheetId: 'sh_target',
          displayColumnId: 'fld_name',
          bidirectional: false,
        },
      },
    });
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should execute row set-cell command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const setCell = getCommandGroup('row')?.commands.find(
      command => command.name === 'set-cell'
    );
    await setCell?.handler([
      '--sheet-id',
      'S1',
      '--row-id',
      'R1',
      '--field-id',
      'F1',
      '--value',
      'hello',
      '--version',
      '2',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(rowSdkSpies.updateCell).toHaveBeenCalledWith('S1', {
      rowId: 'R1',
      fieldId: 'F1',
      value: 'hello',
      version: 2,
    });
    logSpy.mockRestore();
  });

  it('should execute row create command with data payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createRow = getCommandGroup('row')?.commands.find(command => command.name === 'create');
    await createRow?.handler([
      '--sheet-id',
      'S1',
      '--values',
      '{"fld_customer":"华东智造"}',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(rowSdkSpies.create).toHaveBeenCalledWith('S1', {
      data: { fld_customer: '华东智造' },
    });
    logSpy.mockRestore();
  });

  it('should execute row update command with data payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateRow = getCommandGroup('row')?.commands.find(command => command.name === 'update');
    await updateRow?.handler([
      '--sheet-id',
      'S1',
      '--row-id',
      'R1',
      '--version',
      '3',
      '--values',
      '{"fld_customer":"华东智造"}',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(rowSdkSpies.update).toHaveBeenCalledWith(
      'S1',
      'R1',
      { fld_customer: '华东智造' },
      3
    );
    logSpy.mockRestore();
  });

  it('should execute view list command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const viewList = getCommandGroup('view')?.commands.find(command => command.name === 'list');
    await viewList?.handler(['--sheet-id', 'S1']);

    expect(logSpy).toHaveBeenCalled();
    expect(viewSdkSpies.list).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1');
    logSpy.mockRestore();
  });

  it('should execute create public default view command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const viewCreate = getCommandGroup('view')?.commands.find(command => command.name === 'create');
    await viewCreate?.handler([
      '--sheet-id',
      'S1',
      '--name',
      '默认视图',
      '--type',
      'grid',
      '--public',
      'true',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(viewSdkSpies.create).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      name: '默认视图',
      type: 'grid',
      isPublic: true,
      config: {
        filters: [],
        filterMatchType: 'and',
        sortRule: null,
        groupBy: [],
        hiddenColumnIds: [],
        rowHeight: 'medium',
      },
    });
    logSpy.mockRestore();
  });
});
