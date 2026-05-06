import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DimensClient } from '../../src/sdk/client';
import { UploadSDK } from '../../src/sdk/upload';

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

  it('should upload svg files with image/svg+xml mime type', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          fileId: 'SVG_1',
          name: 'icon.svg',
        },
      }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com',
      token: 'token-1',
    });
    const sdk = new UploadSDK(client);

    const tempDir = await mkdtemp(join(tmpdir(), 'dimens-upload-'));
    const svgPath = join(tempDir, 'icon.svg');
    await writeFile(svgPath, '<svg></svg>');

    try {
      await sdk.uploadFile(svgPath);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    const calledInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const formData = calledInit.body as FormData;
    const uploadedFile = formData.get('file') as File;
    expect(uploadedFile.type).toBe('image/svg+xml');
  });

  it('should append default material metadata fields when options do not override them', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          fileId: 'SVG_2',
          name: 'icon.svg',
        },
      }),
    });

    const client = new DimensClient({
      baseUrl: 'https://api.example.com',
      token: 'token-1',
    });
    const sdk = new UploadSDK(client);

    const tempDir = await mkdtemp(join(tmpdir(), 'dimens-upload-'));
    const svgPath = join(tempDir, 'icon.svg');
    await writeFile(svgPath, '<svg></svg>');

    try {
      await sdk.uploadFile(svgPath, {
        source: 'material',
        teamId: 'TEAM1',
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    const calledInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const formData = calledInit.body as FormData;
    expect(formData.get('source')).toBe('material');
    expect(formData.get('teamId')).toBe('TEAM1');
    expect(formData.get('name')).toBe('icon.svg');
    expect(formData.get('mimeType')).toBe('image/svg+xml');
    expect(formData.get('size')).toBeTruthy();
  });
});
