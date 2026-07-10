import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { WorkflowPublicSDK } from '../../src/sdk/workflow-public';

describe('WorkflowPublicSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should manage public access config on app endpoint', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: { publicId: 'wfpub_1', enabled: true },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: { publicId: 'wfpub_1', publicSecret: 'wfsk_new' },
        }),
      });

    const sdk = new WorkflowPublicSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'user-token',
      })
    );

    await sdk.upsert('TEAM1', 12, {
      enabled: true,
      runAsUserId: 1001,
      projectId: 'PROJ1',
      ipWhitelist: ['1.2.3.4'],
      rateLimit: { perMinute: 60, concurrency: 5 },
    });
    await sdk.resetSecret('TEAM1', 12);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/app/flow/TEAM1/info/12/public-access',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          runAsUserId: 1001,
          projectId: 'PROJ1',
          ipWhitelist: ['1.2.3.4'],
          rateLimit: { perMinute: 60, concurrency: 5 },
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/app/flow/TEAM1/info/12/public-access/reset-secret',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('should call open chat completions with public secret authorization', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          id: 'chatcmpl_public',
          choices: [{ message: { role: 'assistant', content: '公开调用结果' } }],
        },
      }),
    });

    const sdk = new WorkflowPublicSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
        token: 'user-token',
      })
    );

    const result = await sdk.invoke('wfpub_1', 'wfsk_public', {
      model: 'workflow',
      messages: [{ role: 'user', content: '分析客户风险' }],
      metadata: { source: 'crm' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/open/flow/wfpub_1/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer wfsk_public',
        }),
        body: JSON.stringify({
          model: 'workflow',
          messages: [{ role: 'user', content: '分析客户风险' }],
          metadata: { source: 'crm' },
        }),
      })
    );
    expect(result.data.choices[0]?.message.content).toBe('公开调用结果');
  });
});
