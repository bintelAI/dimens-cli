import { describe, expect, it } from 'vitest';
import { normalizeAppRoute } from './navigation';

describe('normalizeAppRoute', () => {
  it('normalizes hash and plain routes', () => {
    expect(normalizeAppRoute('#/records')).toBe('/records');
    expect(normalizeAppRoute('records')).toBe('/records');
    expect(normalizeAppRoute('/settings')).toBe('/settings');
  });
});
