import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => ({
  config: {
    load: vi.fn(async () => undefined),
    save: vi.fn(async () => undefined),
    get: vi.fn((key: string) => key === 'profile' ? {
      baseUrl: 'https://api.example.com', token: 'token-1', teamId: 'TEAM1', projectId: 'BOOK1', output: 'json',
    } : {}),
    set: vi.fn(),
    getAll: vi.fn(() => ({})),
  },
}));

const spies = {
  projectCreate: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'BOOK1' } })),
  projectUpdate: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'BOOK1' } })),
  pageInfo: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'PAGE1' } })),
  pageList: vi.fn(async () => ({ code: 1000, message: 'success', data: { pages: [{ id: 'page-1' }], scenes: {} } })),
  pageCreate: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'PAGE1' } })),
  pageUpdate: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'PAGE1' } })),
  pageDelete: vi.fn(async () => ({ code: 1000, message: 'success', data: true })),
};

vi.mock('../../src/sdk/book', () => ({
  BookSDK: class {
    project = { create: spies.projectCreate, update: spies.projectUpdate };
    page = {
      info: spies.pageInfo,
      list: spies.pageList,
      create: spies.pageCreate,
      update: spies.pageUpdate,
      delete: spies.pageDelete,
    };
  },
}));

describe('Book commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
    process.exitCode = 0;
  });

  it('registers project and page commands under book', async () => {
    const { registerCommands } = await import('../../src/commands');
    registerCommands();

    expect(getCommandGroup('book')?.commands.map(command => command.name)).toEqual(['project', 'page']);
  });

  it('creates a book page using a JSON editor snapshot', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerCommands();

    await getCommandGroup('book')?.commands.find(command => command.name === 'page')?.handler([
      'create',
      '--project-type', 'magazine', '--title', '首页', '--draft-snapshot', '{"pages":[],"scenes":{}}',
    ]);

    expect(spies.pageCreate).toHaveBeenCalledWith('TEAM1', 'BOOK1', {
      projectType: 'magazine', title: '首页', draftSnapshot: { pages: [], scenes: {} },
    });
    logSpy.mockRestore();
  });

  it('lists all pages in a book project', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerCommands();

    await getCommandGroup('book')?.commands.find(command => command.name === 'page')?.handler(['list']);

    expect(spies.pageList).toHaveBeenCalledWith('TEAM1', 'BOOK1');
    logSpy.mockRestore();
  });

  it('creates and updates a book project through the book command group', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerCommands();
    const projectCommand = getCommandGroup('book')?.commands.find(command => command.name === 'project');

    await projectCommand?.handler(['create', '--name', '产品画册', '--project-type', 'magazine']);
    await projectCommand?.handler(['update', '--project-id', 'BOOK1', '--name', '新版画册']);

    expect(spies.projectCreate).toHaveBeenCalledWith('TEAM1', {
      name: '产品画册', projectType: 'magazine',
    });
    expect(spies.projectUpdate).toHaveBeenCalledWith('TEAM1', 'BOOK1', { name: '新版画册' });
    logSpy.mockRestore();
  });

  it('updates a book page with base revision for conflict checking', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerCommands();

    await getCommandGroup('book')?.commands.find(command => command.name === 'page')?.handler([
      'update',
      '--page-id', 'PAGE1', '--base-revision', '3', '--draft-snapshot', '{"pages":[],"scenes":{"home":{}}}',
    ]);

    expect(spies.pageUpdate).toHaveBeenCalledWith('TEAM1', 'BOOK1', {
      documentId: 'PAGE1', baseRevision: 3, draftSnapshot: { pages: [], scenes: { home: {} } },
    });
    logSpy.mockRestore();
  });

  it('deletes a book page through the archive endpoint', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerCommands();

    await getCommandGroup('book')?.commands.find(command => command.name === 'page')?.handler([
      'delete', '--page-id', 'PAGE1',
    ]);

    expect(spies.pageDelete).toHaveBeenCalledWith('TEAM1', 'BOOK1', 'PAGE1');
    logSpy.mockRestore();
  });
});
