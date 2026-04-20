# dimens-project

## 技能简介

`dimens-project` 用于处理维表智联中的项目创建、项目初始化和项目落地入口，是从团队上下文进入建表与权限主链的中间层技能。

这个技能默认不只处理“创建项目”这一件事，还负责把项目初始化推进到可继续落表、落文档、落报表、落权限的状态。

## 适用场景

- 从 `teamId` 开始创建新项目
- 为业务系统补项目初始化入口
- 解释项目创建后下一步该先建什么
- 把“创建项目 -> 建表 -> 权限”收成一条可执行链路
- 把表格、文档、报表这三类项目资源一起补齐

## 执行前先记住

- 项目资源默认按“三驾马车”理解：表格、文档、报表
- 在线文档是项目内核心资源之一，默认走 TipTap 富文本链路
- 文档维护主链是 `doc create -> doc info -> doc update -> doc delete`
- 如果涉及历史版本、回滚恢复，继续走版本主链 `doc versions -> doc version -> doc restore`
- 报表不是 `report create` 完就结束，默认还要继续走固定预检链
- 如果用户已经明确要建表、字段、relation，项目创建完成后要继续转到 `dimens-table`

高风险跑偏点：

- 不要把项目初始化理解成“只创建项目壳子”
- 不要只补表格，不补文档和报表
- 不要把在线文档误判成只创建、不维护的一次性资源
- 不要以为项目里有报表资源就代表看板可用
- 不要跳过 `report preview`，直接开始加组件

## 快速开始

优先准备：

- 当前用户认证状态
- `teamId`
- 项目名称
- 目标项目类型（如 `spreadsheet` / `document`）

如果用户给的是维表页面地址，例如 `https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/`，推荐后续建表、默认公开视图、角色权限主链都优先按 `--app-url` 组织，CLI 会自动解析上下文；这条用法当前已有命令级测试覆盖。

如果用户要求“帮我把项目整体搭起来”，默认顺序建议是：

1. `project create`
2. `sheet create`
3. `doc create`
4. `report create`
5. `view list/create`
6. `column create`
7. 如果有报表，再继续 `report preview -> report widget-add -> report query-widget -> report query`
8. 如果涉及协作，再继续角色和权限主链

这里的重点不是命令多，而是不要漏资源类型，也不要把报表留成空壳。

如果项目里有在线文档，创建后默认还要知道：

1. `doc info` 用于回查文档详情
2. `doc update` 用于持续修订 TipTap 文档内容
3. `doc delete` 用于清理误建或废弃文档

如果文档涉及制度、手册、知识沉淀这类长期演进内容，默认还要知道：

1. `doc versions` 用于查看版本列表
2. `doc version` 用于查看指定历史版本
3. `doc restore` 用于恢复到指定版本

## 关键规则

### 1. 项目初始化默认看三类资源

- 表格：承接结构化业务对象
- 文档：承接 TipTap 在线说明、制度、知识沉淀
- 报表：承接经营看板、统计图表、仪表盘

如果只补了其中一类资源，项目初始化通常还不能算闭环。

### 2. 报表资源默认要走固定预检链

如果项目里还要补报表，建议按下面顺序推进：

1. `report create`
2. `report preview`
3. `report widget-add`
4. `report query-widget`
5. `report query`

不要只创建空报表资源就停下。

### 3. 文档资源不要被表格资源替代

如果用户说的是：

- 项目说明
- 操作手册
- 制度规范
- 知识沉淀

默认优先走在线文档，而不是拿表格备注字段凑一个替代方案。

文档资源默认也不是一次性资源，后续应继续使用 `doc info / doc update / doc delete` 做维护闭环。

如果发生误覆盖、误修改或需要回滚历史内容，继续使用 `doc versions / doc version / doc restore` 做版本闭环。

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口
- `references/`：项目初始化与端到端执行案例

如果只看本目录，推荐阅读顺序是：

1. 先看 `SKILL.md`
2. 再看 `references/bootstrap-flow.md`
3. 最后看 `references/examples.md`

## 参考资料

- `references/examples.md`
- `references/bootstrap-flow.md`
