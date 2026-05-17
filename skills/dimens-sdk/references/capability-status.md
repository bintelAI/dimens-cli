# 当前 SDK 能力状态

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
- `view`
- `row`
- `rowPolicy`
- `rowAcl`
- `ai`
- `upload`

## 当前适合直接使用 SDK 的场景

- 项目创建与查询
- 表格、字段、行数据基础调用
- 文档读写与版本恢复
- 报表创建、查询、组件管理
- 画布创建、保存、版本、资源市场调用
- 角色、权限、行级策略、行级 ACL 调用
- AI 聊天兼容调用
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
- `ColumnSDK`
- `DocumentSDK`
- `ViewSDK`
- `RowSDK`
- `RowPolicySDK`
- `RowAclSDK`
- `FlowChatSDK`
- `UploadSDK`

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

## 不要默认假设

- 不要默认假设 SDK 等于完整开放平台
- 不要默认假设所有服务端接口都已经封装成稳定 SDK
- 不要默认假设聊天兼容接口等于完整工作流管理接口

## 最小验证链路

接入问题排查时，先用 CLI 验证基础条件，再进入代码：

```bash
dimens-cli auth status
dimens-cli project info PROJECT_ID --team-id TEAM_ID
dimens-cli sheet info SHEET_ID --team-id TEAM_ID --project-id PROJECT_ID
dimens-cli report info REPORT_ID --project-id PROJECT_ID
dimens-cli upload mode
```

如果 CLI 都无法读取目标资源，优先排查 token、团队成员、项目权限和资源 ID，不要先改 SDK 代码。
