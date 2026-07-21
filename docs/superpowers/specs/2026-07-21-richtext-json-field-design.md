# 富文本与 JSON 字段 CLI/Skill 设计

## 目标

为 `dimens-cli` 提供富文本字段和 JSON 字段的明确、可执行用法，并让
`dimens-manager` 在表格建模、字段写入和排错时优先提示两类字段的专用链路。

## 当前契约

### 富文本字段

- 字段类型为 `richtext`。
- 单元格只保存 `documentId` 和 `previewText`，正文由富文本字段专用接口维护。
- 正文格式为 HTML，不接受 Markdown 原文。
- 读取正文使用 `documentId`，不能用在线文档的 `doc update` 代替。

### JSON 字段

- 字段类型为 `json`，顶层只能是对象或数组。
- JSON 不允许注释、尾逗号和重复键。
- `inline` 模式限制为 1-10 KB，值直接保存在行数据中。
- `extended` 模式限制为 1-5 MB，行数据只保存 `id/previewText/rootType/sizeBytes`。
- JSON 字段禁止通过普通 `row set-cell/create/update` 修改，必须使用专用保存接口。
- 更新扩展 JSON 时使用 `jsonVersion` 做内容并发控制，`rowVersion` 用于行并发控制。

## 实现设计

### SDK

新增 `src/sdk/json-field.ts`，提供：

- `getContent(teamId, projectId, id)`：读取扩展 JSON 正文。
- `save(teamId, projectId, payload)`：创建或更新 inline/extended JSON 内容。
- 明确区分 inline 与 extended 返回类型。

在 Node SDK、浏览器 SDK 和公共导出中注册 `jsonField`，保持与现有
`richtextField` 一致的调用方式。

### CLI

新增 `json-field` 命令组：

- `json-field content --id <jsonId>`：只用于 extended 模式。
- `json-field save --sheet-id ... --row-id ... --field-id ...`：通过
  `--content` 或 `--file` 传入 JSON，两者互斥。
- 更新 extended 内容时支持 `--id` 和 `--json-version`。
- 两种模式都支持可选 `--row-version`。
- CLI 在请求前校验 JSON 语法和顶层类型；容量、重复键和最终权限校验仍以服务端为准。

增强现有 `richtext-field save`：

- 支持 `--content` 或 `--file`，两者互斥。
- 文件按 UTF-8 读取，适合大段 HTML 和包含引号的内容。
- 保持现有 `documentId`、`rowVersion`、`title` 语义不变。

不修改权限、Yjs 或服务端实现，也不让通用 `row` 命令隐式转发专用字段。

## Skill 设计

在 `skills/dimens-manager/references/table/references/` 新增一份富文本与 JSON
字段专用参考页，并从 `SKILL.md`、`references/table/overview.md` 路由到该页面。

参考页必须覆盖：

- 两类字段为什么不能当普通文本/对象单元格处理。
- 字段创建配置、首次写入、读取、更新和验证命令。
- 富文本字段与在线文档的区别。
- JSON inline/extended 的选择规则和返回值差异。
- `documentId`、JSON `id`、`jsonVersion`、`rowVersion` 的职责。
- 常见错误及修正方式。

在 `test-prompts.json` 增加富文本和 JSON 场景，验证技能不会推荐错误的
`doc update` 或 `row set-cell` 链路。

## 测试策略

遵循测试驱动：

1. 先为 `JsonFieldSDK`、`json-field` CLI 和富文本文件输入补失败测试。
2. 实现最小代码使测试通过。
3. 增加技能基线场景，记录未加载新参考页时的错误选择。
4. 更新技能后复测场景，确认能够区分两类字段及 JSON 存储模式。
5. 运行相关 Vitest、全量测试、类型检查和 lint；不执行项目 build，不启动新服务。

## 完成标准

- Node SDK 和浏览器 SDK 均暴露 `jsonField`。
- CLI 可读取和保存 JSON 字段，可从文件保存富文本与 JSON。
- 参数冲突、非法 JSON、JSON 顶层标量和非法版本在本地给出明确错误。
- 技能明确禁止两条错误链路：富文本走 `doc update`、JSON 走普通 row 写入。
- 相关测试、全量测试、类型检查和 lint 通过。
- 完成后遍历 `.trae/已开发文档/`，判断是否需要同步文档；需要时先征求用户确认。
