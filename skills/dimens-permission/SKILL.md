---
name: dimens-permission
slug: dimens-permission
description: 用于维表智联团队准入、表列行权限、公开访问与协同广播链路分析，适合排查“能看不能改”类权限问题。
version: 1.0.0
author: 方块智联工作室
tags: [permission, access-control, yjs, security, dimens-cli]
---

# 权限技能（dimens-permission）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 先区分“能进入项目”和“能操作项目内资源”不是一回事
- ✅ 最终权限真值以后端为准，前端只负责预判和保守渲染
- ✅ 协同链路复用同一套权限事实源，但协同权限缓存必须独立隔离
- ✅ 系统字段不能由客户端直接控制，协同入口必须由后端净化
- ✅ 行分页读取正常不代表 `yjs-socket` 一定正常
- ✅ 排查权限问题时，至少同时看团队准入、表级/列级/行级、协同投影这几层

## 快速索引：意图 → 工具 / 命令 → 必填参数

| 用户意图 | 工具 / 命令 | 必填参数 | 常用可选 | 说明 |
| --- | --- | --- | --- | --- |
| 判断是否能进入项目 | `project_authority_check` | `projectId`, `userId` 或当前上下文 | `visibility`, `publicRoleId` | 这是准入层，不是最终资源权限 |
| 判断表级权限 | `permission_resolve` | `teamId`, `projectId`, `sheetId`, `userId` | `roleIds`, `dataAccess` | 先看角色和表级底盘 |
| 判断列级权限 | `column_permission_resolve` | `sheetId`, `fieldId` 或字段集合 | `roleIds` | 列级会继续收敛表级结果 |
| 判断行级权限 | `row_policy_check` | `teamId`, `projectId`, `sheetId`, `rowId` | `beforeData`, `afterData`, `currentUser` | 行级是在表级底盘上进一步裁决 |
| 排查协同越权广播 | `yjs_permission_snapshot` | `teamId`, `projectId`, `sheetId`, `userId` | `rowFilters`, `columnFilters` | 看协同权限快照和广播过滤 |

## 核心约束

### 1. 五层权限结构

当前至少要按下面五层理解：

1. 准入层
2. 角色与表级层
3. 列级与资源级层
4. 行级裁决层
5. 协同投影层

### 2. 准入不等于授权

- 通过项目准入，只代表能进入项目上下文
- 不代表天然能看任何表、字段、行或协同数据

### 3. 公开访问者边界

- 公开访问者不是无状态游客
- 公开访问有独立访问记录和公开角色映射
- 公开项目可进入，也不代表默认拥有完整资源权限

### 4. 协同边界

- 行分页读取链路和 `yjs-socket` 必须共用同一套权限事实源
- 但协同权限快照缓存不能和普通接口缓存混用
- 广播前必须先判断接收者对前后行变化是否可见

### 5. 系统字段边界

- 系统字段是“可读受控、写入托管”
- 协同写入到达后，必须先净化系统字段，再做行级和列级校验

## 必查文档

| Skill / references | 作用 | 什么时候必须看 |
| --- | --- | --- |
| `dimens-team` | 团队 / 项目准入与角色边界 | 处理能进不能看时必须先看 |
| `dimens-table` | 表、字段、行数据为什么被继续收窄 | 处理表格权限时建议看 |
| `references/matrix.md` | 五层权限结构与判断矩阵 | 处理权限问题时必须看 |
| `references/scenario-routing.md` | 场景排查路径 | 设计排查步骤时必须看 |
| `references/capability-status.md` | 当前权限相关能力范围 | 判断是否已 CLI 封装时建议看 |
| `references/examples.md` | 权限场景案例 | 需要直接举例时看 |

## 使用场景示例

### 场景 1：为什么能进项目却看不到表

标准解释：

1. 项目准入只决定能否进入上下文
2. 表格是否可见还要看表级权限
3. 字段、资源、行数据可能继续被收窄

### 场景 2：为什么行分页读取正常但协同仍然越权

标准排查顺序：

1. 检查是否复用了同一套权限事实源
2. 检查协同权限快照缓存是否单独隔离
3. 检查系统字段是否先净化再鉴权
4. 检查广播前后可见性判断是否生效

### 场景 3：公开角色配置成“只能看自己”，为什么协同还是能看到别人

重点判断：

- 问题不一定在策略数据本身
- 先看协同权限快照是否拿对
- 再看广播过滤是否按接收者逐个裁决

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 能进项目但不能看表 | 准入通过，不代表表级授权通过 | 继续检查表级权限和角色集合 |
| 行分页读取正常，协同看到别人行 | 协同缓存串用、广播过滤失效或权限快照错误 | 检查 Yjs 权限快照和 Redis 隔离 |
| 协同更新时报系统字段禁止修改 | 客户端带了系统字段，后端未先净化 | 检查系统字段净化链路 |
| 前端显示可编辑，提交后被拒绝 | 前端只是预判，后端是真值 | 以后端权限服务结论为准 |
| 公开项目访问行为异常 | 把公开访问者当成普通成员或匿名游客 | 重新检查公开角色映射与项目准入 |

## 参考文档

- `references/matrix.md`
- `references/scenario-routing.md`
- `references/capability-status.md`
- `references/examples.md`
- `../references/cli-api-catalog.md`
