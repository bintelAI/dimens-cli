# 移动端接入案例

## 1. App 不直持有 apiSecret 的标准链路

```text
app login -> app server -> exchange token -> app request business api -> business api call dimens
```

说明：

- `apiSecret` 默认放服务端
- App 只消费自己服务端透出的业务接口或短期 token
- App 包体里不要出现 `apiKey/apiSecret`
- 服务端负责记录审计日志、刷新 token、处理 403/404 和版本冲突

## 2. 移动端请求自家服务端拿项目列表

```ts
const response = await fetch('https://your-app.example.com/api/dimens/projects', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    teamId: currentTeamId,
    keyword: searchText,
  }),
});
```

推荐原因：

- App 不直接暴露维表 token
- 统一控制鉴权、刷新和审计

## 3. React Native 页面加载项目和表格摘要

```ts
const projectList = await fetch('https://your-app.example.com/api/dimens/projects', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    teamId,
  }),
}).then((res) => res.json());

const currentProjectId = projectList.data?.[0]?.id;

const sheetList = await fetch('https://your-app.example.com/api/dimens/sheets', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectId: currentProjectId,
  }),
}).then((res) => res.json());
```

## 4. 小程序 / H5 上报一条巡检记录

```ts
await fetch('https://your-app.example.com/api/dimens/rows/create', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sheetId: 'SHEET巡检',
    data: {
      field_device_name: '1号空调机组',
      field_status: '正常',
      field_checker: '张三',
    },
  }),
});
```

适用场景：

- 巡检系统
- 移动 CRM 外勤录入
- 现场采集

## 5. 移动端详情页更新单元格状态

```ts
await fetch('https://your-app.example.com/api/dimens/rows/update-cell', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sheetId,
    rowId,
    fieldId,
    value: '已处理',
    version,
  }),
});
```

说明：

- 服务端仍应代为校验 `version`
- 不要在移动端忽略并发问题

## 6. 移动端读取日报文档详情

```ts
const detail = await fetch('https://your-app.example.com/api/dimens/document/info', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    teamId,
    projectId,
    documentId,
  }),
}).then((res) => res.json());
```

## 7. 移动端发起 AI 摘要请求

```ts
await fetch('https://your-app.example.com/api/dimens/ai/summary', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    teamId,
    content: '今天新增了 12 条巡检记录，2 条异常待处理',
  }),
});
```

适用场景：

- 外勤日报总结
- 销售跟进摘要
- 巡检异常总结

## 8. 移动端接入高风险误区

- 不要把 `apiKey/apiSecret` 打包进客户端
- 不要让客户端自己决定维表 baseUrl
- 不要在客户端直接拼接全部业务路径而完全不走服务端治理
- 不要忽略 token 刷新策略和设备注销策略
- 不要让移动端绕过服务端直接处理多团队、多项目隔离逻辑
- 不要把版本冲突和权限不足都展示成“登录过期”

## 9. 服务端最小验证链路

移动端联调前，服务端先验证目标资源：

```bash
dimens-cli auth status
dimens-cli project info PROJECT_ID --team-id TEAM_ID
dimens-cli sheet info SHEET_ID --team-id TEAM_ID --project-id PROJECT_ID
```

只有服务端验证通过后，再让 App 调业务接口。
