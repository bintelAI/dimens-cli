import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { RowPolicySDK, type RowPolicyCondition } from '../../sdk/row-policy';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
} from '../utils';

export function registerRowPolicyCommands(): void {
  createCommandGroup('row-policy', '行策略权限');

  registerGroupCommand(
    'row-policy',
    createCommand('list', '获取行策略列表', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
        const sdk = new RowPolicySDK(createClient(context));
        const result = await sdk.list(projectId, sheetId);
        printSuccess(context, '行策略列表获取成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row-policy',
    createCommand('create', '创建行策略', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
        const name = requireFlag(flags.name, 'name');
        const effect = requireFlag(flags.effect, 'effect');
        const actions = parseCsvFlag(requireFlag(flags.actions, 'actions'), 'actions');
        const conditions = parseJsonArrayFlag(
          requireFlag(flags.conditions, 'conditions'),
          'conditions'
        );
        const sdk = new RowPolicySDK(createClient(context));
        const result = await sdk.create(projectId, {
          sheetId,
          ...(flags['role-id'] ? { roleId: flags['role-id'] } : {}),
          name,
          effect,
          actions,
          conditions,
          ...(flags.priority ? { priority: Number(flags.priority) } : {}),
          ...(flags['match-type'] ? { conditionMatchType: flags['match-type'] } : {}),
          ...(flags.active ? { isActive: parseBooleanFlag(flags.active, 'active') } : {}),
        });
        printSuccess(context, '行策略创建成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row-policy',
    createCommand('update', '更新行策略', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const id = requireFlag(flags.id, 'id');
        const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
        const data: Record<string, unknown> = {};
        if (flags['role-id']) data.roleId = flags['role-id'];
        if (flags.name) data.name = flags.name;
        if (flags.effect) data.effect = flags.effect;
        if (flags.actions) data.actions = parseCsvFlag(flags.actions, 'actions');
        if (flags.conditions) data.conditions = parseJsonArrayFlag(flags.conditions, 'conditions');
        if (flags.priority) data.priority = Number(flags.priority);
        if (flags['match-type']) data.conditionMatchType = flags['match-type'];
        if (flags.active) data.isActive = parseBooleanFlag(flags.active, 'active');

        const sdk = new RowPolicySDK(createClient(context));
        const result = await sdk.update(projectId, { id, sheetId, data });
        printSuccess(context, '行策略更新成功', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row-policy',
    createCommand('delete', '删除行策略', async args => {
      const flags = parseFlags(args);
      const context = getContext(flags);

      try {
        const projectId = requireProjectId(context, flags);
        const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
        const ids = parseCsvFlag(flags.ids || args.join(','), 'ids');
        const sdk = new RowPolicySDK(createClient(context));
        const result = await sdk.delete(projectId, ids, sheetId);
        printSuccess(context, '行策略删除完成', result.data);
      } catch (error) {
        printError(context, error);
      }
    })
  );

  registerGroupCommand(
    'row-policy',
    createCommand('enable', '启用行策略', async args => {
      await togglePolicy(args, true);
    })
  );

  registerGroupCommand(
    'row-policy',
    createCommand('disable', '禁用行策略', async args => {
      await togglePolicy(args, false);
    })
  );
}

async function togglePolicy(args: string[], isActive: boolean): Promise<void> {
  const flags = parseFlags(args);
  const context = getContext(flags);

  try {
    const projectId = requireProjectId(context, flags);
    const id = requireFlag(flags.id, 'id');
    const sheetId = requireFlag(flags['sheet-id'], 'sheet-id');
    const sdk = new RowPolicySDK(createClient(context));
    const result = await sdk.toggle(projectId, { id, isActive, sheetId });
    printSuccess(context, isActive ? '行策略已启用' : '行策略已禁用', result.data);
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

function parseCsvFlag(value: string, fieldName: string): string[] {
  const result = value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
  if (result.length === 0) {
    throw new Error(`${fieldName} 至少需要一个值`);
  }
  return result;
}

function parseJsonArrayFlag(value: string, fieldName: string): RowPolicyCondition[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error('');
    }
    return parsed as RowPolicyCondition[];
  } catch {
    throw new Error(`${fieldName} 必须是合法 JSON 数组`);
  }
}

function parseBooleanFlag(value: string, fieldName: string): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${fieldName} 必须是 true 或 false`);
}
