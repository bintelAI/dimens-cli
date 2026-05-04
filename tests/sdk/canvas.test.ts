import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CanvasSDK } from '../../src/sdk/canvas';
import { DimensClient } from '../../src/sdk/client';

describe('CanvasSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create canvas through project sheet endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          sheetId: 'canvas_1',
          name: '业务流程画布',
          type: 'canvas',
        },
      }),
    });

    const sdk = new CanvasSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'token-1',
      })
    );

    const result = await sdk.create('PROJ1', {
      name: '业务流程画布',
      folderId: 'folder_1',
      data: {
        nodes: [{ id: 'start', type: 'RECTANGLE', position: { x: 0, y: 0 } }],
        edges: [],
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/sheet/create',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '业务流程画布',
          type: 'canvas',
          folderId: 'folder_1',
          config: {
            data: {
              nodes: [{ id: 'start', type: 'RECTANGLE', position: { x: 0, y: 0 } }],
              edges: [],
            },
          },
        }),
      })
    );
    expect(result.data.sheetId).toBe('canvas_1');
    expect(result.data.canvasId).toBe('canvas_1');
  });

  it('should request canvas info endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          canvasId: 'canvas_1',
          sheetId: 'canvas_1',
          projectId: 'PROJ1',
          name: '业务流程画布',
          data: { nodes: [], edges: [] },
          version: 1,
        },
      }),
    });

    const sdk = new CanvasSDK(new DimensClient({ baseUrl: 'https://api.example.com' }));

    await sdk.info('TEAM1', 'PROJ1', 'canvas_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/canvas/TEAM1/PROJ1/info?sheetId=canvas_1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should save canvas graph endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          canvasId: 'canvas_1',
          sheetId: 'canvas_1',
          projectId: 'PROJ1',
          name: '业务流程画布',
          data: { nodes: [], edges: [] },
          version: 2,
        },
      }),
    });

    const sdk = new CanvasSDK(new DimensClient({ baseUrl: 'https://api.example.com' }));

    await sdk.save('TEAM1', 'PROJ1', {
      sheetId: 'canvas_1',
      baseVersion: 1,
      data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
      changeSummary: 'AI 生成业务工作流',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/canvas/TEAM1/PROJ1/save',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          sheetId: 'canvas_1',
          baseVersion: 1,
          data: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
          changeSummary: 'AI 生成业务工作流',
        }),
      })
    );
  });

  it('should request canvas resource market endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [],
      }),
    });

    const sdk = new CanvasSDK(new DimensClient({ baseUrl: 'https://api.example.com' }));

    await sdk.listMarketResources('TEAM1', '审批');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/canvas/TEAM1/resource/market?keyword=%E5%AE%A1%E6%89%B9',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
