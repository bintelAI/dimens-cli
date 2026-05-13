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
