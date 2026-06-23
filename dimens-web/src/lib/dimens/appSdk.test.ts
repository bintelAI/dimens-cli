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
    vi.unstubAllEnvs();
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

  it('reads row pages through the sheet-scoped row endpoint with project context', async () => {
    saveLocalDevAuth({ token: 'token' });
    const fetchMock = vi.fn()
      .mockResolvedValue(new Response(JSON.stringify({ code: 200, data: { list: [], pagination: { total: 0 } } })));
    vi.stubGlobal('fetch', fetchMock);

    const sdk = await createDimensAppSdkFromRuntime(makeContext());
    await sdk.row.page('S1', { page: 1, size: 50 });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/app/mul/sheet/S1/row/page'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          page: 1,
          size: 50,
          teamId: 'T1',
          projectId: 'P1',
        }),
      })
    );
  });

  it('refreshes bff token after a 401 even when no refreshToken is available', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: { token: 'bff-token-1' },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 401, message: 'expired', data: null }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        data: { token: 'bff-token-2' },
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 200, data: { list: [] } })));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('VITE_DIMENS_TOKEN_ENDPOINT', '/bff/token');

    const sdk = await createDimensAppSdkFromRuntime(makeContext());
    const result = await sdk.row.page('S1', { page: 1, size: 50 });

    expect(result.data).toEqual({ list: [] });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[0][0]).toContain('/bff/token');
    expect(fetchMock.mock.calls[1][1].headers.get('Authorization')).toBe('Bearer bff-token-1');
    expect(fetchMock.mock.calls[2][0]).toContain('/bff/token');
    expect(fetchMock.mock.calls[3][1].headers.get('Authorization')).toBe('Bearer bff-token-2');
  });

});
