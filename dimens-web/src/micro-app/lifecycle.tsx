import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router/routes';
import { useRuntimeStore } from '@/store/runtimeStore';
import type { DimensWebHostProps } from '@/types/micro-module';

let root: ReactDOM.Root | undefined;

export async function bootstrap() {
  return Promise.resolve();
}

export async function mount(props: DimensWebHostProps = {}) {
  window.__DIMENS_WEB_HOST_PROPS__ = props;
  render();
  await useRuntimeStore.getState().refreshRuntime(props);
}

export async function update(props: DimensWebHostProps = {}) {
  window.__DIMENS_WEB_HOST_PROPS__ = {
    ...(window.__DIMENS_WEB_HOST_PROPS__ || {}),
    ...props,
  };
  await useRuntimeStore.getState().refreshRuntime(window.__DIMENS_WEB_HOST_PROPS__);
}

export async function unmount() {
  root?.unmount();
  root = undefined;
}

export function render() {
  const container = document.getElementById('root');
  if (!container) {
    throw new Error('缺少 #root 容器');
  }
  if (!root) {
    root = ReactDOM.createRoot(container);
  }
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}
