# 当前 SDK 能力状态

> **AI 契约提示（基于仓库 `@bintel/dimens-cli` 1.0.15 源码复核）：** `FlowChatSDK` 的 TypeScript 泛型、单元测试夹具和服务端代理的真实返回包装并不完全一致。调用 `models`、图片或视频接口时，先记录包版本和脱敏响应，再按 `unknown` 在 SDK 边界归一化；不要把这里记录的某个历史层级当成永久协议。

## AI 方法与当前边界

| 能力 | 当前 SDK 方法 | 当前实现注意点 |
| --- | --- | --- |
| 模型列表 | `sdk.ai.models(teamId, query)` | `capability` 当前接受能力值或字符串；列表可能出现在响应本身、`data` 或嵌套 `data` |
| 图片生成 | `sdk.ai.generateImage(teamId, payload)` | 图片项至少检查 `url`、`image_url`、`b64_json`，并允许供应商扩展字段 |
| 图片编辑 | `sdk.ai.editImage(teamId, formData)` | 方法是扁平入口，没有 `sdk.ai.images.edit` 命名空间；文件通过 `FormData` 传入 |
| 视频任务 | `sdk.ai.createVideo/getVideo` | 任务可能是直接对象或位于 `data/output/result`；任务 ID 和状态必须按真实响应归一化 |
| 视频内容 | `sdk.ai.getVideoContent` | 当前服务端会保存到团队空间并返回 `resource`；兼容历史 URL 字段，但优先读取 `resource.url/resource.key` |

模型列表是运行时、团队和 capability 相关事实。不要在技能中永久写死某一批模型 ID；展示名可按实际字段使用 `description || name || id`，提交时使用返回的真实 `id`。列表为空不等于接口永久不可用：若当前后端支持默认模型注入，可传 `model: "default"`，否则应显示不可用状态。

## 已封装业务域

- `auth`
- `canvas`
- `column`
- `document`
- `permission`
- `project`
- `report`
- `role`
- `sheet`
- `team`
- `view`
- `row`
- `rowPolicy`
- `rowAcl`
- `ai`
- `upload`
- `user`

## 当前适合直接使用 SDK 的场景

- 当前用户信息读取
- 团队详情与团队成员列表读取
- 项目创建与查询
- 表格、字段、行数据基础调用
- 文档读写与版本恢复
- 报表创建、查询、组件管理
- 画布创建、保存、版本、资源市场调用
- 角色、权限、行级策略、行级 ACL 调用
- AI 聊天、模型列表、图片、视频、音频、Embedding、Rerank 代理调用；媒体结果须在 SDK 边界归一化
- 文件上传

## 聚合导出

当前包入口导出：

- `createSDK`
- `DimensSDK`
- `DimensClient`
- `AuthSDK`
- `CanvasSDK`
- `ProjectSDK`
- `ReportSDK`
- `RoleSDK`
- `PermissionSDK`
- `SheetSDK`
- `TeamSDK`
- `ColumnSDK`
- `DocumentSDK`
- `ViewSDK`
- `RowSDK`
- `RowPolicySDK`
- `RowAclSDK`
- `FlowChatSDK`
- `UploadSDK`
- `UserSDK`

## 用户与团队上下文能力

当前用户信息：

| 入口 | 方法 / 命令 | 接口 |
| --- | --- | --- |
| SDK | `sdk.auth.me()` | `GET /app/user/info/person` |
| SDK | `sdk.user.me()` | `GET /app/user/info/person` |
| CLI | `dimens-cli auth me` | `GET /app/user/info/person` |
| CLI | `dimens-cli user me` | `GET /app/user/info/person` |

团队信息与成员：

| 入口 | 方法 / 命令 | 接口 |
| --- | --- | --- |
| SDK | `sdk.team.info(teamId)` | `GET /app/org/:teamId/team/info` |
| SDK | `sdk.team.members(teamId, query?)` | `GET /app/org/:teamId/team_user/list` |
| SDK | `sdk.team.userList(teamId, query?)` | `GET /app/org/:teamId/team_user/list` |
| CLI | `dimens-cli team info --team-id TEAM1` | `GET /app/org/:teamId/team/info` |
| CLI | `dimens-cli team users --team-id TEAM1 [--project-id PROJ1] [--keyword 张三]` | `GET /app/org/:teamId/team_user/list` |

注意：

- `team users --keyword` 在 CLI 层会对返回成员做本地过滤，避免后端只读取 `projectId` 时关键词无效。
- `auth use-team` 只写入本地默认 `teamId`，不等于读取团队详情；需要校验团队真实存在时使用 `team info`。
- 登录返回的 `userInfo` 只能代表登录响应里的快照；需要当前用户详情时使用 `auth me` / `user me` / `sdk.user.me()`。

`@bintel/dimens-cli` 的 Node.js 要求是 `>=20`。

## 接入方式选择

| 场景 | 推荐路径 | 原因 |
| --- | --- | --- |
| Web / H5 已有用户 token | 前端 HTTP 或应用级 SDK 封装 | 不暴露 `apiSecret`，页面只消费短期 token |
| React / Vue 需要完整登录态 | 前端封装 auth + app sdk + retry | 统一处理 token、`teamId/projectId` 和 401 |
| BFF / SSR / Node.js 服务端 | 直接使用 SDK | 适合集中保存密钥、记录日志、封装重试 |
| App / 小程序 | 服务端换 token，端上只拿短期 token | 避免把 `apiSecret` 打进包体 |
| 只做资源运维或排查 | 先用 `dimens-cli` 命令 | 更容易验证认证、上下文和权限问题 |

## 使用时必须注意

- `baseUrl` 默认通常为 `https://dimens.bintelai.com/api`
- token 需要调用方自行管理
- `teamId/projectId` 不是所有接口都能自动推断，很多时候需要显式传入
- 行和单元格更新时要关注 `version`
- 文档更新要关注 `version`
- 画布保存要关注 `baseVersion`
- 写接口示例时必须说明 401、403、404 分别如何排查
- 更新类能力默认按“先读当前数据 -> 合并目标字段 -> 提交更新”设计
- AI 示例不得固定读取 `response.data.data`；必须先按当前版本和真实响应复核包装层

## 不要默认假设

- 不要默认假设 SDK 等于完整开放平台
- 不要默认假设所有服务端接口都已经封装成稳定 SDK
- 不要默认假设聊天兼容接口等于完整工作流管理接口
- 不要默认假设 TypeScript 泛型、测试夹具和线上代理返回始终同层

## 最小验证链路

接入问题排查时，先用 CLI 验证基础条件，再进入代码：

```bash
dimens-cli auth status
dimens-cli auth me
dimens-cli team info --team-id TEAM_ID
dimens-cli team users --team-id TEAM_ID
dimens-cli project info PROJECT_ID --team-id TEAM_ID
dimens-cli sheet info SHEET_ID --team-id TEAM_ID --project-id PROJECT_ID
dimens-cli report info REPORT_ID --project-id PROJECT_ID
dimens-cli upload mode
```

如果 CLI 都无法读取目标资源，优先排查 token、团队成员、项目权限和资源 ID，不要先改 SDK 代码。
