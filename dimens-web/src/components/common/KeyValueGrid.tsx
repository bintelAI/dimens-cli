interface KeyValueGridProps {
  items: Array<{ label: string; value?: unknown }>;
}

export default function KeyValueGrid({ items }: KeyValueGridProps) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-slate-200/80 bg-slate-200/80 shadow-sm md:grid-cols-2">
      {items.map(item => (
        <div key={item.label} className="bg-white/95 p-4 transition hover:bg-blue-50/45">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
          <div className="mt-2 break-all font-mono text-sm text-slate-950">{formatValue(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}
