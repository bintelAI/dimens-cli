# 项目级自定义页面的资源初始化与跨项目复用

当维表自定义页面、Wujie 项目菜单页面或 `dimens-web` 页面需要在每个项目中拥有独立的业务表和字段时，使用本文。目标是让同一套页面通过运行时 `projectId` 自动定位本项目资源，不复制页面代码、不手工维护每个项目的资源 ID。

本文只定义资源命名、初始化和页面调用契约。页面、视图、按钮入口和 Wujie 上下文仍以 `micro-module-wujie-context.md` 为准；实际资源创建仍优先使用 `dimens-cli`，不要用页面前端绕开现有资源管理链路。

## 1. 业务页面适配器的生命周期

这是一种适配某个业务场景的页面开发方式，不是为所有微模块统一创建资源。一个业务页面把“页面功能”和“项目内业务表”绑定为同一份契约：页面被导入哪个项目，就只初始化和调用哪个项目的业务表。

```text
业务页面定义（固定业务表/字段后缀）
  -> 导入当前项目（平台生成项目内 instanceId）
  -> 从项目菜单打开页面（得到 teamId / projectId / instanceId）
  -> 首次进入：保障当前项目的表和字段存在
  -> 初始化成功：页面以当前 projectId 推导表/字段 ID
  -> 当前项目业务表：读取、创建、更新业务数据
```

核心边界：

- `instanceId` 表示一次导入实例和页面配置，不参与默认资源命名；项目业务表由 `projectId + 业务后缀` 唯一定位。
- 同一业务页面被导入同一项目多次时，默认调用同一张项目业务表，实例配置可以不同。若业务确实要求实例级数据隔离，必须单独设计资源模型，不能擅自把 `instanceId` 拼进现有 ID。
- 首次进入的“初始化”是幂等保障流程，不是每次渲染都创建资源。确认资源已完整后，后续进入直接调用当前项目表；缺表或缺字段时才补齐。
- 初始化与普通业务读写分开授权：前者受项目管理/实例配置权限控制，后者仍受当前用户的数据权限控制。

## 2. 先定义业务资源契约

每个页面在开发前先定义自己的稳定业务后缀。后缀是页面业务的一部分，不是平台固定词；例如“工单页”可选择 `work_item`，而不是复用任何其他模块的案例名称。

```ts
const schema = {
  tableSuffix: 'work_item',
  fields: {
    title: 'title',
    status: 'status',
    ownerId: 'owner_id',
  },
} as const;
```

约束：

- 使用稳定、语义明确的英文下划线后缀；发布后不要随意改名。
- 表后缀在同一项目内必须唯一；字段后缀在目标表内必须唯一。
- 后缀由页面代码或受控的版本化实例配置定义，不能来自普通用户可编辑输入。
- 不把 `teamId`、用户名、随机值或实例 ID 写入表、字段后缀。
- 示例中的 `work_item` 仅是案例，任何业务都必须声明自己的后缀。

## 3. ID 推导规则

后端根据项目 ID 和创建时的自定义后缀生成资源 ID。页面运行时只使用当前上下文的 `projectId` 推导预期 ID：

| 资源 | 创建时提交 | 定位方式 |
| --- | --- | --- |
| 业务表 | `customId = tableSuffix` | 精确回查 `${projectId}_${tableSuffix}` |
| 业务字段 | `customId = fieldSuffix` | 从结构接口回查真实 `fieldId` |

```ts
function resolveProjectSchemaId(projectId: string, definition: typeof schema) {
  return `${projectId}_${definition.tableSuffix}`;
}
```

当前 CLI/SDK 的公开类型只保证从 `column list` 或 `sheet structure` 读取实际 `fieldId`；字段后缀只要求在目标表内唯一。不要把 `${projectId}_${fieldSuffix}` 当成当前 SDK 已承诺的字段 ID，也不要用中文标签作为写入 key。创建表或字段后必须回查实际 ID 和字段结构；不能因为字符串可推导就跳过回查。

## 4. 幂等初始化流程

初始化的成功标准是“目标表存在且全部约定字段存在”，不是“调用过创建接口”。按下面顺序执行：

1. 从页面运行时取得 `teamId`、`projectId`、`instanceId`，并校验当前入口是 `sourceLocation = PROJECT_MENU`。
2. 基于 `projectId + tableSuffix` 得到预期 `sheetId`，列出当前项目的表，精确查找该 ID。
3. 表不存在时，以 `customId = tableSuffix` 创建表；创建冲突时只重新读取一次列表，确认是否已被并发初始化者创建。
4. 并行读取 `sheet structure` 和 `column list`，按真实 `fieldId` 合并字段结构；没有可靠映射时必须阻断，不能按标签猜测。
5. 只为缺失字段提交 `column create --custom-id <fieldSuffix>`；已有字段不覆盖标签、类型、配置或历史数据。
6. 再次读取两个结构来源，确认表 ID、真实字段映射、类型和所需配置均符合契约；缺失或不可读项要明确报错，不能假装初始化成功。

禁止做法：页面进入即无条件创建表、全量重建字段、删除旧字段、静默改变字段类型、用标签判断字段是否存在，或为了并发冲突删除任一方已创建的资源。

## 5. CLI 创建和回查案例

以下命令只展示机制。先将 `TABLE_SUFFIX` 和字段后缀替换为当前页面的业务契约，再在目标项目上下文中执行。

```bash
dimens-cli sheet list --project-id "$PROJECT_ID"

dimens-cli sheet create \
  --project-id "$PROJECT_ID" \
  --name "工单" \
  --type sheet \
  --custom-id work_item

dimens-cli column create \
  --team-id "$TEAM_ID" \
  --project-id "$PROJECT_ID" \
  --sheet-id "${PROJECT_ID}_work_item" \
  --label "标题" \
  --type text \
  --custom-id title

dimens-cli sheet structure \
  --team-id "$TEAM_ID" \
  --project-id "$PROJECT_ID" \
  --sheet-id "${PROJECT_ID}_work_item"
```

资源创建前先使用 `dimens-cli --help`、`help sheet create` 或 `help column create` 核对当前命令参数。自动化初始化应先生成并检查资源契约，再逐项调用 CLI；不要通过 Node.js、Python、HTTP 或浏览器脚本替代 CLI 的资源写入命令。

## 6. 项目菜单页面的调用规则

页面型微模块从项目菜单打开时，宿主传入的核心上下文如下：

```ts
const { teamId, projectId, instanceId, sourceLocation, permissions } = runtime.context;

if (sourceLocation !== 'PROJECT_MENU' || !teamId || !projectId || !instanceId) {
  return <StateView title="缺少项目页面上下文" />;
}

const sheetId = resolveProjectSchemaId(projectId, schema);
```

初始化成功后，页面业务数据必须使用这里定位的 `sheetId` 与回查得到的真实 `fieldId` 映射读取或写入。`resolveProjectSchemaId` 是页面内部的资源定位函数，不是 SDK 提供的方法：

- 不使用项目菜单资源的 `sheetId` 作为业务表。它通常只是菜单资源或页面绑定信息。
- 不读取“当前激活表”来猜测业务数据来源。项目菜单页默认没有当前表的业务语义。
- 如页面还需要用户选择某个外部表，只能从受控 `instanceConfig` 读取该表 ID，并明确它与页面自有业务表的职责不同。
- 读取、创建、更新行时保留现有的 `teamId/projectId/sheetId` 上下文，更新前按既有 API 契约读取版本并提交版本号。
- 业务行建议写入 `${projectId}_project_id` 等项目归属字段，读取结果应与当前 `projectId` 一致；这用于业务自检，不替代后端项目和权限校验。

## 7. 权限、隔离与异常处理

- 初始化入口只对当前系统已有的项目管理员或实例配置权限开放；`canConfigure` 只控制前端可见性，后端仍必须校验。
- 正常读写分别受当前用户的项目、表和行权限控制。`canReadData/canWriteData` 仅用于 UI 预判，不能作为授权依据。
- `projectId` 是项目资源命名和隔离上下文；`teamId` 是团队隔离上下文。前端传入的任一 ID 都不能绕过后端的实例归属校验。
- 页面内不得缓存跨项目的 `sheetId` 或 `fieldId`。切换项目后必须由新的 `projectId` 重新推导并重新读取结构。
- 表或字段创建失败时保留错误并提示管理员重试；不删除已存在资源，也不迁移或改写历史数据。

## 8. 最小验收清单

1. 项目 A 首次打开页面后，得到 `A_<业务表后缀>` 与全部 `A_<字段后缀>`。
2. 项目 A 再次初始化不新增表、不重复字段，也不改变已有字段配置和数据。
3. 项目 B 打开同一页面后，得到自己的 `B_<业务表后缀>` 与字段；页面不读取项目 A 的资源。
4. 页面从 `PROJECT_MENU` 上下文取得 `teamId/projectId/instanceId`，没有把菜单资源或当前激活表误作业务表。
5. 无初始化权限用户看不到或无法执行初始化；无数据写权限用户不能借助前端调用写入。
6. `sheet list` 与 `sheet structure` 的回查结果和页面资源契约一致。
7. 同一业务页面的第二个实例仍调用当前项目同一张业务表；只有明确设计了实例级资源模型时才例外。

## 9. 强化的资源契约、状态与入库规则

以下规则适用于需要“初始化后继续同步外部数据”的项目级页面，并优先于前文的简化示例。

### 9.1 资源契约

契约除了表名和后缀，还必须声明业务类型、业务主键、字段标签、类型和关键配置。初始化入口只接受这个受控契约或它的业务类型，不接收用户任意指定的 `sheetId`、后缀和字段定义。

```ts
const contract = {
  resourceType: 'work_item',
  tableSuffix: 'work_item',
  tableName: '工单',
  primaryKeys: ['source', 'externalId'],
  fields: [
    { key: 'source', label: '来源', type: 'text', required: true },
    { key: 'externalId', label: '外部 ID', type: 'text', required: true },
    { key: 'status', label: '状态', type: 'select', options: [{ id: 'open', label: '待处理' }] },
  ],
} as const;
```

- `primaryKeys` 必须非空、互不重复、都存在于 `fields`，并能唯一定位一行。
- 类型、选择项、字典、关系字段等配置属于契约。只有跨字段或跨位置复用的枚举才用项目字典；单个字段的固定选项直接写字段配置。
- 改后缀、字段类型或关键配置是迁移方案，不是初始化时可自动修复的问题。

### 9.2 表与字段状态

表先通过 `sheet list --project-id <projectId>` 按 `${projectId}_${tableSuffix}` 精确匹配；找不到时才检查同名表。存在同名但 ID 不同的表是 `id_mismatch`，必须阻断，绝不改名、覆盖或再创建副本。表不存在才是 `missing`，允许用 `sheet create --custom-id <tableSuffix>` 创建，并在冲突后只回查一次。

字段至少读取 `sheet structure` 和 `column list` 两个来源，按真实 `fieldId` 合并并记录来源。一个来源返回不全不能判定缺失；所有可用来源均确认不存在才是 `missing`。任一必需结构无法读取，或无法将受控字段后缀可靠映射到真实 `fieldId` 时，状态是 `unreadable`，不能创建或写入。

| 状态 | 含义与动作 |
| --- | --- |
| `ready` | ID、类型和关键配置均已验证，字段可写入 |
| `missing` | 所有可用来源均确认不存在，可创建后完整回查 |
| `id_mismatch` | 同名资源或受控标识对应的 ID 不一致，人工处理 |
| `type_mismatch` | 字段类型不一致，阻断，不能自动改类型 |
| `config_mismatch` | 选择项、字典或关系配置不一致，阻断，不能自动改配置 |
| `unreadable` | 登录、权限、网络、接口或映射信息不足，阻断，不能当作缺失 |

每创建一个字段都重新读取完整结构；最终只有表和全部字段均为 `ready` 且验证数等于契约字段数，才算初始化成功。页面诊断应展示表缺失、ID 不匹配、字段缺失、类型/配置不匹配和结构不可读，不得输出 token、API Secret、完整请求体或全量业务数据。

### 9.3 写入与并发控制

每次写入前重新定位当前项目表并验证字段映射，使用回查得到的真实 `fieldId` 组装数据。旧缓存只能用于提示，不能决定写入目标。

1. 通过 `row page` 按 `primaryKeys` 查询候选行；具体 `filters` 以当前 `row page --help` 和真实字段类型为准，不编造通用筛选 JSON。
2. 没有匹配行时使用 `row create`；初始化或补数据的批量新增优先使用 `row batch-create`。
3. 存在匹配行时，先 `row info` 获取最新行和 `version`，合并非空且已完成类型转换的值，再 `row update --version <version>`。
4. 多行匹配、未取得版本、字段不是 `ready` 或值无法转换时拒绝写入，返回可定位的诊断。

如果业务明确允许“同一字段值对应的所有行都统一更新同一个字段”，可改用 `sdk.row.batchUpdateByMatch(teamId, projectId, sheetId, { match, data })` 或 `dimens-cli row batch-update`。两侧各只能传一个真实 `fieldId`，最多 200 行，不传 `rowId/version`；无匹配时返回成功且两个计数均为 `0`。这不是默认 Upsert 策略，仍应先确认多行同时变更是业务预期。

空值默认不覆盖已有有效值，除非契约明确允许清空。行操作只能走 CLI 或 SDK 的 `/app/...` 资源路径，不得调用页面采集接口或非受控消息通道。

### 9.4 权限和验收

初始化仅向已有项目管理员或实例配置权限开放；普通读写仍受项目、表和行权限控制。前端的 `canConfigure`、`canReadData`、`canWriteData` 只用于界面预判，不能代替后端授权。

最小验收覆盖：项目 A 首次初始化、项目 A 重复初始化、项目 B 独立资源、同名 ID 冲突、字段类型/配置不匹配、读取失败不创建、按业务主键新增、带 `version` 更新、无权限写入被拒绝。页面嵌入第三方宿主时，写入按钮还应阻止默认行为和事件冒泡，并限制消息类型和请求路径。
