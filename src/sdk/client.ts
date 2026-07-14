import { requestJson } from '../core/http';
import { getUserAgent } from '../core/version';

export { DimensRequestError } from '../core/http';

export interface DimensClientOptions {
  baseUrl: string;
  token?: string;
  refreshToken?: string;
  teamId?: string;
  projectId?: string;
}

export interface APIResponse<T> {
  code: number;
  message: string;
  data: T;
}

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;
type HeaderTupleList = Array<[string, string]> | string[][];
type HeaderObjectInput = Record<string, string | readonly string[]>;

export class DimensClient {
  private readonly options: DimensClientOptions;

  constructor(options: DimensClientOptions) {
    this.options = options;
  }

  getOptions(): DimensClientOptions {
    return { ...this.options };
  }

  async get<T>(
    path: string,
    query?: QueryParams,
    init: RequestInit = {}
  ): Promise<APIResponse<T>> {
    return requestJson<APIResponse<T>>(this.buildUrl(path, query), {
      ...init,
      method: 'GET',
      headers: this.buildHeaders(init.headers),
    });
  }

  async post<T>(
    path: string,
    body?: unknown,
    init: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const requestInit: RequestInit = {
      ...init,
      method: 'POST',
      headers: this.buildHeaders(init.headers, true),
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    return requestJson<APIResponse<T>>(this.buildUrl(path), requestInit);
  }

  async put<T>(
    path: string,
    body?: unknown,
    init: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const requestInit: RequestInit = {
      ...init,
      method: 'PUT',
      headers: this.buildHeaders(init.headers, true),
    };

    if (body !== undefined) {
      requestInit.body = JSON.stringify(body);
    }

    return requestJson<APIResponse<T>>(this.buildUrl(path), requestInit);
  }

  async postFormData<T>(
    path: string,
    formData: FormData,
    init: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const requestInit: RequestInit = {
      ...init,
      method: 'POST',
      headers: this.buildHeaders(init.headers, false, true),
      body: formData,
    };

    return requestJson<APIResponse<T>>(this.buildUrl(path), requestInit);
  }

  private buildUrl(path: string, query?: QueryParams): string {
    const base = this.options.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const browserOrigin = getBrowserOrigin();
    const url = browserOrigin
      ? new URL(`${base}${normalizedPath}`, browserOrigin)
      : new URL(`${base}${normalizedPath}`);

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      url.searchParams.set(key, String(value));
    });

    return url.toString();
  }

  private buildHeaders(
    headers?: unknown,
    hasJsonBody = false,
    hasFormDataBody = false
  ): Record<string, string> {
    const merged = normalizeHeaders(headers);
    merged.Accept = 'application/json';
    if (!getBrowserOrigin()) {
      merged['User-Agent'] = getUserAgent();
    }

    if (hasJsonBody && !hasFormDataBody) {
      merged['Content-Type'] = 'application/json';
    }
    if (hasFormDataBody) {
      delete merged['Content-Type'];
    }
    if (this.options.token && !hasHeader(merged, 'Authorization')) {
      merged.Authorization = `Bearer ${this.options.token}`;
    }
    if (this.options.refreshToken && !hasHeader(merged, 'X-Refresh-Token')) {
      merged['X-Refresh-Token'] = this.options.refreshToken;
    }

    return merged;
  }
}

function getBrowserOrigin(): string | undefined {
  const browserWindow = (globalThis as { window?: { location?: { origin?: string } } }).window;
  return browserWindow?.location?.origin;
}

function hasHeader(headers: Record<string, string>, name: string): boolean {
  const normalizedName = name.toLowerCase();
  return Object.keys(headers).some(key => key.toLowerCase() === normalizedName);
}

function normalizeHeaders(headers?: unknown): Record<string, string> {
  if (!headers) {
    return {};
  }
  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(
      (headers as HeaderTupleList).map(([key, value]) => [String(key), String(value)])
    );
  }
  const normalized: Record<string, string> = {};
  Object.entries(headers as HeaderObjectInput).forEach(([key, value]) => {
    normalized[key] = typeof value === 'string' ? value : value.join(', ');
  });
  return normalized;
}
