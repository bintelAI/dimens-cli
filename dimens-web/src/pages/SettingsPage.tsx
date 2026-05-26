import { FormEvent, useMemo, useState } from 'react';
import { SquareMousePointer, KeyRound, Loader2, Save, ShieldAlert, TableProperties, Trash2 } from 'lucide-react';
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
    sheetId: context.sheetId || '',
    viewId: context.viewId || '',
    rowId: context.rowId || '',
    columnId: context.columnId || '',
    instanceId: context.instanceId,
    moduleCode: context.moduleCode,
    sourceLocation: context.sourceLocation,
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
    const sourceLocation = form.sourceLocation || 'PROJECT_MENU';
    const scenePatch = buildScenePatch({
      sourceLocation,
      sheetId: form.sheetId,
      viewId: form.viewId,
      rowId: form.rowId,
      columnId: form.columnId,
    });
    const runtime: DimensWebHostProps & { baseUrl?: string } = {
      baseUrl: form.baseUrl,
      teamId: form.teamId,
      projectId: form.projectId,
      sheetId: form.sheetId || undefined,
      viewId: form.viewId || undefined,
      rowId: form.rowId || undefined,
      columnId: form.columnId || undefined,
      instanceId: form.instanceId || 'dev-instance',
      moduleCode: form.moduleCode || 'dimens-web',
      initialRoute: form.initialRoute || '/',
      sourceLocation: sourceLocation as DimensWebHostProps['sourceLocation'],
      permissions: {
        visible: true,
        editable: true,
        canConfigure: true,
        canReadData: true,
        canWriteData: false,
      },
      ...scenePatch,
    };
    saveLocalRuntime(runtime);
    saveLocalAppConfig({
      appName: form.appName,
      moduleCode: form.moduleCode,
      defaultRoute: form.initialRoute || '/',
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
      <section className="app-card">
        <div className="app-eyebrow">开发配置</div>
        <h1 className="app-title mt-2">独立开发配置</h1>
        <p className="app-muted mt-2">
          这里模拟 `dimens-cli auth status / use-team / use-project` 的浏览器侧配置。生产环境请由宿主或 BFF 下发短期 token，不要把 apiSecret 保存到浏览器。
        </p>
      </section>

      <div className="app-alert-warning">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 shrink-0" size={18} />
          <span>Token 会保存在 localStorage 里，仅建议本地开发或受控调试使用。API Key / API Secret 不会被保存，也不应写入 CDN 配置。</span>
        </div>
      </div>

      <form onSubmit={handleExchangeToken} className="app-card">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="app-eyebrow">API Key 登录</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">使用 API Key / API Secret 获取 Token</h2>
            <p className="app-muted mt-2">
              该功能仅用于本地开发调试。提交后会调用当前接口地址的 `/open/user/login/apiKey`，成功后自动填入下方 Token 和 Refresh Token。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
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
          <div className="app-alert-success mt-4">{exchangeMessage}</div>
        ) : null}
        {exchangeError ? (
          <div className="app-alert-error mt-4">{exchangeError}</div>
        ) : null}

        <button
          type="submit"
          disabled={exchangeLoading}
          className="app-button-primary mt-5"
        >
          {exchangeLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          获取并填入 Token
        </button>
      </form>

      <form onSubmit={handleSubmit} className="app-card grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <div className="app-eyebrow">基础上下文</div>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">应用运行配置</h2>
        </div>
        <Field label="接口地址" value={form.baseUrl} onChange={value => update('baseUrl', value)} placeholder="/api" />
        <Field label="应用名称" value={form.appName} onChange={value => update('appName', value)} placeholder="Dimens Web" />
        <Field label="团队 ID" value={form.teamId} onChange={value => update('teamId', value)} placeholder="TEAM1" required />
        <Field label="项目 ID" value={form.projectId} onChange={value => update('projectId', value)} placeholder="PROJ1" required />
        <SceneSelect value={form.sourceLocation} onChange={value => update('sourceLocation', value)} />
        <Field label="数据表 ID" value={form.sheetId} onChange={value => update('sheetId', value)} placeholder="SHEET1" />
        {form.sourceLocation === 'SHEET_VIEW' || form.sourceLocation === 'ROW_BUTTON_MODAL' || form.sourceLocation === 'CELL_BUTTON_MODAL' ? (
          <Field label="视图 ID" value={form.viewId} onChange={value => update('viewId', value)} placeholder="VIEW1" />
        ) : null}
        {form.sourceLocation === 'ROW_BUTTON_MODAL' || form.sourceLocation === 'CELL_BUTTON_MODAL' ? (
          <>
            <Field label="行 ID" value={form.rowId} onChange={value => update('rowId', value)} placeholder="ROW1" />
            <Field label="字段/列 ID" value={form.columnId} onChange={value => update('columnId', value)} placeholder="FIELD_BUTTON" />
          </>
        ) : null}
        <Field label="实例 ID" value={form.instanceId} onChange={value => update('instanceId', value)} placeholder="dev-instance" />
        <Field label="模块编码" value={form.moduleCode} onChange={value => update('moduleCode', value)} placeholder="dimens-web" />
        <Field label="初始路由" value={form.initialRoute} onChange={value => update('initialRoute', value)} placeholder="/records" />
        <Field label={`访问 Token ${tokenPreview ? `(${tokenPreview})` : ''}`} value={form.token} onChange={value => update('token', value)} placeholder="Bearer token" textarea />
        <Field label="刷新 Token" value={form.refreshToken} onChange={value => update('refreshToken', value)} placeholder="refresh token" textarea />

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button
            type="submit"
            className="app-button-primary"
          >
            <Save size={16} />
            保存并重新初始化
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="app-button-secondary"
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
  const className = 'app-input mt-2 font-mono';

  return (
    <label className={textarea ? 'md:col-span-2' : undefined}>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
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

function SceneSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const options = [
    { value: 'PROJECT_MENU', label: '页面', icon: null },
    { value: 'SHEET_VIEW', label: '视图', icon: <TableProperties size={14} /> },
    { value: 'ROW_BUTTON_MODAL', label: '按钮', icon: <SquareMousePointer size={14} /> },
  ];

  return (
    <label>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">运行场景</span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={[
              'flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              value === option.value
                ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-white hover:text-blue-700',
            ].join(' ')}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </label>
  );
}

function buildScenePatch(input: {
  sourceLocation: string;
  sheetId: string;
  viewId: string;
  rowId: string;
  columnId: string;
}): Partial<DimensWebHostProps> {
  if (input.sourceLocation === 'SHEET_VIEW') {
    const viewId = input.viewId || 'dev-view';
    return {
      sourceId: viewId,
      viewState: {
        viewId,
        viewType: 'plugin',
        filters: [],
        filterMatchType: 'and',
        sortRule: null,
        groupBy: [],
        hiddenColumnIds: [],
        selectedRowIds: ['dev-row-1'],
        displayRows: [
          {
            rowId: 'dev-row-1',
            title: '示例记录',
            status: 'open',
          },
        ],
        displayState: {
          source: 'filtered',
          lastUpdatedAt: Date.now(),
        },
      },
    };
  }

  if (input.sourceLocation === 'ROW_BUTTON_MODAL' || input.sourceLocation === 'CELL_BUTTON_MODAL') {
    const rowId = input.rowId || 'dev-row-1';
    const columnId = input.columnId || 'dev-button';
    const viewId = input.viewId || 'dev-view';
    return {
      sourceId: rowId,
      actionSnapshot: {
        trigger: {
          type: 'button',
          id: columnId,
          label: '示例按钮',
        },
        sheetId: input.sheetId || 'dev-sheet',
        viewId,
        rowId,
        columnId,
        fieldId: columnId,
        recordIds: [rowId],
        selectedRowIds: [rowId],
        rowSnapshot: {
          rowId,
          title: '示例记录',
          status: 'open',
        },
        viewStateSnapshot: {
          viewId,
          viewType: 'grid',
          filters: [],
          filterMatchType: 'and',
          sortRule: null,
          groupBy: [],
          hiddenColumnIds: [],
          selectedRowIds: [rowId],
        },
      },
    };
  }

  return {
    sourceId: input.sheetId || undefined,
  };
}
