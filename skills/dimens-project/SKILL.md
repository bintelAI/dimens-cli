---
name: dimens-project
slug: dimens-project
description: 用于维表智联项目创建、项目初始化和系统落地入口设计，适合从 teamId 开始创建项目并衔接后续建表与权限主链。
version: 1.0.0
author: 方块智联工作室
tags: [project, bootstrap, setup, initialization, dimens-cli]
---

# 项目初始化技能（dimens-project）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 执行任何项目命令前，先完成认证；认证方式优先参考 `dimens-key-auth`
- ✅ 项目一定挂在团队下面，创建项目前必须先确认 `teamId`
- ✅ 当用户给的是 `https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/` 这类链接时，优先直接解析成当前项目上下文
- ✅ 这个技能只负责“项目创建 / 项目初始化 / 项目落地入口”，不替代表结构、字段设计、权限设计
- ✅ 默认项目初始化主链是：`project create -> sheet/doc/report create -> view list/create -> column create -> role create -> permission create -> role assign-user`
- ✅ 如果用户只是查团队、成员、租户隔离，优先回到 `dimens-team`
- ✅ 如果用户已经明确要建表和字段，项目创建完成后应继续路由到 `dimens-table`
- ✅ 项目初始化时不要只想到多维表格和报表，文档也是项目内的核心资源；在线文档走 TipTap 富文本链路，文档主链默认是 `doc create -> doc info -> doc update -> doc delete`
- ✅ 项目资源默认按“三驾马车”理解：表格、文档、报表；不要只初始化其中一个就停下
- ✅ 三驾马车的推荐初始化顺序是：先定项目，再补核心表格，再补在线文档，再补经营报表，最后回到视图、字段、权限和报表预检
- ✅ 如果项目初始化包含报表，不要只执行 `report create`；默认还应继续进入 `report create -> report preview -> report widget-add -> report query-widget -> report query` 这条固定预检链

高风险跑偏点：

- 不要把项目初始化理解成“只建一个项目壳子”
- 不要只建表格，不补文档和报表入口
- 不要把在线文档误解成只创建一次、不需要维护的资源
- 不要以为项目里有报表资源就代表看板已可用
- 不要在项目初始化阶段只补 `report create` 就结束
- 不要在没有表结构或字段映射的情况下直接创建组件

## 快速索引：意图 → 命令 → 必填参数

| 用户意图 | 工具 / 命令 | 必填参数 | 常用可选 | 说明 |
| --- | --- | --- | --- | --- |
| 创建项目 | `dimens-cli project create` | `teamId`, `name` | `description`, `projectType`, `remark`, `app-url` | 项目是系统落地入口 |
| 查询项目列表 | `dimens-cli project list` | `teamId` | `page`, `size`, `keyword`, `app-url` | 先确认项目上下文 |
| 查询项目详情 | `dimens-cli project info` | `teamId`, `id` | `app-url` | 校验项目是否创建成功 |
| 切换默认项目 | `dimens-cli auth use-project` | `projectId` | - | 影响后续建表默认上下文 |
| 创建第一张表 | `dimens-cli sheet create` | `projectId`, `name` | `teamId`, `app-url` | 项目创建后通常立刻进入表结构初始化 |
| 创建在线文档 | `dimens-cli doc create` | `teamId`, `projectId`, `title` | `content`, `format`, `parent-id`, `app-url` | 文档型项目或需要说明页时优先使用 |
| 获取文档详情 | `dimens-cli doc info` | `teamId`, `projectId`, `documentId` | `app-url` | 回查文档是否创建成功，或读取当前内容 |
| 更新文档内容 | `dimens-cli doc update` | `teamId`, `projectId`, `documentId`, `content`, `version` | `create-version`, `change-summary`, `app-url` | TipTap 在线文档修改走这里 |
| 删除文档 | `dimens-cli doc delete` | `teamId`, `projectId`, `documentId` | `app-url` | 清理误建或废弃文档资源 |
| 获取文档版本列表 | `dimens-cli doc versions` | `teamId`, `projectId`, `documentId` | `page`, `size`, `app-url` | 查看文档历史版本 |
| 获取指定文档版本 | `dimens-cli doc version` | `teamId`, `projectId`, `documentId`, `version` | `app-url` | 读取指定历史版本内容 |
| 恢复文档版本 | `dimens-cli doc restore` | `teamId`, `projectId`, `documentId`, `version` | `app-url` | 回滚到指定版本 |
| 创建报表 | `dimens-cli report create` | `projectId`, `name` | `description`, `type`, `app-url` | 经营看板或统计分析场景时优先使用 |
| 预览报表数据源 | `dimens-cli report preview` | `projectId`, `data-source` | `data-mapping`, `params`, `app-url` | 创建组件前优先执行 |
| 创建报表组件 | `dimens-cli report widget-add` | `projectId`, `reportId`, `type`, `data-source` | `title`, `data-mapping`, `chart-config`, `layout`, `app-url` | 不要跳过预检 |
| 单组件试跑 | `dimens-cli report query-widget` | `projectId`, `reportId`, `widgetId` | `params`, `data-source`, `data-mapping`, `app-url` | 校验单个组件结果 |

## 核心约束

### 1. 项目是系统落地的最小业务容器

- 团队是最高隔离边界
- 项目是系统建设的第一层业务容器
- 表、字段、视图、角色权限都挂在项目之下继续展开

### 2. 项目创建完成不代表系统可用

项目创建成功后，默认还要继续补：

1. 至少一张核心表
2. 至少一份在线文档
3. 至少一份核心报表
4. 至少一个公开默认视图
5. 至少一组核心字段
6. 若用户要求多人协作，则继续补角色和项目权限

如果项目里包含报表，还应继续补：

7. 至少一次 `report preview`
8. 至少一个 `widget-add`
9. 至少一次 `report query` 或 `report query-widget`

否则项目里的报表大概率只是空壳资源。

推荐理解方式：

- 表格负责承接结构化业务对象
- 文档负责承接 TipTap 在线说明、制度、知识沉淀
- 报表负责承接管理层统计、仪表盘和经营看板

这三类资源默认一起构成项目“三驾马车”，不要漏掉其中任何一个再声称项目初始化已闭环。

补充说明：

- 文档资源不是一次性资源，默认还要支持 `doc info / doc update / doc delete`
- 如果用户要求版本追踪或历史回滚，还要继续支持 `doc versions / doc version / doc restore`
- 如果用户要的是操作手册、制度页、知识沉淀页，通常意味着后续会持续修订，不要只创建不维护

### 3. 项目创建参数要与真实 CLI 对齐

- 推荐使用 `--description` 传项目说明
- 推荐使用 `--project-type` 传项目类型，当前常见值是 `spreadsheet` / `document`
- `--remark` 仅作为兼容备注字段，不替代 `description`

### 4. 项目初始化后续路由

| 下一步目标 | 优先 Skill |
| --- | --- |
| 继续建表、字段、relation、默认视图 | `dimens-table` |
| 继续做角色、项目权限、行级策略 | `dimens-permission` |
| 继续补经营看板、统计图表、仪表盘 | `dimens-report` |
| 回头确认 teamId、成员、上下文来源 | `dimens-team` |
| 做系统级整体拆解 | `dimens-system-orchestrator` |

### 4.1 报表初始化默认顺序

如果项目初始化阶段就要把报表一起补齐，建议按下面顺序执行：

1. `dimens-cli report create`
2. `dimens-cli report preview`
3. `dimens-cli report widget-add`
4. `dimens-cli report query-widget`
5. `dimens-cli report query`
6. 如需公开，再执行 `dimens-cli report publish`

不要把报表初始化理解成“只创建一个空报表资源”，而要把上面这条顺序当成固定预检链。

### 4.2 三驾马车初始化顺序

如果用户要求“帮我把项目整体搭起来”，默认建议按下面顺序推进：

1. `dimens-cli project create`
2. `dimens-cli sheet create`
3. `dimens-cli doc create`
4. `dimens-cli report create`
5. `dimens-cli view list`
6. 如缺少默认公开视图，再执行 `dimens-cli view create`
7. `dimens-cli column create`
8. 如果报表要真正可用，再继续执行 `report preview -> report widget-add -> report query-widget -> report query`
9. 如果涉及协作，再继续执行角色和权限主链

注意：

- 三驾马车不是要求每个项目都做得一样重，而是要求初始化时不要漏掉资源类型
- 文档资源默认走 TipTap 富文本链路，不要误用表格链路代替在线文档；文档维护默认继续走 `doc info / doc update / doc delete`
- 如果用户提到历史版本、误恢复、版本回退，默认继续进入 `doc versions / doc version / doc restore`
- 报表资源默认要走固定预检链，不要只留下空壳

## 必查文档

| Skill / references | 作用 | 什么时候必须看 |
| --- | --- | --- |
| `dimens-key-auth` | 认证、token 获取与上下文切换 | 执行任何项目命令前必须先确认 |
| `dimens-team` | 团队、成员、上下文来源 | 缺少 teamId 或上下文不稳时必须看 |
| `dimens-table` | 项目创建后的建表主链 | 项目创建完成后建议立刻看 |
| `dimens-permission` | 角色和项目权限主链 | 需要多人协作时建议看 |
| `references/examples.md` | 项目命令与初始化案例 | 直接执行时建议先看 |
| `references/bootstrap-flow.md` | 从项目到建表/权限的端到端初始化顺序 | 用户要求一步到位时必须看 |

## 使用场景示例

### 场景 1：创建 CRM 项目

```bash
dimens-cli project create \
  --team-id TTFFEN \
  --name 客户管理系统 \
  --description 客户全生命周期管理 \
  --project-type spreadsheet
```

创建完成后建议立刻继续：

1. `dimens-cli sheet create`
2. `dimens-cli doc create`
2. `dimens-cli view list`
3. 若没有默认公开视图，再执行 `dimens-cli view create`
4. `dimens-cli column create`
5. `dimens-cli report create`
6. 如果还要管理层看板，再继续 `dimens-cli report preview -> report widget-add -> report query-widget -> report query`

### 场景 2：用户只给了维表链接

如果用户给的是：

```text
https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/
```

默认解释为：

- `teamId = TTFFEN`
- `projectId = PXWXBJQ`

这时不需要重复追问项目来源，而是直接进入项目初始化后的下一步操作。

### 场景 3：创建文档型项目

```bash
dimens-cli project create \
  --team-id TTFFEN \
  --name 知识库项目 \
  --description 内部知识沉淀空间 \
  --project-type document
```

创建项目后建议立刻继续：

```bash
dimens-cli doc create \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --title 产品说明文档 \
  --content '<p>欢迎使用在线文档</p>' \
  --format richtext
```

如果要做文档闭环维护，继续：

```bash
dimens-cli doc info \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID

dimens-cli doc update \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --content '<p>更新后的在线文档</p>' \
  --version 1 \
  --create-version true \
  --change-summary 补充项目说明

dimens-cli doc delete \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID
```

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 项目创建成功，但后续建表报缺少上下文 | 没切换默认项目，也没显式传 `projectId` | 继续执行 `auth use-project` 或显式传 `--project-id` |
| 技能里写了 `description`，CLI 落不进去 | 用了旧命令口径或 CLI 未同步 | 当前应使用 `--description`，并确认 CLI 已升级 |
| 项目建好了，但前端表无法筛选 | 只建了项目和表，没补默认公开视图 | 继续执行 `view list` / `view create` |
| 项目里想创建在线文档却失败 | 只按表格链路初始化，没走文档主链 | 使用 `dimens-cli doc create` 创建 TipTap 在线文档 |
| 文档创建完后不知道怎么继续维护 | 误以为在线文档只有创建命令 | 继续使用 `dimens-cli doc info / doc update / doc delete` 做回查、修订和清理 |
| 项目里需要经营看板却没有报表入口 | 只初始化了表格或文档，没把报表作为核心资源补齐 | 使用 `dimens-cli report create` 先补报表主资源 |
| 项目里已经有报表资源，但图表还是空的 | 只创建了报表，没有继续预览数据源和创建组件 | 按 `report create -> report preview -> report widget-add -> report query-widget -> report query` 的固定预检链继续补齐 |
| 项目初始化做完了，但其实只有单一资源 | 没按“三驾马车”理解项目资源 | 回到表格、文档、报表三类资源，确认哪些还没补齐 |
| 项目能打开，但多人协作没权限 | 只创建了项目，没有继续配置角色和项目权限 | 继续路由到 `dimens-permission` |

## 参考文档

- `references/examples.md`
- `references/bootstrap-flow.md`
