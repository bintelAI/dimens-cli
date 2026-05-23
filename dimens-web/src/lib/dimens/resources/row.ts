import type { DimensClient } from '@/lib/dimens/client';

export interface RowPagePayload {
  page?: number;
  size?: number;
  viewId?: string;
  filters?: unknown[];
  sorter?: unknown;
  [key: string]: unknown;
}

export function createRowResource(client: DimensClient, teamId: string, projectId: string) {
  return {
    page(sheetId: string, payload: RowPagePayload = { page: 1, size: 50 }) {
      return client.post<Record<string, unknown>>(
        `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/row/page`,
        payload
      );
    },
    info(sheetId: string, rowId: string) {
      return client.get<Record<string, unknown>>(
        `/app/mul/${teamId}/${projectId}/sheet/${sheetId}/row/${rowId}/info`
      );
    },
  };
}
