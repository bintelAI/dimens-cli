import { getHostProps, isWujieRuntime } from '@/bridge/wujieBridge';
import { getLocalRuntime } from '@/runtime/localRuntimeStorage';
import {
  DEFAULT_PERMISSIONS,
  type DimensWebHostProps,
  type MicroModulePermissions,
  type MicroModuleSourceLocation,
  type ResolvedRuntimeContext,
  type RuntimeResolution,
} from '@/types/micro-module';

type RuntimePatch = Omit<Partial<DimensWebHostProps>, 'permissions'> & {
  baseUrl?: string;
  permissions?: Partial<MicroModulePermissions>;
};

export function resolveRuntimeContext(hostPatch?: DimensWebHostProps): RuntimeResolution {
  const isWujie = isWujieRuntime();
  const host = isWujie ? { ...getHostProps(), ...hostPatch } : hostPatch;
  const url = getUrlRuntime();
  const local = getLocalRuntime() as RuntimePatch | undefined;
  const env = getEnvRuntime();

  const merged: RuntimePatch = isWujie
    ? mergeRuntime(env, url, local, host)
    : mergeRuntime(env, local, url, host);

  const context: ResolvedRuntimeContext = {
    baseUrl: merged.baseUrl || '/api',
    teamId: merged.teamId || '',
    projectId: merged.projectId || '',
    token: merged.token,
    refreshToken: merged.refreshToken,
    userId: merged.userId,
    userName: merged.userName,
    instanceId: merged.instanceId || 'dev-instance',
    moduleCode: merged.moduleCode || 'dimens-web',
    moduleVersion: merged.moduleVersion,
    sourceModuleVersion: merged.sourceModuleVersion,
    sourceLocation: normalizeSourceLocation(merged.sourceLocation),
    sourceId: merged.sourceId,
    instanceConfig: merged.instanceConfig || {},
    permissions: {
      ...DEFAULT_PERMISSIONS,
      ...(merged.permissions || {}),
      canConfigure:
        merged.permissions?.canConfigure ??
        merged.permissions?.editable ??
        DEFAULT_PERMISSIONS.canConfigure,
    },
    sheetId: merged.sheetId,
    viewId: merged.viewId,
    rowId: merged.rowId,
    columnId: merged.columnId,
    selectedRowIds: merged.selectedRowIds,
    initialRoute: normalizeRoute(merged.initialRoute),
    source: resolveSource(isWujie, host, url, local),
    isWujie,
  };

  const missing: RuntimeResolution['missing'] = [];
  if (!context.baseUrl) missing.push('baseUrl');
  if (!context.teamId) missing.push('teamId');
  if (!context.projectId) missing.push('projectId');
  if (!context.token) missing.push('token');

  return { context, missing };
}

function mergeRuntime(...patches: Array<RuntimePatch | undefined>): RuntimePatch {
  return patches.reduce<RuntimePatch>((acc, patch) => {
    if (!patch) return acc;
    const definedPatch = omitUndefined(patch);
    return {
      ...acc,
      ...definedPatch,
      permissions: {
        ...(acc.permissions || {}),
        ...(definedPatch.permissions || {}),
      },
      instanceConfig: {
        ...(acc.instanceConfig || {}),
        ...(definedPatch.instanceConfig || {}),
      },
    };
  }, {});
}

function omitUndefined(patch: RuntimePatch): RuntimePatch {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as RuntimePatch;
}

function getEnvRuntime(): RuntimePatch {
  return {
    baseUrl: import.meta.env.VITE_DIMENS_BASE_URL || '/api',
    teamId: import.meta.env.VITE_DEV_TEAM_ID,
    projectId: import.meta.env.VITE_DEV_PROJECT_ID,
    sheetId: import.meta.env.VITE_DEV_SHEET_ID,
    instanceId: import.meta.env.VITE_DEV_INSTANCE_ID || 'dev-instance',
    moduleCode: import.meta.env.VITE_DEV_MODULE_CODE || 'dimens-web',
    initialRoute: import.meta.env.VITE_DEV_INITIAL_ROUTE || '/',
    sourceLocation: 'PROJECT_MENU',
  };
}

function getUrlRuntime(): RuntimePatch {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.includes('?')
    ? new URLSearchParams(window.location.hash.split('?')[1] || '')
    : undefined;

  const get = (key: string) => params.get(key) || hashQuery?.get(key) || undefined;

  return {
    baseUrl: get('baseUrl'),
    teamId: get('teamId'),
    projectId: get('projectId'),
    sheetId: get('sheetId'),
    viewId: get('viewId'),
    rowId: get('rowId'),
    columnId: get('columnId'),
    token: get('token'),
    refreshToken: get('refreshToken'),
    instanceId: get('instanceId'),
    moduleCode: get('moduleCode'),
    sourceLocation: get('sourceLocation') as MicroModuleSourceLocation | undefined,
    initialRoute: get('initialRoute'),
  };
}

function normalizeSourceLocation(value?: string): MicroModuleSourceLocation {
  const allowed: MicroModuleSourceLocation[] = [
    'PROJECT_MENU',
    'SHEET_VIEW',
    'ROW_BUTTON_MODAL',
    'CELL_BUTTON_MODAL',
    'VIEW_TOOLBAR_MODAL',
    'CUSTOM',
  ];
  return allowed.includes(value as MicroModuleSourceLocation)
    ? (value as MicroModuleSourceLocation)
    : 'PROJECT_MENU';
}

function normalizeRoute(route?: string): string | undefined {
  if (!route) return undefined;
  return route.startsWith('/') ? route : `/${route}`;
}

function resolveSource(
  isWujie: boolean,
  host?: RuntimePatch,
  url?: RuntimePatch,
  local?: RuntimePatch
): ResolvedRuntimeContext['source'] {
  if (isWujie && host && Object.keys(host).length > 0) return 'host';
  if (url && hasRuntimeSignal(url)) return local && hasRuntimeSignal(local) ? 'mixed' : 'url';
  if (local && hasRuntimeSignal(local)) return 'local';
  return 'env';
}

function hasRuntimeSignal(runtime: RuntimePatch) {
  return Boolean(runtime.teamId || runtime.projectId || runtime.token || runtime.sheetId);
}
