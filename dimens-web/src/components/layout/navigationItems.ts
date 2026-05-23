import { Boxes, Database, LayoutDashboard, Settings, Wrench, type LucideIcon } from 'lucide-react';
import type { DimensWebAppConfig } from '@/config/appConfig';
import type { ResolvedRuntimeContext } from '@/types/micro-module';

export interface AppNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const baseNavItems: AppNavItem[] = [
  { to: '/', label: '概览', icon: LayoutDashboard },
  { to: '/records', label: '数据', icon: Database },
  { to: '/embed', label: '嵌入', icon: Boxes },
  { to: '/settings', label: '设置', icon: Settings },
  { to: '/debug/context', label: '调试', icon: Wrench },
];

export function getVisibleNavItems(
  context: ResolvedRuntimeContext,
  appConfig?: DimensWebAppConfig
): AppNavItem[] {
  return baseNavItems.filter(item => isRouteAllowed(item.to, context, appConfig));
}

export function isRouteAllowed(
  pathname: string,
  context: ResolvedRuntimeContext,
  appConfig?: DimensWebAppConfig
): boolean {
  const path = normalizePathname(pathname);
  if (path === '/settings') {
    return appConfig?.features.settings !== false && context.permissions.canConfigure !== false;
  }
  if (path === '/debug' || path.startsWith('/debug/')) {
    return appConfig?.features.debug !== false;
  }
  if (path === '/records') {
    return appConfig?.features.records !== false;
  }
  return true;
}

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '#') return '/';
  const withoutHash = pathname.replace(/^#/, '');
  const normalized = withoutHash.startsWith('/') ? withoutHash : `/${withoutHash}`;
  return normalized.split('?')[0] || '/';
}
