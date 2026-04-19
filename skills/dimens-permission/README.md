# dimens-permission

## 技能简介

`dimens-permission` 用于分析维表智联中的团队准入、表级权限、列级权限、行级权限、公开访问者以及 Yjs 协同广播权限。

## 适用场景

- 用户能看但不能改资源
- 行分页正常但协同异常
- 公开访问、只读、越权同步类问题
- 需要解释表列行权限链路

## 快速开始

优先先确认：

- `teamId`
- `projectId`
- `sheetId`
- 当前用户或角色上下文

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：权限矩阵、示例、能力状态等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

## 参考资料

- `references/matrix.md`
- `references/examples.md`
- `references/scenario-routing.md`
- `references/capability-status.md`
