import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface RichTextFieldDocument {
  documentId: string;
  sheetId: string;
  rowId: string;
  fieldId?: string;
  content: string;
  title?: string;
  version?: number;
  wordCount?: number;
  [key: string]: unknown;
}

export interface RichTextFieldSavePayload {
  sheetId: string;
  rowId: string;
  fieldId: string;
  documentId?: string | null;
  content: string;
  rowVersion?: number;
  title?: string;
}

export interface RichTextFieldSaveResult {
  documentId: string | null;
  previewText: string;
  content: string;
  version?: number;
  row?: unknown;
  [key: string]: unknown;
}

export class RichTextFieldSDK {
  constructor(private readonly client: DimensClient) {}

  getContent(
    teamId: string,
    projectId: string,
    documentId: string
  ): Promise<APIResponse<RichTextFieldDocument>> {
    return this.client.get<RichTextFieldDocument>(
      `/app/documents/${teamId}/${projectId}/richtext-field/content`,
      { documentId }
    );
  }

  save(
    teamId: string,
    projectId: string,
    payload: RichTextFieldSavePayload
  ): Promise<APIResponse<RichTextFieldSaveResult>> {
    return this.client.post<RichTextFieldSaveResult>(
      `/app/documents/${teamId}/${projectId}/richtext-field/save`,
      payload
    );
  }
}
