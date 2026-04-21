import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface SheetInfo {
  id: string;
  name?: string;
  [key: string]: unknown;
}

export interface SheetMutationPayload {
  name?: string;
  icon?: string;
  type?: 'sheet' | 'folder' | 'document' | 'report';
  folderId?: string;
  [key: string]: unknown;
}

export class SheetSDK {
  constructor(private readonly client: DimensClient) {}

  list(projectId: string): Promise<APIResponse<SheetInfo[]>> {
    return this.client.get<SheetInfo[]>(`/app/mul/project/${projectId}/sheet/list`);
  }

  tree(projectId: string): Promise<APIResponse<unknown[]>> {
    return this.client.get<unknown[]>(`/app/mul/project/${projectId}/sheet/tree`);
  }

  create(projectId: string, payload: SheetMutationPayload): Promise<APIResponse<SheetInfo>> {
    return this.client.post<SheetInfo>(`/app/mul/project/${projectId}/sheet/create`, payload);
  }

  info(teamId: string, projectId: string, sheetId: string): Promise<APIResponse<SheetInfo>> {
    return this.client.get<SheetInfo>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/info`
    );
  }

  update(
    teamId: string,
    projectId: string,
    sheetId: string,
    payload: SheetMutationPayload
  ): Promise<APIResponse<SheetInfo>> {
    return this.client.post<SheetInfo>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/update`,
      payload
    );
  }

  delete(teamId: string, projectId: string, sheetId: string): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(
      `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/delete`
    );
  }

  structure(sheetId: string): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.get<Record<string, unknown>>(`/app/mul/sheet/${sheetId}/structure`);
  }
}
