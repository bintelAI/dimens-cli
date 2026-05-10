import { readFileSync } from 'node:fs';

import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { CanvasSDK, type CanvasGraphValue } from '../../sdk/canvas';
import { ensureValidCanvasGraph, validateCanvasGraph } from './validation';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
  requireTeamId,
} from '../utils';

function parseJsonObject(value: string, errorMessage: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(errorMessage);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(errorMessage);
  }
}

function parseJsonArray(value: string, errorMessage: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error(errorMessage);
    }
    return parsed;
  } catch {
    throw new Error(errorMessage);
  }
}

function parseStringList(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function parseGraphFromFlags(flags: Record<string, string>): CanvasGraphValue {
  if (flags.file) {
    return parseJsonObject(
      readFileSync(flags.file, 'utf8'),
      '画布 JSON 文件必须是对象，且包含 nodes / edges'
    ) as unknown as CanvasGraphValue;
  }
  if (flags.data) {
    return parseJsonObject(
      flags.data,
      '画布 --data 必须是 JSON 对象，且包含 nodes / edges'
    ) as unknown as CanvasGraphValue;
  }
  throw new Error('缺少画布数据，请传入 --data 或 --file');
}

function requireCanvasSheetId(flags: Record<string, string>, args: string[]): string {
  const sheetId = flags['sheet-id'] || args[0];
  if (!sheetId) {
    throw new Error('缺少 sheetId，请传入 --sheet-id 或 canvas <command> <sheetId>');
  }
  return sheetId;
}

export function registerCanvasCommands(): void {
  createCommandGroup('canvas', '画布资源与 AI 生成结果管理');

  registerGroupCommand(
    'canvas',
    createCommand(
      'create',
      '创建项目画布资源节点',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          if (!flags.name) {
            throw new Error('缺少画布名称，请传入 --name');
          }
          const sdk = new CanvasSDK(createClient(context));
          const data = flags.data || flags.file ? parseGraphFromFlags(flags) : undefined;
          if (data) {
            ensureValidCanvasGraph(data);
          }
          const payload: Parameters<CanvasSDK['create']>[1] = {
            name: flags.name,
          };
          if (flags['folder-id']) {
            payload.folderId = flags['folder-id'];
          }
          if (data) {
            payload.data = data;
          }
          const result = await sdk.create(projectId, payload);
          printSuccess(context, '画布创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'canvas create --name <name> [--project-id <projectId>] [--folder-id <folderSheetId>] [--data <json> | --file <path>] [--app-url <url>]',
        examples: [
          'canvas create --project-id PROJ1 --name 业务流程画布',
          'canvas create --project-id PROJ1 --name 售后流程 --file ./canvas.json',
        ],
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'info',
      '获取画布详情',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = requireCanvasSheetId(flags, args);
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.info(teamId, projectId, sheetId);
          printSuccess(context, '画布详情获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'canvas info <sheetId> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'save',
      '保存画布图数据并生成版本',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = requireCanvasSheetId(flags, args);
          if (!flags['base-version']) {
            throw new Error('缺少基线版本，请传入 --base-version');
          }
          const baseVersion = Number(flags['base-version']);
          if (!Number.isInteger(baseVersion) || baseVersion < 0) {
            throw new Error('base-version 必须是非负整数');
          }
          const data = parseGraphFromFlags(flags);
          ensureValidCanvasGraph(data);
          const sdk = new CanvasSDK(createClient(context));
          const payload: Parameters<CanvasSDK['save']>[2] = {
            sheetId,
            data,
            baseVersion,
          };
          if (flags.summary) {
            payload.changeSummary = flags.summary;
          }
          const result = await sdk.save(teamId, projectId, payload);
          printSuccess(context, '画布保存成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'canvas save <sheetId> --base-version <version> (--data <json> | --file <path>) [--summary <text>] [--team-id <teamId>] [--project-id <projectId>]',
        examples: [
          'canvas save canvas_1 --base-version 1 --file ./workflow-canvas.json --summary AI生成业务工作流',
        ],
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'versions',
      '获取画布版本列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = requireCanvasSheetId(flags, args);
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.versions(teamId, projectId, {
            sheetId,
            page: Number(flags.page || '1'),
            size: Number(flags.size || '20'),
          });
          printSuccess(context, '画布版本列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'canvas versions <sheetId> [--page 1] [--size 20] [--team-id <teamId>] [--project-id <projectId>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'version',
      '获取画布指定版本快照',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = requireCanvasSheetId(flags, args);
          if (!flags.version) {
            throw new Error('缺少版本号，请传入 --version');
          }
          const version = Number(flags.version);
          if (!Number.isInteger(version) || version <= 0) {
            throw new Error('version 必须是正整数');
          }
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.version(teamId, projectId, sheetId, version);
          printSuccess(context, '画布版本快照获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'canvas version <sheetId> --version <version> [--team-id <teamId>] [--project-id <projectId>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'restore',
      '恢复画布到指定版本',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = requireCanvasSheetId(flags, args);
          if (!flags.version) {
            throw new Error('缺少版本号，请传入 --version');
          }
          const version = Number(flags.version);
          if (!Number.isInteger(version) || version <= 0) {
            throw new Error('version 必须是正整数');
          }
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.restore(teamId, projectId, { sheetId, version });
          printSuccess(context, '画布版本恢复成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'canvas restore <sheetId> --version <version> [--team-id <teamId>] [--project-id <projectId>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'validate',
      '校验画布 JSON 是否满足可渲染保存结构',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const data = parseGraphFromFlags(flags);
          const result = validateCanvasGraph(data);
          if (!result.ok) {
            throw new Error(`画布数据校验失败：${result.errors.join('；')}`);
          }
          printSuccess(context, '画布数据校验通过', result);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'canvas validate (--data <json> | --file <path>)',
        examples: ['canvas validate --file ./workflow-canvas.json'],
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'resource-list',
      '获取我的画布组件资源',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.listMineResources(teamId, flags.keyword);
          printSuccess(context, '我的画布资源获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'canvas resource-list [--keyword <text>] [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'resource-save',
      '保存选中节点为我的画布组件资源',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          if (!flags.name) {
            throw new Error('缺少资源名称，请传入 --name');
          }
          if (!flags.nodes) {
            throw new Error('缺少节点数组，请传入 --nodes');
          }
          const sdk = new CanvasSDK(createClient(context));
          const nodes = parseJsonArray(flags.nodes, '--nodes 必须是 JSON 数组');
          const edges = flags.edges ? parseJsonArray(flags.edges, '--edges 必须是 JSON 数组') : [];
          ensureValidCanvasGraph({ nodes, edges });
          const payload: Parameters<CanvasSDK['saveMineResource']>[1] = {
            name: flags.name,
            nodes,
            edges,
          };
          const projectId = flags['project-id'] || context.projectId;
          if (projectId) {
            payload.projectId = projectId;
          }
          if (flags['sheet-id']) {
            payload.sheetId = flags['sheet-id'];
          }
          if (flags.description) {
            payload.description = flags.description;
          }
          const tags = parseStringList(flags.tags);
          if (tags) {
            payload.tags = tags;
          }
          if (flags.cover) {
            payload.cover = flags.cover;
          }
          const result = await sdk.saveMineResource(teamId, payload);
          printSuccess(context, '画布资源保存成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'canvas resource-save --name <name> --nodes <json-array> [--edges <json-array>] [--tags tag1,tag2] [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'resource-delete',
      '删除我的画布组件资源',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const id = flags.id || args[0];
          if (!id) {
            throw new Error('缺少资源 ID，请传入 --id');
          }
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.removeMineResource(teamId, id);
          printSuccess(context, '画布资源删除成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'canvas resource-delete <id> [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'resource-publish',
      '发布我的画布组件资源到市场',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const id = flags.id || args[0];
          if (!id) {
            throw new Error('缺少资源 ID，请传入 --id');
          }
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.publishMineResource(teamId, id);
          printSuccess(context, '画布资源发布成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'canvas resource-publish <id> [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'canvas',
    createCommand(
      'resource-market',
      '获取画布组件市场资源',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new CanvasSDK(createClient(context));
          const result = await sdk.listMarketResources(teamId, flags.keyword);
          printSuccess(context, '画布市场资源获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'canvas resource-market [--keyword <text>] [--team-id <teamId>]',
      }
    )
  );
}
