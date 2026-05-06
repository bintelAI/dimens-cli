import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RowSDK } from '../../src/sdk/row';
import { DimensClient } from '../../src/sdk/client';

describe('RowSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request row page', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { list: [{ id: 'R1' }], total: 1 },
      }),
    });

    const sdk = new RowSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.page('TEAM1', 'PROJ1', 'S1', { page: 1, size: 20 });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/sheet/S1/row/page',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ page: 1, size: 20 }),
      })
    );
  });

  it('should request row update with version', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 'R1' },
      }),
    });

    const sdk = new RowSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.update('S1', 'R1', { title: '内容' }, 3);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/sheet/S1/row/R1/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: { title: '内容' }, version: 3 }),
      })
    );
  });

  it('should request row create with data payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 'R1' },
      }),
    });

    const sdk = new RowSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.create('S1', { data: { fld_name: '华东智造' } });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/sheet/S1/row/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ data: { fld_name: '华东智造' } }),
      })
    );
  });

  it('should request row batch create with rows payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ id: 'R1' }, { id: 'R2' }],
      }),
    });

    const sdk = new RowSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.batchCreate('S1', {
      rows: [
        { data: { fld_name: '华东智造' } },
        { data: { fld_name: '华南智造' } },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/sheet/S1/row/batch-create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          rows: [
            { data: { fld_name: '华东智造' } },
            { data: { fld_name: '华南智造' } },
          ],
        }),
      })
    );
  });

  it('should request row cell update with fieldId and version', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: true,
      }),
    });

    const sdk = new RowSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.updateCell('S1', {
      rowId: 'R1',
      fieldId: 'F1',
      value: '已完成',
      version: 5,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/sheet/S1/row/cell',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          rowId: 'R1',
          fieldId: 'F1',
          value: '已完成',
          version: 5,
        }),
      })
    );
  });
});
