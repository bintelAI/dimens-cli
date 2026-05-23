import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Settings, TriangleAlert } from 'lucide-react';
import { notifyRouteChange, onHostEvent } from '@/bridge/wujieBridge';
import { useRuntimeStore } from '@/store/runtimeStore';
import type { DimensWebHostProps } from '@/types/micro-module';
import StateView from '@/components/common/StateView';
import { isRouteAllowed } from '@/components/layout/navigationItems';

export default function AppBootstrapGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useRuntimeStore(state => state.status);
  const error = useRuntimeStore(state => state.error);
  const missing = useRuntimeStore(state => state.missing);
  const bootstrap = useRuntimeStore(state => state.bootstrap);
  const refreshRuntime = useRuntimeStore(state => state.refreshRuntime);
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);

  useEffect(() => {
    void bootstrap(window.__DIMENS_WEB_HOST_PROPS__);
    return onHostEvent<DimensWebHostProps>('dimens:runtime:update', payload => {
      void refreshRuntime(payload);
    });
  }, [bootstrap, refreshRuntime]);

  useEffect(() => {
    if (status !== 'ready') return;
    if (!context.initialRoute || window.location.hash.replace(/^#/, '') !== '/') return;
    navigate(context.initialRoute, { replace: true });
  }, [context.initialRoute, navigate, status]);

  useEffect(() => {
    notifyRouteChange(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  if (status === 'idle' || status === 'loading') {
    return (
      <StateView
        icon={<Loader2 className="animate-spin" size={24} />}
        title="正在准备运行环境"
        description="正在解析 Wujie 上下文、应用配置和 token 来源。"
      />
    );
  }

  if (status === 'error') {
    return (
      <StateView
        icon={<TriangleAlert size={24} />}
        title="初始化失败"
        description={error || '运行环境初始化失败，请检查配置。'}
        tone="error"
      />
    );
  }

  if (status === 'needs-config' && location.pathname === '/settings') {
    return <Outlet />;
  }

  if (status === 'needs-config') {
    return (
      <StateView
        icon={<Settings size={24} />}
        title="需要补充开发配置"
        description={`缺少关键配置：${missing.join(', ')}。请进入设置页补充后重试。`}
        action={{ label: '打开设置', onClick: () => navigate('/settings') }}
      />
    );
  }

  if (status === 'ready' && !isRouteAllowed(location.pathname, context, appConfig)) {
    return (
      <StateView
        icon={<TriangleAlert size={24} />}
        title="当前页面不可访问"
        description="宿主权限或应用功能开关已禁用该页面。"
        tone="error"
        action={{ label: '返回概览', onClick: () => navigate('/') }}
      />
    );
  }

  return <Outlet />;
}
