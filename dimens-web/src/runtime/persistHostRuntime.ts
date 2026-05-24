import { saveLocalAppConfig } from '@/config/appConfig';
import { saveLocalDevAuth } from '@/lib/dimens/auth/localDevTokenProvider';
import type { DimensWebHostProps } from '@/types/micro-module';
import { saveLocalRuntime } from './localRuntimeStorage';

const SENSITIVE_CONFIG_KEYS = new Set(['apiSecret', 'apiKey', 'token', 'refreshToken']);

export function persistHostRuntimeForDev(props?: DimensWebHostProps) {
  if (!props || Object.keys(props).length === 0) return;

  const { token, refreshToken, appConfig, ...runtime } = props;
  saveLocalRuntime(stripSensitive(runtime) as DimensWebHostProps);

  if (token) {
    saveLocalDevAuth({ token, refreshToken });
  }

  if (appConfig) {
    saveLocalAppConfig(stripSensitive(appConfig));
  }
}

function stripSensitive<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => stripSensitive(item)) as T;
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_CONFIG_KEYS.has(key))
      .map(([key, item]) => [key, stripSensitive(item)])
  ) as T;
}
