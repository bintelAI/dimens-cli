import { describe, expect, it } from 'vitest';
import { createSDK, DimensRequestError } from '../../src/browser';

describe('browser SDK entry', () => {
  it('exposes browser-safe resources without node-only upload', () => {
    const sdk = createSDK({ baseUrl: 'https://api.example.com' });

    expect(sdk.auth).toBeDefined();
    expect(sdk.user).toBeDefined();
    expect(sdk.project).toBeDefined();
    expect(sdk.row).toBeDefined();
    expect('upload' in sdk).toBe(false);
    expect(DimensRequestError).toBeDefined();
  });
});
