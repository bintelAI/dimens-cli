import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface ProjectInfo {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ProjectPagePayload {
  page?: number;
  size?: number;
  keyword?: string;
  [key: string]: unknown;
}

export interface ProjectPageResult {
  list: ProjectInfo[];
  pagination?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ProjectMutationPayload {
  id?: string;
  name?: string;
  description?: string;
  icon?: string;
  remark?: string;
  projectType?: string;
  coverImage?: string;
  [key: string]: unknown;
}

export class ProjectSDK {
  constructor(private readonly client: DimensClient) {}

  page(teamId: string, payload: ProjectPagePayload): Promise<APIResponse<ProjectPageResult>> {
    return this.client.post<ProjectPageResult>(`/app/org/${teamId}/project/page`, payload);
  }

  info(teamId: string, id: string): Promise<APIResponse<ProjectInfo>> {
    return this.client.get<ProjectInfo>(`/app/org/${teamId}/project/info`, { id });
  }

  create(
    teamId: string,
    payload: ProjectMutationPayload
  ): Promise<APIResponse<ProjectInfo>> {
    return this.client.post<ProjectInfo>(`/app/org/${teamId}/project/add`, payload);
  }

  update(
    teamId: string,
    payload: ProjectMutationPayload
  ): Promise<APIResponse<ProjectInfo>> {
    return this.client.post<ProjectInfo>(`/app/org/${teamId}/project/update`, payload);
  }

  trash(teamId: string, ids: string[]): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(`/app/org/${teamId}/project/trash`, { ids });
  }

  restore(teamId: string, ids: string[]): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(`/app/org/${teamId}/project/restore`, { ids });
  }
}
