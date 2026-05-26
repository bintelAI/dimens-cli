import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface LoginPayload {
  username: string;
  password: string;
  captchaId?: string;
  verifyCode?: string;
}

export interface ApiKeyLoginPayload {
  apiKey: string;
  apiSecret: string;
}

export interface LoginResult {
  token: string;
  refreshToken?: string;
  expire?: number;
  userInfo?: Record<string, unknown>;
}

export interface RefreshTokenResult {
  token: string;
  refreshToken?: string;
  expire?: number;
}

export interface CurrentUserInfo {
  id?: number | string;
  username?: string;
  name?: string;
  nickName?: string;
  email?: string;
  phone?: string;
  headImg?: string;
  avatar?: string;
  [key: string]: unknown;
}

export class AuthSDK {
  constructor(private readonly client: DimensClient) {}

  login(payload: LoginPayload): Promise<APIResponse<LoginResult>> {
    return this.client.post<LoginResult>('/login', payload);
  }

  loginByApiKey(payload: ApiKeyLoginPayload): Promise<APIResponse<LoginResult>> {
    return this.client.post<LoginResult>('/open/user/login/apiKey', payload);
  }

  exchangeTokenByApiKey(
    payload: ApiKeyLoginPayload
  ): Promise<APIResponse<LoginResult>> {
    return this.loginByApiKey(payload);
  }

  refreshToken(): Promise<APIResponse<RefreshTokenResult>> {
    return this.client.get<RefreshTokenResult>('/refreshToken');
  }

  me(): Promise<APIResponse<CurrentUserInfo>> {
    return this.client.get<CurrentUserInfo>('/app/user/info/person');
  }
}
