import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface TeamSummary {
  id: string;
  name?: string;
  remark?: string;
  description?: string;
  [key: string]: unknown;
}

export interface TeamInfo extends TeamSummary {}

export interface TeamMemberInfo {
  id?: number | string;
  userId?: number | string;
  name?: string;
  nickName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: number | string;
  departmentId?: number | string;
  [key: string]: unknown;
}

export interface TeamMembersQuery {
  projectId?: string;
  keyword?: string;
  key?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export class TeamSDK {
  constructor(private readonly client: DimensClient) {}

  info(teamId: string): Promise<APIResponse<TeamInfo>> {
    return this.client.get<TeamInfo>(`/app/org/${teamId}/team/info`);
  }

  members(
    teamId: string,
    query: TeamMembersQuery = {}
  ): Promise<APIResponse<TeamMemberInfo[]>> {
    return this.client.get<TeamMemberInfo[]>(`/app/org/${teamId}/team_user/list`, query);
  }

  userList(
    teamId: string,
    query: TeamMembersQuery = {}
  ): Promise<APIResponse<TeamMemberInfo[]>> {
    return this.members(teamId, query);
  }
}
