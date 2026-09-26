import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { BookSDK } from '../../src/sdk/book';

describe('BookSDK', () => {
  const fetchMock = vi.fn();
  const sdk = new BookSDK(new DimensClient({ baseUrl: 'https://api.example.com' }));

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 1000, message: 'success', data: { id: 'resource-1' } }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates an e-magazine project under the book namespace', async () => {
    await sdk.project.create('TEAM1', { name: '刊物', projectType: 'magazine' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/e-magazine/TEAM1/project/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: '刊物', projectType: 'magazine' }),
      })
    );
  });

  it('updates an e-magazine project by path project id', async () => {
    await sdk.project.update('TEAM1', 'BOOK1', { description: '更新说明' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/e-magazine/TEAM1/project/BOOK1/update',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ description: '更新说明' }),
      })
    );
  });

  it('creates a page using the project scoped e-magazine endpoint', async () => {
    const payload = { title: '首页', draftSnapshot: { pages: [], scenes: {} } };
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1000, message: 'success', data: { id: 'BOOK1', projectType: 'magazine' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1000, message: 'success', data: { id: 'PAGE1' } }),
      });
    await sdk.page.create('TEAM1', 'BOOK1', payload);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/e-magazine/TEAM1/BOOK1/document/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ ...payload, projectType: 'magazine' }),
      })
    );
  });

  it('reads a page by project type', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1000, message: 'success', data: { id: 'BOOK1', projectType: 'magazine' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1000, message: 'success', data: null }),
      });
    await sdk.page.info('TEAM1', 'BOOK1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/app/e-magazine/TEAM1/BOOK1/document/info?projectType=magazine',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('lists all pages and scenes from the project document snapshot', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ code: 1000, message: 'success', data: { id: 'BOOK1', projectType: 'magazine' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            id: 'DOC1',
            draftSnapshot: { pages: [{ id: 'page-1' }], scenes: { home: {} } },
          },
        }),
      });

    const result = await sdk.page.list('TEAM1', 'BOOK1');

    expect(result.data).toEqual({
      document: expect.objectContaining({ id: 'DOC1' }),
      pages: [{ id: 'page-1' }],
      scenes: { home: {} },
    });
  });

  it('saves a page with its revision data', async () => {
    const payload = {
      documentId: 'PAGE1',
      baseRevision: 2,
      draftSnapshot: { pages: [{ id: 'p1' }], scenes: {} },
    };
    await sdk.page.update('TEAM1', 'BOOK1', payload);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/e-magazine/TEAM1/BOOK1/document/save',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    );
  });

  it('archives a page through the soft delete endpoint', async () => {
    await sdk.page.delete('TEAM1', 'BOOK1', 'PAGE1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/e-magazine/TEAM1/BOOK1/document/archive',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ documentId: 'PAGE1' }) })
    );
  });
});
