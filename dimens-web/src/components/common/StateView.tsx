import type { ReactNode } from 'react';

interface StateViewProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  tone?: 'neutral' | 'error';
  compact?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function StateView({ icon, title, description, tone = 'neutral', compact = false, action }: StateViewProps) {
  const outerClassName = compact
    ? ''
    : 'flex min-h-screen items-center justify-center p-6';
  const innerClassName = [
    'w-full rounded-lg border border-slate-200/80 bg-white/95 p-8 shadow-panel backdrop-blur',
    compact ? '' : 'max-w-lg',
  ].join(' ');

  return (
    <div className={outerClassName}>
      <div className={innerClassName}>
        <div
          className={[
            'mb-6 flex h-12 w-12 items-center justify-center rounded-sm',
            tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-600',
          ].join(' ')}
        >
          {icon}
        </div>
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        {description ? <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p> : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="app-button-primary mt-6"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
