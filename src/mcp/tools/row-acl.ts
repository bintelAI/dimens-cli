import { z } from 'zod';
import { requireMcpSheetId } from '../context';
import type { RowAclTarget } from '../../sdk/row-acl';
import {
  contextSchema,
  createSimpleTool,
  numberArg,
  readOnlyAnnotations,
  requireConfirm,
  stringArg,
  writeAnnotations,
} from './common';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

function targetArg(args: Record<string, unknown>): RowAclTarget {
  const target: RowAclTarget = {};
  const userId = numberArg(args.userId, Number.NaN);
  if (Number.isFinite(userId)) target.userId = userId;
  const deptId = numberArg(args.deptId, Number.NaN);
  if (Number.isFinite(deptId)) target.deptId = deptId;
  const roleId = stringArg(args.targetRoleId);
  if (roleId) target.roleId = roleId;
  return target;
}

export function createRowAclTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_row_acl_list',
      title: '获取行 ACL 列表',
      description: '获取指定行的访问控制列表。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const rowId = stringArg(args.rowId);
        if (!rowId) throw new Error('缺少 rowId');
        const result = await toolContext.createSDK(context).rowAcl.list(sheetId, rowId);
        return { message: '行 ACL 列表获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_acl_role_acls',
      title: '获取角色行 ACL',
      description: '获取指定角色在指定维表中的行访问控制列表。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        roleId: z.string(),
      },
      annotations: readOnlyAnnotations,
      async run(args) {
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const roleId = stringArg(args.roleId);
        if (!roleId) throw new Error('缺少 roleId');
        const result = await toolContext.createSDK(context).rowAcl.roleAcls(sheetId, roleId);
        return { message: '角色行 ACL 获取成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_acl_grant',
      title: '授予行权限',
      description: '授予用户/部门/角色对指定行的访问权限；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
        userId: z.number().optional(),
        deptId: z.number().optional(),
        targetRoleId: z.string().optional(),
        permission: z.string(),
        expiresAt: z.string().optional(),
        canTransfer: z.boolean().optional(),
        confirm: z.boolean().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        requireConfirm(args, '授予行权限');
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const rowId = stringArg(args.rowId);
        if (!rowId) throw new Error('缺少 rowId');
        const target = targetArg(args);
        if (Object.keys(target).length === 0) throw new Error('缺少 target，请传入 userId/deptId/targetRoleId 之一');
        const permission = stringArg(args.permission);
        if (!permission) throw new Error('缺少 permission');
        const payload: Record<string, unknown> = { rowId, target, permission };
        const expiresAt = stringArg(args.expiresAt);
        if (expiresAt) payload.expiresAt = expiresAt;
        if (typeof args.canTransfer === 'boolean') payload.canTransfer = args.canTransfer;
        const result = await toolContext.createSDK(context).rowAcl.grant(sheetId, payload as any);
        return { message: '行权限授予成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_acl_revoke',
      title: '撤销行权限',
      description: '撤销用户/部门/角色对指定行的访问权限；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
        userId: z.number().optional(),
        deptId: z.number().optional(),
        targetRoleId: z.string().optional(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '撤销行权限');
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const rowId = stringArg(args.rowId);
        if (!rowId) throw new Error('缺少 rowId');
        const target = targetArg(args);
        if (Object.keys(target).length === 0) throw new Error('缺少 target');
        const result = await toolContext.createSDK(context).rowAcl.revoke(sheetId, rowId, target);
        return { message: '行权限撤销成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_acl_revoke_dept',
      title: '撤销部门行权限',
      description: '撤销指定部门对某行的访问权限；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
        deptId: z.number(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '撤销部门行权限');
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const rowId = stringArg(args.rowId);
        if (!rowId) throw new Error('缺少 rowId');
        const deptId = numberArg(args.deptId, Number.NaN);
        if (!Number.isFinite(deptId)) throw new Error('缺少 deptId');
        const result = await toolContext.createSDK(context).rowAcl.revokeDept(sheetId, rowId, deptId);
        return { message: '部门行权限撤销成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_row_acl_revoke_role',
      title: '撤销角色行权限',
      description: '撤销指定角色对某行的访问权限；必须传入 confirm: true。',
      inputSchema: {
        ...contextSchema,
        sheetId: z.string(),
        rowId: z.string(),
        roleId: z.string(),
        confirm: z.boolean().optional(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
      async run(args) {
        requireConfirm(args, '撤销角色行权限');
        const context = toolContext.getContext(args);
        const sheetId = requireMcpSheetId({ sheetId: stringArg(args.sheetId) });
        const rowId = stringArg(args.rowId);
        if (!rowId) throw new Error('缺少 rowId');
        const roleId = stringArg(args.roleId);
        if (!roleId) throw new Error('缺少 roleId');
        const result = await toolContext.createSDK(context).rowAcl.revokeRole(sheetId, rowId, roleId);
        return { message: '角色行权限撤销成功', data: result.data };
      },
    }),
  ];
}