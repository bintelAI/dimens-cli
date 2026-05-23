import type { ResolvedRuntimeContext } from '@/types/micro-module';

export type TokenSource = 'host' | 'bff' | 'local-dev' | 'none';

export interface DimensAuthState {
  token?: string;
  refreshToken?: string;
  expire?: number;
  userInfo?: Record<string, unknown>;
  source: TokenSource;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  hasRefreshToken: boolean;
  source: TokenSource;
  tokenPreview?: string;
  expire?: number;
}

export interface TokenProvider {
  source: TokenSource;
  getToken(context: ResolvedRuntimeContext): Promise<DimensAuthState | undefined>;
  refreshToken?(context: ResolvedRuntimeContext, current: DimensAuthState): Promise<DimensAuthState | undefined>;
  logout?(): Promise<void> | void;
}

export interface LoginResult {
  token: string;
  refreshToken?: string;
  expire?: number;
  userInfo?: Record<string, unknown>;
}
