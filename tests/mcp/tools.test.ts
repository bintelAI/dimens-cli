import { describe, expect, it, vi } from 'vitest';
import {
  createAuthTools,
  createCanvasTools,
  createColumnTools,
  createContextTools,
  createDocumentTools,
  createProjectTools,
  createReportTools,
  createPermissionTools,
  createRoleTools,
  createRowAclTools,
  createRowPolicyTools,
  createRowTools,
  createSheetTools,
  createTeamTools,
  createUploadTools,
  createUserTools,
  createViewTools,
} from '../../src/mcp/tools';
import type { McpToolFactoryContext } from '../../src/mcp/tools/types';

function createToolContext(): McpToolFactoryContext {
  const sdk = {
    project: {
      page: vi.fn().mockResolvedValue({ data: { list: [{ id: 'P1' }] } }),
      info: vi.fn().mockResolvedValue({ data: { id: 'P1' } }),
    },
    sheet: {
      list: vi.fn().mockResolvedValue({ data: [{ id: 'S1' }] }),
      tree: vi.fn().mockResolvedValue({ data: [{ id: 'S1' }] }),
      info: vi.fn().mockResolvedValue({ data: { id: 'S1' } }),
      structure: vi.fn().mockResolvedValue({ data: { columns: [] } }),
      create: vi.fn().mockResolvedValue({ data: { id: 'S2' } }),
      update: vi.fn().mockResolvedValue({ data: { id: 'S1', name: '新名称' } }),
      delete: vi.fn().mockResolvedValue({ data: true }),
    },
    column: {
      list: vi.fn().mockResolvedValue({ data: [{ id: 'F1' }] }),
      create: vi.fn().mockResolvedValue({ data: { id: 'F2' } }),
      update: vi.fn().mockResolvedValue({ data: { id: 'F1', label: '新字段' } }),
      delete: vi.fn().mockResolvedValue({ data: true }),
    },
    view: {
      list: vi.fn().mockResolvedValue({ data: [{ viewId: 'V1' }] }),
      create: vi.fn().mockResolvedValue({ data: { viewId: 'V2' } }),
    },
    document: {
      createWithSheet: vi.fn().mockResolvedValue({ data: { document: { documentId: 'D1' } } }),
      info: vi.fn().mockResolvedValue({ data: { documentId: 'D1', version: 1 } }),
      getBySheetId: vi.fn().mockResolvedValue({ data: { documentId: 'D2' } }),
      update: vi.fn().mockResolvedValue({ data: { documentId: 'D1', version: 2 } }),
    },
    upload: {
      uploadFile: vi.fn().mockResolvedValue({ data: { fileId: 'FILE1', url: 'https://file.example.com/a.txt' } }),
    },
    report: {
      createProjectReport: vi.fn().mockResolvedValue({ data: { reportId: 'REP1' } }),
      preview: vi.fn().mockResolvedValue({ data: { rows: [] } }),
      addWidget: vi.fn().mockResolvedValue({ data: { widgetId: 'W1' } }),
      query: vi.fn().mockResolvedValue({ data: { result: [] } }),
    },
    role: {
      list: vi.fn().mockResolvedValue({ data: [{ roleId: 'ROLE1' }] }),
      info: vi.fn().mockResolvedValue({ data: { roleId: 'ROLE1', name: '管理员' } }),
      create: vi.fn().mockResolvedValue({ data: { roleId: 'ROLE2' } }),
      update: vi.fn().mockResolvedValue({ data: { roleId: 'ROLE1', name: '新角色' } }),
      delete: vi.fn().mockResolvedValue({ data: [{ success: true }] }),
      assignUser: vi.fn().mockResolvedValue({ data: { success: true } }),
      removeUser: vi.fn().mockResolvedValue({ data: { success: true } }),
      userRoles: vi.fn().mockResolvedValue({ data: { roles: [] } }),
      roleUsers: vi.fn().mockResolvedValue({ data: [{ userId: 1 }] }),
      projectUsers: vi.fn().mockResolvedValue({ data: [{ userId: 1 }] }),
    },
    permission: {
      list: vi.fn().mockResolvedValue({ data: [{ id: 1 }] }),
      info: vi.fn().mockResolvedValue({ data: { id: 1, sheetId: 'S1' } }),
      check: vi.fn().mockResolvedValue({ data: { allowed: true } }),
      create: vi.fn().mockResolvedValue({ data: { id: 2 } }),
      update: vi.fn().mockResolvedValue({ data: { id: 1 } }),
      delete: vi.fn().mockResolvedValue({ data: [] }),
      batch: vi.fn().mockResolvedValue({ data: [] }),
      updateResourcePermission: vi.fn().mockResolvedValue({ data: { roleId: 'ROLE1' } }),
    },
    row: {
      page: vi.fn().mockResolvedValue({ data: { list: [{ id: 'R1' }], total: 1 } }),
      info: vi.fn().mockResolvedValue({ data: { id: 'R1', version: 1 } }),
      openInfo: vi.fn().mockResolvedValue({ data: { id: 'R1', included: {} } }),
      create: vi.fn().mockResolvedValue({ data: { id: 'R2' } }),
      batchCreate: vi.fn().mockResolvedValue({ data: [{ id: 'R3' }] }),
      update: vi.fn().mockResolvedValue({ data: { id: 'R1', version: 2 } }),
      updateCell: vi.fn().mockResolvedValue({ data: true }),
      delete: vi.fn().mockResolvedValue({ data: true }),
    },
    team: {
      info: vi.fn().mockResolvedValue({ data: { id: 'TEAM1', name: '测试团队' } }),
      members: vi.fn().mockResolvedValue({ data: [{ userId: 1, nickName: '用户1' }] }),
    },
    user: {
      me: vi.fn().mockResolvedValue({ data: { id: 1, nickName: '当前用户' } }),
    },
    canvas: {
      create: vi.fn().mockResolvedValue({ data: { sheetId: 'CANVAS1', canvasId: 'CANVAS1' } }),
      info: vi.fn().mockResolvedValue({ data: { canvasId: 'CANVAS1', name: '测试画布' } }),
      save: vi.fn().mockResolvedValue({ data: { canvasId: 'CANVAS1', version: 2 } }),
      versions: vi.fn().mockResolvedValue({ data: { list: [{ version: 1 }] } }),
      version: vi.fn().mockResolvedValue({ data: { version: 1, data: {} } }),
      restore: vi.fn().mockResolvedValue({ data: { canvasId: 'CANVAS1', version: 1 } }),
      listMineResources: vi.fn().mockResolvedValue({ data: [{ id: 'RES1', name: '我的资源' }] }),
      saveMineResource: vi.fn().mockResolvedValue({ data: { id: 'RES1', name: '保存的资源' } }),
      removeMineResource: vi.fn().mockResolvedValue({ data: true }),
      publishMineResource: vi.fn().mockResolvedValue({ data: { id: 'RES1', visibility: 'market' } }),
      listMarketResources: vi.fn().mockResolvedValue({ data: [{ id: 'MRES1', name: '市场资源' }] }),
    },
    rowPolicy: {
      list: vi.fn().mockResolvedValue({ data: [{ policyId: 'POL1', name: '策略1' }] }),
      info: vi.fn().mockResolvedValue({ data: { policyId: 'POL1', name: '策略1' } }),
      create: vi.fn().mockResolvedValue({ data: { policyId: 'POL2' } }),
      update: vi.fn().mockResolvedValue({ data: { policyId: 'POL1', name: '更新后' } }),
      delete: vi.fn().mockResolvedValue({ data: [{ success: true }] }),
      toggle: vi.fn().mockResolvedValue({ data: { policyId: 'POL1', isActive: true } }),
      check: vi.fn().mockResolvedValue({ data: { allowed: true } }),
    },
    rowAcl: {
      list: vi.fn().mockResolvedValue({ data: [{ target: { userId: 1 }, permission: 'read' }] }),
      roleAcls: vi.fn().mockResolvedValue({ data: [{ rowId: 'R1', permission: 'read' }] }),
      grant: vi.fn().mockResolvedValue({ data: { success: true } }),
      revoke: vi.fn().mockResolvedValue({ data: { success: true } }),
      revokeDept: vi.fn().mockResolvedValue({ data: { success: true } }),
      revokeRole: vi.fn().mockResolvedValue({ data: { success: true } }),
    },
  };

  return {
    getContext: () => ({
      baseUrl: 'https://api.example.com',
      token: 'abcdef1234567890',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
      output: 'json',
      toSafeJSON: () => ({
        baseUrl: 'https://api.example.com',
        hasToken: true,
        tokenPreview: 'abcd...7890',
        teamId: 'TEAM1',
        projectId: 'PROJ1',
        appUrl: undefined,
      }),
    }),
    createSDK: () => sdk as never,
    setSessionContext: vi.fn(),
  };
}

function parseToolResult(result: Awaited<ReturnType<McpToolFactoryContext['createSDK'] extends never ? never : any>>) {
  return JSON.parse(String(result.content[0]?.text));
}

describe('MCP tools', () => {
  it('should expose sanitized current context', async () => {
    const [tool] = createContextTools(createToolContext());

    const result = await tool.handler({});

    expect(parseToolResult(result).data).toEqual({
      baseUrl: 'https://api.example.com',
      hasToken: true,
      tokenPreview: 'abcd...7890',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
      appUrl: undefined,
    });
  });

  it('should set session context via dimens_auth_setup', async () => {
    const context = createToolContext();
    const [tool] = createAuthTools(context);

    const result = await tool.handler({
      token: 'my_token_123456',
      teamId: 'TEAM_X',
      projectId: 'PROJ_Y',
    });

    expect(context.setSessionContext).toHaveBeenCalledWith({
      token: 'my_token_123456',
      teamId: 'TEAM_X',
      projectId: 'PROJ_Y',
    });
    expect(parseToolResult(result).success).toBe(true);
    expect(parseToolResult(result).data).toHaveProperty('teamId', 'TEAM1');
  });

  it('should reject dimens_auth_setup with no auth fields', async () => {
    const context = createToolContext();
    const [tool] = createAuthTools(context);

    const result = await tool.handler({});

    expect(parseToolResult(result).success).toBe(false);
    expect(parseToolResult(result).message).toContain('token');
  });

  it('should accept partial auth fields', async () => {
    const context = createToolContext();
    const [tool] = createAuthTools(context);

    const result = await tool.handler({ teamId: 'TEAM_X' });

    expect(context.setSessionContext).toHaveBeenCalledWith({ teamId: 'TEAM_X' });
    expect(parseToolResult(result).success).toBe(true);
  });

  it('should call project page with resolved team context', async () => {
    const context = createToolContext();
    const [tool] = createProjectTools(context);

    const result = await tool.handler({ page: 2, size: 10 });

    expect(context.createSDK().project.page).toHaveBeenCalledWith('TEAM1', {
      page: 2,
      size: 10,
    });
    expect(parseToolResult(result).data.list).toEqual([{ id: 'P1' }]);
  });

  it('should call sheet structure with required sheetId', async () => {
    const context = createToolContext();
    const tools = createSheetTools(context);
    const tool = tools.find(item => item.name === 'dimens_sheet_structure');

    const result = await tool?.handler({ sheetId: 'S1' });

    expect(context.createSDK().sheet.structure).toHaveBeenCalledWith('S1');
    expect(parseToolResult(result).data).toEqual({ columns: [] });
  });

  it('should update and delete sheet with confirmation protection', async () => {
    const context = createToolContext();
    const tools = createSheetTools(context);
    const updateTool = tools.find(item => item.name === 'dimens_sheet_update');
    const deleteTool = tools.find(item => item.name === 'dimens_sheet_delete');

    await updateTool?.handler({ sheetId: 'S1', name: '新名称' });
    const rejected = await deleteTool?.handler({ sheetId: 'S1' });
    await deleteTool?.handler({ sheetId: 'S1', confirm: true });

    expect(context.createSDK().sheet.update).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      name: '新名称',
    });
    expect(parseToolResult(rejected).success).toBe(false);
    expect(parseToolResult(rejected).message).toContain('confirm');
    expect(context.createSDK().sheet.delete).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1');
  });

  it('should call column create with resolved team and project context', async () => {
    const context = createToolContext();
    const tools = createColumnTools(context);
    const tool = tools.find(item => item.name === 'dimens_column_create');

    await tool?.handler({ sheetId: 'S1', label: '客户名称', type: 'text' });

    expect(context.createSDK().column.create).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      label: '客户名称',
      type: 'text',
    });
  });

  it('should update and delete column with confirmation protection', async () => {
    const context = createToolContext();
    const tools = createColumnTools(context);
    const updateTool = tools.find(item => item.name === 'dimens_column_update');
    const deleteTool = tools.find(item => item.name === 'dimens_column_delete');

    await updateTool?.handler({ sheetId: 'S1', fieldId: 'F1', label: '新字段' });
    const rejected = await deleteTool?.handler({ sheetId: 'S1', fieldId: 'F1' });
    await deleteTool?.handler({ sheetId: 'S1', fieldId: 'F1', confirm: true });

    expect(context.createSDK().column.update).toHaveBeenCalledWith('S1', 'F1', {
      label: '新字段',
    });
    expect(parseToolResult(rejected).success).toBe(false);
    expect(parseToolResult(rejected).message).toContain('confirm');
    expect(context.createSDK().column.delete).toHaveBeenCalledWith('S1', 'F1');
  });

  it('should call view create with resolved team and project context', async () => {
    const context = createToolContext();
    const tools = createViewTools(context);
    const tool = tools.find(item => item.name === 'dimens_view_create');

    await tool?.handler({ sheetId: 'S1', name: '默认视图', type: 'grid' });

    expect(context.createSDK().view.create).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', {
      name: '默认视图',
      type: 'grid',
    });
  });

  it('should call row info with include option', async () => {
    const context = createToolContext();
    const tools = createRowTools(context);
    const tool = tools.find(item => item.name === 'dimens_row_info');

    await tool?.handler({
      sheetId: 'S1',
      rowId: 'R1',
      include: 'relations,richtext',
    });

    expect(context.createSDK().row.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', 'R1', {
      include: 'relations,richtext',
    });
  });

  it('should call open row info through public endpoint tool', async () => {
    const context = createToolContext();
    const tools = createRowTools(context);
    const tool = tools.find(item => item.name === 'dimens_open_row_info');

    const result = await tool?.handler({
      sheetId: 'S1',
      rowId: 'R1',
      include: 'relations,richtext',
    });

    expect(context.createSDK().row.openInfo).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1', 'R1', {
      include: 'relations,richtext',
    });
    expect(parseToolResult(result).message).toContain('公开行详情');
  });

  it('should call row create and batch create with normalized payloads', async () => {
    const context = createToolContext();
    const tools = createRowTools(context);
    const createTool = tools.find(item => item.name === 'dimens_row_create');
    const batchTool = tools.find(item => item.name === 'dimens_row_batch_create');

    await createTool?.handler({ sheetId: 'S1', data: { F1: 'A' } });
    await batchTool?.handler({ sheetId: 'S1', rows: [{ data: { F1: 'B' } }] });

    expect(context.createSDK().row.create).toHaveBeenCalledWith('S1', {
      data: { F1: 'A' },
    });
    expect(context.createSDK().row.batchCreate).toHaveBeenCalledWith('S1', {
      rows: [{ data: { F1: 'B' } }],
    });
  });

  it('should require version before updating a row', async () => {
    const tools = createRowTools(createToolContext());
    const tool = tools.find(item => item.name === 'dimens_row_update');

    const result = await tool?.handler({ sheetId: 'S1', rowId: 'R1', data: { F1: 'A' } });

    expect(parseToolResult(result).success).toBe(false);
    expect(parseToolResult(result).message).toContain('version');
  });

  it('should delete row only when confirm is true', async () => {
    const context = createToolContext();
    const tools = createRowTools(context);
    const tool = tools.find(item => item.name === 'dimens_row_delete');

    const rejected = await tool?.handler({ sheetId: 'S1', rowId: 'R1' });
    await tool?.handler({ sheetId: 'S1', rowId: 'R1', confirm: true });

    expect(parseToolResult(rejected).success).toBe(false);
    expect(parseToolResult(rejected).message).toContain('confirm');
    expect(context.createSDK().row.delete).toHaveBeenCalledWith('S1', 'R1');
  });

  it('should call document create, info by document id, info by sheet id, and update', async () => {
    const context = createToolContext();
    const tools = createDocumentTools(context);

    await tools.find(item => item.name === 'dimens_doc_create')?.handler({
      title: '项目说明',
      content: '# 项目说明',
      format: 'markdown',
    });
    await tools.find(item => item.name === 'dimens_doc_info')?.handler({ documentId: 'D1' });
    await tools.find(item => item.name === 'dimens_doc_info')?.handler({ sheetId: 'S1' });
    await tools.find(item => item.name === 'dimens_doc_update')?.handler({
      documentId: 'D1',
      content: '更新内容',
      version: 1,
      createVersion: true,
      changeSummary: '更新说明',
    });

    expect(context.createSDK().document.createWithSheet).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      title: '项目说明',
      content: '# 项目说明',
      format: 'markdown',
    });
    expect(context.createSDK().document.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'D1');
    expect(context.createSDK().document.getBySheetId).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'S1');
    expect(context.createSDK().document.update).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      documentId: 'D1',
      content: '更新内容',
      version: 1,
      createVersion: true,
      changeSummary: '更新说明',
    });
  });

  it('should call upload file with business context', async () => {
    const context = createToolContext();
    const [tool] = createUploadTools(context);

    await tool.handler({ filePath: '/tmp/a.txt', key: 'docs/a.txt', scene: 'doc' });

    expect(context.createSDK().upload.uploadFile).toHaveBeenCalledWith('/tmp/a.txt', {
      key: 'docs/a.txt',
      scene: 'doc',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
    });
  });

  it('should call report create, preview, widget add, and query', async () => {
    const context = createToolContext();
    const tools = createReportTools(context);

    await tools.find(item => item.name === 'dimens_report_create')?.handler({ name: '经营看板' });
    await tools.find(item => item.name === 'dimens_report_preview')?.handler({
      dataSource: { type: 'sheet', sheetId: 'S1' },
    });
    await tools.find(item => item.name === 'dimens_report_widget_add')?.handler({
      reportId: 'REP1',
      type: 'bar',
      dataSource: { type: 'sheet', sheetId: 'S1' },
    });
    await tools.find(item => item.name === 'dimens_report_query')?.handler({
      reportId: 'REP1',
      widgetIds: ['W1'],
    });

    expect(context.createSDK().report.createProjectReport).toHaveBeenCalledWith('PROJ1', {
      name: '经营看板',
    });
    expect(context.createSDK().report.preview).toHaveBeenCalledWith('PROJ1', {
      dataSource: { type: 'sheet', sheetId: 'S1' },
    });
    expect(context.createSDK().report.addWidget).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REP1',
      type: 'bar',
      dataSource: { type: 'sheet', sheetId: 'S1' },
    });
    expect(context.createSDK().report.query).toHaveBeenCalledWith('PROJ1', {
      reportId: 'REP1',
      widgetIds: ['W1'],
    });
  });

  it('should expose role read tools and protect role mutation tools with confirmation', async () => {
    const context = createToolContext();
    const tools = createRoleTools(context);

    await tools.find(item => item.name === 'dimens_role_list')?.handler({});
    await tools.find(item => item.name === 'dimens_role_info')?.handler({ roleId: 'ROLE1' });
    await tools.find(item => item.name === 'dimens_role_users')?.handler({ roleId: 'ROLE1' });
    await tools.find(item => item.name === 'dimens_project_users')?.handler({});
    await tools.find(item => item.name === 'dimens_user_roles')?.handler({ userId: 1, sheetId: 'S1' });

    const createRejected = await tools.find(item => item.name === 'dimens_role_create')?.handler({ name: '新角色' });
    await tools.find(item => item.name === 'dimens_role_create')?.handler({ name: '新角色', confirm: true });
    await tools.find(item => item.name === 'dimens_role_update')?.handler({
      roleId: 'ROLE1',
      data: { name: '新角色' },
      confirm: true,
    });
    await tools.find(item => item.name === 'dimens_role_assign_user')?.handler({
      roleId: 'ROLE1',
      userId: 1,
      sheetId: 'S1',
      confirm: true,
    });
    const deleteRejected = await tools.find(item => item.name === 'dimens_role_delete')?.handler({ roleIds: ['ROLE1'] });
    await tools.find(item => item.name === 'dimens_role_delete')?.handler({ roleIds: ['ROLE1'], confirm: true });

    expect(context.createSDK().role.list).toHaveBeenCalledWith('PROJ1');
    expect(context.createSDK().role.info).toHaveBeenCalledWith('PROJ1', 'ROLE1');
    expect(context.createSDK().role.roleUsers).toHaveBeenCalledWith('PROJ1', 'ROLE1');
    expect(context.createSDK().role.projectUsers).toHaveBeenCalledWith('PROJ1');
    expect(context.createSDK().role.userRoles).toHaveBeenCalledWith('PROJ1', 1, 'S1');
    expect(parseToolResult(createRejected).success).toBe(false);
    expect(parseToolResult(createRejected).message).toContain('confirm');
    expect(context.createSDK().role.create).toHaveBeenCalledWith('PROJ1', { name: '新角色' });
    expect(context.createSDK().role.update).toHaveBeenCalledWith('PROJ1', {
      roleId: 'ROLE1',
      data: { name: '新角色' },
    });
    expect(context.createSDK().role.assignUser).toHaveBeenCalledWith('PROJ1', {
      roleId: 'ROLE1',
      userId: 1,
      sheetId: 'S1',
    });
    expect(parseToolResult(deleteRejected).success).toBe(false);
    expect(context.createSDK().role.delete).toHaveBeenCalledWith('PROJ1', ['ROLE1']);
  });

  it('should expose permission read tools and protect permission mutation tools with confirmation', async () => {
    const context = createToolContext();
    const tools = createPermissionTools(context);

    await tools.find(item => item.name === 'dimens_permission_list')?.handler({ sheetId: 'S1' });
    await tools.find(item => item.name === 'dimens_permission_info')?.handler({ id: 1, sheetId: 'S1' });
    await tools.find(item => item.name === 'dimens_permission_check')?.handler({
      userId: 1,
      sheetId: 'S1',
      action: 'edit',
    });

    const createRejected = await tools.find(item => item.name === 'dimens_permission_create')?.handler({
      roleId: 'ROLE1',
      sheetId: 'S1',
      canRead: true,
    });
    await tools.find(item => item.name === 'dimens_permission_create')?.handler({
      roleId: 'ROLE1',
      sheetId: 'S1',
      canRead: true,
      confirm: true,
    });
    await tools.find(item => item.name === 'dimens_permission_update')?.handler({
      id: 1,
      sheetId: 'S1',
      data: { canWrite: true },
      confirm: true,
    });
    await tools.find(item => item.name === 'dimens_permission_update_resource')?.handler({
      roleId: 'ROLE1',
      resourceId: 'S1',
      resourceType: 'sheet',
      permission: { visible: true },
      confirm: true,
    });
    const deleteRejected = await tools.find(item => item.name === 'dimens_permission_delete')?.handler({
      ids: [1],
      sheetId: 'S1',
    });
    await tools.find(item => item.name === 'dimens_permission_delete')?.handler({
      ids: [1],
      sheetId: 'S1',
      confirm: true,
    });

    expect(context.createSDK().permission.list).toHaveBeenCalledWith('PROJ1', 'S1');
    expect(context.createSDK().permission.info).toHaveBeenCalledWith('PROJ1', 1, 'S1');
    expect(context.createSDK().permission.check).toHaveBeenCalledWith('PROJ1', {
      userId: 1,
      sheetId: 'S1',
      action: 'edit',
    });
    expect(parseToolResult(createRejected).success).toBe(false);
    expect(parseToolResult(createRejected).message).toContain('confirm');
    expect(context.createSDK().permission.create).toHaveBeenCalledWith('PROJ1', {
      roleId: 'ROLE1',
      sheetId: 'S1',
      canRead: true,
    });
    expect(context.createSDK().permission.update).toHaveBeenCalledWith('PROJ1', {
      id: 1,
      sheetId: 'S1',
      data: { canWrite: true },
    });
    expect(context.createSDK().permission.updateResourcePermission).toHaveBeenCalledWith('PROJ1', {
      roleId: 'ROLE1',
      resourceId: 'S1',
      resourceType: 'sheet',
      permission: { visible: true },
    });
    expect(parseToolResult(deleteRejected).success).toBe(false);
    expect(context.createSDK().permission.delete).toHaveBeenCalledWith('PROJ1', [1], 'S1');
  });

  it('should call team info and members', async () => {
    const context = createToolContext();
    const tools = createTeamTools(context);

    await tools.find(item => item.name === 'dimens_team_info')?.handler({});
    await tools.find(item => item.name === 'dimens_team_members')?.handler({ keyword: '测试' });

    expect(context.createSDK().team.info).toHaveBeenCalledWith('TEAM1');
    expect(context.createSDK().team.members).toHaveBeenCalledWith('TEAM1', { keyword: '测试' });
  });

  it('should call user me', async () => {
    const context = createToolContext();
    const [tool] = createUserTools(context);

    await tool.handler({});

    expect(context.createSDK().user.me).toHaveBeenCalledWith();
    expect(parseToolResult(await tool.handler({})).data).toEqual({ id: 1, nickName: '当前用户' });
  });

  it('should cover canvas lifecycle: create, info, save, versions, version, restore', async () => {
    const context = createToolContext();
    const tools = createCanvasTools(context);

    await tools.find(item => item.name === 'dimens_canvas_create')?.handler({ name: '新画布', folderId: 'F1' });
    await tools.find(item => item.name === 'dimens_canvas_info')?.handler({ sheetId: 'CANVAS1' });
    await tools.find(item => item.name === 'dimens_canvas_save')?.handler({
      sheetId: 'CANVAS1', data: {}, baseVersion: 1,
    });
    await tools.find(item => item.name === 'dimens_canvas_versions')?.handler({ sheetId: 'CANVAS1' });
    await tools.find(item => item.name === 'dimens_canvas_version')?.handler({ sheetId: 'CANVAS1', version: 1 });

    const restoreRejected = await tools.find(item => item.name === 'dimens_canvas_restore')?.handler({
      sheetId: 'CANVAS1', version: 1,
    });
    await tools.find(item => item.name === 'dimens_canvas_restore')?.handler({
      sheetId: 'CANVAS1', version: 1, confirm: true,
    });

    expect(context.createSDK().canvas.create).toHaveBeenCalledWith('PROJ1', { name: '新画布', folderId: 'F1' });
    expect(context.createSDK().canvas.info).toHaveBeenCalledWith('TEAM1', 'PROJ1', 'CANVAS1');
    expect(context.createSDK().canvas.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      sheetId: 'CANVAS1', data: {}, baseVersion: 1,
    });
    expect(parseToolResult(restoreRejected).success).toBe(false);
    expect(parseToolResult(restoreRejected).message).toContain('confirm');
    expect(context.createSDK().canvas.restore).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
      sheetId: 'CANVAS1', version: 1,
    });
  });

  it('should cover canvas resource operations', async () => {
    const context = createToolContext();
    const tools = createCanvasTools(context);

    await tools.find(item => item.name === 'dimens_canvas_resource_list_mine')?.handler({});
    await tools.find(item => item.name === 'dimens_canvas_resource_save')?.handler({ name: '新资源', confirm: true });
    await tools.find(item => item.name === 'dimens_canvas_resource_list_market')?.handler({ keyword: '模板' });

    const deleteRejected = await tools.find(item => item.name === 'dimens_canvas_resource_delete')?.handler({ id: 'RES1' });
    await tools.find(item => item.name === 'dimens_canvas_resource_delete')?.handler({ id: 'RES1', confirm: true });

    const publishRejected = await tools.find(item => item.name === 'dimens_canvas_resource_publish')?.handler({ id: 'RES1' });
    await tools.find(item => item.name === 'dimens_canvas_resource_publish')?.handler({ id: 'RES1', confirm: true });

    expect(context.createSDK().canvas.listMineResources).toHaveBeenCalledWith('TEAM1', undefined);
    expect(context.createSDK().canvas.saveMineResource).toHaveBeenCalledWith('TEAM1', { name: '新资源' });
    expect(parseToolResult(deleteRejected).success).toBe(false);
    expect(context.createSDK().canvas.removeMineResource).toHaveBeenCalledWith('TEAM1', 'RES1');
    expect(parseToolResult(publishRejected).success).toBe(false);
    expect(context.createSDK().canvas.publishMineResource).toHaveBeenCalledWith('TEAM1', 'RES1');
    expect(context.createSDK().canvas.listMarketResources).toHaveBeenCalledWith('TEAM1', '模板');
  });

  it('should cover row policy lifecycle with confirmation protection', async () => {
    const context = createToolContext();
    const tools = createRowPolicyTools(context);

    await tools.find(item => item.name === 'dimens_row_policy_list')?.handler({ sheetId: 'S1' });
    await tools.find(item => item.name === 'dimens_row_policy_info')?.handler({ id: 'POL1', sheetId: 'S1' });
    await tools.find(item => item.name === 'dimens_row_policy_check')?.handler({
      sheetId: 'S1', rowData: { field: 'v' }, action: 'edit',
    });

    const createRejected = await tools.find(item => item.name === 'dimens_row_policy_create')?.handler({
      sheetId: 'S1', name: '新策略', actions: ['read'],
    });
    await tools.find(item => item.name === 'dimens_row_policy_create')?.handler({
      sheetId: 'S1', name: '新策略', actions: ['read'], confirm: true,
    });
    await tools.find(item => item.name === 'dimens_row_policy_update')?.handler({
      id: 'POL1', sheetId: 'S1', data: { name: '更新后' }, confirm: true,
    });

    const deleteRejected = await tools.find(item => item.name === 'dimens_row_policy_delete')?.handler({
      ids: ['POL1'], sheetId: 'S1',
    });
    await tools.find(item => item.name === 'dimens_row_policy_delete')?.handler({
      ids: ['POL1'], sheetId: 'S1', confirm: true,
    });

    await tools.find(item => item.name === 'dimens_row_policy_toggle')?.handler({
      id: 'POL1', sheetId: 'S1', isActive: true, confirm: true,
    });

    expect(context.createSDK().rowPolicy.list).toHaveBeenCalledWith('PROJ1', 'S1');
    expect(context.createSDK().rowPolicy.info).toHaveBeenCalledWith('PROJ1', 'POL1', 'S1');
    expect(parseToolResult(createRejected).success).toBe(false);
    expect(parseToolResult(createRejected).message).toContain('confirm');
    expect(context.createSDK().rowPolicy.create).toHaveBeenCalledWith('PROJ1', {
      sheetId: 'S1', name: '新策略', actions: ['read'],
    });
    expect(context.createSDK().rowPolicy.update).toHaveBeenCalledWith('PROJ1', {
      id: 'POL1', sheetId: 'S1', data: { name: '更新后' },
    });
    expect(parseToolResult(deleteRejected).success).toBe(false);
    expect(context.createSDK().rowPolicy.delete).toHaveBeenCalledWith('PROJ1', ['POL1'], 'S1');
    expect(context.createSDK().rowPolicy.toggle).toHaveBeenCalledWith('PROJ1', {
      id: 'POL1', sheetId: 'S1', isActive: true,
    });
    expect(context.createSDK().rowPolicy.check).toHaveBeenCalledWith('PROJ1', {
      sheetId: 'S1', rowData: { field: 'v' }, action: 'edit', context: {},
    });
  });

  it('should cover row acl operations with confirmation protection', async () => {
    const context = createToolContext();
    const tools = createRowAclTools(context);

    await tools.find(item => item.name === 'dimens_row_acl_list')?.handler({ sheetId: 'S1', rowId: 'R1' });
    await tools.find(item => item.name === 'dimens_row_acl_role_acls')?.handler({ sheetId: 'S1', roleId: 'ROLE1' });

    const grantRejected = await tools.find(item => item.name === 'dimens_row_acl_grant')?.handler({
      sheetId: 'S1', rowId: 'R1', userId: 1, permission: 'read',
    });
    await tools.find(item => item.name === 'dimens_row_acl_grant')?.handler({
      sheetId: 'S1', rowId: 'R1', userId: 1, permission: 'read', confirm: true,
    });

    const revokeRejected = await tools.find(item => item.name === 'dimens_row_acl_revoke')?.handler({
      sheetId: 'S1', rowId: 'R1', userId: 1,
    });
    await tools.find(item => item.name === 'dimens_row_acl_revoke')?.handler({
      sheetId: 'S1', rowId: 'R1', userId: 1, confirm: true,
    });

    await tools.find(item => item.name === 'dimens_row_acl_revoke_dept')?.handler({
      sheetId: 'S1', rowId: 'R1', deptId: 10, confirm: true,
    });
    await tools.find(item => item.name === 'dimens_row_acl_revoke_role')?.handler({
      sheetId: 'S1', rowId: 'R1', roleId: 'ROLE1', confirm: true,
    });

    expect(context.createSDK().rowAcl.list).toHaveBeenCalledWith('S1', 'R1');
    expect(context.createSDK().rowAcl.roleAcls).toHaveBeenCalledWith('S1', 'ROLE1');
    expect(parseToolResult(grantRejected).success).toBe(false);
    expect(parseToolResult(grantRejected).message).toContain('confirm');
    expect(context.createSDK().rowAcl.grant).toHaveBeenCalledWith('S1', {
      rowId: 'R1', target: { userId: 1 }, permission: 'read',
    });
    expect(parseToolResult(revokeRejected).success).toBe(false);
    expect(context.createSDK().rowAcl.revoke).toHaveBeenCalledWith('S1', 'R1', { userId: 1 });
    expect(context.createSDK().rowAcl.revokeDept).toHaveBeenCalledWith('S1', 'R1', 10);
    expect(context.createSDK().rowAcl.revokeRole).toHaveBeenCalledWith('S1', 'R1', 'ROLE1');
  });
});
