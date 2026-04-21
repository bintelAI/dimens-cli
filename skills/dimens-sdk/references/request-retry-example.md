# 请求重试与 401 刷新示例

## 1. 这份文档解决什么问题

当前前端接入 `dimens-sdk`，真正跑起来以后，最关键的不是“能不能请求一次成功”，而是：

1. token 过期了怎么办
2. 哪些错误才应该触发 refresh
3. refresh 成功后怎么重试原请求
4. refresh 失败后怎么 logout
5. 怎么和 `createDimensAppSdk({ teamId, projectId })` 结合

这份文档就只解决这条链。

## 2. 推荐分层

```text
src/lib/
  dimens-storage.ts
  dimens-auth.ts
  dimens-sdk.ts
  dimens-app-sdk.ts
  dimens-request.ts
```

职责：

- `dimens-storage.ts`：存 token / refreshToken
- `dimens-auth.ts`：登录、刷新、退出
- `dimens-sdk.ts`：创建底层 SDK
- `dimens-app-sdk.ts`：吸收 `teamId/projectId`
- `dimens-request.ts`：统一处理 401、refresh、retry

## 3. 先定义错误判断

不要所有报错都直接 refresh。

先做一个最小判断函数：

```ts
export function isDimensAuthError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const maybeError = error as {
    status?: number;
    code?: number;
    message?: string;
  };

  if (maybeError.status === 401) {
    return true;
  }

  if (typeof maybeError.message === 'string') {
    return /token|unauthorized|401|登录失效|未登录/i.test(maybeError.message);
  }

  return false;
}
```

说明：

- 真实项目里你可以结合真实接口错误结构继续细化
- 当前技能里先给最小可执行判断思路

## 4. refresh 只允许串行执行

如果多个请求同时 401，不要让它们同时各自 refresh。

推荐做一个全局单例 Promise：

```ts
let refreshingPromise: Promise<void> | null = null;

export async function ensureDimensRefresh() {
  if (!refreshingPromise) {
    refreshingPromise = refreshDimensToken()
      .then(() => undefined)
      .finally(() => {
        refreshingPromise = null;
      });
  }

  return refreshingPromise;
}
```

目的：

- 避免并发刷新
- 避免后一个 refresh 把前一个结果覆盖掉

## 5. `dimens-request.ts`

```ts
import { ensureDimensRefresh } from './dimens-refresh';
import { logout } from './dimens-auth';

export async function withDimensRetry<T>(runner: () => Promise<T>) {
  try {
    return await runner();
  } catch (error) {
    if (!isDimensAuthError(error)) {
      throw error;
    }

    try {
      await ensureDimensRefresh();
      return await runner();
    } catch (refreshError) {
      logout();
      throw refreshError;
    }
  }
}
```

说明：

- 先执行原请求
- 如果不是鉴权错误，直接抛出
- 如果是鉴权错误，先 refresh
- refresh 成功后重试一次
- refresh 失败就 logout

## 6. 和 `createDimensAppSdk` 结合

假设你已经有：

```ts
const dimens = createDimensAppSdk({
  teamId,
  projectId,
});
```

那么业务调用可以统一改成：

```ts
const result = await withDimensRetry(() =>
  dimens.project.page({
    page: 1,
    size: 20,
  })
);
```

这就是你要的最终效果：

- `teamId/projectId` 在初始化时写好
- 页面层不再每次手传
- 请求失败时自动走 refresh + retry

## 7. 项目列表示例

```ts
export async function fetchProjects(teamId: string, projectId: string) {
  const dimens = createDimensAppSdk({
    teamId,
    projectId,
  });

  return withDimensRetry(() =>
    dimens.project.page({
      page: 1,
      size: 20,
    })
  );
}
```

## 8. 表格行数据示例

```ts
export async function fetchRows(teamId: string, projectId: string, sheetId: string) {
  const dimens = createDimensAppSdk({
    teamId,
    projectId,
  });

  return withDimensRetry(() =>
    dimens.row.page(sheetId, {
      page: 1,
      size: 20,
    })
  );
}
```

## 9. 文档详情示例

```ts
export async function fetchDocumentInfo(
  teamId: string,
  projectId: string,
  documentId: string
) {
  const dimens = createDimensAppSdk({
    teamId,
    projectId,
  });

  return withDimensRetry(() => dimens.document.info(documentId));
}
```

## 10. 更新单元格示例

这里要特别注意：  
更新单元格除了 token，还依赖 `version`。

```ts
export async function updateCell(
  teamId: string,
  projectId: string,
  sheetId: string,
  rowId: string,
  fieldId: string,
  value: unknown
) {
  const dimens = createDimensAppSdk({
    teamId,
    projectId,
  });

  const rowInfo = await withDimensRetry(() => dimens.row.info(sheetId, rowId));

  return withDimensRetry(() =>
    dimens.row.updateCell(sheetId, {
      rowId,
      fieldId,
      value,
      version: Number(rowInfo.data.version),
    })
  );
}
```

说明：

- 这里即使 token 没问题，也可能因为 `version` 冲突失败
- 所以不要把所有更新失败都误判成登录态失效

## 11. 页面层怎么写

### React 里

```ts
useEffect(() => {
  fetchProjects(teamId, projectId).then((res) => {
    setProjects(res.data.list);
  });
}, [teamId, projectId]);
```

### Vue 里

```ts
onMounted(async () => {
  const res = await fetchProjects(teamId.value, projectId.value);
  projects.value = res.data.list;
});
```

页面层保持简单：

- 不直接处理 refresh
- 不直接判断 401
- 不直接操作 localStorage

## 12. logout 时要做的事

```ts
export function logout() {
  clearDimensAuth();
  window.location.href = '/login';
}
```

最少要做：

1. 清 token
2. 清 refreshToken
3. 清用户信息
4. 跳回登录页

## 13. 最容易踩的坑

- 所有错误都触发 refresh
- 并发多个 401 时重复 refresh
- refresh 成功后没有重试原请求
- refresh 失败后没有清本地登录态
- 页面里自己处理 refresh，导致逻辑散落
- 忽略 `version`，把数据更新失败误判成 token 失效

## 14. 最终建议

如果你已经接受这套封装方式，前端项目里最推荐的调用链就是：

```text
login -> save token -> createDimensAppSdk(teamId, projectId) -> withDimensRetry(runner) -> refresh -> retry -> logout
```

这样你的页面层就能做到：

- 只关心业务调用
- 不关心 token 怎么带
- 不关心 refresh 何时发生
- 不重复传 `teamId/projectId`
