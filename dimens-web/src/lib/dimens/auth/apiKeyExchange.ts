import { createDimensClient } from '@/lib/dimens/client';
import type { LoginResult } from './types';

export interface ApiKeyLoginPayload {
  apiKey: string;
  apiSecret: string;
}

export async function exchangeTokenByApiKey(baseUrl: string, payload: ApiKeyLoginPayload) {
  const client = createDimensClient({ baseUrl });
  return client.post<LoginResult>('/open/user/login/apiKey', payload);
}
