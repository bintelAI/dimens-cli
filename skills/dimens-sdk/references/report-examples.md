# 报表接入案例

## 1. 创建报表主资源

```ts
const report = await sdk.report.createProjectReport('PROJ1', {
  name: '销售漏斗看板',
  description: '用于查看客户转化情况',
});

const reportId = report.data.reportId;
```

说明：

- 当前产品创建报表走项目菜单资源链路：`/app/mul/project/:projectId/sheet/create`
- 请求体固定使用 `type: 'report'`，SDK 会自动组装 `config.dashboardConfig`
- 服务端返回的是 `sheetId`，SDK 会兼容补齐 `reportId = sheetId`
- 这里只是创建报表主资源
- 还不代表组件和查询链路已可用

## 2. 查询报表列表

```ts
const reports = await sdk.report.list('PROJ1', {
  page: 1,
  size: 20,
});
```

## 3. 查询报表详情

```ts
const detail = await sdk.report.info('PROJ1', 'REPORT1');
```

## 4. 预览数据源

```ts
await sdk.report.preview('PROJ1', {
  dataSource: {
    type: 'sheet',
    sheetId: 'SHEET1',
  },
  dataMapping: {
    xField: 'field_stage',
    yField: 'field_count',
  },
});
```

## 5. 新增柱状图组件

```ts
await sdk.report.addWidget('PROJ1', {
  reportId: 'REPORT1',
  type: 'bar',
  title: '线索阶段分布',
  dataSource: {
    type: 'sheet',
    sheetId: 'SHEET1',
  },
  dataMapping: {
    xField: 'field_stage',
    yField: 'field_count',
  },
});
```

## 6. 查询单组件结果

```ts
await sdk.report.queryWidget('PROJ1', {
  reportId: 'REPORT1',
  widgetId: 'WIDGET1',
});
```

## 7. 查询整张报表结果

```ts
await sdk.report.query('PROJ1', {
  reportId: 'REPORT1',
});
```

## 8. 发布报表

```ts
await sdk.report.publish('PROJ1', {
  reportId: 'REPORT1',
  isPublic: 1,
});
```

## 9. 复制一份报表

```ts
await sdk.report.copy('PROJ1', {
  reportId: 'REPORT1',
  name: '销售漏斗看板-副本',
});
```

## 10. Web 报表页查询单组件

```ts
await fetch(`https://dimens.bintelai.com/api/app/report/query/${projectId}/widget`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    reportId,
    widgetId,
  }),
});
```

## 11. 报表接入推荐顺序

```text
report.createProjectReport -> report.preview -> report.addWidget -> report.queryWidget -> report.query
```

## 12. 报表接入高风险误区

- 不要只创建空报表就认为看板完成
- 不要在新建项目报表时继续使用旧 `report.create` 示例并期待后端返回 `data.reportId`
- 不要跳过 `preview` 直接加组件
- 不要把主资源链、组件链、查询链混成一个接口理解
