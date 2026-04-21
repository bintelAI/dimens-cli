import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { ProjectSDK } from '../../sdk/project';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireTeamId,
  saveProfile,
  mergeProfile,
} from '../utils';

export function registerProjectCommands(): void {
  createCommandGroup('project', '项目管理');

  registerGroupCommand(
    'project',
    createCommand(
      'list',
      '获取项目列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const sdk = new ProjectSDK(createClient(context));
          const page = Number(flags.page || '1');
          const size = Number(flags.size || '20');
          const payload: {
            page: number;
            size: number;
            keyword?: string;
          } = {
            page,
            size,
          };
          if (flags.keyword) {
            payload.keyword = flags.keyword;
          }
          const result = await sdk.page(teamId, payload);
          printSuccess(context, '项目列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'project list [--team-id <teamId>] [--page 1] [--size 20] [--app-url <url>]',
        examples: [
          'dimens-cli project list --team-id TEAM1',
          'dimens-cli project list --app-url https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
        ],
      }
    )
  );

  registerGroupCommand(
    'project',
    createCommand(
      'info',
      '获取项目详情',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const id = flags.id || args[0];
          if (!id) {
            throw new Error('缺少项目 ID，请传入 --id 或 project info <id>');
          }
          const sdk = new ProjectSDK(createClient(context));
          const result = await sdk.info(teamId, id);
          printSuccess(context, '项目详情获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'project info --id <projectId>',
      }
    )
  );

  registerGroupCommand(
    'project',
    createCommand(
      'create',
      '创建项目',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const name = flags.name;
          if (!name) {
            throw new Error('缺少项目名称，请传入 --name');
          }
          const sdk = new ProjectSDK(createClient(context));
          const payload: {
            name: string;
            description?: string;
            remark?: string;
            projectType?: string;
          } = {
            name,
          };
          if (flags.description) {
            payload.description = flags.description;
          }
          if (flags.remark) {
            payload.remark = flags.remark;
          }
          if (flags['project-type']) {
            payload.projectType = flags['project-type'];
          }
          const result = await sdk.create(teamId, payload);
          printSuccess(context, '项目创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'project create --name <name> [--description <description>] [--project-type <type>] [--team-id <teamId>] [--app-url <url>]',
        examples: [
          'dimens-cli project create --team-id TEAM1 --name 客户管理系统',
          'dimens-cli project create --team-id TEAM1 --name 知识库项目 --description 文档协作空间 --project-type document',
        ],
      }
    )
  );

  registerGroupCommand(
    'project',
    createCommand(
      'update',
      '更新项目',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const id = flags.id;
          if (!id) {
            throw new Error('缺少项目 ID，请传入 --id');
          }
          const sdk = new ProjectSDK(createClient(context));
          const currentProjectResult = await sdk.info(teamId, id);
          const currentProject = currentProjectResult.data;
          const payload: {
            id: string;
            name?: string;
            remark?: string;
            icon?: string;
            coverImage?: string;
          } = {
            id,
          };
          if (typeof currentProject.name === 'string') {
            payload.name = currentProject.name;
          }
          if (typeof currentProject.remark === 'string') {
            payload.remark = currentProject.remark;
          }
          if (typeof currentProject.icon === 'string') {
            payload.icon = currentProject.icon;
          }
          if (typeof currentProject.coverImage === 'string') {
            payload.coverImage = currentProject.coverImage;
          }
          if (flags.name) {
            payload.name = flags.name;
          }
          if (flags.remark) {
            payload.remark = flags.remark;
          }
          if (flags.icon) {
            payload.icon = flags.icon;
          }
          if (flags['cover-image']) {
            payload.coverImage = flags['cover-image'];
          }
          const result = await sdk.update(teamId, payload);
          printSuccess(context, '项目更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'project update --id <projectId> [--name <name>] [--icon <iconUrl>] [--cover-image <coverImageUrl>] [--remark <remark>]',
      }
    )
  );

  registerGroupCommand(
    'project',
    createCommand(
      'trash',
      '将项目移入回收站',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const ids = (flags.ids || args.join(','))
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
          if (ids.length === 0) {
            throw new Error('缺少项目 ID，请传入 --ids P1,P2');
          }
          const sdk = new ProjectSDK(createClient(context));
          const result = await sdk.trash(teamId, ids);
          printSuccess(context, '项目已移入回收站', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'project trash --ids <id1,id2>',
      }
    )
  );

  registerGroupCommand(
    'project',
    createCommand(
      'restore',
      '恢复项目',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const ids = (flags.ids || args.join(','))
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
          if (ids.length === 0) {
            throw new Error('缺少项目 ID，请传入 --ids P1,P2');
          }
          const sdk = new ProjectSDK(createClient(context));
          const result = await sdk.restore(teamId, ids);
          printSuccess(context, '项目恢复成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'project restore --ids <id1,id2>',
      }
    )
  );

  registerGroupCommand(
    'project',
    createCommand(
      'use',
      '设置默认项目',
      async args => {
        const context = getContext();
        try {
          const projectId = args[0];
          if (!projectId) {
            throw new Error('缺少项目 ID，请传入 project use <projectId>');
          }
          await saveProfile(mergeProfile({ projectId }));
          printSuccess(context, '默认项目已切换', { projectId });
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'project use <projectId>',
      }
    )
  );
}
