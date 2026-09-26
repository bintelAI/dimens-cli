import { BookSDK } from '../../sdk/book';
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

function parseJson(value: string | undefined, label: string): Record<string, unknown> {
  if (!value) throw new Error(`缺少${label}，请传入 JSON 字符串`);
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(`${label}必须是合法 JSON 对象`);
  }
}

export function registerBookCommands(): void {
  createCommandGroup('book', '电子书项目与页面管理');

  registerGroupCommand('book', createCommand('project', '电子书项目管理', async args => {
    const flags = parseFlags(args);
    const context = getContext(flags);
    try {
      const action = args[0]?.startsWith('--') ? undefined : args[0];
      const teamId = requireTeamId(context, flags);
      const sdk = new BookSDK(createClient(context));
      if (action === 'create') {
        const name = flags.name;
        if (!name) throw new Error('缺少项目名称，请传入 --name');
        const result = await sdk.project.create(teamId, {
          name,
          ...(flags.description ? { description: flags.description } : {}),
          ...(flags['project-type'] ? { projectType: flags['project-type'] } : {}),
        });
        printSuccess(context, '电子书项目创建成功', result.data);
      } else if (action === 'update') {
        const projectId = flags['project-id'];
        if (!projectId) throw new Error('缺少项目 ID，请传入 --project-id');
        const result = await sdk.project.update(teamId, projectId, {
          ...(flags.name ? { name: flags.name } : {}),
          ...(flags.description ? { description: flags.description } : {}),
          ...(flags['project-type'] ? { projectType: flags['project-type'] } : {}),
        });
        printSuccess(context, '电子书项目更新成功', result.data);
      } else if (action === 'info') {
        const projectId = flags['project-id'];
        if (!projectId) throw new Error('缺少项目 ID，请传入 --project-id');
        const result = await sdk.project.info(teamId, projectId);
        printSuccess(context, '电子书项目详情获取成功', result.data);
      } else if (action === 'page' || !action) {
        const result = await sdk.project.page(teamId, {
          ...(flags.page ? { page: Number(flags.page) } : {}),
          ...(flags.size ? { size: Number(flags.size) } : {}),
        });
        printSuccess(context, '电子书项目列表获取成功', result.data);
      } else {
        throw new Error('不支持的项目动作，请使用 page、info、create 或 update');
      }
    } catch (error) {
      printError(context, error);
    }
  }, {
    usage: 'book project <page|info|create|update> [options]',
    examples: [
      'dimens-cli book project create --team-id TEAM1 --name 产品画册',
      'dimens-cli book project update --team-id TEAM1 --project-id BOOK1 --name 新名称',
    ],
  }));

  registerGroupCommand('book', createCommand('page', '电子书页面管理', async args => {
    const flags = parseFlags(args);
    const context = getContext(flags);
    try {
      const action = args[0]?.startsWith('--') ? undefined : args[0];
      const teamId = requireTeamId(context, flags);
      const projectId = requireProjectId(context, flags);
      const sdk = new BookSDK(createClient(context));
      if (action === 'list') {
        const result = flags['project-type']
          ? await sdk.page.list(teamId, projectId, flags['project-type'])
          : await sdk.page.list(teamId, projectId);
        printSuccess(context, '电子书页面列表获取成功', result.data);
      } else if (action === 'info') {
        const result = flags['project-type']
          ? await sdk.page.info(teamId, projectId, flags['project-type'])
          : await sdk.page.info(teamId, projectId);
        printSuccess(context, '电子书页面获取成功', result.data);
      } else if (action === 'create') {
        const result = await sdk.page.create(teamId, projectId, {
          ...(flags['project-type'] ? { projectType: flags['project-type'] } : {}),
          ...(flags.title ? { title: flags.title } : {}),
          draftSnapshot: parseJson(flags['draft-snapshot'], 'draftSnapshot'),
          ...(flags['snapshot-schema-version'] ? { snapshotSchemaVersion: flags['snapshot-schema-version'] } : {}),
        });
        printSuccess(context, '电子书页面创建成功', result.data);
      } else if (action === 'update') {
        const pageId = flags['page-id'];
        const baseRevision = Number(flags['base-revision']);
        if (!pageId) throw new Error('缺少页面 ID，请传入 --page-id');
        if (!Number.isInteger(baseRevision) || baseRevision < 0) throw new Error('缺少合法的 --base-revision');
        const result = await sdk.page.update(teamId, projectId, {
          documentId: pageId,
          baseRevision,
          draftSnapshot: parseJson(flags['draft-snapshot'], 'draftSnapshot'),
          ...(flags.title ? { title: flags.title } : {}),
          ...(flags['change-summary'] ? { changeSummary: flags['change-summary'] } : {}),
        });
        printSuccess(context, '电子书页面更新成功', result.data);
      } else if (action === 'delete') {
        const pageId = flags['page-id'];
        if (!pageId) throw new Error('缺少页面 ID，请传入 --page-id');
        const result = await sdk.page.delete(teamId, projectId, pageId);
        printSuccess(context, '电子书页面删除成功', result.data);
      } else {
        throw new Error('不支持的页面动作，请使用 info、create、update 或 delete');
      }
    } catch (error) {
      printError(context, error);
    }
  }, {
    usage: 'book page <list|info|create|update|delete> [options]',
    examples: [
      'dimens-cli book page info --team-id TEAM1 --project-id BOOK1 --project-type magazine',
      'dimens-cli book page delete --team-id TEAM1 --project-id BOOK1 --page-id PAGE1',
    ],
  }));
}
