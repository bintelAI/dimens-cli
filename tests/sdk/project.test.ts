import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectSDK } from '../../src/sdk/project';
import { DimensClient } from '../../src/sdk/client';

describe('ProjectSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request project page list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          list: [{ id: 'P1', name: '项目A' }],
          pagination: { page: 1, size: 20, total: 1 },
        },
      }),
    });

    const sdk = new ProjectSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    const result = await sdk.page('TEAM1', { page: 1, size: 20 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/project/page',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ page: 1, size: 20 }),
      })
    );
    expect(result.data.list).toHaveLength(1);
  });

  it('should request project info with query id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 'P1', name: '项目A' },
      }),
    });

    const sdk = new ProjectSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.info('TEAM1', 'P1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/project/info?id=P1',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should call project restore endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: '恢复成功',
        data: true,
      }),
    });

    const sdk = new ProjectSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.restore('TEAM1', ['P1', 'P2']);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/project/restore',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ids: ['P1', 'P2'] }),
      })
    );
  });
});
