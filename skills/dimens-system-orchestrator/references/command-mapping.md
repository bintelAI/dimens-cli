# 系统搭建命令映射

## 1. 使用目的

这份文档把“系统级搭建步骤”直接映射到可执行命令或接口，避免总控 Skill 只停留在路由建议，导致 AI 还要自己继续摸索具体参数。

## 2. 执行前检查

### 2.1 先完成认证

推荐优先使用：

```bash
dimens-cli auth api-key-login \
  --base-url https://dimens.bintelai.com \
  --api-key ak_xxx \
  --api-secret sk_xxx
```

如果还不清楚认证边界，先看：

- `../dimens-key-auth/references/login-flow.md`
- `../dimens-key-auth/references/examples.md`

### 2.2 再确认上下文

```bash
dimens-cli auth use-team TEAM_ID
dimens-cli project list --team-id TEAM_ID
```

如果用户直接给的是维表链接，例如：

```text
https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/
```

默认直接解析为：

- `TEAM_ID = TTFFEN`
- `PROJECT_ID = PXWXBJQ`

后续命令直接代入即可，不要再把链接当普通描述文本丢掉。

## 3. 系统搭建步骤 → 命令

| 系统搭建步骤 | 优先命令 | 说明 |
| --- | --- | --- |
| 确认团队与项目上下文 | `dimens-cli project list --team-id TEAM_ID` | 系统建设前先确认项目归属 |
| 创建项目 | `dimens-cli project create --team-id TEAM_ID --name 项目名` | 所有表都挂在项目下 |
| 查看项目详情 | `dimens-cli project info --team-id TEAM_ID --project-id PROJECT_ID` | 校验上下文是否正确 |
| 创建工作表 | `dimens-cli sheet create --team-id TEAM_ID --project-id PROJECT_ID --name 表名` | 新系统一般先建核心表 |
| 查看表详情 | `dimens-cli sheet info --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID` | 校验表结构 |
| 查看视图列表 | `dimens-cli view list --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID` | 建表后先确认默认视图是否已存在 |
| 创建公开默认视图 | `dimens-cli view create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --name 默认视图 --type grid --is-public true --config '{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}'` | 技能建表链路默认要求至少补一个公开默认视图 |
| 查看字段列表 | `dimens-cli column list --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID` | 写入行数据前必须先取字段 |
| 创建字段 | `dimens-cli column create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --label 字段名 --type text` | 推荐统一使用 `--label` |
| 创建行 | `dimens-cli row create --sheet-id SHEET_ID --values '{\"fld_xxx\":\"值\"}'` | CLI 会映射到服务端 `data` |
| 更新行 | `dimens-cli row update --sheet-id SHEET_ID --row-id ROW_ID --version 1 --values '{\"fld_xxx\":\"新值\"}'` | 更新前要拿到版本号 |
| 更新单元格 | `dimens-cli row set-cell --sheet-id SHEET_ID --row-id ROW_ID --field-id FIELD_ID --value 新值 --version 1` | 推荐用 `fieldId`，不要用中文字段名 |
| 查询行数据 | `dimens-cli row page --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --page 1 --size 20` | 验证表是否可用 |

## 4. CRM 最小可执行链路

### 4.1 创建项目

```bash
dimens-cli project create --team-id TEAM_ID --name 客户管理系统
```

### 4.2 创建客户表

```bash
dimens-cli sheet create --team-id TEAM_ID --project-id PROJECT_ID --name 客户表
```

### 4.3 创建字段

```bash
dimens-cli column create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --label 客户名称 \
  --type text
```

```bash
dimens-cli column create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --label 客户等级 \
  --type select
```

补充：

- `select`、`multiSelect` 等字段通常还需要额外 `config`
- 如需确认字段结构，优先回看 `../dimens-table/references/field-design-patterns.md`

### 4.4 先补默认公开视图，再继续

```bash
dimens-cli view list \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID
```

如果还没有公开默认视图：

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

### 4.5 先查字段，再写行

```bash
dimens-cli column list \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID
```

### 4.6 用 fieldId 写入行

```bash
dimens-cli row create \
  --sheet-id SHEET_ID \
  --values '{"fld_customerName":"华东智造","fld_customerLevel":"A"}'
```

## 5. 必须显式提醒的坑

| 坑点 | 正确做法 |
| --- | --- |
| 没登录就直接跑表格命令 | 先执行 `auth api-key-login` 或其他认证链路 |
| 创建字段还用 `--title` 当规范写法 | 现在兼容，但推荐统一改成 `--label` |
| 建表后没检查默认视图 | 先 `view list`，缺失时补一个公开的 `grid` 默认视图 |
| 行写入直接用中文字段名 | 先查字段列表，拿 `fieldId` 再写 |
| `row set-cell` 继续用 `columnId` 理解服务端 | 服务端真实字段是 `fieldId`，`columnId` 只是兼容参数 |
| 忽略 `version` | 行更新和单元格更新都建议显式带 `version` |
