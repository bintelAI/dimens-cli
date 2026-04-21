# React / Vue 前端登录态接入示例

## 1. 推荐目录结构

```text
src/
├── lib/
│   ├── dimens-storage.ts
│   ├── dimens-auth.ts
│   ├── dimens-sdk.ts
│   └── dimens-request.ts
├── api/
│   ├── project.ts
│   ├── sheet.ts
│   ├── document.ts
│   ├── report.ts
│   └── ai.ts
├── hooks/
│   └── useDimensAuth.ts
└── pages/ 或 views/
```

这个结构的目的只有一个：

- 登录态逻辑、SDK 创建逻辑、业务 API 调用逻辑分层

## 2. `dimens-storage.ts`

```ts
export type DimensAuthState = {
  token: string;
  refreshToken?: string;
  expire?: number;
  userInfo?: Record<string, unknown>;
};

const STORAGE_KEY = 'dimens_auth';

export function saveDimensAuth(data: DimensAuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getDimensAuth(): DimensAuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearDimensAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
```

## 3. `dimens-sdk.ts`

```ts
import { createSDK } from '@bintel/dimens-cli';
import { getDimensAuth } from './dimens-storage';

const baseUrl = 'https://dimens.bintelai.com/api';

export function createPublicSdk() {
  return createSDK({ baseUrl });
}

type DimensContext = {
  teamId: string;
  projectId: string;
};

export function createAuthedSdk(context: DimensContext) {
  const auth = getDimensAuth();

  if (!auth?.token) {
    throw new Error('当前未登录');
  }

  return createSDK({
    baseUrl,
    token: auth.token,
    refreshToken: auth.refreshToken,
    teamId: context.teamId,
    projectId: context.projectId,
  });
}
```

说明：

- `createPublicSdk` 只给登录、公共请求使用
- `createAuthedSdk` 只给登录后的业务请求使用
- 这里就把 `teamId/projectId` 一起初始化进去

## 3.1 `dimens-app-sdk.ts`

```ts
import { createAuthedSdk } from './dimens-sdk';

type DimensContext = {
  teamId: string;
  projectId: string;
};

export function createDimensAppSdk(context: DimensContext) {
  const sdk = createAuthedSdk(context);

  return {
    project: {
      page(payload: { page?: number; size?: number; keyword?: string }) {
        return sdk.project.page(context.teamId, payload);
      },
    },
    row: {
      page(sheetId: string, payload: { page?: number; size?: number }) {
        return sdk.row.page(context.teamId, context.projectId, sheetId, payload);
      },
    },
    document: {
      info(documentId: string) {
        return sdk.document.info(context.teamId, context.projectId, documentId);
      },
    },
  };
}
```

这一层的作用就是把：

- `teamId`
- `projectId`

在初始化时吸收掉，后面的页面和业务代码不再每次重复传。

## 4. `dimens-auth.ts`

```ts
import { createPublicSdk } from './dimens-sdk';
import { clearDimensAuth, getDimensAuth, saveDimensAuth } from './dimens-storage';

export async function login(username: string, password: string) {
  const sdk = createPublicSdk();
  const result = await sdk.auth.login({
    username,
    password,
  });

  saveDimensAuth({
    token: result.data.token,
    refreshToken: result.data.refreshToken,
    expire: result.data.expire,
    userInfo: result.data.userInfo,
  });

  return result.data;
}

export async function refreshTokenIfNeeded() {
  const auth = getDimensAuth();

  if (!auth?.token || !auth?.refreshToken) {
    throw new Error('缺少登录态');
  }

  const sdk = createPublicSdk();
  const result = await sdk.auth.refreshToken.call({
    client: {
      ...sdk.client,
      getOptions: () => ({
        baseUrl: 'https://dimens.bintelai.com/api',
        token: auth.token,
        refreshToken: auth.refreshToken,
      }),
    },
  });

  saveDimensAuth({
    ...auth,
    token: result.data.token,
    refreshToken: result.data.refreshToken ?? auth.refreshToken,
    expire: result.data.expire,
  });

  return result.data;
}

export function logout() {
  clearDimensAuth();
  window.location.href = '/login';
}
```

补充说明：

- 上面这段主要表达职责划分
- 真正实现时，更推荐直接重新创建一个带 `token/refreshToken` 的 SDK，再调 `refreshToken`

## 5. 更稳妥的 refresh 实现

```ts
import { createSDK } from '@bintel/dimens-cli';
import { getDimensAuth, saveDimensAuth } from './dimens-storage';

export async function refreshDimensToken() {
  const auth = getDimensAuth();

  if (!auth?.token || !auth?.refreshToken) {
    throw new Error('缺少 refreshToken');
  }

  const sdk = createSDK({
    baseUrl: 'https://dimens.bintelai.com/api',
    token: auth.token,
    refreshToken: auth.refreshToken,
  });

  const result = await sdk.auth.refreshToken();

  saveDimensAuth({
    ...auth,
    token: result.data.token,
    refreshToken: result.data.refreshToken ?? auth.refreshToken,
    expire: result.data.expire,
  });
}
```

## 6. `project.ts`

```ts
import { createDimensAppSdk } from '../lib/dimens-app-sdk';

export async function fetchProjects(teamId: string, projectId: string) {
  const sdk = createDimensAppSdk({
    teamId,
    projectId,
  });

  return sdk.project.page({
    page: 1,
    size: 20,
  });
}
```

## 7. `sheet.ts`

```ts
import { createDimensAppSdk } from '../lib/dimens-app-sdk';

export async function fetchRows(teamId: string, projectId: string, sheetId: string) {
  const sdk = createDimensAppSdk({
    teamId,
    projectId,
  });

  return sdk.row.page(sheetId, {
    page: 1,
    size: 20,
  });
}
```

## 8. React Hook 示例

```ts
import { useEffect, useState } from 'react';
import { getDimensAuth } from '../lib/dimens-storage';

export function useDimensAuth() {
  const [auth, setAuth] = useState(() => getDimensAuth());

  useEffect(() => {
    setAuth(getDimensAuth());
  }, []);

  return {
    auth,
    isLogin: Boolean(auth?.token),
  };
}
```

## 9. 登录页调用示例

```ts
async function handleSubmit() {
  await login(username, password);
  window.location.href = '/';
}
```

## 10. 页面加载项目列表示例

```ts
useEffect(() => {
  fetchProjects(teamId, projectId).then((res) => {
    setProjects(res.data.list);
  });
}, [teamId, projectId]);
```

## 11. Vue 里怎么理解同一套结构

如果是 Vue，仍然建议同样拆：

- `lib/dimens-storage.ts`
- `lib/dimens-auth.ts`
- `lib/dimens-sdk.ts`
- `api/*.ts`

区别只在页面层从 React Hook 换成：

- `pinia`
- `composable`
- `setup()`

底层 SDK 创建与 token 管理思路不变。

## 12. 这套结构为什么更稳

- 登录逻辑不混进页面
- token 存储不混进业务 API
- SDK 创建逻辑只有一处
- `teamId/projectId` 只在应用级 SDK 初始化时写一次
- 后续要切到刷新 token、统一 401 处理时不需要全项目重改
