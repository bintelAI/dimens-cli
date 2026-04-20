import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface RoleInfo {
  roleId: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  canManageSheets?: boolean;
  canEditSchema?: boolean;
  canEditData?: boolean;
  [key: string]: unknown;
}

export interface RoleMutationPayload {
  name?: string;
  description?: string;
  isSystem?: boolean;
  canManageSheets?: boolean;
  canEditSchema?: boolean;
  canEditData?: boolean;
  [key: string]: unknown;
}

export interface RoleUpdatePayload {
  roleId: string;
  data: RoleMutationPayload;
}

export interface RoleAssignUserPayload {
  roleId: string;
  userId: number;
  sheetId?: string;
}

export class RoleSDK {
  constructor(private readonly client: DimensClient) {}

  list(projectId: string): Promise<APIResponse<RoleInfo[]>> {
    return this.client.get<RoleInfo[]>(`/app/mul/project/${projectId}/role/list`);
  }

  info(projectId: string, roleId: string): Promise<APIResponse<RoleInfo>> {
    return this.client.get<RoleInfo>(`/app/mul/project/${projectId}/role/info`, { roleId });
  }

  create(projectId: string, payload: RoleMutationPayload): Promise<APIResponse<RoleInfo>> {
    return this.client.post<RoleInfo>(`/app/mul/project/${projectId}/role/add`, payload);
  }

  update(projectId: string, payload: RoleUpdatePayload): Promise<APIResponse<RoleInfo>> {
    return this.client.post<RoleInfo>(`/app/mul/project/${projectId}/role/update`, payload);
  }

  delete(projectId: string, roleIds: string[]): Promise<APIResponse<Array<{ success: boolean; message?: string }>>> {
    return this.client.post<Array<{ success: boolean; message?: string }>>(
      `/app/mul/project/${projectId}/role/delete`,
      { roleIds }
    );
  }

  assignUser(projectId: string, payload: RoleAssignUserPayload): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/mul/project/${projectId}/role/assignUser`,
      payload
    );
  }

  removeUser(projectId: string, payload: RoleAssignUserPayload): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/mul/project/${projectId}/role/removeUser`,
      payload
    );
  }

  userRoles(
    projectId: string,
    userId: number,
    sheetId?: string
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.get<Record<string, unknown>>(
      `/app/mul/project/${projectId}/role/userRoles`,
      { userId, sheetId }
    );
  }

  roleUsers(projectId: string, roleId: string): Promise<APIResponse<Record<string, unknown>[]>> {
    return this.client.get<Record<string, unknown>[]>(
      `/app/mul/project/${projectId}/role/roleUsers`,
      { roleId }
    );
  }

  projectUsers(projectId: string): Promise<APIResponse<Record<string, unknown>[]>> {
    return this.client.get<Record<string, unknown>[]>(
      `/app/mul/project/${projectId}/role/projectUsers`
    );
  }
}
