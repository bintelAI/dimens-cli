import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { RowAclSDK } from '../../sdk/row-acl';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
} from '../utils';

export function registerRowAclCommands(): void {
  createCommandGroup('row-acl', '单行 ACL 权限');

  registerGroupCommand(
    'row-acl',
    createCommand('list', '获取单行 ACL 列表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
        const rowId = requireFlag(flags['row-id'], 'row-id');
        const sdk = new RowAclSDK(createClient(context));
        const result = await sdk.list(sheetId, rowId);
        printSuccess(context, '单行 ACL 列表获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row-acl',
    createCommand('grant-user', '给用户授予单行权限', async args => {
      await grantAccess(args, 'user');
    })
  );

  registerGroupCommand(
    'row-acl',
    createCommand('grant-role', '给角色授予单行权限', async args => {
      await grantAccess(args, 'role');
    })
  );

  registerGroupCommand(
    'row-acl',
    createCommand('grant-dept', '给部门授予单行权限', async args => {
      await grantAccess(args, 'dept');
    })
  );

  registerGroupCommand(
    'row-acl',
    createCommand('revoke-role', '移除角色单行权限', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
        const rowId = requireFlag(flags['row-id'], 'row-id');
        const roleId = requireFlag(flags['role-id'], 'role-id');
        const sdk = new RowAclSDK(createClient(context));
        const result = await sdk.revokeRole(sheetId, rowId, roleId);
        printSuccess(context, '角色单行权限移除成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );
}

async function grantAccess(args: string[], targetType: 'user' | 'role' | 'dept'): Promise<void> {
  const flags = parseFlags(args);
  const context = getContext(flags);

  try {
    const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
    const rowId = requireFlag(flags['row-id'], 'row-id');
    const permission = requireFlag(flags.permission, 'permission');
    const sdk = new RowAclSDK(createClient(context));

    const target =
      targetType === 'user'
        ? { userId: parseNumberFlag(flags['user-id'], 'user-id') }
        : targetType === 'role'
        ? { roleId: requireFlag(flags['role-id'], 'role-id') }
        : { deptId: parseNumberFlag(flags['dept-id'], 'dept-id') };

    const result = await sdk.grant(sheetId, {
      rowId,
      target,
      permission,
      ...(flags['expires-at'] ? { expiresAt: flags['expires-at'] } : {}),
      ...(flags['can-transfer'] ? { canTransfer: parseBooleanFlag(flags['can-transfer'], 'can-transfer') } : {}),
    });
    printSuccess(context, '单行权限授予成功', result.data);
  } catch (error) {
    printError(context, error);
  }
}

function requireFlag(value: string | undefined, fieldName: string): string {
  if (!value) {
    throw new Error(`缺少 ${fieldName}，请传入 --${fieldName}`);
  }
  return value;
}

function parseNumberFlag(value: string | undefined, fieldName: string): number {
  const parsed = Number(value || '');
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} 必须是数字`);
  }
  return parsed;
}

function parseBooleanFlag(value: string, fieldName: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${fieldName} 必须是 true 或 false`);
}
