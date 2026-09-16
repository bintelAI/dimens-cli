# 多维表格接入案例

## 1. 创建第一张表

```ts
const sheet = await sdk.sheet.create('PROJ1', {
  name: '客户信息表',
  type: 'sheet',
});
```

说明：

- 表创建走 `projectId`
- 默认适合项目初始化后的第一步
- 如果是资源运维或排查，先用 `dimens-cli sheet create/info/list` 验证，再把同样上下文迁移到代码

## 2. 查询表格列表

```ts
const sheets = await sdk.sheet.list('PROJ1');
```

适用场景：

- 项目首页拉资源列表
- 首次接入时确认表是否创建成功

## 3. 查询表格结构

```ts
const structure = await sdk.sheet.structure('SHEET1');
```

说明：

- 适合初始化页面时一次性读取表、字段、视图结构
- 可以减少多次散请求

## 4. 补一列文本字段

```ts
await sdk.column.create('TEAM1', 'PROJ1', 'SHEET1', {
  label: '客户名称',
  type: 'text',
});
```

## 5. 补一个状态字段

```ts
await sdk.column.create('TEAM1', 'PROJ1', 'SHEET1', {
  label: '跟进状态',
  type: 'select',
  config: {
    options: [
      { id: 'pending', label: '待跟进' },
      { id: 'doing', label: '跟进中' },
      { id: 'done', label: '已签约' },
    ],
  },
});
```

说明：

- 下拉选项 `id` 应保持唯一
- 不要只写展示文案不写稳定 ID

## 6. 拉视图列表，不存在就补默认视图

```ts
const views = await sdk.view.list('TEAM1', 'PROJ1', 'SHEET1');

if (!views.data.length) {
  await sdk.view.create('TEAM1', 'PROJ1', 'SHEET1', {
    name: '默认视图',
    type: 'grid',
    isPublic: true,
  });
}
```

## 6.1 创建单表 / 多表 relation

`relation` 通过 `config.relationConfig.relationMode` 区分存储形态，不新增字段类型：

```ts
await sdk.column.create('TEAM1', 'PROJ1', 'SHEET_CONTACT', {
  label: '所属客户',
  type: 'relation',
  config: {
    relationConfig: {
      targetSheetId: 'SHEET_CUSTOMER',
      displayColumnId: 'FIELD_CUSTOMER_NAME',
      relationMode: 'single',
    },
  },
});

await sdk.column.create('TEAM1', 'PROJ1', 'SHEET_CUSTOMER', {
  label: '联系人列表',
  type: 'relation',
  config: {
    relationConfig: {
      targetSheetId: 'SHEET_CONTACT',
      relationMode: 'multiple',
      maxSelection: 10,
    },
  },
});
```

单表行值是一个 `rowId` 或 `null`，多表行值是 `rowId[]` 或 `[]`。多表不限制数量时省略 `maxSelection`；填写上限时最小为 2。字段创建后不允许切换模式，历史缺少 `relationMode` 的字段按 `maxSelection === 1` 推断为单表，否则按多表兼容。完整规则见 `../../dimens-manager/references/table/references/relation-mode.md`。

## 7. 分页读取行数据

```ts
const rows = await sdk.row.page('TEAM1', 'PROJ1', 'SHEET1', {
  page: 1,
  size: 20,
  viewId: 'VIEW1',
});
```

## 8. 创建一条客户记录

```ts
await sdk.row.create('SHEET1', {
  data: {
    field_customer_name: '杭州示例科技',
    field_status: 'pending',
  },
});
```

说明：

- `data` 的 key 应该是字段 ID
- 不要直接用“客户名称”这种中文标签当 key

## 9. 查询一行详情后更新单元格

```ts
const rowInfo = await sdk.row.info('TEAM1', 'PROJ1', 'SHEET1', 'ROW1');

await sdk.row.updateCell('SHEET1', {
  rowId: 'ROW1',
  fieldId: 'field_status',
  value: 'doing',
  version: Number(rowInfo.data.version),
});
```

## 10. 表单提交时更新整行

```ts
await sdk.row.update(
  'SHEET1',
  'ROW1',
  {
    field_customer_name: '杭州示例科技',
    field_status: 'done',
  },
  8
);
```

## 10.1 按字段精确匹配并批量更新一个字段

使用 `RowSDK.batchUpdateByMatch()` 调用项目级接口。它只适用于“一个字段匹配，更新一个字段”；`match` 与 `data` 的键都必须是当前表真实 `fieldId`，不是字段中文名。

```ts
const result = await sdk.row.batchUpdateByMatch(
  teamId,
  projectId,
  sheetId,
  {
    match: { fld_external_id: 'ABC-123' },
    data: { fld_status: 'done' },
  }
);
```

成功数据为 `{ success: true, matchedCount, updatedCount }`；没有匹配时两个数量都为 `0`。单次最多匹配 200 行，超过上限、字段不存在、匹配字段不可见、更新字段只读，或更新值不符合字段配置时请求会被拒绝。该接口在服务端对全部命中行使用同一事务，任一行无编辑权限或写入失败时不会部分更新。

不要给该接口传多个匹配字段、多个更新字段、`rowId` 或 `version`。CLI 场景优先使用 `dimens-cli row batch-update --match <json> --values <json>`；需要按 ID 更新单行时，继续使用 `sdk.row.update()` 或 `sdk.row.updateCell()` 并提交当前版本。

## 11. Web 前端读取表格行数据

适用前提：

- 前端已经从安全来源拿到 `token`
- 已确认 `teamId/projectId/sheetId`
- 浏览器没有保存 `apiSecret`

```ts
await fetch(`https://dimens.bintelai.com/api/app/mul/${teamId}/${projectId}/sheet/${sheetId}/row/page`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    page: 1,
    size: 20,
  }),
});
```

## 12. 表格接入高风险误区

- 不要把字段中文名直接当 `data` key
- 不要忽略 `version`
- 不要把团队级和项目级路径混成一个模板
- 不要把人员字段、部门字段退化成普通下拉
- 不要把 403/404 都当成 token 过期；先检查权限和资源上下文

## 13. 最小验证命令

```bash
dimens-cli sheet info SHEET1 --team-id TEAM1 --project-id PROJ1
dimens-cli column list --team-id TEAM1 --project-id PROJ1 --sheet-id SHEET1
dimens-cli row page --team-id TEAM1 --project-id PROJ1 --sheet-id SHEET1
```

如果 CLI 读取失败，先排查 token、团队成员、项目权限和 `sheetId`，不要先改 SDK 封装。
