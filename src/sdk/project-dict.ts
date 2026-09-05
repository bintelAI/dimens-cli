import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface ProjectDictOption {
  id: string;
  label: string;
  value: string;
  color?: string;
  icon?: string;
  disabled?: boolean;
  sort?: number;
  children?: ProjectDictOption[];
}

export interface ProjectDict {
  id: string | number;
  teamId: string;
  projectId: string;
  name: string;
  code: string;
  description?: string;
  status: number;
  options: ProjectDictOption[];
  [key: string]: unknown;
}

export interface ProjectDictListParams {
  keyword?: string;
  status?: number;
}

export interface ProjectDictCreatePayload {
  name: string;
  code: string;
  description?: string;
  status?: number;
  options: ProjectDictOption[];
}

export interface ProjectDictUpdatePayload {
  id: string | number;
  name?: string;
  description?: string;
  status?: number;
  options?: ProjectDictOption[];
}

export class ProjectDictSDK {
  constructor(private readonly client: DimensClient) {}

  list(
    teamId: string,
    projectId: string,
    params?: ProjectDictListParams
  ): Promise<APIResponse<ProjectDict[]>> {
    return this.client.get<ProjectDict[]>(
      `/app/org/${teamId}/${projectId}/projectDict/list`,
      params as Record<string, string | number | undefined>
    );
  }

  info(teamId: string, projectId: string, id: string | number): Promise<APIResponse<ProjectDict>> {
    return this.client.get<ProjectDict>(`/app/org/${teamId}/${projectId}/projectDict/info`, { id });
  }

  create(
    teamId: string,
    projectId: string,
    payload: ProjectDictCreatePayload
  ): Promise<APIResponse<ProjectDict>> {
    return this.client.post<ProjectDict>(
      `/app/org/${teamId}/${projectId}/projectDict/add`,
      payload
    );
  }

  update(
    teamId: string,
    projectId: string,
    payload: ProjectDictUpdatePayload
  ): Promise<APIResponse<ProjectDict>> {
    return this.client.post<ProjectDict>(
      `/app/org/${teamId}/${projectId}/projectDict/update`,
      payload
    );
  }

  delete(teamId: string, projectId: string, id: string | number): Promise<APIResponse<void>> {
    return this.client.post<void>(`/app/org/${teamId}/${projectId}/projectDict/delete`, { id });
  }
}
