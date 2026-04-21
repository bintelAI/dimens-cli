import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { RoleSDK } from '../../sdk/role';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
} from '../utils';

export function registerRoleCommands(): void {
  createCommandGroup('role', '角色管理');

  registerGroupCommand(
    'role',
    createCommand('list', '获取角色列表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const sdk = new RoleSDK(createClient(context));
        const result = await sdk.list(projectId);
        printSuccess(context, '角色列表获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'role',
    createCommand('info', '获取角色详情', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const roleId = flags['role-id'] || args[0];
        if (!roleId) {
          throw new Error('缺少 roleId，请传入 --role-id');
        }
        const sdk = new RoleSDK(createClient(context));
        const result = await sdk.info(projectId, roleId);
        printSuccess(context, '角色详情获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'role',
    createCommand('create', '创建角色', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const name = flags.name;
        if (!name) {
          throw new Error('缺少角色名称，请传入 --name');
        }
        const sdk = new RoleSDK(createClient(context));
        const result = await sdk.create(projectId, {
          name,
          ...(flags.description ? { description: flags.description } : {}),
          ...(flags['can-manage-sheets'] ? { canManageSheets: parseBooleanFlag(flags['can-manage-sheets'], 'can-manage-sheets') } : {}),
          ...(flags['can-edit-schema'] ? { canEditSchema: parseBooleanFlag(flags['can-edit-schema'], 'can-edit-schema') } : {}),
          ...(flags['can-edit-data'] ? { canEditData: parseBooleanFlag(flags['can-edit-data'], 'can-edit-data') } : {}),
        });
        printSuccess(context, '角色创建成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'role',
    createCommand('update', '更新角色', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const roleId = flags['role-id'];
        if (!roleId) {
          throw new Error('缺少 roleId，请传入 --role-id');
        }

        const sdk = new RoleSDK(createClient(context));
        const currentRoleResult = await sdk.info(projectId, roleId);
        const currentRole = currentRoleResult.data;
        const data: Record<string, unknown> = {};
        if (typeof currentRole.name === 'string') data.name = currentRole.name;
        if (typeof currentRole.description === 'string') data.description = currentRole.description;
        if (typeof currentRole.canManageSheets === 'boolean') data.canManageSheets = currentRole.canManageSheets;
        if (typeof currentRole.canEditSchema === 'boolean') data.canEditSchema = currentRole.canEditSchema;
        if (typeof currentRole.canEditData === 'boolean') data.canEditData = currentRole.canEditData;
        if (flags.name) data.name = flags.name;
        if (flags.description) data.description = flags.description;
        if (flags['can-manage-sheets']) data.canManageSheets = parseBooleanFlag(flags['can-manage-sheets'], 'can-manage-sheets');
        if (flags['can-edit-schema']) data.canEditSchema = parseBooleanFlag(flags['can-edit-schema'], 'can-edit-schema');
        if (flags['can-edit-data']) data.canEditData = parseBooleanFlag(flags['can-edit-data'], 'can-edit-data');
        const result = await sdk.update(projectId, { roleId, data });
        printSuccess(context, '角色更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'role',
    createCommand('delete', '删除角色', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const roleIds = (flags['role-ids'] || args.join(','))
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
        if (roleIds.length === 0) {
          throw new Error('缺少 roleIds，请传入 --role-ids role1,role2');
        }
        const sdk = new RoleSDK(createClient(context));
        const result = await sdk.delete(projectId, roleIds);
        printSuccess(context, '角色删除完成', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'role',
    createCommand('assign-user', '给用户分配角色', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const roleId = flags['role-id'];
        const userId = Number(flags['user-id'] || '');
        if (!roleId || Number.isNaN(userId)) {
          throw new Error('缺少 roleId 或 userId，请传入 --role-id 和 --user-id');
        }
        const sdk = new RoleSDK(createClient(context));
        const result = await sdk.assignUser(projectId, {
          roleId,
          userId,
          ...(flags['sheet-id'] ? { sheetId: flags['sheet-id'] } : {}),
        });
        printSuccess(context, '角色分配成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'role',
    createCommand('revoke-user', '移除用户角色', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const roleId = flags['role-id'];
        const userId = Number(flags['user-id'] || '');
        if (!roleId || Number.isNaN(userId)) {
          throw new Error('缺少 roleId 或 userId，请传入 --role-id 和 --user-id');
        }
        const sdk = new RoleSDK(createClient(context));
        const result = await sdk.removeUser(projectId, {
          roleId,
          userId,
          ...(flags['sheet-id'] ? { sheetId: flags['sheet-id'] } : {}),
        });
        printSuccess(context, '角色移除成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}

function parseBooleanFlag(value: string, fieldName: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${fieldName} 必须是 true 或 false`);
}
