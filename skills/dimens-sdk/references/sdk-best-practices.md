# dimens-sdk 前端最佳实践

## 1. 先记住一个核心原则

前端对接 `dimens-sdk` 时，最稳定的做法不是“全局创建一个 SDK 然后到处复用”，而是：

1. 登录后把 token 存起来
2. 初始化时把 `teamId/projectId` 一起写进前端封装
3. 页面层只调用你封装好的应用级 SDK
4. 请求失败时按规则处理 refresh 和 logout

这是因为当前 SDK 的 `token` 是初始化时写入的，不是响应式自动更新的。
同时当前仓库里的很多底层方法仍然要求显式 `teamId/projectId` 参数，所以前端最好自己再包一层。

## 2. 推荐做法

### 做法 1：区分公开 SDK 和登录后 SDK

- 公开 SDK：只用于登录、公共接口
- 登录后 SDK：用于项目、表格、文档、报表、AI

### 做法 2：token 存储单独封装

- 不要在页面组件里直接 `localStorage.setItem`
- 统一放到 `dimens-storage.ts`

### 做法 3：API 调用按资源域拆文件

- `project.ts`
- `sheet.ts`
- `document.ts`
- `report.ts`
- `ai.ts`

### 做法 3.1：封一层应用级 SDK

- 初始化时写入 `teamId`
- 初始化时写入 `projectId`
- 页面层不再每次手传这两个参数
- 页面层只调你封装后的 `dimens.project.page()`、`dimens.row.page()` 这类方法

### 做法 4：刷新 token 单独封装

- 不要每个请求文件自己处理 refresh
- 统一放到 `dimens-auth.ts` 或 `dimens-request.ts`

### 做法 5：退出登录一定清缓存

- 清 token
- 清 refreshToken
- 清用户信息
- 跳回登录页

## 3. 不推荐的做法

### 反例 1：应用启动时创建一个永远不更新的 SDK

问题：

- 登录前后状态切换不干净
- token 刷新后 SDK 里仍然是旧 token

### 反例 2：页面里直接写登录、存储、请求三套逻辑

问题：

- 页面职责过重
- 后续维护 refresh 和 logout 很乱

### 反例 3：把 `apiKey/apiSecret` 放浏览器

问题：

- 直接越过安全边界
- 会把服务端能力错误地下放到前端

### 反例 4：所有异常都无脑刷新 token

问题：

- 普通业务错误也会触发 refresh
- 会把真实报错吞掉

### 反例 5：页面里每次都手传 `teamId/projectId`

问题：

- 业务调用冗余
- 很容易有的页面漏传，有的页面传错
- 不符合“初始化时写一次，后面直接调用”的封装目标

### 反例 6：误以为底层 SDK 已自动消费默认 `teamId/projectId`

问题：

- 当前很多方法签名仍然是显式参数风格
- 如果不自己再封一层，页面层还是要一直传

## 4. 最推荐的代码分层

```text
lib/
  dimens-storage.ts
  dimens-auth.ts
  dimens-sdk.ts
  dimens-app-sdk.ts
  dimens-request.ts
api/
  project.ts
  sheet.ts
  document.ts
  report.ts
  ai.ts
```

为什么这样拆：

- `storage` 管本地状态
- `auth` 管登录、刷新、退出
- `sdk` 管实例创建
- `app-sdk` 管 `teamId/projectId` 默认上下文吸收
- `request` 管重试和统一错误
- `api` 管资源域调用

## 5. 关于 token 刷新

推荐顺序：

1. 先识别是不是鉴权错误
2. 是的话调 refresh
3. refresh 成功后重试一次
4. refresh 失败则 logout

不要做：

- 每次请求前都强制 refresh
- 每次报错都 refresh
- refresh 成功后不回写本地 token

## 6. 关于表格 / 文档更新

这些接口除了 token，还要注意：

- 表格行更新要带 `version`
- 单元格更新要带 `version`
- 文档更新要带 `version`
- 所有更新默认先读取当前数据，再修改目标字段，再调用 update

所以不要把所有失败都归因到 token。

## 7. 关于前端状态管理

React / Vue / Zustand / Pinia 都可以，关键不是框架，而是原则：

- 登录态有唯一来源
- token 持久化有唯一来源
- SDK 创建有唯一来源

不要：

- 一半从 store 取 token
- 一半从 localStorage 取 token
- 一半从全局变量取 token

## 8. 关于 baseUrl

推荐只在一个地方定义：

```ts
const baseUrl = 'https://dimens.bintelai.com/api';
```

不要到处散写。

如果要切环境，集中走：

- `.env`
- `config.ts`
- `env.ts`

## 9. 关于业务 API 封装

推荐：

```ts
export async function fetchProjects(teamId: string, projectId: string) {
  const sdk = createDimensAppSdk({ teamId, projectId });
  return sdk.project.page({ page: 1, size: 20 });
}
```

不推荐：

```ts
export async function fetchAnything(path: string, body: unknown) {
  // 万能请求器
}
```

原因：

- 可读性差
- 上下文边界不清晰
- 团队和项目参数容易混乱

## 10. 最容易踩的坑

- 登录成功后没落本地存储
- 刷新成功后没覆盖旧 token
- 还在复用旧 SDK 实例
- 没在应用级 SDK 初始化时吸收 `teamId/projectId`
- 把行更新失败都误判成 token 失效
- 把 API Key 直接暴露给浏览器

## 11. 最终建议

如果用户是前端开发者，优先给他的不是“平台大图”，而是这五件事：

1. 登录怎么做
2. token 怎么存
3. `teamId/projectId` 在哪里初始化一次
4. SDK 怎么二次封装
5. 请求失败怎么处理

只要这五件事讲清楚，用户就能自己继续对接项目、表格、文档、报表和 AI。 
