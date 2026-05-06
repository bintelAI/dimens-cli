import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

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

const sheetSdkSpies = {
  list: vi.fn(async () => ({ code: 1000, message: 'success', data: [{ id: 'S1', name: '表1' }] })),
  tree: vi.fn(async () => ({ code: 1000, message: 'success', data: [] })),
  info: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { id: 'S1', name: '旧名称' },
  })),
  structure: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      id: 'S1',
      columns: [
        {
          id: 'F_MULTI',
          label: '旧多选',
          type: 'multiSelect',
          config: {
            options: [{ id: 'opt_old', label: '旧选项', color: 'bg-slate-100 text-slate-700' }],
            dataSourceType: 'manual',
            dictionaryId: null,
          },
        },
      ],
    },
  })),
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'S1', name: '表1' } })),
  update: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'S1', name: '表1' } })),
  delete: vi.fn(async () => ({ code: 1000, message: 'success', data: true })),
};

vi.mock('../../src/sdk/sheet', () => {
  return {
    SheetSDK: class {
      async list(...args: unknown[]) {
        return sheetSdkSpies.list(...args);
      }
      async tree(...args: unknown[]) {
        return sheetSdkSpies.tree(...args);
      }
      async info(...args: unknown[]) {
        return sheetSdkSpies.info(...args);
      }
      async structure(...args: unknown[]) {
        return sheetSdkSpies.structure(...args);
      }
      async create(...args: unknown[]) {
        return sheetSdkSpies.create(...args);
      }
      async update(...args: unknown[]) {
        return sheetSdkSpies.update(...args);
      }
      async delete(...args: unknown[]) {
        return sheetSdkSpies.delete(...args);
      }
    },
  };
});

const viewSdkSpies = {
  list: vi.fn(async () => ({ code: 1000, message: 'success', data: [{ viewId: 'view_1', name: '默认视图' }] })),
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { viewId: 'view_1', name: '默认视图' } })),
};

const projectSdkSpies = {
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'P1', name: '客户管理系统' } })),
  info: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      id: 'P1',
      name: '项目1',
      remark: '旧备注',
      icon: 'https://api.example.com/old-icon.png',
      coverImage: 'https://api.example.com/old-cover.png',
    },
  })),
  update: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      id: 'P1',
      name: '项目1',
    },
  })),
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

vi.mock('../../src/sdk/project', () => {
  return {
    ProjectSDK: class {
      async page() {
        return { code: 1000, message: 'success', data: { list: [{ id: 'P1', name: '项目1' }], pagination: { page: 1, size: 20, total: 1 } } };
      }
      async info(...args: unknown[]) {
        return projectSdkSpies.info(...args);
      }
      async create(...args: unknown[]) {
        return projectSdkSpies.create(...args);
      }
      async update(...args: unknown[]) {
        return projectSdkSpies.update(...args);
      }
      async trash() {
        return { code: 1000, message: 'success', data: true };
      }
      async restore() {
        return { code: 1000, message: 'success', data: true };
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
  info: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      id: 'R1',
      fld_customer: '旧客户',
      fld_status: '待跟进',
    },
  })),
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'R1' } })),
  batchCreate: vi.fn(async (_sheetId: string, payload: { rows: unknown[] }) => ({
    code: 1000,
    message: 'success',
    data: payload.rows.map((_row, index) => ({ id: `R${index + 1}` })),
  })),
  update: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 'R1' } })),
  updateCell: vi.fn(async () => ({ code: 1000, message: 'success', data: true })),
};

const documentSdkSpies = {
  createWithSheet: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      sheet: { sheetId: 'DOC_SHEET_1', type: 'document', name: '在线文档' },
      document: { documentId: 'DOC_1', title: '在线文档', format: 'richtext', version: 1 },
    },
  })),
  info: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      documentId: 'DOC_1',
      title: '在线文档',
      content: '<p>hello tiptap</p>',
      format: 'richtext',
      version: 1,
    },
  })),
  getBySheetId: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      documentId: 'DOC_1',
      sheetId: 'sh_doc_1',
      title: '在线文档',
      content: '<p>hello tiptap</p>',
      format: 'richtext',
      version: 1,
    },
  })),
  update: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      documentId: 'DOC_1',
      version: 2,
    },
  })),
  delete: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  versions: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      list: [
        { version: 3, changeSummary: '补充说明' },
        { version: 2, changeSummary: '修正文案' },
      ],
      pagination: { page: 1, size: 20, total: 2 },
    },
  })),
  version: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      documentId: 'DOC_1',
      version: 3,
      content: '<p>历史版本</p>',
    },
  })),
  restore: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      documentId: 'DOC_1',
      version: 4,
    },
  })),
};

const uploadSdkSpies = {
  uploadFile: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      fileId: 'FILE_1',
      key: '/upload/20260421/demo.txt',
      url: 'https://api.example.com/upload/20260421/demo.txt',
      name: 'demo.txt',
      size: 5,
      type: 'text/plain',
      mimeType: 'text/plain',
      ext: '.txt',
    },
  })),
};

const reportSdkSpies = {
  list: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      list: [{ reportId: 'REPORT_1', name: '销售漏斗' }],
      pagination: { page: 1, size: 20, total: 1 },
    },
  })),
  create: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { reportId: 'REPORT_1' },
  })),
  createProjectReport: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { reportId: 'sh_report_1', sheetId: 'sh_report_1', name: '销售漏斗' },
  })),
  info: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      reportId: 'REPORT_1',
      name: '销售漏斗',
      description: '旧描述',
      type: 1,
    },
  })),
  update: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  copy: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { reportId: 'REPORT_2' },
  })),
  archive: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  sort: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  move: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  query: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      widget_1: [{ name: '张三', value: 10 }],
    },
  })),
  queryWidget: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: {
      data: [{ name: '张三', value: 10 }],
      total: 1,
    },
  })),
  preview: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: [{ name: '张三', value: 10 }],
  })),
  publish: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  delete: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  addWidget: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { widgetId: 'widget_1' },
  })),
  updateWidget: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  deleteWidget: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  batchWidgets: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
  validate: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { valid: true, errors: [] },
  })),
  sortWidget: vi.fn(async () => ({
    code: 1000,
    message: 'success',
    data: { success: true },
  })),
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
      async info(...args: unknown[]) {
        return rowSdkSpies.info(...args);
      }
      async create(...args: unknown[]) {
        return rowSdkSpies.create(...args);
      }
      async batchCreate(...args: unknown[]) {
        return rowSdkSpies.batchCreate(...args);
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

vi.mock('../../src/sdk/document', () => {
  return {
    DocumentSDK: class {
      async createWithSheet(...args: unknown[]) {
        return documentSdkSpies.createWithSheet(...args);
      }
      async info(...args: unknown[]) {
        return documentSdkSpies.info(...args);
      }
      async getBySheetId(...args: unknown[]) {
        return documentSdkSpies.getBySheetId(...args);
      }
      async update(...args: unknown[]) {
        return documentSdkSpies.update(...args);
      }
      async delete(...args: unknown[]) {
        return documentSdkSpies.delete(...args);
      }
      async versions(...args: unknown[]) {
        return documentSdkSpies.versions(...args);
      }
      async version(...args: unknown[]) {
        return documentSdkSpies.version(...args);
      }
      async restore(...args: unknown[]) {
        return documentSdkSpies.restore(...args);
      }
    },
  };
});

vi.mock('../../src/sdk/upload', () => {
  return {
    UploadSDK: class {
      async uploadFile(...args: unknown[]) {
        return uploadSdkSpies.uploadFile(...args);
      }
    },
  };
});

vi.mock('../../src/sdk/report', () => {
  return {
    ReportSDK: class {
      async list(...args: unknown[]) {
        return reportSdkSpies.list(...args);
      }
      async info(...args: unknown[]) {
        return reportSdkSpies.info(...args);
      }
      async create(...args: unknown[]) {
        return reportSdkSpies.create(...args);
      }
      async createProjectReport(...args: unknown[]) {
        return reportSdkSpies.createProjectReport(...args);
      }
      async update(...args: unknown[]) {
        return reportSdkSpies.update(...args);
      }
      async copy(...args: unknown[]) {
        return reportSdkSpies.copy(...args);
      }
      async archive(...args: unknown[]) {
        return reportSdkSpies.archive(...args);
      }
      async sort(...args: unknown[]) {
        return reportSdkSpies.sort(...args);
      }
      async move(...args: unknown[]) {
        return reportSdkSpies.move(...args);
      }
      async query(...args: unknown[]) {
        return reportSdkSpies.query(...args);
      }
      async queryWidget(...args: unknown[]) {
        return reportSdkSpies.queryWidget(...args);
      }
      async preview(...args: unknown[]) {
        return reportSdkSpies.preview(...args);
      }
      async publish(...args: unknown[]) {
        return reportSdkSpies.publish(...args);
      }
      async delete(...args: unknown[]) {
        return reportSdkSpies.delete(...args);
      }
      async addWidget(...args: unknown[]) {
        return reportSdkSpies.addWidget(...args);
      }
      async updateWidget(...args: unknown[]) {
        return reportSdkSpies.updateWidget(...args);
      }
      async deleteWidget(...args: unknown[]) {
        return reportSdkSpies.deleteWidget(...args);
      }
      async batchWidgets(...args: unknown[]) {
        return reportSdkSpies.batchWidgets(...args);
      }
      async validate(...args: unknown[]) {
        return reportSdkSpies.validate(...args);
      }
      async sortWidget(...args: unknown[]) {
        return reportSdkSpies.sortWidget(...args);
      }
    },
  };
});

describe('Sheet Column Row Commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
    projectSdkSpies.create.mockClear();
    projectSdkSpies.info.mockClear();
    projectSdkSpies.update.mockClear();
    sheetSdkSpies.list.mockClear();
    sheetSdkSpies.tree.mockClear();
    sheetSdkSpies.info.mockClear();
    sheetSdkSpies.structure.mockClear();
    sheetSdkSpies.create.mockClear();
    sheetSdkSpies.update.mockClear();
    sheetSdkSpies.delete.mockClear();
    columnSdkSpies.create.mockClear();
    rowSdkSpies.create.mockClear();
    rowSdkSpies.info.mockClear();
    rowSdkSpies.update.mockClear();
    rowSdkSpies.updateCell.mockClear();
    documentSdkSpies.createWithSheet.mockClear();
    documentSdkSpies.info.mockClear();
    documentSdkSpies.getBySheetId.mockClear();
    documentSdkSpies.update.mockClear();
    documentSdkSpies.delete.mockClear();
    documentSdkSpies.versions.mockClear();
    documentSdkSpies.version.mockClear();
    documentSdkSpies.restore.mockClear();
    uploadSdkSpies.uploadFile.mockClear();
    reportSdkSpies.list.mockClear();
    reportSdkSpies.create.mockClear();
    reportSdkSpies.createProjectReport.mockClear();
    reportSdkSpies.info.mockClear();
    reportSdkSpies.update.mockClear();
    reportSdkSpies.copy.mockClear();
    reportSdkSpies.archive.mockClear();
    reportSdkSpies.sort.mockClear();
    reportSdkSpies.move.mockClear();
    reportSdkSpies.query.mockClear();
    reportSdkSpies.queryWidget.mockClear();
    reportSdkSpies.preview.mockClear();
    reportSdkSpies.publish.mockClear();
    reportSdkSpies.delete.mockClear();
    reportSdkSpies.addWidget.mockClear();
    reportSdkSpies.updateWidget.mockClear();
    reportSdkSpies.deleteWidget.mockClear();
    reportSdkSpies.batchWidgets.mockClear();
    reportSdkSpies.validate.mockClear();
    reportSdkSpies.sortWidget.mockClear();
    viewSdkSpies.list.mockClear();
    viewSdkSpies.create.mockClear();
  });

  it('should execute project create command with description and project-type payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createProject = getCommandGroup('project')?.commands.find(
      command => command.name === 'create'
    );
    await createProject?.handler([
      '--team-id',
      'TEAM1',
      '--name',
      '客户管理系统',
      '--description',
      '客户全生命周期管理',
      '--project-type',
      'document',
    ]);

    expect(projectSdkSpies.create).toHaveBeenCalledWith('TEAM1', {
      name: '客户管理系统',
      description: '客户全生命周期管理',
      projectType: 'document',
    });
    logSpy.mockRestore();
  });

  it('should execute doc create command with createWithSheet payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'create');
    await createDoc?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--title',
      '在线文档',
      '--content',
      '<p>hello tiptap</p>',
      '--format',
      'richtext',
    ]);

    expect(documentSdkSpies.createWithSheet).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      title: '在线文档',
      content: '<p>hello tiptap</p>',
      format: 'richtext',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc info command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const infoDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'info');
    await infoDoc?.handler(['--team-id', 'TEAM1', '--project-id', 'PROJ1', '--document-id', 'DOC_1']);

    expect(documentSdkSpies.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'DOC_1');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc info command by sheet id flag', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const infoDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'info');
    await infoDoc?.handler(['--team-id', 'TEAM1', '--project-id', 'PROJ1', '--sheet-id', 'sh_doc_1']);

    expect(documentSdkSpies.getBySheetId).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'sh_doc_1');
    expect(documentSdkSpies.info).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc info command by positional sheet id', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const infoDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'info');
    await infoDoc?.handler(['--team-id', 'TEAM1', '--project-id', 'PROJ1', 'sh_doc_1']);

    expect(documentSdkSpies.getBySheetId).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'sh_doc_1');
    expect(documentSdkSpies.info).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc update command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'update');
    await updateDoc?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
      '--content',
      '<p>updated tiptap</p>',
      '--version',
      '1',
      '--create-version',
      'true',
      '--change-summary',
      '补充说明',
    ]);

    expect(documentSdkSpies.update).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      content: '<p>updated tiptap</p>',
      version: 1,
      createVersion: true,
      changeSummary: '补充说明',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc update command with mermaid richtext content', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const content = '<h1>审批流程</h1><pre data-type="mermaid"><code>flowchart TD\nA[提交] --> B[审批]</code></pre>';

    registerCommands();
    const updateDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'update');
    await updateDoc?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
      '--content',
      content,
      '--version',
      '2',
      '--create-version',
      'true',
      '--change-summary',
      '补充 Mermaid 流程图',
    ]);

    expect(documentSdkSpies.update).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      content,
      version: 2,
      createVersion: true,
      changeSummary: '补充 Mermaid 流程图',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc delete command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const deleteDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'delete');
    await deleteDoc?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
    ]);

    expect(documentSdkSpies.delete).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'DOC_1');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc versions command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const versionsDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'versions');
    await versionsDoc?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
      '--page',
      '1',
      '--size',
      '20',
    ]);

    expect(documentSdkSpies.versions).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      page: 1,
      size: 20,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc version command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const versionDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'version');
    await versionDoc?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
      '--version',
      '3',
    ]);

    expect(documentSdkSpies.version).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      version: 3,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc restore command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const restoreDoc = getCommandGroup('doc')?.commands.find(command => command.name === 'restore');
    await restoreDoc?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
      '--version',
      '3',
    ]);

    expect(documentSdkSpies.restore).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      version: 3,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc attach-file command by uploading file and appending attachment node', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    documentSdkSpies.info.mockResolvedValueOnce({
      code: 1000,
      message: 'success',
      data: {
        documentId: 'DOC_1',
        title: '在线文档',
        content: '<h1>项目说明</h1>',
        format: 'richtext',
        version: 3,
      },
    });

    registerCommands();
    const attachCommand = getCommandGroup('doc')?.commands.find(command => command.name === 'attach-file');
    await attachCommand?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
      '--file',
      '/tmp/demo.txt',
      '--title',
      '发布清单.pdf',
    ]);

    expect(uploadSdkSpies.uploadFile).toHaveBeenCalledWith('/tmp/demo.txt', {
      projectId: 'PROJ1',
      scene: 'document-attachment',
      teamId: 'TEAM1',
    });
    expect(documentSdkSpies.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'DOC_1');
    expect(documentSdkSpies.update).toHaveBeenCalledWith(
      'TEAM1',
      'PROJ1',
      expect.objectContaining({
        documentId: 'DOC_1',
        version: 3,
        createVersion: true,
      })
    );

    const updatePayload = documentSdkSpies.update.mock.calls.at(-1)?.[2] as {
      content: string;
      changeSummary?: string;
    };
    expect(updatePayload.content).toContain('data-attachment="true"');
    expect(updatePayload.content).toContain('发布清单.pdf');
    expect(updatePayload.content).toContain('https://api.example.com/upload/20260421/demo.txt');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute doc append-image command by uploading image and appending image node', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    documentSdkSpies.info.mockResolvedValueOnce({
      code: 1000,
      message: 'success',
      data: {
        documentId: 'DOC_1',
        title: '在线文档',
        content: '<h1>项目封面</h1>',
        format: 'richtext',
        version: 4,
      },
    });

    uploadSdkSpies.uploadFile.mockResolvedValueOnce({
      code: 1000,
      message: 'success',
      data: {
        fileId: 'FILE_IMG_1',
        key: '/upload/20260421/cover.png',
        url: 'https://api.example.com/upload/20260421/cover.png',
        name: 'cover.png',
        size: 1024,
        type: 'image/png',
        mimeType: 'image/png',
        ext: '.png',
      },
    });

    registerCommands();
    const appendImageCommand = getCommandGroup('doc')?.commands.find(
      command => command.name === 'append-image'
    );
    await appendImageCommand?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--document-id',
      'DOC_1',
      '--file',
      '/tmp/cover.png',
      '--alt',
      '系统封面图',
    ]);

    expect(uploadSdkSpies.uploadFile).toHaveBeenCalledWith('/tmp/cover.png', {
      projectId: 'PROJ1',
      scene: 'document-image',
      teamId: 'TEAM1',
    });
    expect(documentSdkSpies.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'DOC_1');
    expect(documentSdkSpies.update).toHaveBeenCalledWith(
      'TEAM1',
      'PROJ1',
      expect.objectContaining({
        documentId: 'DOC_1',
        version: 4,
        createVersion: true,
      })
    );

    const updatePayload = documentSdkSpies.update.mock.calls.at(-1)?.[2] as {
      content: string;
      changeSummary?: string;
    };
    expect(updatePayload.content).toContain('<img src="https://api.example.com/upload/20260421/cover.png"');
    expect(updatePayload.content).toContain('alt="系统封面图"');
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report create command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'create'
    );
    await createReport?.handler([
      '--project-id',
      'PROJ1',
      '--name',
      '销售漏斗',
      '--description',
      '月度销售漏斗',
    ]);

    expect(reportSdkSpies.create).not.toHaveBeenCalled();
    expect(reportSdkSpies.createProjectReport).toHaveBeenCalledWith('PROJ1', {
      name: '销售漏斗',
      description: '月度销售漏斗',
      dashboardId: expect.any(String),
      createdAt: expect.any(Number),
    });
    expect(logSpy).toHaveBeenCalled();
    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('reportId');
    logSpy.mockRestore();
  });

  it('should execute report update command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'update'
    );
    await updateReport?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--name',
      '销售漏斗-更新',
      '--description',
      '更新后的月度销售漏斗',
      '--type',
      '2',
    ]);

    expect(reportSdkSpies.info).toHaveBeenCalledWith('PROJ1', 'REPORT_1');
    expect(reportSdkSpies.update).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      name: '销售漏斗-更新',
      description: '更新后的月度销售漏斗',
      type: 2,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report copy command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const copyReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'copy'
    );
    await copyReport?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--name',
      '销售漏斗-副本',
    ]);

    expect(reportSdkSpies.copy).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      name: '销售漏斗-副本',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report archive command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const archiveReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'archive'
    );
    await archiveReport?.handler(['--project-id', 'PROJ1', '--report-id', 'REPORT_1']);

    expect(reportSdkSpies.archive).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report sort command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const sortReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'sort'
    );
    await sortReport?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--target-index',
      '2',
    ]);

    expect(reportSdkSpies.sort).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      targetIndex: 2,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report move command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const moveReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'move'
    );
    await moveReport?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--target-project-id',
      'PROJ2',
    ]);

    expect(reportSdkSpies.move).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      targetProjectId: 'PROJ2',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report query command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const queryReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'query'
    );
    await queryReport?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--params',
      '{"month":"2026-04"}',
      '--widget-ids',
      'widget_1,widget_2',
    ]);

    expect(reportSdkSpies.query).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      parameterValues: { month: '2026-04' },
      widgetIds: ['widget_1', 'widget_2'],
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report query-widget command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const queryWidget = getCommandGroup('report')?.commands.find(
      command => command.name === 'query-widget'
    );
    await queryWidget?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--widget-id',
      'widget_1',
      '--params',
      '{"month":"2026-04"}',
      '--data-source',
      '{"mode":"sheet"}',
      '--data-mapping',
      '{"nameKey":"名称","valueKey":"销售额"}',
    ]);

    expect(reportSdkSpies.queryWidget).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      widgetId: 'widget_1',
      parameterValues: { month: '2026-04' },
      dataSource: { mode: 'sheet' },
      dataMapping: { nameKey: '名称', valueKey: '销售额' },
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report preview command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const previewReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'preview'
    );
    await previewReport?.handler([
      '--project-id',
      'PROJ1',
      '--data-source',
      '{"mode":"sheet"}',
      '--data-mapping',
      '{"nameKey":"名称","valueKey":"销售额"}',
      '--params',
      '{"month":"2026-04"}',
    ]);

    expect(reportSdkSpies.preview).toHaveBeenCalledWith('PROJ1', {
      dataSource: { mode: 'sheet' },
      dataMapping: { nameKey: '名称', valueKey: '销售额' },
      parameterValues: { month: '2026-04' },
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report publish command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const publishReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'publish'
    );
    await publishReport?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--is-public',
      'true',
    ]);

    expect(reportSdkSpies.publish).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      isPublic: 1,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report delete command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const deleteReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'delete'
    );
    await deleteReport?.handler(['--project-id', 'PROJ1', '--report-id', 'REPORT_1']);

    expect(reportSdkSpies.delete).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report widget-add command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const addWidget = getCommandGroup('report')?.commands.find(
      command => command.name === 'widget-add'
    );
    await addWidget?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--type',
      'bar',
      '--title',
      '销售额',
      '--data-source',
      '{"kind":"sheet","sheetId":"S1"}',
      '--layout',
      '{"x":0,"y":0,"w":6,"h":4}',
    ]);

    expect(reportSdkSpies.addWidget).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      type: 'bar',
      title: '销售额',
      dataSource: { kind: 'sheet', sheetId: 'S1' },
      layout: { x: 0, y: 0, w: 6, h: 4 },
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report widget-delete command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const deleteWidget = getCommandGroup('report')?.commands.find(
      command => command.name === 'widget-delete'
    );
    await deleteWidget?.handler(['--project-id', 'PROJ1', '--widget-id', 'widget_1']);

    expect(reportSdkSpies.deleteWidget).toHaveBeenCalledWith('PROJ1', {
      widgetId: 'widget_1',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should reject invalid sheet widget payload without fieldIds and dataMapping', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const addWidget = getCommandGroup('report')?.commands.find(
      command => command.name === 'widget-add'
    );
    await addWidget?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--type',
      'line',
      '--data-source',
      '{"mode":"sheet","sheet":{"sheetId":"S1","columns":[{"fieldId":"fld_1","label":"名称","type":"text"}]}}',
    ]);

    expect(reportSdkSpies.addWidget).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('fieldIds'));
    logSpy.mockRestore();
  });

  it('should execute report widget-update command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateWidget = getCommandGroup('report')?.commands.find(
      command => command.name === 'widget-update'
    );
    await updateWidget?.handler([
      '--project-id',
      'PROJ1',
      '--widget-id',
      'widget_1',
      '--title',
      '销售趋势',
      '--data-source',
      '{"mode":"sheet","sheet":{"sheetId":"S1","columns":[{"fieldId":"fld_1","label":"名称","type":"text"},{"fieldId":"fld_2","label":"销售额","type":"number"}],"fieldIds":["fld_1","fld_2"],"recommendedMapping":{"nameKey":"name","valueKey":"value"},"previewMapping":{"nameKey":"name","valueKey":"value","limit":10}}}',
      '--data-mapping',
      '{"nameKey":"名称","valueKey":"销售额"}',
    ]);

    expect(reportSdkSpies.info).toHaveBeenCalledWith('PROJ1', 'REPORT_1');
    expect(reportSdkSpies.updateWidget).toHaveBeenCalledWith('PROJ1', {
      widgetId: 'widget_1',
      title: '销售趋势',
      dataSource: {
        mode: 'sheet',
        sheet: {
          sheetId: 'S1',
          columns: [
            { fieldId: 'fld_1', label: '名称', type: 'text' },
            { fieldId: 'fld_2', label: '销售额', type: 'number' },
          ],
          fieldIds: ['fld_1', 'fld_2'],
          recommendedMapping: { nameKey: 'name', valueKey: 'value' },
          previewMapping: { nameKey: 'name', valueKey: 'value', limit: 10 },
        },
      },
      dataMapping: { nameKey: '名称', valueKey: '销售额' },
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute sheet update by loading current sheet before merging changed fields', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateSheet = getCommandGroup('sheet')?.commands.find(
      command => command.name === 'update'
    );
    await updateSheet?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--sheet-id',
      'S1',
      '--name',
      '客户中心',
    ]);

    expect(sheetSdkSpies.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1');
    expect(sheetSdkSpies.update).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      name: '客户中心',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute sheet update with folder move payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateSheet = getCommandGroup('sheet')?.commands.find(
      command => command.name === 'update'
    );
    await updateSheet?.handler([
      '--team-id',
      'TEAM1',
      '--project-id',
      'PROJ1',
      '--sheet-id',
      'S1',
      '--folder-id',
      'folder_customer',
    ]);

    expect(sheetSdkSpies.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1');
    expect(sheetSdkSpies.update).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      name: '旧名称',
      folderId: 'folder_customer',
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report widget-batch command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const batchWidgets = getCommandGroup('report')?.commands.find(
      command => command.name === 'widget-batch'
    );
    await batchWidgets?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--widgets',
      '[{"type":"line","title":"销售趋势","dataSource":{"mode":"sheet","sheet":{"sheetId":"S1","columns":[{"fieldId":"fld_1","label":"名称","type":"text"},{"fieldId":"fld_2","label":"销售额","type":"number"}],"fieldIds":["fld_1","fld_2"],"recommendedMapping":{"nameKey":"name","valueKey":"value"},"previewMapping":{"nameKey":"name","valueKey":"value","limit":10}}},"dataMapping":{"nameKey":"名称","valueKey":"销售额"}}]',
    ]);

    expect(reportSdkSpies.batchWidgets).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      widgets: [
        {
          type: 'line',
          title: '销售趋势',
          dataSource: {
            mode: 'sheet',
            sheet: {
              sheetId: 'S1',
              columns: [
                { fieldId: 'fld_1', label: '名称', type: 'text' },
                { fieldId: 'fld_2', label: '销售额', type: 'number' },
              ],
              fieldIds: ['fld_1', 'fld_2'],
              recommendedMapping: { nameKey: 'name', valueKey: 'value' },
              previewMapping: { nameKey: 'name', valueKey: 'value', limit: 10 },
            },
          },
          dataMapping: { nameKey: '名称', valueKey: '销售额' },
        },
      ],
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report validate command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const validateReport = getCommandGroup('report')?.commands.find(
      command => command.name === 'validate'
    );
    await validateReport?.handler([
      '--project-id',
      'PROJ1',
      '--config',
      '{"widgets":[{"type":"line"}]}',
    ]);

    expect(reportSdkSpies.validate).toHaveBeenCalledWith('PROJ1', {
      config: {
        widgets: [{ type: 'line' }],
      },
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute report widget-sort command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const sortWidget = getCommandGroup('report')?.commands.find(
      command => command.name === 'widget-sort'
    );
    await sortWidget?.handler([
      '--project-id',
      'PROJ1',
      '--report-id',
      'REPORT_1',
      '--widget-id',
      'widget_1',
      '--target-order',
      '3',
    ]);

    expect(reportSdkSpies.sortWidget).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REPORT_1',
      widgetId: 'widget_1',
      targetOrder: 3,
    });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('should execute project create command with teamId parsed from --app-url', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createProject = getCommandGroup('project')?.commands.find(
      command => command.name === 'create'
    );
    await createProject?.handler([
      '--app-url',
      'https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
      '--name',
      '客户管理系统',
      '--description',
      '客户全生命周期管理',
      '--project-type',
      'spreadsheet',
    ]);

    expect(projectSdkSpies.create).toHaveBeenCalledWith('TTFFEN', {
      name: '客户管理系统',
      description: '客户全生命周期管理',
      projectType: 'spreadsheet',
    });
    logSpy.mockRestore();
  });

  it('should execute project update by loading current project before merging changed fields', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateProject = getCommandGroup('project')?.commands.find(
      command => command.name === 'update'
    );
    await updateProject?.handler([
      '--team-id',
      'TEAM1',
      '--id',
      'P1',
      '--cover-image',
      'https://api.example.com/new-cover.png',
    ]);

    expect(projectSdkSpies.info).toHaveBeenCalledWith('TEAM1', 'P1');
    expect(projectSdkSpies.update).toHaveBeenCalledWith('TEAM1', {
      id: 'P1',
      name: '项目1',
      remark: '旧备注',
      icon: 'https://api.example.com/old-icon.png',
      coverImage: 'https://api.example.com/new-cover.png',
    });
    logSpy.mockRestore();
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

  it('should execute sheet create command with projectId parsed from --app-url', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { SheetSDK } = await import('../../src/sdk/sheet');
    const createSpy = vi.spyOn(SheetSDK.prototype, 'create');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createSheet = getCommandGroup('sheet')?.commands.find(
      command => command.name === 'create'
    );
    await createSheet?.handler([
      '--app-url',
      'https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
      '--name',
      '客户表',
    ]);

    expect(createSpy).toHaveBeenCalledWith('PXWXBJQ', { name: '客户表' });
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should execute sheet create command with folder type payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { SheetSDK } = await import('../../src/sdk/sheet');
    const createSpy = vi.spyOn(SheetSDK.prototype, 'create');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createSheet = getCommandGroup('sheet')?.commands.find(
      command => command.name === 'create'
    );
    await createSheet?.handler([
      '--project-id',
      'PROJ1',
      '--name',
      '客户中心',
      '--type',
      'folder',
    ]);

    expect(createSpy).toHaveBeenCalledWith('PROJ1', {
      name: '客户中心',
      type: 'folder',
    });
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should execute sheet create command with folder parent payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { SheetSDK } = await import('../../src/sdk/sheet');
    const createSpy = vi.spyOn(SheetSDK.prototype, 'create');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const createSheet = getCommandGroup('sheet')?.commands.find(
      command => command.name === 'create'
    );
    await createSheet?.handler([
      '--project-id',
      'PROJ1',
      '--name',
      '客户表',
      '--folder-id',
      'folder_customer',
    ]);

    expect(createSpy).toHaveBeenCalledWith('PROJ1', {
      name: '客户表',
      folderId: 'folder_customer',
    });
    createSpy.mockRestore();
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

  it('should execute relation column create command with multiple relationConfig payload', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F2B' } });
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
      '联系人列表',
      '--type',
      'relation',
      '--target-sheet-id',
      'sh_contact',
      '--display-column-id',
      'fld_contact_name',
      '--bidirectional',
      'true',
      '--multiple',
      'true',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(columnSdkSpies.create).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      label: '联系人列表',
      type: 'relation',
      config: {
        relationConfig: {
          targetSheetId: 'sh_contact',
          displayColumnId: 'fld_contact_name',
          bidirectional: true,
          multiple: true,
        },
      },
    });
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should execute select column create command with manual options config', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F3' } });
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
      '提交状态',
      '--type',
      'select',
      '--options',
      '待提交,提交中,已提交,已驳回',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(columnSdkSpies.create).toHaveBeenCalledTimes(1);
    const createArgs = columnSdkSpies.create.mock.calls[0];
    expect(createArgs?.[0]).toBe('TEAM1');
    expect(createArgs?.[1]).toBe('PROJ1');
    expect(createArgs?.[2]).toBe('S1');
    expect(createArgs?.[3]).toMatchObject({
      label: '提交状态',
      type: 'select',
      config: {
        dataSourceType: 'manual',
        dictionaryId: null,
      },
    });
    const options = (createArgs?.[3] as { config: { options: Array<Record<string, unknown>> } }).config
      .options;
    expect(options).toHaveLength(4);
    expect(options.map(option => option.label)).toEqual(['待提交', '提交中', '已提交', '已驳回']);
    expect(options.every(option => typeof option.id === 'string' && option.id.length > 0)).toBe(true);
    expect(new Set(options.map(option => option.id)).size).toBe(4);
    expect(options.every(option => option.color === 'bg-slate-100 text-slate-700')).toBe(true);
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should execute select column create command with json options config', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F4' } });
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
      '费用类型',
      '--type',
      'select',
      '--options',
      '[{"label":"水电费","color":"bg-slate-100 text-slate-700"},{"label":"物业费","color":"bg-blue-100 text-blue-700"}]',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(columnSdkSpies.create).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      label: '费用类型',
      type: 'select',
      config: {
        options: [
          {
            id: expect.any(String),
            label: '水电费',
            color: 'bg-slate-100 text-slate-700',
          },
          {
            id: expect.any(String),
            label: '物业费',
            color: 'bg-blue-100 text-blue-700',
          },
        ],
        dataSourceType: 'manual',
        dictionaryId: null,
      },
    });
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should reject select column create command when option ids are duplicated', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F5' } });
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
      '是否',
      '--type',
      'select',
      '--options',
      '[{"id":"30cdfb64-3c75-49be-b74e-90b734327e83","label":"是","color":"bg-slate-100 text-slate-700"},{"id":"30cdfb64-3c75-49be-b74e-90b734327e83","label":"否","color":"bg-slate-100 text-slate-700"}]',
    ]);

    expect(columnSdkSpies.create).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('select / multiSelect 字段选项存在重复 id'));
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should execute multiSelect column update command with options config', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const updateSpy = vi
      .spyOn(ColumnSDK.prototype, 'update')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F6' } });
      });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const updateColumn = getCommandGroup('column')?.commands.find(
      command => command.name === 'update'
    );
    await updateColumn?.handler([
      '--sheet-id',
      'S1',
      '--field-id',
      'F_MULTI',
      '--current-type',
      'multiSelect',
      '--options',
      '[{"id":"opt_pending","label":"待处理","color":"bg-slate-100 text-slate-700"},{"id":"opt_brand","label":"品牌态","color":"custom:{\\"bg\\":\\"#e0e7ff\\",\\"text\\":\\"#3730a3\\"}"}]',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(sheetSdkSpies.structure).toHaveBeenCalledWith('S1');
    expect(updateSpy).toHaveBeenCalledWith('S1', 'F_MULTI', {
      label: '旧多选',
      type: 'multiSelect',
      config: {
        options: [
          {
            id: 'opt_pending',
            label: '待处理',
            color: 'bg-slate-100 text-slate-700',
          },
          {
            id: 'opt_brand',
            label: '品牌态',
            color: 'custom:{"bg":"#e0e7ff","text":"#3730a3"}',
          },
        ],
        dataSourceType: 'manual',
        dictionaryId: null,
      },
    });
    updateSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should reject select column create command when builtin option color is outside whitelist', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F7' } });
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
      '状态',
      '--type',
      'select',
      '--options',
      '[{"label":"已提交","color":"bg-teal-100 text-teal-700"}]',
    ]);

    expect(columnSdkSpies.create).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('select / multiSelect 字段选项颜色无效')
    );
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should execute select column create command with extended builtin colors config', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F9' } });
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
      '状态',
      '--type',
      'select',
      '--options',
      '[{"label":"已提交","color":"bg-emerald-100 text-emerald-700"},{"label":"已驳回","color":"bg-rose-100 text-rose-700"},{"label":"品牌态","color":"bg-indigo-100 text-indigo-700"},{"label":"普通态","color":"bg-gray-100 text-gray-700"}]',
    ]);

    expect(columnSdkSpies.create).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      label: '状态',
      type: 'select',
      config: {
        options: [
          {
            id: expect.any(String),
            label: '已提交',
            color: 'bg-emerald-100 text-emerald-700',
          },
          {
            id: expect.any(String),
            label: '已驳回',
            color: 'bg-rose-100 text-rose-700',
          },
          {
            id: expect.any(String),
            label: '品牌态',
            color: 'bg-indigo-100 text-indigo-700',
          },
          {
            id: expect.any(String),
            label: '普通态',
            color: 'bg-gray-100 text-gray-700',
          },
        ],
        dataSourceType: 'manual',
        dictionaryId: null,
      },
    });
    createSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('should reject select column create command when custom option color payload is invalid', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const { ColumnSDK } = await import('../../src/sdk/column');
    const createSpy = vi
      .spyOn(ColumnSDK.prototype, 'create')
      .mockImplementation((...args: unknown[]) => {
        columnSdkSpies.create(...args);
        return Promise.resolve({ code: 1000, message: 'success', data: { id: 'F8' } });
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
      '状态',
      '--type',
      'select',
      '--options',
      '[{"label":"品牌态","color":"custom:{\\"bg\\":\\"not-a-color\\",\\"text\\":\\"#3730a3\\"}"}]',
    ]);

    expect(columnSdkSpies.create).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('select / multiSelect 字段自定义颜色无效')
    );
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

  it('should execute row batch-create command from file in 1000-row chunks', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const tmpDir = await mkdtemp(join(tmpdir(), 'dimens-row-batch-'));
    const filePath = join(tmpDir, 'rows.json');
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      fld_customer: `客户${index + 1}`,
    }));
    await writeFile(filePath, JSON.stringify(rows), 'utf-8');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    try {
      registerCommands();
      const batchCreateRow = getCommandGroup('row')?.commands.find(
        command => command.name === 'batch-create'
      );
      await batchCreateRow?.handler([
        '--sheet-id',
        'S1',
        '--file',
        filePath,
      ]);

      expect(rowSdkSpies.batchCreate).toHaveBeenCalledTimes(2);
      expect(rowSdkSpies.batchCreate).toHaveBeenNthCalledWith(1, 'S1', {
        rows: expect.arrayContaining([
          { data: { fld_customer: '客户1' } },
          { data: { fld_customer: '客户1000' } },
        ]),
      });
      expect((rowSdkSpies.batchCreate.mock.calls[0]?.[1] as any).rows).toHaveLength(1000);
      expect(rowSdkSpies.batchCreate).toHaveBeenNthCalledWith(2, 'S1', {
        rows: [{ data: { fld_customer: '客户1001' } }],
      });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('批量创建 1001 行成功'));
    } finally {
      logSpy.mockRestore();
      await rm(tmpDir, { recursive: true, force: true });
    }
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
    expect(rowSdkSpies.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', 'R1');
    expect(rowSdkSpies.update).toHaveBeenCalledWith('S1', 'R1', {
      fld_customer: '华东智造',
      fld_status: '待跟进',
    }, 3);
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

  it('should parse teamId and projectId from --app-url for view list command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const viewList = getCommandGroup('view')?.commands.find(command => command.name === 'list');
    await viewList?.handler([
      '--app-url',
      'https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
      '--sheet-id',
      'S1',
    ]);

    expect(logSpy).toHaveBeenCalled();
    expect(viewSdkSpies.list).toHaveBeenCalledWith('TTFFEN', 'PXWXBJQ', 'S1');
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

  it('should execute create public default view command with is-public and custom config', async () => {
    const { registerCommands } = await import('../../src/commands');
    const { getCommandGroup } = await import('../../src/commands/registry');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const viewCreate = getCommandGroup('view')?.commands.find(command => command.name === 'create');
    await viewCreate?.handler([
      '--app-url',
      'https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
      '--sheet-id',
      'S1',
      '--name',
      '默认视图',
      '--type',
      'grid',
      '--is-public',
      'true',
      '--config',
      '{"filters":[{"fieldId":"fld_status","operator":"equals","value":"启用"}],"filterMatchType":"and","sortRule":{"fieldId":"fld_order","direction":"asc"},"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}',
    ]);

    expect(viewSdkSpies.create).toHaveBeenCalledWith('TTFFEN', 'PXWXBJQ', 'S1', {
      name: '默认视图',
      type: 'grid',
      isPublic: true,
      config: {
        filters: [
          {
            fieldId: 'fld_status',
            operator: 'equals',
            value: '启用',
          },
        ],
        filterMatchType: 'and',
        sortRule: {
          fieldId: 'fld_order',
          direction: 'asc',
        },
        groupBy: [],
        hiddenColumnIds: [],
        rowHeight: 'medium',
      },
    });
    logSpy.mockRestore();
  });
});
