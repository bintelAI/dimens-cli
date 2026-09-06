# 通用项目快速创建模板

本文档从 `.trae/推进方案/餐饮新品运营维表创建脚本.mjs` 和 `.trae/推进方案/石油终端零售维表补齐脚本.mjs` 抽取稳定经验，用于用户要求“快速创建一个项目 / 根据行业需求一键搭项目 / 补齐项目资源”时复用。

核心结论：

- 这种模板化处理是合理的，但不能把行业脚本原样固化进 Skill。
- 应抽象为 `CONFIG -> 阶段闸门 -> CLI/SDK 执行 -> 结果产物 -> 回查证据`。
- 行业字段、目录名、样例数据、报表标题只能作为模板变量，不能写死成通用项目规则。
- 当前技能默认优先 `dimens-cli` 命令；直接 HTTP 脚本只作为 CLI 未覆盖时的兜底或内部自动化思路。

## 1. 经验吸收表

| 来源经验 | 归类 | 应写入位置 | 是否需代码复核 | 强制规则 | 验证方式 | 测试 prompt |
| --- | --- | --- | --- | --- | --- | --- |
| 两个脚本都使用 `CONFIG` 描述目录、表、字段、样例数据、文档、报表、画布 | `stable_rule` | 本模板 | 否 | 项目快速创建必须先生成结构化 `CONFIG`，再执行 | 检查 `folders/sheets/docs/reports/canvases` 是否互相引用一致 | `manager-003j` |
| 两个脚本都记录 `ids/log/execution-result.json/execution-error.log` | `validation_rule` | 本模板、项目 overview | 否 | 快速创建必须输出执行产物和证据链 | 检查结果 JSON 包含 IDs、目录、字段、行数据、报表、画布 | `manager-003j` |
| 脚本用 `column list` 把中文字段标签映射到真实 `fieldId` 再写行数据 | `stable_rule` | table/project references | 否 | 行数据 JSON 只能用当前表真实 `fieldId` | 逐表 `row page` 检查 `data` 非空 | 已覆盖 |
| 报表组件通过 `dimensionLabels/metricLabels` 找真实字段 | `stable_rule` | report/project references | 否 | 报表维度和指标必须来自当前表 `column list` | `report preview/query-widget/query` | 已覆盖 |
| 脚本用 Markdown 创建文档 | `negative_case` | 本模板、project references | 否 | 技能生成在线文档时改用 TipTap `richtext`，不能沿用 Markdown 原文 | `doc info` 回读标题、摘要卡片、标签、淡色块 | 已覆盖 |
| 脚本画布节点字段不完整，边 handle 为 `null`，节点缺颜色 | `negative_case` | canvas references | 否 | 模板生成画布必须使用完整可渲染字段、语义配色、非空 handle | `canvas validate` | 已覆盖 |
| 餐饮脚本使用 `bg-amber-100 text-amber-700` | `version_specific` / `negative_case` | table colors | 是，已对照颜色文档 | 默认选项颜色必须收敛到前端 12 色池，不用 `amber` | `column create --options` 前检查 color | `manager-003j` |
| 两个脚本直接调用 HTTP API | `version_specific` | 本模板 | 是 | Skill 执行默认优先 CLI；脚本化自动化可封装 CLI 或 SDK，直接 HTTP 只做兜底 | 检查输出命令链和版本风险说明 | `manager-003j` |

## 2. 使用时机

当用户出现下面意图时，优先使用本模板：

- “帮我快速创建一个行业项目”
- “照餐饮 / 零售 / 客户 / 项目管理这种结构快速搭一套”
- “我有一个需求文档，帮我一键创建维表项目”
- “创建项目不稳定，想用模板一次性跑完”
- “项目已经有了，帮我补齐目录、表、数据、报表、画布”

不要在下面场景强行使用：

- 只是创建单张表或单个字段。
- 只是排查已有报表、权限或文档问题。
- 用户只问 SDK / Web 接入。
- 需求还没有归一化成维表设计文档。

## 3. 标准 CONFIG 结构

快速创建模板必须先产出这份配置草案。配置确认后再进入执行，不要直接开始跑命令。

```ts
type QuickProjectConfig = {
  mode: "create-project" | "complete-existing-project";
  teamId: string;
  projectId?: string;
  projectName: string;
  projectDescription: string;
  projectType: "spreadsheet" | "document";
  outputDirName: string;
  folders: string[];
  sheets: QuickSheetConfig[];
  docs: QuickDocConfig[];
  reports: QuickReportConfig[];
  canvases: QuickCanvasConfig[];
  roles?: QuickRoleConfig[];
};

type QuickSheetConfig = {
  name: string;
  folder: string;
  dependencyBatch?: "base" | "main" | "relation";
  fields: QuickFieldConfig[];
  seedRows: Array<Record<string, unknown>>;
};

type QuickFieldConfig = {
  label: string;
  type: "text" | "number" | "date" | "select" | "multiSelect" | "person" | "relation" | "workflow";
  options?: Array<{ id: string; label: string; color: string }>;
  targetSheetName?: string;
  displayFieldLabel?: string;
  required?: boolean;
  unique?: boolean;
};

type QuickDocConfig = {
  title: string;
  folder: string;
  format: "richtext";
  contentPlan: {
    h1: string;
    summary: string;
    tags: string[];
    sections: string[];
    mermaid?: string;
  };
};

type QuickReportConfig = {
  name: string;
  folder: string;
  description: string;
  widgets: Array<{
    title: string;
    type: "bar" | "line" | "pie" | "stat" | "table";
    sheetName: string;
    dimensionLabels: string[];
    metricLabels: string[];
    aggregation: "sum" | "avg" | "min" | "max" | "count";
    limit?: number;
  }>;
};

type QuickCanvasConfig = {
  name: string;
  folder: string;
  changeSummary: string;
  nodes: Array<{
    id: string;
    type: "RECTANGLE" | "PARALLELOGRAM" | "DIAMOND" | "CYLINDER" | "DOCUMENT" | "MARKDOWN" | "INFOGRAPHIC" | "SECTION";
    x: number;
    y: number;
    label: string;
    role: "input" | "action" | "decision" | "data" | "document" | "display" | "group";
  }>;
  edges: Array<{ id: string; source: string; target: string; label?: string }>;
};
```

## 4. 配置生成规则

### 4.1 目录

- `folders` 必须是业务语义目录，不要照抄“基础数据 / 业务流程 / 统计报表 / 系统说明”。
- 每个 `sheet/doc/report/canvas.folder` 必须存在于 `folders`。
- 创建后必须 `sheet tree` 回查，每个保留目录都应有子资源。

### 4.2 表与字段

- 每张表至少包含一个主展示字段、一个状态或分类字段、必要的日期/负责人/金额/数量字段。
- 统计指标字段必须是 `number`，例如金额、数量、利润、库存、时长、评分、支付意愿。
- 负责人、审批人、参与人优先用 `person`，不要退化成普通 `select`。
- 所属部门、门店部门、负责部门当前用 `text` 保存名称，不生成 `department`。
- 稳定枚举字段用 `select/multiSelect`，必须给完整 `options`。
- relation 表必须放在后置批次；先创建被引用基础表并验收样例数据。

### 4.3 选项颜色

默认只使用前端 12 色池或 `custom:` 协议：

```json
[
  { "id": "status_pending", "label": "待处理", "color": "bg-slate-100 text-slate-700" },
  { "id": "status_processing", "label": "进行中", "color": "bg-blue-100 text-blue-700" },
  { "id": "status_done", "label": "已完成", "color": "bg-emerald-100 text-emerald-700" },
  { "id": "status_risk", "label": "高风险", "color": "bg-rose-100 text-rose-700" }
]
```

禁止：

- 只给字符串数组。
- 只给 `label`，不写 `id/color`。
- 使用 `blue`、`green` 这类简写。
- 使用未复核颜色，例如 `bg-amber-100 text-amber-700`。需要暖色时改用 `bg-orange-100 text-orange-700` 或 `bg-yellow-100 text-yellow-700`。

### 4.4 样例数据

- `seedRows` 可以用字段标签写草案，但执行前必须转成真实 `fieldId` JSON。
- 每张需要样例数据的表都必须有数据，不要漏表。
- 每张表导入后必须立刻 `row page`，验收 `rows.length > 0` 且业务 `data` 非空。
- 任一表未通过数据闸门，不进入报表阶段。

### 4.5 文档

脚本里的 Markdown 内容只能作为文案草稿。真正创建在线文档时必须：

- 强制说明编辑器是 TipTap。
- `doc create` 默认 `--format richtext`。
- 内容包含 `h1/h2/h3` 标题、首屏摘要区、淡色背景卡片、状态标签、步骤区、风险/提示区。
- 涉及流程时直接写 Mermaid，不截图。
- 创建后 `doc info` 回读。

### 4.6 报表

报表模板必须使用字段标签计划，但执行时要转成当前表真实字段：

1. 先锁定 `sheetName -> sheetId`。
2. 执行 `column list`。
3. 用 `dimensionLabels` 找维度字段，用 `metricLabels` 找指标字段。
4. `sum/avg/min/max` 的指标字段必须是 `number`。
5. 生成 `dataSource.sheet.columns`、`fieldIds`、`recommendedMapping`、`previewMapping`、`dataMapping`。
6. 先 `row page`，再 `report preview`。
7. `widget-add` 后继续 `query-widget` 和 `query`。

禁止：

- 用 `fld_xxx` 写 `dataMapping.nameKey/valueKey`。
- 随机生成维度或指标字段。
- 在数据源表无数据时创建组件。
- 把 `statistic` 当统计卡片类型；统计卡片使用 `stat`。

### 4.7 画布

脚本里的简化画布节点只能作为草案，真正保存前必须补齐：

- `position`、`positionAbsolute`
- 顶层 `width/height`
- `style.width/height`
- `data.width/height`
- `data.backgroundColor/textColor/borderColor`
- `data.align/verticalAlign`
- 非空 `sourceHandle/targetHandle`
- `markerEnd` 和 `style.stroke/style.strokeWidth`

节点颜色必须按画布视觉规则生成：

- 输入输出：浅蓝背景。
- 动作：白色或浅灰背景。
- 判断：浅橙 / 浅黄背景。
- 数据沉淀：浅灰 / 浅靛背景。
- 成功：浅绿背景。
- 风险：浅红 / 浅橙背景。

禁止黑底黑字、深底深字、浅底白字和随机高饱和背景。

## 5. 执行阶段闸门

快速模板必须继续遵守项目创建阶段闸门：

| 闸门 | 模板动作 | 必须证据 |
| --- | --- | --- |
| G0 设计 | 生成并检查 `QuickProjectConfig` | 目录、表、字段、数据、文档、报表、画布互相引用一致 |
| G1 上下文 | 确认 `teamId/projectId/token` | `auth api-key-login` 或已有 profile 可用 |
| G2 项目容器 | 新建或复用项目 | `project create/list/info`；封面走 `upload -> project update --cover-image -> project info` |
| G3 菜单 | 创建目录并归位资源 | `sheet tree`，必要时 `sheet move --folder-id` |
| G4 建模 | 建表、字段、视图、relation | 逐表 `column list`、`view list` |
| G5 数据 | 写入样例数据 | 逐表 `row batch-create --file`，逐表 `row page` |
| G6 文档 | 创建 TipTap 文档 | `doc create --format richtext`，`doc info` |
| G7 报表 | 创建报表和组件 | `row page -> report preview -> widget-add -> query-widget -> query` |
| G8 画布 | 创建/保存画布 | `canvas validate -> canvas create/save -> canvas info/versions` |
| G9 完成 | 写结果产物 | 输出 ID、目录、字段、行数据、报表、画布、权限证据 |

## 6. 推荐执行产物

模板执行时应生成一个输出目录，例如：

```text
.trae/推进方案/[项目名]维表创建执行产物/
├── config.normalized.json
├── field-map.json
├── rows/
│   ├── [表名].rows.json
│   └── ...
├── reports/
│   ├── [报表名].widgets.json
│   └── ...
├── canvases/
│   ├── [画布名].canvas.json
│   └── ...
├── execution-result.json
└── execution-error.log
```

`execution-result.json` 至少包含：

```json
{
  "generatedAt": "ISO_TIME",
  "ids": {
    "teamId": "TEAM_ID",
    "projectId": "PROJECT_ID",
    "folders": {},
    "sheets": {},
    "docs": {},
    "reports": {},
    "canvases": {},
    "columns": {},
    "rows": {}
  },
  "folderChildren": {},
  "finalRows": {},
  "reports": [],
  "canvases": [],
  "permissions": [],
  "log": []
}
```

## 7. CLI 优先的模板执行链

Skill 输出可按下面顺序生成命令和产物。不要优先让用户跑手写 HTTP 脚本。

```bash
# G1 上下文
dimens-cli auth api-key-login ...
dimens-cli project list --team-id TEAM_ID

# G2 项目容器
dimens-cli project create --team-id TEAM_ID --name PROJECT_NAME --description DESCRIPTION --project-type spreadsheet
dimens-cli project info --team-id TEAM_ID --id PROJECT_ID

# G3 菜单
dimens-cli sheet create --team-id TEAM_ID --project-id PROJECT_ID --name 业务目录 --type folder
dimens-cli sheet tree --team-id TEAM_ID --project-id PROJECT_ID

# G4 建模
dimens-cli sheet create --team-id TEAM_ID --project-id PROJECT_ID --name 业务表 --folder-id FOLDER_ID
dimens-cli column create --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --label 字段名 --type text
dimens-cli column list --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID
dimens-cli view list --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID

# G5 数据
dimens-cli row batch-create --sheet-id SHEET_ID --file ./rows/业务表.rows.json
dimens-cli row page --team-id TEAM_ID --project-id PROJECT_ID --sheet-id SHEET_ID --page 1 --size 5

# G6 文档
dimens-cli doc create --team-id TEAM_ID --project-id PROJECT_ID --title 使用说明 --format richtext --parent-id FOLDER_ID --content '<h1>...</h1>'
dimens-cli doc info --team-id TEAM_ID --project-id PROJECT_ID --document-id DOCUMENT_ID

# G7 报表
dimens-cli report create --project-id PROJECT_ID --name 经营看板
dimens-cli report preview --project-id PROJECT_ID --data-source ./reports/datasource.json --data-mapping ./reports/mapping.json
dimens-cli report widget-add --project-id PROJECT_ID --report-id REPORT_ID --type bar --data-source ./reports/datasource.json --data-mapping ./reports/mapping.json
dimens-cli report query-widget --project-id PROJECT_ID --report-id REPORT_ID --widget-id WIDGET_ID
dimens-cli report query --project-id PROJECT_ID --report-id REPORT_ID

# G8 画布
dimens-cli canvas validate --file ./canvases/业务流程.canvas.json
dimens-cli canvas create --team-id TEAM_ID --project-id PROJECT_ID --name 业务流程画布 --file ./canvases/业务流程.canvas.json
dimens-cli canvas info CANVAS_ID --team-id TEAM_ID --project-id PROJECT_ID
dimens-cli canvas versions CANVAS_ID --team-id TEAM_ID --project-id PROJECT_ID
```

说明：

- 具体 CLI 参数以当前 `dimens-cli --help` 为准；如果 help 与模板冲突，优先当前 help。
- 如果某个能力 CLI 未覆盖，才允许说明直接 HTTP 或 SDK 兜底，并标明版本风险。
- 不要把脚本里的直接接口路径当成技能首选。

## 8. 通用模板骨架

下面是可复用的模板骨架。实际生成时必须替换为用户业务语义，不要保留“通用业务项目”这类占位名。

```json
{
  "mode": "create-project",
  "teamId": "TEAM_ID",
  "projectName": "行业业务项目",
  "projectDescription": "用于承接行业业务对象、运营动作、统计看板和项目说明",
  "projectType": "spreadsheet",
  "outputDirName": "行业业务项目维表创建执行产物",
  "folders": ["业务工作台", "基础档案", "业务处理", "统计看板", "系统说明"],
  "sheets": [
    {
      "name": "基础对象表",
      "folder": "基础档案",
      "dependencyBatch": "base",
      "fields": [
        { "label": "对象编号", "type": "text", "unique": true },
        { "label": "对象名称", "type": "text" },
        {
          "label": "状态",
          "type": "select",
          "options": [
            { "id": "status_enabled", "label": "启用", "color": "bg-emerald-100 text-emerald-700" },
            { "id": "status_disabled", "label": "停用", "color": "bg-gray-100 text-gray-700" }
          ]
        }
      ],
      "seedRows": [
        { "对象编号": "OBJ-001", "对象名称": "示例对象 A", "状态": "启用" }
      ]
    },
    {
      "name": "业务记录表",
      "folder": "业务处理",
      "dependencyBatch": "main",
      "fields": [
        { "label": "记录编号", "type": "text", "unique": true },
        { "label": "记录日期", "type": "date" },
        { "label": "负责人", "type": "person" },
        { "label": "所属部门", "type": "text" },
        { "label": "业务金额", "type": "number" }
      ],
      "seedRows": [
        { "记录编号": "REC-001", "记录日期": "2026-06-01", "所属部门": "运营部", "业务金额": 32000 }
      ]
    }
  ],
  "docs": [
    {
      "title": "项目使用说明",
      "folder": "系统说明",
      "format": "richtext",
      "contentPlan": {
        "h1": "项目使用说明",
        "summary": "说明项目定位、使用流程、数据口径和角色职责",
        "tags": ["初始化", "运营", "报表"],
        "sections": ["项目定位", "使用流程", "数据维护", "报表口径", "风险提示"]
      }
    }
  ],
  "reports": [
    {
      "name": "经营统计看板",
      "folder": "统计看板",
      "description": "基于业务记录表生成经营统计",
      "widgets": [
        {
          "title": "业务金额概览",
          "type": "bar",
          "sheetName": "业务记录表",
          "dimensionLabels": ["记录日期"],
          "metricLabels": ["业务金额"],
          "aggregation": "sum",
          "limit": 10
        }
      ]
    }
  ],
  "canvases": [
    {
      "name": "业务流程画布",
      "folder": "系统说明",
      "changeSummary": "初始化业务流程画布",
      "nodes": [
        { "id": "source", "type": "CYLINDER", "x": 80, "y": 110, "label": "基础数据", "role": "data" },
        { "id": "process", "type": "RECTANGLE", "x": 360, "y": 110, "label": "业务处理", "role": "action" },
        { "id": "dashboard", "type": "INFOGRAPHIC", "x": 640, "y": 110, "label": "统计看板", "role": "display" }
      ],
      "edges": [
        { "id": "e1", "source": "source", "target": "process", "label": "流转" },
        { "id": "e2", "source": "process", "target": "dashboard", "label": "汇总" }
      ]
    }
  ]
}
```

## 9. 从行业脚本迁移到模板的规则

把旧脚本或行业脚本转换成模板时，按下面规则迁移：

| 脚本内容 | 模板处理 |
| --- | --- |
| `CONFIG.folders` | 保留为业务目录变量，检查所有资源 folder 都存在 |
| `CONFIG.sheets[].fields` | 转成字段设计，补类型、选项、人员/部门/relation 规则 |
| `CONFIG.sheets[].seedRows` | 保留中文标签草案，执行前转真实 `fieldId` |
| `CONFIG.docs[].content` Markdown | 只保留文案，改成 TipTap richtext 结构 |
| `CONFIG.reports[].widgets` | 保留 `sheetName/dimensionLabels/metricLabels/aggregation`，执行前校验字段和类型 |
| `CONFIG.canvases[].nodes/edges` | 保留业务节点和连线，补完整画布字段、颜色、handle |
| 直接 HTTP helper | 不作为默认执行方式；改为 CLI/SDK 优先 |
| `execution-result.json` | 保留为标准执行产物 |
| `execution-error.log` | 保留为错误产物 |

## 10. 完成判定

使用快速模板创建或补齐项目后，不能只说“脚本跑完”。完成输出必须包含：

- 项目 ID 和项目详情回查。
- 目录 ID 和 `sheet tree` 归位结果。
- 每张表的 `sheetId`、字段映射、默认视图情况。
- 每张表写入行数、`row page` 抽查和业务 `data` 是否非空。
- 文档 ID、`doc info` 和 TipTap 富文本结构说明。
- 报表 ID、组件 ID、`preview/query-widget/query` 结果。
- 画布 ID、`canvas validate/info/versions` 结果。
- 权限是否执行；未执行时说明待绑定用户、待配置权限和风险。
- `execution-result.json` / `execution-error.log` 路径。
