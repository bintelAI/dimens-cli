# 接入示例总览

本页不重复解释 SDK 原理，重点解决两个问题：

1. 用户一句话需求进来后，应该先看哪份案例。
2. 每份案例主要解决什么场景，避免读错文档。

如果只是判断“该走前端 / BFF / Node.js / HTTP / dimens-web 哪条路”，先回 `references/integration-paths.md`。如果已经确认接入位置，直接用本页跳到具体案例。

## 一句话找案例

| 用户提问方式 | 先读哪些文件 | 说明 |
| --- | --- | --- |
| “前端能不能直接调维表接口” | `frontend/overview.md`、`web-examples.md` | 适合普通 Web/H5/React/Vue 页面，说明 token、安全边界和最小 fetch 示例 |
| “我在维表自定义页面里怎么读数据” | `dimens-web-scaffold.md`、`micro-module-wujie-context.md` | 适合 `dimens-web` 脚手架、Wujie 微前端和三类微模块 |
| “Node.js / Next.js / BFF 怎么封装 SDK” | `node/overview.md`、`bff-examples.md` | 适合服务端统一封装 token、资源读取、上传和 AI 代理 |
| “移动端 / 小程序怎么安全接入” | `mobile/overview.md`、`mobile-examples.md` | 适合 App、小程序、移动 H5，经由自家服务端代理 |
| “上传图片后怎么写回表格 / 文档 / 画布” | `media/overview.md`、`upload-examples.md` | 适合 upload -> update/save 的两段式链路 |
| “怎么读写表格、字段、视图、行数据” | `resources/overview.md`、`table-examples.md` | 适合项目、表、字段、行的常规接入 |
| “怎么创建或更新在线文档” | `resources/overview.md`、`document-examples.md` | 适合文档详情、更新、版本、Mermaid 流程图 |
| “怎么把 AI 生成的 HTML 写回富文本字段” | `richtext-field-examples.md` | 适合字段写回、预览文本、字段级富文本内容 |
| “怎么创建报表、查组件结果” | `resources/overview.md`、`report-examples.md` | 适合 `reportId/sheetId`、preview、addWidget、queryWidget、query |
| “怎么接 AI 聊天、生图、生视频、Embedding” | `capability-status.md`、`ai-examples.md` | 适合 `sdk.ai` 和维表后端代理 new-api 的能力调用 |
| “不知道该 SDK / HTTP / BFF 哪个更合适” | `integration-paths.md` | 先选路径，再回来读案例 |

## 按端侧查看

### 前端 / Web / H5

- 前端接入总览：`references/frontend/overview.md`
- 前端快速开始：`references/frontend-quickstart.md`
- 浏览器直连与按业务域拆 API：`references/web-examples.md`
- 前端登录与 token 主链：`references/frontend-auth-flow.md`
- React/Vue 登录态示例：`references/react-auth-example.md`
- 请求重试与 refresh 示例：`references/request-retry-example.md`

适合的问题：

- “React 页面怎么拉项目列表”
- “浏览器里 401 / 403 / 404 怎么区分”
- “我已经有 token，怎么按 teamId/projectId 读资源”

### dimens-web / 自定义页面 / Wujie

- 脚手架说明：`references/dimens-web-scaffold.md`
- 页面 / 视图 / 按钮三类微模块上下文：`references/micro-module-wujie-context.md`

适合的问题：

- “我要新增一个维表自定义页面，但还没有目录”
- “我已经有脚手架目录，想加审批详情页”
- “Wujie props / sourceLocation / actionSnapshot 应该怎么传”

### BFF / Node.js / 服务端

- BFF 总览：`references/bff/overview.md`
- Node.js 总览：`references/node/overview.md`
- Node.js / Next.js / BFF 代码示例：`references/bff-examples.md`

适合的问题：

- “BFF 怎么代管 apiSecret 并给前端 token”
- “Node.js 服务端怎么读表格、文档、报表”
- “服务端怎么上传附件后写回业务资源”

### 移动端 / 小程序 / App

- 移动端接入总览：`references/mobile/overview.md`
- 移动端案例：`references/mobile-examples.md`

适合的问题：

- “App 包里能不能放 apiSecret”
- “小程序怎么提交巡检记录”
- “移动端上传图片并写回业务数据怎么做”

## 按业务域查看

### 表格 / 行数据

- 资源域总览：`references/resources/overview.md`
- 多维表格案例：`references/table-examples.md`

适合的问题：

- “怎么创建第一张表”
- “怎么补字段、拉视图、分页查行”
- “怎么更新单元格并处理 version”

### 文档

- 在线文档案例：`references/document-examples.md`

### 富文本字段

- 富文本字段案例：`references/richtext-field-examples.md`

适合的问题：

- “怎么更新富文本内容”
- “怎么追加图片”
- “怎么写 Mermaid 流程图并保留版本”
- “怎么把 AI 生成的 HTML 写回富文本字段”

### 报表

- 报表案例：`references/report-examples.md`

适合的问题：

- “只读报表数据怎么接”
- “怎么创建报表并查询组件”
- “为什么返回里有时候是 sheetId 不是 reportId”

### 上传 / 媒体

- 文件与媒体接入总览：`references/media/overview.md`
- 上传案例：`references/upload-examples.md`

适合的问题：

- “上传文件后怎么写回文档或附件字段”
- “素材库上传为什么必须带 teamId”
- “CDN-first 和普通上传分别什么时候用”

### AI

- 当前能力边界：`references/capability-status.md`
- AI 调用案例：`references/ai-examples.md`

适合的问题：

- “怎么用 sdk.ai 做聊天、生图、生视频”
- “Embedding / Rerank 怎么调”
- “模型列表和默认模型怎么选”

## 推荐阅读顺序

### 第一次接 SDK

1. `references/integration-paths.md`
2. 对应端侧的 `overview.md`
3. `references/capability-status.md`
4. 当前任务命中的 `*-examples.md`

### 第一次接 dimens-web

1. `references/dimens-web-scaffold.md`
2. `references/micro-module-wujie-context.md`
3. 再进入 `table/document/report/upload/ai` 中与页面目标对应的案例

### 已经知道要做什么，只想抄一个最近的案例

- Web/H5：`references/web-examples.md`
- BFF/Node.js：`references/bff-examples.md`
- 移动端：`references/mobile-examples.md`
- 表格：`references/table-examples.md`
- 文档：`references/document-examples.md`
- 报表：`references/report-examples.md`
- 上传：`references/upload-examples.md`
- AI：`references/ai-examples.md`
