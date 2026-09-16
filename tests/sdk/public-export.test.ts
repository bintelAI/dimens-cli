import { describe, expect, it } from 'vitest';
import {
  CanvasSDK,
  FlowChatSDK,
  TeamSDK,
  UserSDK,
  createSDK,
  type RowBatchUpdateByMatchPayload,
  type RowBatchUpdateByMatchResult,
} from '../../index';

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

  it('should expose row batch update payload types from package entry', () => {
    const payload: RowBatchUpdateByMatchPayload = {
      match: { fld_source: 'jira' },
      data: { fld_status: 'done' },
    };
    const result: RowBatchUpdateByMatchResult = {
      success: true,
      matchedCount: 1,
      updatedCount: 1,
    };

    expect(payload.match).toEqual({ fld_source: 'jira' });
    expect(result.updatedCount).toBe(1);
  });
});
