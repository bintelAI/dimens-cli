import { createDimensClient } from '@/lib/dimens/client';
import { notifyTokenExpired } from '@/bridge/wujieBridge';
import type { ResolvedRuntimeContext } from '@/types/micro-module';
import { bffTokenProvider } from './bffTokenProvider';
import { hostTokenProvider } from './hostTokenProvider';
import { localDevTokenProvider, saveLocalDevAuth } from './localDevTokenProvider';
import { maskToken } from './tokenMask';
import type { AuthStatus, DimensAuthState, LoginResult, TokenProvider } from './types';

const providers: TokenProvider[] = [hostTokenProvider, bffTokenProvider, localDevTokenProvider];

export async function getToken(context: ResolvedRuntimeContext): Promise<DimensAuthState> {
  for (const provider of providers) {
    const result = await provider.getToken(context);
    if (result?.token) return result;
  }
  return { source: 'none' };
}

export async function refreshToken(
  context: ResolvedRuntimeContext,
  current: DimensAuthState
): Promise<DimensAuthState> {
  const provider = providers.find(item => item.source === current.source);
  if (provider?.refreshToken) {
    const refreshed = await provider.refreshToken(context, current);
    if (refreshed?.token) return refreshed;
  }

  if (!current.token || !current.refreshToken) {
    notifyTokenExpired(new Error('缺少 refreshToken'));
    return current;
  }

  const client = createDimensClient({
    baseUrl: context.baseUrl,
    token: current.token,
    refreshToken: current.refreshToken,
  });
  const result = await client.get<LoginResult>('/refreshToken');
  const next: DimensAuthState = {
    token: result.data.token,
    refreshToken: result.data.refreshToken || current.refreshToken,
    expire: result.data.expire,
    userInfo: result.data.userInfo || current.userInfo,
    source: current.source,
  };

  if (current.source === 'local-dev') {
    saveLocalDevAuth(next);
  }

  return next;
}

export async function logout(source?: DimensAuthState['source']) {
  if (!source || source === 'local-dev') {
    await localDevTokenProvider.logout?.();
  }
}

export function getAuthStatus(auth?: DimensAuthState): AuthStatus {
  return {
    isAuthenticated: Boolean(auth?.token),
    hasRefreshToken: Boolean(auth?.refreshToken),
    source: auth?.source || 'none',
    tokenPreview: maskToken(auth?.token),
    expire: auth?.expire,
  };
}
