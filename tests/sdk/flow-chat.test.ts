import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowChatSDK } from '../../src/sdk/flow-chat';
import { DimensClient } from '../../src/sdk/client';

describe('FlowChatSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request chat completions endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          id: 'chatcmpl-1',
          choices: [
            {
              message: {
                role: 'assistant',
                content: '你好',
              },
            },
          ],
        },
      }),
    });

    const sdk = new FlowChatSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.completions('TEAM1', {
      model: 'default',
      messages: [{ role: 'user', content: '你好' }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/flow/TEAM1/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'default',
          messages: [{ role: 'user', content: '你好' }],
        }),
      })
    );
    expect(result.data.choices[0]?.message.content).toBe('你好');
  });
});
