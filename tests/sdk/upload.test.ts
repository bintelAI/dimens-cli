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

  it('should upload material to qiniu cdn and complete material record when cdn is enabled', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            mode: 'local',
            type: 'local',
            cdn: {
              enabled: true,
              provider: 'qiniu',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            provider: 'qiniu',
            bucket: 'bucket',
            domain: 'https://cdn.example.com',
            uploadToken: 'upload-token',
            key: 'materials/TEAM1/20260617/icon.svg',
            fileId: 'icon',
            url: 'https://cdn.example.com/materials/TEAM1/20260617/icon.svg',
            uploadConfig: {
              region: 'z1',
              useCdnDomain: true,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          key: 'materials/TEAM1/20260617/icon.svg',
          hash: 'hash_1',
          fsize: 11,
          bucket: 'bucket',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            id: 1,
            provider: 'qiniu',
            key: 'materials/TEAM1/20260617/icon.svg',
            url: 'https://cdn.example.com/materials/TEAM1/20260617/icon.svg-bintelai.webp',
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

    let result;
    try {
      result = await sdk.uploadMaterialWithCdnFallback(svgPath, {
        teamId: 'TEAM1',
        source: 'material',
        classifyId: '8',
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/app/base/comm/uploadMode',
      expect.objectContaining({ method: 'GET' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/app/base/comm/cdn/uploadToken',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          teamId: 'TEAM1',
          fileName: 'icon.svg',
          size: 11,
          mimeType: 'image/svg+xml',
          source: 'material',
          classifyId: 8,
        }),
      })
    );

    const qiniuInit = fetchMock.mock.calls[2]?.[1] as RequestInit;
    const qiniuForm = qiniuInit.body as FormData;
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://upload-z1.qiniup.com');
    expect(qiniuForm.get('key')).toBe('materials/TEAM1/20260617/icon.svg');
    expect(qiniuForm.get('token')).toBe('upload-token');
    expect((qiniuForm.get('file') as File).name).toBe('icon.svg');

    expect(fetchMock.mock.calls[3]?.[0]).toBe('https://api.example.com/app/space/info/cdn/complete');
    const completeInit = fetchMock.mock.calls[3]?.[1] as RequestInit;
    expect(completeInit.method).toBe('POST');
    expect(JSON.parse(String(completeInit.body))).toEqual({
      teamId: 'TEAM1',
      provider: 'qiniu',
      bucket: 'bucket',
      key: 'materials/TEAM1/20260617/icon.svg',
      hash: 'hash_1',
      fileId: 'icon',
      url: 'https://cdn.example.com/materials/TEAM1/20260617/icon.svg',
      name: 'icon.svg',
      size: 11,
      mimeType: 'image/svg+xml',
      source: 'material',
      classifyId: 8,
    });
    expect(result.data.id).toBe(1);
  });

  it('should fall back to local material upload when cdn is disabled', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            cdn: {
              enabled: false,
              provider: 'local',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            fileId: 'LOCAL_1',
            url: '/upload/icon.svg',
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
      const result = await sdk.uploadMaterialWithCdnFallback(svgPath, {
        teamId: 'TEAM1',
        source: 'material',
      });
      expect(result.data.fileId).toBe('LOCAL_1');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://api.example.com/app/base/comm/upload');
  });

  it('should fall back to local material upload when cdn config is incomplete', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            cdn: {
              enabled: true,
              provider: 'qiniu',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          code: 1001,
          message: '七牛 CDN 配置不完整',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            fileId: 'LOCAL_2',
            url: '/upload/icon.svg',
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
      const result = await sdk.uploadMaterialWithCdnFallback(svgPath, {
        teamId: 'TEAM1',
        source: 'material',
      });
      expect(result.data.fileId).toBe('LOCAL_2');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[0]).toBe('https://api.example.com/app/base/comm/upload');
  });

  it('should not fall back to local upload when token endpoint rejects team access', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            cdn: {
              enabled: true,
              provider: 'qiniu',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          code: 1001,
          message: '无权上传到该团队',
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
      await expect(sdk.uploadMaterialWithCdnFallback(svgPath, {
        teamId: 'TEAM1',
        source: 'material',
      })).rejects.toThrow('无权上传到该团队');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should not complete material when qiniu upload fails', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            cdn: {
              enabled: true,
              provider: 'qiniu',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            provider: 'qiniu',
            bucket: 'bucket',
            uploadToken: 'upload-token',
            key: 'materials/TEAM1/20260617/icon.svg',
            fileId: 'icon',
            url: 'https://cdn.example.com/materials/TEAM1/20260617/icon.svg',
            uploadConfig: {
              region: 'z0',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: 'qiniu failed',
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
      await expect(sdk.uploadMaterialWithCdnFallback(svgPath, {
        teamId: 'TEAM1',
        source: 'material',
      })).rejects.toThrow('qiniu failed');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('should expose complete upload failure without falling back to local upload', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            cdn: {
              enabled: true,
              provider: 'qiniu',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            provider: 'qiniu',
            bucket: 'bucket',
            uploadToken: 'upload-token',
            key: 'materials/TEAM1/20260617/icon.svg',
            fileId: 'icon',
            url: 'https://cdn.example.com/materials/TEAM1/20260617/icon.svg',
            uploadConfig: {
              region: 'z0',
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          key: 'materials/TEAM1/20260617/icon.svg',
          hash: 'hash_1',
          fsize: 11,
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          code: 1001,
          message: '文件大小校验失败',
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
      await expect(sdk.uploadMaterialWithCdnFallback(svgPath, {
        teamId: 'TEAM1',
        source: 'material',
      })).rejects.toThrow('文件大小校验失败');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
