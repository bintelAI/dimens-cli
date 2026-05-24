import { beforeEach, describe, expect, it } from 'vitest';
import { getWujieDebugSnapshot } from './wujieDebug';

describe('getWujieDebugSnapshot', () => {
  beforeEach(() => {
    window.__POWERED_BY_WUJIE__ = true;
    window.__DIMENS_WEB_HOST_PROPS__ = undefined;
    window.$wujie = undefined;
  });

  it('returns masked raw wujie props and merged host props', () => {
    window.$wujie = {
      props: {
        teamId: 'team_1',
        projectId: 'project_1',
        token: 'token_123456789',
        appConfig: {
          appName: '调试应用',
        },
        instanceConfig: {
          apiSecret: 'secret_123456789',
        },
      },
    };
    window.__DIMENS_WEB_HOST_PROPS__ = {
      sheetId: 'sheet_1',
      token: 'cached_token_123456789',
    };

    expect(getWujieDebugSnapshot()).toEqual({
      isWujieRuntime: true,
      wujieProps: {
        teamId: 'team_1',
        projectId: 'project_1',
        token: 'toke...6789',
        appConfig: {
          appName: '调试应用',
        },
        instanceConfig: {
          apiSecret: 'secr...6789',
        },
      },
      cachedHostProps: {
        sheetId: 'sheet_1',
        token: 'cach...6789',
      },
      mergedHostProps: {
        sheetId: 'sheet_1',
        teamId: 'team_1',
        projectId: 'project_1',
        token: 'toke...6789',
        appConfig: {
          appName: '调试应用',
        },
        instanceConfig: {
          apiSecret: 'secr...6789',
        },
      },
    });
  });
});
