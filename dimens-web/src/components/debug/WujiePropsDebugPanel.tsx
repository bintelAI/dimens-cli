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
    <section className="border border-ink-900/10 bg-white p-5 shadow-panel">
      <div className="text-xs uppercase tracking-[0.18em] text-copper-500">Wujie Props</div>
      <h2 className="mt-2 text-xl font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-ink-700">{description}</p> : null}
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
    <div className="min-w-0 border border-ink-900/10 bg-[#faf8f3]">
      <div className="border-b border-ink-900/10 px-3 py-2 font-mono text-xs text-ink-700">{title}</div>
      <pre className="max-h-[420px] overflow-auto p-3 text-xs leading-5 text-ink-950">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
