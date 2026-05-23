import type { DimensWebHostProps } from '@/types/micro-module';

type Handler<T = unknown> = (payload?: T) => void;

const localHandlers = new Map<string, Set<Handler>>();

export function isWujieRuntime(): boolean {
  return Boolean(window.__POWERED_BY_WUJIE__ || window.$wujie);
}

export function getHostProps(): DimensWebHostProps {
  return {
    ...(window.__DIMENS_WEB_HOST_PROPS__ || {}),
    ...(window.$wujie?.props || {}),
  };
}

export function emitToHost(event: string, payload?: unknown) {
  const bus = window.$wujie?.bus;
  if (bus?.$emit) {
    bus.$emit(event, payload);
    return;
  }

  window.parent?.postMessage?.({ source: 'dimens-web', event, payload }, '*');
}

export function onHostEvent<T = unknown>(event: string, handler: Handler<T>) {
  const bus = window.$wujie?.bus;
  if (bus?.$on) {
    bus.$on(event, handler as Handler);
    return () => bus.$off?.(event, handler as Handler);
  }

  const handlers = localHandlers.get(event) || new Set<Handler>();
  handlers.add(handler as Handler);
  localHandlers.set(event, handlers);

  return () => {
    handlers.delete(handler as Handler);
  };
}

export function dispatchLocalHostEvent(event: string, payload?: unknown) {
  localHandlers.get(event)?.forEach(handler => handler(payload));
}

export function requestRuntimeRefresh() {
  emitToHost('dimens:context:request', { reason: 'runtime-refresh' });
}

export function notifyRouteChange(route: string) {
  emitToHost('dimens:route:changed', { route, at: Date.now() });
}

export function notifyTokenExpired(error?: unknown) {
  emitToHost('dimens:token:expired', {
    message: error instanceof Error ? error.message : 'token expired',
    at: Date.now(),
  });
}

export function toastHost(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  emitToHost('dimens:toast', { type, message });
}
