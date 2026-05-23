import type { ReactNode } from 'react';

interface StateViewProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  tone?: 'neutral' | 'error';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function StateView({ icon, title, description, tone = 'neutral', action }: StateViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f2ec] p-6">
      <div className="w-full max-w-lg border border-ink-900/10 bg-white p-8 shadow-panel">
        <div
          className={[
            'mb-6 flex h-12 w-12 items-center justify-center rounded-sm',
            tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-moss-100 text-moss-600',
          ].join(' ')}
        >
          {icon}
        </div>
        <h1 className="text-2xl font-semibold text-ink-950">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-6 text-ink-700">{description}</p> : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-6 inline-flex h-10 items-center border border-ink-950 bg-ink-950 px-4 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
