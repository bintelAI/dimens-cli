import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecordsPage from './RecordsPage';
import { DEFAULT_APP_CONFIG } from '@/config/appConfig';
import { useRuntimeStore } from '@/store/runtimeStore';
import { DEFAULT_PERMISSIONS } from '@/types/micro-module';

const sheetList = vi.fn();
const sheetTree = vi.fn();
const rowPage = vi.fn();

vi.mock('@/lib/dimens/useDimens', () => ({
  useDimens: () => ({
    sheet: { list: sheetList, tree: sheetTree },
    row: { page: rowPage },
  }),
}));

describe('RecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRuntimeStore.setState({
      status: 'ready',
      context: {
        baseUrl: '/api',
        teamId: 'team_1',
        projectId: 'project_1',
        token: 'token_1',
        instanceId: 'dev-instance',
        moduleCode: 'dimens-web',
        sourceLocation: 'PROJECT_MENU',
        instanceConfig: {},
        permissions: DEFAULT_PERMISSIONS,
        source: 'local',
        isWujie: false,
      },
      appConfig: DEFAULT_APP_CONFIG,
      auth: { source: 'local-dev', token: 'token_1' },
      missing: [],
    });
    sheetTree.mockResolvedValue({
      data: [
        {
          sheetId: 'folder_1',
          name: '业务菜单',
          type: 'folder',
          children: [
            { sheetId: 'sheet_1', name: '客户表', type: 'sheet' },
            { sheetId: 'sheet_2', name: '订单表', type: 'sheet' },
          ],
        },
      ],
    });
    sheetList.mockResolvedValue({ data: [] });
    rowPage.mockResolvedValue({ data: { rows: [{ id: 1, name: '订单 A' }] } });
  });

  it('loads sheets and reads rows from the selected sheet', async () => {
    render(<RecordsPage />);

    const select = await screen.findByLabelText('选择数据表');
    expect(sheetTree).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(select).toHaveValue('sheet_1');
    });

    fireEvent.change(select, { target: { value: 'sheet_2' } });
    fireEvent.click(screen.getByRole('button', { name: /读取行数据/ }));

    await waitFor(() => {
      expect(rowPage).toHaveBeenCalledWith('sheet_2', { page: 1, size: 50 });
    });
    expect(await screen.findByText(/订单 A/)).toBeInTheDocument();
  });

  it('falls back to the first listed sheet when injected sheetId is not a data sheet', async () => {
    useRuntimeStore.setState(state => ({
      ...state,
      context: {
        ...state.context,
        sheetId: 'external_page_1',
      },
    }));

    render(<RecordsPage />);

    const select = await screen.findByLabelText('选择数据表');

    await waitFor(() => {
      expect(select).toHaveValue('sheet_1');
    });
  });

  it('automatically reloads rows after selecting another sheet', async () => {
    render(<RecordsPage />);

    const select = await screen.findByLabelText('选择数据表');
    await waitFor(() => {
      expect(select).toHaveValue('sheet_1');
    });

    fireEvent.change(select, { target: { value: 'sheet_2' } });

    await waitFor(() => {
      expect(rowPage).toHaveBeenCalledWith('sheet_2', { page: 1, size: 50 });
    });
  });

  it('falls back to sheet list when menu tree loading fails', async () => {
    sheetTree.mockRejectedValue(new Error('tree failed'));
    sheetList.mockResolvedValue({
      data: [
        { sheetId: 'sheet_3', name: '回退表', type: 'sheet' },
      ],
    });

    render(<RecordsPage />);

    const select = await screen.findByLabelText('选择数据表');

    await waitFor(() => {
      expect(select).toHaveValue('sheet_3');
    });
    expect(sheetList).toHaveBeenCalledTimes(1);
  });

  it('keeps the read button enabled after sheets load in React strict mode', async () => {
    render(
      <StrictMode>
        <RecordsPage />
      </StrictMode>
    );

    const select = await screen.findByLabelText('选择数据表');
    await waitFor(() => {
      expect(select).toHaveValue('sheet_1');
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /读取行数据/ })).toBeEnabled();
    });
  });
});
