import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { RoleSDK } from '../../src/sdk/role';

describe('RoleSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request role list by project', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ roleId: 'role_1', name: '自定义角色' }],
      }),
    });

    const sdk = new RoleSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.list('PROJ1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/role/list',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request role create payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { roleId: 'role_1', name: '班主任' },
      }),
    });

    const sdk = new RoleSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.create('PROJ1', {
      name: '班主任',
      description: '班级管理角色',
      canManageSheets: false,
      canEditSchema: false,
      canEditData: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/role/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: '班主任',
          description: '班级管理角色',
          canManageSheets: false,
          canEditSchema: false,
          canEditData: true,
        }),
      })
    );
  });

  it('should request assign user payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 1 },
      }),
    });

    const sdk = new RoleSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.assignUser('PROJ1', {
      roleId: 'role_teacher',
      userId: 1001,
      sheetId: 'sh_1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/role/assignUser',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          roleId: 'role_teacher',
          userId: 1001,
          sheetId: 'sh_1',
        }),
      })
    );
  });
});
