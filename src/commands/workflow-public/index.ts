import type { FlowChatCompletionsPayload } from '../../sdk/flow-chat';
import { WorkflowPublicSDK } from '../../sdk/workflow-public';
import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireTeamId,
} from '../utils';

function parseNumber(value: string | undefined, fieldName: string): number {
  const numberValue = Number(value);
  if (!value || !Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} 必须是正整数`);
  }
  return numberValue;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error('布尔参数必须是 true 或 false');
}

function parseJsonObject(value: string | undefined, fieldName: string): Record<string, unknown> | undefined {
  if (!value) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${fieldName} 必须是合法 JSON 对象`);
  }
}

function parseStringList(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function buildUpsertPayload(flags: Record<string, string>) {
  const payload: Parameters<WorkflowPublicSDK['upsert']>[2] = {
    enabled: parseBoolean(flags.enabled, true),
  };
  if (flags['run-as-user-id']) {
    payload.runAsUserId = parseNumber(flags['run-as-user-id'], 'run-as-user-id');
  }
  if (flags['project-id']) {
    payload.projectId = flags['project-id'];
  }
  if (flags['expire-time']) {
    payload.expireTime = flags['expire-time'];
  }
  const ipWhitelist = parseStringList(flags['ip-whitelist']);
  if (ipWhitelist) {
    payload.ipWhitelist = ipWhitelist;
  }
  const rateLimit = parseJsonObject(flags['rate-limit'], '--rate-limit');
  if (rateLimit) {
    payload.rateLimit = rateLimit;
  }
  if (flags.remark) {
    payload.remark = flags.remark;
  }
  return payload;
}

function buildInvokePayload(flags: Record<string, string>): FlowChatCompletionsPayload {
  const payload = parseJsonObject(flags.payload, '--payload') ?? {};
  if (flags.message) {
    payload.messages = [{ role: 'user', content: flags.message }];
  }
  if (!Array.isArray(payload.messages)) {
    throw new Error('缺少 messages，请传入 --message 或 --payload');
  }
  payload.model = typeof payload.model === 'string' ? payload.model : (flags.model || 'workflow');
  payload.stream = parseBoolean(flags.stream, false);
  if (flags.user) {
    payload.user = flags.user;
  }
  const metadata = parseJsonObject(flags.metadata, '--metadata');
  if (metadata) {
    payload.metadata = metadata;
  }
  return payload as unknown as FlowChatCompletionsPayload;
}

function requireFlowId(flags: Record<string, string>, args: string[]): number {
  return parseNumber(flags['flow-id'] || args[0], 'flow-id');
}

function requirePublicId(flags: Record<string, string>, args: string[]): string {
  const publicId = flags['public-id'] || args[0];
  if (!publicId) {
    throw new Error('缺少 publicId，请传入 --public-id');
  }
  return publicId;
}

export function registerWorkflowPublicCommands(): void {
  createCommandGroup('workflow-public', '公开工作流访问配置与免登录调用');

  registerGroupCommand(
    'workflow-public',
    createCommand(
      'get',
      '查询工作流公开访问配置',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const flowId = requireFlowId(flags, args);
          const sdk = new WorkflowPublicSDK(createClient(context));
          const result = await sdk.get(teamId, flowId);
          printSuccess(context, '公开工作流配置获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'workflow-public get --flow-id <flowId> [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'workflow-public',
    createCommand(
      'upsert',
      '创建或更新工作流公开访问配置',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const flowId = requireFlowId(flags, args);
          const sdk = new WorkflowPublicSDK(createClient(context));
          const result = await sdk.upsert(teamId, flowId, buildUpsertPayload(flags));
          printSuccess(context, '公开工作流配置保存成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'workflow-public upsert --flow-id <flowId> [--enabled true] [--run-as-user-id <id>] [--project-id <projectId>] [--expire-time <time>] [--ip-whitelist <ip1,ip2>] [--rate-limit <json>]',
        examples: [
          'dimens-cli workflow-public upsert --flow-id 12 --enabled true --run-as-user-id 1001 --project-id PROJ1',
        ],
      }
    )
  );

  registerGroupCommand(
    'workflow-public',
    createCommand(
      'disable',
      '关闭工作流公开访问',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const flowId = requireFlowId(flags, args);
          const sdk = new WorkflowPublicSDK(createClient(context));
          const result = await sdk.disable(teamId, flowId);
          printSuccess(context, '公开工作流已关闭', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'workflow-public disable --flow-id <flowId> [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'workflow-public',
    createCommand(
      'reset-secret',
      '重置公开工作流访问密钥',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const flowId = requireFlowId(flags, args);
          const sdk = new WorkflowPublicSDK(createClient(context));
          const result = await sdk.resetSecret(teamId, flowId);
          printSuccess(context, '公开工作流密钥重置成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'workflow-public reset-secret --flow-id <flowId> [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'workflow-public',
    createCommand(
      'invoke',
      '使用公开密钥免登录调用公开工作流',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const publicId = requirePublicId(flags, args);
          const publicSecret = flags['public-secret'];
          if (!publicSecret) {
            throw new Error('缺少 publicSecret，请传入 --public-secret');
          }
          const sdk = new WorkflowPublicSDK(createClient(context));
          const result = await sdk.invoke(publicId, publicSecret, buildInvokePayload(flags));
          printSuccess(context, '公开工作流调用成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'workflow-public invoke --public-id <wfpub_xxx> --public-secret <wfsk_xxx> --message <text> [--metadata <json>]',
        examples: [
          'dimens-cli workflow-public invoke --public-id wfpub_xxx --public-secret wfsk_xxx --message "分析客户风险"',
        ],
      }
    )
  );
}
