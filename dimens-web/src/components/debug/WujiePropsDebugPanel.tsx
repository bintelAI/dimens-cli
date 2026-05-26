import { getWujieDebugSnapshot } from '@/bridge/wujieDebug';

interface WujiePropsDebugPanelProps {
  title?: string;
  description?: string;
}

export default function WujiePropsDebugPanel({
  title = '无界微前端注入 JSON',
  description,
}: WujiePropsDebugPanelProps) {
  const wujieDebug = getWujieDebugSnapshot();

  return (
    <section className="app-card">
      <div className="app-eyebrow">Wujie Props</div>
      <h2 className="mt-2 text-xl font-semibold text-slate-950">{title}</h2>
      {description ? <p className="app-muted mt-2">{description}</p> : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <JsonPanel title="window.$wujie.props" value={wujieDebug.wujieProps} />
        <JsonPanel title="window.__DIMENS_WEB_HOST_PROPS__" value={wujieDebug.cachedHostProps} />
        <JsonPanel title="merged host props" value={wujieDebug.mergedHostProps} />
      </div>
    </section>
  );
}

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-600">{title}</div>
      <pre className="max-h-[420px] overflow-auto p-3 font-mono text-xs leading-5 text-slate-900">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
