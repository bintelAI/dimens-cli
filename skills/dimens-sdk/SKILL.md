---
name: dimens-sdk
slug: dimens-sdk
description: 用于维表智联开发者接入，适合 Web/H5、BFF、Node.js、移动端、HTTP API、@bintel/dimens-cli SDK、token 刷新、密钥存放、上下文传递和资源调用代码集成问题。
version: 1.0.2
author: 方块智联工作室
tags: [sdk, http, web, mobile, integration, dimens-cli]
---

# SDK 接入技能（dimens-sdk）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 当前技能只负责 SDK、HTTP API、Web、BFF、Node.js、移动端接入。
- ✅ 完整系统规划先用 `dimens-system-orchestrator`。
- ✅ 项目内资源创建、权限、报表、工作流等业务操作先用 `dimens-manager`。
- ✅ 如果是维表自定义页面、Wujie 嵌入页面或明确基于 `dimens-web` 脚手架开发，前端方案必须优先读取 `references/dimens-web-scaffold.md`，不要重新生成一套通用 auth/storage/sdk/retry 分层。
- ✅ 如果是维表自定义页面开发，必须把 UI/UX 设计作为前置步骤：先确认是否已安装 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`），未安装时先安装；安装或可用后，先用该技能完成页面风格、配色、布局、组件、图表和交互状态设计，再进入 `dimens-web` 脚手架编码。
- ✅ 如果用户提到微模块页面、按钮插件、视图插件、Wujie props、`sourceLocation`、`viewState`、`actionSnapshot`、按钮弹窗或抽屉，必须继续读取 `references/micro-module-wujie-context.md`，按“页面 / 视图 / 按钮”三类上下文协议输出。
- ✅ 每次准备使用 `dimens-cli` 前，必须先在当前终端执行 `npm -g install @bintel/dimens-cli@latest` 升级全局 CLI；升级成功后再执行 `dimens-cli --version` 或 `dimens-cli --help` 确认可用，确保用户每次使用的都是最新版本。
- ✅ 新增自定义页面但没有目标目录时，先询问或建议用 `dimens-cli create --dir <目录名>` 初始化脚手架；已有目录则先检查目录结构，不要重复创建。
- ✅ 自定义页面新增业务页默认使用 `/xxx` 独立路由；不要改 `/` 根页面，不要覆盖 `/custom`、`/records`、`/settings`、`/embed`、`/debug/context` 等既有示例、配置或调试页面。
- ✅ 自定义页面不等用户显式要求“好看”才做设计；所有新增或改造业务页面都先使用 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`）产出 UI/UX 方案，再基于 `dimens-web` 脚手架实现。
- ✅ Windows 下生成中文示例代码、Markdown、JSON 或脚本文件时，必须遵守 `../windows-utf8.md`：统一 UTF-8 写入，写完读回检查，避免中文变成 `??`。
- ✅ 浏览器端和移动端不要明文保存 `apiSecret`；涉及 API Secret 默认放服务端或 BFF 换 token。
- ✅ 调试、验证、资源管理优先给 `dimens-cli` 命令行路径；只有在用户明确要做端侧集成、CLI 未覆盖能力或需要说明代码调用时，再补充 SDK / HTTP / 自定义 URL 方案。
- ✅ API Key 登录返回的是现有用户 token，不是独立开放平台权限体系。
- ✅ `teamId` 是团队隔离边界，`projectId` 是项目内资源上下文，不能漏传或混传。
- ✅ 当用户消息或当前页面携带维表 URL 时，先从 URL 解析上下文。格式 `http://localhost:3000/#/{teamId}/{projectId}/{sheetId}`；例如 `http://localhost:3000/#/TTFFEN/PM394YD/sh_lTyerp8gwW8QSVD1` 表示 `teamId=TTFFEN`、`projectId=PM394YD`、`sheetId=sh_lTyerp8gwW8QSVD1`。用户说“当前页面/当前表/这个表”时优先用这些 ID 连接维表。
- ✅ 所有更新类接口统一按“先拿数据 -> 改数据 -> 更新数据”设计调用链。
- ✅ 先判断密钥应该放在哪里：浏览器和移动端只拿短期 token，`apiSecret` 默认只在服务端或 BFF。
- ✅ 代码示例必须带出失败处理边界：401 刷新、403 权限不足、404 上下文或资源 ID 错误。
- ✅ 涉及 `sdk.ai.models/generateImage/createVideo/getVideo/getVideoContent` 时，必须继续读取 `references/ai-examples.md` 和 `references/capability-status.md`；先核对当前包版本、源码签名与脱敏真实响应，再决定解包层级。
- ✅ AI 原始响应在 SDK 边界按 `unknown` 归一化；业务组件只消费稳定业务对象，不直接固定读取 `response.data.data`，也不靠类型断言掩盖运行时差异。

## 职责边界

| 问题类型 | 应使用技能 |
| --- | --- |
| 完整系统、平台、管理应用的规划和拆解 | `dimens-system-orchestrator` |
| 项目内资源创建、配置、更新、排查 | `dimens-manager` |
| SDK、HTTP API、Web/BFF/Node.js/移动端接入 | `dimens-sdk` |
| 维表自定义页面、Wujie 嵌入、`dimens-web` 脚手架开发 | `references/dimens-web-scaffold.md` |

## 快速路由表

| 接入场景 | 入口文档 | 说明 |
| --- | --- | --- |
| 维表自定义页面 / Wujie / `dimens-web` | `references/dimens-web-scaffold.md` | 基于脚手架已有运行上下文、SDK、token retry 和宿主事件开发 |
| 页面 / 视图 / 按钮三类微模块 | `references/micro-module-wujie-context.md` | 统一 `usageScene/mountLocation/sourceLocation`、`viewState`、`actionSnapshot`、弹窗/抽屉传参 |
| 前端 / Web / H5 | `references/frontend/overview.md` | 登录态、token、refresh、HTTP 直连、React/Vue 代码组织 |
| BFF / 服务端代理 | `references/bff/overview.md` | 服务端代管密钥、换 token、代理资源调用 |
| Node.js SDK | `references/node/overview.md` | `@bintel/dimens-cli` SDK、脚本、服务端任务 |
| 移动端 / 小程序 | `references/mobile/overview.md` | App 不直持密钥，端上只拿短期 token 或调自家服务端 |
| 资源域调用 | `references/resources/overview.md` | 表格、文档、报表、权限、画布、AI 等代码调用 |
| 文件与媒体 | `references/media/overview.md` | 上传图片、附件、封面后写入业务资源 |
| 接入路径选择 | `references/integration-paths.md` | SDK、HTTP、BFF 的选型边界 |
| 当前 SDK 能力 | `references/capability-status.md` | 判断能否直接用 SDK |
| AI 模型与媒体 | `references/ai-examples.md` | 模型列表、图片结果、视频任务、内容资源和兼容解包 |

## 默认处理顺序

1. 先判断接入位置：`dimens-web` 自定义页面、普通浏览器、移动端、BFF、Node.js 服务端。
2. 只要后续会执行或给出 `dimens-cli` 命令，先执行 `npm -g install @bintel/dimens-cli@latest`，再用 `dimens-cli --version` 或 `dimens-cli --help` 验证。
3. 如果是 `dimens-web` 自定义页面，先确认/安装并调用 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`）完成页面设计口径，再读 `references/dimens-web-scaffold.md`，判断目标目录是否已存在；没有目录时使用 `dimens-cli create --dir <目录名>` 初始化，再基于脚手架已有 `useDimens / runtimeStore / appSdk / retry` 输出方案。
4. 如果是页面、视图、按钮三类微模块或 Wujie 宿主传参问题，继续读 `references/micro-module-wujie-context.md`，先区分定义级 `usageScene/mountLocation` 和运行时 `sourceLocation`，再输出 demo props。
5. 再判断认证方式：用户登录 token、API Key 换 token、服务端代管 token。
6. 明确 `baseUrl / teamId / projectId` 的来源和传递方式。
   - 如果有 `/#/{teamId}/{projectId}/{sheetId}` 页面 URL，直接说明并复用 URL 中的上下文；只在缺段或冲突时追问。
7. 先读对应 `overview.md`，再按资源域选择 table / document / report / upload / canvas / ai 示例。
8. 先用 `dimens-cli` 给出可验证的调试路径，再给 SDK / HTTP 代码。
9. 更新类接口必须先读取当前数据，再合并目标字段。
10. 涉及文件、图片、封面、附件，先上传拿 `url`，再写回业务数据。
11. 输出代码前说明密钥存放位置、token 刷新策略和最小验证命令。

## 输出契约

处理接入开发问题时，默认输出下面 5 类信息：

1. `接入位置`：浏览器、移动端、BFF、Node.js 服务端或混合架构。
2. `认证方案`：token 来源、刷新方式、`apiSecret` 存放边界。
3. `上下文传递`：`baseUrl/teamId/projectId` 从哪里来，是否允许用户切换。
4. `调用示例`：优先最小可运行片段，不把多个资源域混成一个模板。
5. `调试验证`：给出 `dimens-cli` 命令或 HTTP 断言，覆盖 401、403、404 的判断。

自定义页面开发还要输出 UI/UX 前置结果和目录决策：先说明已确认/安装并使用 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`）完成页面设计口径，再说明使用已有目录、需要新建目录，或建议执行 `dimens-cli create --dir <目录名>`；同时说明新增业务页应使用 `/xxx` 独立路由，不改根页和既有示例/测试页；如果用户说明项目已热加载运行，不要重复建议启动新的 `pnpm run dev`。

如果用户的问题本质是项目内资源管理，转交 `dimens-manager`；如果是完整系统搭建，转交 `dimens-system-orchestrator`。

## 高风险跑偏点

- 不要在 Windows 下用 `cmd echo`、默认重定向或未指定编码的 PowerShell 写中文示例文件；优先用 Node.js `fs.writeFileSync(file, content, "utf8")`。
- 不要把 `apiSecret` 放进浏览器端或 App 包体。
- 不要在 `dimens-web` 脚手架内重复生成通用 `dimens-storage.ts / dimens-auth.ts / dimens-sdk.ts / dimens-request.ts`，脚手架已经有运行上下文、SDK 聚合和 retry。
- 不要在没有确认目标目录时开始新增页面；没有目录先建议 `dimens-cli create --dir <目录名>`，已有脚手架则直接改现有工程。
- 不要为了新增业务页改 `/` 根路由或覆盖 `/custom`、`/records`、`/settings`、`/embed`、`/debug/context`；使用 `/xxx` 独立路由直达。
- 不要把页面、视图、按钮三类微模块混成一份入参；页面用 `PROJECT_MENU`，视图用 `SHEET_VIEW + viewState`，按钮用 `ROW_BUTTON_MODAL/CELL_BUTTON_MODAL + actionSnapshot`。
- 不要把 `viewState.displayRows` 或 `actionSnapshot.rowSnapshot` 当成权威数据；它们只是轻量快照，完整/最新数据必须走 SDK/API 拉取。
- 不要只依赖后端 `keyword` 搜索按钮微模块；字段配置保存 `pluginId = code` 时，运行器需要按 `moduleCode/code/id/name` 做前端精确匹配或兜底列表查询。
- 不要在自定义页面没有设计口径时直接堆 UI；先确认/安装并使用 `ui-ux-pro-max-plus` 确定风格、配色、排版、图表和 UX 模式。
- 不要把 SDK 接入问题误当成系统设计问题。
- 不要只按 TypeScript 声明固定读取 AI 响应层级；当前不同入口可能返回业务对象、数组或带 `data` 的包装，必须在 SDK 边界按真实响应归一化。
- 不要把业务引擎代码直接当作 AI `model`；优先使用运行时模型列表返回的 `id`，列表为空且后端支持默认模型注入时才传 `default`。
- 不要把生产环境 AI 客户端未初始化静默伪装成 mock 成功；应显示未就绪状态，测试替身只在显式测试环境注入。
- 不要让视频任务只判断单个成功状态或无限轮询；必须同时处理成功、失败、总超时、取消和未知结构。
- 不要在用户已给出维表页面 URL 时继续追问完整上下文；先解析 `teamId/projectId/sheetId`，缺失部分再补问。
- 不要用一个“万能请求模板”混掉表格、文档、报表、工作流的不同上下文。
- 不要跳过 `version/baseVersion` 并发控制直接更新行、文档或画布。
- 不要把 `chat/completions` 当成完整工作流管理接口。
- 不要认为登录成功就自动拥有项目、表格、报表权限。

## 常见错误与修正

| 错误 | 修正 |
| --- | --- |
| 前端直接保存 `apiSecret` | 改为服务端或 BFF 换 token |
| 基于 `dimens-web` 开发时又重写一套前端 SDK 层 | 使用 `references/dimens-web-scaffold.md`，复用 `useDimens()`、`appSdk.ts`、`runtimeStore` |
| 新增自定义页面时不知道目录 | 先询问是否新建目录，推荐 `dimens-cli create --dir <目录名>`；已有目录则先检查再开发 |
| 登录成功但读不到资源 | 检查团队成员、项目授权、角色权限 |
| 同一 token 调项目成功但调表失败 | 补齐 `teamId / projectId / sheetId` 上下文 |
| 用户说当前页面但只给 URL | 从 `/#/{teamId}/{projectId}/{sheetId}` 解析上下文后再调用 SDK/API |
| 行更新偶发失败 | 先查当前版本，再提交更新 |
| 报表创建后找不到 `reportId` | 菜单报表创建返回的 `sheetId` 就是 `reportId` |
| `response.data.data` 为 `undefined`，模型或图片为空 | 记录版本和脱敏真实响应，在 SDK 边界兼容响应本身、`data` 与嵌套 `data`，页面只消费归一化结果 |
| 视频任务拿不到 ID 或成功后没有 URL | 兼容任务包装与 `resource.url/resource.key`，未知结构明确失败并保留脱敏诊断，不静默吞错 |
| 更新 SDK 后 Vite 行为仍像旧版本 | 先确认锁文件和实际解析版本；确需清缓存时把旧缓存迁入项目根 `backupDel/`，并只在没有可复用热加载进程或用户确认后重启原服务 |

## 干跑测试样本

维护本技能时使用 `test-prompts.json` 做 dry-run 复测，至少覆盖：

- BFF 代管 API Secret 并给前端 token。
- React / Web 端处理 token 刷新和资源上下文。
- Node.js 服务端读取表格、文档、报表或 AI 能力。

## 参考文档

- `../windows-utf8.md`
- `references/integration-paths.md`
- `references/capability-status.md`
- `references/dimens-web-scaffold.md`
- `references/micro-module-wujie-context.md`
- `references/examples.md`
- `references/frontend-quickstart.md`
- `references/frontend/overview.md`
- `references/frontend-auth-flow.md`
- `references/react-auth-example.md`
- `references/sdk-best-practices.md`
- `references/request-retry-example.md`
- `references/bff/overview.md`
- `references/node/overview.md`
- `references/mobile/overview.md`
- `references/resources/overview.md`
- `references/media/overview.md`
- `references/web-examples.md`
- `references/mobile-examples.md`
- `references/bff-examples.md`
- `references/upload-examples.md`
- `references/table-examples.md`
- `references/document-examples.md`
- `references/report-examples.md`
- `references/ai-examples.md`
