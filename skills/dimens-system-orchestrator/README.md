# dimens-system-orchestrator

## 技能简介

`dimens-system-orchestrator` 是维表智联的系统级总控技能，用于把“生成一个 XX 系统”这类需求先拆成模块，再路由到团队、表格、权限、工作流、报表或认证等子技能。

## 适用场景

- 搭建 CRM、项目管理、售后、审批等完整系统
- 还没明确项目、表结构、权限和流程边界
- 需要给出模块清单、执行顺序和风险提示

## 快速开始

推荐执行顺序：

1. 先确认认证和上下文
2. 做系统拆解
3. 路由到子技能
4. 再落到具体命令或接口

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：系统拆解、接口导航、命令映射等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

## 参考资料

- `references/system-decomposition.md`
- `references/skill-routing.md`
- `references/interface-navigation.md`
- `references/command-mapping.md`
- `references/examples.md`
