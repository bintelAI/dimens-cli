import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { PermissionSDK, type ResourceType } from '../../sdk/permission';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
} from '../utils';

export function registerPermissionCommands(): void {
  createCommandGroup('permission', '项目权限管理');

  registerGroupCommand(
    'permission',
    createCommand('list', '获取权限列表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const sdk = new PermissionSDK(createClient(context));
        const result = await sdk.list(projectId, flags['sheet-id']);
        printSuccess(context, '权限列表获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'permission',
    createCommand('create', '创建权限配置', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const roleId = flags['role-id'];
        if (!roleId) {
          throw new Error('缺少 roleId，请传入 --role-id');
        }
        const sdk = new PermissionSDK(createClient(context));
        const result = await sdk.create(projectId, buildPermissionPayload(flags, roleId));
        printSuccess(context, '权限创建成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'permission',
    createCommand('update', '更新权限配置', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const id = Number(flags.id || '');
        const sheetId = flags['sheet-id'];
        const roleId = flags['role-id'];
        if (Number.isNaN(id) || !sheetId || !roleId) {
          throw new Error('缺少 id、sheetId 或 roleId，请传入 --id --sheet-id --role-id');
        }
        const sdk = new PermissionSDK(createClient(context));
        const result = await sdk.update(projectId, {
          id,
          sheetId,
          data: buildPermissionPayload(flags, roleId),
        });
        printSuccess(context, '权限更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'permission',
    createCommand('delete', '删除权限配置', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const sheetId = flags['sheet-id'];
        if (!sheetId) {
          throw new Error('缺少 sheetId，请传入 --sheet-id');
        }
        const ids = (flags.ids || args.join(','))
          .split(',')
          .map(item => Number(item.trim()))
          .filter(item => !Number.isNaN(item));
        if (ids.length === 0) {
          throw new Error('缺少 ids，请传入 --ids 1,2');
        }
        const sdk = new PermissionSDK(createClient(context));
        const result = await sdk.delete(projectId, ids, sheetId);
        printSuccess(context, '权限删除完成', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'permission',
    createCommand('set-resource', '设置资源权限', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const roleId = flags['role-id'];
        const resourceId = flags['resource-id'];
        const resourceType = flags['resource-type'] as ResourceType | undefined;
        if (!roleId || !resourceId || !resourceType) {
          throw new Error('缺少 roleId、resourceId 或 resourceType，请传入 --role-id --resource-id --resource-type');
        }
        const visible = parseBooleanFlag(flags.visible, 'visible');
        const editable = parseBooleanFlag(flags.editable, 'editable');
        const sdk = new PermissionSDK(createClient(context));
        const result = await sdk.updateResourcePermission(projectId, {
          roleId,
          resourceId,
          resourceType,
          permission: { visible, editable },
        });
        printSuccess(context, '资源权限设置成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}

function buildPermissionPayload(flags: Record<string, string>, roleId: string) {
  const payload: Record<string, unknown> = { roleId };
  if (flags['sheet-id']) payload.sheetId = flags['sheet-id'];
  if (flags['data-access']) payload.dataAccess = flags['data-access'];
  if (flags['can-read']) payload.canRead = parseBooleanFlag(flags['can-read'], 'can-read');
  if (flags['can-write']) payload.canWrite = parseBooleanFlag(flags['can-write'], 'can-write');
  if (flags['column-visibility']) payload.columnVisibility = parseJsonFlag(flags['column-visibility'], 'column-visibility');
  if (flags['column-readonly']) payload.columnReadonly = parseJsonFlag(flags['column-readonly'], 'column-readonly');
  return payload;
}

function parseBooleanFlag(value: string | undefined, fieldName: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${fieldName} 必须是 true 或 false`);
}

function parseJsonFlag(value: string, fieldName: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${fieldName} 必须是合法 JSON`);
  }
}
