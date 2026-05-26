import { useEffect, useMemo, useState } from 'react';
import { Database, Loader2, RefreshCw, Table2 } from 'lucide-react';
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useRuntimeStore } from '@/store/runtimeStore';

interface SheetOption {
  id: string;
  name: string;
  type: string | undefined;
}

export default function RecordsPage() {
  const dimens = useDimens();
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);
  const initialSheetId = context.sheetId || appConfig?.defaultSheetId || '';
  const [sheets, setSheets] = useState<SheetOption[]>(() => initialSheetId
    ? [{ id: initialSheetId, name: initialSheetId, type: undefined }]
    : []
  );
  const [selectedSheetId, setSelectedSheetId] = useState(initialSheetId);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<unknown>();
  const [lastLoadedSheetId, setLastLoadedSheetId] = useState<string>();

  const canRead = context.permissions.canReadData !== false;
  const currentSheet = useMemo(
    () => sheets.find(sheet => sheet.id === selectedSheetId),
    [selectedSheetId, sheets]
  );

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    setSheetLoading(true);
    setError(undefined);
    loadSheetOptions()
      .then(nextSheets => {
        if (!active) return;
        setSheets(nextSheets);
        setSelectedSheetId(current => {
          if (current && nextSheets.some(sheet => sheet.id === current)) return current;
          return nextSheets[0]?.id || '';
        });
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setSheetLoading(false);
      });
    return () => {
      active = false;
    };
  }, [canRead, context.projectId, context.teamId]);

  async function loadSheetOptions() {
    try {
      const treeResponse = await dimens.sheet.tree();
      const treeSheets = normalizeSheets(treeResponse.data);
      if (treeSheets.length > 0) return treeSheets;
    } catch {
      // Fallback to flat list for older or restricted hosts.
    }
    const listResponse = await dimens.sheet.list();
    return normalizeSheets(listResponse.data);
  }

  async function loadRows() {
    if (!selectedSheetId || !canRead) return;
    await loadRowsBySheetId(selectedSheetId);
  }

  async function loadRowsBySheetId(sheetId: string) {
    if (!sheetId || !canRead) return;
    setLoading(true);
    setError(undefined);
    setLastLoadedSheetId(undefined);
    try {
      const rows = await dimens.row.page(sheetId, { page: 1, size: 50 });
      setResult(rows.data);
      setLastLoadedSheetId(sheetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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
      <section className="app-card flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="app-eyebrow">Rows</div>
          <h1 className="app-title mt-2">行数据示例</h1>
          <p className="app-muted mt-2">
            当前表：<span className="font-mono text-slate-950">{currentSheet?.name || selectedSheetId || '-'}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={loadRows}
          disabled={loading || sheetLoading || !selectedSheetId}
          className="app-button-primary"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          读取行数据
        </button>
      </section>

      <section className="app-card grid gap-4 lg:grid-cols-[280px_1fr]">
        <label>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <Table2 size={15} />
            选择数据表
          </span>
          <select
            className="app-input mt-2 h-10"
            value={selectedSheetId}
            onChange={event => {
              const nextSheetId = event.target.value;
              setSelectedSheetId(nextSheetId);
              setResult(undefined);
              setLastLoadedSheetId(undefined);
              void loadRowsBySheetId(nextSheetId);
            }}
            disabled={sheets.length === 0}
          >
            {sheets.map(sheet => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.name} / {sheet.id}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {sheetLoading ? '正在读取项目表列表...' : selectedSheetId ? (
            <>
              将读取 <span className="font-mono text-slate-950">{selectedSheetId}</span> 的前 50 行数据。
            </>
          ) : '当前项目未读取到可选择的数据表。'}
        </div>
      </section>

      {error ? (
        <div className="app-alert-error">{error}</div>
      ) : null}

      {loading || lastLoadedSheetId ? (
        <div className="app-alert-info">
          {loading ? '正在读取行数据...' : (
            <>
              已读取 <span className="font-mono text-slate-950">{lastLoadedSheetId}</span> 的行数据，
              返回 {readRowsCount(result)} 条记录。
            </>
          )}
        </div>
      ) : null}

      <pre className="app-code-panel min-h-[420px]">
        {result ? JSON.stringify(result, null, 2) : '点击“读取行数据”后会展示接口返回。'}
      </pre>
    </div>
  );
}

function normalizeSheets(data: unknown): SheetOption[] {
  const payload = (data as { data?: unknown })?.data || data;
  const rawList = flattenSheetPayload(payload);

  return rawList
    .map(item => {
      const record = item as Record<string, unknown>;
      const id = String(record.sheetId || record.id || '');
      if (!id) return undefined;
      return {
        id,
        name: String(record.name || record.title || id),
        type: record.type ? String(record.type) : undefined,
      };
    })
    .filter((item): item is SheetOption => Boolean(item));
}

function flattenSheetPayload(payload: unknown): unknown[] {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { list?: unknown[] })?.list)
      ? (payload as { list: unknown[] }).list
      : Array.isArray((payload as { records?: unknown[] })?.records)
        ? (payload as { records: unknown[] }).records
        : [];

  return rawList.flatMap(item => {
    const record = item as Record<string, unknown>;
    const children = Array.isArray(record.children) ? flattenSheetPayload(record.children) : [];
    const isSheet = !record.type || record.type === 'sheet';
    return isSheet ? [item, ...children] : children;
  });
}

function readRowsCount(data: unknown) {
  const record = data as Record<string, unknown> | undefined;
  if (Array.isArray(record)) return record.length;
  if (Array.isArray(record?.list)) return record.list.length;
  if (Array.isArray(record?.rows)) return record.rows.length;
  if (typeof record?.total === 'number') return record.total;
  if (
    record?.pagination &&
    typeof (record.pagination as Record<string, unknown>).total === 'number'
  ) {
    return (record.pagination as Record<string, number>).total;
  }
  return 0;
}
