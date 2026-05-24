import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_CONFIG } from '@/config/appConfig';
import { DEFAULT_PERMISSIONS, type ResolvedRuntimeContext } from '@/types/micro-module';
import { getVisibleNavItems, isRouteAllowed } from './navigationItems';

function makeContext(patch: Partial<ResolvedRuntimeContext> = {}): ResolvedRuntimeContext {
  return {
    baseUrl: '/api',
    teamId: 'T1',
    projectId: 'P1',
    instanceId: 'dev-instance',
    moduleCode: 'dimens-web',
    sourceLocation: 'PROJECT_MENU',
    instanceConfig: {},
    permissions: {
      ...DEFAULT_PERMISSIONS,
      canConfigure: true,
    },
    source: 'local',
    isWujie: false,
    ...patch,
  };
}

describe('navigationItems', () => {
  beforeEach(() => {
    window.__DIMENS_WEB_RELEASE_MODE__ = undefined;
  });

  it('hides settings when configure permission is disabled', () => {
    const context = makeContext({
      permissions: {
        ...DEFAULT_PERMISSIONS,
        canConfigure: false,
      },
    });

    expect(isRouteAllowed('/settings', context, DEFAULT_APP_CONFIG)).toBe(false);
    expect(getVisibleNavItems(context, DEFAULT_APP_CONFIG).map(item => item.to)).not.toContain('/settings');
  });

  it('hides feature-gated routes', () => {
    const config = {
      ...DEFAULT_APP_CONFIG,
      features: {
        records: false,
        settings: true,
        debug: false,
      },
    };

    expect(isRouteAllowed('/records', makeContext(), config)).toBe(false);
    expect(isRouteAllowed('/debug/context', makeContext(), config)).toBe(false);
  });

  it('only exposes overview and custom page in release mode', () => {
    window.__DIMENS_WEB_RELEASE_MODE__ = true;

    expect(getVisibleNavItems(makeContext(), DEFAULT_APP_CONFIG).map(item => item.to)).toEqual(['/', '/custom']);
    expect(isRouteAllowed('/records', makeContext(), DEFAULT_APP_CONFIG)).toBe(false);
    expect(isRouteAllowed('/settings', makeContext(), DEFAULT_APP_CONFIG)).toBe(false);
    expect(isRouteAllowed('/debug/context', makeContext(), DEFAULT_APP_CONFIG)).toBe(false);
    expect(isRouteAllowed('/custom', makeContext(), DEFAULT_APP_CONFIG)).toBe(true);
  });
});
