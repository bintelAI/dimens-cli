import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface CanvasGraphValue {
  nodes: unknown[];
  edges: unknown[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
  meta?: Record<string, unknown>;
}

export interface CanvasInfo {
  canvasId: string;
  sheetId: string;
  teamId?: string;
  projectId: string;
  name: string;
  data: CanvasGraphValue;
  dataHash?: string;
  version: number;
  lastEditorId?: number;
  [key: string]: unknown;
}

export interface CanvasCreatePayload {
  name: string;
  folderId?: string;
  data?: CanvasGraphValue;
}

export interface CanvasSavePayload {
  sheetId: string;
  data: CanvasGraphValue;
  baseVersion: number;
  changeSummary?: string;
}

export interface CanvasVersionListPayload {
  sheetId: string;
  page?: number;
  size?: number;
}

export interface CanvasVersionItem {
  id: string | number;
  canvasId: string;
  sheetId: string;
  version: number;
  changeSummary?: string;
  source?: string;
  createdBy?: number;
  createTime?: string;
  snapshot?: CanvasGraphValue;
  [key: string]: unknown;
}

export interface CanvasVersionListResult {
  list: CanvasVersionItem[];
  pagination?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CanvasRestorePayload {
  sheetId: string;
  version: number;
}

export interface CanvasResourcePayload {
  projectId?: string;
  sheetId?: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges?: unknown[];
  tags?: string[];
  cover?: string;
}

export interface CanvasResourceItem extends CanvasResourcePayload {
  id: string;
  visibility?: 'private' | 'market';
  status?: number;
  createdBy?: number;
  createTime?: string;
  updateTime?: string;
  publishTime?: string;
  [key: string]: unknown;
}

export interface CanvasCreateResult {
  sheetId: string;
  canvasId: string;
  type?: string;
  name?: string;
  [key: string]: unknown;
}

const EMPTY_GRAPH: CanvasGraphValue = {
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export class CanvasSDK {
  constructor(private readonly client: DimensClient) {}

  private normalizeCreatedCanvas(data: Record<string, unknown>): CanvasCreateResult {
    const sheetId =
      typeof data.sheetId === 'string'
        ? data.sheetId
        : typeof data.id === 'string'
          ? data.id
          : '';
    return {
      ...data,
      sheetId,
      canvasId: sheetId,
    } as CanvasCreateResult;
  }

  async create(
    projectId: string,
    payload: CanvasCreatePayload
  ): Promise<APIResponse<CanvasCreateResult>> {
    const response = await this.client.post<Record<string, unknown>>(
      `/app/mul/project/${projectId}/sheet/create`,
      {
        name: payload.name,
        type: 'canvas',
        ...(payload.folderId ? { folderId: payload.folderId } : {}),
        config: {
          data: payload.data ?? EMPTY_GRAPH,
        },
      }
    );
    return {
      ...response,
      data: this.normalizeCreatedCanvas((response.data || {}) as Record<string, unknown>),
    };
  }

  info(teamId: string, projectId: string, sheetId: string): Promise<APIResponse<CanvasInfo>> {
    return this.client.get<CanvasInfo>(`/app/canvas/${teamId}/${projectId}/info`, {
      sheetId,
    });
  }

  save(
    teamId: string,
    projectId: string,
    payload: CanvasSavePayload
  ): Promise<APIResponse<CanvasInfo>> {
    return this.client.post<CanvasInfo>(`/app/canvas/${teamId}/${projectId}/save`, payload);
  }

  versions(
    teamId: string,
    projectId: string,
    payload: CanvasVersionListPayload
  ): Promise<APIResponse<CanvasVersionListResult>> {
    return this.client.post<CanvasVersionListResult>(
      `/app/canvas/${teamId}/${projectId}/versions`,
      payload
    );
  }

  version(
    teamId: string,
    projectId: string,
    sheetId: string,
    version: number
  ): Promise<APIResponse<CanvasVersionItem>> {
    return this.client.get<CanvasVersionItem>(`/app/canvas/${teamId}/${projectId}/version`, {
      sheetId,
      version,
    });
  }

  restore(
    teamId: string,
    projectId: string,
    payload: CanvasRestorePayload
  ): Promise<APIResponse<CanvasInfo>> {
    return this.client.post<CanvasInfo>(`/app/canvas/${teamId}/${projectId}/restore`, payload);
  }

  listMineResources(
    teamId: string,
    keyword?: string
  ): Promise<APIResponse<CanvasResourceItem[]>> {
    return this.client.get<CanvasResourceItem[]>(`/app/canvas/${teamId}/resource/mine`, {
      keyword,
    });
  }

  saveMineResource(
    teamId: string,
    payload: CanvasResourcePayload
  ): Promise<APIResponse<CanvasResourceItem>> {
    return this.client.post<CanvasResourceItem>(`/app/canvas/${teamId}/resource/mine`, payload);
  }

  removeMineResource(teamId: string, id: string): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(`/app/canvas/${teamId}/resource/mine/delete`, { id });
  }

  publishMineResource(
    teamId: string,
    id: string
  ): Promise<APIResponse<CanvasResourceItem>> {
    return this.client.post<CanvasResourceItem>(`/app/canvas/${teamId}/resource/mine/publish`, {
      id,
    });
  }

  listMarketResources(
    teamId: string,
    keyword?: string
  ): Promise<APIResponse<CanvasResourceItem[]>> {
    return this.client.get<CanvasResourceItem[]>(`/app/canvas/${teamId}/resource/market`, {
      keyword,
    });
  }
}
