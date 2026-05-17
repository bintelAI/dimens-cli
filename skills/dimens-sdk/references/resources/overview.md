# 资源域接入总览

## 适用场景

用于代码里调用维表智联项目、表格、字段、视图、行、文档、报表、权限、画布、AI 等资源能力。

如果用户是“创建、配置、维护项目内资源”，优先转到 `dimens-manager`；如果用户是在自己的 Web、BFF、Node.js 或移动端代码里调用这些资源，继续使用 `dimens-sdk`。

| 资源域 | SDK 模块 | 必读文档 | 关键风险 |
| --- | --- | --- | --- |
| 项目 | `sdk.project` | `../bff-examples.md` | `teamId` 与项目归属 |
| 表格 / 字段 / 视图 / 行 | `sdk.sheet/column/view/row` | `../table-examples.md` | `teamId/projectId/sheetId`、行版本 |
| 文档 | `sdk.document` | `../document-examples.md` | 富文本内容、`version`、版本恢复 |
| 报表 | `sdk.report` | `../report-examples.md` | `reportId = sheetId`、组件查询预检 |
| 权限 | `sdk.role/permission/rowPolicy/rowAcl` | `../../../dimens-manager/references/permission/overview.md` | 权限快照、缓存、角色归属 |
| 画布 | `sdk.canvas` | `../../../dimens-manager/references/canvas/overview.md` | `baseVersion`、节点结构、资源市场 |
| AI | `sdk.ai` | `../ai-examples.md` | 聊天兼容接口不等于工作流管理 |

## 默认输出顺序

1. 先说明这是不是“代码接入”；不是则转 `dimens-manager`。
2. 说明资源上下文：`teamId/projectId/sheetId/reportId/documentId/canvasId`。
3. 先给 CLI 预检命令，证明认证、权限、资源 ID 正确。
4. 再给 SDK / HTTP 最小调用片段。
5. 更新类统一体现“先读 -> 合并 -> 更新”。
6. 输出验证链路：回查详情、查询列表或查询组件结果。

## 不要做

- 不要把资源运维命令和端侧接入代码混成一个不可执行模板。
- 不要把报表、画布、文档的版本字段忽略掉。
- 不要因为 SDK 调用成功就判断前端权限已经刷新生效。
