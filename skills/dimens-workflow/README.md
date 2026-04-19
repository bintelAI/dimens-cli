# dimens-workflow

## 技能简介

`dimens-workflow` 用于处理维表智联中的团队工作流定义、项目挂载、运行调用、默认模型配置与 OpenAI 兼容调用链路。

## 适用场景

- 查询或调用工作流
- 排查工作流在项目中不可见、不可运行
- 解释默认模型和节点模型配置
- 说明 `chat/completions` 与普通工作流运行区别

## 快速开始

推荐先确认：

- `teamId`
- `projectId`
- `flowId` 或 `label`

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：使用说明、示例、模型路由、项目绑定等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

## 参考资料

- `references/usage.md`
- `references/examples.md`
- `references/model-routing.md`
- `references/project-binding.md`
- `references/capability-status.md`
