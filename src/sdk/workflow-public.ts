import type { APIResponse } from './client';
import { DimensClient } from './client';
import type {
  FlowChatCompletionResult,
  FlowChatCompletionsPayload,
} from './flow-chat';

export interface WorkflowPublicRateLimit {
  perMinute?: number;
  concurrency?: number;
}

export interface WorkflowPublicAccessInput {
  enabled: boolean;
  runAsUserId?: number;
  projectId?: string;
  expireTime?: string;
  ipWhitelist?: string[];
  rateLimit?: WorkflowPublicRateLimit;
  remark?: string;
}

export interface WorkflowPublicAccessView {
  publicId?: string;
  endpoint?: string;
  enabled?: boolean;
  runAsUserId?: number;
  projectId?: string;
  expireTime?: string;
  ipWhitelist?: string[];
  rateLimit?: WorkflowPublicRateLimit;
  lastUsedTime?: string;
  lastUsedIp?: string;
  remark?: string;
  [key: string]: unknown;
}

export interface WorkflowPublicAccessSecretView extends WorkflowPublicAccessView {
  publicSecret?: string;
}

export class WorkflowPublicSDK {
  constructor(private readonly client: DimensClient) {}

  get(teamId: string, flowId: number): Promise<APIResponse<WorkflowPublicAccessView>> {
    return this.client.get<WorkflowPublicAccessView>(
      `/app/flow/${teamId}/info/${flowId}/public-access`
    );
  }

  upsert(
    teamId: string,
    flowId: number,
    payload: WorkflowPublicAccessInput
  ): Promise<APIResponse<WorkflowPublicAccessSecretView>> {
    return this.client.put<WorkflowPublicAccessSecretView>(
      `/app/flow/${teamId}/info/${flowId}/public-access`,
      payload
    );
  }

  disable(
    teamId: string,
    flowId: number
  ): Promise<APIResponse<WorkflowPublicAccessView>> {
    return this.upsert(teamId, flowId, { enabled: false });
  }

  resetSecret(
    teamId: string,
    flowId: number
  ): Promise<APIResponse<WorkflowPublicAccessSecretView>> {
    return this.client.post<WorkflowPublicAccessSecretView>(
      `/app/flow/${teamId}/info/${flowId}/public-access/reset-secret`
    );
  }

  invoke(
    publicId: string,
    publicSecret: string,
    payload: FlowChatCompletionsPayload
  ): Promise<APIResponse<FlowChatCompletionResult>> {
    return this.client.post<FlowChatCompletionResult>(
      `/open/flow/${publicId}/v1/chat/completions`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${publicSecret}`,
        },
      }
    );
  }
}
