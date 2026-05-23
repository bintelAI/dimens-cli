interface KeyValueGridProps {
  items: Array<{ label: string; value?: unknown }>;
}

export default function KeyValueGrid({ items }: KeyValueGridProps) {
  return (
    <div className="grid gap-px overflow-hidden border border-ink-900/10 bg-ink-900/10 md:grid-cols-2">
      {items.map(item => (
        <div key={item.label} className="bg-white p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-ink-700/60">{item.label}</div>
          <div className="mt-2 break-all font-mono text-sm text-ink-950">{formatValue(item.value)}</div>
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
