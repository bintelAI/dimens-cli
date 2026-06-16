import { describe, expect, it } from 'vitest';
import { CanvasSDK, FlowChatSDK, TeamSDK, UserSDK, createSDK } from '../../index';

describe('Public SDK exports', () => {
  it('should expose CanvasSDK from package entry', () => {
    const sdk = createSDK({ baseUrl: 'https://api.example.com' });

    expect(CanvasSDK).toBeTypeOf('function');
    expect(sdk.canvas).toBeInstanceOf(CanvasSDK);
  });

  it('should expose TeamSDK and UserSDK from package entry', () => {
    const sdk = createSDK({ baseUrl: 'https://api.example.com' });

    expect(TeamSDK).toBeTypeOf('function');
    expect(UserSDK).toBeTypeOf('function');
    expect(sdk.team).toBeInstanceOf(TeamSDK);
    expect(sdk.user).toBeInstanceOf(UserSDK);
  });

  it('should expose AI SDK from package entry', () => {
    const sdk = createSDK({ baseUrl: 'https://api.example.com' });

    expect(FlowChatSDK).toBeTypeOf('function');
    expect(sdk.ai).toBeInstanceOf(FlowChatSDK);
    expect(sdk.ai.generateImage).toBeTypeOf('function');
    expect(sdk.ai.createVideo).toBeTypeOf('function');
  });
});
