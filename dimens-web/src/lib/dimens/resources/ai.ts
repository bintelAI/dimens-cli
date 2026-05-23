import type { DimensClient } from '@/lib/dimens/client';

export interface FlowChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function createAiResource(client: DimensClient, teamId: string) {
  return {
    completions(payload: { model?: string | number; messages: FlowChatMessage[]; stream?: boolean }) {
      return client.post<Record<string, unknown>>(`/app/flow/${teamId}/v1/chat/completions`, payload);
    },
  };
}
