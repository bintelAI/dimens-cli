---
name: dimens-sdk
slug: dimens-sdk
description: 用于维表智联 SDK、HTTP API、Web、BFF、Node.js 和移动端接入开发，适合处理认证、token、上下文传递与资源调用集成问题。
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
- ✅ Windows 下生成中文示例代码、Markdown、JSON 或脚本文件时，必须遵守 `../windows-utf8.md`：统一 UTF-8 写入，写完读回检查，避免中文变成 `??`。
- ✅ 浏览器端和移动端不要明文保存 `apiSecret`；涉及 API Secret 默认放服务端或 BFF 换 token。
- ✅ 调试、验证、资源管理优先给 `dimens-cli` 命令行路径；只有在用户明确要做端侧集成、CLI 未覆盖能力或需要说明代码调用时，再补充 SDK / HTTP / 自定义 URL 方案。
- ✅ API Key 登录返回的是现有用户 token，不是独立开放平台权限体系。
- ✅ `teamId` 是团队隔离边界，`projectId` 是项目内资源上下文，不能漏传或混传。
- ✅ 所有更新类接口统一按“先拿数据 -> 改数据 -> 更新数据”设计调用链。
- ✅ 先判断密钥应该放在哪里：浏览器和移动端只拿短期 token，`apiSecret` 默认只在服务端或 BFF。
- ✅ 代码示例必须带出失败处理边界：401 刷新、403 权限不足、404 上下文或资源 ID 错误。

## 职责边界

| 问题类型 | 应使用技能 |
| --- | --- |
| 完整系统、平台、管理应用的规划和拆解 | `dimens-system-orchestrator` |
| 项目内资源创建、配置、更新、排查 | `dimens-manager` |
| SDK、HTTP API、Web/BFF/Node.js/移动端接入 | `dimens-sdk` |

## 快速路由表

| 接入问题 | 优先文档 | 说明 |
| --- | --- | --- |
| 选择 SDK、HTTP、BFF 哪条路径 | `references/integration-paths.md` | 先定接入架构 |
| 当前 SDK 支持哪些能力 | `references/capability-status.md` | 判断能否直接用 SDK |
| 前端首次接入 | `references/frontend-quickstart.md` | 阅读顺序和最小接入链路 |
| 登录、token、刷新、失效处理 | `references/frontend-auth-flow.md` | 前端和端侧认证主链 |
| React / Vue 类项目落地 | `references/react-auth-example.md` | 前端代码组织示例 |
| 请求重试、401、refresh、logout | `references/request-retry-example.md` | token 失效处理 |
| Web / H5 直连 | `references/web-examples.md` | 前端模块封装案例 |
| App / 小程序 | `references/mobile-examples.md` | 移动端安全接入 |
| BFF / SSR / 服务端代理 | `references/bff-examples.md` | 服务端代管密钥和 token |
| 表格、字段、视图、行 | `references/table-examples.md` | 多维表格资源调用 |
| 文档、富文本、版本 | `references/document-examples.md` | 在线文档接入 |
| 报表、组件、查询 | `references/report-examples.md` | 报表接入；注意 `reportId=sheetId` 的菜单报表创建口径 |
| AI 对话、总结、分析 | `references/ai-examples.md` | chat/completions 兼容调用 |

## 默认处理顺序

1. 先判断接入位置：浏览器、移动端、BFF、Node.js 服务端。
2. 再判断认证方式：用户登录 token、API Key 换 token、服务端代管 token。
3. 明确 `baseUrl / teamId / projectId` 的来源和传递方式。
4. 按资源域选择 table / document / report / ai 示例。
5. 先用 `dimens-cli` 给出可验证的调试路径，再给 SDK / HTTP 代码。
6. 更新类接口必须先读取当前数据，再合并目标字段。
7. 涉及文件、图片、封面、附件，先上传拿 `url`，再写回业务数据。
8. 输出代码前说明密钥存放位置、token 刷新策略和最小验证命令。

## 输出契约

处理接入开发问题时，默认输出下面 5 类信息：

1. `接入位置`：浏览器、移动端、BFF、Node.js 服务端或混合架构。
2. `认证方案`：token 来源、刷新方式、`apiSecret` 存放边界。
3. `上下文传递`：`baseUrl/teamId/projectId` 从哪里来，是否允许用户切换。
4. `调用示例`：优先最小可运行片段，不把多个资源域混成一个模板。
5. `调试验证`：给出 `dimens-cli` 命令或 HTTP 断言，覆盖 401、403、404 的判断。

如果用户的问题本质是项目内资源管理，转交 `dimens-manager`；如果是完整系统搭建，转交 `dimens-system-orchestrator`。

## 高风险跑偏点

- 不要在 Windows 下用 `cmd echo`、默认重定向或未指定编码的 PowerShell 写中文示例文件；优先用 Node.js `fs.writeFileSync(file, content, "utf8")`。
- 不要把 `apiSecret` 放进浏览器端或 App 包体。
- 不要把 SDK 接入问题误当成系统设计问题。
- 不要用一个“万能请求模板”混掉表格、文档、报表、工作流的不同上下文。
- 不要跳过 `version` 并发控制直接更新行或文档。
- 不要把 `chat/completions` 当成完整工作流管理接口。
- 不要认为登录成功就自动拥有项目、表格、报表权限。

## 常见错误与修正

| 错误 | 修正 |
| --- | --- |
| 前端直接保存 `apiSecret` | 改为服务端或 BFF 换 token |
| 登录成功但读不到资源 | 检查团队成员、项目授权、角色权限 |
| 同一 token 调项目成功但调表失败 | 补齐 `teamId / projectId / sheetId` 上下文 |
| 行更新偶发失败 | 先查当前版本，再提交更新 |
| 报表创建后找不到 `reportId` | 菜单报表创建返回的 `sheetId` 就是 `reportId` |

## 干跑测试样本

维护本技能时使用 `test-prompts.json` 做 dry-run 复测，至少覆盖：

- BFF 代管 API Secret 并给前端 token。
- React / Web 端处理 token 刷新和资源上下文。
- Node.js 服务端读取表格、文档、报表或 AI 能力。

## 参考文档

- `../windows-utf8.md`
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
