# dimens-project 项目初始化案例

## 1. 创建项目

```bash
dimens-cli project create \
  --team-id TTFFEN \
  --name 客户管理系统 \
  --description 客户全生命周期管理 \
  --project-type spreadsheet
```

说明：

- `--description` 用于项目说明
- `--project-type` 当前常见值是 `spreadsheet` / `document`

## 2. 创建项目后立即校验

```bash
dimens-cli project list --team-id TTFFEN --output json
dimens-cli project info --team-id TTFFEN --id PROJECT_ID --output json
```

## 3. 切换默认项目

```bash
dimens-cli auth use-project PROJECT_ID
```

## 4. 项目内在线文档案例

```bash
dimens-cli doc create \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --title 项目说明文档 \
  --content '<p>欢迎使用在线文档</p>' \
  --format richtext

dimens-cli doc info \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID

dimens-cli doc update \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --content '<p>更新后的项目说明</p>' \
  --version 1 \
  --create-version true \
  --change-summary 补充项目背景

dimens-cli doc versions \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --page 1 \
  --size 20

dimens-cli doc version \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --version 2

dimens-cli doc restore \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --document-id DOC_ID \
  --version 2
```

说明：

- 文档维护主链是 `doc create / doc info / doc update / doc delete`
- 如果要回看历史版本或恢复旧内容，继续走 `doc versions / doc version / doc restore`

## 5. 继续进入建表主链

```bash
dimens-cli sheet create --team-id TTFFEN --project-id PROJECT_ID --name 客户表
dimens-cli view list --team-id TTFFEN --project-id PROJECT_ID --sheet-id SHEET_ID
```

如果还没有默认公开视图：

```bash
dimens-cli view create \
  --team-id TTFFEN \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --name 默认视图 \
  --type grid \
  --is-public true \
  --config '{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}'
```

## 6. 继续进入权限主链

```bash
dimens-cli role create \
  --app-url https://dimens.bintelai.com/#/TTFFEN/PROJECT_ID/ \
  --name 销售 \
  --description CRM 销售角色 \
  --can-manage-sheets false \
  --can-edit-schema false \
  --can-edit-data true
```
