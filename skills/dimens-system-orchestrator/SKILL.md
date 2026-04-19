---
name: dimens-system-orchestrator
slug: dimens-system-orchestrator
description: 用于维表智联系统级方案拆解与技能路由，适合“生成一个客户管理系统/平台”这类完整业务系统搭建需求。
version: 1.0.0
author: 方块智联工作室
tags: [orchestrator, system-design, routing, planning, dimens-cli]
---

# 系统级总控技能（dimens-system-orchestrator）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 如果本地还没有 `dimens-cli` 命令，先安装 `@bintel/dimens-cli`，否则后续命令和 Skill 路由案例无法直接执行
- ✅ 在路由到任何业务 Skill 前，先确认认证是否完成；未认证时优先进入 `dimens-key-auth`
- ✅ 这是系统级总控 Skill，不直接替代 `dimens-team`、`dimens-table`、`dimens-permission` 等业务 Skill
- ✅ 默认节奏是“先方案，后执行”，不能在系统边界没拆清时直接开始落地
- ✅ 它负责系统拆解、Skill 路由、执行顺序，不负责把所有业务细节都写死在一个 Skill 里
- ✅ 当用户只提“生成一个 XX 系统”时，默认优先识别项目、表、字段、关联关系、示例数据和查询方式
- ✅ 当用户直接给出 `https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/` 这类链接时，默认解析为当前维表上下文；其中第一段是 `teamId`，第二段是 `projectId`
- ✅ 权限、工作流、报表、外部对接默认是后置扩展模块，不是第一步
- ✅ 只有当系统拆解结果稳定后，才进入下游子 Skill 处理

## 快速索引：系统目标 → 优先子 Skill → 主要职责

| 用户目标 / 子系统 | 优先子 Skill | 主要职责 | 备注 |
| --- | --- | --- | --- |
| 团队、空间、成员、项目上下文 | `dimens-team` | 确认团队/项目隔离、成员和默认上下文 | 所有系统建设的上游基础 |
| 客户表、订单表、联系人表、跟进记录表 | `dimens-table` | 设计表结构、字段、关联、示例数据、筛选与查询案例 | 默认主力 Skill |
| 角色、数据可见范围、公开访问、协同限制 | `dimens-permission` | 设计权限边界和协同风险 | 后置扩展模块 |
| 审批、自动化、AI 分析、流程节点 | `dimens-workflow` | 设计流程编排与模型能力 | 处理流程型系统能力 |
| 经营看板、漏斗分析、统计图表 | `dimens-report` | 设计报表、参数、数据源和展示 | 处理管理层视角输出 |
| 第三方接入、开放登录、脚本调用 | `dimens-key-auth` | 处理 API Key / token 复用能力 | 处理外部系统对接 |

## 核心约束

### 1. 这是编排 Skill，不是模板 Skill

- 不要把“客户管理系统”的全部实现细节硬编码在这个 Skill 里
- 它的职责是识别系统建设任务，并把任务拆给合适的业务 Skill
- 同一个系统需求，可以根据业务复杂度路由到不同的 Skill 组合

### 2. 默认输出必须是系统拆解结果

接到“生成一个 XX 系统”后，默认先输出：

1. 系统目标
2. 核心业务对象
3. 项目与表结构
4. 字段设计与关联关系
5. 示例行数据
6. 常用查询 / 视图 / 筛选案例
7. 需要调用的子 Skill
8. 推荐执行顺序
9. 风险点与待确认项

### 3. 先拆模块，再进入子 Skill

默认拆解维度至少包括：

- 团队/项目上下文
- 数据对象与表结构
- 字段与关联关系
- 示例数据与查询方式

可选扩展维度：

- 权限模型
- 流程/自动化
- 报表/看板
- 外部接入

### 3.1 链接上下文解析规则

- 当用户输入 `https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/` 这类链接时，默认直接解析为：
- `teamId = TTFFEN`
- `projectId = PXWXBJQ`
- 后续所有系统拆解、Skill 路由、命令示例都优先基于这组上下文继续，不要再重复追问团队和项目来源
- 如果链接后面还带更深层路径，仍然先锁定前两段作为 `teamId` 和 `projectId`，再决定是否继续补 `sheetId` 等下游资源

### 4. 宽触发，但不要泛化成任何需求都接

它主要接：

- “做一个客户管理系统”
- “帮我搭一个项目管理平台”
- “生成一个审批系统”
- “做一个售后管理系统”

它不应该优先接：

- “帮我加一个字段”
- “为什么这个工作流看不到”
- “API Key 登录失败”

这些更适合直接进入对应业务 Skill。

## 标准处理流程

### 第一步：识别系统类型

先明确这是：

- 客户管理系统
- 项目管理系统
- 订单管理系统
- 审批/流程系统
- 其他业务系统

### 第二步：拆业务对象

至少识别：

- 主对象是什么
- 核心数据表有哪些
- 每张表的主字段、状态字段、时间字段、关联字段是什么
- 哪些字段需要参与搜索、筛选、排序
- 需要哪些案例行数据

### 第三步：路由子 Skill

建议按下面顺序路由：

1. `dimens-team`
2. `dimens-table`
3. `dimens-permission`（仅当用户明确要求权限边界时）
4. `dimens-workflow`（仅当用户明确要求审批/自动化/AI 时）
5. `dimens-report`（仅当用户明确要求看板/统计时）
6. `dimens-key-auth`（仅当用户明确要求对接时）

### 第四步：输出系统方案

输出内容至少包括：

- 模块清单
- 子 Skill 清单
- 执行顺序
- 风险项
- 待确认项
- 需要继续查看的接口级 references

### 第五步：等待用户确认

默认先方案、后执行。只有用户确认系统方案后，才进入具体子 Skill 落地。

## 必查文档

| Skill / references | 作用 | 什么时候必须看 |
| --- | --- | --- |
| `dimens-cli/skills/README.md` | 当前 Skill 体系总览 | 做系统级路由时必须看 |
| `dimens-team` | 团队、项目、上下文和隔离模型 | 系统拆解时必须看 |
| `dimens-table` | 表、字段、关联、示例数据和查询案例 | 涉及建模时必须看 |
| `dimens-permission` | 准入、表列行权限、公开访问和协同边界 | 涉及权限时必须看 |
| `dimens-workflow` | 工作流、默认模型、项目挂载和运行调用 | 涉及流程时必须看 |
| `dimens-report` | 图表、看板、参数联动与数据源查询 | 涉及报表时必须看 |
| `dimens-key-auth` | API Key、token 复用和第三方接入 | 涉及对接时必须看 |
| `references/command-mapping.md` | 系统建设步骤到 CLI / API 的直接映射 | 用户要求“直接给命令”时必须看 |

## 使用场景示例

### 场景 1：用户说“帮我生成一个客户管理系统”

默认动作：

1. 识别这是系统级建设任务
2. 先拆出客户、联系人、跟进、商机四张核心表
3. 先补字段设计、关联关系、示例行数据和常用查询案例
4. 默认优先路由到 `dimens-team`、`dimens-table`
5. 只有用户继续要求时，再补 `dimens-permission`、`dimens-workflow`、`dimens-report`
6. 先输出方案，再等待用户确认

### 场景 2：用户说“帮我做一个售后管理平台”

默认动作：

1. 识别对象：工单、客户、处理记录、升级流转、满意度报表
2. 先给出模块拆解
3. 标注需要的子 Skill
4. 再进入后续执行

### 场景 3：用户直接给一个维表链接

例如：

```text
https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/
```

默认动作：

1. 直接解析 `teamId=TTFFEN`
2. 直接解析 `projectId=PXWXBJQ`
3. 把这组上下文交给 `dimens-team` 和 `dimens-table`
4. 后续命令示例默认显式带上这两个 ID，避免上下文漂移

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 一个系统需求直接落进单个业务 Skill | 没先识别这是系统级任务 | 先进入 `dimens-system-orchestrator` 做拆解 |
| 系统级 Skill 写成了大而全模板 | 把编排 Skill 当成模板 Skill | 收回到“拆解 + 路由 + 顺序”职责 |
| 一上来先讲权限、审批、报表 | 没按用户的默认建模心智输出 | 先回到项目、表、字段、案例数据、查询案例 |
| 用户只问一个具体问题却触发总控 Skill | 触发范围过宽 | 判断是否真的是“系统建设需求” |
| 方案还没确认就开始执行 | 违背“先方案，后执行” | 先输出模块和子 Skill 方案，再等确认 |

## 参考文档

- `references/system-decomposition.md`
- `references/interface-navigation.md`
- `references/skill-routing.md`
- `references/command-mapping.md`
- `references/examples.md`
