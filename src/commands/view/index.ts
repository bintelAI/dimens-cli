import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { ViewSDK } from '../../sdk/view';
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

const DEFAULT_VIEW_CONFIG = {
  filters: [],
  filterMatchType: 'and',
  sortRule: null,
  groupBy: [],
  hiddenColumnIds: [],
  rowHeight: 'medium',
};

export function registerViewCommands(): void {
  createCommandGroup('view', '视图管理');

  registerGroupCommand(
    'view',
    createCommand('list', '获取视图列表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const sheetId = requireSheetId(flags, args);
        const sdk = new ViewSDK(createClient(context));
        const result = await sdk.list(teamId, projectId, sheetId);
        printSuccess(context, '视图列表获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'view',
    createCommand('create', '创建视图', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const teamId = requireTeamId(context, flags);
        const projectId = requireProjectId(context, flags);
        const sheetId = requireSheetId(flags, args);
        const name = flags.name;
        if (!name) {
          throw new Error('缺少视图名称，请传入 --name');
        }

        const type = flags.type || 'grid';
        const isPublic = parseOptionalBoolean(flags.public, true);
        const sdk = new ViewSDK(createClient(context));
        const result = await sdk.create(teamId, projectId, sheetId, {
          name,
          type,
          isPublic,
          config: buildDefaultViewConfig(type),
        });
        printSuccess(context, '视图创建成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}

function parseOptionalBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error('public 必须是 true 或 false');
}

function buildDefaultViewConfig(type: string): Record<string, unknown> | null {
  if (type === 'grid') {
    return DEFAULT_VIEW_CONFIG;
  }
  return null;
}
