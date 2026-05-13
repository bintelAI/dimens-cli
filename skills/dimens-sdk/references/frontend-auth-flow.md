# 前端登录与 Token 主链

## 1. 先明确一件事

如果用户说的是“前端对接 SDK”，优先要解决的不是模板页面，而是这一条主链：

1. 登录
2. 拿到 `token / refreshToken`
3. 持久化存储
4. 后续请求自动带 token
5. token 失效后刷新
6. 刷新失败后清空本地登录态并跳回登录页

这个技能在前端场景下，优先解释这条链。

安全边界必须同时说清：

- 浏览器端不要保存 `apiSecret`
- 如果必须用 API Key / Secret 换 token，默认放到 BFF 或服务端执行
- 前端只接收用户登录 token、短期 token 或 BFF 会话结果
- token 能读接口不代表具备项目、表格、报表权限，403 要回到权限排查

## 2. 当前 SDK 登录能力

当前 `auth` 已有的方法：

```ts
sdk.auth.login({
  username,
  password,
});

sdk.auth.loginByApiKey({
  apiKey,
  apiSecret,
});

sdk.auth.refreshToken();
```

返回结果核心字段：

- `token`
- `refreshToken`
- `expire`
- `userInfo`

## 3. 前端本地存储建议

浏览器端推荐至少存：

```ts
type DimensAuthState = {
  token: string;
  refreshToken?: string;
  expire?: number;
  userInfo?: Record<string, unknown>;
};
```

最常见存储方式：

```ts
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

说明：

- 如果是纯前端演示或内部系统，常见做法是 `localStorage`
- 如果项目安全要求更高，可以改为更严格的前端存储策略，但技能里先按常规前端接入说明

## 4. 登录成功后立刻落本地

```ts
import { createSDK } from '@bintel/dimens-cli';

const sdk = createSDK({
  baseUrl: 'https://dimens.bintelai.com/api',
});

export async function loginByPassword(username: string, password: string) {
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
```

关键点：

- 登录用的 SDK 可以先不带 token
- 登录成功后，把返回的 `token/refreshToken` 存起来

## 5. 后续请求必须基于本地 token 重新创建 SDK

当前 `DimensClient` 的 token 是在初始化时传进去的，因此前端最稳妥的做法是：

```ts
import { createSDK } from '@bintel/dimens-cli';

type DimensContext = {
  teamId: string;
  projectId: string;
};

export function createAuthedSdk(context: DimensContext) {
  const auth = getDimensAuth();

  if (!auth?.token) {
    throw new Error('未登录，缺少 token');
  }

  return createSDK({
    baseUrl: 'https://dimens.bintelai.com/api',
    token: auth.token,
    refreshToken: auth.refreshToken,
    teamId: context.teamId,
    projectId: context.projectId,
  });
}
```

说明：

- 不要在应用启动时只创建一个永不更新的全局 SDK 实例
- 因为 token 刷新后，旧实例里的 token 不会自动变
- 这里建议初始化时就把 `teamId/projectId` 一起写进去

## 5.1 当前底层 SDK 的真实情况

这一点要说清楚：

- `createSDK({ teamId, projectId })` 可以把默认上下文写进 client 配置
- 但当前仓库里大多数底层方法仍然是显式参数风格

例如：

```ts
sdk.project.page(teamId, payload);
sdk.row.page(teamId, projectId, sheetId, payload);
sdk.document.info(teamId, projectId, documentId);
```

所以如果你的目标是：

- SDK 初始化时就写好 `teamId/projectId`
- 页面层后面直接调用封装好的方法

那正确做法不是“直接裸用底层 SDK”，而是：

1. 先创建带 `teamId/projectId` 的底层 SDK
2. 再在前端项目里包一层应用级 SDK
3. 页面层只调用你应用级 SDK 暴露的方法

## 6. 调接口时自动带 token

只要 SDK 初始化时传了 `token`，后续请求会自动带：

```ts
Authorization: Bearer <token>
```

示例：

```ts
export function createDimensAppSdk(context: DimensContext) {
  const sdk = createAuthedSdk(context);

  return {
    project: {
      page(payload: { page?: number; size?: number; keyword?: string }) {
        return sdk.project.page(context.teamId, payload);
      },
    },
    row: {
      page(sheetId: string, payload: { page?: number; size?: number; viewId?: string }) {
        return sdk.row.page(context.teamId, context.projectId, sheetId, payload);
      },
      info(sheetId: string, rowId: string) {
        return sdk.row.info(context.teamId, context.projectId, sheetId, rowId);
      },
    },
    document: {
      info(documentId: string) {
        return sdk.document.info(context.teamId, context.projectId, documentId);
      },
    },
  };
}

export async function fetchProjectList(teamId: string, projectId: string) {
  const dimens = createDimensAppSdk({
    teamId,
    projectId,
  });

  return dimens.project.page({
    page: 1,
    size: 20,
  });
}
```

这就是前端“后续所有接口自动带 token”的核心方式。

同时也符合你的目标：

- `teamId/projectId` 在初始化时写一次
- 页面后面直接调用封装好的方法

## 7. 刷新 token 的基本实现

当前 SDK 已有：

```ts
sdk.auth.refreshToken();
```

前端可以这样封装：

```ts
export async function refreshDimensToken() {
  const auth = getDimensAuth();

  if (!auth?.refreshToken) {
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

  return result.data;
}
```

说明：

- 当前客户端会自动带上 `Authorization` 和 `X-Refresh-Token`
- 刷新成功后，必须把新的 token 再写回本地

## 8. 401 失效处理建议

前端常规建议：

1. 请求失败时识别是否为 token 失效
2. 先尝试刷新 token
3. 刷新成功后重试一次原请求
4. 如果刷新失败，清空本地登录态
5. 跳回登录页

可以先做一个简化版：

```ts
export async function withDimensRetry<T>(runner: () => Promise<T>) {
  try {
    return await runner();
  } catch (error) {
    await refreshDimensToken();
    return runner();
  }
}
```

说明：

- 真实项目里应再细分错误类型，不要所有报错都无脑刷新
- 这里是前端接入主链的最小思路

错误判断建议：

| 错误 | 是否 refresh | 优先处理 |
| --- | --- | --- |
| 401 / 未登录 / token 失效 | 是 | refresh 成功后重试一次 |
| 403 / 无权限 | 否 | 检查团队成员、项目权限、资源权限 |
| 404 / 资源不存在 | 否 | 检查 `teamId/projectId/sheetId/reportId/documentId` |
| 409 / version 冲突 | 否 | 重新读取当前数据和版本后再更新 |
| 5xx / 网络错误 | 否 | 走普通重试或错误提示，不要刷新 token |

## 9. 一个完整的前端调用链

### 9.1 登录页

```ts
await loginByPassword(username, password);
```

### 9.2 首页读取项目

```ts
const projectList = await withDimensRetry(() =>
  fetchProjectList(teamId, projectId)
);
```

### 9.3 表格页读取行数据

```ts
const dimens = createDimensAppSdk({
  teamId,
  projectId,
});

const rows = await withDimensRetry(() =>
  dimens.row.page(sheetId, {
    page: 1,
    size: 20,
  })
);
```

### 9.4 更新单元格

```ts
const dimens = createDimensAppSdk({
  teamId,
  projectId,
});
const rowInfo = await dimens.row.info(sheetId, rowId);

await withDimensRetry(() =>
  createAuthedSdk({ teamId, projectId }).row.updateCell(sheetId, {
    rowId,
    fieldId,
    value,
    version: Number(rowInfo.data.version),
  })
);
```

## 10. 前端推荐文件拆分

推荐至少拆成：

- `src/lib/dimens-storage.ts`
- `src/lib/dimens-auth.ts`
- `src/lib/dimens-sdk.ts`
- `src/api/project.ts`
- `src/api/sheet.ts`
- `src/api/document.ts`
- `src/api/report.ts`
- `src/api/ai.ts`

职责建议：

- `dimens-storage.ts`：只管 token 本地存取
- `dimens-auth.ts`：只管登录、刷新、退出
- `dimens-sdk.ts`：只管创建带 token 和上下文的 SDK / 应用级 SDK
- `api/*.ts`：只管具体资源调用

## 11. 退出登录时要做什么

```ts
export function logout() {
  clearDimensAuth();
  window.location.href = '/login';
}
```

最少要做：

1. 清空本地 token
2. 清空本地 refreshToken
3. 清空当前用户缓存
4. 回到登录页

## 12. 当前最容易犯的错误

- 登录成功了，但没有把 token 持久化
- token 更新了，但还在复用旧 SDK 实例
- 刷新成功了，但没有把新 token 重新写回本地
- 退出登录只跳页面，没有清理本地 token
- 所有请求报错都直接当成 token 失效
- 把 `apiKey/apiSecret` 直接放在浏览器端
- 403 或 404 时反复 refresh，掩盖了权限或资源 ID 问题

## 13. 一句话总结

如果用户问“前端怎么对接 dimens sdk”，默认优先回答：

1. 先登录拿 token
2. token 存本地
3. 每次请求前从本地取 token 创建 SDK
4. 初始化时一并写入 `teamId/projectId`
5. 页面层直接调用你封装好的方法
6. SDK 自动带 `Authorization`
7. token 失效时刷新
8. 刷新失败就清理登录态
