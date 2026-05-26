import { describe, expect, it, beforeEach } from 'vitest';
import { resolveRuntimeContext } from './resolveRuntimeContext';

describe('resolveRuntimeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    window.__POWERED_BY_WUJIE__ = false;
    window.__DIMENS_WEB_HOST_PROPS__ = undefined;
    window.history.replaceState(null, '', '/');
  });

  it('uses url values in standalone mode', () => {
    window.history.replaceState(null, '', '/?teamId=T1&projectId=P1&sheetId=S1&token=tok');

    const result = resolveRuntimeContext();

    expect(result.context.teamId).toBe('T1');
    expect(result.context.projectId).toBe('P1');
    expect(result.context.sheetId).toBe('S1');
    expect(result.context.token).toBe('tok');
    expect(result.missing).toEqual([]);
  });

  it('lets host props win in wujie mode', () => {
    localStorage.setItem('dimens-web:runtime', JSON.stringify({ teamId: 'LOCAL', projectId: 'LOCAL' }));
    window.__POWERED_BY_WUJIE__ = true;

    const result = resolveRuntimeContext({ teamId: 'HOST', projectId: 'PROJ', token: 'host-token' });

    expect(result.context.teamId).toBe('HOST');
    expect(result.context.projectId).toBe('PROJ');
    expect(result.context.token).toBe('host-token');
    expect(result.context.source).toBe('host');
  });

  it('keeps view state from host props in view runtime', () => {
    window.__POWERED_BY_WUJIE__ = true;

    const result = resolveRuntimeContext({
      teamId: 'T1',
      projectId: 'P1',
      sheetId: 'S1',
      viewId: 'V1',
      sourceLocation: 'SHEET_VIEW',
      viewState: {
        viewId: 'V1',
        viewType: 'plugin',
        filters: [{ fieldId: 'status', operator: 'eq', value: 'open' }],
        filterMatchType: 'and',
        sortRule: null,
        groupBy: [],
        hiddenColumnIds: ['secret'],
        selectedRowIds: ['R1'],
        displayRows: [{ rowId: 'R1', title: '任务一' }],
        displayState: { source: 'filtered', lastUpdatedAt: 100 },
      },
    });

    expect(result.context.sourceLocation).toBe('SHEET_VIEW');
    expect(result.context.viewState).toEqual(expect.objectContaining({
      viewId: 'V1',
      selectedRowIds: ['R1'],
      displayRows: [{ rowId: 'R1', title: '任务一' }],
    }));
  });

  it('keeps action snapshot from host props in button runtime', () => {
    window.__POWERED_BY_WUJIE__ = true;

    const result = resolveRuntimeContext({
      teamId: 'T1',
      projectId: 'P1',
      sheetId: 'S1',
      viewId: 'V1',
      rowId: 'R1',
      columnId: 'C1',
      sourceLocation: 'ROW_BUTTON_MODAL',
      actionSnapshot: {
        trigger: { type: 'button', id: 'C1', label: '处理' },
        sheetId: 'S1',
        viewId: 'V1',
        rowId: 'R1',
        columnId: 'C1',
        fieldId: 'fld_button',
        recordIds: ['R1'],
        selectedRowIds: ['R1', 'R2'],
        rowSnapshot: { rowId: 'R1', title: '客户 A' },
      },
    });

    expect(result.context.sourceLocation).toBe('ROW_BUTTON_MODAL');
    expect(result.context.actionSnapshot).toEqual(expect.objectContaining({
      rowId: 'R1',
      rowSnapshot: { rowId: 'R1', title: '客户 A' },
      selectedRowIds: ['R1', 'R2'],
    }));
  });

  it('reports missing required context without token as non-blocking token missing', () => {
    const result = resolveRuntimeContext({ teamId: 'T1' });

    expect(result.missing).toContain('projectId');
    expect(result.missing).toContain('token');
  });

  it('keeps local runtime values after refreshing a hash route without query params', () => {
    localStorage.setItem(
      'dimens-web:runtime',
      JSON.stringify({ teamId: 'LOCAL_TEAM', projectId: 'LOCAL_PROJECT', sheetId: 'LOCAL_SHEET' })
    );
    window.history.replaceState(null, '', '/#/settings');

    const result = resolveRuntimeContext();

    expect(result.context.teamId).toBe('LOCAL_TEAM');
    expect(result.context.projectId).toBe('LOCAL_PROJECT');
    expect(result.context.sheetId).toBe('LOCAL_SHEET');
  });
});
