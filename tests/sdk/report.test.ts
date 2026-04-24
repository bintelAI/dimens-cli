import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { ReportSDK } from '../../src/sdk/report';

describe('ReportSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request report list endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          list: [{ reportId: 'REPORT_1', name: '销售漏斗' }],
          pagination: { page: 1, size: 20, total: 1 },
        },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.list('PROJ1', { page: 1, size: 20, keyword: '销售' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/list',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ page: 1, size: 20, keyword: '销售' }),
      })
    );
  });

  it('should request report create endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { reportId: 'REPORT_1' },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.create('PROJ1', {
      name: '销售漏斗',
      description: '月度销售漏斗',
      type: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '销售漏斗',
          description: '月度销售漏斗',
          type: 1,
        }),
      })
    );
  });

  it('should request sheet create endpoint for project menu report', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          projectId: 'PROJ1',
          name: '报表 4',
          type: 'report',
          sheetId: 'sh_0hT2MlWR6RGkYqaN',
          config: {
            dashboardConfig: {
              id: 'dashboard-1',
              title: '新报表',
              widgets: [],
              parameters: [],
            },
          },
        },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    const result = await sdk.createProjectReport('PROJ1', {
      name: '报表 4',
      description: '项目菜单报表',
      dashboardId: 'dashboard-1',
      createdAt: 1776996510710,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/sheet/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '报表 4',
          type: 'report',
          config: {
            dashboardConfig: {
              id: 'dashboard-1',
              title: '报表 4',
              description: '项目菜单报表',
              widgets: [],
              parameters: [],
              createdAt: 1776996510710,
            },
          },
        }),
      })
    );
    expect(result.data.reportId).toBe('sh_0hT2MlWR6RGkYqaN');
    expect(result.data.sheetId).toBe('sh_0hT2MlWR6RGkYqaN');
  });

  it('should request report update endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.update('PROJ1', {
      reportId: 'REPORT_1',
      name: '销售漏斗-更新',
      description: '更新后的月度销售漏斗',
      type: 2,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          name: '销售漏斗-更新',
          description: '更新后的月度销售漏斗',
          type: 2,
        }),
      })
    );
  });

  it('should request report copy endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { reportId: 'REPORT_2' },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.copy('PROJ1', {
      reportId: 'REPORT_1',
      name: '销售漏斗-副本',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/copy',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          name: '销售漏斗-副本',
        }),
      })
    );
  });

  it('should request report archive endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.archive('PROJ1', { reportId: 'REPORT_1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/archive',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
        }),
      })
    );
  });

  it('should request report sort endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.sort('PROJ1', { reportId: 'REPORT_1', targetIndex: 2 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/sort',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          targetIndex: 2,
        }),
      })
    );
  });

  it('should request report move endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.move('PROJ1', { reportId: 'REPORT_1', targetProjectId: 'PROJ2' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/move',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          targetProjectId: 'PROJ2',
        }),
      })
    );
  });

  it('should request report query endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          widget_1: [{ name: '张三', value: 10 }],
        },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.query('PROJ1', {
      reportId: 'REPORT_1',
      parameterValues: { month: '2026-04' },
      widgetIds: ['widget_1'],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/query/PROJ1',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          parameterValues: { month: '2026-04' },
          widgetIds: ['widget_1'],
        }),
      })
    );
  });

  it('should request report query-widget endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          data: [{ name: '张三', value: 10 }],
          total: 1,
        },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.queryWidget('PROJ1', {
      reportId: 'REPORT_1',
      widgetId: 'widget_1',
      parameterValues: { month: '2026-04' },
      dataSource: { mode: 'sheet' },
      dataMapping: { nameKey: '名称', valueKey: '销售额' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/query/PROJ1/widget',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          widgetId: 'widget_1',
          parameterValues: { month: '2026-04' },
          dataSource: { mode: 'sheet' },
          dataMapping: { nameKey: '名称', valueKey: '销售额' },
        }),
      })
    );
  });

  it('should request report preview endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ name: '张三', value: 10 }],
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.preview('PROJ1', {
      dataSource: { mode: 'sheet' },
      dataMapping: { nameKey: '名称', valueKey: '销售额' },
      parameterValues: { month: '2026-04' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/query/PROJ1/preview',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          dataSource: { mode: 'sheet' },
          dataMapping: { nameKey: '名称', valueKey: '销售额' },
          parameterValues: { month: '2026-04' },
        }),
      })
    );
  });

  it('should request report publish endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.publish('PROJ1', { reportId: 'REPORT_1', isPublic: 1 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/publish',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          isPublic: 1,
        }),
      })
    );
  });

  it('should request report delete endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.delete('PROJ1', { reportId: 'REPORT_1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/delete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
        }),
      })
    );
  });

  it('should request report widget add endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { widgetId: 'widget_1' },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.addWidget('PROJ1', {
      reportId: 'REPORT_1',
      type: 'bar',
      title: '销售额',
      dataSource: { kind: 'sheet' },
      layout: { x: 0, y: 0, w: 6, h: 4 },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/widget/PROJ1/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          type: 'bar',
          title: '销售额',
          dataSource: { kind: 'sheet' },
          layout: { x: 0, y: 0, w: 6, h: 4 },
        }),
      })
    );
  });

  it('should request report widget delete endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.deleteWidget('PROJ1', { widgetId: 'widget_1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/widget/PROJ1/delete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          widgetId: 'widget_1',
        }),
      })
    );
  });

  it('should request report widget update endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.updateWidget('PROJ1', {
      widgetId: 'widget_1',
      title: '销售趋势',
      dataSource: {
        mode: 'sheet',
        sheet: {
          sheetId: 'S1',
          columns: [{ fieldId: 'fld_1', label: '名称', type: 'text' }],
          fieldIds: ['fld_1'],
          recommendedMapping: { nameKey: 'name', valueKey: 'value' },
          previewMapping: { nameKey: 'name', valueKey: 'value', limit: 10 },
        },
      },
      dataMapping: { nameKey: '名称', valueKey: '销售额' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/widget/PROJ1/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          widgetId: 'widget_1',
          title: '销售趋势',
          dataSource: {
            mode: 'sheet',
            sheet: {
              sheetId: 'S1',
              columns: [{ fieldId: 'fld_1', label: '名称', type: 'text' }],
              fieldIds: ['fld_1'],
              recommendedMapping: { nameKey: 'name', valueKey: 'value' },
              previewMapping: { nameKey: 'name', valueKey: 'value', limit: 10 },
            },
          },
          dataMapping: { nameKey: '名称', valueKey: '销售额' },
        }),
      })
    );
  });

  it('should request report widget batch endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.batchWidgets('PROJ1', {
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

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/widget/PROJ1/batch',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
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
        }),
      })
    );
  });

  it('should request report validate endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { valid: true, errors: [] },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.validate('PROJ1', {
      config: {
        widgets: [{ type: 'line' }],
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/PROJ1/validate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          config: {
            widgets: [{ type: 'line' }],
          },
        }),
      })
    );
  });

  it('should request report widget sort endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new ReportSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.sortWidget('PROJ1', {
      reportId: 'REPORT_1',
      widgetId: 'widget_1',
      targetOrder: 3,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/report/widget/PROJ1/sort',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          reportId: 'REPORT_1',
          widgetId: 'widget_1',
          targetOrder: 3,
        }),
      })
    );
  });
});
