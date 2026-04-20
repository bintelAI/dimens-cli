import type { APIResponse } from './client';
import { DimensClient } from './client';

export type ResourceType = 'sheet' | 'document' | 'report' | 'page' | 'micro_module';

export interface ResourcePermission {
  visible: boolean;
  editable: boolean;
}

export interface PermissionInfo {
  id?: number;
  roleId?: string;
  sheetId?: string;
  dataAccess?: string;
  canRead?: boolean;
  canWrite?: boolean;
  columnVisibility?: Record<string, boolean>;
  columnReadonly?: Record<string, boolean>;
  resourceId?: string;
  resourceType?: ResourceType;
  resourcePermission?: ResourcePermission;
  [key: string]: unknown;
}

export interface PermissionMutationPayload extends PermissionInfo {}

export interface PermissionUpdatePayload {
  id: number;
  data: PermissionMutationPayload;
  sheetId: string;
}

export interface ResourcePermissionUpdatePayload {
  roleId: string;
  resourceId: string;
  resourceType: ResourceType;
  permission: Partial<ResourcePermission>;
}

export class PermissionSDK {
  constructor(private readonly client: DimensClient) {}

  list(projectId: string, sheetId?: string): Promise<APIResponse<PermissionInfo[]>> {
    return this.client.get<PermissionInfo[]>(
      `/app/mul/project/${projectId}/permission/list`,
      { sheetId }
    );
  }

  info(projectId: string, id: number, sheetId: string): Promise<APIResponse<PermissionInfo>> {
    return this.client.get<PermissionInfo>(`/app/mul/project/${projectId}/permission/info`, {
      id,
      sheetId,
    });
  }

  create(projectId: string, payload: PermissionMutationPayload): Promise<APIResponse<PermissionInfo>> {
    return this.client.post<PermissionInfo>(
      `/app/mul/project/${projectId}/permission/add`,
      payload
    );
  }

  update(projectId: string, payload: PermissionUpdatePayload): Promise<APIResponse<PermissionInfo>> {
    return this.client.post<PermissionInfo>(
      `/app/mul/project/${projectId}/permission/update`,
      payload
    );
  }

  delete(projectId: string, ids: number[], sheetId: string): Promise<APIResponse<unknown[]>> {
    return this.client.post<unknown[]>(`/app/mul/project/${projectId}/permission/delete`, {
      ids,
      sheetId,
    });
  }

  check(
    projectId: string,
    payload: { userId: number; sheetId: string; action: 'view' | 'edit' | 'delete' | 'manage' | 'schema' }
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.get<Record<string, unknown>>(
      `/app/mul/project/${projectId}/permission/check`,
      payload
    );
  }

  batch(projectId: string, sheetId: string, permissions: PermissionMutationPayload[]): Promise<APIResponse<unknown[]>> {
    return this.client.post<unknown[]>(`/app/mul/project/${projectId}/permission/batch`, {
      sheetId,
      permissions,
    });
  }

  updateResourcePermission(
    projectId: string,
    payload: ResourcePermissionUpdatePayload
  ): Promise<APIResponse<PermissionInfo>> {
    return this.client.post<PermissionInfo>(
      `/app/mul/project/${projectId}/permission/updateResourcePermission`,
      payload
    );
  }
}
