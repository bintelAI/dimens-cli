import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ColumnSDK } from '../../src/sdk/column';
import { DimensClient } from '../../src/sdk/client';

describe('ColumnSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request column list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ id: 'F1', title: '名称' }],
      }),
    });

    const sdk = new ColumnSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.list('TEAM1', 'PROJ1', 'S1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/sheet/S1/column/list',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request column update', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 'F1', title: '新名称' },
      }),
    });

    const sdk = new ColumnSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.update('S1', 'F1', { title: '新名称' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/sheet/S1/column/F1/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: '新名称' }),
      })
    );
  });

  it('should request column create with label payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { fieldId: 'F1', label: '客户名称', type: 'text' },
      }),
    });

    const sdk = new ColumnSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.create('TEAM1', 'PROJ1', 'S1', { label: '客户名称', type: 'text' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/sheet/S1/column/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ label: '客户名称', type: 'text' }),
      })
    );
  });

  it('should request relation column create with relationConfig payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { fieldId: 'F2', label: '班级', type: 'relation' },
      }),
    });

    const sdk = new ColumnSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.create('TEAM1', 'PROJ1', 'S1', {
      label: '班级',
      type: 'relation',
      config: {
        relationConfig: {
          targetSheetId: 'sh_target',
          displayColumnId: 'fld_name',
          bidirectional: false,
        },
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/sheet/S1/column/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          label: '班级',
          type: 'relation',
          config: {
            relationConfig: {
              targetSheetId: 'sh_target',
              displayColumnId: 'fld_name',
              bidirectional: false,
            },
          },
        }),
      })
    );
  });
});
