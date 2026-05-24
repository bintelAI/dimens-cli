import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import SettingsPage from './SettingsPage';
import { DEFAULT_APP_CONFIG } from '@/config/appConfig';
import { useRuntimeStore } from '@/store/runtimeStore';
import { DEFAULT_PERMISSIONS } from '@/types/micro-module';

describe('SettingsPage', () => {
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

  it('does not ask for a fixed sheet id in development settings', () => {
    render(<SettingsPage />);

    expect(screen.queryByText('工作表 ID')).not.toBeInTheDocument();
  });
});
