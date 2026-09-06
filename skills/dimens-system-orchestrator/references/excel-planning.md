# Excel 规划与落地前校验

## 适用场景

当新项目包含多张表、较多字段、字典枚举或复杂关联时，可以建议用户先用 Excel 梳理结构。Excel 是设计输入和评审载体，不是维表后端的直接写入接口。

参考模板：`产品设计/运维管理系统/CMDB资产管理系统_表结构设计.xlsx`。当前模板示例包含 16 张业务表、536 个字段、69 组字典和 33 条关系，采用以下五类工作表；这些数量只用于规划校验，不能未经复核直接照搬：

| 工作表 | 用途 | 必要内容 |
| --- | --- | --- |
| `设计说明` | 项目范围和规模 | 项目名称、表数量、字段规模、字典规模、关系规模、设计约束 |
| `表清单` | 表级目录 | 表名、稳定表编码、用途、主展示字段、主要关联表 |
| `字段明细` | 字段级契约 | 表编码、字段编码、字段类型、必填/唯一、字典编码、关联对象、校验和展示规则 |
| `数据字典` | 枚举候选项 | 字典编码、字典名称、选项 `value`、选项名称、排序、引用位置 |
| `表关系` | 关系映射 | 子表字段、父表、父展示字段、基数、空值策略、关联说明 |

## 规划期处理顺序

1. 只读检查工作簿，确认工作表名称、表头和数据范围；不要修改用户原始 Excel。
2. 将 Excel 内容归一化到 `new-project-design-template.md`：系统定位、菜单树、资源清单、角色、表字段、关系、字典、示例数据、报表和验收标准。
3. 先做一致性校验，再生成可审阅的 JSON 契约。JSON 应拆分为表、字段、字典、关系和示例数据，不能在脚本中边读 Excel 边循环写接口。
4. 用户确认设计后，才执行 `dimens-cli`。每个资源创建或更新后都要用对应 CLI 查询回查。

## 以维表能力为准裁剪字段

Excel 常按传统数据库方式记录字段，但生成项目时不能逐列照搬。先判断字段是否承载真实业务，再决定是否进入维表：

| Excel 字段 | 默认处理 | 只有在以下情况才保留 |
| --- | --- | --- |
| `id`、雪花 ID、内部唯一 ID | 不生成业务字段 | 用户明确要求展示、对外集成或需要保留外部主键映射 |
| 创建人、创建时间、更新人、更新时间、版本号 | 直接使用维表自带系统字段/版本能力，不进入业务字段清单，也不执行 `column create` | 当前平台能力无法满足且用户明确需要业务查询时 |
| `deleted_at`、`deleted_by`、`is_deleted`、软删除标记 | 不默认生成 | 用户明确要求回收站、历史恢复或按删除状态运营 |
| `tenant_id`、`team_id`、`project_id` | 不生成到业务表 | 字段本身是业务对象属性，而不是项目隔离上下文 |
| 数据库索引、审计辅助列、冗余外键 | 不生成 | 能说明具体业务用途并通过维表字段/关系落地 |
| 资产编码、工单号、合同号等业务编码 | 作为普通业务字段设计，并按需唯一 | 仅当用户确实用它查询、展示或与外部系统对账 |

`sheet customId` 和 `column customId` 是本技能生成 JSON 契约和 CLI 命令时的强制后缀；每张新工作表、每个新业务字段都必须提供稳定且可读的后缀，不受项目高级设置开关影响。它们是资源元数据，不等于要额外生成一列“唯一 ID”。后端未传后缀时虽会兼容生成随机 ID，但技能不得省略后缀或主动依赖该回退。`unique` 也不是默认属性，只有业务规则明确要求唯一时才设置。无法映射的技术字段必须列入“忽略/待确认清单”，不能静默照搬或凭空补充。

## 必做校验

### 表与字段

- 表编码在项目内唯一；字段编码在所属表内唯一。
- 每张表都要有稳定的业务主展示字段，并显式准备 `customId`；不要把 Excel 的业务编码直接当成后端 `sheetId/fieldId`。
- Excel 字段类型必须映射到当前 CLI 支持的类型。人员、部门、关联、富文本和 JSON 字段不能降级为普通文本或下拉。
- 必填、唯一、默认值、长度/精度和校验规则要能落到字段配置；无法映射的内容标为待确认，不要静默丢弃。

### 两种字典模式与复用判断

维表里的“字典”分两种，Excel 的“数据字典”工作表不能直接等同于项目自定义数据字典：

1. **字段内置选项字典**：字段自己的 `select` / `multiSelect` 选项，直接在 `column create --options` 时生成。只被一个字段、一个页面或一个流程使用的稳定枚举，一律优先采用此模式。
2. **项目自定义数据字典**：通过 `project-dict create` 管理可复用选项，再让业务 `select` / `multiSelect` 字段绑定同一个 `dictionaryId`。只有同一组选项明确被多个表、字段或流程引入时才采用此模式。

- “要求唯一”不是创建项目自定义数据字典的理由；单字段仍使用字段内置选项即可。
- 先按业务使用位置统计复用范围，再决定模式；不要因为 Excel 有“数据字典”页就全部创建项目字典。
- 项目字典 `code` 和选项 `value` 必填，只允许小写英文、数字、下划线或连字符；禁止随机 UUID。建议编码要与项目现有字典和整棵选项树比较后再确认。
- 字段内置选项的 `id` 与项目字典选项的 `value` 优先使用选项名称对应的英文语义编码，例如 `active`、`maintenance`、`offline`；不要使用 `1`、`2`、`3` 这类纯数字编码，除非业务名称本身就是数字。
- 选项行至少保留唯一 `id`、非空 `label`、稳定 `value` 和合法颜色；历史 UUID 可以兼容读取，但新写入使用 `value`。
- 如果当前 CLI 版本没有直接的字典绑定参数，先用 CLI 创建字典和字段，再用 CLI 支持的字段配置更新方式写入 `dictionaryId`；不得退回 Python/HTTP 直写。

### 关系

- 每条关系都要明确来源表/字段、目标表/展示字段、基数、是否允许空值、是否多选和回填顺序。
- “多对一”通常映射 `relationMode=single`，行值为单个目标 `rowId/null`；“多对多”或自关联多选才使用 `relationMode=multiple`，行值为 `rowId[]/[]`。
- 先创建目标表和主展示字段，再创建 relation 字段，导入目标行后用真实 `rowId` 回填来源行；不能把旧主键、编码文本或逗号拼接值直接写入 relation。
- Excel 中存在多态关系（一个字段指向多种表）时，必须拆成多个明确 relation 字段，或记录待确认的建模方案；不能直接照搬成一个未定义目标的字段。
- 检查关系两端是否存在、展示字段是否存在、基数与字段类型是否一致，并列出孤儿关系和清洗策略。

## JSON 到 CLI 的落地契约

规划输出至少应包含以下结构：

```json
{
  "project": { "name": "CMDB资产管理系统" },
  "sheets": [
    {
      "name": "机房管理",
      "customId": "idc_room",
      "columns": [
        { "label": "机房编码", "type": "text", "customId": "room_code", "required": true },
        {
          "label": "机房类型",
          "type": "select",
          "customId": "idc_type",
          "options": [],
          "dictionaryMode": "field-options"
        }
      ]
    }
  ],
  "dictionaries": [],
  "relations": [],
  "sampleRows": []
}
```

JSON 中建议用 `dictionaryMode` 标记决策：`field-options` 表示字段内置选项，`project-dictionary` 表示项目自定义数据字典；后者还要列出所有业务字段绑定位置，例如：

```json
{
  "name": "资产状态",
  "code": "asset_status",
  "options": [{ "id": "active", "label": "在用", "value": "active" }],
  "bindings": [
    { "sheetCustomId": "server", "columnCustomId": "asset_status" },
    { "sheetCustomId": "storage_device", "columnCustomId": "asset_status" }
  ],
  "dictionaryMode": "project-dictionary"
}
```

没有多个绑定位置时，不要创建这段 `dictionaries` 资源，直接把选项放回对应字段的 `config.options`。

该 JSON 只作为审阅、校验和执行输入，实际顺序必须是：

```text
认证/上下文
  -> dimens-cli sheet create --custom-id
  -> dimens-cli column create --custom-id
  -> dimens-cli project-dict create（仅跨位置复用的枚举，并绑定业务 select/multiSelect）
  -> dimens-cli view create
  -> dimens-cli row batch-create --file
  -> dimens-cli sheet/column/row/project-dict 查询回查
```

禁止阅读 `dimens-cli` 源码后生成 Python、Node.js 或 HTTP 写入脚本。Python 仅在用户明确授权的外部文件清洗或格式转换阶段使用；清洗结果必须落成 JSON，最终仍由 `dimens-cli` 提交。

## 输出要求

使用 Excel 作为规划输入时，系统编排输出必须说明：

- 已识别的工作表及其职责，以及表、字段、字典、关系数量。
- 校验通过项、冲突项、缺失项和待确认项。
- 被裁剪掉的技术字段（唯一 ID、软删除、租户/项目上下文等）及其理由。
- 字段内置选项字典与项目自定义数据字典的选择依据、复用位置和绑定关系。
- 关系映射表、`relationMode`、目标展示字段和 rowId 回填顺序。
- JSON 契约文件或结构，以及对应的 `dimens-cli` 创建、批量导入和回查命令。
- Excel 只参与设计，不作为绕过 CLI 的写入通道。
