import type { APIResponse } from './client';
import { DimensClient } from './client';
import type { TeamSummary } from './team';

export interface UserInfo {
  id?: number | string;
  username?: string;
  name?: string;
  nickName?: string;
  email?: string;
  phone?: string;
  headImg?: string;
  avatar?: string;
  teams?: TeamSummary[];
  [key: string]: unknown;
}

export class UserSDK {
  constructor(private readonly client: DimensClient) {}

  me(): Promise<APIResponse<UserInfo>> {
    return this.client.get<UserInfo>('/app/user/info/person');
  }
}
