# 富文本字段与 JSON 字段使用规范

本页是 `richtext` 和 `json` 两类专用字段的必读入口。两类字段都不能按普通文本或普通对象单元格处理。

## 1. 先记住两个禁令

- **富文本字段不能使用 `doc update`**：`doc update` 操作独立在线文档，富文本字段正文必须使用 `richtext-field save`。
- **JSON 字段不能使用 `row set-cell`**：即使值是对象，也不能使用 `--value-json`；JSON 字段必须使用 `json-field save`。

创建字段后，先创建或定位目标行，再调用专用保存命令。所有命令都要使用目标表真实的 `fieldId`，不要把中文字段名当作字段 ID。

## 2. 类型选择

| 类型 | 适合内容 | 单元格保存内容 | 正文读取方式 |
| --- | --- | --- | --- |
| `richtext` | 带标题、段落、列表、表格等格式化内容 | `documentId + previewText` | `richtext-field content --document-id ...` |
| `json` inline | 1-10 KB 的对象或数组 | JSON 对象或数组本身 | `row info` / `row page` |
| `json` extended | 1-5 MB 的对象或数组 | `id + previewText + rootType + sizeBytes` | `json-field content --id ...` |

选择 JSON 存储模式时：

- 小配置、固定结构参数优先 inline，`maxSizeKb` 只能是 1-10 的整数。
- 大对象、长数组或可能持续增长的内容使用 extended，`maxSizeMb` 只能是 1-5 的整数。
- 容量按压缩后 JSON 的 UTF-8 字节数计算。接近 2 MB 的文件至少配置 2 MB；为内容增长留余量时可配置 3 MB。

## 3. 富文本字段

### 3.1 创建字段

```bash
dimens-cli column create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --label 详情说明 \
  --type richtext
```

创建后执行 `column list` 取得真实 `FIELD_ID`。

### 3.2 内容格式

`richtext-field save` 的正文必须是 HTML。AI 生成 Markdown 时，先转换为 HTML；不要把 Markdown 原文直接当富文本正文保存。

大段 HTML、含引号的 HTML 或中文内容优先写入 UTF-8 文件：

```html
<h1>客户方案</h1>
<p>这里是方案正文。</p>
```

### 3.3 首次保存

先使用 `row info` 获取当前行及 `ROW_VERSION`，首次保存不传 `documentId`：

```bash
dimens-cli richtext-field save \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --row-id ROW_ID \
  --field-id FIELD_ID \
  --file ./detail.html \
  --row-version ROW_VERSION \
  --title 详情说明
```

也可以用 `--content '<h1>标题</h1><p>正文</p>'`。`--content` 与 `--file` 只能二选一。

保存成功后记录返回的 `documentId` 和最新行版本。

### 3.4 读取与更新

读取正文：

```bash
dimens-cli richtext-field content \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --document-id DOCUMENT_ID
```

更新已有正文前重新读取行版本，再保存：

```bash
dimens-cli richtext-field save \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --row-id ROW_ID \
  --field-id FIELD_ID \
  --document-id DOCUMENT_ID \
  --file ./detail.html \
  --row-version ROW_VERSION \
  --title 详情说明
```

## 4. JSON 字段

### 4.1 创建 inline 字段

```bash
dimens-cli column create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --label 轻量配置 \
  --type json \
  --config '{"jsonConfig":{"storageMode":"inline","maxSizeKb":10}}'
```

### 4.2 创建 extended 字段

```bash
dimens-cli column create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --label 大对象配置 \
  --type json \
  --config '{"jsonConfig":{"storageMode":"extended","maxSizeMb":3}}'
```

JSON 内容必须满足：

- 顶层是对象或数组，不能是字符串、数字、布尔值或 `null`。
- 不允许注释、尾逗号和重复键。
- 大内容使用 UTF-8 文件和 `--file`，不要把 2 MB JSON 直接塞进终端参数。

### 4.3 首次保存

先使用 `row info` 获取 `ROW_VERSION`。inline 和 extended 首次保存命令相同，都不传 `--id` 或 `--json-version`：

```bash
dimens-cli json-field save \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --row-id ROW_ID \
  --field-id FIELD_ID \
  --file ./config.json \
  --row-version ROW_VERSION
```

首次保存 extended JSON 后，记录返回的：

- `id`：扩展 JSON 内容 ID。
- `version`：JSON 内容版本，即后续的 `JSON_VERSION`。
- `row.version`：最新行版本，即后续的 `ROW_VERSION`。

### 4.4 读取

inline JSON 直接从行数据读取：

```bash
dimens-cli row info \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --row-id ROW_ID
```

extended JSON 的行数据只有摘要引用，完整正文使用：

```bash
dimens-cli json-field content \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --id JSON_ID
```

`json-field content` 只用于 extended 模式；inline 模式没有扩展内容 ID。

### 4.5 更新

更新 inline JSON 时重新获取行版本，不传 JSON ID 或 JSON 版本：

```bash
dimens-cli json-field save \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --row-id ROW_ID \
  --field-id FIELD_ID \
  --file ./config.json \
  --row-version ROW_VERSION
```

更新 extended JSON 时，先读取最新行和 JSON 内容，再同时传入两个版本：

```bash
dimens-cli json-field save \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --row-id ROW_ID \
  --field-id FIELD_ID \
  --id JSON_ID \
  --json-version JSON_VERSION \
  --row-version ROW_VERSION \
  --file ./config.json
```

- `jsonVersion` 保护扩展 JSON 正文，防止覆盖其他人的内容更新。
- `rowVersion` 保护当前行，防止摘要引用或其他字段变化被覆盖。
- CLI 要求 `--id` 与 `--json-version` 成对出现。

## 5. 验证链路

保存后至少执行：

1. `row info`：确认行版本和单元格值/摘要已更新。
2. 富文本执行 `richtext-field content`：确认 HTML 正文可读。
3. extended JSON 执行 `json-field content`：确认对象或数组正文与版本正确。
4. inline JSON 直接核对 `row info` 返回的字段值。

## 6. 常见错误

| 错误 | 原因 | 修正 |
| --- | --- | --- |
| 用 `doc update` 写富文本字段 | 把在线文档和富文本字段当成同一资源 | 改用 `richtext-field save` |
| 把 Markdown 原文传给富文本字段 | 专用保存接口接收 HTML | 先生成或转换为 HTML |
| 用 `row set-cell --value-json` 写 JSON 字段 | JSON 字段由专用服务维护 | 改用 `json-field save` |
| 用 `json-field content` 读 inline JSON | inline 没有扩展内容 ID | 从 `row info` 读取 |
| 更新 extended JSON 只传行版本 | 缺少 JSON 内容并发控制 | 同时传 `--id`、`--json-version` 和 `--row-version` |
| 把 2 MB JSON 放在 `--content` | 终端参数过长且难以转义 | 使用 UTF-8 文件和 `--file` |
| JSON 保存时报语法错误 | 顶层是标量，或包含注释、尾逗号、重复键 | 改为合法对象/数组并清理非标准语法 |
