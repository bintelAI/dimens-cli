# 富文本与 JSON 字段 CLI/Skill 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为富文本和 JSON 字段提供专用 SDK/CLI，并让 `dimens-manager` 明确指导正确的创建、读写和版本控制方式。

**Architecture:** 保留现有富文本专用接口，在同一层新增对称的 `JsonFieldSDK` 与 `json-field` 命令组。CLI 只做输入来源、基础 JSON 语法、顶层类型和版本参数校验，容量、重复键、权限和并发最终由服务端裁决；技能使用一份集中参考页说明两类字段，避免规则散落。

**Tech Stack:** TypeScript、Vitest、现有 `DimensClient`/命令注册器、Markdown Skill references。

---

## 文件边界

| 文件 | 职责 |
| --- | --- |
| `src/sdk/json-field.ts` | JSON 字段接口类型与 HTTP 封装 |
| `src/sdk/index.ts`、`src/browser.ts`、`index.ts` | Node、浏览器和包根导出 |
| `src/commands/json-field/index.ts` | JSON 字段 CLI 参数校验、文件读取和专用接口调用 |
| `src/commands/richtext-field/index.ts` | 为现有富文本保存增加 UTF-8 文件输入 |
| `src/commands/index.ts` | 注册 `json-field` 命令组 |
| `src/skills/mappings.ts` | 将新命令和 SDK 暴露给技能映射 |
| `tests/sdk/json-field.test.ts` | SDK URL、query 和 payload 契约 |
| `tests/commands/json-field.test.ts` | JSON CLI 成功路径与输入错误 |
| `tests/commands/richtext-field.test.ts` | 富文本文件输入与冲突参数 |
| `skills/dimens-manager/references/table/references/richtext-json-fields.md` | 两类字段的权威使用说明 |
| `skills/dimens-manager/SKILL.md`、`references/table/overview.md` | 强制路由到专用参考页 |
| `skills/dimens-manager/test-prompts.json` | 技能行为回归场景 |

## Task 1：新增 JSON 字段 SDK

**Files:**
- Create: `src/sdk/json-field.ts`
- Modify: `src/sdk/index.ts`
- Modify: `src/browser.ts`
- Modify: `index.ts`
- Create: `tests/sdk/json-field.test.ts`

- [ ] **Step 1: 写失败测试**

在 `tests/sdk/json-field.test.ts` 使用真实 `DimensClient` 和 fetch stub，覆盖：

```ts
it('reads extended JSON content by id', async () => {
  const sdk = new JsonFieldSDK(client);
  await sdk.getContent('TEAM1', 'PROJ1', 'json_1');
  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.example.com/app/mul/TEAM1/PROJ1/json-field/content?id=json_1',
    expect.objectContaining({ method: 'GET' })
  );
});

it('saves JSON content with concurrency versions', async () => {
  await sdk.save('TEAM1', 'PROJ1', {
    sheetId: 'sh_1', rowId: 'row_1', fieldId: 'fld_json', id: 'json_1',
    content: '{"enabled":true}', jsonVersion: 2, rowVersion: 7,
  });
  expect(requestBody()).toEqual({
    sheetId: 'sh_1', rowId: 'row_1', fieldId: 'fld_json', id: 'json_1',
    content: '{"enabled":true}', jsonVersion: 2, rowVersion: 7,
  });
});
```

- [ ] **Step 2: 运行测试确认 RED**

Run: `pnpm test -- tests/sdk/json-field.test.ts`

Expected: FAIL，错误指向 `src/sdk/json-field` 不存在。

- [ ] **Step 3: 实现最小 SDK**

在 `src/sdk/json-field.ts` 定义：

```ts
export type JsonFieldRootType = 'object' | 'array';
export type JsonFieldValue = Record<string, unknown> | unknown[];

export interface JsonFieldContent {
  id: string;
  sheetId: string;
  rowId: string;
  fieldId: string;
  content: JsonFieldValue;
  rootType: JsonFieldRootType;
  sizeBytes: number;
  version: number;
}

export interface JsonFieldSavePayload {
  sheetId: string;
  rowId: string;
  fieldId: string;
  id?: string | null;
  content: string;
  jsonVersion?: number;
  rowVersion?: number;
}
```

`JsonFieldSDK.getContent()` 调用
`GET /app/mul/${teamId}/${projectId}/json-field/content?id=...`；`save()` 调用
`POST /app/mul/${teamId}/${projectId}/json-field/save`。返回类型使用
`storageMode: 'inline' | 'extended'` 的判别联合。

在三个 SDK 入口新增 `JsonFieldSDK` 导入、`readonly jsonField` 初始化和公共导出。

- [ ] **Step 4: 运行测试确认 GREEN**

Run: `pnpm test -- tests/sdk/json-field.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交独立 SDK 变更**

```bash
git add src/sdk/json-field.ts src/sdk/index.ts src/browser.ts index.ts tests/sdk/json-field.test.ts
git commit -m "feat: add JSON field SDK"
```

## Task 2：新增 JSON CLI 并增强富文本文件输入

**Files:**
- Create: `src/commands/json-field/index.ts`
- Modify: `src/commands/richtext-field/index.ts`
- Modify: `src/commands/index.ts`
- Modify: `src/skills/mappings.ts`
- Create: `tests/commands/json-field.test.ts`
- Modify: `tests/commands/richtext-field.test.ts`
- Modify: `tests/commands/help.test.ts`

- [ ] **Step 1: 写 JSON CLI 失败测试**

测试以下行为：

```ts
await save?.handler([
  '--sheet-id', 'sh_1', '--row-id', 'row_1', '--field-id', 'fld_json',
  '--content', '{"items":[1,2]}', '--row-version', '7',
]);
expect(jsonFieldSdkSpies.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
  sheetId: 'sh_1', rowId: 'row_1', fieldId: 'fld_json',
  content: '{"items":[1,2]}', rowVersion: 7,
});
```

另写独立用例断言：`--file` 读取 UTF-8；`--content` 与 `--file` 同时出现时拒绝；
`"text"`、`1`、`null` 等顶层标量拒绝；非法 `--json-version` 拒绝且不调用 SDK；
`content --id json_1` 调用 `getContent`。

- [ ] **Step 2: 写富文本文件输入失败测试**

用 `mkdtemp`/`writeFile` 创建 UTF-8 HTML 文件：

```ts
await save?.handler([
  '--sheet-id', 'sh_1', '--row-id', 'row_1', '--field-id', 'fld_richtext',
  '--file', htmlPath,
]);
expect(richTextFieldSdkSpies.save).toHaveBeenCalledWith('TEAM1', 'PROJ1', {
  sheetId: 'sh_1', rowId: 'row_1', fieldId: 'fld_richtext', content: html,
});
```

另断言同时传 `--content`/`--file` 时不调用 SDK。

- [ ] **Step 3: 运行测试确认 RED**

Run: `pnpm test -- tests/commands/json-field.test.ts tests/commands/richtext-field.test.ts tests/commands/help.test.ts`

Expected: JSON 命令组缺失、富文本 `--file` 未被读取，测试失败。

- [ ] **Step 4: 实现 CLI 最小逻辑**

在 JSON 命令中实现共享输入解析：

```ts
function readRequiredContent(flags: Record<string, string>): string {
  if (flags.content !== undefined && flags.file !== undefined) {
    throw new Error('--content 和 --file 不能同时传入');
  }
  if (flags.content === undefined && flags.file === undefined) {
    throw new Error('缺少 JSON 内容，请传入 --content 或 --file');
  }
  return flags.file ? readFileSync(flags.file, 'utf-8') : flags.content;
}

function assertJsonContainer(content: string): void {
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { throw new Error('JSON 内容必须是合法 JSON'); }
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('JSON 顶层必须是对象或数组');
  }
}
```

复用 `parseOptionalInteger` 规则校验 `jsonVersion`、`rowVersion`。注册 `content/save`，
并在 `src/commands/index.ts` 注册命令组。

富文本命令使用相同的互斥输入规则读取 HTML 文件，但不解析或转换 HTML。

更新 `src/skills/mappings.ts`：为 manager/sdk 增加 `json-field`、
`json-field content/save`、`JsonFieldSDK`、`DimensSDK.jsonField`；保留现有映射。

- [ ] **Step 5: 运行测试确认 GREEN**

Run: `pnpm test -- tests/commands/json-field.test.ts tests/commands/richtext-field.test.ts tests/commands/help.test.ts tests/commands/skill.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交 CLI 变更**

```bash
git add src/commands/json-field/index.ts src/commands/richtext-field/index.ts src/commands/index.ts \
  src/skills/mappings.ts tests/commands/json-field.test.ts tests/commands/richtext-field.test.ts \
  tests/commands/help.test.ts
git commit -m "feat: add dedicated JSON field commands"
```

## Task 3：强化 dimens-manager 技能

**Files:**
- Create: `skills/dimens-manager/references/table/references/richtext-json-fields.md`
- Modify: `skills/dimens-manager/SKILL.md`
- Modify: `skills/dimens-manager/references/table/overview.md`
- Modify: `skills/dimens-manager/test-prompts.json`

- [ ] **Step 1: 建立技能 RED 基线**

使用不加载新参考页的独立代理测试两个请求：

```text
把 AI 生成的 Markdown 写进富文本字段，可以直接 doc update 吗？
把一个 2 MB JSON 对象写进 json 字段，直接 row set-cell --value-json 可以吗？
```

记录代理是否误用 `doc update`、是否误用普通 row 写入、是否遗漏 extended 模式和版本号。

- [ ] **Step 2: 写专用参考页**

参考页按“决策表 -> 创建 -> 首次保存 -> 读取 -> 更新 -> 验证 -> 常见错误”组织。
必须包含以下命令：

```bash
dimens-cli column create --sheet-id sh_1 --label 详情 --type richtext
dimens-cli richtext-field save --sheet-id sh_1 --row-id row_1 --field-id fld_richtext --file ./detail.html --row-version 1
dimens-cli richtext-field content --document-id DOC_RTF_1

dimens-cli column create --sheet-id sh_1 --label 配置 --type json --config '{"jsonConfig":{"storageMode":"inline","maxSizeKb":10}}'
dimens-cli column create --sheet-id sh_1 --label 大配置 --type json --config '{"jsonConfig":{"storageMode":"extended","maxSizeMb":5}}'
dimens-cli json-field save --sheet-id sh_1 --row-id row_1 --field-id fld_json --file ./config.json --row-version 1
dimens-cli json-field content --id json_1
dimens-cli json-field save --sheet-id sh_1 --row-id row_1 --field-id fld_json --id json_1 --json-version 1 --row-version 2 --file ./config.json
```

明确写出：富文本正文是 HTML；在线文档与富文本字段不是同一资源；inline JSON 从
`row info` 读取；extended JSON 使用 `json-field content`；JSON 禁止普通 row 写入；
JSON 顶层仅对象/数组且不允许注释、尾逗号、重复键。

- [ ] **Step 3: 加入技能强制路由和测试提示**

在 `SKILL.md` 执行前必读区加入一条：遇到 `richtext/json` 字段必须读取专用参考页。
在 `table/overview.md` 的高风险提醒、命令表和 references 索引加入专用规则。

在 `test-prompts.json` 加入两个对象，`expected` 分别明确禁止 `doc update` 和
`row set-cell`，并要求输出专用命令、存储模式和版本字段。

- [ ] **Step 4: 运行 Skill GREEN 复测**

把新参考页提供给独立代理，重复 Step 1 的请求。通过标准：两次输出均选择专用命令，
富文本说明 HTML，JSON 说明 extended/版本控制且不触碰权限/Yjs。

- [ ] **Step 5: 校验技能文件**

Run: `node -e "JSON.parse(require('fs').readFileSync('skills/dimens-manager/test-prompts.json','utf8'))"`

Expected: 退出码 0。

Run: `python3 /Users/lixiang/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/dimens-manager`

Expected: `Skill is valid!`。若脚本不接受当前技能已有扩展 frontmatter，仅记录既有差异，
再使用项目现有 `pnpm test -- tests/commands/skill.test.ts` 作为可执行验证。

注意：这些技能文件已有用户未提交修改，不执行整文件 `git add` 或提交。

## Task 4：验证与文档评估

**Files:**
- Inspect: `.trae/已开发文档/`
- Inspect: all changed files

- [ ] **Step 1: 运行定向测试**

Run: `pnpm test -- tests/sdk/json-field.test.ts tests/commands/json-field.test.ts tests/commands/richtext-field.test.ts tests/commands/help.test.ts tests/commands/skill.test.ts`

Expected: PASS。

- [ ] **Step 2: 运行静态检查**

Run: `pnpm typecheck`

Expected: PASS。

Run: `pnpm lint`

Expected: PASS；不执行 `pnpm build`。

- [ ] **Step 3: 运行全量测试**

Run: `pnpm test`

Expected: 所有 Vitest 测试通过。

- [ ] **Step 4: 检查差异和文件规模**

Run: `git diff --check`

Expected: 无空白错误。

Run: `wc -l src/sdk/json-field.ts src/commands/json-field/index.ts skills/dimens-manager/references/table/references/richtext-json-fields.md`

Expected: 每个新增文件低于 700 行。

- [ ] **Step 5: 遍历已开发文档并判断更新必要性**

使用 `rg --files .trae/已开发文档` 和字段关键词核对现有文档。若文档需要更新，只向用户
说明建议修改的文件和原因，不直接修改，等待用户确认。

- [ ] **Step 6: 完成目标审计**

逐项确认：JSON SDK、Node/浏览器导出、JSON CLI、富文本文件输入、Skill 强提醒、
错误链路说明、测试与静态检查证据全部存在，再将活动目标标记完成。
