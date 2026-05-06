import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface RowInfo {
  id: string;
  [key: string]: unknown;
}

export interface RowPagePayload {
  page?: number;
  size?: number;
  viewId?: string;
  filters?: unknown[];
  sorter?: unknown;
  [key: string]: unknown;
}

export interface RowPageResult {
  list: RowInfo[];
  total?: number;
  [key: string]: unknown;
}

export interface RowCreatePayload {
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RowBatchCreatePayload {
  rows: Array<{ data: Record<string, unknown> }>;
}

export interface RowCellPayload {
  rowId: string;
  fieldId: string;
  value: unknown;
  version?: number;
  [key: string]: unknown;
}

export class RowSDK {
  constructor(private readonly client: DimensClient) {}

  page(
    teamId: string,
    projectId: string,
    sheetId: string,
    payload: RowPagePayload
  ): Promise<APIResponse<RowPageResult>> {
    return this.client.post<RowPageResult>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/row/page`,
      payload
    );
  }

  info(
    teamId: string,
    projectId: string,
    sheetId: string,
    rowId: string
  ): Promise<APIResponse<RowInfo>> {
    return this.client.get<RowInfo>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/row/${rowId}/info`
    );
  }

  create(sheetId: string, payload: RowCreatePayload): Promise<APIResponse<RowInfo>> {
    return this.client.post<RowInfo>(`/app/mul/sheet/${sheetId}/row/create`, payload);
  }

  batchCreate(
    sheetId: string,
    payload: RowBatchCreatePayload
  ): Promise<APIResponse<RowInfo[]>> {
    return this.client.post<RowInfo[]>(
      `/app/mul/sheet/${sheetId}/row/batch-create`,
      payload
    );
  }

  update(
    sheetId: string,
    rowId: string,
    data: Record<string, unknown>,
    version: number
  ): Promise<APIResponse<RowInfo>> {
    return this.client.post<RowInfo>(`/app/mul/sheet/${sheetId}/row/${rowId}/update`, {
      data,
      version,
    });
  }

  delete(sheetId: string, rowId: string): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(`/app/mul/sheet/${sheetId}/row/${rowId}/delete`);
  }

  updateCell(sheetId: string, payload: RowCellPayload): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(`/app/mul/sheet/${sheetId}/row/cell`, payload);
  }
}
