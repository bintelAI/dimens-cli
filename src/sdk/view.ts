import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface ViewInfo {
  viewId: string;
  name?: string;
  type?: string;
  isPublic?: boolean;
  config?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface ViewMutationPayload {
  name?: string;
  type?: string;
  isPublic?: boolean;
  config?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export class ViewSDK {
  constructor(private readonly client: DimensClient) {}

  list(teamId: string, projectId: string, sheetId: string): Promise<APIResponse<ViewInfo[]>> {
    return this.client.get<ViewInfo[]>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/view/list`
    );
  }

  create(
    teamId: string,
    projectId: string,
    sheetId: string,
    payload: ViewMutationPayload
  ): Promise<APIResponse<ViewInfo>> {
    return this.client.post<ViewInfo>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/view/create`,
      payload
    );
  }
}
