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
  source?: string;
  name?: string;
  size?: string;
  mimeType?: string;
  classifyId?: string;
  [key: string]: string | undefined;
}

export interface UploadModeResult {
  mode?: string;
  type?: string;
  cdn?: {
    enabled?: boolean;
    provider?: string;
  };
  [key: string]: unknown;
}

export interface CdnUploadTokenResult {
  provider: 'qiniu';
  bucket: string;
  domain?: string;
  uploadToken: string;
  key: string;
  fileId: string;
  url?: string;
  expiresAt?: number;
  uploadConfig?: {
    region?: string;
    useCdnDomain?: boolean;
  };
}

export interface QiniuUploadResult {
  key?: string;
  hash?: string;
  fsize?: number;
  bucket?: string;
  [key: string]: unknown;
}

interface LocalFilePayload {
  file: File;
  fileName: string;
  size: number;
  mimeType: string;
}

export class UploadSDK {
  constructor(private readonly client: DimensClient) {}

  async uploadFile(
    filePath: string,
    keyOrOptions?: string | UploadFileOptions
  ): Promise<APIResponse<UploadResponse>> {
    const payload = await this.createLocalFilePayload(filePath);

    const formData = new FormData();
    formData.append('file', payload.file, payload.file.name);

    const options =
      typeof keyOrOptions === 'string'
        ? { key: keyOrOptions }
        : (keyOrOptions ?? {});

    if (!options.name) {
      options.name = payload.file.name;
    }
    if (!options.size) {
      options.size = String(payload.file.size);
    }
    if (!options.mimeType) {
      options.mimeType = payload.file.type;
    }

    Object.entries(options).forEach(([field, value]) => {
      if (!value) {
        return;
      }
      formData.append(field, value);
    });

    return this.client.postFormData<UploadResponse>('/app/base/comm/upload', formData);
  }

  async uploadMaterialWithCdnFallback(
    filePath: string,
    options: UploadFileOptions
  ): Promise<APIResponse<UploadResponse>> {
    if (!options.teamId) {
      throw new Error('素材库上传必须携带 --team-id');
    }

    const mode = await this.getMode();
    const shouldUseCdn =
      mode.data?.cdn?.enabled === true &&
      mode.data?.cdn?.provider === 'qiniu';

    if (!shouldUseCdn) {
      return this.uploadFile(filePath, options);
    }

    const payload = await this.createLocalFilePayload(filePath);
    const normalizedOptions = this.normalizeMaterialOptions(options);
    const tokenBody: {
      teamId: string;
      fileName: string;
      size: number;
      mimeType: string;
      source: string;
      classifyId?: number;
      type?: string;
    } = {
      teamId: options.teamId,
      fileName: payload.fileName,
      size: payload.size,
      mimeType: payload.mimeType,
      source: 'material',
    };
    if (normalizedOptions.classifyId !== undefined) {
      tokenBody.classifyId = normalizedOptions.classifyId;
    }
    if (normalizedOptions.type) {
      tokenBody.type = normalizedOptions.type;
    }

    let tokenResponse: APIResponse<CdnUploadTokenResult>;
    try {
      tokenResponse = await this.createCdnUploadToken(tokenBody);
    } catch (error) {
      if (canFallbackToLocalUpload(error)) {
        return this.uploadFile(filePath, options);
      }
      throw error;
    }

    const token = tokenResponse.data;
    const qiniuResult = await this.uploadToQiniu(payload.file, token);
    const completeBody: {
      teamId: string;
      provider: 'qiniu';
      bucket: string;
      key: string;
      hash?: string;
      fileId: string;
      url?: string;
      name: string;
      size: number;
      mimeType: string;
      source: string;
      classifyId?: number;
      type?: string;
    } = {
      teamId: options.teamId,
      provider: 'qiniu',
      bucket: token.bucket,
      key: token.key,
      fileId: token.fileId,
      name: normalizedOptions.name || payload.fileName,
      size: normalizedOptions.size ?? payload.size,
      mimeType: normalizedOptions.mimeType || payload.mimeType,
      source: 'material',
    };
    if (qiniuResult.hash) {
      completeBody.hash = qiniuResult.hash;
    }
    if (token.url) {
      completeBody.url = token.url;
    }
    if (normalizedOptions.classifyId !== undefined) {
      completeBody.classifyId = normalizedOptions.classifyId;
    }
    if (normalizedOptions.type) {
      completeBody.type = normalizedOptions.type;
    }

    return this.completeCdnUpload(completeBody);
  }

  async getMode(): Promise<APIResponse<UploadModeResult>> {
    return this.client.get<UploadModeResult>('/app/base/comm/uploadMode');
  }

  private async createCdnUploadToken(body: {
    teamId: string;
    fileName: string;
    size: number;
    mimeType: string;
    source: string;
    classifyId?: number;
    type?: string;
  }): Promise<APIResponse<CdnUploadTokenResult>> {
    return this.client.post<CdnUploadTokenResult>('/app/base/comm/cdn/uploadToken', body);
  }

  private async completeCdnUpload(body: {
    teamId: string;
    provider: 'qiniu';
    bucket: string;
    key: string;
    hash?: string;
    fileId: string;
    url?: string;
    name: string;
    size: number;
    mimeType: string;
    source: string;
    classifyId?: number;
    type?: string;
  }): Promise<APIResponse<UploadResponse>> {
    return this.client.post<UploadResponse>('/app/space/info/cdn/complete', body);
  }

  private async uploadToQiniu(
    file: File,
    token: CdnUploadTokenResult
  ): Promise<QiniuUploadResult> {
    const formData = new FormData();
    formData.append('key', token.key);
    formData.append('token', token.uploadToken);
    formData.append('file', file, file.name);
    formData.append('fname', file.name);

    const response = await fetch(resolveQiniuUploadUrl(token.uploadConfig?.region), {
      method: 'POST',
      body: formData,
    });
    const payload = (await response.json()) as QiniuUploadResult & { message?: string; error?: string };

    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
    }

    return payload;
  }

  private async createLocalFilePayload(filePath: string): Promise<LocalFilePayload> {
    const fileBuffer = await readFile(filePath);
    const fileName = basename(filePath);
    const mimeType = resolveMimeType(fileName);
    const file = new File([fileBuffer], fileName, {
      type: mimeType,
      lastModified: Date.now(),
    });

    return {
      file,
      fileName,
      size: file.size,
      mimeType,
    };
  }

  private normalizeMaterialOptions(options: UploadFileOptions) {
    return {
      name: options.name,
      size: options.size ? Number(options.size) : undefined,
      mimeType: options.mimeType,
      type: options.type,
      classifyId: options.classifyId ? Number(options.classifyId) : undefined,
    };
  }
}

function resolveQiniuUploadUrl(region?: string): string {
  const regionMap: Record<string, string> = {
    z0: 'https://upload.qiniup.com',
    z1: 'https://upload-z1.qiniup.com',
    z2: 'https://upload-z2.qiniup.com',
    na0: 'https://upload-na0.qiniup.com',
    as0: 'https://upload-as0.qiniup.com',
  };

  return regionMap[String(region || 'z0')] || 'https://upload.qiniup.com';
}

function canFallbackToLocalUpload(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '');
  return (
    message.includes('CDN 未启用') ||
    message.includes('七牛 CDN 未启用') ||
    message.includes('七牛 CDN 配置不完整')
  );
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
  if (lowerFileName.endsWith('.svg')) {
    return 'image/svg+xml';
  }
  if (lowerFileName.endsWith('.csv')) {
    return 'text/csv';
  }

  return 'application/octet-stream';
}
