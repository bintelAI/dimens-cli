export class DimensError extends Error {
  readonly code?: number;
  readonly data?: unknown;

  constructor(message: string, options: { code?: number; data?: unknown } = {}) {
    super(message);
    this.name = 'DimensError';
    this.code = options.code;
    this.data = options.data;
  }
}

export class DimensAuthError extends DimensError {
  constructor(message = '登录已失效，请重新获取 token', data?: unknown) {
    super(message, { code: 401, data });
    this.name = 'DimensAuthError';
  }
}

export class DimensForbiddenError extends DimensError {
  constructor(message = '无权访问该资源', data?: unknown) {
    super(message, { code: 403, data });
    this.name = 'DimensForbiddenError';
  }
}

export class DimensNotFoundError extends DimensError {
  constructor(message = '资源不存在，请检查 teamId/projectId/sheetId', data?: unknown) {
    super(message, { code: 404, data });
    this.name = 'DimensNotFoundError';
  }
}

export class DimensBusinessError extends DimensError {
  constructor(message: string, code?: number, data?: unknown) {
    super(message, { code, data });
    this.name = 'DimensBusinessError';
  }
}
