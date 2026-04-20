import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { randomUUID } from 'node:crypto';
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

const DEFAULT_SELECT_OPTION_COLOR = 'bg-slate-100 text-slate-700';

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
        if (payload.type === 'select' || payload.type === 'multiSelect') {
          payload.config = buildSelectConfig(flags);
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
        const label = flags.label || flags.title;
        if (label) {
          payload.label = label;
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

function buildSelectConfig(flags: Record<string, string>): Record<string, unknown> {
  const rawOptions = flags.options;
  if (!rawOptions) {
    throw new Error('select / multiSelect 字段缺少选项值，请传入 --options');
  }

  const options = parseSelectOptions(rawOptions);

  if (options.length === 0) {
    throw new Error('select / multiSelect 字段至少需要一个有效选项');
  }

  return {
    options,
    dataSourceType: 'manual',
    dictionaryId: null,
  };
}

function parseSelectOptions(rawOptions: string): Array<Record<string, unknown>> {
  const trimmed = rawOptions.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      throw new Error('--options JSON 必须是选项对象数组，例如 [{\"label\":\"待提交\",\"color\":\"bg-slate-100 text-slate-700\"}]');
    }

    if (!Array.isArray(parsed)) {
      throw new Error('--options JSON 必须是选项对象数组，例如 [{\"label\":\"待提交\",\"color\":\"bg-slate-100 text-slate-700\"}]');
    }

    const optionItems = parsed.filter(
        (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object'
    );

    if (optionItems.length !== parsed.length) {
      throw new Error('--options JSON 必须是选项对象数组，例如 [{\"label\":\"待提交\",\"color\":\"bg-slate-100 text-slate-700\"}]');
    }

    const options = optionItems.map(item => normalizeSelectOption(item));

    if (options.length > 0) {
      ensureUniqueSelectOptionIds(options);
      return options;
    }
  }

  return trimmed
    .split(',')
    .map(option => option.trim())
    .filter(Boolean)
    .map(label => normalizeSelectOption({ label }));
}

function normalizeSelectOption(option: Record<string, unknown>): Record<string, unknown> {
  const label = typeof option.label === 'string' ? option.label.trim() : '';
  if (!label) {
    throw new Error('select / multiSelect 字段选项的 label 不能为空');
  }

  const id = typeof option.id === 'string' && option.id.trim() ? option.id.trim() : randomUUID();
  const color =
    typeof option.color === 'string' && option.color.trim()
      ? option.color.trim()
      : DEFAULT_SELECT_OPTION_COLOR;

  return {
    id,
    label,
    color,
  };
}

function ensureUniqueSelectOptionIds(options: Array<Record<string, unknown>>): void {
  const duplicatedIds = new Set<string>();
  const seenIds = new Set<string>();

  for (const option of options) {
    const id = typeof option.id === 'string' ? option.id : '';
    if (!id) {
      throw new Error('select / multiSelect 字段选项缺少有效 id');
    }
    if (seenIds.has(id)) {
      duplicatedIds.add(id);
      continue;
    }
    seenIds.add(id);
  }

  if (duplicatedIds.size > 0) {
    throw new Error(
      `select / multiSelect 字段选项存在重复 id: ${Array.from(duplicatedIds).join(', ')}`
    );
  }
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
