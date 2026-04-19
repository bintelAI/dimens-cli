import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSDK } from '../../src/sdk/auth';
import { DimensClient } from '../../src/sdk/client';

describe('API Key Auth', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should exchange apiKey and apiSecret for token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          token: 'token-by-key',
          refreshToken: 'refresh-by-key',
          expire: 7200,
        },
      }),
    });

    const sdk = new AuthSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.loginByApiKey({
      apiKey: 'ak_xxx',
      apiSecret: 'sk_xxx',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/open/user/login/apiKey',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apiKey: 'ak_xxx', apiSecret: 'sk_xxx' }),
      })
    );
    expect(result.data.token).toBe('token-by-key');
  });

  it('should provide explicit exchangeTokenByApiKey wrapper', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          token: 'token-by-key',
          refreshToken: 'refresh-by-key',
          expire: 7200,
        },
      }),
    });

    const sdk = new AuthSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.exchangeTokenByApiKey({
      apiKey: 'ak_xxx',
      apiSecret: 'sk_xxx',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/open/user/login/apiKey',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ apiKey: 'ak_xxx', apiSecret: 'sk_xxx' }),
      })
    );
    expect(result.data.refreshToken).toBe('refresh-by-key');
  });
});
