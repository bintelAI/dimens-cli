import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { TeamSDK } from '../../sdk/team';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireTeamId,
} from '../utils';

export function registerTeamCommands(): void {
  createCommandGroup('team', '团队与成员');

  registerGroupCommand(
    'team',
    createCommand(
      'info',
      '获取团队信息',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new TeamSDK(createClient(context));
          const result = await sdk.info(teamId);
          printSuccess(context, '团队信息获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'team info [--team-id <teamId>] [--base-url <url>] [--token <token>]',
        examples: [
          'dimens-cli team info --team-id TEAM1',
          'dimens-cli team info --app-url https://dimens.bintelai.com/#/TEAM1/PROJ1/',
        ],
      }
    )
  );

  registerGroupCommand(
    'team',
    createCommand(
      'users',
      '获取团队成员列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new TeamSDK(createClient(context));
          const query: {
            projectId?: string;
            keyword?: string;
            key?: string;
          } = {};
          if (flags['project-id']) query.projectId = flags['project-id'];
          if (flags.keyword) query.keyword = flags.keyword;
          if (flags.key) query.key = flags.key;
          const result = await sdk.members(teamId, query);
          printSuccess(
            context,
            '团队成员列表获取成功',
            filterMembersByKeyword(result.data, flags.keyword || flags.key)
          );
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'team users [--team-id <teamId>] [--project-id <projectId>] [--keyword <keyword>] [--base-url <url>] [--token <token>]',
        examples: [
          'dimens-cli team users --team-id TEAM1',
          'dimens-cli team users --team-id TEAM1 --keyword 张三',
          'dimens-cli team users --team-id TEAM1 --project-id PROJ1',
        ],
      }
    )
  );
}

function filterMembersByKeyword<T extends Record<string, unknown>>(
  members: T[],
  keyword?: string
): T[] {
  if (!keyword) {
    return members;
  }
  const normalizedKeyword = keyword.toLowerCase();
  return members.filter(member =>
    ['name', 'nickName', 'username', 'email', 'phone', 'id', 'userId'].some(key => {
      const value = member[key];
      return value !== undefined && String(value).toLowerCase().includes(normalizedKeyword);
    })
  );
}
