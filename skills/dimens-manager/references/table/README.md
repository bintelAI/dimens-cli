# dimens-manager 多维表格章节

当前目录是 `dimens-manager` 的 `table` 业务章节，承载原独立技能的业务说明、接口案例和规则资料。

## 入口

- `overview.md`：章节总览和执行前必读
- `references/`：接口级、场景级和命令级扩展资料
- `rules/`：平台兼容入口
- `assets/`：素材占位目录

## 工作流字段补充

如果处理 `workflow` 字段、审批字段、行数据绑定审批流、审批摘要回写，请同时阅读：

- `../workflow/references/field-binding.md`

该文档说明 `workflow` 字段如何绑定 `flowId`，行发起审批时如何携带 `rowId/sourceSnapshot/bizData.payload`，以及审批状态如何回写到同一个字段。
