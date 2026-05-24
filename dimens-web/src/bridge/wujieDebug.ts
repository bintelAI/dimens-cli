import { getHostProps } from './wujieBridge';

const SENSITIVE_KEYS = new Set(['token', 'refreshToken', 'apiSecret', 'apiKey']);

export function getWujieDebugSnapshot() {
  return {
    isWujieRuntime: Boolean(window.__POWERED_BY_WUJIE__ || window.$wujie),
    wujieProps: maskSensitive(window.$wujie?.props || {}),
    cachedHostProps: maskSensitive(window.__DIMENS_WEB_HOST_PROPS__ || {}),
    mergedHostProps: maskSensitive(getHostProps()),
  };
}

function maskSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => maskSensitive(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEYS.has(key) ? maskValue(item) : maskSensitive(item),
    ])
  );
}

function maskValue(value: unknown) {
  if (typeof value !== 'string' || value.length <= 8) return value ? '***' : value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
