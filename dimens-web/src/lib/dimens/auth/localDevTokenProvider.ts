import type { DimensAuthState, TokenProvider } from './types';

const KEY = 'dimens-web:auth';

export function getLocalDevAuth(): DimensAuthState | undefined {
  const raw = localStorage.getItem(KEY);
  if (!raw) return undefined;
  try {
    const auth = JSON.parse(raw) as Partial<DimensAuthState>;
    return {
      ...auth,
      source: 'local-dev',
    };
  } catch {
    return undefined;
  }
}

export function saveLocalDevAuth(auth: Omit<DimensAuthState, 'source'>) {
  localStorage.setItem(KEY, JSON.stringify({ ...auth, source: 'local-dev' }));
}

export function clearLocalDevAuth() {
  localStorage.removeItem(KEY);
}

export const localDevTokenProvider: TokenProvider = {
  source: 'local-dev',
  async getToken(context) {
    const local = getLocalDevAuth();
    if (local?.token) return local;
    if (context.token) {
      return {
        token: context.token,
        refreshToken: context.refreshToken,
        source: 'local-dev',
      };
    }
    return undefined;
  },
  logout() {
    clearLocalDevAuth();
  },
};
