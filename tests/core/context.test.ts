import { describe, expect, it } from 'vitest';
import { resolveContext } from '../../src/core/context';

describe('Context', () => {
  it('should prefer cli args over profile values', () => {
    const result = resolveContext(
      { teamId: 'TEAM_ARG' },
      { teamId: 'TEAM_PROFILE', projectId: 'PROJ_PROFILE', output: 'table' }
    );

    expect(result.teamId).toBe('TEAM_ARG');
    expect(result.projectId).toBe('PROJ_PROFILE');
    expect(result.output).toBe('table');
  });

  it('should use system default baseUrl when user has not customized it', () => {
    const result = resolveContext({}, {});

    expect(result.baseUrl).toBe('https://dimens.bintelai.com/api');
  });

  it('should prefer custom baseUrl over system default', () => {
    const result = resolveContext(
      { baseUrl: 'https://custom.example.com' },
      { baseUrl: 'https://profile.example.com' }
    );

    expect(result.baseUrl).toBe('https://custom.example.com');
  });
});
