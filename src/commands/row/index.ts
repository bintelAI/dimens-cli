import { readFileSync } from 'node:fs';
import { RowSDK } from '../../sdk/row';
import type { RowPagePayload } from '../../sdk/row';
import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
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

const DEFAULT_ROW_BATCH_SIZE = 200;
const MAX_ROW_BATCH_SIZE = 1000;

function parseJsonFlag(value: string, fieldName: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${fieldName} 必须是合法 JSON`);
  }
}

function parseListFlag(value: string): string[] {
  const parsed = value.trim().startsWith('[')
    ? parseJsonFlag(value, 'search-field-ids')
    : value.split(',').map(item => item.trim()).filter(Boolean);
  if (!Array.isArray(parsed) || parsed.some(item => typeof item !== 'string')) {
    throw new Error('search-field-ids 必须是逗号分隔字符串或 JSON 字符串数组');
  }
  return parsed;
}

function parseArrayJsonFlag(value: string, fieldName: string): unknown[] {
  const parsed = parseJsonFlag(value, fieldName);
  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldName} 必须是合法 JSON 数组`);
  }
  return parsed;
}

function buildRowPagePayload(flags: Record<string, string>): RowPagePayload {
  const payload: RowPagePayload = {
    page: Number(flags.page || '1'),
    size: Number(flags.size || '20'),
  };

  if (flags['view-id']) payload.viewId = flags['view-id'];
  if (flags.keyword) payload.keyword = flags.keyword;
  if (flags['search-field-ids']) {
    payload.searchFieldIds = parseListFlag(flags['search-field-ids']);
  }
  if (flags.filters) payload.filters = parseArrayJsonFlag(flags.filters, 'filters');
  if (flags['filter-match-type']) payload.filterMatchType = flags['filter-match-type'];
  if (flags['sort-rule']) payload.sortRule = parseJsonFlag(flags['sort-rule'], 'sort-rule');

  return payload;
}

function normalizeBatchRows(rawRows: unknown): Array<{ data: Record<string, unknown> }> {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error('批量创建行数据必须是非空 JSON 数组');
  }

  return rawRows.map((row, index) => {
    const source = (row && typeof row === 'object' && !Array.isArray(row) && 'data' in row)
      ? (row as { data?: unknown }).data
      : row;
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      throw new Error(`第 ${index + 1} 行数据格式错误，必须是对象`);
    }
    return { data: source as Record<string, unknown> };
  });
}

function resolveBatchSize(value?: string): number {
  const batchSize = value ? Number(value) : DEFAULT_ROW_BATCH_SIZE;
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error('--batch-size 必须是正整数');
  }
  if (batchSize > MAX_ROW_BATCH_SIZE) {
    throw new Error(`--batch-size 不能超过 ${MAX_ROW_BATCH_SIZE}`);
  }
  return batchSize;
}

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
        const payload = buildRowPagePayload(flags);
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
    createCommand('batch-create', '批量创建行', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireSheetId(flags, args);
        const sdk = new RowSDK(createClient(context));
        const rawRows = flags.file
          ? JSON.parse(readFileSync(flags.file, 'utf-8'))
          : flags.values !== undefined
            ? JSON.parse(flags.values)
            : undefined;
        if (rawRows === undefined) {
          throw new Error('请通过 --file 或 --values 传入行数据');
        }

        const rows = normalizeBatchRows(rawRows);
        const batchSize = resolveBatchSize(flags['batch-size']);
        const results = [];
        for (let index = 0; index < rows.length; index += batchSize) {
          const chunk = rows.slice(index, index + batchSize);
          const result = await sdk.batchCreate(sheetId, { rows: chunk });
          if (Array.isArray(result.data)) {
            results.push(...result.data);
          }
        }

        printSuccess(context, `批量创建 ${rows.length} 行成功`, {
          created: rows.length,
          batches: Math.ceil(rows.length / batchSize),
          rows: results,
        });
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
        const sdk = new RowSDK(createClient(context));
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const currentRowResult = await sdk.info(teamId, projectId, sheetId, rowId);
        const currentRow = currentRowResult.data;
        const nextValues = flags.values ? JSON.parse(flags.values) as Record<string, unknown> : {};
        const mergedRow = {
          ...currentRow,
          ...nextValues,
        };
        const mergedValues = { ...mergedRow };
        delete (mergedValues as { id?: unknown }).id;
        const result = await sdk.update(sheetId, rowId, mergedValues, version);
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
        if (flags.value !== undefined && flags['value-json'] !== undefined) {
          throw new Error('--value 和 --value-json 不能同时传入');
        }
        if (flags.value === undefined && flags['value-json'] === undefined) {
          throw new Error('缺少单元格值，请传入 --value 或 --value-json');
        }
        const value = flags['value-json'] !== undefined
          ? parseJsonFlag(flags['value-json'], 'value-json')
          : flags.value;
        const sdk = new RowSDK(createClient(context));
        const result = await sdk.updateCell(sheetId, {
          rowId,
          fieldId,
          value,
          ...(version === undefined ? {} : { version }),
        });
        printSuccess(context, '单元格更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}
