import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { PermissionSDK } from '../../src/sdk/permission';

describe('PermissionSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request permission list by project and sheet', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ id: 1, roleId: 'role_1', sheetId: 'sh_1' }],
      }),
    });

    const sdk = new PermissionSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.list('PROJ1', 'sh_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/permission/list?sheetId=sh_1',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request permission create payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 1 },
      }),
    });

    const sdk = new PermissionSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.create('PROJ1', {
      roleId: 'role_1',
      sheetId: 'sh_1',
      dataAccess: 'private_rw',
      canRead: true,
      canWrite: true,
      columnVisibility: {
        fld_name: true,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/permission/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          roleId: 'role_1',
          sheetId: 'sh_1',
          dataAccess: 'private_rw',
          canRead: true,
          canWrite: true,
          columnVisibility: {
            fld_name: true,
          },
        }),
      })
    );
  });

  it('should request update resource permission payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 1 },
      }),
    });

    const sdk = new PermissionSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.updateResourcePermission('PROJ1', {
      roleId: 'role_1',
      resourceId: 'doc_1',
      resourceType: 'document',
      permission: {
        visible: true,
        editable: false,
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/permission/updateResourcePermission',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          roleId: 'role_1',
          resourceId: 'doc_1',
          resourceType: 'document',
          permission: {
            visible: true,
            editable: false,
          },
        }),
      })
    );
  });
});
