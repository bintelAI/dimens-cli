import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { TeamSDK } from '../../src/sdk/team';

describe('TeamSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request team info', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 'TEAM1', name: '团队A' },
      }),
    });

    const sdk = new TeamSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    const result = await sdk.info('TEAM1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/team/info',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result.data.id).toBe('TEAM1');
  });

  it('should request team user list with query', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ id: 1001, name: '张三' }],
      }),
    });

    const sdk = new TeamSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.members('TEAM1', {
      projectId: 'PROJ1',
      keyword: '张三',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/team_user/list?projectId=PROJ1&keyword=%E5%BC%A0%E4%B8%89',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result.data).toHaveLength(1);
  });
});
