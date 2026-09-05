import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { ProjectDictSDK } from '../../src/sdk/project-dict';

describe('ProjectDictSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 1000, message: 'success', data: { id: 1 } }),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('should create a dictionary with business codes', async () => {
    const sdk = new ProjectDictSDK(new DimensClient({ baseUrl: 'https://api.example.com' }));
    await sdk.create('TEAM1', 'PROJ1', {
      name: '客户等级',
      code: 'customer_level',
      options: [{ id: 'vip', label: 'VIP', value: 'vip' }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/org/TEAM1/PROJ1/projectDict/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '客户等级',
          code: 'customer_level',
          options: [{ id: 'vip', label: 'VIP', value: 'vip' }],
        }),
      })
    );
  });

  it('should use existing dictionary endpoints for list and update', async () => {
    const sdk = new ProjectDictSDK(new DimensClient({ baseUrl: 'https://api.example.com' }));
    await sdk.list('TEAM1', 'PROJ1', { keyword: '客户', status: 1 });
    await sdk.update('TEAM1', 'PROJ1', { id: 1, name: '客户等级' });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.example.com/app/org/TEAM1/PROJ1/projectDict/list?keyword=%E5%AE%A2%E6%88%B7&status=1'
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://api.example.com/app/org/TEAM1/PROJ1/projectDict/update'
    );
  });
});
