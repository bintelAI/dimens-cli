import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { RowAclSDK } from '../../src/sdk/row-acl';

describe('RowAclSDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request grant user access payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { id: 1 },
      }),
    });

    const sdk = new RowAclSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.grant('sh_1', {
      rowId: 'row_1',
      target: {
        userId: 1001,
      },
      permission: 'view',
      canTransfer: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/rowAcl/grant',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          sheetId: 'sh_1',
          rowId: 'row_1',
          target: {
            userId: 1001,
          },
          permission: 'view',
          canTransfer: false,
        }),
      })
    );
  });

  it('should request row acl list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ id: 1, rowId: 'row_1', permission: 'view' }],
      }),
    });

    const sdk = new RowAclSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.list('sh_1', 'row_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/rowAcl/list?sheetId=sh_1&rowId=row_1',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request revoke role payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { success: true, count: 1 },
      }),
    });

    const sdk = new RowAclSDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.revokeRole('sh_1', 'row_1', 'role_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/rowAcl/revokeRoleAccess',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          sheetId: 'sh_1',
          rowId: 'row_1',
          roleId: 'role_1',
        }),
      })
    );
  });
});
