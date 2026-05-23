import { notifyTokenExpired } from '@/bridge/wujieBridge';
import type { TokenProvider } from './types';

export const hostTokenProvider: TokenProvider = {
  source: 'host',
  async getToken(context) {
    if (!context.isWujie || !context.token) return undefined;
    return {
      token: context.token,
      refreshToken: context.refreshToken,
      source: 'host',
    };
  },
  async refreshToken(context, current) {
    notifyTokenExpired(new Error('宿主 token 需要刷新'));
    return current;
  },
};
