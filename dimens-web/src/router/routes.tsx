import { createHashRouter, Navigate } from 'react-router-dom';
import AppBootstrapGate from '@/bootstrap/AppBootstrapGate';
import AppShell from '@/components/layout/AppShell';
import ContextDebugPage from '@/pages/ContextDebugPage';
import CustomPage from '@/pages/CustomPage';
import DashboardPage from '@/pages/DashboardPage';
import EmbedPage from '@/pages/EmbedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import RecordsPage from '@/pages/RecordsPage';
import SettingsPage from '@/pages/SettingsPage';

const routeItems = import.meta.env.PROD
  ? [
      { index: true, element: <DashboardPage /> },
      { path: 'custom', element: <CustomPage /> },
      { path: '*', element: <NotFoundPage /> },
    ]
  : [
      { index: true, element: <DashboardPage /> },
      { path: 'custom', element: <CustomPage /> },
      { path: 'records', element: <RecordsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'embed', element: <EmbedPage /> },
      { path: 'debug/context', element: <ContextDebugPage /> },
      { path: 'debug', element: <Navigate to="/debug/context" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ];

export const router = createHashRouter([
  {
    path: '/',
    element: <AppBootstrapGate />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: routeItems,
      },
    ],
  },
]);
