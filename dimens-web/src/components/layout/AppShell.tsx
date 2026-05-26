import { NavLink, Outlet } from 'react-router-dom';
import { Boxes, Menu } from 'lucide-react';
import { useRuntimeStore } from '@/store/runtimeStore';
import { useUiStore } from '@/store/uiStore';
import { getVisibleNavItems } from './navigationItems';

export default function AppShell() {
  const context = useRuntimeStore(state => state.context);
  const appConfig = useRuntimeStore(state => state.appConfig);
  const sidebarOpen = useUiStore(state => state.sidebarOpen);
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const navItems = getVisibleNavItems(context, appConfig);
  const isReleaseMode = import.meta.env.PROD || window.__DIMENS_WEB_RELEASE_MODE__ === true;

  return (
    <div className="min-h-screen bg-transparent text-slate-950">
      <div className="flex min-h-screen">
        {!isReleaseMode ? (
          <aside
            className={[
              'hidden border-r border-slate-200/80 bg-white/85 shadow-[8px_0_30px_rgba(15,23,42,0.04)] backdrop-blur md:block',
              sidebarOpen ? 'w-64' : 'w-20',
            ].join(' ')}
          >
            <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg">
                <Boxes size={18} />
              </div>
              {sidebarOpen ? (
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-950">{appConfig?.appName || 'Dimens Web'}</div>
                  <div className="text-xs text-slate-500">{context.source}</div>
                </div>
              ) : null}
            </div>
            <nav className="space-y-1 p-3">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      [
                        'flex h-11 items-center gap-3 rounded-md px-3 text-sm transition',
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700',
                      ].join(' ')
                    }
                  >
                    <Icon size={17} />
                    {sidebarOpen ? <span>{item.label}</span> : null}
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        ) : null}
        <main className="min-w-0 flex-1">
          <header
            className={[
              'sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 px-5 backdrop-blur',
              'bg-white/72',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              {!isReleaseMode ? (
                <button
                  type="button"
                  className="hidden h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 md:flex"
                  onClick={toggleSidebar}
                  aria-label="切换导航"
                >
                  <Menu size={17} />
                </button>
              ) : null}
              <div>
                <div className="text-sm font-semibold text-slate-950">{context.moduleCode}</div>
                <div className="text-xs text-slate-500">
                  {context.teamId || '-'} / {context.projectId || '-'}
                </div>
              </div>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              {context.isWujie ? 'Wujie' : 'Standalone'}
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl p-5 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
