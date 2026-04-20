import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { DocumentSDK } from '../../src/sdk/document';

describe('DocumentSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request document createWithSheet endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          sheet: { sheetId: 'DOC_SHEET_1', type: 'document', name: '在线文档' },
          document: { documentId: 'DOC_1', title: '在线文档', format: 'richtext', version: 1 },
        },
      }),
    });

    const sdk = new DocumentSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.createWithSheet('TEAM1', 'PROJ1', {
      title: '在线文档',
      content: '<p>Hello TipTap</p>',
      format: 'richtext',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/document/createWithSheet',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: '在线文档',
          content: '<p>Hello TipTap</p>',
          format: 'richtext',
        }),
      })
    );
  });

  it('should request document info endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          documentId: 'DOC_1',
          title: '在线文档',
          content: '<p>Hello TipTap</p>',
          format: 'richtext',
          version: 3,
        },
      }),
    });

    const sdk = new DocumentSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.info('TEAM1', 'PROJ1', 'DOC_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/document/DOC_1/info',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request document update endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          documentId: 'DOC_1',
          version: 4,
        },
      }),
    });

    const sdk = new DocumentSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.update('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      content: '<p>updated</p>',
      version: 3,
      createVersion: true,
      changeSummary: '补充文档内容',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/document/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          documentId: 'DOC_1',
          content: '<p>updated</p>',
          version: 3,
          createVersion: true,
          changeSummary: '补充文档内容',
        }),
      })
    );
  });

  it('should request document delete endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true },
      }),
    });

    const sdk = new DocumentSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.delete('TEAM1', 'PROJ1', 'DOC_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/document/delete',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          documentId: 'DOC_1',
        }),
      })
    );
  });

  it('should request document versions endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          list: [
            { version: 3, changeSummary: '补充说明' },
            { version: 2, changeSummary: '修正文案' },
          ],
          pagination: { page: 1, size: 20, total: 2 },
        },
      }),
    });

    const sdk = new DocumentSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.versions('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      page: 1,
      size: 20,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/document/versions?documentId=DOC_1&page=1&size=20',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request document version endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          documentId: 'DOC_1',
          version: 3,
          content: '<p>历史版本</p>',
        },
      }),
    });

    const sdk = new DocumentSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.version('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      version: 3,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/document/version?documentId=DOC_1&version=3',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request document restore endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          documentId: 'DOC_1',
          version: 4,
        },
      }),
    });

    const sdk = new DocumentSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.restore('TEAM1', 'PROJ1', {
      documentId: 'DOC_1',
      version: 3,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/document/restore',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          documentId: 'DOC_1',
          version: 3,
        }),
      })
    );
  });
});
