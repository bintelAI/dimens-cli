import type { DimensClient } from '@/lib/dimens/client';

export function createReportResource(client: DimensClient, projectId: string) {
  return {
    list(payload: Record<string, unknown> = { page: 1, size: 20 }) {
      return client.post<Record<string, unknown>>(`/app/report/${projectId}/list`, payload);
    },
    info(reportId: string) {
      return client.get<Record<string, unknown>>(`/app/report/${projectId}/info`, { reportId });
    },
  };
}
