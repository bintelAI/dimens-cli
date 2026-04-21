import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';

describe('UploadSDK via DimensClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should post multipart form data without forcing json content-type', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          fileId: 'FILE_1',
          key: '/upload/20260421/demo.txt',
          url: 'https://api.example.com/upload/20260421/demo.txt',
          name: 'demo.txt',
        },
      }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com',
      token: 'token-1',
    });

    const formData = new FormData();
    formData.append(
      'file',
      new Blob(['hello'], { type: 'text/plain' }),
      'demo.txt'
    );

    const result = await client.postFormData<{ fileId: string; url: string }>(
      '/app/base/comm/upload',
      formData
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/base/comm/upload',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          Accept: 'application/json',
        }),
        body: formData,
      })
    );

    const calledInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(headers['Content-Type']).toBeUndefined();
    expect(result.data.fileId).toBe('FILE_1');
  });
});
