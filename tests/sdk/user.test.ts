import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { UserSDK } from '../../src/sdk/user';

describe('UserSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request current user info', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 1001, username: 'demo' },
      }),
    });

    const sdk = new UserSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    const result = await sdk.me();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/user/info/person',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
        }),
      })
    );
    expect(result.data.id).toBe(1001);
  });

  it('should expose teams returned with current user info', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 1, teams: [{ id: 'TEAM1', name: '团队A' }] },
      }),
    });

    const sdk = new UserSDK(new DimensClient({ baseUrl: 'https://api.example.com' }));
    const result = await sdk.me();

    expect(result.data.teams).toEqual([{ id: 'TEAM1', name: '团队A' }]);
  });
});
