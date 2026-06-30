import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { RichTextFieldSDK } from '../../src/sdk/richtext-field';

describe('RichTextFieldSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request richtext field content by document id', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          documentId: 'DOC_RTF_1',
          sheetId: 'sh_1',
          rowId: 'row_1',
          fieldId: 'fld_richtext',
          content: '<p>hello richtext field</p>',
          version: 2,
        },
      }),
    });

    const sdk = new RichTextFieldSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.getContent('TEAM1', 'PROJ1', 'DOC_RTF_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/richtext-field/content?documentId=DOC_RTF_1',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request richtext field save payload without markdown conversion fields', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          documentId: 'DOC_RTF_1',
          previewText: 'hello richtext field',
          content: '<p>hello richtext field</p>',
          version: 3,
        },
      }),
    });

    const sdk = new RichTextFieldSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    await sdk.save('TEAM1', 'PROJ1', {
      sheetId: 'sh_1',
      rowId: 'row_1',
      fieldId: 'fld_richtext',
      documentId: 'DOC_RTF_1',
      content: '<p>hello richtext field</p>',
      rowVersion: 7,
      title: 'AI 生成说明',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/documents/TEAM1/PROJ1/richtext-field/save',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          sheetId: 'sh_1',
          rowId: 'row_1',
          fieldId: 'fld_richtext',
          documentId: 'DOC_RTF_1',
          content: '<p>hello richtext field</p>',
          rowVersion: 7,
          title: 'AI 生成说明',
        }),
      })
    );
  });
});
