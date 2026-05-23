import type { TokenProvider } from './types';

export const bffTokenProvider: TokenProvider = {
  source: 'bff',
  async getToken(context) {
    const endpoint = import.meta.env.VITE_DIMENS_TOKEN_ENDPOINT;
    if (!endpoint || context.token) return undefined;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: context.teamId,
        projectId: context.projectId,
        instanceId: context.instanceId,
        moduleCode: context.moduleCode,
        sourceLocation: context.sourceLocation,
      }),
    });

    if (!response.ok) {
      throw new Error(`BFF token 获取失败: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      data?: {
        token?: string;
        refreshToken?: string;
        expire?: number;
        userInfo?: Record<string, unknown>;
      };
      token?: string;
      refreshToken?: string;
      expire?: number;
      userInfo?: Record<string, unknown>;
    };
    const data = payload.data || payload;
    if (!data.token) return undefined;

    return {
      token: data.token,
      refreshToken: data.refreshToken,
      expire: data.expire,
      userInfo: data.userInfo,
      source: 'bff',
    };
  },
};
