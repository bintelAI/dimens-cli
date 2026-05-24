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
  const scopedBase = (sheetId: string) => `/app/mul/sheet/${sheetId}/row`;

  return {
    page(sheetId: string, payload: RowPagePayload = { page: 1, size: 50 }) {
      return client.post<Record<string, unknown>>(scopedBase(sheetId) + '/page', {
        ...payload,
        teamId,
        projectId,
      });
    },
    info(sheetId: string, rowId: string) {
      return client.get<Record<string, unknown>>(scopedBase(sheetId) + `/${rowId}/info`, { teamId, projectId });
    },
  };
}
