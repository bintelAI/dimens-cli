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

export type AIModelCapability = 'chat' | 'image' | 'video' | 'audio' | 'embedding' | 'rerank';
export type AIModelScope = 'platform_default' | 'team_customize';
export type AITokenScope = 'default' | 'customize';

export interface AIContextPayload {
  projectId?: string;
  resourceId?: string;
  modelScope?: AIModelScope | string;
  tokenScope?: AITokenScope | string;
}

export interface AIModelListQuery {
  capability?: AIModelCapability | string;
  modelScope?: AIModelScope | string;
  tokenScope?: AITokenScope | string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface AIModelInfo {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  [key: string]: unknown;
}

export interface AIModelListResult {
  object?: string;
  data: AIModelInfo[];
  [key: string]: unknown;
}

export interface AIImagePayload extends AIContextPayload {
  prompt: string;
  model?: string;
  n?: number;
  size?: string;
  background?: string;
  moderation?: string;
  quality?: string;
  style?: string;
  response_format?: string;
  user?: string;
  [key: string]: unknown;
}

export interface AIImageResultItem {
  url?: string;
  image_url?: string;
  b64_json?: string;
  revised_prompt?: string;
  [key: string]: unknown;
}

export interface AIImageResult {
  created?: number;
  data?: AIImageResultItem[];
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AIVideoPayload extends AIContextPayload {
  model?: string;
  prompt: string;
  seconds?: string | number;
  size?: string;
  [key: string]: unknown;
}

export interface AIVideoTaskResult {
  id: string;
  object?: string;
  model?: string;
  status?: string;
  progress?: number;
  created_at?: number;
  seconds?: string | number;
  completed_at?: number;
  expires_at?: number;
  size?: string;
  error?: {
    message?: string;
    code?: string;
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AIAudioSpeechPayload extends AIContextPayload {
  model?: string;
  input: string;
  voice: string;
  response_format?: string;
  speed?: number;
  [key: string]: unknown;
}

export interface AIEmbeddingPayload extends AIContextPayload {
  model?: string;
  input: string | string[] | number[] | number[][];
  encoding_format?: string;
  dimensions?: number;
  user?: string;
  [key: string]: unknown;
}

export interface AIRerankPayload extends AIContextPayload {
  model?: string;
  query: string;
  documents: string[] | Array<Record<string, unknown>>;
  top_n?: number;
  return_documents?: boolean;
  [key: string]: unknown;
}

export interface AIProxyRequest {
  method: 'GET' | 'POST';
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  formData?: FormData;
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

  responses(teamId: string, payload: Record<string, unknown>): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>(`/app/flow/${teamId}/v1/responses`, payload);
  }

  messages(teamId: string, payload: Record<string, unknown>): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>(`/app/flow/${teamId}/v1/messages`, payload);
  }

  models(
    teamId: string,
    query: AIModelListQuery = {}
  ): Promise<APIResponse<AIModelListResult>> {
    return this.client.get<AIModelListResult>(`/app/new-api/${teamId}/models`, query);
  }

  v1BetaModels(
    teamId: string,
    query: AIModelListQuery = {}
  ): Promise<APIResponse<AIModelListResult>> {
    return this.client.get<AIModelListResult>(`/app/flow/${teamId}/v1beta/models`, query);
  }

  generateImage(
    teamId: string,
    payload: AIImagePayload
  ): Promise<APIResponse<AIImageResult>> {
    return this.client.post<AIImageResult>(
      `/app/flow/${teamId}/v1/images/generations`,
      payload
    );
  }

  editImage(teamId: string, formData: FormData): Promise<APIResponse<AIImageResult>> {
    return this.client.postFormData<AIImageResult>(
      `/app/flow/${teamId}/v1/images/edits`,
      formData
    );
  }

  createImageVariation(
    teamId: string,
    formData: FormData
  ): Promise<APIResponse<AIImageResult>> {
    return this.client.postFormData<AIImageResult>(
      `/app/flow/${teamId}/v1/images/variations`,
      formData
    );
  }

  createVideo(
    teamId: string,
    payload: AIVideoPayload
  ): Promise<APIResponse<AIVideoTaskResult>> {
    return this.client.post<AIVideoTaskResult>(`/app/flow/${teamId}/v1/videos`, payload);
  }

  getVideo(teamId: string, taskId: string): Promise<APIResponse<AIVideoTaskResult>> {
    return this.client.get<AIVideoTaskResult>(`/app/flow/${teamId}/v1/videos/${taskId}`);
  }

  getVideoContent(teamId: string, taskId: string): Promise<APIResponse<unknown>> {
    return this.client.get<unknown>(`/app/flow/${teamId}/v1/videos/${taskId}/content`);
  }

  createSpeech(
    teamId: string,
    payload: AIAudioSpeechPayload
  ): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>(`/app/flow/${teamId}/v1/audio/speech`, payload);
  }

  transcribeAudio(teamId: string, formData: FormData): Promise<APIResponse<unknown>> {
    return this.client.postFormData<unknown>(
      `/app/flow/${teamId}/v1/audio/transcriptions`,
      formData
    );
  }

  translateAudio(teamId: string, formData: FormData): Promise<APIResponse<unknown>> {
    return this.client.postFormData<unknown>(
      `/app/flow/${teamId}/v1/audio/translations`,
      formData
    );
  }

  embeddings(
    teamId: string,
    payload: AIEmbeddingPayload
  ): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>(`/app/flow/${teamId}/v1/embeddings`, payload);
  }

  rerank(teamId: string, payload: AIRerankPayload): Promise<APIResponse<unknown>> {
    return this.client.post<unknown>(`/app/flow/${teamId}/v1/rerank`, payload);
  }

  proxy<T = unknown>(teamId: string, request: AIProxyRequest): Promise<APIResponse<T>> {
    const path = normalizeProxyPath(teamId, request.path);
    if (request.method === 'GET') {
      return this.client.get<T>(path, request.query);
    }
    if (request.formData) {
      return this.client.postFormData<T>(path, request.formData);
    }
    return this.client.post<T>(path, request.body);
  }
}

function normalizeProxyPath(teamId: string, path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    throw new Error('AI proxy path 不能为空');
  }
  if (trimmed.startsWith(`/app/flow/${teamId}/`)) {
    return trimmed;
  }
  const withoutLeadingSlash = trimmed.replace(/^\/+/, '');
  if (withoutLeadingSlash.startsWith('v1/') || withoutLeadingSlash === 'v1') {
    return `/app/flow/${teamId}/${withoutLeadingSlash}`;
  }
  if (withoutLeadingSlash.startsWith('v1beta/') || withoutLeadingSlash === 'v1beta') {
    return `/app/flow/${teamId}/${withoutLeadingSlash}`;
  }
  throw new Error('AI proxy path 只允许 v1 或 v1beta 维表代理路径');
}
