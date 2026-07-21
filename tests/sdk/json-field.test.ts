import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { JsonFieldSDK } from '../../src/sdk/json-field';

describe('JsonFieldSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request extended JSON field content by id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          id: 'json_1',
          sheetId: 'sh_1',
          rowId: 'row_1',
          fieldId: 'fld_json',
          content: { enabled: true },
          rootType: 'object',
          sizeBytes: 16,
          version: 2,
        },
      }),
    });

    const sdk = new JsonFieldSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.getContent('TEAM1', 'PROJ1', 'json_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/json-field/content?id=json_1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should request JSON field save with content and concurrency versions', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          storageMode: 'extended',
          id: 'json_1',
          previewText: '{"enabled":true}',
          rootType: 'object',
          sizeBytes: 16,
          version: 3,
        },
      }),
    });

    const sdk = new JsonFieldSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.save('TEAM1', 'PROJ1', {
      sheetId: 'sh_1',
      rowId: 'row_1',
      fieldId: 'fld_json',
      id: 'json_1',
      content: '{"enabled":true}',
      jsonVersion: 2,
      rowVersion: 7,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/TEAM1/PROJ1/json-field/save',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          sheetId: 'sh_1',
          rowId: 'row_1',
          fieldId: 'fld_json',
          id: 'json_1',
          content: '{"enabled":true}',
          jsonVersion: 2,
          rowVersion: 7,
        }),
      })
    );
  });
});
