import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DimensClient } from '../../src/sdk/client';
import { RowPolicySDK } from '../../src/sdk/row-policy';

describe('RowPolicySDK', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should request row policy list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: [{ policyId: 'policy_1', name: '仅查看自己' }],
      }),
    });

    const sdk = new RowPolicySDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.list('PROJ1', 'sh_1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/row_policy/list?sheetId=sh_1',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('should request row policy create payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { policyId: 'policy_1' },
      }),
    });

    const sdk = new RowPolicySDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.create('PROJ1', {
      sheetId: 'sh_1',
      roleId: 'role_1',
      name: '仅查看自己',
      effect: 'allow',
      actions: ['view'],
      priority: 10,
      conditionMatchType: 'and',
      conditions: [
        {
          columnId: 'createdBy',
          operator: 'equals',
          value: '{{currentUser}}',
        },
      ],
      isActive: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/row_policy/add',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          sheetId: 'sh_1',
          roleId: 'role_1',
          name: '仅查看自己',
          effect: 'allow',
          actions: ['view'],
          priority: 10,
          conditionMatchType: 'and',
          conditions: [
            {
              columnId: 'createdBy',
              operator: 'equals',
              value: '{{currentUser}}',
            },
          ],
          isActive: true,
        }),
      })
    );
  });

  it('should request row policy toggle payload', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 1000,
        message: 'success',
        data: { policyId: 'policy_1', isActive: false },
      }),
    });

    const sdk = new RowPolicySDK(
      new DimensClient({
        baseUrl: 'https://api.example.com',
      })
    );

    await sdk.toggle('PROJ1', {
      id: 'policy_1',
      isActive: false,
      sheetId: 'sh_1',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/app/mul/project/PROJ1/row_policy/toggle',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          id: 'policy_1',
          isActive: false,
          sheetId: 'sh_1',
        }),
      })
    );
  });
});
