import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSDK } from '../../src/sdk/auth';
import { DimensClient } from '../../src/sdk/client';

describe('AuthSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should login via /login', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: '登录成功',
        data: { token: 'token-1', refreshToken: 'refresh-1' },
      }),
    });

    const sdk = new AuthSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.login({
      username: 'demo',
      password: '123456',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ username: 'demo', password: '123456' }),
      })
    );
    expect(result.data.token).toBe('token-1');
  });

  it('should refresh token via /refreshToken', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { token: 'token-2' },
      }),
    });

    const sdk = new AuthSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        refreshToken: 'refresh-1',
      })
    );

    await sdk.refreshToken();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/refreshToken',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-Refresh-Token': 'refresh-1',
        }),
      })
    );
  });

  it('should request current user info via /app/user/info/person', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 1001, username: 'demo' },
      }),
    });

    const sdk = new AuthSDK(
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
    expect(result.data.username).toBe('demo');
  });
});
