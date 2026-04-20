# dimens-system-orchestrator

## 技能简介

`dimens-system-orchestrator` 是维表智联的系统级总控技能，用于把“生成一个 XX 系统”这类需求先拆成模块，再路由到团队、表格、权限、工作流、报表或认证等子技能。

它的职责不是把所有实现细节写死，而是先把系统拆清楚，再决定应该进入哪个子 Skill。

## 适用场景

- 搭建 CRM、项目管理、售后、审批等完整系统
- 还没明确项目、表结构、权限和流程边界
- 需要给出模块清单、执行顺序和风险提示
- 需要先判断项目内哪些资源必须补齐，避免只剩表结构

## 执行前先记住

- 系统级任务默认先方案、后执行
- 项目资源默认按“三驾马车”理解：表格、文档、报表
- 总控 Skill 要先拆项目、表、文档、报表、字段、关联、示例数据和查询方式
- 如果用户明确要求报表，总控层也必须把固定预检链交出去，不能只说“去建报表”
- 如果系统里包含在线文档，总控层也要把文档主链交出去，不要只说 `doc create`
- 如果系统里包含在线文档版本管理需求，总控层也要把版本主链交出去

高风险跑偏点：

- 不要把系统拆解误收缩成“只有几张表”
- 不要漏掉项目内文档资源和报表资源
- 不要把在线文档误当成只创建不维护的一次性资源
- 不要在表结构、字段、查询方式还没稳定时，直接下钻图表组件
- 不要路由到报表后直接从 `widget-add` 开始

## 快速开始

推荐执行顺序：

1. 先确认认证和上下文
2. 做系统拆解
3. 路由到子技能
4. 再落到具体命令或接口

如果用户要求的是“整体搭系统”，默认方案里建议显式写出：

1. 团队 / 项目上下文
2. 项目三驾马车资源清单
3. 核心业务表
4. 字段与关联关系
5. 示例数据
6. 常用查询 / 视图 / 筛选案例
7. 后续权限、工作流、报表或对接的子 Skill 路由

## 关键规则

### 1. 系统方案不能只有表

默认系统方案至少要覆盖：

- 表格资源
- 文档资源
- 报表资源

推荐理解方式：

- 表格负责承接结构化业务对象
- 文档负责承接 TipTap 在线说明、制度、知识沉淀
- 报表负责承接经营统计、漏斗分析、仪表盘

如果方案里只有表，没有文档和报表，通常还不算完整系统方案。

如果方案里已经包含在线文档，默认还要考虑后续维护链路：

- `doc info`
- `doc update`
- `doc delete`

如果文档承担制度、知识库、说明页等长期演进内容，还要继续考虑版本链路：

- `doc versions`
- `doc version`
- `doc restore`

### 2. 子 Skill 路由要有顺序

默认建议顺序：

1. `dimens-team`
2. `dimens-project`
3. `dimens-table`
4. `dimens-permission`
5. `dimens-workflow`
6. `dimens-report`
7. `dimens-key-auth`

实际是否进入后置 Skill，要看用户有没有明确提出对应需求。

### 3. 报表一旦进入，就必须带固定预检链

如果用户明确要求：

- 看板
- 仪表盘
- 统计图表
- 经营报表

总控层至少要给出这条顺序：

1. `report create`
2. `report preview`
3. `report widget-add`
4. `report query-widget`
5. `report query`

不要只路由到 `dimens-report`，却不把这条链路说清楚。

### 4. 在线文档一旦进入，也要带文档主链

如果系统里明确包含：

- 制度页
- 操作手册
- 产品说明
- 知识沉淀

总控层至少要提醒这条文档主链：

1. `doc create`
2. `doc info`
3. `doc update`
4. `doc delete`

不要只告诉用户先创建一份文档，却不告诉后续怎么查、怎么改、怎么删。

### 5. 在线文档如果涉及历史回滚，也要带版本主链

如果用户继续提出：

- 看历史版本
- 回看旧内容
- 恢复误删误改内容
- 回滚到某个版本

总控层至少要提醒这条版本主链：

1. `doc versions`
2. `doc version`
3. `doc restore`

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：系统拆解、接口导航、命令映射等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

如果只看本目录，推荐阅读顺序是：

1. 先看 `SKILL.md`
2. 再看 `references/system-decomposition.md`
3. 再看 `references/skill-routing.md`
4. 用户要求直接给命令时，再看 `references/command-mapping.md`

## 参考资料

- `references/system-decomposition.md`
- `references/skill-routing.md`
- `references/interface-navigation.md`
- `references/command-mapping.md`
- `references/examples.md`
