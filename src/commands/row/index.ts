import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { RowSDK } from '../../sdk/row';
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

export function registerRowCommands(): void {
  createCommandGroup('row', '行数据管理');

  registerGroupCommand(
    'row',
    createCommand('page', '分页获取行', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const sheetId = requireSheetId(flags, args);
        const sdk = new RowSDK(createClient(context));
        const payload: { page: number; size: number } = {
          page: Number(flags.page || '1'),
          size: Number(flags.size || '20'),
        };
        const result = await sdk.page(teamId, projectId, sheetId, payload);
        printSuccess(context, '行分页获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row',
    createCommand('info', '获取行详情', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const sheetId = requireSheetId(flags, args);
        const rowId = flags['row-id'] || args[0];
        if (!rowId) {
          throw new Error('缺少行 ID，请传入 --row-id');
        }
        const sdk = new RowSDK(createClient(context));
        const result = await sdk.info(teamId, projectId, sheetId, rowId);
        printSuccess(context, '行详情获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row',
    createCommand('create', '创建行', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const sdk = new RowSDK(createClient(context));
        const values = flags.values ? JSON.parse(flags.values) as Record<string, unknown> : {};
        const result = await sdk.create(sheetId, { data: values });
        printSuccess(context, '行创建成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row',
    createCommand('update', '更新行', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const rowId = flags['row-id'] || args[0];
        if (!rowId) {
          throw new Error('缺少行 ID，请传入 --row-id');
        }
        const version = Number(flags.version || '');
        if (Number.isNaN(version)) {
          throw new Error('缺少 version，请传入 --version');
        }
        const values = flags.values ? JSON.parse(flags.values) as Record<string, unknown> : {};
        const sdk = new RowSDK(createClient(context));
        const result = await sdk.update(sheetId, rowId, values, version);
        printSuccess(context, '行更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row',
    createCommand('delete', '删除行', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const rowId = flags['row-id'] || args[0];
        if (!rowId) {
          throw new Error('缺少行 ID，请传入 --row-id');
        }
        const sdk = new RowSDK(createClient(context));
        const result = await sdk.delete(sheetId, rowId);
        printSuccess(context, '行删除成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row',
    createCommand('set-cell', '更新单元格', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const rowId = flags['row-id'];
        const fieldId = flags['field-id'] || flags['column-id'];
        if (!rowId || !fieldId) {
          throw new Error(
            '缺少 rowId 或 fieldId，请传入 --row-id 和 --field-id；--column-id 仅作兼容参数'
          );
        }
        const version = flags.version ? Number(flags.version) : undefined;
        if (flags.version && Number.isNaN(version)) {
          throw new Error('version 必须是数字，请传入 --version');
        }
        const sdk = new RowSDK(createClient(context));
        const result = await sdk.updateCell(sheetId, {
          rowId,
          fieldId,
          value: flags.value,
          ...(version === undefined ? {} : { version }),
        });
        printSuccess(context, '单元格更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}
