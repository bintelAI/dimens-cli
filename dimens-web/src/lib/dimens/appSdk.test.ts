import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDimensAppSdkFromRuntime } from './appSdk';
import { saveLocalDevAuth } from './auth/localDevTokenProvider';
import type { ResolvedRuntimeContext } from '@/types/micro-module';
import { DEFAULT_PERMISSIONS } from '@/types/micro-module';

function makeContext(): ResolvedRuntimeContext {
  return {
    baseUrl: '/api',
    teamId: 'T1',
    projectId: 'P1',
    instanceId: 'dev-instance',
    moduleCode: 'dimens-web',
    sourceLocation: 'PROJECT_MENU',
    instanceConfig: {},
    permissions: DEFAULT_PERMISSIONS,
    sheetId: 'S1',
    source: 'local',
    isWujie: false,
  };
}

describe('createDimensAppSdkFromRuntime', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('refreshes local-dev token once after a 401 and retries the request', async () => {
    saveLocalDevAuth({ token: 'expired-token', refreshToken: 'refresh-token' });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 401, message: 'expired', data: null }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        code: 200,
        data: { token: 'fresh-token', refreshToken: 'fresh-refresh' },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 200, data: { rows: [] } })));
    vi.stubGlobal('fetch', fetchMock);

    const sdk = await createDimensAppSdkFromRuntime(makeContext());
    const result = await sdk.row.page('S1', { page: 1, size: 50 });

    expect(result.data).toEqual({ rows: [] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toContain('/api/refreshToken');
    expect(fetchMock.mock.calls[2][1].headers.get('Authorization')).toBe('Bearer fresh-token');
  });
});
