---
name: dimens-manager-table
slug: dimens-manager-table
description: 用于维表智联工作表、字段、视图、行数据、relation 和查询链路设计与排查。
version: 1.0.0
author: 方块智联工作室
tags: [table, sheet, row, column, view, dimens-cli]
---

# dimens-manager 多维表格章节

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 执行任何 `project / sheet / column / row / ai` 命令前，先完成认证；认证方式优先参考 `dimens-manager/references/key-auth/overview.md`
- ✅ 表格能力默认要先确认 `projectId`，大多数写操作还需要 `teamId`
- ✅ CLI 是表、字段、视图、行数据操作的首选入口；接口案例只用于解释真实契约和边界
- ✅ 缺少 `teamId/projectId/sheetId/fieldId/rowId/viewId` 时，先用列表、详情或用户确认补齐，不要猜 ID
- ✅ 如果用户还处在“创建项目 / 初始化项目”阶段，先路由到 `dimens-manager/references/project/overview.md`，不要在 `dimens-manager/references/table/overview.md` 里直接吞掉上游步骤
- ✅ 字段、视图、行数据都属于工作表上下文，不能脱离 `sheetId` 单独判断
- ✅ 默认要优先帮助用户把“项目 -> 表 -> 字段 -> 关联 -> 示例数据 -> 查询案例”搭起来
- ✅ 字段设计必须细到可落地，不能只写“有客户名称、状态、时间”这种抽象描述
- ✅ 创建字段时规范参数使用 `--label`；`--title` 只作为兼容参数说明，不作为技能生成命令的推荐写法。
- ✅ 创建字段前必须先判断是否存在稳定枚举语义；如果字段天然是状态、阶段、等级、分类、来源、标签、优先级、风险级别等有限集合，优先使用 `select` 或 `multiSelect`，不要退化成普通 `text`
- ✅ 金额、数量、人数、库存、时长、评分、完成率等后续要统计或聚合的指标字段必须设计为 `number`；不能为了省事全建成 `text`。
- ✅ relation 字段创建必须补齐目标表，推荐显式传 `--target-sheet-id`，并尽量补 `--display-column-id`
- ✅ 创建多张表前必须先拆依赖层级：无依赖表可有限并发创建；被 relation / 单向绑定引用的基础表先创建并写入样例数据；存在单向绑定、relation 依赖目标表 / 字段 / 行的表最后创建。
- ✅ `select` / `multiSelect` 字段在技能创建时必须同时给出完整候选项，不能只定义字段名和类型
- ✅ `select` / `multiSelect` / 下拉选择类配置在技能输出时必须同时给出规范 `options`：每个选项至少包含唯一 `id`、非空 `label`、合法 `color`；不要只给字符串数组或只给 `label`
- ✅ `options` 推荐始终使用 JSON 对象数组传给 `--options`；逗号分隔字符串只是 CLI 兼容能力，不作为技能生成规范
- ✅ 用户上传 Excel 并要求创建选择器字段时，必须先从 Excel 表头和样本值提取候选项，用 `column create --options` 创建完整下拉；行数据写入必须映射到这些候选项，不能把不存在的下拉值直接写入
- ✅ 选项颜色字符串要与前端真实实现对齐：内置颜色使用 `bg-xxx-100 text-xxx-700`，自定义颜色使用 `custom:{\"bg\":\"#xxxxxx\",\"text\":\"#xxxxxx\"}`
- ✅ 当前 `dimens-cli` 对字段选项颜色的内置白名单已与前端真实字段配置对齐为 12 色；如果超出这 12 种内置色，优先改用 `custom:{...}`，不要直接写扩展类名
- ✅ `select` / `multiSelect`、`person` 都属于特殊字段，不能只按普通文本字段理解
- ✅ 如果项目已经有自己的部门、内置角色和用户体系，且需求本质是“人员下拉 / 负责人选择 / 成员选择”，优先配置 `person` 字段，不要误建成普通下拉字段
- ✅ 部门字段当前执行规则：当前禁止生成 `department` 字段类型，统一使用 `text` 字段保存部门名称；示例命令为 `dimens-cli column create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --label 所属部门 --type text`
- ✅ 如果需求本质是部门选择、部门归属、部门筛选，当前先按“部门名称文本”落地，不要误建成普通下拉字段，也不要生成 `department` 类型
- ✅ 新表落地后必须确认至少存在一个公开默认视图；如果技能链路没有自动补齐，就要显式执行 `view create`
- ✅ `row/page` 默认要按“基于字段的搜索、筛选、排序”来解释，不只是分页
- ✅ 系统视图相关问题要区分团队级默认字段和项目级实际分配字段
- ✅ 如果字段类型是 `workflow`，必须同时看工作流字段绑定与行数据链路：`dimens-manager/references/workflow/references/field-binding.md`
- ✅ 处理字段和行写入问题时，不能只看字段结构，还要同步看权限与系统字段边界
- ✅ 表格接口能读取不代表一定可写，行级、列级、协同权限可能继续收敛
- ✅ 如果后续要做报表，这一步就要提前考虑字段能否直接进入 `report preview / query-widget / dataMapping`，不要等到报表阶段再返工
- ✅ 字段 ID 是每张表独立生成的系统 ID；`column create` 后必须对目标表执行 `column list`，用真实 `fieldId` 写入行数据。即使字段名相同，也不能跨表复用 `fieldId`。
- ✅ 行数据 JSON 的 key 只能使用当前目标表真实 `fieldId`；禁止使用中文字段名、占位 `fld_xxx`、`fld_1` 或其它表字段 ID 当成可执行数据。
- ✅ 行数据写入后必须立即执行 `row page` 验证：每张应有样例数据的表都要有行，且业务 `data` 不能是 `{}`；发现空表、空行、数值字段写成文本或 select 值不匹配时，先修数据再进入下一步。
- ✅ `row batch-create` 返回成功只代表行创建请求完成，不代表业务字段一定写入成功；验收以 `row page` 读出的 `data` 为准。
- ✅ 初始化、迁移、补录、示例数据写入统一使用 `row batch-create --file <JSON文件路径>`。不要用 `row create --data` 或 `row create --values` 直接传 JSON 字符串写样例数据；命令行 JSON 字符串存在解析/转义风险，可能导致数据没有正确写入。
- ✅ 示例数据必须按表清单逐表写入和验收；每张需要样例数据的表都要有对应 JSON 文件、导入命令和 `row page` 结果，不能遗漏任何表。
- ✅ Windows 下保存含中文的导入文件、字段配置、JSON 或命令说明时，必须使用 UTF-8 并读回确认

## 高风险跑偏点

下面这些是 AI 在表格建模阶段最容易做错、但会直接影响后续报表成功率的地方：

1. 只设计字段名，不设计字段类型
2. 把本该用于统计的字段建成文本字段
3. 把人员字段误建成普通 `select`，或把部门字段误建成 `select` / `department`
4. 认为 `select` 只要有字段名就行，忘记补候选项
5. 明明是稳定枚举，却建成 `text`，导致后续筛选、分组、报表维度不可控
6. 给了候选项，但没给唯一 `id` 或合法 `color`，导致前端标签风格、更新和统计不稳定
7. 把前端支持的 `custom:` 自定义颜色写丢，导致技能输出只能覆盖一半能力
8. 建表时没考虑哪些字段后面要做报表维度、数值轴、筛选项
9. 只关心表能录数据，不关心字段是否可用于 `preview` 和报表映射
10. 复用其它表的字段 ID 导入当前表，导致行存在但业务 `data` 为空
11. 批量导入后不立即回查，等报表阶段才发现数据字段类型或值结构错误
12. 把金额、数量、人数等统计指标建成 `text`，导致报表 `sum/avg/min/max` 无法稳定聚合
13. 技能输出仍把 `--title` 当字段创建规范写法，而不是统一使用 `--label`

对应提醒：

- 报表维度字段通常需要稳定标签和可读值
- 报表数值字段必须是数字或可稳定转数字
- 如果字段后续要进入报表，尽量在建表阶段就明确“谁做维度、谁做指标”
- 不要等到 `dimens-manager/references/report/overview.md` 阶段才发现字段类型不适合出图

## 字段与导入强制校验表

| 检查项 | 强制规则 | 不通过时 |
| --- | --- | --- |
| 字段创建参数 | 技能生成命令统一用 `column create --label`；`--title` 只保留为兼容说明 | 改写命令，不把兼容参数作为推荐主写法 |
| 真实字段 ID | 每张表字段创建后都要 `column list`，记录“表名 + 字段名 + type + fieldId” | 重新取当前表字段映射；不同表同名字段不能复用 |
| 行数据 JSON key | 只能使用当前表真实 `fieldId` | 用 `column list` 结果重建 JSON 后再导入 |
| 示例数据导入 | 初始化、迁移、示例数据统一 `row batch-create --file` | 不用 `row create --data/--values` 写多行或初始化数据 |
| 写后回查 | 每张需要数据的表都立刻 `row page --size 5` | `rows=0`、`data:{}` 或字段值结构错时先修数据，不能进入报表 |
| 选项字段 | `select/multiSelect` 必须有唯一 `id`、非空 `label`、合法 `color` | 先补/修 options，再导入行数据 |
| 人员字段 | 负责人、审批人、成员等优先 `person` | 不退化成普通静态下拉 |
| 部门字段 | 所属部门、负责部门、归属组织当前用 `text` 保存部门名称 | 不生成 `department`，也不误建普通 `select` |
| 数值指标 | 金额、数量、人数、库存、时长、评分、完成率等用 `number` | 先修字段类型和数据，再做报表 |

## 命令维护表

| 命令 | 作用 | 必填参数 | 常用可选 | 细节说明 |
| --- | --- | --- | --- | --- |
| `dimens-cli sheet list` | 查询项目下工作表列表 | `projectId` | `teamId` | 表入口通常先从项目进入，排查问题时建议显式补 `teamId` |
| `dimens-cli sheet info` | 获取工作表详情 | `teamId`, `projectId`, `sheetId` | - | 表更新前默认先读当前表数据，确认结构和归属 |
| `dimens-cli sheet create` | 创建表或目录节点 | `projectId`, `name` | `teamId`, `folder-id`, `type` | 新表落地后还要继续检查默认公开视图是否存在；要放入目录时可以显式传 `--folder-id`，但创建后仍以 `sheet tree` 为准，不归位就 `sheet move` |
| `dimens-cli sheet update` | 更新表基础信息，兼容移动菜单归属 | `projectId`, `sheetId` | `teamId`, `name`, `folder-id`, `app-url` | 默认先 `sheet info` 拿当前数据，再改字段后更新；`--folder-id` 会映射为后端 `parentId` |
| `dimens-cli sheet move` | 把已有表格、报表、文档或画布移动到项目菜单目录 | `teamId`, `projectId`, `sheetId`, `folder-id` | `app-url` | 移动已有资源优先用这个命令；执行后必须 `sheet tree` 回查目录归位 |
| `dimens-cli column list` | 查询字段列表 | `teamId`, `projectId`, `sheetId` | - | 用于先确认字段结构、字段类型和现有字段 ID |
| `dimens-cli column create` | 创建字段 | `teamId`, `projectId`, `sheetId`, `type`, `label` 或兼容参数 `title` | `property`, `uiType`, `config`, `required`, `unique`, `key`, `options`, `flow-id`, `system-view` | `select/multiSelect` 必须补完整 `options`；`workflow` 字段可用 `--flow-id --system-view approval` 绑定审批入口 |
| `dimens-cli column update` | 更新字段定义 | `teamId`, `projectId`, `sheetId`, `fieldId` | `label`, `title`, `type`, `config`, `required`, `unique`, `app-url`, `flow-id`, `system-view` | 默认先拿当前表结构，从 `structure.columns` 找到目标字段后再合并更新；`--config` 与 `--flow-id/--system-view` 会合并字段配置 |
| `dimens-cli view list` | 查询视图列表 | `teamId`, `projectId`, `sheetId` | - | 建表后先确认默认公开视图是否已经落地 |
| `dimens-cli view create` | 创建公开默认视图或业务视图 | `teamId`, `projectId`, `sheetId`, `name`, `type` | `isPublic`, `config` | 技能建表链路默认要求至少补一个公开 grid 视图 |
| `dimens-cli row page` | 分页查询行数据，也是后续数据分析的核心取数入口 | `teamId`, `projectId`, `sheetId` | `viewId`, `page`, `size`, `keyword`, `search-field-ids`, `filters`, `filter-match-type`, `sort-rule` | 使用前必须先 `column list` 获取真实字段 ID，再按字段设计搜索、筛选、排序；行读取链路会同时受字段筛选、视图配置和权限影响 |
| `dimens-cli row create` | 新增单行数据 | `sheetId`, `values` | - | 仅用于少量交互式单行补录；不用于初始化、迁移、示例数据或 JSON 字符串批量写入 |
| `dimens-cli row batch-create` | 批量新增行数据 | `sheetId`, `file` | `batch-size` | 初始化、迁移、补数据、示例数据写入的标准命令；数据先写 JSON 文件，再用 `--file` 导入；CLI 默认按 200 行稳定分片 |
| `dimens-cli row update` | 更新整行数据 | `teamId`, `projectId`, `sheetId`, `rowId` | `data`, `version`, `app-url` | 默认先读当前行数据，再修改目标字段，再 update；不要只凭局部字段直接覆盖 |
| `dimens-cli row set-cell` | 更新单个单元格 | `sheetId`, `rowId`, `fieldId`, `value` 或 `value-json` | `version`, `columnId` | 服务端真实契约以 `fieldId` 为准；对象值用 `--value-json`，但 `workflow` 审批摘要通常应由后端托管回写 |

### 强调细节

- 表、字段、行的更新类命令默认都按“拿数据 -> 改数据 -> 更新数据”执行，不能把局部 patch 当成稳定更新方式。
- `sheet update` / `sheet move` 前默认先 `sheet info`；移动目录时 CLI 的 `--folder-id` 会提交为后端真实字段 `parentId`；`column update` 前默认先取当前 `structure.columns`；`row update` 前默认先读取当前行数据。
- 涉及搜索、筛选、排序、统计分析、报表预检时，不能直接盲猜字段名调用 `row page`；必须先 `column list` 拿到字段 ID、字段类型、选项值，再组装 `search-field-ids`、`filters`、`sort-rule`。
- 初始化、迁移、补数据、示例数据写入统一用 `row batch-create --file`，不要让技能循环调用 `row create` 逐条写入，也不要用 `row create --data/--values` 直接传 JSON 字符串；CLI 默认按 200 行稳定分片，后端只保证每个分片事务原子。
- 批量写入数据前先生成“目标表字段映射表”：`sheetId + 字段名 + type + fieldId`。每张表单独生成，不能用另一张表的映射文件替代。
- 批量写入后立刻 `row page --size 5` 抽查，验收标准是有行、业务 `data` 非空、每个样例字段的值类型符合字段类型。`data:{}` 或只有系统字段时，必须重新获取该表 `fieldId` 并重建导入文件。
- 多表初始化时先生成“表清单验收表”：`表名 + 是否单向绑定 + 依赖目标 + 创建批次 + JSON文件 + 预计行数 + row page结果`。只有清单中所有需要样例数据的表都验收通过，才能进入报表或画布。
- 如果字段后续要进入报表，建模阶段就要把字段类型、选项、数值字段和维度字段设计清楚，不要拖到报表阶段返工。
- 新建表后默认检查公开默认视图，不要只建表不补视图。
- 行写入和字段更新除了结构正确，还要同步考虑权限、协同链路和版本字段。

## 输出与验证契约

- 建表类输出必须包含：表 ID、字段清单、字段类型、选项配置、默认视图和示例数据策略。
- 字段更新输出必须包含：`column list` 读取结果、目标字段 ID、合并后的配置和更新后回查。
- 行写入输出必须包含：真实 `fieldId` 映射、写入方式、批量分片策略和 `row page/info` 回查结果。
- 项目初始化或批量补数据输出必须逐表说明：字段映射来自哪次 `column list`、导入了几行、`row page` 抽查是否存在业务 `data`。
- 多表项目输出必须说明建表依赖批次：哪些表可有限并发创建，哪些表是被引用基础表，哪些表有单向绑定必须最后创建。
- 报表联动场景必须说明哪些字段用于维度、指标、筛选和排序，并给出后续 `report preview` 风险点。

## 核心约束

### 1. 资源层级

- 表属于项目
- 字段、视图、行属于表
- 任何字段或行问题都应该先落到具体 `sheetId`

### 1.1 默认公开视图约束

- 技能侧建表完成后，默认要检查是否已经存在公开视图
- 如果没有，就补一个 `name=默认视图`、`type=grid`、`isPublic=true` 的公开默认视图
- 推荐 `config` 至少包含：`filters=[]`、`filterMatchType='and'`、`sortRule=null`、`groupBy=[]`、`hiddenColumnIds=[]`、`rowHeight='medium'`
- 没有默认公开视图时，前端常见表现是“表能打开但筛选能力不完整”或“没有可继承的视图配置”

### 2. 系统视图字段边界

- `flow_info.usageType` 表示团队级默认能力类型
- `mul_project_workflow_binding.systemView` 表示项目级实际系统视图分配
- 当前规则是“项目绑定优先，全局默认回退”

### 3. 字段与值结构边界

- 字段类型不同，值结构和允许写入方式不同
- 字段能力不能只看名字，必须结合类型、`uiType`、`property`
- 字段设计默认至少要明确：字段名、类型、是否必填、是否唯一、默认值、是否参与筛选、是否参与排序、是否用于主展示
- 如果字段类型是 `select` 或 `multiSelect`，还必须同步明确候选项列表；没有选项值就不是完整字段设计
- 如果字段类型是 `select` 或 `multiSelect`，每个候选项默认至少明确：`id`、`label`、`color`
- 如果字段语义是稳定有限集合，优先设计为 `select`；如果一个单元格允许多个标签或多种分类同时存在，优先设计为 `multiSelect`；只有开放文本、长说明、不可预知输入才使用 `text`
- 创建 `select` / `multiSelect` 时，`options` 默认生成 JSON 对象数组，结构必须是 `{ "id": "稳定唯一值", "label": "展示文案", "color": "合法颜色" }`；同一字段内 `id` 不能重复，`label` 不能为空
- 如果数据来源是 Excel，创建 `select` / `multiSelect` 字段前必须先扫描该列实际值，把去重后的合法值转成候选项；后续 `row batch-create` 写入时只能写已有候选项对应的 `label` 或 `id`，发现新值要先补字段选项再导入
- 下拉候选项颜色必须区分两类：
  1. 内置默认颜色：使用前端内置的 Tailwind 类名组合
  2. 自定义颜色：使用 `custom:{\"bg\":\"#xxxxxx\",\"text\":\"#xxxxxx\"}` 字符串
- 当前前端真实颜色来源在多维表格字段配置与字典管理页，技能输出时不要自造颜色协议
- 如果字段语义是“选人”，且项目本身已有用户体系、部门体系、内置角色，则这不是普通 `select`，应优先落到 `person`
- 如果字段语义是“选部门 / 归属部门 / 所属组织”，当前执行层必须落到 `text`，保存部门名称；不要生成 `department` 类型，避免 Web 前端白屏
- 关联字段默认要明确：目标表、展示字段、是否多选、是否双向、编辑视图字段
- 涉及工作流、AI 分析、审批、自动化入口时，还要同时检查系统视图字段映射
- `workflow` 字段不是普通业务字段，它负责从行数据发起审批和展示摘要；真实审批状态以审批实例表为准，字段绑定、`sourceSnapshot` 和摘要回写规则看 `dimens-manager/references/workflow/references/field-binding.md`

### 3.1 报表联动边界

如果用户后续还要做报表，这里要提前提醒：

- 哪些字段会作为图表维度字段
- 哪些字段会作为数值字段
- 哪些字段会进入筛选和排序
- 哪些字段只是详情说明，不适合直接出图

默认建议：

| 报表用途 | 推荐字段类型 | 说明 |
| --- | --- | --- |
| 类目维度 | `text` / `select` / `date` / `person` | 用于横轴、分类、分组；部门维度当前用 `text` 保存部门名称 |
| 数值指标 | `number` | 用于求和、排序、统计 |
| 详情说明 | `text` | 不要默认当 `valueKey` |
| 组织筛选 | `text` | 当前用部门名称文本筛选；不要生成 `department` 类型 |
| 人员筛选 | `person` | 不要退化成普通 `select` |

### 4. 权限边界

- 表级可见不代表列级可写
- 列级可写不代表行级可写
- 表格在协同链路里还会受到 Yjs 写入净化与广播过滤影响

### 5. 上下文边界

- CLI 场景通常同时依赖 `teamId`、`projectId`、`sheetId`
- 如果只给出其中一个，很多结论都不稳定

## 必查文档

| Skill / references | 作用 | 什么时候必须看 |
| --- | --- | --- |
| `dimens-manager/references/key-auth/overview.md` | 认证、token 复用与第三方接入边界 | 执行任何表格命令前必须先确认 |
| `dimens-manager/references/team/overview.md` | 团队与项目上下文来源 | 进入表域前必须先看 |
| `dimens-manager/references/project/overview.md` | 项目创建、默认公开视图补偿、建表前置链路 | 用户还没完成项目初始化时必须先看 |
| `dimens-manager/references/permission/overview.md` | 表级、列级、行级与协同权限边界 | 处理写入权限时建议看 |
| `dimens-manager/references/workflow/overview.md` | 系统视图字段与工作流入口的映射关系 | 处理 AI 分析、审批、自动化入口时建议看 |
| `dimens-manager/references/workflow/references/field-binding.md` | `workflow` 字段绑定、行数据发起、`sourceSnapshot`、摘要回写 | 处理审批字段、行数据绑定工作流、字段状态不刷新时必须看 |
| `dimens-manager/references/report/overview.md` | 报表组件、字段映射、固定预检链 | 字段后续要进入看板、图表、统计分析时必须看 |
| `references/field-design-patterns.md` | 字段设计模板、relation 结构 | 设计字段时必须看 |
| `references/field-option-colors.md` | 单选/多选/下拉选择器颜色体系、默认颜色、自定义颜色协议 | 处理选项字段时必须看 |
| `references/row-filters.md` | `row/page` 搜索、筛选、排序与 `viewId` 继承 | 设计查询案例时必须看 |
| `references/field-rules.md` | 字段规则和系统视图字段边界 | 处理系统字段时必须看 |
| `references/build-flow.md` | 表域能力落地流程 | 从零搭表时建议看 |
| `references/examples.md` | 表 / 字段 / 行接口案例 | 需要直接举例时看 |

## 使用场景示例

### 场景 0：用户要“做一个客户管理系统”

默认优先输出：

1. 项目名称
2. 核心表：客户、联系人、跟进记录、商机
3. 每张表的字段设计
4. 表之间的 relation 关系
5. 示例行数据
6. `row/page` 查询案例

补充：

- 如果项目还没创建或默认公开视图还没补齐，这一步应先回到 `dimens-manager/references/project/overview.md`
- 如果后续还要做报表，字段设计阶段就要明确哪些字段要做维度、哪些字段要做数值

只有用户继续要求时，再扩展权限、工作流、报表。

如果用户已经明确后面要做报表，不要把“报表”理解成后置可忽略项，至少在建表阶段补一句：

1. 哪些字段会做图表维度
2. 哪些字段会做统计指标
3. 哪些字段要支持后续 `report preview` 和 `dataMapping`

### 场景 0.5：多表创建顺序和有限并发

当一次创建多张表时，先按依赖关系分批，不要把所有表同时创建：

| 批次 | 表类型 | 是否可并发 | 处理规则 |
| --- | --- | --- | --- |
| A | 无依赖表 | 可有限并发 | 不依赖其它表，也不被当前要配置的单向绑定字段阻塞；创建后逐表 `sheet tree / column list / view list` |
| B | 被引用基础表 | 可有限并发，但必须早于依赖表 | 先创建字段和样例数据，拿到真实 `sheetId/fieldId/rowId` |
| C | 普通主业务表 | 按依赖顺序 | 如果只依赖基础表，等基础表验收后创建 |
| D | 单向绑定表 / relation 依赖表 | 最后创建 | 必须等目标表、目标展示字段、必要目标行都存在后再创建和写入数据 |

执行要求：

- “有限并发”只适用于同一批次内的无依赖表；并发后仍要逐表回查，不要合并验收。
- 有单向绑定的表最后创建；如果不确定是否单向绑定，先按有依赖处理。
- 写案例数据前生成完整表清单，逐表标注 JSON 文件和验收命令；清单没全部通过，不进入报表阶段。

### 场景 1：查询某项目下的表列表

```bash
dimens-cli sheet list --project-id PROJ1
```

建议：

- 排查问题时尽量显式补 `--team-id`
- 避免被本地默认上下文误导

### 场景 1.1：为新表补公开默认视图

```bash
dimens-cli view create \
  --team-id TTFFEN \
  --project-id PUQUNFE \
  --sheet-id sh_customer \
  --name 默认视图 \
  --type grid \
  --is-public true \
  --config '{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}'
```

注意：

- 这是技能建表链路里的默认补偿步骤，不要跳过
- 如果后端已经自动生成了默认视图，应先用 `view list` 检查，避免重复创建
- 当前 CLI 只承诺 `view list/create` 基础能力，不要把 `update/delete/config/filters` 当成已稳定封装

### 场景 2：更新单元格

```bash
dimens-cli row set-cell \
  --sheet-id SHEET1 \
  --row-id ROW1 \
  --field-id fld_status \
  --value 已完成
```

注意：

- 写入前要先确认字段类型和值结构
- `fieldId` 需要先通过 `dimens-cli column list` 获取，不能直接拿中文字段名当写入键
- 如果是系统字段、只读字段或命中行级策略，后端仍可能拒绝

### 场景 2.x：不要用 `row create --data/--values` 写初始化数据

已知风险：`row create` 的 `--data` / `--values` 参数在直接传 JSON 字符串时，容易受到 shell 转义、引号、换行和字段值结构影响，出现命令返回但业务字段没有正确写入的情况。

规则：

- 初始化、迁移、补录多行、创建示例数据：一律写 JSON 文件，再执行 `row batch-create --file <文件路径>`。
- `row create` 只保留给少量手动单行补录，并且执行后仍要立刻 `row page` 验证。
- 发现 `row create --data/--values` 后行存在但 `data` 为空时，不要继续重试命令行 JSON 字符串；改用 JSON 文件 + `row batch-create --file`。

### 场景 2.0：批量初始化行数据

推荐把示例数据、迁移数据或补录数据写入 JSON 文件，再批量导入。注意：下面的 `fld_customerName / fld_customerLevel` 只是示例占位，真实执行前必须替换成当前目标表 `column list` 返回的真实 `fieldId`。

第一步，先取目标表字段：

```bash
dimens-cli column list \
  --team-id TTFFEN \
  --project-id PUQUNFE \
  --sheet-id SHEET1
```

把结果整理成只属于当前表的映射：

| 字段名 | 字段类型 | 真实 fieldId | 写入值要求 |
| --- | --- | --- | --- |
| 客户名称 | text | fld_xxx | 字符串 |
| 客户等级 | select | fld_yyy | 已存在 option 的 label 或 id |

第二步，只用当前表真实 `fieldId` 写 JSON：

```json
[
  { "fld_customerName": "华东智造", "fld_customerLevel": "A" },
  { "fld_customerName": "华南制造", "fld_customerLevel": "B" }
]
```

```bash
dimens-cli row batch-create \
  --sheet-id SHEET1 \
  --file ./data/customers.json
```

第三步，写后立刻验：

```bash
dimens-cli row page \
  --team-id TTFFEN \
  --project-id PUQUNFE \
  --sheet-id SHEET1 \
  --page 1 \
  --size 5
```

通过标准：

- `rows.length > 0`。
- 每行 `data` 里能看到刚写入的业务字段，不是 `{}`。
- `number` 字段读出为数字或后端认可的数值结构。
- `select / multiSelect` 字段值能对应字段 `options`。
- relation 字段不是展示文本，而是接口要求的目标行 ID 或对象结构。

如果数据量超过 200 行，CLI 默认按 200 行稳定切分请求：

```bash
dimens-cli row batch-create \
  --sheet-id SHEET1 \
  --file ./data/customers.json \
  --batch-size 200
```

注意：

- 后端单次 `batch-create` 最高限制 1000 行。
- 真实导入不要使用 1000 行分片，已确认 1000 行存在静默丢数据风险；技能生成命令默认使用 200 行。
- CLI 多批导入时，每批在后端事务内原子提交；整个文件不是一个全局事务。
- 仍然必须使用真实 `fieldId` 写入，不要用中文字段名。
- 同名字段在不同表也有不同 `fieldId`，不要复用其它表的字段映射。
- 如果 `row page` 显示行存在但 `data` 为空，根因通常是 fieldId 错误；回到 `column list` 重建 JSON，不要继续做报表。
- `select` / `multiSelect` 字段写入前必须先回查字段 `options`，把 Excel 单元格值映射到已有候选项；字段没有下拉时先补 `--options`，不能先导入行数据。
- 写入会继续受表级、列级、行级权限影响，只读字段会被后端过滤或拒绝。

### 场景 2.1：设计带颜色的单选/多选字段

推荐候选项结构：

```json
[
  { "id": "opt_pending", "label": "待提交", "color": "bg-slate-100 text-slate-700" },
  { "id": "opt_submitting", "label": "提交中", "color": "bg-blue-100 text-blue-700" },
  { "id": "opt_submitted", "label": "已提交", "color": "bg-emerald-100 text-emerald-700" },
  { "id": "opt_rejected", "label": "已驳回", "color": "bg-rose-100 text-rose-700" }
]
```

补充要求：

- 默认颜色优先使用前端内置颜色池，不要先上自定义色
- 如果业务已有明确品牌色或风险色，再使用 `custom:{...}` 形式
- 同一个字段下，`id` 必须稳定唯一；不要只靠中文 `label` 充当主键
- 技能输出若出现“多选题 / 判断题 / 状态 / 标签 / 等级”这类选项字段，必须带颜色，不要只返回纯文本数组

### 场景 3：解释为什么工作流在 AI 分析入口显示不对

标准排查顺序：

1. 看团队级 `usageType`
2. 看项目级 `systemView`
3. 明确当前规则是项目绑定优先、全局默认回退
4. 再看页面入口到底读的是哪个树接口或绑定接口

## 常见错误与排查

| 错误现象 | 根本原因 | 解决方案 |
| --- | --- | --- |
| 表搭出来了，但字段不好用 | 字段只按名字设计，没有提前考虑筛选、排序、主展示和关联 | 回到字段模板，补齐字段能力设计 |
| 人员下拉被建成普通下拉字段 | 没识别项目已有用户体系、内置角色、部门体系，误把“选人”当成静态枚举 | 优先改用 `person` 字段，先判断是不是用户选择场景 |
| 部门字段被建成普通下拉或 `department` 字段 | 当前 Web 前端对 `department` 字段类型支持不完整，且静态下拉会丢失部门语义 | 改用 `text` 保存部门名称，例如 `--label 所属部门 --type text`，后续前端专用字段稳定后再迁移 |
| 后面做报表时发现字段出不了图 | 建表阶段没区分维度字段、指标字段和说明字段 | 回到字段设计模板，先把用于报表的字段类型设计正确 |
| 行能查出来，但筛选条件不好表达 | 没按 `keyword / searchFieldIds / filters / filterMatchType / sortRule` 结构设计 | 按 `row/page` 真实请求结构重写查询案例 |
| 表能查到，但字段写入失败 | 字段类型不匹配、列级只读或系统字段受控 | 先查字段结构，再查列权限与系统字段规则 |
| `row create --data/--values` 后数据没有写入 | 命令行 JSON 字符串解析、转义或值结构不稳定 | 把数据写成 JSON 文件，使用 `row batch-create --file`，再 `row page` 验证 |
| `row batch-create` 成功但表格业务字段为空 | 使用了占位 `fieldId`、中文字段名或其它表的字段 ID | 对目标表重新 `column list`，用真实 `fieldId` 重建导入 JSON，再导入并 `row page` 验证 |
| 某些表有数据，另一些同结构表为空 | 复用了上一张表的字段映射 | 每张表单独维护“字段名 -> fieldId”，同名字段也按目标表重新映射 |
| 报表预览时数值为空或无法聚合 | 数值业务字段被建成文本或写入了字符串标签 | 把金额、数量、人数、时长等指标字段设计成 `number`，修正后重写数据 |
| 行分页读取正常，协同更新异常 | 普通接口权限和 Yjs 协同过滤不是同一条缓存链 | 检查协同权限快照、系统字段净化和广播过滤 |
| AI 分析入口工作流分类不对 | 把团队级默认字段当成项目级实际分配字段 | 区分 `usageType` 与 `systemView` |
| 同一字段在不同项目表现不同 | 项目级绑定、权限或系统视图规则不同 | 结合 `projectId` 重新判断，不要跨项目直接套用 |
| 单元格改不了但页面没明显报错 | 后端行级或列级鉴权拒绝 | 检查表级、列级、行级三层权限链路 |

## 参考文档

- `references/build-flow.md`
- `references/field-design-patterns.md`
- `references/row-filters.md`
- `references/field-rules.md`
- `references/examples.md`
