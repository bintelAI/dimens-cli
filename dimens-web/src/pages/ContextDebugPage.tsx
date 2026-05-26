import KeyValueGrid from '@/components/common/KeyValueGrid';
import WujiePropsDebugPanel from '@/components/debug/WujiePropsDebugPanel';
import { getAuthStatus } from '@/lib/dimens/auth/authService';
import { getLocalDevAuth } from '@/lib/dimens/auth/localDevTokenProvider';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function ContextDebugPage() {
  const context = useRuntimeStore(state => state.context);
  const missing = useRuntimeStore(state => state.missing);
  const appConfig = useRuntimeStore(state => state.appConfig);
  const auth = getAuthStatus(getLocalDevAuth() || {
    token: context.token,
    refreshToken: context.refreshToken,
    source: context.isWujie ? 'host' : 'none',
  });

  return (
    <div className="space-y-5">
      <section className="app-card">
        <div className="app-eyebrow">Debug</div>
        <h1 className="app-title mt-2">上下文调试</h1>
        <p className="app-muted mt-2">
          token 仅展示脱敏预览。不要把 apiSecret 放进浏览器配置或 CDN 配置文件。
        </p>
      </section>
      <KeyValueGrid
        items={[
          { label: 'missing', value: missing },
          { label: 'authSource', value: auth.source },
          { label: 'isAuthenticated', value: auth.isAuthenticated },
          { label: 'hasRefreshToken', value: auth.hasRefreshToken },
          { label: 'tokenPreview', value: auth.tokenPreview },
          { label: 'expire', value: auth.expire },
          { label: 'appConfig', value: appConfig },
          { label: 'runtime', value: context },
        ]}
      />
      <WujiePropsDebugPanel />
    </div>
  );
}
