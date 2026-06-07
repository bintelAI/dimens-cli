# 项目初始化端到端链路

## 1. 目标

把下面这条链路收成用户可直接执行的初始化顺序：

1. 设计文档确认
2. 认证与团队上下文确认
3. 看需求生成并上传 SVG 动态封面
4. 创建项目并回写封面
5. 创建项目菜单目录
6. 创建多表格
7. 创建多字段和默认视图
8. 设计 `1 对多 / 多对一` 关联数据
9. 逐表补案例数据并验收
10. 看需求补项目文档
11. 看需求补项目报表
12. 看需求补角色
13. 看需求补权限
14. 全量回查

## 2. 推荐顺序

在执行命令前，默认先按维表特性把下面几件事设计清楚：

- 需要几张核心表
- 每张表的核心字段是什么
- 哪些表之间存在 `1 对多 / 多对一` 关系
- 准备写入哪些案例数据
- 是否需要文档、报表、角色、权限这些后置模块
- 是否需要先生成一个符合项目主题、具备动态动画效果的 SVG 封面
- 是否需要先规划项目菜单目录，以及目录下要挂哪些表格/文档/报表资源

如果用户要求“快速创建 / 一键创建 / 按行业模板创建 / 复用历史脚本 / 补齐项目资源”，先读取 `quick-project-template.md`，把需求或历史 `.mjs` 脚本转换成 `QuickProjectConfig`。模板配置确认后再进入下面阶段闸门；不要直接执行旧脚本，也不要沿用旧脚本里的直接 HTTP 路径、Markdown 文档格式、简化画布 JSON 或未复核颜色。

快速模板的固定入口是：

1. 从需求或历史脚本抽取 `folders/sheets/fields/seedRows/docs/reports/canvases/roles`。
2. 检查所有资源的 `folder` 都存在，表之间依赖批次清楚。
3. 把字段标签、报表维度、报表指标保留为草案；执行时必须用当前表 `column list` 转真实 `fieldId`。
4. 文档草案统一转 TipTap `richtext`，包含标题、摘要卡片、淡色背景块、状态标签和必要 Mermaid。
5. 画布草案统一补完整渲染字段、非空 handle、语义背景色和可读文字色。
6. 生成执行产物目录，至少包含 `config.normalized.json`、`field-map.json`、`rows/*.rows.json`、`reports/*.widgets.json`、`canvases/*.canvas.json`、`execution-result.json`、`execution-error.log`。

### 2.1 阶段闸门总览

项目初始化必须按阶段闸门推进，不能把所有命令一次性串完后再看结果。

| 闸门 | 目标 | 必须证据 |
| --- | --- | --- |
| G0 设计 | 设计文档能落到项目、目录、表、字段、数据、报表、权限 | 资源清单、菜单树、表清单、报表口径、权限矩阵一致 |
| G1 上下文 | token、`teamId`、项目创建目标明确 | 认证成功，团队上下文明确 |
| G2 项目容器 | 项目存在，封面写回或明确不需要 | `project create`、`project info`、必要时 `project update --cover-image` |
| G3 菜单 | 目录和资源归位 | `sheet tree` 能证明资源在目标目录 |
| G4 建模 | 表、字段、视图、关联合规 | 逐表 `column list`、`view list`，字段类型和 options 合规 |
| G5 数据 | 每张需要样例数据的表都有业务数据 | 逐表 `row batch-create --file` 后 `row page`，`rows.length > 0` 且 `data` 非空 |
| G6 文档 | 在线文档可读且符合 TipTap 富文本 | `doc info` 回读标题、摘要卡片、状态标签、淡色块 |
| G7 报表 | 报表基于真实数据源出数 | `row page -> report preview -> widget-add -> query-widget -> query` |
| G8 权限 | 业务角色和权限链完整 | 角色、资源/字段/行级权限、用户绑定或待绑定说明、回查结果 |
| G9 完成 | 汇总证据和未完成项 | 项目 ID、资源 ID、目录、字段、数据、报表、权限证据链 |

### 2.2 创建项目

```bash
dimens-cli project create \
  --team-id TEAM_ID \
  --name 客户管理系统 \
  --description 客户全生命周期管理 \
  --project-type spreadsheet
```

补充建议：

- 如果项目强调品牌感、对外展示、模板销售、知识库入口或市场封面，建议在执行 `project create` 之前先补一张 SVG 封面
- 这张封面建议由 SVG 工具生成，要求：
  - 符合项目主题
  - 固定 `250x150px`，建议写入 `width="250" height="150" viewBox="0 0 250 150"`
  - 使用淡色背景，例如浅蓝、浅紫、浅绿、浅橙或浅灰渐变
  - 有轻量动态动画效果，例如慢速漂浮、淡入淡出、轻微位移或渐变流动
  - 避免快速闪烁、高饱和强对比和复杂大面积动画
  - 可直接作为项目封面图使用
- 封面处理链路建议固定为：
  1. SVG 工具生成封面
  2. `dimens-cli upload file --file ./project-cover.svg`
  3. 拿到上传返回的 URL
  4. 执行 `project create`
  5. 当前 `project create` 不支持 `--cover-image`，所以用 `project info -> project update --cover-image -> project info` 写回并验收封面

### 2.2.1 创建项目菜单目录

项目创建完成后，不要只开始堆资源，建议先把项目菜单目录规划出来。

默认至少考虑下面 4 类菜单节点：

1. 目录 `folder`
2. 表格 `sheet`
3. 文档 `document`
4. 报表 `report`

推荐做法：

- 先按业务域规划目录，例如：
  - 客户中心
  - 经营分析
  - 项目文档
- 再把表格、文档、报表分别挂到对应目录下
- 创建完成后，用下面命令回查菜单树：

```bash
dimens-cli sheet tree --project-id PROJECT_ID
```

说明：

- 目录功能不是可有可无的 UI 装饰，而是项目菜单分层能力的一部分
- 如果项目里会同时出现多张表、多份文档、多份报表，建议优先先建目录
- 当前 CLI 已有 `sheet tree`，可用于回查项目菜单树是否完整

### 2.3 创建多张核心表

```bash
dimens-cli sheet create --team-id TEAM_ID --project-id PROJECT_ID --name 客户表
dimens-cli sheet create --team-id TEAM_ID --project-id PROJECT_ID --name 联系人表
```

### 2.4 创建多字段

```bash
dimens-cli column create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id CUSTOMER_SHEET_ID --label 客户名称 --type text
dimens-cli column create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id CUSTOMER_SHEET_ID --label 客户等级 --type select --options '[{"id":"customer_level_a","label":"A级","color":"bg-blue-100 text-blue-700"},{"id":"customer_level_b","label":"B级","color":"bg-slate-100 text-slate-700"},{"id":"customer_level_c","label":"C级","color":"bg-gray-100 text-gray-700"}]'
```

说明：

- 普通下拉字段推荐直接传 JSON 数组选项，显式补齐 `id / label / color`
- 同一个字段下每个选项 `id` 必须唯一，不能重复
- 状态、阶段、等级、分类、来源、优先级这类稳定有限集合优先建成 `select`；一个单元格可同时选多个标签或分类时优先建成 `multiSelect`
- 选项颜色只能使用前端 12 色池，或使用 `custom:{\"bg\":\"#xxxxxx\",\"text\":\"#xxxxxx\"}`，不要写 CLI 白名单外的 Tailwind 类名
- 人员字段、部门字段属于特殊情况，不要退化成普通下拉
- 当项目本身已有用户体系、部门体系和内置角色体系时，人员下拉优先直接配置为人员字段；部门字段当前禁止生成 `department` 类型，统一使用 `text` 保存部门名称

### 2.5 创建 `1 对多 / 多对一` 关联字段

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

说明：

- 联系人表到客户表通常是“多对一”
- 从客户视角回看联系人通常是“一对多”
- 这类关系字段应建立在多表和主显示字段都已明确的前提下

### 2.6 补案例数据

在字段和关联关系落好以后，默认继续准备并写入案例数据，用于验证：

- 表结构是否合理
- 关联关系是否能正确回查
- 后续文档描述和报表统计是否有可用样例

强制规则：

- 逐表先 `column list` 生成字段映射，再写该表 JSON 文件。
- 使用 `row batch-create --file <json>` 导入，不使用命令行 JSON 字符串做初始化。
- 每张表导入后立刻 `row page --size 5`。
- 任一表 `rows.length=0`、`data:{}`、数值字段是文本或 select 值不在 options 中，都停在数据闸门，不进入报表。

### 2.7 看需求创建第一份在线文档

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

### 2.7.1 文档闭环维护

文档创建成功后，推荐继续掌握下面这条文档主链：

```bash
dimens-cli doc info \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOC_ID

dimens-cli doc info \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id sh_xxx

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
- 如果输入来自浏览器文档链接，URL 里通常拿到的是 `sheetId=sh_xxx` 这一层菜单资源 ID，不是 `documentId=doc_xxx`；这时先用 `doc info --sheet-id sh_xxx` 拿文档详情，再继续更新
- `doc update` 用于修订 TipTap 在线文档内容，必须显式带 `version`
- `doc delete` 用于清理误建或废弃的文档资源
- 如果项目是文档型项目，不要停在 `doc create`，而要把 `info/update` 一起视作默认维护链路

### 2.7.2 文档版本管理

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

### 2.8 检查并补默认公开视图

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

### 2.9 看需求创建报表

如果项目还需要经营看板、统计分析或仪表盘，建议继续走报表固定预检链：

进入条件：

- 报表数据源表已经通过数据闸门。
- 维度 / X 轴和指标字段都来自当前选中表的 `column list`。
- `dataSource.columns`、`fieldIds`、`dataMapping` 已按真实字段生成。

固定链路：

1. 数据源表 `row page`
2. `dimens-cli report create`
3. `dimens-cli report preview`
4. `dimens-cli report widget-add`
5. `dimens-cli report query-widget`
6. `dimens-cli report query`

### 2.9.1 菜单层回查

资源创建完成后，建议再回查一次项目菜单树：

```bash
dimens-cli sheet tree --project-id PROJECT_ID
```

重点确认：

- 是否已经存在目录节点
- 表格是否归到正确目录
- 文档是否归到正确目录
- 报表是否归到正确目录

### 2.10 创建角色并配置项目权限

权限主链推荐直接沿用 `dimens-manager/references/permission/references/command-mapping.md` 的 `--app-url` 写法，这样其他产品接技能时不需要先拆上下文。

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

### 2.11 给用户分配角色

```bash
dimens-cli role assign-user \
  --app-url https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/ \
  --role-id ROLE_ID \
  --user-id USER_ID
```

## 3. 什么时候继续跳转其他 Skill

| 下一步需求 | 跳转 Skill |
| --- | --- |
| 字段细节、relation 模式、筛选案例 | `dimens-manager/references/table/overview.md` |
| 角色、项目权限、行级策略 | `dimens-manager/references/permission/overview.md` |
| teamId、成员、上下文来源 | `dimens-manager/references/team/overview.md` |
| 系统级整体拆解 | `dimens-system-orchestrator` |
