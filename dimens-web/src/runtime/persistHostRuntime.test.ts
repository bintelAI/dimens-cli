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
});
