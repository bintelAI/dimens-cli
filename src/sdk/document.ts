import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface DocumentInfo {
  documentId: string;
  sheetId?: string;
  rowId?: string;
  title?: string;
  content?: string;
  format?: 'richtext' | 'markdown' | 'html';
  version?: number;
  [key: string]: unknown;
}

export interface DocumentCreateWithSheetPayload {
  parentId?: string;
  title: string;
  content?: string;
  format?: 'richtext' | 'markdown' | 'html';
}

export interface DocumentUpdatePayload {
  documentId: string;
  content: string;
  version: number;
  createVersion?: boolean;
  changeSummary?: string;
}

export interface DocumentVersionsQuery {
  documentId: string;
  page?: number;
  size?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface DocumentVersionQuery {
  documentId: string;
  version: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface DocumentRestorePayload {
  documentId: string;
  version: number;
}

export interface DocumentCreateWithSheetResult {
  sheet: Record<string, unknown>;
  document: DocumentInfo;
}

export class DocumentSDK {
  constructor(private readonly client: DimensClient) {}

  createWithSheet(
    teamId: string,
    projectId: string,
    payload: DocumentCreateWithSheetPayload
  ): Promise<APIResponse<DocumentCreateWithSheetResult>> {
    return this.client.post<DocumentCreateWithSheetResult>(
      `/app/documents/${teamId}/${projectId}/document/createWithSheet`,
      payload
    );
  }

  info(teamId: string, projectId: string, documentId: string): Promise<APIResponse<DocumentInfo>> {
    return this.client.get<DocumentInfo>(
      `/app/documents/${teamId}/${projectId}/document/${documentId}/info`
    );
  }

  update(
    teamId: string,
    projectId: string,
    payload: DocumentUpdatePayload
  ): Promise<APIResponse<DocumentInfo>> {
    return this.client.post<DocumentInfo>(
      `/app/documents/${teamId}/${projectId}/document/update`,
      payload
    );
  }

  delete(
    teamId: string,
    projectId: string,
    documentId: string
  ): Promise<APIResponse<{ success?: boolean } | boolean>> {
    return this.client.post<{ success?: boolean } | boolean>(
      `/app/documents/${teamId}/${projectId}/document/delete`,
      { documentId }
    );
  }

  versions(
    teamId: string,
    projectId: string,
    query: DocumentVersionsQuery
  ): Promise<APIResponse<unknown>> {
    return this.client.get<unknown>(`/app/documents/${teamId}/${projectId}/document/versions`, query);
  }

  version(
    teamId: string,
    projectId: string,
    query: DocumentVersionQuery
  ): Promise<APIResponse<unknown>> {
    return this.client.get<unknown>(`/app/documents/${teamId}/${projectId}/document/version`, query);
  }

  restore(
    teamId: string,
    projectId: string,
    payload: DocumentRestorePayload
  ): Promise<APIResponse<DocumentInfo>> {
    return this.client.post<DocumentInfo>(
      `/app/documents/${teamId}/${projectId}/document/restore`,
      payload
    );
  }
}
