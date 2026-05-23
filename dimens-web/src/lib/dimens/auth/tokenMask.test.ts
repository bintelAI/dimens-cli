import { describe, expect, it } from 'vitest';
import { maskToken } from './tokenMask';

describe('maskToken', () => {
  it('does not expose full tokens', () => {
    expect(maskToken('abcdefghijklmnopqrstuvwxyz')).toBe('abcd...wxyz');
    expect(maskToken('abcdef')).toBe('ab***ef');
    expect(maskToken()).toBeUndefined();
  });
});
