import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { ColumnSDK } from '../../sdk/column';
import type { ColumnMutationPayload } from '../../sdk/column';
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

export function registerColumnCommands(): void {
  createCommandGroup('column', '字段管理');

  registerGroupCommand(
    'column',
    createCommand('list', '获取字段列表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const sheetId = requireSheetId(flags, args);
        const sdk = new ColumnSDK(createClient(context));
        const result = await sdk.list(teamId, projectId, sheetId);
        printSuccess(context, '字段列表获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'column',
    createCommand('create', '创建字段', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const sheetId = requireSheetId(flags, args);
        const label = flags.label || flags.title;
        if (!label) {
          throw new Error('缺少字段标题，请传入 --label 或兼容参数 --title');
        }
        const sdk = new ColumnSDK(createClient(context));
        const payload: ColumnMutationPayload = { label };
        if (flags.type) {
          payload.type = flags.type;
        }
        if (payload.type === 'relation') {
          payload.config = buildRelationConfig(flags);
        }
        const result = await sdk.create(teamId, projectId, sheetId, payload);
        printSuccess(context, '字段创建成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'column',
    createCommand('update', '更新字段', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const fieldId = flags['field-id'] || args[0];
        if (!fieldId) {
          throw new Error('缺少字段 ID，请传入 --field-id');
        }
        const sdk = new ColumnSDK(createClient(context));
        const payload: { title?: string; label?: string; type?: string } = {};
        if (flags.label || flags.title) {
          payload.label = flags.label || flags.title;
        }
        if (flags.type) {
          payload.type = flags.type;
        }
        const result = await sdk.update(sheetId, fieldId, payload);
        printSuccess(context, '字段更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'column',
    createCommand('delete', '删除字段', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const fieldId = flags['field-id'] || args[0];
        if (!fieldId) {
          throw new Error('缺少字段 ID，请传入 --field-id');
        }
        const sdk = new ColumnSDK(createClient(context));
        const result = await sdk.delete(sheetId, fieldId);
        printSuccess(context, '字段删除成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}

function buildRelationConfig(flags: Record<string, string>): Record<string, unknown> {
  const targetSheetId = flags['target-sheet-id'];
  if (!targetSheetId) {
    throw new Error('relation 字段缺少目标表，请传入 --target-sheet-id');
  }

  const relationConfig: Record<string, unknown> = {
    targetSheetId,
  };

  if (flags['display-column-id']) {
    relationConfig.displayColumnId = flags['display-column-id'];
  }

  if (flags.bidirectional) {
    relationConfig.bidirectional = parseBooleanFlag(flags.bidirectional, 'bidirectional');
  }

  if (flags.multiple) {
    relationConfig.multiple = parseBooleanFlag(flags.multiple, 'multiple');
  }

  return {
    relationConfig,
  };
}

function parseBooleanFlag(value: string, fieldName: string): boolean {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(`${fieldName} 必须是 true 或 false`);
}
