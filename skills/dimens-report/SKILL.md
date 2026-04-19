---
name: dimens-report
slug: dimens-report
description: 用于维表智联报表、图表组件、参数联动和数据源查询链路说明，适合排查报表无数据或参数异常问题。
version: 1.0.0
author: 方块智联工作室
tags: [report, dashboard, data-source, analytics, dimens-cli]
---

# 报表技能（dimens-report）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 报表默认是项目级资源，先确认 `projectId`
- ✅ 报表问题不要只看页面表现，还要看数据源、参数、组件配置和权限链路
- ✅ 参数联动异常不一定是前端问题，也可能是查询链路或默认值问题
- ✅ 报表可访问不代表底层数据源一定可访问，项目权限和数据源约束可能继续收窄
- ✅ 涉及多维表格数据源时，还要联动检查表格权限和字段映射

## 快速索引：意图 → 工具 / 命令 → 必填参数

| 用户意图 | 工具 / 命令 | 必填参数 | 常用可选 | 说明 |
| --- | --- | --- | --- | --- |
| 查询报表列表 | `report_list` | `projectId` | `keyword`, `status`, `type` | 报表属于项目资源 |
| 查询报表详情 | `report_info` | `projectId`, `reportId` | - | 先明确项目上下文 |
| 查询图表组件 | `report_widget_list` | `projectId`, `reportId` | `type` | 看组件配置与数据源 |
| 查询参数定义 | `report_parameter_list` | `projectId`, `reportId` | - | 看参数联动和默认值 |
| 执行报表查询 | `report_query` | `projectId`, `reportId` | `params`, `widgetId` | 可能受权限与数据源限制 |
| 导出报表 | `report_export` | `projectId`, `reportId` | `format`, `params` | 需检查导出与查询链路是否一致 |

## 核心约束

### 1. 资源边界

- 报表归属于项目
- 图表组件、参数、版本都从属于报表
- 任何“报表查不到”问题都应该先落到具体 `projectId + reportId`

### 2. 数据源边界

- 报表可使用多维表格、SQL、外部 API、静态数据等数据源
- 不同数据源的限制不同，不能按同一条排查路径处理
- 涉及多维表格数据源时，要联动表格 Skill 判断权限与字段映射

### 3. 参数联动边界

- 参数默认值、依赖关系、选项数据源都会影响最终查询结果
- “图表空白”不一定是无数据，也可能是参数没传对或联动条件不满足

### 4. 权限边界

- 当前统一口径是项目级权限校验优先
- 用户必须具备项目访问权限才能操作报表
- 组件可显示不代表底层查询一定能返回完整数据

## 必查文档

| Skill / references | 作用 | 什么时候必须看 |
| --- | --- | --- |
| `dimens-team` | 项目级资源边界与上下文 | 处理报表时必须先看 |
| `dimens-table` | 多维表格数据源与字段映射 | 报表基于表格数据源时必须看 |
| `dimens-permission` | 项目权限、数据访问范围与可见性 | 解释访问问题时建议看 |
| `references/usage.md` | 报表使用分层说明 | 处理报表时必须看 |
| `references/capability-status.md` | 当前报表能力范围 | 判断是否已封装时建议看 |
| `references/examples.md` | 报表 / 图表 / 参数接口案例 | 需要直接举例时看 |

## 使用场景示例

### 场景 1：解释为什么报表能打开但图表没数据

标准排查顺序：

1. 确认 `projectId` 与 `reportId`
2. 检查参数默认值和联动关系
3. 检查组件绑定的数据源
4. 检查数据源权限和返回结果

### 场景 2：查询报表详情

```json
{
  "projectId": "PROJ1",
  "reportId": "REPORT1"
}
```

### 场景 3：按参数执行图表查询

```json
{
  "projectId": "PROJ1",
  "reportId": "REPORT1",
  "params": {
    "dateRange": "this_month",
    "owner": "currentUser"
  }
}
```

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 报表能打开但图表空白 | 参数没传对、联动不满足或数据源无结果 | 先检查参数定义，再查数据源 |
| 同一报表不同人看到的数据不一样 | 项目权限或底层数据源权限不同 | 继续检查项目权限与数据源访问范围 |
| 图表组件不显示 | 组件可见性条件或布局配置异常 | 检查组件配置和显示条件 |
| 导出结果和页面结果不一致 | 导出链路与查询参数不一致 | 对比导出参数与页面查询参数 |
| 报表查多维表格数据失败 | 底层表格权限、字段映射或数据源配置有问题 | 联动检查 `dimens-table` 和权限链路 |

## 参考文档

- `references/usage.md`
- `references/capability-status.md`
- `references/examples.md`
- `../references/cli-api-catalog.md`
