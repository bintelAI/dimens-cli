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
    createCommand(
      'list',
      '获取视图列表',
      async args => {
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
      },
      {
        usage: 'view list --sheet-id <sheetId> [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli view list --team-id TEAM1 --project-id PROJ1 --sheet-id S1',
          'dimens-cli view list --app-url https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/ --sheet-id S1',
        ],
      }
    )
  );

  registerGroupCommand(
    'view',
    createCommand(
      'create',
      '创建视图',
      async args => {
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
          const isPublic = parseOptionalBoolean(
            flags.public ?? flags['is-public'],
            true
          );
          const sdk = new ViewSDK(createClient(context));
          const result = await sdk.create(teamId, projectId, sheetId, {
            name,
            type,
            isPublic,
            config: buildViewConfig(flags.config, type),
          });
          printSuccess(context, '视图创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'view create --sheet-id <sheetId> --name <name> [--type grid] [--public true|--is-public true] [--config <json>] [--team-id <teamId>] [--project-id <projectId>] [--app-url <url>]',
        examples: [
          'dimens-cli view create --team-id TEAM1 --project-id PROJ1 --sheet-id S1 --name 默认视图 --type grid --public true',
          'dimens-cli view create --team-id TEAM1 --project-id PROJ1 --sheet-id S1 --name 默认视图 --type grid --is-public true --config \'{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}\'',
          'dimens-cli view create --app-url https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/ --sheet-id S1 --name 默认视图 --type grid --public true',
        ],
      }
    )
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

function buildViewConfig(rawConfig: string | undefined, type: string): Record<string, unknown> | null {
  if (!rawConfig) {
    return buildDefaultViewConfig(type);
  }

  try {
    const parsed = JSON.parse(rawConfig);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('');
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error('config 必须是合法 JSON 对象');
  }
}
