import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { DocumentSDK } from '../../sdk/document';
import { UploadSDK } from '../../sdk/upload';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
  requireTeamId,
} from '../utils';
import { toUploadArgs } from '../upload/shared';

export function registerDocCommands(): void {
  createCommandGroup('doc', '文档管理');

  registerGroupCommand(
    'doc',
    createCommand(
      'attach-file',
      '上传文件并追加为文档附件节点',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          const filePath = flags.file || flags.path;

          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }
          if (!filePath) {
            throw new Error('缺少文件路径，请传入 --file 或 --path');
          }

          const documentSdk = new DocumentSDK(createClient(context));
          const uploadSdk = new UploadSDK(createClient(context));
          const uploadOptions: {
            key?: string;
            scene: string;
            teamId: string;
            projectId: string;
          } = {
            scene: 'document-attachment',
            teamId,
            projectId,
          };
          if (flags.key) {
            uploadOptions.key = flags.key;
          }
          const uploadArgs = toUploadArgs(uploadOptions);

          const [documentResult, uploadResult] = await Promise.all([
            documentSdk.info(teamId, projectId, documentId),
            uploadSdk.uploadFile(filePath, uploadArgs),
          ]);

          const document = documentResult.data;
          const upload = uploadResult.data;
          const title = flags.title || upload.name || '附件';
          const size = upload.size ? String(upload.size) : '0';
          const existingContent = typeof document.content === 'string' ? document.content : '';
          const attachmentNode =
            `<p data-attachment="true" data-file-name="${escapeHtmlAttribute(title)}" ` +
            `data-file-size="${escapeHtmlAttribute(size)}">` +
            `<a href="${escapeHtmlAttribute(String(upload.url || ''))}" target="_blank">${escapeHtmlText(title)}</a>` +
            '</p>';

          const result = await documentSdk.update(teamId, projectId, {
            documentId,
            content: appendHtmlBlock(existingContent, attachmentNode),
            version: Number(document.version || 1),
            createVersion: true,
            changeSummary: flags['change-summary'] || '追加文档附件',
          });

          printSuccess(context, '文档附件追加成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc attach-file --document-id <documentId> --file <path> [--title <title>] [--key <storageKey>] [--change-summary <summary>] [--team-id <teamId>] [--project-id <projectId>]',
        examples: [
          'dimens-cli doc attach-file --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --file ./release.pdf',
        ],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'append-image',
      '上传图片并追加为文档图片节点',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          const filePath = flags.file || flags.path;

          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }
          if (!filePath) {
            throw new Error('缺少图片路径，请传入 --file 或 --path');
          }

          const documentSdk = new DocumentSDK(createClient(context));
          const uploadSdk = new UploadSDK(createClient(context));
          const uploadOptions: {
            key?: string;
            scene: string;
            teamId: string;
            projectId: string;
          } = {
            scene: 'document-image',
            teamId,
            projectId,
          };
          if (flags.key) {
            uploadOptions.key = flags.key;
          }
          const uploadArgs = toUploadArgs(uploadOptions);

          const [documentResult, uploadResult] = await Promise.all([
            documentSdk.info(teamId, projectId, documentId),
            uploadSdk.uploadFile(filePath, uploadArgs),
          ]);

          const document = documentResult.data;
          const upload = uploadResult.data;
          const alt = flags.alt || upload.name || '图片';
          const existingContent = typeof document.content === 'string' ? document.content : '';
          const imageNode =
            `<p><img src="${escapeHtmlAttribute(String(upload.url || ''))}" alt="${escapeHtmlAttribute(alt)}" /></p>`;

          const result = await documentSdk.update(teamId, projectId, {
            documentId,
            content: appendHtmlBlock(existingContent, imageNode),
            version: Number(document.version || 1),
            createVersion: true,
            changeSummary: flags['change-summary'] || '追加文档图片',
          });

          printSuccess(context, '文档图片追加成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc append-image --document-id <documentId> --file <path> [--alt <alt>] [--key <storageKey>] [--change-summary <summary>] [--team-id <teamId>] [--project-id <projectId>]',
        examples: [
          'dimens-cli doc append-image --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --file ./cover.png --alt 封面图',
        ],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'versions',
      '获取文档版本列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }

          const page = Number(flags.page || '1');
          const size = Number(flags.size || '20');
          if (!Number.isInteger(page) || page < 1) {
            throw new Error('page 必须是大于等于 1 的整数');
          }
          if (!Number.isInteger(size) || size < 1) {
            throw new Error('size 必须是大于等于 1 的整数');
          }

          const sdk = new DocumentSDK(createClient(context));
          const result = await sdk.versions(teamId, projectId, {
            documentId,
            page,
            size,
          });
          printSuccess(context, '文档版本列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc versions --document-id <documentId> [--page 1] [--size 20] [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli doc versions --team-id TEAM1 --project-id PROJ1 --document-id DOC_1',
        ],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'info',
      '获取文档详情',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }

          const sdk = new DocumentSDK(createClient(context));
          const result = await sdk.info(teamId, projectId, documentId);
          printSuccess(context, '文档详情获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc info --document-id <documentId> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: ['dimens-cli doc info --team-id TEAM1 --project-id PROJ1 --document-id DOC_1'],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'create',
      '创建在线文档',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const title = flags.title || flags.name;
          if (!title) {
            throw new Error('缺少文档标题，请传入 --title');
          }

          const sdk = new DocumentSDK(createClient(context));
          const payload: {
            parentId?: string;
            title: string;
            content?: string;
            format?: 'richtext' | 'markdown' | 'html';
          } = {
            title,
          };

          if (flags['parent-id']) {
            payload.parentId = flags['parent-id'];
          }
          if (flags.content) {
            payload.content = flags.content;
          }
          if (flags.format === 'richtext' || flags.format === 'markdown' || flags.format === 'html') {
            payload.format = flags.format;
          }

          const result = await sdk.createWithSheet(teamId, projectId, payload);
          printSuccess(context, '在线文档创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc create --title <title> [--content <content>] [--format richtext|markdown|html] [--parent-id <sheetId>] [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli doc create --team-id TEAM1 --project-id PROJ1 --title 在线文档',
          'dimens-cli doc create --team-id TEAM1 --project-id PROJ1 --title 在线文档 --content "<p>Hello TipTap</p>" --format richtext',
        ],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'version',
      '获取指定文档版本',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }
          if (!flags.version) {
            throw new Error('缺少版本号，请传入 --version');
          }

          const version = Number(flags.version);
          if (!Number.isInteger(version) || version < 1) {
            throw new Error('version 必须是大于等于 1 的整数');
          }

          const sdk = new DocumentSDK(createClient(context));
          const result = await sdk.version(teamId, projectId, {
            documentId,
            version,
          });
          printSuccess(context, '文档版本获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc version --document-id <documentId> --version <version> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli doc version --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --version 3',
        ],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'update',
      '更新文档内容',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }
          if (!flags.content) {
            throw new Error('缺少文档内容，请传入 --content');
          }
          if (!flags.version) {
            throw new Error('缺少文档版本，请传入 --version');
          }

          const version = Number(flags.version);
          if (!Number.isInteger(version) || version < 1) {
            throw new Error('version 必须是大于等于 1 的整数');
          }

          const createVersionFlag = String(flags['create-version'] || '').toLowerCase();
          const payload: {
            documentId: string;
            content: string;
            version: number;
            createVersion?: boolean;
            changeSummary?: string;
          } = {
            documentId,
            content: flags.content,
            version,
          };

          if (createVersionFlag === 'true' || createVersionFlag === 'false') {
            payload.createVersion = createVersionFlag === 'true';
          }
          if (flags['change-summary']) {
            payload.changeSummary = flags['change-summary'];
          }

          const sdk = new DocumentSDK(createClient(context));
          const result = await sdk.update(teamId, projectId, payload);
          printSuccess(context, '文档更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc update --document-id <documentId> --content <content> --version <version> [--create-version true|false] [--change-summary <summary>] [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli doc update --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --content "<p>更新后的内容</p>" --version 1',
          'dimens-cli doc update --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --content "<p>更新后的内容</p>" --version 1 --create-version true --change-summary 补充说明',
        ],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'restore',
      '恢复到指定文档版本',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }
          if (!flags.version) {
            throw new Error('缺少版本号，请传入 --version');
          }

          const version = Number(flags.version);
          if (!Number.isInteger(version) || version < 1) {
            throw new Error('version 必须是大于等于 1 的整数');
          }

          const sdk = new DocumentSDK(createClient(context));
          const result = await sdk.restore(teamId, projectId, {
            documentId,
            version,
          });
          printSuccess(context, '文档版本恢复成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc restore --document-id <documentId> --version <version> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli doc restore --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --version 3',
        ],
      }
    )
  );

  registerGroupCommand(
    'doc',
    createCommand(
      'delete',
      '删除文档',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const projectId = requireProjectId(context, flags);
          const documentId = flags['document-id'] || args[0];
          if (!documentId) {
            throw new Error('缺少文档 ID，请传入 --document-id');
          }

          const sdk = new DocumentSDK(createClient(context));
          const result = await sdk.delete(teamId, projectId, documentId);
          printSuccess(context, '文档删除成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'doc delete --document-id <documentId> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: ['dimens-cli doc delete --team-id TEAM1 --project-id PROJ1 --document-id DOC_1'],
      }
    )
  );
}

function appendHtmlBlock(existingContent: string, block: string): string {
  const trimmed = existingContent.trim();
  if (!trimmed) {
    return block;
  }
  return `${trimmed}\n${block}`;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeHtmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
