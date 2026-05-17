# dimens-manager 工作流章节

当前目录是 `dimens-manager` 的 `workflow` 业务章节，承载工作流总规范、节点词典、AI 场景模板、审批场景模板和接口案例。

## 入口

- `overview.md`：章节总览和执行前必读
- `references/`：总规范、节点词典、场景模板、接口级和命令级扩展资料
- `rules/`：平台兼容入口
- `assets/`：素材占位目录

## 高频资料

| 文件 | 用途 |
| --- | --- |
| `references/workflow-spec.md` | 工作流总规范，定义共用输出契约、节点分层、连线规则和校验原则 |
| `references/node-dictionary.md` | 工作流节点词典，统一 AI 工作流与审批工作流的节点语义 |
| `references/ai-generation.md` | AI 工作流一键生成模板、节点结构与输出要求 |
| `references/ai-node-templates.md` | AI 工作流节点模板库，提供可复制的输入、提示词、模型、检索、工具、解析、质检、写回节点模板 |
| `references/approval-generation.md` | 审批工作流一键生成模板、输入收集、图 JSON 草案和项目落地计划 |
| `references/approval-existing-cases.md` | MCP 读取到的真实审批工作流 16/17 案例摘要，用于约束节点类型和经典审批链路 |
| `references/approval-node-parameters.md` | 审批工作流每类节点的参数说明、最小示例和常见错误 |
| `references/field-binding.md` | 审批工作流字段绑定与行数据链路，说明 `workflow` 字段、`rowId`、`sourceSnapshot`、`bizData.payload` 和摘要回写 |
| `references/usage.md` | 团队定义 / 项目挂载 / 运行调用三层分层 |
| `references/project-binding.md` | 工作流项目挂载与系统视图入口 |
| `references/model-routing.md` | 默认模型与节点模型边界 |
| `references/capability-status.md` | CLI 已封装、server-only、部分对齐能力状态 |
