import { basename } from 'node:path';
import { readFile } from 'node:fs/promises';
import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface UploadResponse {
  id?: string;
  fileId?: string;
  key?: string;
  url?: string;
  name?: string;
  size?: number;
  type?: string;
  mimeType?: string;
  ext?: string;
  [key: string]: unknown;
}

export interface UploadFileOptions {
  key?: string;
  type?: string;
  bizType?: string;
  scene?: string;
  teamId?: string;
  projectId?: string;
  [key: string]: string | undefined;
}

export interface UploadModeResult {
  mode?: string;
  type?: string;
  [key: string]: unknown;
}

export class UploadSDK {
  constructor(private readonly client: DimensClient) {}

  async uploadFile(
    filePath: string,
    keyOrOptions?: string | UploadFileOptions
  ): Promise<APIResponse<UploadResponse>> {
    const fileBuffer = await readFile(filePath);
    const fileName = basename(filePath);
    const file = new File([fileBuffer], fileName, {
      type: resolveMimeType(fileName),
      lastModified: Date.now(),
    });

    const formData = new FormData();
    formData.append('file', file, file.name);

    const options =
      typeof keyOrOptions === 'string'
        ? { key: keyOrOptions }
        : (keyOrOptions ?? {});

    Object.entries(options).forEach(([field, value]) => {
      if (!value) {
        return;
      }
      formData.append(field, value);
    });

    return this.client.postFormData<UploadResponse>('/app/base/comm/upload', formData);
  }

  async getMode(): Promise<APIResponse<UploadModeResult>> {
    return this.client.get<UploadModeResult>('/app/base/comm/uploadMode');
  }
}

function resolveMimeType(fileName: string): string {
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith('.txt')) {
    return 'text/plain';
  }
  if (lowerFileName.endsWith('.json')) {
    return 'application/json';
  }
  if (lowerFileName.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (lowerFileName.endsWith('.png')) {
    return 'image/png';
  }
  if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (lowerFileName.endsWith('.gif')) {
    return 'image/gif';
  }
  if (lowerFileName.endsWith('.csv')) {
    return 'text/csv';
  }

  return 'application/octet-stream';
}
