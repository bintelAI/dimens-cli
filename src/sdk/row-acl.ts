import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface RowAclTarget {
  userId?: number;
  deptId?: number;
  roleId?: string;
}

export interface RowAclGrantPayload {
  rowId: string;
  target: RowAclTarget;
  permission: string;
  expiresAt?: string;
  canTransfer?: boolean;
}

export class RowAclSDK {
  constructor(private readonly client: DimensClient) {}

  grant(sheetId: string, payload: RowAclGrantPayload): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>('/app/mul/rowAcl/grant', {
      sheetId,
      ...payload,
    });
  }

  revoke(sheetId: string, rowId: string, target: RowAclTarget): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>('/app/mul/rowAcl/revoke', {
      sheetId,
      rowId,
      target,
    });
  }

  revokeDept(sheetId: string, rowId: string, deptId: number): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>('/app/mul/rowAcl/revokeDeptAccess', {
      sheetId,
      rowId,
      deptId,
    });
  }

  revokeRole(sheetId: string, rowId: string, roleId: string): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>('/app/mul/rowAcl/revokeRoleAccess', {
      sheetId,
      rowId,
      roleId,
    });
  }

  list(sheetId: string, rowId: string): Promise<APIResponse<Record<string, unknown>[]>> {
    return this.client.get<Record<string, unknown>[]>('/app/mul/rowAcl/list', {
      sheetId,
      rowId,
    });
  }

  roleAcls(sheetId: string, roleId: string): Promise<APIResponse<Record<string, unknown>[]>> {
    return this.client.get<Record<string, unknown>[]>('/app/mul/rowAcl/roleAcls', {
      sheetId,
      roleId,
    });
  }
}
