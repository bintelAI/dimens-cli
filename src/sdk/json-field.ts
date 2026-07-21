import type { APIResponse } from './client';
import { DimensClient } from './client';

export type JsonFieldRootType = 'object' | 'array';
export type JsonFieldValue = Record<string, unknown> | unknown[];

export interface JsonFieldContent {
  id: string;
  sheetId: string;
  rowId: string;
  fieldId: string;
  content: JsonFieldValue;
  rootType: JsonFieldRootType;
  sizeBytes: number;
  version: number;
}

export interface JsonFieldSavePayload {
  sheetId: string;
  rowId: string;
  fieldId: string;
  id?: string | null;
  content: string;
  jsonVersion?: number;
  rowVersion?: number;
}

export interface ExtendedJsonFieldReference {
  id: string;
  previewText: string;
  rootType: JsonFieldRootType;
  sizeBytes: number;
}

export type JsonFieldSaveResult =
  | {
      storageMode: 'inline';
      value: JsonFieldValue;
      content: JsonFieldValue;
      rootType: JsonFieldRootType;
      sizeBytes: number;
      row?: unknown;
    }
  | (ExtendedJsonFieldReference & {
      storageMode: 'extended';
      value: ExtendedJsonFieldReference;
      content: JsonFieldValue;
      version: number;
      row?: unknown;
    });

export class JsonFieldSDK {
  constructor(private readonly client: DimensClient) {}

  getContent(
    teamId: string,
    projectId: string,
    id: string
  ): Promise<APIResponse<JsonFieldContent>> {
    return this.client.get<JsonFieldContent>(
      `/app/mul/${teamId}/${projectId}/json-field/content`,
      { id }
    );
  }

  save(
    teamId: string,
    projectId: string,
    payload: JsonFieldSavePayload
  ): Promise<APIResponse<JsonFieldSaveResult>> {
    return this.client.post<JsonFieldSaveResult>(
      `/app/mul/${teamId}/${projectId}/json-field/save`,
      payload
    );
  }
}
