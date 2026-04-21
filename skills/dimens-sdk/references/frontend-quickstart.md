# 前端接入快速开始

## 1. 先看这页就够了

如果你是前端开发者，第一次接入 `dimens-sdk`，先不要把所有文档都看一遍。

按下面顺序就行：

1. 先理解登录与 token 主链
2. 再看 React / Vue 怎么落代码
3. 再看最佳实践，避免踩坑
4. 最后补 401 / refresh / retry

对应文档：

- 登录与 token 主链：`references/frontend-auth-flow.md`
- React / Vue 示例：`references/react-auth-example.md`
- 最佳实践：`references/sdk-best-practices.md`
- refresh / retry：`references/request-retry-example.md`

## 2. 你最终要实现的目标

前端项目里，最终应该落成这条链：

```text
login -> save token -> createAuthedSdk(teamId, projectId) -> createDimensAppSdk(teamId, projectId) -> page call app sdk -> 401 refresh -> retry -> logout
```

也就是说：

- 登录后要把 `token / refreshToken` 存本地
- 初始化时就把 `teamId / projectId` 写进去
- 页面层后面直接调用你封装好的方法
- 页面层不再每次自己传 `teamId / projectId`

## 3. 第一步：先把登录态链跑通

你最先要落的文件一般是：

```text
src/lib/dimens-storage.ts
src/lib/dimens-auth.ts
src/lib/dimens-sdk.ts
```

最小目标：

1. 能登录
2. 能把 token 存到本地
3. 能从本地恢复登录态
4. 能退出登录时清空本地状态

如果这一步还没完成，不要急着写表格、文档、报表接口。

必看：

- `references/frontend-auth-flow.md`

## 4. 第二步：初始化时写入 teamId / projectId

这是你当前最关心的关键点。

推荐做法不是：

- 每个接口都手传 `teamId`
- 每个接口都手传 `projectId`

推荐做法是：

1. 先创建带 token 的底层 SDK
2. 再创建带 `teamId / projectId` 的应用级 SDK
3. 页面层只调用应用级 SDK

核心目标：

```ts
const dimens = createDimensAppSdk({
  teamId,
  projectId,
});
```

后面页面层直接这样用：

```ts
await dimens.project.page({ page: 1, size: 20 });
await dimens.row.page(sheetId, { page: 1, size: 20 });
await dimens.document.info(documentId);
```

必看：

- `references/frontend-auth-flow.md`
- `references/react-auth-example.md`

## 5. 第三步：业务接口按资源域拆开

不要做一个“万能请求器”把所有逻辑堆进去。

推荐至少拆成：

```text
src/api/project.ts
src/api/sheet.ts
src/api/document.ts
src/api/report.ts
src/api/ai.ts
```

目的：

- 项目接口看项目
- 表格接口看表格
- 文档接口看文档
- 报表接口看报表
- AI 接口看 AI

这样后续你排查问题时，能快速知道上下文应该挂在哪。

必看：

- `references/react-auth-example.md`
- `references/sdk-best-practices.md`

## 6. 第四步：统一做 refresh / retry

等你基础请求能跑通以后，再把这层补上：

1. 判断是不是鉴权错误
2. 是的话 refresh
3. refresh 成功后重试原请求
4. refresh 失败就 logout

核心目标：

```ts
await withDimensRetry(() =>
  dimens.project.page({
    page: 1,
    size: 20,
  })
);
```

必看：

- `references/request-retry-example.md`

## 7. 第五步：再接具体业务域

等上面 4 步都稳定以后，再继续接：

- 多维表格：`references/table-examples.md`
- 在线文档：`references/document-examples.md`
- 报表：`references/report-examples.md`
- AI：`references/ai-examples.md`

顺序建议：

1. `project`
2. `sheet / row`
3. `document`
4. `report`
5. `ai`

## 8. 最容易犯的错误

- 登录成功了，但没有存 token
- 刷新成功了，但没有覆盖本地旧 token
- 初始化时没有吸收 `teamId / projectId`
- 页面层还在每次手传 `teamId / projectId`
- 把所有请求失败都当成 token 失效
- 行 / 文档更新失败时忽略 `version`
- 把 `apiKey / apiSecret` 放进前端

## 9. 最短执行清单

如果你只想看最短版，就按这个做：

1. 先写 `dimens-storage.ts`
2. 再写 `dimens-auth.ts`
3. 再写 `dimens-sdk.ts`
4. 再写 `dimens-app-sdk.ts`
5. 再写 `project.ts`
6. 跑通项目列表请求
7. 再补 `withDimensRetry`
8. 最后再接表格 / 文档 / 报表 / AI

## 10. 一句话原则

前端接入 `dimens-sdk` 时，先解决登录态，再解决 `teamId/projectId` 初始化，再解决应用级 SDK，再解决 refresh / retry，最后再接具体业务接口。
