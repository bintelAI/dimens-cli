import { type ReactNode, useState } from 'react';
import { SquareMousePointer, Database, Loader2, RefreshCw } from 'lucide-react';
import KeyValueGrid from '@/components/common/KeyValueGrid';
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useMicroModuleRuntime } from '@/runtime/useMicroModuleRuntime';

export default function ButtonContextPage() {
  const dimens = useDimens();
  const { context, getCurrentRowId, getCurrentSheetId, getCurrentViewId } = useMicroModuleRuntime();
  const [rowDetail, setRowDetail] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const sheetId = getCurrentSheetId();
  const viewId = getCurrentViewId();
  const rowId = getCurrentRowId();
  const rowSnapshot = context.actionSnapshot?.rowSnapshot;
  const canRead = context.permissions.canReadData !== false;

  async function reloadRow() {
    if (!sheetId || !rowId || !canRead) return;
    setLoading(true);
    setError(undefined);
    try {
      const result = await dimens.row.info(sheetId, rowId);
      setRowDetail(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!sheetId || !rowId) {
    return (
      <StateView
        compact
        icon={<SquareMousePointer size={24} />}
        title="当前上下文缺少按钮行信息"
        description="按钮微模块需要宿主传入 sheetId、rowId 和 actionSnapshot。"
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="app-card flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="app-eyebrow">
            <SquareMousePointer size={15} />
            Button Runtime
          </div>
          <h1 className="app-title mt-2">按钮微模块示例</h1>
          <p className="app-muted mt-2">
            当前页展示按钮点击时的行快照，并提供按 rowId 重新读取当前行的 SDK 示例。
          </p>
        </div>
        <button
          type="button"
          onClick={reloadRow}
          disabled={loading || !canRead}
          className="app-button-primary"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          SDK 读取当前行
        </button>
      </section>

      <KeyValueGrid
        items={[
          { label: 'sourceLocation', value: context.sourceLocation },
          { label: 'sheetId', value: sheetId },
          { label: 'viewId', value: viewId },
          { label: 'rowId', value: rowId },
          { label: 'columnId', value: context.columnId || context.actionSnapshot?.columnId },
          { label: 'recordIds', value: context.actionSnapshot?.recordIds },
        ]}
      />

      {error ? <div className="app-alert-error">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <DataPanel
          icon={<SquareMousePointer size={16} />}
          title="按钮点击快照"
          value={context.actionSnapshot || { rowSnapshot }}
        />
        <DataPanel
          icon={<Database size={16} />}
          title="SDK 行详情"
          value={rowDetail || (loading ? '正在读取...' : '尚未拉取')}
        />
      </section>
    </div>
  );
}

function DataPanel({ icon, title, value }: { icon: ReactNode; title: string; value: unknown }) {
  return (
    <section className="app-card">
      <div className="app-eyebrow">
        {icon}
        {title}
      </div>
      <pre className="app-code-panel mt-4 min-h-80">
        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}
