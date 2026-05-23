import type { DimensClient } from '@/lib/dimens/client';

export function createSheetResource(client: DimensClient, teamId: string, projectId: string) {
  return {
    list() {
      return client.get<Array<Record<string, unknown>>>(`/app/mul/project/${projectId}/sheet/list`);
    },
    tree() {
      return client.get<Array<Record<string, unknown>>>(`/app/mul/project/${projectId}/sheet/tree`);
    },
    info(sheetId: string) {
      return client.get<Record<string, unknown>>(`/app/mul/${teamId}/${projectId}/sheet/${sheetId}/info`);
    },
  };
}
