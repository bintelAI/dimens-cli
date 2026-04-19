import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface FlowChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface FlowChatCompletionsPayload {
  model?: string | number;
  messages: FlowChatMessage[];
  stream?: boolean;
  user?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface FlowChatCompletionChoice {
  index?: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason?: string | null;
}

export interface FlowChatCompletionResult {
  id: string;
  object?: string;
  created?: number;
  model?: string;
  choices: FlowChatCompletionChoice[];
  usage?: Record<string, unknown>;
}

export class FlowChatSDK {
  constructor(private readonly client: DimensClient) {}

  completions(
    teamId: string,
    payload: FlowChatCompletionsPayload
  ): Promise<APIResponse<FlowChatCompletionResult>> {
    return this.client.post<FlowChatCompletionResult>(
      `/app/flow/${teamId}/v1/chat/completions`,
      payload
    );
  }
}
