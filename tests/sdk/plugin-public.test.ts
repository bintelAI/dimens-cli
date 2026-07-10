import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { PluginPublicSDK } from '../../src/sdk/plugin-public';

describe('PluginPublicSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should publish team plugin and query public flow plugin market', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1000, message: 'success', data: { success: true } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: { list: [{ id: 88, resourceType: 'flow_plugin' }] },
        }),
      });

    const sdk = new PluginPublicSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.publish('TEAM1', 3);
    const list = await sdk.list({ page: 1, size: 20, keyword: '审批' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/app/plugin/TEAM1/info/publish',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ id: 3 }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/app/market/resource/list?page=1&size=20&keyword=%E5%AE%A1%E6%89%B9&resourceType=flow_plugin&status=1',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(list.data.list[0]?.resourceType).toBe('flow_plugin');
  });

  it('should install public flow plugin into target team', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 501, resourceId: 88, teamId: 'TEAM2' },
      }),
    });

    const sdk = new PluginPublicSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.installFlow({
      teamId: 'TEAM2',
      resourceId: 88,
      projectScopeType: 'selected_projects',
      projectIds: ['PROJ1'],
      instanceName: '审批助手',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/market/install/flow',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          teamId: 'TEAM2',
          resourceId: 88,
          projectScopeType: 'selected_projects',
          projectIds: ['PROJ1'],
          instanceName: '审批助手',
        }),
      })
    );
  });
});
