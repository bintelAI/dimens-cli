import { createHashRouter, Navigate } from 'react-router-dom';
import AppBootstrapGate from '@/bootstrap/AppBootstrapGate';
import AppShell from '@/components/layout/AppShell';
import ContextDebugPage from '@/pages/ContextDebugPage';
import DashboardPage from '@/pages/DashboardPage';
import EmbedPage from '@/pages/EmbedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RecordsPage from '@/pages/RecordsPage';
import SettingsPage from '@/pages/SettingsPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppBootstrapGate />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'records', element: <RecordsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'embed', element: <EmbedPage /> },
          { path: 'debug/context', element: <ContextDebugPage /> },
          { path: 'debug', element: <Navigate to="/debug/context" replace /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
