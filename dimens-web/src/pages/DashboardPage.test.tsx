import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_APP_CONFIG } from '@/config/appConfig';
import { useRuntimeStore } from '@/store/runtimeStore';
import { DEFAULT_PERMISSIONS } from '@/types/micro-module';
import DashboardPage from './DashboardPage';

describe('DashboardPage', () => {
  beforeEach(() => {
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
  });

  it('shows release relative URLs on overview', () => {
    render(<DashboardPage />);

    expect(screen.getByText('./index.html#/')).toBeInTheDocument();
    expect(screen.getByText('./index.html#/custom')).toBeInTheDocument();
  });
});
