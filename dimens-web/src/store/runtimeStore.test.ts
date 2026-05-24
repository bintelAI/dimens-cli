import { beforeEach, describe, expect, it } from 'vitest';
import { getLocalDevAuth } from '@/lib/dimens/auth/localDevTokenProvider';
import { getLocalRuntime } from '@/runtime/localRuntimeStorage';
import { useRuntimeStore } from './runtimeStore';

describe('runtimeStore host persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    window.__POWERED_BY_WUJIE__ = true;
    window.__DIMENS_WEB_HOST_PROPS__ = undefined;
    window.$wujie = undefined;
    useRuntimeStore.setState({
      status: 'idle',
      error: undefined,
      auth: { source: 'none' },
    });
  });

  it('persists wujie host props into local development cache during bootstrap', async () => {
    await useRuntimeStore.getState().bootstrap({
      teamId: 'team_1',
      projectId: 'project_1',
      token: 'token_1',
      sheetId: 'sheet_1',
      instanceId: 'page_1',
      moduleCode: 'dimens-web',
      sourceLocation: 'PROJECT_MENU',
    });

    expect(getLocalRuntime()).toEqual(expect.objectContaining({
      teamId: 'team_1',
      projectId: 'project_1',
      sheetId: 'sheet_1',
      instanceId: 'page_1',
      moduleCode: 'dimens-web',
    }));
    expect(getLocalDevAuth()).toEqual(expect.objectContaining({
      token: 'token_1',
      source: 'local-dev',
    }));
  });
});
