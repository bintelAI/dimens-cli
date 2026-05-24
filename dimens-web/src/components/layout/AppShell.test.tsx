import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_APP_CONFIG } from '@/config/appConfig';
import DashboardPage from '@/pages/DashboardPage';
import { useRuntimeStore } from '@/store/runtimeStore';
import { DEFAULT_PERMISSIONS } from '@/types/micro-module';
import AppShell from './AppShell';

function setReadyRuntime() {
  useRuntimeStore.setState({
    status: 'ready',
    context: {
      baseUrl: '/api',
      teamId: 'team_1',
      projectId: 'project_1',
      token: 'token_1',
      instanceId: 'dev-instance',
      moduleCode: 'dimens-web',
      sourceLocation: 'PROJECT_MENU',
      instanceConfig: {},
      permissions: DEFAULT_PERMISSIONS,
      source: 'local',
      isWujie: false,
    },
    appConfig: DEFAULT_APP_CONFIG,
    auth: { source: 'local-dev', token: 'token_1' },
    missing: [],
  });
}

function renderShell() {
  const router = createMemoryRouter([
    {
      path: '/',
      element: <AppShell />,
      children: [{ index: true, element: <DashboardPage /> }],
    },
  ]);

  return render(<RouterProvider router={router} />);
}

describe('AppShell release mode', () => {
  beforeEach(() => {
    window.__DIMENS_WEB_RELEASE_MODE__ = undefined;
    setReadyRuntime();
  });

  it('does not render the sidebar menu in release mode', () => {
    window.__DIMENS_WEB_RELEASE_MODE__ = true;

    const { container } = renderShell();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '切换导航' })).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('bg-transparent');
  });
});
