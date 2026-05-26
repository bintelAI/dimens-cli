import { type ReactNode, useMemo, useState } from 'react';
import { Database, Loader2, RefreshCw, TableProperties } from 'lucide-react';
import KeyValueGrid from '@/components/common/KeyValueGrid';
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useMicroModuleRuntime } from '@/runtime/useMicroModuleRuntime';

export default function ViewContextPage() {
  const dimens = useDimens();
  const { context, getCurrentSheetId, getCurrentViewId } = useMicroModuleRuntime();
  const [remoteRows, setRemoteRows] = useState<unknown>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const sheetId = getCurrentSheetId();
  const viewId = getCurrentViewId();
  const snapshotRows = context.viewState?.displayRows || [];
  const rowCount = useMemo(() => snapshotRows.length, [snapshotRows]);
  const canRead = context.permissions.canReadData !== false;

  async function reloadRows() {
    if (!sheetId || !canRead) return;
    setLoading(true);
    setError(undefined);
    try {
      const result = await dimens.row.page(sheetId, {
        page: 1,
        size: 50,
        viewId,
        filters: context.viewState?.filters || [],
        sorter: context.viewState?.sortRule || undefined,
      });
      setRemoteRows(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!sheetId) {
    return (
      <StateView
        compact
        icon={<TableProperties size={24} />}
        title="当前上下文缺少 sheetId"
        description="视图微模块需要宿主传入 sheetId、viewId 和 viewState。"
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="app-card flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="app-eyebrow">
            <TableProperties size={15} />
            View Runtime
          </div>
          <h1 className="app-title mt-2">视图微模块示例</h1>
          <p className="app-muted mt-2">
            优先使用宿主传入的 displayRows 快照；需要最新数据时再通过 SDK 按 sheetId/viewId 拉取。
          </p>
        </div>
        <button
          type="button"
          onClick={reloadRows}
          disabled={loading || !canRead}
          className="app-button-primary"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          SDK 重新拉取
        </button>
      </section>

      <KeyValueGrid
        items={[
          { label: 'sourceLocation', value: context.sourceLocation },
          { label: 'sheetId', value: sheetId },
          { label: 'viewId', value: viewId },
          { label: 'snapshotRows', value: rowCount },
          { label: 'displayState', value: context.viewState?.displayState },
          { label: 'permissions', value: context.permissions },
        ]}
      />

      {error ? <div className="app-alert-error">{error}</div> : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <DataPanel
          icon={<TableProperties size={16} />}
          title="宿主视图快照"
          value={context.viewState || { message: '宿主未传入 viewState' }}
        />
        <DataPanel
          icon={<Database size={16} />}
          title="SDK 拉取结果"
          value={remoteRows || (loading ? '正在读取...' : '尚未拉取')}
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
