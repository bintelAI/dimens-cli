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

  it('should request image generation endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          created: 1710000000,
          data: [{ url: 'https://cdn.example.com/image.png' }],
        },
      }),
    });

    const sdk = new FlowChatSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.generateImage('TEAM1', {
      model: 'default',
      prompt: '企业数据驾驶舱海报',
      size: '1024x1024',
      projectId: 'PROJ1',
      resourceId: 'poster_1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/flow/TEAM1/v1/images/generations',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'default',
          prompt: '企业数据驾驶舱海报',
          size: '1024x1024',
          projectId: 'PROJ1',
          resourceId: 'poster_1',
        }),
      })
    );
    expect(result.data.data[0]?.url).toBe('https://cdn.example.com/image.png');
  });

  it('should request video task endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            id: 'video_task_1',
            status: 'queued',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: {
            id: 'video_task_1',
            status: 'completed',
          },
        }),
      });

    const sdk = new FlowChatSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.createVideo('TEAM1', {
      model: 'default',
      prompt: '数据看板动画展示',
      seconds: '8',
    });
    const status = await sdk.getVideo('TEAM1', 'video_task_1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/app/flow/TEAM1/v1/videos',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/app/flow/TEAM1/v1/videos/video_task_1',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(status.data.status).toBe('completed');
  });

  it('should request audio transcription with form data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          text: '欢迎使用维表智联',
        },
      }),
    });

    const sdk = new FlowChatSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );
    const formData = new FormData();
    formData.append('file', new Blob(['audio']), 'demo.mp3');
    formData.append('model', 'default');

    await sdk.transcribeAudio('TEAM1', formData);

    const calledInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = calledInit.headers as Record<string, string>;
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/flow/TEAM1/v1/audio/transcriptions',
      expect.objectContaining({
        method: 'POST',
        body: formData,
      })
    );
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('should request generic new-api proxy endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: {
          object: 'list',
          data: [{ id: 'gpt-4o-mini' }],
        },
      }),
    });

    const sdk = new FlowChatSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    const result = await sdk.proxy('TEAM1', {
      method: 'GET',
      path: '/v1beta/models',
      query: { capability: 'image' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/flow/TEAM1/v1beta/models?capability=image',
      expect.objectContaining({
        method: 'GET',
      })
    );
    expect(result.data.data[0]?.id).toBe('gpt-4o-mini');
  });

  it('should request responses and messages endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: { id: 'resp_1' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          code: 1000,
          message: 'success',
          data: { id: 'msg_1' },
        }),
      });

    const sdk = new FlowChatSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.responses('TEAM1', {
      model: 'default',
      input: '总结项目风险',
    });
    await sdk.messages('TEAM1', {
      model: 'default',
      messages: [{ role: 'user', content: '总结项目风险' }],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.com/app/flow/TEAM1/v1/responses',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'default',
          input: '总结项目风险',
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.com/app/flow/TEAM1/v1/messages',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          model: 'default',
          messages: [{ role: 'user', content: '总结项目风险' }],
        }),
      })
    );
  });
});
