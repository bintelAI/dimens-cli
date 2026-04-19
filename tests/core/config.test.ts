import { describe, expect, it } from 'vitest';
import { config } from '../../src/core/config';

describe('Config', () => {
  it('should persist profile fields in memory shape', async () => {
    await config.load();
    config.set('profile', {
      baseUrl: 'http://localhost:8001',
      token: 'token-1',
      refreshToken: 'refresh-1',
      teamId: 'TEAM001',
      projectId: 'PROJ001',
      output: 'table',
    });

    const profile = config.get('profile');
    expect(profile.baseUrl).toBe('http://localhost:8001');
    expect(profile.teamId).toBe('TEAM001');
    expect(profile.output).toBe('table');
  });
});
