import type { DimensClient } from '@/lib/dimens/client';

export function createDocumentResource(client: DimensClient, teamId: string, projectId: string) {
  return {
    info(documentId: string) {
      return client.get<Record<string, unknown>>(
        `/app/documents/${teamId}/${projectId}/document/${documentId}/info`
      );
    },
    getBySheetId(sheetId: string) {
      return client.get<Record<string, unknown>>(
        `/app/documents/${teamId}/${projectId}/document/getBySheetId`,
        { sheetId }
      );
    },
  };
}
