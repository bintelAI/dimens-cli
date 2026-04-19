import { getUserAgent } from '../core/version';
import { requestJson } from '../core/http';

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

  private buildUrl(path: string, query?: QueryParams): string {
    const base = this.options.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${normalizedPath}`);

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
    hasJsonBody = false
  ): Record<string, string> {
    const merged = normalizeHeaders(headers);
    merged.Accept = 'application/json';
    merged['User-Agent'] = getUserAgent();

    if (hasJsonBody) {
      merged['Content-Type'] = 'application/json';
    }
    if (this.options.token) {
      merged.Authorization = `Bearer ${this.options.token}`;
    }
    if (this.options.refreshToken) {
      merged['X-Refresh-Token'] = this.options.refreshToken;
    }

    return merged;
  }
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
