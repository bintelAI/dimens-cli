import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { ViewSDK } from '../../src/sdk/view';

describe('ViewSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request sheet view list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ viewId: 'view_1', name: '默认视图' }],
      }),
    });

    const sdk = new ViewSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.list('TEAM1', 'PROJ1', 'S1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/sheet/S1/view/list',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request create public default view', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { viewId: 'view_1', name: '默认视图', isPublic: true },
      }),
    });

    const sdk = new ViewSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.create('TEAM1', 'PROJ1', 'S1', {
      name: '默认视图',
      type: 'grid',
      isPublic: true,
      config: {
        filters: [],
        filterMatchType: 'and',
        sortRule: null,
        groupBy: [],
        hiddenColumnIds: [],
        rowHeight: 'medium',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/sheet/S1/view/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '默认视图',
          type: 'grid',
          isPublic: true,
          config: {
            filters: [],
            filterMatchType: 'and',
            sortRule: null,
            groupBy: [],
            hiddenColumnIds: [],
            rowHeight: 'medium',
          },
        }),
      })
    );
  });
});
