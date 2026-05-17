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
import { SheetSDK } from '../../sdk/sheet';

const DEFAULT_SELECT_OPTION_COLOR = 'bg-slate-100 text-slate-700';
const BUILTIN_SELECT_OPTION_COLORS = new Set([
  'bg-slate-100 text-slate-700',
  'bg-red-100 text-red-700',
  'bg-orange-100 text-orange-700',
  'bg-yellow-100 text-yellow-700',
  'bg-green-100 text-green-700',
  'bg-emerald-100 text-emerald-700',
  'bg-blue-100 text-blue-700',
  'bg-indigo-100 text-indigo-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-rose-100 text-rose-700',
  'bg-gray-100 text-gray-700',
]);

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
        if (flags.config) {
          payload.config = parseJsonObjectFlag(flags.config, 'config');
        }
        if (payload.type === 'relation') {
          payload.config = {
            ...(payload.config ?? {}),
            ...buildRelationConfig(flags),
          };
        }
        if (payload.type === 'select' || payload.type === 'multiSelect') {
          payload.config = buildSelectConfig(flags);
        }
        if (payload.type === 'workflow' || hasWorkflowConfigFlags(flags)) {
          payload.config = buildWorkflowConfig(flags, payload.config);
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
        const structureResult = await createSheetStructureReader(context).structure(sheetId);
        const columns = extractStructureColumns(structureResult.data);
        const currentColumn = columns.find(column => resolveColumnId(column) === fieldId);
        const payload: { title?: string; label?: string; type?: string; config?: Record<string, unknown> } = {};
        if (currentColumn && typeof currentColumn.label === 'string') {
          payload.label = currentColumn.label;
        } else if (currentColumn && typeof currentColumn.title === 'string') {
          payload.title = currentColumn.title;
        }
        if (currentColumn && typeof currentColumn.type === 'string') {
          payload.type = currentColumn.type;
        }
        if (currentColumn && currentColumn.config && typeof currentColumn.config === 'object') {
          payload.config = currentColumn.config as Record<string, unknown>;
        }
        const label = flags.label || flags.title;
        if (label) {
          payload.label = label;
          delete payload.title;
        }
        if (flags.type) {
          payload.type = flags.type;
        }
        const nextType = payload.type || flags['current-type'];
        if (flags.config) {
          payload.config = {
            ...(payload.config ?? {}),
            ...parseJsonObjectFlag(flags.config, 'config'),
          };
        }
        if ((nextType === 'select' || nextType === 'multiSelect') && flags.options) {
          payload.config = buildSelectConfig(flags);
        }
        if (nextType === 'workflow' || hasWorkflowConfigFlags(flags)) {
          payload.config = buildWorkflowConfig(flags, payload.config);
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

function createSheetStructureReader(context: ReturnType<typeof getContext>): SheetSDK {
  return new SheetSDK(createClient(context));
}

function extractStructureColumns(
  structure: Record<string, unknown>
): Array<Record<string, unknown>> {
  const columns = structure.columns;
  return Array.isArray(columns)
    ? columns.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

function resolveColumnId(column: Record<string, unknown>): string | undefined {
  if (typeof column.id === 'string') {
    return column.id;
  }
  if (typeof column.fieldId === 'string') {
    return column.fieldId;
  }
  return undefined;
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

function hasWorkflowConfigFlags(flags: Record<string, string>): boolean {
  return Boolean(flags['flow-id'] || flags['system-view']);
}

function buildWorkflowConfig(
  flags: Record<string, string>,
  currentConfig?: Record<string, unknown>
): Record<string, unknown> {
  const workflowConfig: Record<string, unknown> = {
    ...(currentConfig ?? {}),
  };

  if (flags['flow-id']) {
    workflowConfig.flowId = flags['flow-id'];
  }

  if (flags['system-view']) {
    workflowConfig.systemView = flags['system-view'];
  }

  return workflowConfig;
}

function parseJsonObjectFlag(value: string, fieldName: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`--${fieldName} 必须是合法 JSON 对象`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`--${fieldName} 必须是合法 JSON 对象`);
  }

  return parsed as Record<string, unknown>;
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
  validateSelectOptionColor(color);

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

function validateSelectOptionColor(color: string): void {
  if (BUILTIN_SELECT_OPTION_COLORS.has(color)) {
    return;
  }

  if (!color.startsWith('custom:')) {
    throw new Error(
      'select / multiSelect 字段选项颜色无效，内置颜色必须使用前端 12 色池，或使用 custom:{"bg":"#xxxxxx","text":"#xxxxxx"}'
    );
  }

  const payload = color.slice('custom:'.length).trim();
  if (!payload) {
    throw new Error(
      'select / multiSelect 字段自定义颜色无效，必须使用 custom:{"bg":"#xxxxxx","text":"#xxxxxx"}'
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new Error(
      'select / multiSelect 字段自定义颜色无效，必须使用 custom:{"bg":"#xxxxxx","text":"#xxxxxx"}'
    );
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(
      'select / multiSelect 字段自定义颜色无效，必须使用 custom:{"bg":"#xxxxxx","text":"#xxxxxx"}'
    );
  }

  const customColor = parsed as Record<string, unknown>;
  if (!isHexColor(customColor.bg) || !isHexColor(customColor.text)) {
    throw new Error(
      'select / multiSelect 字段自定义颜色无效，bg 和 text 必须是十六进制颜色值'
    );
  }
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
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
