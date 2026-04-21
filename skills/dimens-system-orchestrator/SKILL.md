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
- ✅ 当用户只提“生成一个 XX 系统”时，默认优先识别项目、表、文档、报表、字段、关联关系、示例数据和查询方式
- ✅ 当用户要求“创建项目 / 创建系统”时，默认先按维表特性设计多表、多字段、`1 对多 / 多对一` 关联和案例数据，再进入文档、报表、角色、权限这些后置模块
- ✅ 系统资源默认按项目“三驾马车”理解：表格、文档、报表；不要只拆表，不拆文档和报表
- ✅ 当用户直接给出 `https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/` 这类链接时，默认解析为当前维表上下文；其中第一段是 `teamId`，第二段是 `projectId`
- ✅ 权限、工作流、报表、外部对接默认是后置扩展模块，不是第一步
- ✅ 只有当系统拆解结果稳定后，才进入下游子 Skill 处理

高风险跑偏点：

- 不要把系统拆解误收缩成“只有几张表”
- 不要在基础建模还没明确前，直接给创建命令
- 不要跳过多表、多字段、关联和案例数据，直接进入文档、报表、权限
- 不要漏掉项目内的文档资源和报表资源
- 不要把在线文档误当成只创建不维护的一次性资源
- 不要在系统级方案还没稳定时，直接下钻到报表组件细节
- 不要把“用户说要看板”翻译成“马上创建图表”
- 不要跳过数据对象、字段和查询方式设计，直接给报表命令

## 快速索引：系统目标 → 优先子 Skill → 主要职责

| 用户目标 / 子系统 | 优先子 Skill | 主要职责 | 备注 |
| --- | --- | --- | --- |
| 团队、空间、成员、项目上下文 | `dimens-team` | 确认团队/项目隔离、成员和默认上下文 | 所有系统建设的上游基础 |
| 项目创建、项目初始化、默认公开视图补齐 | `dimens-project` | 创建项目，补建表前置资源，把链路推进到可直接搭表 | 系统落地的容器初始化层 |
| 客户表、订单表、联系人表、跟进记录表、在线文档 | `dimens-table` | 设计表结构、字段、关联、示例数据、筛选与查询案例；若是在线文档入口则继续联动 `dimens-project` 的文档维护主链 `doc create / doc info / doc update / doc delete`，以及版本主链 `doc versions / doc version / doc restore` | 默认主力 Skill |
| 角色、项目权限、表/列/行可见范围、公开访问、协同限制 | `dimens-permission` | 设计权限边界、角色分配与权限落地链路 | 用户提到权限时应直接进入 |
| 审批、自动化、AI 分析、流程节点 | `dimens-workflow` | 设计流程编排与模型能力 | 处理流程型系统能力 |
| 经营看板、漏斗分析、统计图表、仪表盘 | `dimens-report` | 设计报表、参数、数据源和展示，并联动 `report create -> report preview -> report widget-add -> report query-widget -> report query` 固定预检链 | 处理管理层视角输出 |
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
3. 项目与多表结构
4. 多字段设计与关联关系
5. 示例行数据
6. 项目内文档 / 说明页
7. 项目内报表 / 看板
8. 常用查询 / 视图 / 筛选案例
9. 需要调用的子 Skill
10. 推荐执行顺序
11. 风险点与待确认项

这里的第 3、4、5 项默认一起构成项目“三驾马车”：

- 表格：承接业务对象与结构化数据
- 文档：承接 TipTap 在线说明、制度、知识沉淀
- 报表：承接统计分析、经营看板、管理层视图

不要只输出表结构，就声称系统方案已完整。

补充说明：

- 文档资源默认不只是“创建一份文档”，而是要继续考虑查询、修订、清理
- 如果系统里的文档承担长期演进内容，还要继续考虑历史版本查询与恢复
- 如果系统里包含制度页、操作手册、知识沉淀页，通常意味着后续还会持续更新

### 3. 先拆模块，再进入子 Skill

默认拆解维度至少包括：

- 团队/项目上下文
- 数据对象与表结构
- 项目内文档资源
- 项目内报表资源
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
2. `dimens-project`
3. `dimens-table`
4. `dimens-permission`（当用户明确要求角色、项目权限、表权限、公开访问、协同限制时直接进入）
5. `dimens-workflow`（仅当用户明确要求审批/自动化/AI 时）
6. `dimens-report`（仅当用户明确要求看板/统计时）
7. `dimens-key-auth`（仅当用户明确要求对接时）

如果用户明确要求的是“整体搭系统”，而不是只建表，建议在方案里显式写出三驾马车的默认顺序：

1. `dimens-project`
2. `dimens-table`
3. 先明确多字段、`1 对多 / 多对一` 关联和案例数据
4. `dimens-project` 的文档维护主链：`doc create / doc info / doc update / doc delete`
5. `dimens-project` 的文档版本主链：`doc versions / doc version / doc restore`
6. `dimens-report`
7. `dimens-permission` / `dimens-workflow` / `dimens-key-auth` 作为扩展模块

也可以直接统一成下面这条用户引导路径：

1. 创建项目
2. 创建多表格
3. 创建多字段
4. 设计 `1 对多 / 多对一` 关联数据
5. 补案例数据
6. 看需求补项目文档
7. 看需求补项目报表
8. 看需求补角色
9. 看需求补权限

### 第三步补充：当用户明确要求报表时，不要只停在“加一个报表”

如果用户已经明确要求：

- 看板
- 仪表盘
- 漏斗分析
- 经营统计
- 图表报表

总控 Skill 不能只路由到 `dimens-report` 然后给一句“去创建报表”，而应至少继续给出报表默认执行顺序：

1. 先创建报表主资源：`dimens-cli report create`
2. 如果是多维表格数据源，先设计 `dataSource + dataMapping`
3. 先执行 `dimens-cli report preview`
4. 再执行 `dimens-cli report widget-add`
5. 如需验证单组件，继续执行 `dimens-cli report query-widget`
6. 全部组件完成后执行 `dimens-cli report query`
7. 确认无误后再决定是否 `dimens-cli report publish`

说明：

- 总控 Skill 不需要把报表字段细节都写死，但必须把这条固定预检链交给用户
- 如果是整套系统方案，报表默认是后置模块；一旦进入报表模块，就必须按上面这条链路推进，不能跳过预检步骤
- 如果系统里的核心表和字段还没定，不要过早进入 `widget-add`

### 第三步补充：权限需求要直接落到权限 Skill 和命令入口

当用户在系统搭建阶段直接提出下面任一需求时：

- 角色设计
- 项目权限
- 表权限 / 列权限 / 行权限
- 公开访问
- 协同可见范围
- 谁能看自己的数据、部门数据、全部数据

总控 Skill 不能只停留在“可选扩展”，而要直接给到权限落点：

1. 路由到 `dimens-permission`
2. 指向 `dimens-permission` 技能目录下的 `references/examples.md`
3. 指向 `dimens-permission` 技能目录下的 `references/matrix.md`
4. 指向 `dimens-permission` 技能目录下的 `references/command-mapping.md`

如果用户明确要“直接给命令”，则至少继续给出下面这条主链：

1. `dimens-cli role create`
2. `dimens-cli role assign-user`
3. `dimens-cli permission create`
4. `dimens-cli permission set-resource`
5. `dimens-cli row-policy create`

说明：

- “系统搭建到角色 / 项目权限落地”的默认主链是 `角色 -> 项目/表级权限 -> 用户绑定 -> 行级策略`
- `row-acl` 属于精细化例外授权，不应替代角色和项目权限主链

### 第四步：输出系统方案

输出内容至少包括：

- 模块清单
- 三驾马车资源清单
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
| `dimens-project` | 项目创建、项目初始化和默认公开视图补偿 | 系统进入建表前必须看 |
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
3. 同时补出项目文档资源和经营看板资源，不要只有表
4. 先补字段设计、关联关系、示例行数据和常用查询案例
5. 默认优先路由到 `dimens-team`、`dimens-project`、`dimens-table`
6. 如果用户要求项目闭环，再继续补文档主链和 `dimens-report`
7. 只有用户继续要求时，再补 `dimens-permission`、`dimens-workflow`
8. 先输出方案，再等待用户确认

### 场景 2：用户说“帮我做一个售后管理平台”

默认动作：

1. 识别对象：工单、客户、处理记录、升级流转、满意度报表
2. 先给出模块拆解
3. 标注需要的子 Skill
4. 再进入后续执行

如果用户继续要求“把满意度报表也做出来”，默认要补一句：

1. 先创建报表主资源
2. 再预览工单或满意度数据源
3. 再逐个创建组件
4. 最后整报表查询确认结果

如果用户同时还要求“平台要完整”，还要补一句：

5. 售后制度、处理规范、操作说明默认走在线文档资源，不要只靠表备注字段代替

### 场景 3：用户直接给一个维表链接

例如：

```text
https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/
```

默认动作：

1. 直接解析 `teamId=TTFFEN`
2. 直接解析 `projectId=PXWXBJQ`
3. 把这组上下文交给 `dimens-team`、`dimens-project` 和 `dimens-table`
4. 后续命令示例默认显式带上这两个 ID，避免上下文漂移

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 一个系统需求直接落进单个业务 Skill | 没先识别这是系统级任务 | 先进入 `dimens-system-orchestrator` 做拆解 |
| 系统级 Skill 写成了大而全模板 | 把编排 Skill 当成模板 Skill | 收回到“拆解 + 路由 + 顺序”职责 |
| 一上来先讲权限、审批、报表 | 没按用户的默认建模心智输出 | 先回到项目、表、文档、字段、案例数据、查询案例 |
| 系统方案里只有表，没有文档和报表 | 没按项目“三驾马车”输出 | 回到项目资源层，把表格、文档、报表一起补齐 |
| 路由到报表后直接给 `widget-add` | 跳过了固定预检链 | 至少补上 `report preview` 和 `report query-widget` |
| 用户只问一个具体问题却触发总控 Skill | 触发范围过宽 | 判断是否真的是“系统建设需求” |
| 方案还没确认就开始执行 | 违背“先方案，后执行” | 先输出模块和子 Skill 方案，再等确认 |

## 参考文档

- `references/system-decomposition.md`
- `references/interface-navigation.md`
- `references/skill-routing.md`
- `references/command-mapping.md`
- `references/examples.md`
