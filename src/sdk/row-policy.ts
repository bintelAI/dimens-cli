import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface RowPolicyCondition {
  columnId: string;
  operator: string;
  value: unknown;
  [key: string]: unknown;
}

export interface RowPolicyInfo {
  policyId?: string;
  sheetId?: string;
  roleId?: string;
  name?: string;
  effect?: string;
  actions?: string[];
  priority?: number;
  conditions?: RowPolicyCondition[];
  conditionMatchType?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface RowPolicyUpdatePayload {
  id: string;
  data: RowPolicyInfo;
  sheetId: string;
}

export interface RowPolicyTogglePayload {
  id: string;
  isActive: boolean;
  sheetId: string;
}

export class RowPolicySDK {
  constructor(private readonly client: DimensClient) {}

  list(projectId: string, sheetId: string): Promise<APIResponse<RowPolicyInfo[]>> {
    return this.client.get<RowPolicyInfo[]>(
      `/app/mul/project/${projectId}/row_policy/list`,
      { sheetId }
    );
  }

  info(projectId: string, id: string, sheetId: string): Promise<APIResponse<RowPolicyInfo>> {
    return this.client.get<RowPolicyInfo>(`/app/mul/project/${projectId}/row_policy/info`, {
      id,
      sheetId,
    });
  }

  create(projectId: string, payload: RowPolicyInfo): Promise<APIResponse<RowPolicyInfo>> {
    return this.client.post<RowPolicyInfo>(
      `/app/mul/project/${projectId}/row_policy/add`,
      payload
    );
  }

  update(projectId: string, payload: RowPolicyUpdatePayload): Promise<APIResponse<RowPolicyInfo>> {
    return this.client.post<RowPolicyInfo>(
      `/app/mul/project/${projectId}/row_policy/update`,
      payload
    );
  }

  delete(projectId: string, ids: string[], sheetId: string): Promise<APIResponse<unknown[]>> {
    return this.client.post<unknown[]>(`/app/mul/project/${projectId}/row_policy/delete`, {
      ids,
      sheetId,
    });
  }

  toggle(projectId: string, payload: RowPolicyTogglePayload): Promise<APIResponse<RowPolicyInfo>> {
    return this.client.post<RowPolicyInfo>(
      `/app/mul/project/${projectId}/row_policy/toggle`,
      payload
    );
  }

  check(
    projectId: string,
    payload: {
      sheetId: string;
      rowData: Record<string, unknown>;
      action: string;
      context: { userId?: number; deptId?: number; deptIds?: number[] };
    }
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/mul/project/${projectId}/row_policy/check`,
      payload
    );
  }
}
