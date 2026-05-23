import {
  DimensAuthError,
  DimensBusinessError,
  DimensForbiddenError,
  DimensNotFoundError,
} from './errors';

export interface APIResponse<T> {
  code: number;
  message?: string;
  msg?: string;
  data: T;
}

export interface DimensClientOptions {
  baseUrl: string;
  token?: string;
  refreshToken?: string;
}

type QueryValue = string | number | boolean | null | undefined;

export interface DimensClient {
  get<T>(path: string, query?: Record<string, QueryValue>, init?: RequestInit): Promise<APIResponse<T>>;
  post<T>(path: string, body?: unknown, init?: RequestInit): Promise<APIResponse<T>>;
}

export function createDimensClient(options: DimensClientOptions): DimensClient {
  return {
    get<T>(path: string, query?: Record<string, QueryValue>, init?: RequestInit) {
      return request<T>(options, path, { ...init, method: 'GET' }, query);
    },
    post<T>(path: string, body?: unknown, init?: RequestInit) {
      return request<T>(options, path, {
        ...init,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    },
  };
}

async function request<T>(
  options: DimensClientOptions,
  path: string,
  init: RequestInit,
  query?: Record<string, QueryValue>
): Promise<APIResponse<T>> {
  const response = await fetch(buildUrl(options.baseUrl, path, query), {
    ...init,
    headers: buildHeaders(options, init.headers),
  });

  const payload = await parsePayload<T>(response);

  if (!response.ok) {
    throwByStatus(response.status, payload);
  }

  const code = payload.code;
  if (code === 401) throw new DimensAuthError(readMessage(payload), payload.data);
  if (code === 403) throw new DimensForbiddenError(readMessage(payload), payload.data);
  if (code === 404) throw new DimensNotFoundError(readMessage(payload), payload.data);
  if (code !== undefined && ![0, 200, 1000].includes(code)) {
    throw new DimensBusinessError(readMessage(payload), code, payload.data);
  }

  return payload as APIResponse<T>;
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, QueryValue>) {
  const base = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`, window.location.origin);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function buildHeaders(options: DimensClientOptions, headers?: HeadersInit): Headers {
  const next = new Headers(headers);
  next.set('Accept', 'application/json');
  if (options.token) next.set('Authorization', `Bearer ${options.token}`);
  if (options.refreshToken) next.set('X-Refresh-Token', options.refreshToken);
  return next;
}

async function parsePayload<T>(response: Response): Promise<Partial<APIResponse<T>>> {
  const text = await response.text();
  if (!text) return { code: response.status, data: undefined as T };
  try {
    return JSON.parse(text) as Partial<APIResponse<T>>;
  } catch {
    return {
      code: response.status,
      message: text,
      data: undefined as T,
    };
  }
}

function throwByStatus(status: number, payload: Partial<APIResponse<unknown>>): never {
  if (status === 401) throw new DimensAuthError(readMessage(payload), payload.data);
  if (status === 403) throw new DimensForbiddenError(readMessage(payload), payload.data);
  if (status === 404) throw new DimensNotFoundError(readMessage(payload), payload.data);
  throw new DimensBusinessError(readMessage(payload) || `HTTP ${status}`, status, payload.data);
}

function readMessage(payload: Partial<APIResponse<unknown>>) {
  return payload.message || payload.msg || '请求失败';
}
