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

| 资源     | 创建时提交               | 预期资源 ID                   |
| -------- | ------------------------ | ----------------------------- |
| 业务表   | `customId = tableSuffix` | `${projectId}_${tableSuffix}` |
| 业务字段 | `customId = fieldSuffix` | `${projectId}_${fieldSuffix}` |

```ts
function resolveProjectSchemaIds(projectId: string, definition: typeof schema) {
  return {
    sheetId: `${projectId}_${definition.tableSuffix}`,
    fieldIds: Object.fromEntries(
      Object.entries(definition.fields).map(([key, suffix]) => [key, `${projectId}_${suffix}`])
    ),
  };
}
```

这只是页面内的预期 ID 计算。创建表或字段后必须通过 `sheet list`、`sheet structure` 或对应 SDK 读取接口回查实际 ID 和字段结构；不能因为字符串可推导就跳过回查。

## 4. 幂等初始化流程

初始化的成功标准是“目标表存在且全部约定字段存在”，不是“调用过创建接口”。按下面顺序执行：

1. 从页面运行时取得 `teamId`、`projectId`、`instanceId`，并校验当前入口是 `sourceLocation = PROJECT_MENU`。
2. 基于 `projectId + tableSuffix` 得到预期 `sheetId`，列出当前项目的表，精确查找该 ID。
3. 表不存在时，以 `customId = tableSuffix` 创建表；创建冲突时只重新读取一次列表，确认是否已被并发初始化者创建。
4. 读取目标表结构，以 `${projectId}_${fieldSuffix}` 精确比对约定字段。
5. 只为缺失字段提交 `column create --custom-id <fieldSuffix>`；已有字段不覆盖标签、类型、配置或历史数据。
6. 再次读取表结构，确认表 ID 与所有字段 ID 均符合契约；缺失项要明确报错，不能假装初始化成功。

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

const { sheetId, fieldIds } = resolveProjectSchemaIds(projectId, schema);
```

初始化成功后，页面业务数据必须使用这里推导出的 `sheetId` 与 `fieldIds` 读取或写入。`resolveProjectSchemaIds` 是页面内部的资源定位函数，不是 SDK 提供的方法：

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
