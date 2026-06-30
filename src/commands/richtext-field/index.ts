import { RichTextFieldSDK } from '../../sdk/richtext-field';
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

export function registerRichTextFieldCommands(): void {
  createCommandGroup('richtext-field', '富文本字段管理');

  registerGroupCommand(
    'richtext-field',
    createCommand(
      'content',
      '获取富文本字段关联文档内容',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          if (!documentId) {
            throw new Error('缺少 documentId，请传入 --document-id');
          }

          const sdk = new RichTextFieldSDK(createClient(context));
          const result = await sdk.getContent(teamId, projectId, documentId);
          printSuccess(context, '富文本字段内容获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'richtext-field content --document-id <documentId> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli richtext-field content --team-id TEAM1 --project-id PROJ1 --document-id DOC_RTF_1',
        ],
      }
    )
  );

  registerGroupCommand(
    'richtext-field',
    createCommand(
      'save',
      '保存富文本字段 HTML 内容',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const sheetId = flags['sheet-id'];
          const rowId = flags['row-id'];
          const fieldId = flags['field-id'];
          const content = flags.content;

          if (!sheetId) {
            throw new Error('缺少 sheetId，请传入 --sheet-id');
          }
          if (!rowId) {
            throw new Error('缺少 rowId，请传入 --row-id');
          }
          if (!fieldId) {
            throw new Error('缺少 fieldId，请传入 --field-id');
          }
          if (content === undefined) {
            throw new Error('缺少 HTML 内容，请传入 --content');
          }

          const payload: {
            sheetId: string;
            rowId: string;
            fieldId: string;
            documentId?: string | null;
            content: string;
            rowVersion?: number;
            title?: string;
          } = {
            sheetId,
            rowId,
            fieldId,
            content,
          };

          if (flags['document-id']) {
            payload.documentId = flags['document-id'];
          }
          const rowVersion = parseOptionalInteger(flags['row-version'], 'rowVersion');
          if (rowVersion !== undefined) {
            payload.rowVersion = rowVersion;
          }
          if (flags.title) {
            payload.title = flags.title;
          }

          const sdk = new RichTextFieldSDK(createClient(context));
          const result = await sdk.save(teamId, projectId, payload);
          printSuccess(context, '富文本字段保存成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'richtext-field save --sheet-id <sheetId> --row-id <rowId> --field-id <fieldId> --content <html> [--document-id <documentId>] [--row-version <version>] [--title <title>] [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli richtext-field save --team-id TEAM1 --project-id PROJ1 --sheet-id sh_1 --row-id row_1 --field-id fld_richtext --content "<h1>AI 生成说明</h1><p>这里是 HTML。</p>"',
        ],
      }
    )
  );
}
