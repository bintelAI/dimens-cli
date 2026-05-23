import { FormEvent, useMemo, useState } from 'react';
import { KeyRound, Loader2, Save, ShieldAlert, Trash2 } from 'lucide-react';
import { saveLocalAppConfig } from '@/config/appConfig';
import { exchangeTokenByApiKey } from '@/lib/dimens/auth/apiKeyExchange';
import { clearLocalDevAuth, getLocalDevAuth, saveLocalDevAuth } from '@/lib/dimens/auth/localDevTokenProvider';
import { maskToken } from '@/lib/dimens/auth/tokenMask';
import { clearLocalRuntime, saveLocalRuntime } from '@/runtime/localRuntimeStorage';
import { useRuntimeStore } from '@/store/runtimeStore';
import type { DimensWebHostProps } from '@/types/micro-module';

export default function SettingsPage() {
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);
  const bootstrap = useRuntimeStore(state => state.bootstrap);
  const localAuth = getLocalDevAuth();

  const [form, setForm] = useState({
    baseUrl: context.baseUrl || '/api',
    teamId: context.teamId,
    projectId: context.projectId,
    sheetId: context.sheetId || appConfig?.defaultSheetId || '',
    instanceId: context.instanceId,
    moduleCode: context.moduleCode,
    initialRoute: context.initialRoute || appConfig?.defaultRoute || '/',
    token: localAuth?.token || context.token || '',
    refreshToken: localAuth?.refreshToken || context.refreshToken || '',
    appName: appConfig?.appName || 'Dimens Web',
  });
  const [apiKeyForm, setApiKeyForm] = useState({
    apiKey: '',
    apiSecret: '',
  });
  const [exchangeLoading, setExchangeLoading] = useState(false);
  const [exchangeMessage, setExchangeMessage] = useState<string>();
  const [exchangeError, setExchangeError] = useState<string>();

  const tokenPreview = useMemo(() => maskToken(form.token), [form.token]);

  function update(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updateApiKey(key: keyof typeof apiKeyForm, value: string) {
    setApiKeyForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleExchangeToken(event: FormEvent) {
    event.preventDefault();
    setExchangeLoading(true);
    setExchangeMessage(undefined);
    setExchangeError(undefined);
    try {
      const result = await exchangeTokenByApiKey(form.baseUrl || '/api', {
        apiKey: apiKeyForm.apiKey.trim(),
        apiSecret: apiKeyForm.apiSecret.trim(),
      });
      const nextAuth = {
        token: result.data.token || '',
        refreshToken: result.data.refreshToken || form.refreshToken || undefined,
      };
      if (nextAuth.token) {
        saveLocalDevAuth(nextAuth);
      }
      setForm(prev => ({
        ...prev,
        token: nextAuth.token,
        refreshToken: nextAuth.refreshToken || '',
      }));
      setApiKeyForm(prev => ({ ...prev, apiSecret: '' }));
      await bootstrap();
      setExchangeMessage('Token 获取成功，已自动填入下方并保存到本地开发配置。API Secret 未保存。');
    } catch (error) {
      setExchangeError(error instanceof Error ? error.message : String(error));
    } finally {
      setExchangeLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const runtime: DimensWebHostProps & { baseUrl?: string } = {
      baseUrl: form.baseUrl,
      teamId: form.teamId,
      projectId: form.projectId,
      sheetId: form.sheetId || undefined,
      instanceId: form.instanceId || 'dev-instance',
      moduleCode: form.moduleCode || 'dimens-web',
      initialRoute: form.initialRoute || '/',
      sourceLocation: 'PROJECT_MENU',
      permissions: {
        visible: true,
        editable: true,
        canConfigure: true,
        canReadData: true,
        canWriteData: false,
      },
    };
    saveLocalRuntime(runtime);
    saveLocalAppConfig({
      appName: form.appName,
      moduleCode: form.moduleCode,
      defaultRoute: form.initialRoute || '/',
      defaultSheetId: form.sheetId || undefined,
    });
    if (form.token) {
      saveLocalDevAuth({
        token: form.token,
        refreshToken: form.refreshToken || undefined,
      });
    }
    await bootstrap(runtime);
  }

  async function handleClear() {
    clearLocalRuntime();
    clearLocalDevAuth();
    await bootstrap();
  }

  return (
    <div className="space-y-5">
      <section className="border border-ink-900/10 bg-white p-5 shadow-panel">
        <div className="text-xs uppercase tracking-[0.18em] text-copper-500">开发配置</div>
        <h1 className="mt-2 text-2xl font-semibold">独立开发配置</h1>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          这里模拟 `dimens-cli auth status / use-team / use-project` 的浏览器侧配置。生产环境请由宿主或 BFF 下发短期 token，不要把 apiSecret 保存到浏览器。
        </p>
      </section>

      <div className="border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 shrink-0" size={18} />
          <span>Token 会保存在 localStorage 里，仅建议本地开发或受控调试使用。API Key / API Secret 不会被保存，也不应写入 CDN 配置。</span>
        </div>
      </div>

      <form onSubmit={handleExchangeToken} className="border border-ink-900/10 bg-white p-5 shadow-panel">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-copper-500">API Key 登录</div>
            <h2 className="mt-2 text-xl font-semibold">使用 API Key / API Secret 获取 Token</h2>
            <p className="mt-2 text-sm leading-6 text-ink-700">
              该功能仅用于本地开发调试。提交后会调用当前接口地址的 `/open/user/login/apiKey`，成功后自动填入下方 Token 和 Refresh Token。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 border border-ink-900/10 bg-[#faf8f3] px-3 py-2 text-xs text-ink-700">
            <KeyRound size={15} />
            Secret 不会保存
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            label="API Key"
            value={apiKeyForm.apiKey}
            onChange={value => updateApiKey('apiKey', value)}
            placeholder="ak_xxx"
            required
          />
          <Field
            label="API Secret"
            value={apiKeyForm.apiSecret}
            onChange={value => updateApiKey('apiSecret', value)}
            placeholder="sk_xxx"
            required
            type="password"
          />
        </div>

        {exchangeMessage ? (
          <div className="mt-4 border border-moss-100 bg-moss-100 px-3 py-2 text-sm text-moss-600">{exchangeMessage}</div>
        ) : null}
        {exchangeError ? (
          <div className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{exchangeError}</div>
        ) : null}

        <button
          type="submit"
          disabled={exchangeLoading}
          className="mt-5 inline-flex h-10 items-center gap-2 border border-copper-500 bg-copper-500 px-4 text-sm font-medium text-white transition hover:bg-copper-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {exchangeLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          获取并填入 Token
        </button>
      </form>

      <form onSubmit={handleSubmit} className="grid gap-4 border border-ink-900/10 bg-white p-5 shadow-panel md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="text-xs uppercase tracking-[0.18em] text-copper-500">基础上下文</div>
          <h2 className="mt-2 text-xl font-semibold">应用运行配置</h2>
        </div>
        <Field label="接口地址" value={form.baseUrl} onChange={value => update('baseUrl', value)} placeholder="/api" />
        <Field label="应用名称" value={form.appName} onChange={value => update('appName', value)} placeholder="Dimens Web" />
        <Field label="团队 ID" value={form.teamId} onChange={value => update('teamId', value)} placeholder="TEAM1" required />
        <Field label="项目 ID" value={form.projectId} onChange={value => update('projectId', value)} placeholder="PROJ1" required />
        <Field label="工作表 ID" value={form.sheetId} onChange={value => update('sheetId', value)} placeholder="SHEET1" />
        <Field label="实例 ID" value={form.instanceId} onChange={value => update('instanceId', value)} placeholder="dev-instance" />
        <Field label="模块编码" value={form.moduleCode} onChange={value => update('moduleCode', value)} placeholder="dimens-web" />
        <Field label="初始路由" value={form.initialRoute} onChange={value => update('initialRoute', value)} placeholder="/records" />
        <Field label={`访问 Token ${tokenPreview ? `(${tokenPreview})` : ''}`} value={form.token} onChange={value => update('token', value)} placeholder="Bearer token" textarea />
        <Field label="刷新 Token" value={form.refreshToken} onChange={value => update('refreshToken', value)} placeholder="refresh token" textarea />

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 border border-ink-950 bg-ink-950 px-4 text-sm font-medium text-white transition hover:bg-ink-800"
          >
            <Save size={16} />
            保存并重新初始化
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex h-10 items-center gap-2 border border-ink-900/10 bg-white px-4 text-sm font-medium text-ink-800 transition hover:bg-ink-950/5"
          >
            <Trash2 size={16} />
            清空本地配置
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  textarea,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  type?: string;
}) {
  const className =
    'mt-2 w-full border border-ink-900/10 bg-[#faf8f3] px-3 py-2 font-mono text-sm outline-none transition focus:border-copper-500 focus:bg-white';

  return (
    <label className={textarea ? 'md:col-span-2' : undefined}>
      <span className="text-xs uppercase tracking-[0.16em] text-ink-700/60">{label}</span>
      {textarea ? (
        <textarea
          className={`${className} min-h-24 resize-y`}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
        />
      ) : (
        <input
          type={type}
          className={className}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </label>
  );
}
