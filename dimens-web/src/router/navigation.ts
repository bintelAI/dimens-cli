import { notifyRouteChange } from '@/bridge/wujieBridge';

export function normalizeAppRoute(route: string): string {
  if (!route || route === '#') return '/';
  const withoutHash = route.replace(/^#/, '');
  return withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
}

export function navigateToHostAwareRoute(route: string) {
  const normalized = normalizeAppRoute(route);
  window.location.hash = normalized;
  notifyRouteChange(normalized);
}

export function getCurrentHashRoute(): string {
  const hash = window.location.hash.replace(/^#/, '');
  const route = hash.split('?')[0] || '/';
  return normalizeAppRoute(route);
}
