import { PluginPublicSDK } from '../../sdk/plugin-public';
import type {
  PluginPublicInstallFlowInput,
  PluginPublicInstallInput,
  PluginPublicListQuery,
} from '../../sdk/plugin-public';
import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireTeamId,
} from '../utils';

function parseNumber(value: string | undefined, fieldName: string): number {
  const numberValue = Number(value);
  if (!value || !Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${fieldName} 必须是正整数`);
  }
  return numberValue;
}

function parseOptionalNumber(value: string | undefined, fieldName: string): number | undefined {
  if (!value) {
    return undefined;
  }
  return parseNumber(value, fieldName);
}

function parseStringList(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function requireResourceId(flags: Record<string, string>, args: string[]): number {
  return parseNumber(flags['resource-id'] || args[0], 'resource-id');
}

export function registerPluginPublicCommands(): void {
  createCommandGroup('plugin-public', '公开插件市场发布、浏览与安装');

  registerGroupCommand(
    'plugin-public',
    createCommand(
      'publish',
      '发布团队插件到公开插件市场',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const pluginId = parseNumber(flags['plugin-id'] || flags.id || args[0], 'plugin-id');
          const sdk = new PluginPublicSDK(createClient(context));
          const result = await sdk.publish(teamId, pluginId);
          printSuccess(context, '团队插件发布到公开插件成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'plugin-public publish --plugin-id <id> [--team-id <teamId>]',
        examples: ['dimens-cli plugin-public publish --team-id TEAM1 --plugin-id 3'],
      }
    )
  );

  registerGroupCommand(
    'plugin-public',
    createCommand(
      'list',
      '查询公开插件市场列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const sdk = new PluginPublicSDK(createClient(context));
          const query: PluginPublicListQuery = {};
          if (flags.keyword) {
            query.keyword = flags.keyword;
          }
          const page = parseOptionalNumber(flags.page, 'page');
          if (page !== undefined) {
            query.page = page;
          }
          const size = parseOptionalNumber(flags.size, 'size');
          if (size !== undefined) {
            query.size = size;
          }
          if (flags['team-id']) {
            query.teamId = flags['team-id'];
          }
          const result = await sdk.list(query);
          printSuccess(context, '公开插件列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'plugin-public list [--keyword <keyword>] [--page 1] [--size 20]',
      }
    )
  );

  registerGroupCommand(
    'plugin-public',
    createCommand(
      'detail',
      '查询公开插件详情',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const resourceId = requireResourceId(flags, args);
          const sdk = new PluginPublicSDK(createClient(context));
          const result = await sdk.detail(resourceId);
          printSuccess(context, '公开插件详情获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'plugin-public detail --resource-id <resourceId>',
      }
    )
  );

  registerGroupCommand(
    'plugin-public',
    createCommand(
      'install-flow',
      '安装公开插件为目标团队工作流实例',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const projectScopeType = flags['project-scope-type'] || 'all_projects';
          if (!['all_projects', 'selected_projects'].includes(projectScopeType)) {
            throw new Error('project-scope-type 必须是 all_projects 或 selected_projects');
          }
          const sdk = new PluginPublicSDK(createClient(context));
          const payload: PluginPublicInstallFlowInput = {
            teamId,
            resourceId: requireResourceId(flags, args),
            projectScopeType: projectScopeType as 'all_projects' | 'selected_projects',
          };
          const projectIds = parseStringList(flags['project-ids']);
          if (projectIds) {
            payload.projectIds = projectIds;
          }
          if (flags['instance-name']) {
            payload.instanceName = flags['instance-name'];
          }
          const result = await sdk.installFlow(payload);
          printSuccess(context, '公开插件安装成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'plugin-public install-flow --resource-id <resourceId> [--team-id <teamId>] [--project-scope-type all_projects|selected_projects] [--project-ids <id1,id2>] [--instance-name <name>]',
      }
    )
  );

  registerGroupCommand(
    'plugin-public',
    createCommand(
      'install',
      '按市场通用入口安装公开插件',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new PluginPublicSDK(createClient(context));
          const payload: PluginPublicInstallInput = {
            teamId,
            resourceId: requireResourceId(flags, args),
          };
          if (flags['project-id']) {
            payload.projectId = flags['project-id'];
          }
          if (flags['instance-name']) {
            payload.instanceName = flags['instance-name'];
          }
          const result = await sdk.install(payload);
          printSuccess(context, '公开插件通用安装成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'plugin-public install --resource-id <resourceId> [--team-id <teamId>] [--project-id <projectId>] [--instance-name <name>]',
      }
    )
  );

  registerGroupCommand(
    'plugin-public',
    createCommand(
      'uninstall',
      '卸载公开插件安装实例',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const sdk = new PluginPublicSDK(createClient(context));
          const result = await sdk.uninstall(requireResourceId(flags, args), flags['team-id'] || context.teamId);
          printSuccess(context, '公开插件卸载成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'plugin-public uninstall --resource-id <resourceId> [--team-id <teamId>]',
      }
    )
  );

  registerGroupCommand(
    'plugin-public',
    createCommand(
      'upgrade',
      '升级公开插件安装实例',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);
        try {
          const sdk = new PluginPublicSDK(createClient(context));
          const result = await sdk.upgrade(requireResourceId(flags, args), flags['team-id'] || context.teamId);
          printSuccess(context, '公开插件升级成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'plugin-public upgrade --resource-id <resourceId> [--team-id <teamId>]',
      }
    )
  );
}
