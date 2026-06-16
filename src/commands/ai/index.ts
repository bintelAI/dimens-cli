import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { FlowChatSDK } from '../../sdk/flow-chat';
import type {
  AIAudioSpeechPayload,
  AIEmbeddingPayload,
  AIImagePayload,
  AIRerankPayload,
  AIVideoPayload,
} from '../../sdk/flow-chat';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireTeamId,
} from '../utils';

function parseJsonPayload(value: string | undefined): Record<string, unknown> {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error('--payload 必须是合法 JSON 对象');
  }
}

function parseJsonObjectFlag(value: string | undefined, fieldName: string): Record<string, unknown> {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${fieldName} 必须是合法 JSON 对象`);
  }
}

function parseQueryFlag(
  value: string | undefined
): Record<string, string | number | boolean | null | undefined> {
  const parsed = parseJsonObjectFlag(value, '--query');
  const query: Record<string, string | number | boolean | null | undefined> = {};
  Object.entries(parsed).forEach(([key, item]) => {
    if (
      item !== undefined &&
      item !== null &&
      typeof item !== 'string' &&
      typeof item !== 'number' &&
      typeof item !== 'boolean'
    ) {
      throw new Error('--query 的字段值只能是字符串、数字、布尔值或 null');
    }
    query[key] = item;
  });
  return query;
}

function parseNumberFlag(value: string | undefined, fieldName: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`${fieldName} 必须是数字`);
  }
  return numberValue;
}

function appendCommonContext(
  payload: Record<string, unknown>,
  flags: Record<string, string>
): void {
  if (flags['project-id']) payload.projectId = flags['project-id'];
  if (flags['resource-id']) payload.resourceId = flags['resource-id'];
  if (flags['model-scope']) payload.modelScope = flags['model-scope'];
  if (flags['token-scope']) payload.tokenScope = flags['token-scope'];
}

function appendIfPresent(
  payload: Record<string, unknown>,
  flags: Record<string, string>,
  flagName: string,
  payloadName = flagName
): void {
  if (flags[flagName]) {
    payload[payloadName] = flags[flagName];
  }
}

function appendNumberIfPresent(
  payload: Record<string, unknown>,
  flags: Record<string, string>,
  flagName: string,
  payloadName = flagName
): void {
  const value = parseNumberFlag(flags[flagName], flagName);
  if (value !== undefined) {
    payload[payloadName] = value;
  }
}

function buildModelQuery(flags: Record<string, string>) {
  const query: Record<string, string> = {};
  if (flags.capability) query.capability = flags.capability;
  if (flags['model-scope']) query.modelScope = flags['model-scope'];
  if (flags['token-scope']) query.tokenScope = flags['token-scope'];
  return query;
}

function buildImagePayload(flags: Record<string, string>): AIImagePayload {
  const payload = parseJsonPayload(flags.payload);
  if (flags.prompt) payload.prompt = flags.prompt;
  if (!payload.prompt || typeof payload.prompt !== 'string') {
    throw new Error('缺少 prompt，请传入 --prompt 或 --payload');
  }
  payload.model = typeof payload.model === 'string' ? payload.model : (flags.model || 'default');
  appendIfPresent(payload, flags, 'size');
  appendIfPresent(payload, flags, 'quality');
  appendIfPresent(payload, flags, 'style');
  appendIfPresent(payload, flags, 'background');
  appendIfPresent(payload, flags, 'moderation');
  appendIfPresent(payload, flags, 'response-format', 'response_format');
  appendIfPresent(payload, flags, 'user');
  appendNumberIfPresent(payload, flags, 'n');
  appendCommonContext(payload, flags);
  return payload as unknown as AIImagePayload;
}

function buildVideoPayload(flags: Record<string, string>): AIVideoPayload {
  const payload = parseJsonPayload(flags.payload);
  if (flags.prompt) payload.prompt = flags.prompt;
  if (!payload.prompt || typeof payload.prompt !== 'string') {
    throw new Error('缺少 prompt，请传入 --prompt 或 --payload');
  }
  payload.model = typeof payload.model === 'string' ? payload.model : (flags.model || 'default');
  appendIfPresent(payload, flags, 'seconds');
  appendIfPresent(payload, flags, 'size');
  appendCommonContext(payload, flags);
  return payload as unknown as AIVideoPayload;
}

function buildSpeechPayload(flags: Record<string, string>): AIAudioSpeechPayload {
  const payload = parseJsonPayload(flags.payload);
  if (flags.input) payload.input = flags.input;
  if (flags.voice) payload.voice = flags.voice;
  if (!payload.input || typeof payload.input !== 'string') {
    throw new Error('缺少 input，请传入 --input 或 --payload');
  }
  if (!payload.voice || typeof payload.voice !== 'string') {
    throw new Error('缺少 voice，请传入 --voice 或 --payload');
  }
  payload.model = typeof payload.model === 'string' ? payload.model : (flags.model || 'default');
  appendIfPresent(payload, flags, 'response-format', 'response_format');
  appendNumberIfPresent(payload, flags, 'speed');
  appendCommonContext(payload, flags);
  return payload as unknown as AIAudioSpeechPayload;
}

function buildEmbeddingPayload(flags: Record<string, string>): AIEmbeddingPayload {
  const payload = parseJsonPayload(flags.payload);
  if (flags.input) {
    payload.input = flags.input.trim().startsWith('[')
      ? JSON.parse(flags.input)
      : flags.input;
  }
  if (!payload.input) {
    throw new Error('缺少 input，请传入 --input 或 --payload');
  }
  payload.model = typeof payload.model === 'string' ? payload.model : (flags.model || 'default');
  appendIfPresent(payload, flags, 'encoding-format', 'encoding_format');
  appendNumberIfPresent(payload, flags, 'dimensions');
  appendIfPresent(payload, flags, 'user');
  appendCommonContext(payload, flags);
  return payload as unknown as AIEmbeddingPayload;
}

function buildRerankPayload(flags: Record<string, string>): AIRerankPayload {
  const payload = parseJsonPayload(flags.payload);
  if (flags.query) payload.query = flags.query;
  if (flags.documents) payload.documents = JSON.parse(flags.documents);
  if (!payload.query || typeof payload.query !== 'string') {
    throw new Error('缺少 query，请传入 --query 或 --payload');
  }
  if (!Array.isArray(payload.documents)) {
    throw new Error('缺少 documents，请传入 --documents JSON 数组或 --payload');
  }
  payload.model = typeof payload.model === 'string' ? payload.model : (flags.model || 'default');
  appendNumberIfPresent(payload, flags, 'top-n', 'top_n');
  if (flags['return-documents']) {
    payload.return_documents = flags['return-documents'] === 'true';
  }
  appendCommonContext(payload, flags);
  return payload as unknown as AIRerankPayload;
}

async function createFormDataFromFlags(
  flags: Record<string, string>,
  fileField: string
): Promise<FormData> {
  const formData = new FormData();
  const filePath = flags[fileField] || flags.file || flags.image;
  if (!filePath) {
    throw new Error(`缺少文件路径，请传入 --${fileField} 或 --file`);
  }

  const fileBuffer = await readFile(filePath);
  const fileName = basename(filePath);
  formData.append(fileField, new File([fileBuffer], fileName), fileName);

  Object.entries(parseJsonPayload(flags.payload)).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  Object.entries(flags).forEach(([key, value]) => {
    if (
      [
        fileField,
        'file',
        'image',
        'base-url',
        'token',
        'team-id',
        'output',
        'payload',
      ].includes(key)
    ) {
      return;
    }
    formData.append(key.replace(/-/g, '_'), value);
  });
  if (!formData.has('model')) {
    formData.append('model', flags.model || 'default');
  }
  return formData;
}

export function registerAICommands(): void {
  createCommandGroup('ai', 'AI 多能力模型代理');

  registerGroupCommand(
    'ai',
    createCommand(
      'chat-completions',
      '调用工作流 OpenAI 兼容聊天接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const message = flags.message;
          if (!message) {
            throw new Error('缺少 message，请传入 --message');
          }

          const sdk = new FlowChatSDK(createClient(context));
          const payload: {
            model: string;
            messages: Array<{ role: 'user'; content: string }>;
            stream: boolean;
            user?: string;
          } = {
            model: flags.model || 'default',
            messages: [
              {
                role: 'user',
                content: message,
              },
            ],
            stream: flags.stream === 'true',
          };
          if (flags.user) {
            payload.user = flags.user;
          }

          const result = await sdk.completions(teamId, payload);
          printSuccess(context, 'AI 对话调用成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'ai chat-completions --message <text> [--model default] [--team-id <teamId>]',
        examples: [
          'dimens-cli ai chat-completions --message "你好" --model default',
        ],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'models',
      '查询当前团队可用模型列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.models(teamId, buildModelQuery(flags));
          printSuccess(context, 'AI 模型列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai models [--capability image] [--team-id <teamId>]',
        examples: ['dimens-cli ai models --capability image'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'responses',
      '调用 Responses 接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.responses(teamId, parseJsonPayload(flags.payload));
          printSuccess(context, 'AI Responses 调用成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai responses --payload <json>',
        examples: [
          'dimens-cli ai responses --payload \'{"model":"default","input":"总结项目风险"}\'',
        ],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'messages',
      '调用 Claude Messages 兼容接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.messages(teamId, parseJsonPayload(flags.payload));
          printSuccess(context, 'AI Messages 调用成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai messages --payload <json>',
        examples: [
          'dimens-cli ai messages --payload \'{"model":"default","messages":[{"role":"user","content":"总结项目风险"}]}\'',
        ],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'proxy',
      '调用维表已开放的 v1/v1beta new-api 代理路径',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const method = (flags.method || 'POST').toUpperCase();
          if (method !== 'GET' && method !== 'POST') {
            throw new Error('--method 只支持 GET 或 POST');
          }
          const path = flags.path;
          if (!path) {
            throw new Error('缺少 path，请传入 --path /v1/xxx 或 /v1beta/xxx');
          }
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.proxy(teamId, {
            method,
            path,
            query: parseQueryFlag(flags.query),
            body: method === 'POST' ? parseJsonPayload(flags.payload) : undefined,
          });
          printSuccess(context, 'AI 代理调用成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai proxy --method GET --path /v1beta/models [--query <json>] [--payload <json>]',
        examples: [
          'dimens-cli ai proxy --method GET --path /v1beta/models --query \'{"capability":"image"}\'',
        ],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'image-generate',
      '调用图片生成接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.generateImage(teamId, buildImagePayload(flags));
          printSuccess(context, 'AI 图片生成成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'ai image-generate --prompt <text> [--model default] [--size 1024x1024] [--project-id <projectId>] [--resource-id <resourceId>]',
        examples: [
          'dimens-cli ai image-generate --prompt "企业数据驾驶舱海报" --size 1024x1024',
        ],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'image-edit',
      '调用图片编辑接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.editImage(teamId, await createFormDataFromFlags(flags, 'image'));
          printSuccess(context, 'AI 图片编辑成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai image-edit --image <path> --prompt <text> [--model default]',
        examples: ['dimens-cli ai image-edit --image ./input.png --prompt "改成产品海报"'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'image-variation',
      '调用图片变体接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.createImageVariation(
            teamId,
            await createFormDataFromFlags(flags, 'image')
          );
          printSuccess(context, 'AI 图片变体生成成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai image-variation --image <path> [--model default]',
        examples: ['dimens-cli ai image-variation --image ./input.png --n 1'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'video-create',
      '创建视频生成任务',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.createVideo(teamId, buildVideoPayload(flags));
          printSuccess(context, 'AI 视频任务创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'ai video-create --prompt <text> [--model default] [--seconds 8] [--size 1280x720]',
        examples: ['dimens-cli ai video-create --prompt "数据看板动画展示" --seconds 8'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'video-status',
      '查询视频任务状态',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const taskId = flags['task-id'] || args[0];
          if (!taskId) {
            throw new Error('缺少 taskId，请传入 --task-id');
          }
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.getVideo(teamId, taskId);
          printSuccess(context, 'AI 视频任务查询成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai video-status --task-id <taskId>',
        examples: ['dimens-cli ai video-status --task-id video_task_1'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'video-content',
      '获取视频任务内容',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const taskId = flags['task-id'] || args[0];
          if (!taskId) {
            throw new Error('缺少 taskId，请传入 --task-id');
          }
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.getVideoContent(teamId, taskId);
          printSuccess(context, 'AI 视频内容获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai video-content --task-id <taskId>',
        examples: ['dimens-cli ai video-content --task-id video_task_1'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'audio-speech',
      '调用文本转语音接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.createSpeech(teamId, buildSpeechPayload(flags));
          printSuccess(context, 'AI 语音生成成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai audio-speech --input <text> --voice <voice> [--model default]',
        examples: ['dimens-cli ai audio-speech --input "欢迎使用维表智联" --voice alloy'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'audio-transcribe',
      '调用音频转写接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.transcribeAudio(
            teamId,
            await createFormDataFromFlags(flags, 'file')
          );
          printSuccess(context, 'AI 音频转写成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai audio-transcribe --file <path> [--model default]',
        examples: ['dimens-cli ai audio-transcribe --file ./meeting.mp3'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'audio-translate',
      '调用音频翻译接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.translateAudio(
            teamId,
            await createFormDataFromFlags(flags, 'file')
          );
          printSuccess(context, 'AI 音频翻译成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai audio-translate --file <path> [--model default]',
        examples: ['dimens-cli ai audio-translate --file ./speech.mp3'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'embeddings',
      '调用文本向量接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.embeddings(teamId, buildEmbeddingPayload(flags));
          printSuccess(context, 'AI 向量生成成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai embeddings --input <text|json-array> [--model default]',
        examples: ['dimens-cli ai embeddings --input "hello"'],
      }
    )
  );

  registerGroupCommand(
    'ai',
    createCommand(
      'rerank',
      '调用重排序接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new FlowChatSDK(createClient(context));
          const result = await sdk.rerank(teamId, buildRerankPayload(flags));
          printSuccess(context, 'AI 重排序成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'ai rerank --query <text> --documents <json-array> [--model default]',
        examples: [
          'dimens-cli ai rerank --query "项目风险" --documents \'["风险台账","会议纪要"]\'',
        ],
      }
    )
  );
}
