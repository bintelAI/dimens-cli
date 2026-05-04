import { describe, expect, it } from 'vitest';
import { CanvasSDK, createSDK } from '../../index';

describe('Public SDK exports', () => {
  it('should expose CanvasSDK from package entry', () => {
    const sdk = createSDK({ baseUrl: 'https://api.example.com' });

    expect(CanvasSDK).toBeTypeOf('function');
    expect(sdk.canvas).toBeInstanceOf(CanvasSDK);
  });
});
