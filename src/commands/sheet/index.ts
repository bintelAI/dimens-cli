import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { SheetSDK } from '../../sdk/sheet';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
  requireSheetId,
  requireTeamId,
} from '../utils';

export function registerSheetCommands(): void {
  createCommandGroup('sheet', '项目菜单与多维表资源管理');

  registerGroupCommand(
    'sheet',
    createCommand(
      'list',
      '获取项目下的资源列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const sdk = new SheetSDK(createClient(context));
          const result = await sdk.list(projectId);
          printSuccess(context, '表列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'sheet list [--project-id <projectId>] [--team-id <teamId>] [--app-url <url>]',
        examples: [
          'sheet list --project-id PROJ1',
          'sheet list --app-url https://dimens.bintelai.com/#/TEAM1/PROJ1/',
          '# 返回结果里可能包含 sheet / folder / document / report 节点',
        ],
      }
    )
  );

  registerGroupCommand(
    'sheet',
    createCommand(
      'tree',
      '获取项目菜单树，回查目录与资源归位',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const sdk = new SheetSDK(createClient(context));
          const result = await sdk.tree(projectId);
          printSuccess(context, '表树获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'sheet tree [--project-id <projectId>] [--team-id <teamId>] [--app-url <url>]',
        examples: [
          'sheet tree --project-id PROJ1',
          'sheet tree --app-url https://dimens.bintelai.com/#/TEAM1/PROJ1/',
        ],
      }
    )
  );

  registerGroupCommand(
    'sheet',
    createCommand(
      'create',
      '创建表、目录或项目菜单资源节点',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const name = flags.name;
          if (!name) {
            throw new Error('缺少表名称，请传入 --name');
          }
          const sdk = new SheetSDK(createClient(context));
          const payload: {
            name: string;
            type?: 'sheet' | 'folder' | 'document' | 'report' | 'canvas';
            folderId?: string;
          } = { name };
          if (flags.type) {
            const supportedTypes = new Set(['sheet', 'folder', 'document', 'report', 'canvas']);
            if (!supportedTypes.has(flags.type)) {
              throw new Error('sheet create 的 --type 仅支持 sheet、folder、document、report、canvas');
            }
            payload.type = flags.type as 'sheet' | 'folder' | 'document' | 'report' | 'canvas';
          }
          if (flags['folder-id']) {
            payload.folderId = flags['folder-id'];
          }
          const result = await sdk.create(projectId, payload);
          printSuccess(context, '表创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'sheet create --name <name> [--project-id <projectId>] [--type sheet|folder|document|report|canvas] [--folder-id <folderSheetId>] [--team-id <teamId>] [--app-url <url>]',
        examples: [
          'sheet create --project-id PROJ1 --name 客户中心 --type folder',
          'sheet create --project-id PROJ1 --name 客户表 --folder-id folder_customer',
          'sheet create --project-id PROJ1 --name 业务流程画布 --type canvas',
          'sheet tree --project-id PROJ1',
        ],
      }
    )
  );

  registerGroupCommand(
    'sheet',
    createCommand(
      'info',
      '获取资源节点详情，可用于目录、表格、文档、报表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = requireSheetId(flags, args);
          const sdk = new SheetSDK(createClient(context));
          const result = await sdk.info(teamId, projectId, sheetId);
          printSuccess(context, '表详情获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'sheet info <sheetId> [--project-id <projectId>] [--team-id <teamId>] [--app-url <url>]',
        examples: [
          'sheet info sheet_customer --team-id TEAM1 --project-id PROJ1',
          'sheet info folder_customer --team-id TEAM1 --project-id PROJ1',
        ],
      }
    )
  );

  registerGroupCommand(
    'sheet',
    createCommand(
      'update',
      '更新资源节点名称，目录节点也会影响项目菜单层',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const positionalArgs = args.filter(arg => !arg.startsWith('--'));
          const sheetId = flags['sheet-id'] || positionalArgs[0];
          if (!sheetId) {
            throw new Error('缺少 sheetId，请传入 --sheet-id 或 sheet update <sheetId>');
          }
          const sdk = new SheetSDK(createClient(context));
          const currentSheetResult = await sdk.info(teamId, projectId, sheetId);
          const currentSheet = currentSheetResult.data;
          const payload: { name?: string; folderId?: string } = {};
          if (typeof currentSheet.name === 'string') {
            payload.name = currentSheet.name;
          }
          if (flags.name) {
            payload.name = flags.name;
          }
          if (flags['folder-id']) {
            payload.folderId = flags['folder-id'];
          }
          const result = await sdk.update(teamId, projectId, sheetId, payload);
          printSuccess(context, '资源节点更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'sheet update <sheetId> [--name <name>] [--folder-id <folderSheetId>] [--project-id <projectId>] [--team-id <teamId>] [--app-url <url>]',
        examples: [
          'sheet update folder_customer --team-id TEAM1 --project-id PROJ1 --name 客户中心',
          'sheet update sheet_customer --team-id TEAM1 --project-id PROJ1 --name 客户主表',
          'sheet update sheet_customer --team-id TEAM1 --project-id PROJ1 --folder-id folder_customer',
        ],
      }
    )
  );

  registerGroupCommand(
    'sheet',
    createCommand(
      'delete',
      '删除资源节点，目录节点删除会影响项目菜单层',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = requireSheetId(flags, args);
          const sdk = new SheetSDK(createClient(context));
          const result = await sdk.delete(teamId, projectId, sheetId);
          printSuccess(context, '表删除成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'sheet delete <sheetId> [--project-id <projectId>] [--team-id <teamId>] [--app-url <url>]',
        examples: [
          'sheet delete folder_customer --team-id TEAM1 --project-id PROJ1',
          'sheet delete sheet_customer --team-id TEAM1 --project-id PROJ1',
        ],
      }
    )
  );

  registerGroupCommand(
    'sheet',
    createCommand('structure', '获取表结构', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const sdk = new SheetSDK(createClient(context));
        const result = await sdk.structure(sheetId);
        printSuccess(context, '表结构获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}
