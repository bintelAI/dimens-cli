import { describe, it, expect } from 'vitest';
import { getVersion, getUserAgent } from '../src/core/version';

describe('Version', () => {
  it('should return version string', () => {
    const version = getVersion();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should return user agent string', () => {
    const userAgent = getUserAgent();
    expect(userAgent).toContain('DimensCLI');
    expect(userAgent).toContain('Node.js');
  });
});
