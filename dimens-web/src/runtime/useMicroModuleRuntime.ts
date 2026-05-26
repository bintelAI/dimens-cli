import { useMemo } from 'react';
import { useRuntimeStore } from '@/store/runtimeStore';

export function useMicroModuleRuntime() {
  const context = useRuntimeStore(state => state.context);

  return useMemo(() => {
    const isPageContext = context.sourceLocation === 'PROJECT_MENU';
    const isViewContext = context.sourceLocation === 'SHEET_VIEW';
    const isButtonContext = [
      'ROW_BUTTON_MODAL',
      'CELL_BUTTON_MODAL',
      'VIEW_TOOLBAR_MODAL',
    ].includes(context.sourceLocation);

    return {
      context,
      isPageContext,
      isViewContext,
      isButtonContext,
      getCurrentSheetId: () => context.sheetId || context.actionSnapshot?.sheetId,
      getCurrentViewId: () => context.viewId || context.viewState?.viewId || context.actionSnapshot?.viewId,
      getCurrentRowId: () => context.rowId || context.actionSnapshot?.rowId,
    };
  }, [context]);
}
