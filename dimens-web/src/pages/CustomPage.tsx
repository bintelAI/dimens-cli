import { Database, ExternalLink, PanelsTopLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import KeyValueGrid from '@/components/common/KeyValueGrid';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function CustomPage() {
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);

  return (
    <div className="space-y-5">
      <section className="app-hero">
        <div className="max-w-3xl">
          <div className="app-eyebrow">
            <PanelsTopLeft size={16} />
            Custom Page
          </div>
          <h1 className="app-page-title mt-4">
            自定义业务页面
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            这里承载维表自定义前端的业务内容，发布包默认只保留业务页面与概览首页。
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard icon={<ExternalLink size={18} />} label="运行来源" value={context.sourceLocation} />
        <InfoCard icon={<Database size={18} />} label="默认数据表" value={context.sheetId || appConfig?.defaultSheetId || '-'} />
        <InfoCard icon={<PanelsTopLeft size={18} />} label="模块编码" value={context.moduleCode || appConfig?.moduleCode || '-'} />
      </div>

      <KeyValueGrid
        items={[
          { label: 'teamId', value: context.teamId },
          { label: 'projectId', value: context.projectId },
          { label: 'instanceId', value: context.instanceId },
          { label: 'moduleCode', value: context.moduleCode },
        ]}
      />
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="app-surface rounded-lg p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">{icon}</div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 truncate text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}
