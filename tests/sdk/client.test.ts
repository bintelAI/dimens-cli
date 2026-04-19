import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';

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

  it('should throw normalized api errors', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'token 已失效' }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com',
      token: 'bad-token',
    });

    await expect(client.get('/app/org/TEAM1/project/info', { id: 'P1' })).rejects.toThrow(
      'token 已失效'
    );
  });
});
