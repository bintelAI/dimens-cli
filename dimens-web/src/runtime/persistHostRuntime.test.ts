import { beforeEach, describe, expect, it } from 'vitest';
import { getLocalAppConfig } from '@/config/appConfig';
import { getLocalDevAuth } from '@/lib/dimens/auth/localDevTokenProvider';
import { getLocalRuntime } from './localRuntimeStorage';
import { persistHostRuntimeForDev } from './persistHostRuntime';

describe('persistHostRuntimeForDev', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores host runtime for standalone development without persisting secrets in config', () => {
    persistHostRuntimeForDev({
      teamId: 'team_1',
      projectId: 'project_1',
      token: 'token_1',
      refreshToken: 'refresh_1',
      sheetId: 'sheet_1',
      instanceId: 'page_1',
      moduleCode: 'dimens-web',
      sourceLocation: 'PROJECT_MENU',
      appConfig: {
        appName: '真实项目页面',
        moduleCode: 'dimens-web',
        defaultRoute: '/records',
        apiSecret: 'secret_should_not_store',
      } as any,
      instanceConfig: {
        apiKey: 'api_key_should_not_store',
        pageName: '客户页面',
      },
    });

    expect(getLocalRuntime()).toEqual(expect.objectContaining({
      teamId: 'team_1',
      projectId: 'project_1',
      sheetId: 'sheet_1',
      instanceId: 'page_1',
      moduleCode: 'dimens-web',
      sourceLocation: 'PROJECT_MENU',
      instanceConfig: {
        pageName: '客户页面',
      },
    }));
    expect(JSON.stringify(getLocalRuntime())).not.toContain('api_key_should_not_store');
    expect(getLocalDevAuth()).toEqual(expect.objectContaining({
      token: 'token_1',
      refreshToken: 'refresh_1',
      source: 'local-dev',
    }));
    expect(getLocalAppConfig()).toEqual(expect.objectContaining({
      appName: '真实项目页面',
      moduleCode: 'dimens-web',
      defaultRoute: '/records',
    }));
    expect(JSON.stringify(getLocalAppConfig())).not.toContain('secret_should_not_store');
  });

  it('strips secrets from nested view and action snapshots', () => {
    persistHostRuntimeForDev({
      teamId: 'team_1',
      projectId: 'project_1',
      sourceLocation: 'ROW_BUTTON_MODAL',
      viewState: {
        viewId: 'view_1',
        viewType: 'plugin',
        filters: [],
        filterMatchType: 'and',
        sortRule: null,
        groupBy: [],
        hiddenColumnIds: [],
        selectedRowIds: ['row_1'],
        displayRows: [
          {
            rowId: 'row_1',
            title: '客户 A',
            apiSecret: 'nested_secret_should_not_store',
          },
        ],
      },
      actionSnapshot: {
        trigger: { type: 'button', id: 'button_1' },
        rowId: 'row_1',
        rowSnapshot: {
          rowId: 'row_1',
          title: '客户 A',
          token: 'nested_token_should_not_store',
        },
      },
    });

    expect(JSON.stringify(getLocalRuntime())).toContain('客户 A');
    expect(JSON.stringify(getLocalRuntime())).not.toContain('nested_secret_should_not_store');
    expect(JSON.stringify(getLocalRuntime())).not.toContain('nested_token_should_not_store');
  });
});
