import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCommands, getCommandGroup } from '../../src/commands/registry';

vi.mock('../../src/core/config', () => {
  const store = {
    version: '1.0.0',
    profile: {
      baseUrl: 'https://api.example.com',
      token: 'token-1',
      teamId: 'TEAM1',
      projectId: 'PROJ1',
      output: 'table',
    },
    skills: {},
    preferences: {},
  };

  return {
    config: {
      load: vi.fn(async () => undefined),
      save: vi.fn(async () => undefined),
      get: vi.fn((key: keyof typeof store) => store[key]),
      set: vi.fn((key: keyof typeof store, value: unknown) => {
        (store as Record<string, unknown>)[key] = value;
      }),
      getAll: vi.fn(() => store),
    },
  };
});

const roleSdkSpies = {
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { roleId: 'role_1' } })),
  assignUser: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 1 } })),
};

vi.mock('../../src/sdk/role', () => {
  return {
    RoleSDK: class {
      async list() {
        return { code: 1000, message: 'success', data: [{ roleId: 'role_1', name: '班主任' }] };
      }
      async create(...args: unknown[]) {
        return roleSdkSpies.create(...args);
      }
      async assignUser(...args: unknown[]) {
        return roleSdkSpies.assignUser(...args);
      }
    },
  };
});

const permissionSdkSpies = {
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 1 } })),
  update: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 1 } })),
  list: vi.fn(async () => ({ code: 1000, message: 'success', data: [] })),
  updateResourcePermission: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 1 } })),
};

vi.mock('../../src/sdk/permission', () => {
  return {
    PermissionSDK: class {
      async list(...args: unknown[]) {
        return permissionSdkSpies.list(...args);
      }
      async create(...args: unknown[]) {
        return permissionSdkSpies.create(...args);
      }
      async update(...args: unknown[]) {
        return permissionSdkSpies.update(...args);
      }
      async updateResourcePermission(...args: unknown[]) {
        return permissionSdkSpies.updateResourcePermission(...args);
      }
    },
  };
});

const rowPolicySdkSpies = {
  create: vi.fn(async () => ({ code: 1000, message: 'success', data: { policyId: 'policy_1' } })),
  toggle: vi.fn(async () => ({ code: 1000, message: 'success', data: { policyId: 'policy_1' } })),
  check: vi.fn(async () => ({ code: 1000, message: 'success', data: { allowed: true } })),
};

vi.mock('../../src/sdk/row-policy', () => {
  return {
    RowPolicySDK: class {
      async list() {
        return { code: 1000, message: 'success', data: [] };
      }
      async create(...args: unknown[]) {
        return rowPolicySdkSpies.create(...args);
      }
      async toggle(...args: unknown[]) {
        return rowPolicySdkSpies.toggle(...args);
      }
      async check(...args: unknown[]) {
        return rowPolicySdkSpies.check(...args);
      }
    },
  };
});

const rowAclSdkSpies = {
  grant: vi.fn(async () => ({ code: 1000, message: 'success', data: { id: 1 } })),
  revokeRole: vi.fn(async () => ({ code: 1000, message: 'success', data: { success: true } })),
};

vi.mock('../../src/sdk/row-acl', () => {
  return {
    RowAclSDK: class {
      async list() {
        return { code: 1000, message: 'success', data: [] };
      }
      async grant(...args: unknown[]) {
        return rowAclSdkSpies.grant(...args);
      }
      async revokeRole(...args: unknown[]) {
        return rowAclSdkSpies.revokeRole(...args);
      }
    },
  };
});

describe('Permission Domain Commands', () => {
  beforeEach(() => {
    clearCommands();
    vi.clearAllMocks();
    roleSdkSpies.create.mockClear();
    roleSdkSpies.assignUser.mockClear();
    permissionSdkSpies.create.mockClear();
    permissionSdkSpies.update.mockClear();
    permissionSdkSpies.list.mockClear();
    permissionSdkSpies.updateResourcePermission.mockClear();
    rowPolicySdkSpies.create.mockClear();
    rowPolicySdkSpies.toggle.mockClear();
    rowPolicySdkSpies.check.mockClear();
    rowAclSdkSpies.grant.mockClear();
    rowAclSdkSpies.revokeRole.mockClear();
  });

  it('should execute role create command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('role')?.commands.find(item => item.name === 'create');
    await command?.handler([
      '--name',
      '班主任',
      '--description',
      '班级管理角色',
      '--can-manage-sheets',
      'false',
      '--can-edit-schema',
      'false',
      '--can-edit-data',
      'true',
    ]);

    expect(roleSdkSpies.create).toHaveBeenCalledWith('PROJ1', {
      name: '班主任',
      description: '班级管理角色',
      canManageSheets: false,
      canEditSchema: false,
      canEditData: true,
    });
    logSpy.mockRestore();
  });

  it('should execute role create command with projectId parsed from --app-url', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('role')?.commands.find(item => item.name === 'create');
    await command?.handler([
      '--app-url',
      'https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
      '--name',
      '销售',
      '--description',
      'CRM 销售角色',
      '--can-manage-sheets',
      'false',
      '--can-edit-schema',
      'false',
      '--can-edit-data',
      'true',
    ]);

    expect(roleSdkSpies.create).toHaveBeenCalledWith('PXWXBJQ', {
      name: '销售',
      description: 'CRM 销售角色',
      canManageSheets: false,
      canEditSchema: false,
      canEditData: true,
    });
    logSpy.mockRestore();
  });

  it('should execute role assign-user command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('role')?.commands.find(
      item => item.name === 'assign-user'
    );
    await command?.handler([
      '--role-id',
      'role_teacher',
      '--user-id',
      '1001',
      '--sheet-id',
      'sh_1',
    ]);

    expect(roleSdkSpies.assignUser).toHaveBeenCalledWith('PROJ1', {
      roleId: 'role_teacher',
      userId: 1001,
      sheetId: 'sh_1',
    });
    logSpy.mockRestore();
  });

  it('should execute permission create command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('permission')?.commands.find(
      item => item.name === 'create'
    );
    await command?.handler([
      '--role-id',
      'role_teacher',
      '--sheet-id',
      'sh_1',
      '--data-access',
      'private_rw',
      '--can-read',
      'true',
      '--can-write',
      'true',
      '--column-visibility',
      '{"fld_name":true}',
    ]);

    expect(permissionSdkSpies.create).toHaveBeenCalledWith('PROJ1', {
      roleId: 'role_teacher',
      sheetId: 'sh_1',
      dataAccess: 'private_rw',
      canRead: true,
      canWrite: true,
      columnVisibility: {
        fld_name: true,
      },
    });
    logSpy.mockRestore();
  });

  it('should execute permission create command with projectId parsed from --app-url', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('permission')?.commands.find(
      item => item.name === 'create'
    );
    await command?.handler([
      '--app-url',
      'https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
      '--role-id',
      'role_sales',
      '--sheet-id',
      'sh_customer',
      '--data-access',
      'private_rw',
      '--can-read',
      'true',
      '--can-write',
      'true',
      '--column-visibility',
      '{"fld_name":true,"fld_level":true}',
    ]);

    expect(permissionSdkSpies.create).toHaveBeenCalledWith('PXWXBJQ', {
      roleId: 'role_sales',
      sheetId: 'sh_customer',
      dataAccess: 'private_rw',
      canRead: true,
      canWrite: true,
      columnVisibility: {
        fld_name: true,
        fld_level: true,
      },
    });
    logSpy.mockRestore();
  });

  it('should execute permission set-resource command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('permission')?.commands.find(
      item => item.name === 'set-resource'
    );
    await command?.handler([
      '--role-id',
      'role_teacher',
      '--resource-id',
      'doc_1',
      '--resource-type',
      'document',
      '--visible',
      'true',
      '--editable',
      'false',
    ]);

    expect(permissionSdkSpies.updateResourcePermission).toHaveBeenCalledWith('PROJ1', {
      roleId: 'role_teacher',
      resourceId: 'doc_1',
      resourceType: 'document',
      permission: {
        visible: true,
        editable: false,
      },
    });
    logSpy.mockRestore();
  });

  it('should execute row-policy create command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('row-policy')?.commands.find(
      item => item.name === 'create'
    );
    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--role-id',
      'role_teacher',
      '--name',
      '仅查看自己',
      '--effect',
      'allow',
      '--actions',
      'view,edit',
      '--conditions',
      '[{"columnId":"createdBy","operator":"equals","value":"{{currentUser}}"}]',
      '--priority',
      '10',
      '--match-type',
      'and',
      '--active',
      'true',
    ]);

    expect(rowPolicySdkSpies.create).toHaveBeenCalledWith('PROJ1', {
      sheetId: 'sh_1',
      roleId: 'role_teacher',
      name: '仅查看自己',
      effect: 'allow',
      actions: ['view', 'edit'],
      conditions: [
        {
          columnId: 'createdBy',
          operator: 'equals',
          value: '{{currentUser}}',
        },
      ],
      priority: 10,
      conditionMatchType: 'and',
      isActive: true,
    });
    logSpy.mockRestore();
  });

  it('should execute row-policy create command with projectId parsed from --app-url', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('row-policy')?.commands.find(
      item => item.name === 'create'
    );
    await command?.handler([
      '--app-url',
      'https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/',
      '--sheet-id',
      'sh_class',
      '--role-id',
      'role_sales',
      '--name',
      '仅查看自己',
      '--effect',
      'allow',
      '--actions',
      'view',
      '--conditions',
      '[{"columnId":"createdBy","operator":"equals","value":"{{currentUser}}"}]',
      '--priority',
      '10',
      '--match-type',
      'and',
      '--active',
      'true',
    ]);

    expect(rowPolicySdkSpies.create).toHaveBeenCalledWith('PXWXBJQ', {
      sheetId: 'sh_class',
      roleId: 'role_sales',
      name: '仅查看自己',
      effect: 'allow',
      actions: ['view'],
      conditions: [
        {
          columnId: 'createdBy',
          operator: 'equals',
          value: '{{currentUser}}',
        },
      ],
      priority: 10,
      conditionMatchType: 'and',
      isActive: true,
    });
    logSpy.mockRestore();
  });

  it('should execute row-policy enable command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('row-policy')?.commands.find(
      item => item.name === 'enable'
    );
    await command?.handler(['--id', 'policy_1', '--sheet-id', 'sh_1']);

    expect(rowPolicySdkSpies.toggle).toHaveBeenCalledWith('PROJ1', {
      id: 'policy_1',
      isActive: true,
      sheetId: 'sh_1',
    });
    logSpy.mockRestore();
  });

  it('should execute row-acl grant-user command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('row-acl')?.commands.find(
      item => item.name === 'grant-user'
    );
    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--user-id',
      '1001',
      '--permission',
      'view',
      '--can-transfer',
      'false',
    ]);

    expect(rowAclSdkSpies.grant).toHaveBeenCalledWith('sh_1', {
      rowId: 'row_1',
      target: {
        userId: 1001,
      },
      permission: 'view',
      canTransfer: false,
    });
    logSpy.mockRestore();
  });

  it('should execute row-acl revoke-role command', async () => {
    const { registerCommands } = await import('../../src/commands');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    registerCommands();
    const command = getCommandGroup('row-acl')?.commands.find(
      item => item.name === 'revoke-role'
    );
    await command?.handler([
      '--sheet-id',
      'sh_1',
      '--row-id',
      'row_1',
      '--role-id',
      'role_teacher',
    ]);

    expect(rowAclSdkSpies.revokeRole).toHaveBeenCalledWith(
      'sh_1',
      'row_1',
      'role_teacher'
    );
    logSpy.mockRestore();
  });
});
