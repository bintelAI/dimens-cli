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
  createCommandGroup('sheet', '多维表管理');

  registerGroupCommand(
    'sheet',
    createCommand('list', '获取表列表', async args => {
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
    })
  );

  registerGroupCommand(
    'sheet',
    createCommand('tree', '获取表树结构', async args => {
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
    })
  );

  registerGroupCommand(
    'sheet',
    createCommand('create', '创建表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const name = flags.name;
        if (!name) {
          throw new Error('缺少表名称，请传入 --name');
        }
        const sdk = new SheetSDK(createClient(context));
        const result = await sdk.create(projectId, { name });
        printSuccess(context, '表创建成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'sheet',
    createCommand('info', '获取表详情', async args => {
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
    })
  );

  registerGroupCommand(
    'sheet',
    createCommand('update', '更新表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const sheetId = requireSheetId(flags, args);
        const sdk = new SheetSDK(createClient(context));
        const payload: { name?: string } = {};
        if (flags.name) {
          payload.name = flags.name;
        }
        const result = await sdk.update(teamId, projectId, sheetId, payload);
        printSuccess(context, '表更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'sheet',
    createCommand('delete', '删除表', async args => {
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
    })
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
