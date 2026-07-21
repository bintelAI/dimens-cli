import { readFileSync } from 'node:fs';
import { JsonFieldSDK } from '../../sdk/json-field';
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

function parseOptionalInteger(value: string | undefined, fieldName: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${fieldName} 必须是大于等于 1 的整数`);
  }
  return parsed;
}

function readRequiredContent(flags: Record<string, string>): string {
  const content = flags.content;
  const file = flags.file;
  if (content !== undefined && file !== undefined) {
    throw new Error('--content 和 --file 不能同时传入');
  }
  if (file !== undefined) {
    return readFileSync(file, 'utf-8');
  }
  if (content !== undefined) {
    return content;
  }
  throw new Error('缺少 JSON 内容，请传入 --content 或 --file');
}

function assertJsonContainer(content: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('JSON 内容必须是合法 JSON');
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON 顶层必须是对象或数组');
  }
}

export function registerJsonFieldCommands(): void {
  createCommandGroup('json-field', 'JSON 字段管理');

  registerGroupCommand(
    'json-field',
    createCommand(
      'content',
      '获取扩展存储 JSON 字段内容',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const id = flags.id || args[0];
          if (!id) {
            throw new Error('缺少 JSON 数据 ID，请传入 --id');
          }

          const sdk = new JsonFieldSDK(createClient(context));
          const result = await sdk.getContent(teamId, projectId, id);
          printSuccess(context, 'JSON 字段内容获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'json-field content --id <jsonId> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli json-field content --team-id TEAM1 --project-id PROJ1 --id json_1',
        ],
      }
    )
  );

  registerGroupCommand(
    'json-field',
    createCommand(
      'save',
      '保存 JSON 字段内容',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = flags['sheet-id'];
          const rowId = flags['row-id'];
          const fieldId = flags['field-id'];
          if (!sheetId) {
            throw new Error('缺少 sheetId，请传入 --sheet-id');
          }
          if (!rowId) {
            throw new Error('缺少 rowId，请传入 --row-id');
          }
          if (!fieldId) {
            throw new Error('缺少 fieldId，请传入 --field-id');
          }

          const content = readRequiredContent(flags);
          assertJsonContainer(content);
          const jsonVersion = parseOptionalInteger(flags['json-version'], 'jsonVersion');
          const rowVersion = parseOptionalInteger(flags['row-version'], 'rowVersion');
          if (flags.id && jsonVersion === undefined) {
            throw new Error('更新扩展 JSON 时必须同时传入 --id 和 --json-version');
          }
          if (!flags.id && jsonVersion !== undefined) {
            throw new Error('--json-version 只能与 --id 一起使用');
          }
          const payload = {
            sheetId,
            rowId,
            fieldId,
            content,
            ...(flags.id ? { id: flags.id } : {}),
            ...(jsonVersion === undefined ? {} : { jsonVersion }),
            ...(rowVersion === undefined ? {} : { rowVersion }),
          };

          const sdk = new JsonFieldSDK(createClient(context));
          const result = await sdk.save(teamId, projectId, payload);
          printSuccess(context, 'JSON 字段保存成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'json-field save --sheet-id <sheetId> --row-id <rowId> --field-id <fieldId> (--content <json> | --file <path>) [--id <jsonId>] [--json-version <version>] [--row-version <version>] [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli json-field save --team-id TEAM1 --project-id PROJ1 --sheet-id sh_1 --row-id row_1 --field-id fld_json --file ./config.json --row-version 1',
          'dimens-cli json-field save --team-id TEAM1 --project-id PROJ1 --sheet-id sh_1 --row-id row_1 --field-id fld_json --id json_1 --json-version 2 --row-version 7 --content \'{"enabled":true}\'',
        ],
      }
    )
  );
}
