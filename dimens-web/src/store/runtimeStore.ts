import { create } from 'zustand';
import { dispatchLocalHostEvent, getHostProps, isWujieRuntime } from '@/bridge/wujieBridge';
import { loadAppConfig, type DimensWebAppConfig } from '@/config/appConfig';
import { getToken } from '@/lib/dimens/auth/authService';
import type { DimensAuthState } from '@/lib/dimens/auth/types';
import { persistHostRuntimeForDev } from '@/runtime/persistHostRuntime';
import { resolveRuntimeContext } from '@/runtime/resolveRuntimeContext';
import type { DimensWebHostProps, ResolvedRuntimeContext, RuntimeResolution } from '@/types/micro-module';

export type BootstrapStatus = 'idle' | 'loading' | 'needs-config' | 'ready' | 'error';

interface RuntimeState {
  status: BootstrapStatus;
  context: ResolvedRuntimeContext;
  missing: RuntimeResolution['missing'];
  auth: DimensAuthState;
  appConfig?: DimensWebAppConfig;
  error?: string;
  setHostProps: (props: DimensWebHostProps) => void;
  bootstrap: (props?: DimensWebHostProps) => Promise<void>;
  refreshRuntime: (props?: DimensWebHostProps) => Promise<void>;
}

const initialResolution = resolveRuntimeContext();

export const useRuntimeStore = create<RuntimeState>((set, get) => ({
  status: 'idle',
  context: initialResolution.context,
  missing: initialResolution.missing,
  auth: { source: 'none' },
  setHostProps: props => {
    window.__DIMENS_WEB_HOST_PROPS__ = {
      ...(window.__DIMENS_WEB_HOST_PROPS__ || {}),
      ...props,
    };
    persistHostRuntimeForDev(window.__DIMENS_WEB_HOST_PROPS__);
    dispatchLocalHostEvent('dimens:runtime:update', props);
  },
  bootstrap: async props => {
    set({ status: 'loading', error: undefined });
    try {
      const hostProps = resolvePersistableHostProps(props);
      persistHostRuntimeForDev(hostProps);
      const resolution = resolveRuntimeContext(props);
      const appConfig = await loadAppConfig(props);
      const auth = await getToken(resolution.context);
      const requiredMissing = resolution.missing.filter(item => item !== 'token');
      set({
        status: requiredMissing.length > 0 ? 'needs-config' : 'ready',
        context: resolution.context,
        missing: resolution.missing,
        auth,
        appConfig,
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
  refreshRuntime: async props => {
    await get().bootstrap(props);
  },
}));

function resolvePersistableHostProps(props?: DimensWebHostProps) {
  if (props && Object.keys(props).length > 0) return props;
  if (isWujieRuntime()) return getHostProps();
  return undefined;
}
