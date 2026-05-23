import type { DimensClient } from '@/lib/dimens/client';

export interface ProjectPagePayload {
  page?: number;
  size?: number;
  keyword?: string;
  [key: string]: unknown;
}

export function createProjectResource(client: DimensClient, teamId: string) {
  return {
    list(payload: ProjectPagePayload = { page: 1, size: 20 }) {
      return client.post<Record<string, unknown>>(`/app/org/${teamId}/project/page`, payload);
    },
    info(projectId: string) {
      return client.get<Record<string, unknown>>(`/app/org/${teamId}/project/info`, { id: projectId });
    },
  };
}
