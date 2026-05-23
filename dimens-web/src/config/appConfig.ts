import type { DimensWebHostProps } from '@/types/micro-module';

export interface DimensWebAppConfig {
  appName: string;
  moduleCode: string;
  defaultRoute: string;
  defaultSheetId?: string;
  features: {
    records: boolean;
    settings: boolean;
    debug: boolean;
  };
  theme: {
    primaryColor: string;
    density: 'compact' | 'comfortable';
  };
}

export const DEFAULT_APP_CONFIG: DimensWebAppConfig = {
  appName: 'Dimens Web',
  moduleCode: import.meta.env.VITE_DEV_MODULE_CODE || 'dimens-web',
  defaultRoute: import.meta.env.VITE_DEV_INITIAL_ROUTE || '/',
  defaultSheetId: import.meta.env.VITE_DEV_SHEET_ID || undefined,
  features: {
    records: true,
    settings: true,
    debug: true,
  },
  theme: {
    primaryColor: '#b86e3c',
    density: 'comfortable',
  },
};

export function mergeAppConfig(
  base: DimensWebAppConfig,
  patch?: Partial<DimensWebAppConfig>
): DimensWebAppConfig {
  if (!patch) return base;

  return {
    ...base,
    ...patch,
    features: {
      ...base.features,
      ...(patch.features || {}),
    },
    theme: {
      ...base.theme,
      ...(patch.theme || {}),
    },
  };
}

export function getLocalAppConfig(): Partial<DimensWebAppConfig> | undefined {
  const raw = localStorage.getItem('dimens-web:app-config');
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Partial<DimensWebAppConfig>;
  } catch {
    return undefined;
  }
}

export function saveLocalAppConfig(config: Partial<DimensWebAppConfig>) {
  localStorage.setItem('dimens-web:app-config', JSON.stringify(config));
}

export async function loadAppConfig(hostProps?: DimensWebHostProps): Promise<DimensWebAppConfig> {
  let config = mergeAppConfig(DEFAULT_APP_CONFIG, getLocalAppConfig());

  const configUrl = getConfigUrl();
  if (configUrl) {
    const remote = await fetch(configUrl).then(response => {
      if (!response.ok) {
        throw new Error(`应用配置加载失败: HTTP ${response.status}`);
      }
      return response.json() as Promise<Partial<DimensWebAppConfig>>;
    });
    config = mergeAppConfig(config, remote);
  }

  config = mergeAppConfig(config, hostProps?.appConfig);
  return config;
}

function getConfigUrl(): string | undefined {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.includes('?')
    ? new URLSearchParams(window.location.hash.split('?')[1] || '')
    : undefined;
  return params.get('configUrl') || hashQuery?.get('configUrl') || undefined;
}
