import { ExternalLink, KeyRound, Link2, Route, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import KeyValueGrid from '@/components/common/KeyValueGrid';
import { getAuthStatus } from '@/lib/dimens/auth/authService';
import { getLocalDevAuth } from '@/lib/dimens/auth/localDevTokenProvider';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function DashboardPage() {
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);
  const relativeUrls = getReleaseRelativeUrls();
  const authStatus = getAuthStatus(getLocalDevAuth() || {
    token: context.token,
    refreshToken: context.refreshToken,
    source: context.isWujie ? 'host' : 'none',
  });

  return (
    <div className="space-y-6">
      <section className="app-hero">
        <div className="max-w-3xl">
          <div className="app-eyebrow">
            {appConfig?.appName || 'Dimens Web'}
          </div>
          <h1 className="app-page-title mt-4">
            维表自定义前端概览
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            当前应用已接入维表运行上下文，可在普通页面或 Wujie 微前端环境中使用。
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

      <section className="app-card">
        <div className="app-eyebrow">
          <Link2 size={15} />
          Relative URLs
        </div>
        <h2 className="mt-3 text-lg font-semibold text-slate-950">发布包相对路径</h2>
        <div className="mt-4 grid gap-3">
          {relativeUrls.map(item => (
            <div
              key={item.path}
              className="grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-[120px_1fr]"
            >
              <div className="font-medium text-slate-600">{item.label}</div>
              <code className="break-all font-mono text-slate-950">{item.path}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="app-surface rounded-lg p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">{icon}</div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-2 truncate text-lg font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function getReleaseRelativeUrls() {
  return [
    { label: '概览首页', path: './index.html#/' },
    { label: '自定义页面', path: './index.html#/custom' },
  ];
}
