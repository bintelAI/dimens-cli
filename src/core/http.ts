interface ErrorPayload {
  code?: number;
  message?: string;
  msg?: string;
  data?: unknown;
}

export class DimensRequestError extends Error {
  readonly status: number | undefined;
  readonly code: number | undefined;
  readonly data?: unknown;

  constructor(message: string, options: {
    status?: number | undefined;
    code?: number | undefined;
    data?: unknown;
  } = {}) {
    super(message);
    this.name = 'DimensRequestError';
    this.status = options.status;
    this.code = options.code;
    this.data = options.data;
  }
}

export async function requestJson<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json()) as ErrorPayload;
  const message = payload.message || payload.msg || `HTTP ${response.status}`;

  if (!response.ok) {
    throw new DimensRequestError(message, {
      status: response.status,
      code: payload.code,
      data: payload.data,
    });
  }

  if (payload.code !== undefined && ![0, 200, 1000].includes(payload.code)) {
    throw new DimensRequestError(message, {
      status: response.status,
      code: payload.code,
      data: payload.data,
    });
  }

  return payload as T;
}
