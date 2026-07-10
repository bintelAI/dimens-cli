import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface MarketResourceItem {
  id: number;
  resourceType: string;
  sourceId?: number;
  name?: string;
  description?: string;
  status?: number;
  teamId?: string;
  projectId?: string;
  sourceVersion?: string;
  tags?: string[];
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MarketListResult {
  list: MarketResourceItem[];
  pagination?: {
    page: number;
    size: number;
    total: number;
  };
  [key: string]: unknown;
}

export interface PluginPublicListQuery {
  page?: number;
  size?: number;
  keyword?: string;
  status?: number;
  teamId?: string;
}

export interface PluginPublicInstallFlowInput {
  teamId: string;
  resourceId: number;
  projectScopeType: 'all_projects' | 'selected_projects';
  projectIds?: string[];
  instanceName?: string;
}

export interface PluginPublicInstallInput {
  teamId: string;
  projectId?: string;
  resourceId: number;
  instanceName?: string;
}

export class PluginPublicSDK {
  constructor(private readonly client: DimensClient) {}

  publish(teamId: string, pluginId: number): Promise<APIResponse<{ success: boolean }>> {
    return this.client.post<{ success: boolean }>(
      `/app/plugin/${teamId}/info/publish`,
      { id: pluginId }
    );
  }

  list(query: PluginPublicListQuery = {}): Promise<APIResponse<MarketListResult>> {
    return this.client.get<MarketListResult>('/app/market/resource/list', {
      ...query,
      resourceType: 'flow_plugin',
      status: query.status ?? 1,
    });
  }

  detail(resourceId: number): Promise<APIResponse<MarketResourceItem>> {
    return this.client.get<MarketResourceItem>('/app/market/resource/detail', {
      id: resourceId,
    });
  }

  install(payload: PluginPublicInstallInput): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>('/app/market/install', payload);
  }

  installFlow(payload: PluginPublicInstallFlowInput): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>('/app/market/install/flow', payload);
  }

  uninstall(resourceId: number, teamId?: string): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>('/app/market/uninstall', {
      resourceId,
      ...(teamId ? { teamId } : {}),
    });
  }

  upgrade(resourceId: number, teamId?: string): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>('/app/market/upgrade', {
      resourceId,
      ...(teamId ? { teamId } : {}),
    });
  }
}
