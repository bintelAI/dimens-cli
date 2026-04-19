import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SheetSDK } from '../../src/sdk/sheet';
import { DimensClient } from '../../src/sdk/client';

describe('SheetSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request project sheet list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ id: 'S1', name: '表1' }],
      }),
    });

    const sdk = new SheetSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.list('PROJ1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/sheet/list',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result.data).toHaveLength(1);
  });

  it('should request sheet structure by sheet id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 'S1', columns: [] },
      }),
    });

    const sdk = new SheetSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.structure('S1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/sheet/S1/structure',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

});
