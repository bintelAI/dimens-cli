---
name: dimens-sdk
slug: dimens-sdk
description: 用于维表智联 Node.js SDK 与 Web/H5/App HTTP 对接开发，适合指导前端、移动端、BFF 和服务端完成认证、上下文传递与资源调用接入。
version: 1.0.0
author: 方块智联工作室
tags: [sdk, http, web, mobile, integration, dimens-cli]
---

# SDK 接入技能（dimens-sdk）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 这个技能同时覆盖两条接入路径：`Node.js SDK` 与 `Web/H5/App 直接走 HTTP`
- ✅ `@bintel/dimens-cli` 当前更适合作为 `Node.js / SSR / BFF / 中台服务` 的 SDK 封装，不应默认直接塞进浏览器端明文持有密钥
- ✅ 如果用户明确是在做前端对接，优先回答“如何登录、如何存 token、如何让后续接口自动带 token、如何处理 token 失效”，不要继续泛化成平台模板设计
- ✅ Web 端和移动端如果直接调用 HTTP 接口，必须先明确认证方案，优先区分“用户登录态 token”与“API Key 换 token”
- ✅ `teamId` 是大多数业务接口的上游隔离边界，`projectId` 是项目内资源调用的核心上下文，不能漏传或混传
- ✅ API Key 登录成功后返回的是现有用户 token，不是独立开放平台 token，也不是新的权限体系
- ✅ 移动端 / Web 端如果要直连接口，必须优先评估密钥暴露风险；只要涉及 `apiSecret`，默认建议放到服务端或 BFF 侧换 token
- ✅ 表格、文档、报表、工作流虽然都能接入，但它们的接口前缀、上下文参数和调用主链并不一样，不能混成一个“万能请求模板”
- ✅ 行和单元格更新链路存在 `version` 并发控制要求，SDK 或 HTTP 接入时不能跳过
- ✅ 所有更新类接口统一按“先拿数据 -> 改数据 -> 更新数据”设计调用链；不要默认直接提交局部 patch
- ✅ 涉及文件、图片、封面时，统一先走上传接口拿 `url`，再把 `url` 写回当前业务数据后更新
- ✅ 如果用户目标是“生成系统并自动规划表、权限、报表”，优先回到 `dimens-system-orchestrator`，不要把 SDK 接入问题误当成系统设计问题

## 命令维护表

| 命令 / 路径 | 作用 | 必填参数 | 常用可选 | 细节说明 |
| --- | --- | --- | --- | --- |
| `createSDK` / `@bintel/dimens-cli` SDK | 在 Node、BFF、SSR 场景创建统一 SDK 客户端 | `baseUrl`, `token` | `teamId`, `projectId` | 更适合服务端聚合层，不建议默认把高权限密钥直接放浏览器端 |
| 前端二次封装 SDK | 在前端项目里封一层应用级 SDK | `token`, `teamId`, `projectId` | `refresh`, `retry`, `logout` | 推荐初始化时固化 `teamId/projectId`，页面只调用业务封装方法 |
| HTTP 直连业务接口 | 已拿到用户 token 时直接调接口 | `Authorization` | `teamId`, `projectId`, 资源 ID | 适合少量直连；长期维护建议继续封装 SDK 或 BFF |
| `dimens-cli auth api-key-login` / API Key 换 token | 第三方或服务端通过 API Key 换 token | `apiKey`, `apiSecret` | `baseUrl` | 不建议在端上直接保存 `apiSecret`，优先放到服务端或 BFF |
| `sdk.ai.completions` / `/app/flow/:teamId/v1/chat/completions` | 调用 AI 聊天兼容接口 | `teamId`, `messages` | `model`, `temperature`, `stream` | 这是工作流兼容入口，不等于完整工作流管理能力 |
| `sdk.upload` / `/app/base/comm/upload` | 上传文件、图片、封面并获取 `url` | `file` | `teamId`, `projectId`, `scene` | 资源类更新统一先上传拿 `url`，再写回业务数据 |
| `sdk.document.info` + `sdk.document.update` | 读取并更新在线文档 | `teamId`, `projectId`, `documentId` | `content`, `version` | 文档更新统一先读当前内容和 `version`，再修改后更新 |
| `sdk.project.info` + `sdk.project.update` | 读取并更新项目信息 | `teamId`, `projectId` | `name`, `description`, `cover`, `icon` | 项目资源更新也统一遵循“先读再改再更” |
| `sdk.sheet.info` / `sdk.column.list` / `sdk.row.page` + 对应 update | 读取并更新表、字段、行 | `teamId`, `projectId`, 资源 ID | `version`, `config`, `data` | 行和单元格更新链路有 `version`，不能跳过并发控制 |
| `sdk.report.info` + `sdk.report.update` / `sdk.report.widgetUpdate` | 读取并更新报表与组件 | `projectId`, `reportId` 或 `widgetId` | `dataSource`, `dataMapping`, `chartConfig` | 报表和组件更新都先拿当前数据，再合并目标变更 |

### 强调细节

- SDK 和 HTTP 接入只是调用方式不同，不改变业务更新模型；所有更新类接口统一按“拿数据 -> 改数据 -> 更新数据”设计调用链。
- 所有文件、图片、封面、文档附件类资源都统一先走上传拿 `url`，再把 `url` 写回当前业务数据。
- 文档、行、单元格等更新链路要注意 `version`，不能跳过并发控制。
- `apiKey + apiSecret` 只是换 token 的登录方式，不是独立权限体系；登录成功后仍然按用户原权限裁决。
- 前端如果要“初始化一次，后面直接调”，推荐自己再包一层应用级 SDK，不要把底层显式参数调用直接散落在页面里。

## 核心约束

### 1. 接入方式分层

当前推荐按三层理解：

1. 服务端 / BFF 层：优先 `@bintel/dimens-cli` SDK
2. Web / H5 / App 业务层：优先消费自己服务端签发或换得的 token
3. 浏览器 / 移动端直连层：只在确认安全边界成立时再直连 HTTP

判断标准：

- 只要涉及 `apiSecret`、刷新 token、跨团队复用，就不要优先放在纯前端
- 只要涉及聚合多个维表接口、统一错误处理、隐藏业务密钥，就优先放在 BFF
- 只要用户已经有受控的登录态 token，前端可按业务域直接请求 HTTP

### 2. 认证边界

当前接入常见有两条认证链：

1. 用户登录态 token
2. `apiKey + apiSecret -> token`

统一要求：

- API Key 只是换 token 的方式扩展
- 换出的 token 仍然继承原用户权限
- 登录成功不等于自动有资源权限
- 如果接口报无权限，继续排查团队、项目、角色、资源授权

### 3. 上下文边界

多数对接问题不是“接口错了”，而是上下文错了。

优先确认：

1. 当前请求属于哪个 `teamId`
2. 当前资源属于哪个 `projectId`
3. 是否需要 `sheetId` / `documentId` / `reportId` / `flowId`
4. 是命令参数显式传入，还是 SDK 初始化默认值传入

补充说明：

- 团队级资源通常先过 `teamId`
- 项目级资源通常同时依赖 `projectId`
- 表格、文档、报表、工作流接口前缀不同，不能假设只换资源 ID 就能复用同一路径

### 4. SDK 适用边界

当前 `@bintel/dimens-cli` SDK 已封装的主要业务域包括：

- `auth`
- `project`
- `report`
- `role`
- `permission`
- `sheet`
- `column`
- `document`
- `view`
- `row`
- `rowPolicy`
- `rowAcl`
- `ai`
- `upload`

SDK 更适合：

- Node.js 服务端
- Next.js / Nuxt SSR 或 Server Route
- BFF 聚合层
- 自动化脚本
- 内部管理后台服务层

不建议默认理解成：

- 浏览器端长期持有高权限密钥的前端 SDK
- 无服务端中转的 Secret 托管工具

前端项目如果要真正做到“初始化时写一次 `teamId/projectId`，业务层后面直接调用”，推荐模式是：

1. 用底层 `createSDK` 创建带 `token/teamId/projectId` 的 SDK
2. 再包一层前端自己的 `createDimensAppSdk`
3. 页面只调用 `dimens.project.page()`、`dimens.row.page()`、`dimens.document.info()` 这类应用级方法

要明确一点：

- 当前底层 SDK 的 `client` 确实能保存 `teamId/projectId`
- 但仓库里很多底层方法仍然是显式参数签名
- 所以前端层自己再包一层，是当前最稳妥、也最符合你需求的方式

### 5. HTTP 直连边界

Web/H5/App 如果走 HTTP，优先按业务域拆接口：

- 认证：`/login`、`/refreshToken`、`/open/user/login/apiKey`
- 项目：`/app/org/:teamId/project/*`
- 表格：`/app/mul/project/:projectId/sheet/*`
- 文档：`/app/documents/:teamId/:projectId/document/*`
- 报表：`/app/report/:projectId/*`
- AI 聊天兼容：`/app/flow/:teamId/v1/chat/completions`

高风险误区：

- 不要把 `chat/completions` 误认为完整工作流管理 API
- 不要把上传接口和文档更新接口混成一次请求
- 不要在更新行 / 单元格时漏掉 `version`
- 不要在客户端明文长期保存 `apiSecret`
- 不要跳过 `info/get` 直接做更新；统一先拿当前数据，再修改，再 update

## 默认接入建议

### 1. 前端项目

推荐顺序：

1. 先看 `references/frontend-quickstart.md`
2. 跑通登录与 token 持久化
3. 初始化时写入 `teamId / projectId`
4. 创建应用级 SDK
5. 页面只调用封装方法
6. 请求失败统一走 refresh / retry / logout

### 2. 移动端

推荐顺序：

1. 不在客户端保存 `apiSecret`
2. 服务端代管密钥并换 token
3. App 使用受控接口或短期 token

### 3. Node / BFF

推荐顺序：

1. 直接使用 `@bintel/dimens-cli`
2. 按资源域拆服务层
3. 显式处理 `teamId / projectId`

## 必查文档

| Skill / references | 作用 | 什么时候必须看 |
| --- | --- | --- |
| `dimens-key-auth` | API Key / Secret 换 token 与安全边界 | 处理第三方接入、密钥登录时必须看 |
| `dimens-team` | `teamId/projectId` 上下文、团队与项目隔离 | 排查上下文错乱时必须看 |
| `dimens-project` | 项目初始化、项目级资源入口 | 从项目入口开始接入时建议看 |
| `dimens-table` | 表、字段、行、视图主链 | 对接多维表格时建议看 |
| `dimens-report` | 报表主链、组件链、查询链 | 对接报表时建议看 |
| `dimens-workflow` | 工作流挂载、聊天兼容调用与模型边界 | 对接 AI / 工作流时建议看 |
| `references/integration-paths.md` | SDK 与 HTTP 两条路径的选择建议 | 设计接入方案时必须看 |
| `references/capability-status.md` | 当前 SDK 已封装能力与未封装边界 | 判断能不能直接用 SDK 时必须看 |
| `references/examples.md` | 总案例导航与组合调用链 | 需要先快速总览时建议看 |
| `references/frontend-quickstart.md` | 前端首次接入的总流程与阅读顺序 | 用户第一次进入前端对接场景时优先看 |
| `references/frontend-auth-flow.md` | 前端登录、token 存储、自动携带、刷新与失效处理主链 | 用户明确说前端 SDK 对接细节时必须看 |
| `references/react-auth-example.md` | React/Vue 类前端项目里的登录态接入示例 | 用户明确说前端项目里怎么落代码时必须看 |
| `references/sdk-best-practices.md` | 前端对接 dimens-sdk 的最佳实践与坑点 | 用户问推荐做法、注意事项、为什么这样做时必须看 |
| `references/request-retry-example.md` | 401 判断、refresh、请求重试与 logout 串联示例 | 用户明确问 token 失效、自动重试、刷新链路时必须看 |
| `references/web-examples.md` | Web / H5 前端直连与模块封装案例 | 用户明确说 Web 端、H5、前端对接时必须看 |
| `references/mobile-examples.md` | App / 小程序 / 移动端安全接入案例 | 用户明确说移动端、App、小程序对接时必须看 |
| `references/bff-examples.md` | Node.js / Next.js / BFF 服务端代理案例 | 用户明确说服务端中转、BFF、SSR 时必须看 |
| `references/table-examples.md` | 表格、字段、视图、行数据案例 | 用户明确说多维表格、字段、行写入时必须看 |
| `references/document-examples.md` | 在线文档、富文本、版本恢复案例 | 用户明确说文档接入、文档编辑时必须看 |
| `references/report-examples.md` | 报表主资源、组件、预览、查询案例 | 用户明确说报表、图表、看板接入时必须看 |
| `references/ai-examples.md` | AI 聊天兼容接口与摘要调用案例 | 用户明确说 AI 对话、总结、分析时必须看 |

## 使用方式

前端接入优先看：

- `references/frontend-quickstart.md`
- `references/frontend-auth-flow.md`
- `references/react-auth-example.md`
- `references/sdk-best-practices.md`
- `references/request-retry-example.md`

资源域接入优先看：

- `references/table-examples.md`
- `references/document-examples.md`
- `references/report-examples.md`
- `references/ai-examples.md`

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 前端接入时直接把 `apiSecret` 写进包体 | 把服务端认证能力错误下放到端侧 | 改成服务端换 token 或 BFF 代管 |
| SDK 调用成功登录，但读不到项目资源 | token 只代表身份，不代表自动有资源权限 | 继续检查团队成员关系、项目授权、角色配置 |
| 同一个 token 调项目成功，调表格失败 | 漏了 `projectId`、`sheetId`，或应用级 SDK 没有正确吸收上下文 | 按资源域重新核对封装层和参数 |
| 行更新偶发失败 | 忽略了 `version` 乐观锁要求 | 先查当前版本，再提交更新 |
| 以为 `chat/completions` 能管理全部工作流 | 把聊天兼容接口和工作流管理接口混用 | 区分聊天调用与工作流定义 / 挂载 / 运行链路 |
| 浏览器端可用，App 端报鉴权异常 | token 刷新、Header、环境 baseUrl 不一致 | 核对 token 来源、Header、环境地址和刷新逻辑 |

## 参考文档

- `references/integration-paths.md`
- `references/capability-status.md`
- `references/examples.md`
- `references/frontend-quickstart.md`
- `references/frontend-auth-flow.md`
- `references/react-auth-example.md`
- `references/sdk-best-practices.md`
- `references/request-retry-example.md`
- `references/web-examples.md`
- `references/mobile-examples.md`
- `references/bff-examples.md`
- `references/table-examples.md`
- `references/document-examples.md`
- `references/report-examples.md`
- `references/ai-examples.md`
- 如需查看整个 Skill 体系的能力总览，请返回 `dimens-cli/skills/README.md`
