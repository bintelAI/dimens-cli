# dimens-team

## 技能简介

`dimens-team` 用于处理维表智联中的团队、成员、项目、部门和租户隔离上下文，是其他技能判断资源归属和默认上下文的上游入口。项目真正的创建与初始化主链应继续交给 `dimens-project`。

## 适用场景

- 查询团队、项目、成员关系
- 解释为什么用户看不到某个项目
- 判断 `teamId`、`projectId` 的作用和来源
- 为表格、权限、工作流等技能补齐上下文
- 把“创建项目并继续搭建系统”路由到 `dimens-project`

## 快速开始

优先准备：

- 当前用户上下文
- `teamId`
- `projectId`

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：示例、隔离模型、项目入口说明等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

## 路由提示

- 这里负责解释团队和项目上下文，不负责承接完整项目初始化。
- 当用户要直接创建项目、补默认公开视图、推进到建表主链时，下一跳应进入 `dimens-project`。

## 参考资料

- `references/examples.md`
- `references/context-sources.md`
- `references/isolation.md`
- `references/project-entry.md`
