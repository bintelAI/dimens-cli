# SDK / HTTP 接入路径说明

## 1. 什么时候优先用 SDK

优先使用 `@bintel/dimens-cli` SDK 的场景：

- Node.js 服务端
- Next.js / Nuxt 的服务端路由
- BFF 聚合层
- 内部自动化脚本
- 需要统一封装 token、错误处理、重试和日志的场景

如果是维表自定义页面、Wujie 嵌入或用户明确提到 `dimens-web`，优先使用 `dimens-cli/dimens-web` 脚手架的内置 SDK 封装，而不是从零创建前端 SDK 层。入口文档：

- `references/dimens-web-scaffold.md`

核心原因：

- 便于统一 `baseUrl`
- 便于集中处理 `Authorization`
- 便于按资源域拆分服务层
- 更适合隐藏 `apiSecret`

输出方案时必须同时说明：

- token 从哪里来
- `teamId/projectId` 从哪里来
- 401 是否 refresh 后重试
- 403 是否提示权限不足而不是重新登录
- 404 是否检查资源 ID 或项目上下文

## 2. 什么时候可以直接走 HTTP

可以直接走 HTTP 的场景：

- 前端已经拿到了安全来源的用户 token
- 只是消费少量清晰的业务接口
- 团队不希望再维护一层 BFF
- 不涉及在端上长期保存高权限密钥

注意：

- 直接 HTTP 不代表可以把密钥放到浏览器或 App 包里
- 只要需要 `apiKey + apiSecret` 换 token，默认优先放在服务端
- 端侧 HTTP 示例必须只使用已经安全取得的 token

## 3. Web / H5 推荐路径

### 3.1 维表自定义页面

推荐：

1. 使用 `dimens-cli/dimens-web` 脚手架。
2. 宿主通过 Wujie props 或开发配置传入 `teamId/projectId/token/permissions`。
3. 页面通过 `useRuntimeStore` 读取上下文。
4. 页面通过 `useDimens()` 读取项目、表、行、文档、报表或 AI 数据。
5. 如脚手架缺少某资源方法，先补 `src/lib/dimens/resources/*` 和 `appSdk.ts`，再在页面调用。

不推荐：

- 在脚手架里重复实现 auth/storage/sdk/retry。
- 页面组件直接拼 HTTP URL。
- 页面组件直接保存或读取 `apiSecret`。

### 3.2 普通 Web / H5

推荐：

1. 业务系统用户先登录
2. 服务端持有维表认证逻辑
3. 前端拿受控 token 或直接调 BFF
4. 业务代码按项目、表格、文档、报表拆模块

不推荐：

- 浏览器保存 `apiSecret`
- 每个页面各自拼 `baseUrl/teamId/projectId`
- 用一个万能请求函数混合表格、文档、报表、AI 的错误处理

## 4. App / 小程序 推荐路径

推荐：

1. App 不直接持有 `apiSecret`
2. 服务端代管密钥并换 token
3. App 只使用短期 token 或透传接口

## 5. Node.js / BFF 推荐路径

推荐：

1. 安装 `@bintel/dimens-cli`
2. 初始化 `createSDK({ baseUrl, token })`
3. 业务函数显式接收 `teamId/projectId`
4. 按 `project/sheet/document/report/ai` 拆服务

## 6. 路由边界

| 用户输入 | 应走技能 |
| --- | --- |
| “Web 项目调用维表接口读取报表/表格/文档” | `dimens-sdk` |
| “基于 dimens-web 做自定义页面 / Wujie 嵌入页” | `dimens-sdk` -> `references/dimens-web-scaffold.md` |
| “Node 服务端读取行数据并处理 401” | `dimens-sdk` |
| “创建报表、加组件、查 query 结果” | `dimens-manager`，除非明确要代码接入 |
| “生成一个 CRM / 审批系统 / 项目管理平台” | `dimens-system-orchestrator` |
