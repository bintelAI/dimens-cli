# 项目初始化端到端链路

## 1. 目标

把下面这条链路收成用户可直接执行的初始化顺序：

1. 创建项目
2. 创建核心表或在线文档
3. 补默认公开视图
4. 创建核心字段 / relation
5. 创建角色
6. 配项目权限
7. 分配角色

## 2. 推荐顺序

### 2.1 创建项目

```bash
dimens-cli project create \
  --team-id TEAM_ID \
  --name 客户管理系统 \
  --description 客户全生命周期管理 \
  --project-type spreadsheet
```

### 2.2 创建第一张核心表

```bash
dimens-cli sheet create --team-id TEAM_ID --project-id PROJECT_ID --name 客户表
```

### 2.2.1 创建第一份在线文档

如果项目需要文档说明页、知识沉淀页、协作文档，而不是先建表，可以直接创建在线文档：

```bash
dimens-cli doc create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --title 产品说明文档 \
  --content '<p>欢迎使用在线文档</p>' \
  --format richtext
```

说明：

- 当前在线文档编辑器走 TipTap 富文本链路
- 这种场景不要误用 `sheet create` 代替文档创建
- 如果是文档型项目，建议先补 `doc create`，再决定是否继续建表
- 文档资源不是一次性资源，创建后默认还要继续支持查询、修改、删除

### 2.2.2 文档闭环维护

文档创建成功后，推荐继续掌握下面这条文档主链：

```bash
dimens-cli doc info \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOC_ID

dimens-cli doc update \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --content '<p>更新后的在线文档</p>' \
  --version 1 \
  --create-version true \
  --change-summary 补充说明

dimens-cli doc delete \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOC_ID
```

说明：

- `doc info` 用于回查文档详情，确认文档是否创建成功、当前版本是多少
- `doc update` 用于修订 TipTap 在线文档内容，必须显式带 `version`
- `doc delete` 用于清理误建或废弃的文档资源
- 如果项目是文档型项目，不要停在 `doc create`，而要把 `info/update` 一起视作默认维护链路

### 2.2.3 文档版本管理

如果在线文档承担制度页、说明页、知识沉淀页，建议继续掌握版本链：

```bash
dimens-cli doc versions \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --page 1 \
  --size 20

dimens-cli doc version \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --version 3

dimens-cli doc restore \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --version 3
```

说明：

- `doc versions` 用于查看版本元数据列表
- `doc version` 用于查看指定历史版本正文
- `doc restore` 用于恢复到指定历史版本，并生成新的当前版本
- 不要在误修改后直接继续 `doc update` 覆盖当前内容；先看版本链，再决定是否恢复

### 2.3 检查并补默认公开视图

```bash
dimens-cli view list --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID
```

如果缺失：

```bash
dimens-cli view create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --name 默认视图 \
  --type grid \
  --is-public true \
  --config '{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}'
```

### 2.4 创建字段

```bash
dimens-cli column create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --label 客户名称 --type text
dimens-cli column create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --label 客户等级 --type select --options '[{"label":"A级","color":"bg-blue-100 text-blue-700"},{"label":"B级","color":"bg-slate-100 text-slate-700"},{"label":"C级","color":"bg-amber-100 text-amber-700"}]'
```

说明：

- `--options` 现在推荐直接传 JSON 数组对象，这样可以一次补齐 `label / color / id`
- 旧的逗号分隔写法仍兼容，但只适合最简单的文本选项

### 2.5 创建 relation 字段

```bash
dimens-cli column create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id CONTACT_SHEET_ID \
  --label 所属客户 \
  --type relation \
  --target-sheet-id CUSTOMER_SHEET_ID \
  --display-column-id CUSTOMER_NAME_FIELD_ID
```

### 2.6 创建角色并配置项目权限

权限主链推荐直接沿用 `dimens-permission/references/command-mapping.md` 的 `--app-url` 写法，这样其他产品接技能时不需要先拆上下文。

```bash
dimens-cli role create \
  --app-url https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/ \
  --name 销售 \
  --description CRM 销售角色 \
  --can-manage-sheets false \
  --can-edit-schema false \
  --can-edit-data true

dimens-cli permission create \
  --app-url https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/ \
  --role-id ROLE_ID \
  --sheet-id SHEET_ID \
  --data-access private_rw \
  --can-read true \
  --can-write true
```

### 2.7 给用户分配角色

```bash
dimens-cli role assign-user \
  --app-url https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/ \
  --role-id ROLE_ID \
  --user-id USER_ID
```

## 3. 什么时候继续跳转其他 Skill

| 下一步需求 | 跳转 Skill |
| --- | --- |
| 字段细节、relation 模式、筛选案例 | `dimens-table` |
| 角色、项目权限、行级策略 | `dimens-permission` |
| teamId、成员、上下文来源 | `dimens-team` |
| 系统级整体拆解 | `dimens-system-orchestrator` |
