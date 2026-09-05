import { readFileSync } from 'node:fs';
import type {
  ProjectDictCreatePayload,
  ProjectDictOption,
  ProjectDictUpdatePayload,
} from '../../sdk/project-dict';
import { ProjectDictSDK } from '../../sdk/project-dict';
import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
  requireTeamId,
} from '../utils';

const CODE_PATTERN = /^[a-z0-9_-]+$/;

export function registerProjectDictCommands(): void {
  createCommandGroup('project-dict', '项目数据字典管理');

  registerGroupCommand(
    'project-dict',
    createCommand(
      'list',
      '获取项目字典列表',
      async (args) => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sdk = new ProjectDictSDK(createClient(context));
          const params: { keyword?: string; status?: number } = {};
          if (flags.keyword) params.keyword = flags.keyword;
          if (flags.status !== undefined) params.status = parseStatus(flags.status);
          const result = await sdk.list(teamId, projectId, params);
          printSuccess(context, '项目字典列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'project-dict list [--keyword <keyword>] [--status 0|1] [--team-id <teamId>] [--project-id <projectId>]',
      }
    )
  );

  registerGroupCommand(
    'project-dict',
    createCommand(
      'info',
      '获取项目字典详情',
      async (args) => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const id = flags.id || args[0];
          if (!id) throw new Error('缺少字典 ID，请传入 --id 或 project-dict info <id>');
          const result = await new ProjectDictSDK(createClient(context)).info(
            teamId,
            projectId,
            id
          );
          printSuccess(context, '项目字典详情获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      { usage: 'project-dict info --id <dictId> [--team-id <teamId>] [--project-id <projectId>]' }
    )
  );

  registerGroupCommand(
    'project-dict',
    createCommand(
      'create',
      '创建项目数据字典',
      async (args) => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const name = flags.name?.trim();
          const code = flags.code?.trim();
          if (!name) throw new Error('缺少字典名称，请传入 --name');
          validateCode(code, '字典编码');
          const payload: ProjectDictCreatePayload = {
            name,
            code: code as string,
            options: parseOptions(flags),
          };
          if (flags.description !== undefined) payload.description = flags.description;
          if (flags.status !== undefined) payload.status = parseStatus(flags.status);
          const result = await new ProjectDictSDK(createClient(context)).create(
            teamId,
            projectId,
            payload
          );
          printSuccess(context, '项目字典创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'project-dict create --name <name> --code <code> --options <json>|--options-file <path> [--description <text>] [--status 0|1] [--team-id <teamId>] [--project-id <projectId>]',
        examples: [
          'dimens-cli project-dict create --name 客户等级 --code customer_level --options \'[{"id":"vip","label":"VIP","value":"vip"}]\'',
        ],
      }
    )
  );

  registerGroupCommand(
    'project-dict',
    createCommand(
      'update',
      '更新项目数据字典',
      async (args) => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const id = flags.id || args[0];
          if (!id) throw new Error('缺少字典 ID，请传入 --id');
          const payload: ProjectDictUpdatePayload = { id };
          if (flags.name !== undefined) payload.name = flags.name;
          if (flags.description !== undefined) payload.description = flags.description;
          if (flags.status !== undefined) payload.status = parseStatus(flags.status);
          if (flags.options !== undefined || flags['options-file'] !== undefined) {
            payload.options = parseOptions(flags);
          }
          if (Object.keys(payload).length === 1) {
            throw new Error('缺少可更新字段，请传入 --name、--description、--status 或 --options');
          }
          const result = await new ProjectDictSDK(createClient(context)).update(
            teamId,
            projectId,
            payload
          );
          printSuccess(context, '项目字典更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'project-dict update --id <dictId> [--name <name>] [--description <text>] [--status 0|1] [--options <json>|--options-file <path>] [--team-id <teamId>] [--project-id <projectId>]',
      }
    )
  );

  registerGroupCommand(
    'project-dict',
    createCommand(
      'delete',
      '删除项目数据字典',
      async (args) => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          if (flags.confirm !== 'true')
            throw new Error('删除项目字典属于破坏性操作，请传入 --confirm true');
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const id = flags.id || args[0];
          if (!id) throw new Error('缺少字典 ID，请传入 --id');
          const result = await new ProjectDictSDK(createClient(context)).delete(
            teamId,
            projectId,
            id
          );
          printSuccess(context, '项目字典删除成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'project-dict delete --id <dictId> --confirm true [--team-id <teamId>] [--project-id <projectId>]',
      }
    )
  );
}

function parseOptions(flags: Record<string, string>): ProjectDictOption[] {
  const raw = flags['options-file'] ? readFileSync(flags['options-file'], 'utf8') : flags.options;
  if (!raw) throw new Error('缺少字典选项，请传入 --options <json> 或 --options-file <path>');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('options 必须是合法 JSON 数组');
  }
  if (!Array.isArray(parsed)) throw new Error('options 必须是 JSON 数组');
  const values = new Set<string>();
  const validate = (nodes: unknown[]): ProjectDictOption[] =>
    nodes.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`options[${index}] 必须是对象`);
      }
      const node = item as Record<string, unknown>;
      if (typeof node.id !== 'string' || !node.id.trim())
        throw new Error(`options[${index}].id 不能为空`);
      if (typeof node.label !== 'string' || !node.label.trim())
        throw new Error(`options[${index}].label 不能为空`);
      validateCode(node.value, `options[${index}].value`);
      if (values.has(node.value as string))
        throw new Error(`选项编码 ${node.value} 在字典树内重复`);
      values.add(node.value as string);
      const option: ProjectDictOption = {
        id: node.id,
        label: node.label,
        value: node.value as string,
      };
      if (typeof node.color === 'string') option.color = node.color;
      if (typeof node.icon === 'string') option.icon = node.icon;
      if (typeof node.disabled === 'boolean') option.disabled = node.disabled;
      if (typeof node.sort === 'number') option.sort = node.sort;
      if (node.children !== undefined) {
        if (!Array.isArray(node.children)) throw new Error(`options[${index}].children 必须是数组`);
        option.children = validate(node.children);
      }
      return option;
    });
  return validate(parsed);
}

function validateCode(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${fieldName}不能为空`);
  if (!CODE_PATTERN.test(value))
    throw new Error(`${fieldName}只能包含小写英文、数字、下划线和连字符`);
}

function parseStatus(value: string): number {
  if (value !== '0' && value !== '1') throw new Error('status 必须是 0 或 1');
  return Number(value);
}
