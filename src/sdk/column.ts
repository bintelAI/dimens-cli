import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface ColumnInfo {
  id: string;
  title?: string;
  label?: string;
  type?: string;
  [key: string]: unknown;
}

export interface ColumnMutationPayload {
  title?: string;
  label?: string;
  type?: string;
  description?: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

export class ColumnSDK {
  constructor(private readonly client: DimensClient) {}

  list(
    teamId: string,
    projectId: string,
    sheetId: string
  ): Promise<APIResponse<ColumnInfo[]>> {
    return this.client.get<ColumnInfo[]>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/column/list`
    );
  }

  create(
    teamId: string,
    projectId: string,
    sheetId: string,
    payload: ColumnMutationPayload
  ): Promise<APIResponse<ColumnInfo>> {
    return this.client.post<ColumnInfo>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/column/create`,
      payload
    );
  }

  update(
    sheetId: string,
    fieldId: string,
    payload: ColumnMutationPayload
  ): Promise<APIResponse<ColumnInfo>> {
    return this.client.post<ColumnInfo>(
      `/app/mul/sheet/${sheetId}/column/${fieldId}/update`,
      payload
    );
  }

  delete(sheetId: string, fieldId: string): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(`/app/mul/sheet/${sheetId}/column/${fieldId}/delete`);
  }
}
