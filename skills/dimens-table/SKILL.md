---
name: dimens-table
slug: dimens-table
description: 用于维表智联工作表、字段、视图和行数据设计与排查，适合多维表格建模、字段写入和查询链路说明。
version: 1.0.0
author: 方块智联工作室
tags: [table, sheet, row, column, view, dimens-cli]
---

# 多维表格技能（dimens-table）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 执行任何 `project / sheet / column / row / ai` 命令前，先完成认证；认证方式优先参考 `dimens-key-auth`
- ✅ 表格能力默认要先确认 `projectId`，大多数写操作还需要 `teamId`
- ✅ 字段、视图、行数据都属于工作表上下文，不能脱离 `sheetId` 单独判断
- ✅ 默认要优先帮助用户把“项目 -> 表 -> 字段 -> 关联 -> 示例数据 -> 查询案例”搭起来
- ✅ 字段设计必须细到可落地，不能只写“有客户名称、状态、时间”这种抽象描述
- ✅ relation 字段创建必须补齐目标表，推荐显式传 `--target-sheet-id`，并尽量补 `--display-column-id`
- ✅ 新表落地后必须确认至少存在一个公开默认视图；如果技能链路没有自动补齐，就要显式执行 `view create`
- ✅ `row/page` 默认要按“基于字段的搜索、筛选、排序”来解释，不只是分页
- ✅ 系统视图相关问题要区分团队级默认字段和项目级实际分配字段
- ✅ 处理字段和行写入问题时，不能只看字段结构，还要同步看权限与系统字段边界
- ✅ 表格接口能读取不代表一定可写，行级、列级、协同权限可能继续收敛

## 快速索引：意图 → 工具 / 命令 → 必填参数

| 用户意图 | 工具 / 命令 | 必填参数 | 常用可选 | 说明 |
| --- | --- | --- | --- | --- |
| 查询表列表 | `dimens-cli sheet list` | `projectId` | `teamId` | 表入口通常先从项目进入 |
| 查询表详情 | `dimens-cli sheet info` | `teamId`, `projectId`, `sheetId` | - | 明确工作表上下文 |
| 创建表 | `dimens-cli sheet create` | `projectId`, `name` | `teamId`, `parentId` | 归属于项目 |
| 查询字段列表 | `dimens-cli column list` | `teamId`, `projectId`, `sheetId` | - | 先确认字段结构 |
| 创建字段 | `dimens-cli column create` | `teamId`, `projectId`, `sheetId`, `type`, `label` 或兼容参数 `title` | `property`, `uiType`, `config`, `required`, `unique`, `key` | 字段类型影响值结构，推荐优先传 `--label` |
| 查询视图列表 | `dimens-cli view list` | `teamId`, `projectId`, `sheetId` | - | 建表后先确认默认视图是否已落地 |
| 创建公开默认视图 | `dimens-cli view create` | `teamId`, `projectId`, `sheetId`, `name`, `type` | `isPublic`, `config` | 技能建表链路默认要求至少补一个公开 grid 视图 |
| 查询行数据 | `dimens-cli row page` | `teamId`, `projectId`, `sheetId` | `viewId`, `page`, `size`, `keyword`, `searchFieldIds`, `filters`, `filterMatchType`, `sortRule` | 行读取统一走分页接口，读取链路会受字段筛选、视图配置和权限共同影响 |
| 更新单元格 | `dimens-cli row set-cell` | `sheetId`, `rowId`, `fieldId`, `value` | `version`, `columnId` | 服务端真实契约以 `fieldId` 为准，`columnId` 仅兼容旧 CLI 习惯 |

## 核心约束

### 1. 资源层级

- 表属于项目
- 字段、视图、行属于表
- 任何字段或行问题都应该先落到具体 `sheetId`

### 1.1 默认公开视图约束

- 技能侧建表完成后，默认要检查是否已经存在公开视图
- 如果没有，就补一个 `name=默认视图`、`type=grid`、`isPublic=true` 的公开默认视图
- 推荐 `config` 至少包含：`filters=[]`、`filterMatchType='and'`、`sortRule=null`、`groupBy=[]`、`hiddenColumnIds=[]`、`rowHeight='medium'`
- 没有默认公开视图时，前端常见表现是“表能打开但筛选能力不完整”或“没有可继承的视图配置”

### 2. 系统视图字段边界

- `flow_info.usageType` 表示团队级默认能力类型
- `mul_project_workflow_binding.systemView` 表示项目级实际系统视图分配
- 当前规则是“项目绑定优先，全局默认回退”

### 3. 字段与值结构边界

- 字段类型不同，值结构和允许写入方式不同
- 字段能力不能只看名字，必须结合类型、`uiType`、`property`
- 字段设计默认至少要明确：字段名、类型、是否必填、是否唯一、默认值、是否参与筛选、是否参与排序、是否用于主展示
- 关联字段默认要明确：目标表、展示字段、是否多选、是否双向、编辑视图字段
- 涉及工作流、AI 分析、审批、自动化入口时，还要同时检查系统视图字段映射

### 4. 权限边界

- 表级可见不代表列级可写
- 列级可写不代表行级可写
- 表格在协同链路里还会受到 Yjs 写入净化与广播过滤影响

### 5. 上下文边界

- CLI 场景通常同时依赖 `teamId`、`projectId`、`sheetId`
- 如果只给出其中一个，很多结论都不稳定

## 必查文档

| Skill / references | 作用 | 什么时候必须看 |
| --- | --- | --- |
| `dimens-key-auth` | 认证、token 复用与第三方接入边界 | 执行任何表格命令前必须先确认 |
| `dimens-team` | 团队与项目上下文来源 | 进入表域前必须先看 |
| `dimens-permission` | 表级、列级、行级与协同权限边界 | 处理写入权限时建议看 |
| `dimens-workflow` | 系统视图字段与工作流入口的映射关系 | 处理 AI 分析、审批、自动化入口时建议看 |
| `references/field-design-patterns.md` | 字段设计模板、relation 结构 | 设计字段时必须看 |
| `references/row-filters.md` | `row/page` 搜索、筛选、排序与 `viewId` 继承 | 设计查询案例时必须看 |
| `references/field-rules.md` | 字段规则和系统视图字段边界 | 处理系统字段时必须看 |
| `references/build-flow.md` | 表域能力落地流程 | 从零搭表时建议看 |
| `references/examples.md` | 表 / 字段 / 行接口案例 | 需要直接举例时看 |

## 使用场景示例

### 场景 0：用户要“做一个客户管理系统”

默认优先输出：

1. 项目名称
2. 核心表：客户、联系人、跟进记录、商机
3. 每张表的字段设计
4. 表之间的 relation 关系
5. 示例行数据
6. `row/page` 查询案例

只有用户继续要求时，再扩展权限、工作流、报表。

### 场景 1：查询某项目下的表列表

```bash
dimens-cli sheet list --project-id PROJ1
```

建议：

- 排查问题时尽量显式补 `--team-id`
- 避免被本地默认上下文误导

### 场景 1.1：为新表补公开默认视图

```bash
dimens-cli view create \
  --team-id TTFFEN \
  --project-id PUQUNFE \
  --sheet-id sh_customer \
  --name 默认视图 \
  --type grid \
  --is-public true \
  --config '{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}'
```

注意：

- 这是技能建表链路里的默认补偿步骤，不要跳过
- 如果后端已经自动生成了默认视图，应先用 `view list` 检查，避免重复创建
- 当前 CLI 只承诺 `view list/create` 基础能力，不要把 `update/delete/config/filters` 当成已稳定封装

### 场景 2：更新单元格

```bash
dimens-cli row set-cell \
  --sheet-id SHEET1 \
  --row-id ROW1 \
  --field-id fld_status \
  --value 已完成
```

注意：

- 写入前要先确认字段类型和值结构
- `fieldId` 需要先通过 `dimens-cli column list` 获取，不能直接拿中文字段名当写入键
- 如果是系统字段、只读字段或命中行级策略，后端仍可能拒绝

### 场景 3：解释为什么工作流在 AI 分析入口显示不对

标准排查顺序：

1. 看团队级 `usageType`
2. 看项目级 `systemView`
3. 明确当前规则是项目绑定优先、全局默认回退
4. 再看页面入口到底读的是哪个树接口或绑定接口

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 表搭出来了，但字段不好用 | 字段只按名字设计，没有提前考虑筛选、排序、主展示和关联 | 回到字段模板，补齐字段能力设计 |
| 行能查出来，但筛选条件不好表达 | 没按 `keyword / searchFieldIds / filters / filterMatchType / sortRule` 结构设计 | 按 `row/page` 真实请求结构重写查询案例 |
| 表能查到，但字段写入失败 | 字段类型不匹配、列级只读或系统字段受控 | 先查字段结构，再查列权限与系统字段规则 |
| 行分页读取正常，协同更新异常 | 普通接口权限和 Yjs 协同过滤不是同一条缓存链 | 检查协同权限快照、系统字段净化和广播过滤 |
| AI 分析入口工作流分类不对 | 把团队级默认字段当成项目级实际分配字段 | 区分 `usageType` 与 `systemView` |
| 同一字段在不同项目表现不同 | 项目级绑定、权限或系统视图规则不同 | 结合 `projectId` 重新判断，不要跨项目直接套用 |
| 单元格改不了但页面没明显报错 | 后端行级或列级鉴权拒绝 | 检查表级、列级、行级三层权限链路 |

## 参考文档

- `references/build-flow.md`
- `references/field-design-patterns.md`
- `references/row-filters.md`
- `references/field-rules.md`
- `references/examples.md`
