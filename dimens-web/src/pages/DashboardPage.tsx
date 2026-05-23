import { ExternalLink, KeyRound, Route, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import KeyValueGrid from '@/components/common/KeyValueGrid';
import { getAuthStatus } from '@/lib/dimens/auth/authService';
import { getLocalDevAuth } from '@/lib/dimens/auth/localDevTokenProvider';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function DashboardPage() {
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);
  const authStatus = getAuthStatus(getLocalDevAuth() || {
    token: context.token,
    refreshToken: context.refreshToken,
    source: context.isWujie ? 'host' : 'none',
  });

  return (
    <div className="space-y-6">
      <section className="border border-ink-900/10 bg-white p-6 shadow-panel">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.24em] text-copper-500">Dimens Web Scaffold</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal text-ink-950 md:text-5xl">
            维表自定义前端的基础运行台
          </h1>
          <p className="mt-4 text-sm leading-7 text-ink-700">
            当前模板已接入 Hash 路由、Wujie 运行上下文、token provider、应用配置等待和 browser-safe Dimens 调用层。
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={<ExternalLink size={18} />} label="运行模式" value={context.isWujie ? 'Wujie' : '独立'} />
        <Metric icon={<Route size={18} />} label="初始路由" value={context.initialRoute || appConfig?.defaultRoute || '/'} />
        <Metric icon={<KeyRound size={18} />} label="Token" value={authStatus.tokenPreview || '未配置'} />
        <Metric icon={<ShieldCheck size={18} />} label="配置权限" value={context.permissions.canConfigure ? '可配置' : '只读'} />
      </div>

      <KeyValueGrid
        items={[
          { label: 'baseUrl', value: context.baseUrl },
          { label: 'teamId', value: context.teamId },
          { label: 'projectId', value: context.projectId },
          { label: 'sheetId', value: context.sheetId || appConfig?.defaultSheetId },
          { label: 'instanceId', value: context.instanceId },
          { label: 'moduleCode', value: context.moduleCode },
          { label: 'sourceLocation', value: context.sourceLocation },
          { label: 'contextSource', value: context.source },
        ]}
      />
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="border border-ink-900/10 bg-white p-4 shadow-insetLine">
      <div className="flex items-center gap-2 text-copper-500">{icon}</div>
      <div className="mt-4 text-xs uppercase tracking-[0.18em] text-ink-700/60">{label}</div>
      <div className="mt-2 truncate text-lg font-semibold text-ink-950">{value}</div>
    </div>
  );
}
