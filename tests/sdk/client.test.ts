import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient, DimensRequestError } from '../../src/sdk/client';

describe('DimensClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should append auth headers and serialize json body', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 1000, message: 'success', data: { id: 'P1' } }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com/',
      token: 'token-1',
    });

    const result = await client.post<{ id: string }>('/app/org/TEAM1/project/add', {
      name: '项目A',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/project/add',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ name: '项目A' }),
      })
    );
    expect(result).toEqual({ code: 1000, message: 'success', data: { id: 'P1' } });
  });

  it('should build query string for get requests', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 1000, message: 'success', data: { id: 'P1' } }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com',
    });

    await client.get('/app/org/TEAM1/project/info', {
      id: 'P1',
      includeStats: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/project/info?id=P1&includeStats=true',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should resolve a relative base url against the browser origin', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://app.example.com' } });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 1000, message: 'success', data: { id: 'P1' } }),
    });

    const client = new DimensClient({ baseUrl: '/api' });
    await client.get('/app/org/TEAM1/project/info', { id: 'P1' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.example.com/api/app/org/TEAM1/project/info?id=P1',
      expect.any(Object)
    );
  });

  it('should not send user-agent from a browser runtime', async () => {
    vi.stubGlobal('window', { location: { origin: 'https://app.example.com' } });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 1000, message: 'success', data: true }),
    });

    const client = new DimensClient({ baseUrl: '/api' });
    await client.get('/health');

    expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty('User-Agent');
  });

  it('should throw structured http errors', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'token 已失效' }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com',
      token: 'bad-token',
    });

    const promise = client.get('/app/org/TEAM1/project/info', { id: 'P1' });
    await expect(promise).rejects.toMatchObject({
      name: 'DimensRequestError',
      message: 'token 已失效',
      status: 401,
    });
    await expect(promise).rejects.toBeInstanceOf(DimensRequestError);
  });

  it('should throw structured business errors', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ code: 401, message: 'token 已过期', data: { reason: 'expired' } }),
    });

    const client = new DimensClient({ baseUrl: 'https://api.example.com' });

    await expect(client.get('/app/user/info/person')).rejects.toMatchObject({
      name: 'DimensRequestError',
      message: 'token 已过期',
      code: 401,
      data: { reason: 'expired' },
    });
  });

  it('should let explicit authorization headers override profile token', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 1000, message: 'success', data: { ok: true } }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com',
      token: 'user-token',
    });

    await client.post('/open/flow/wfpub_1/v1/chat/completions', {
      messages: [{ role: 'user', content: '你好' }],
    }, {
      headers: {
        Authorization: 'Bearer wfsk_public',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/open/flow/wfpub_1/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer wfsk_public',
        }),
      })
    );
  });
});
