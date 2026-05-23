import { useState } from 'react';
import { Database, Loader2, RefreshCw } from 'lucide-react';
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function RecordsPage() {
  const dimens = useDimens();
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<unknown>();

  const sheetId = context.sheetId || appConfig?.defaultSheetId || '';
  const canRead = context.permissions.canReadData !== false;

  async function loadRows() {
    if (!sheetId || !canRead) return;
    setLoading(true);
    setError(undefined);
    try {
      const rows = await dimens.row.page(sheetId, { page: 1, size: 50 });
      setResult(rows.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!sheetId) {
    return (
      <StateView
        icon={<Database size={24} />}
        title="缺少 sheetId"
        description="请通过 Wujie props、URL、应用配置或设置页提供默认 sheetId。"
      />
    );
  }

  if (!canRead) {
    return (
      <StateView
        icon={<Database size={24} />}
        title="当前上下文不可读取数据"
        description="permissions.canReadData 为 false，模板不会发起行数据请求。"
      />
    );
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 border border-ink-900/10 bg-white p-5 shadow-panel md:flex-row md:items-center">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-copper-500">Rows</div>
          <h1 className="mt-2 text-2xl font-semibold">行数据示例</h1>
          <p className="mt-2 text-sm text-ink-700">sheetId: <span className="font-mono">{sheetId}</span></p>
        </div>
        <button
          type="button"
          onClick={loadRows}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 border border-ink-950 bg-ink-950 px-4 text-sm font-medium text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          读取行数据
        </button>
      </section>

      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <pre className="min-h-[420px] overflow-auto border border-ink-900/10 bg-ink-950 p-5 text-xs leading-6 text-moss-100">
        {result ? JSON.stringify(result, null, 2) : '点击“读取行数据”后会展示接口返回。'}
      </pre>
    </div>
  );
}
