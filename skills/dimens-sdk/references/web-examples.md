# Web / H5 接入案例

## 1. 浏览器端用 token 直连项目列表

```ts
export async function fetchProjects(token: string, teamId: string, keyword?: string) {
  const response = await fetch(
    `https://dimens.bintelai.com/api/app/org/${teamId}/project/page`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
        keyword,
      }),
    }
  );

  return response.json();
}
```

说明：

- 适合已有安全用户 token 的前端
- 多团队切换场景不要把 `teamId` 写死

## 2. 前端按业务域拆 API 文件

```ts
export async function fetchSheetRows(
  token: string,
  teamId: string,
  projectId: string,
  sheetId: string,
  viewId?: string
) {
  const response = await fetch(
    `https://dimens.bintelai.com/api/app/mul/${teamId}/${projectId}/sheet/${sheetId}/row/page`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page: 1,
        size: 20,
        viewId,
      }),
    }
  );

  return response.json();
}
```

推荐拆分方式：

- `api/project.ts`
- `api/sheet.ts`
- `api/document.ts`
- `api/report.ts`
- `api/ai.ts`

## 3. React 页面首次进入时先拉项目，再拉表格

```ts
const projectResult = await fetchProjects(token, teamId, keyword);
const currentProject = projectResult.data.list[0];

const sheets = await fetch(
  `https://dimens.bintelai.com/api/app/mul/project/${currentProject.id}/sheet/list`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
).then((res) => res.json());
```

说明：

- 项目接口和表格接口路径前缀不同
- 不要误以为只是换一个资源 ID

## 4. Web 表格页面读取视图 + 行数据

```ts
const views = await fetch(
  `https://dimens.bintelai.com/api/app/mul/${teamId}/${projectId}/sheet/${sheetId}/view/list`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
).then((res) => res.json());

const currentViewId = views.data?.[0]?.viewId;

const rows = await fetch(
  `https://dimens.bintelai.com/api/app/mul/${teamId}/${projectId}/sheet/${sheetId}/row/page`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page: 1,
      size: 20,
      viewId: currentViewId,
    }),
  }
).then((res) => res.json());
```

## 5. 浏览器端更新单元格

```ts
await fetch(`https://dimens.bintelai.com/api/app/mul/sheet/${sheetId}/row/cell`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    rowId,
    fieldId,
    value,
    version,
  }),
});
```

说明：

- 更新前必须先拿到最新 `version`
- 不要在浏览器端省掉并发版本控制

## 6. Web 富文本文档读取与更新

```ts
const doc = await fetch(
  `https://dimens.bintelai.com/api/app/documents/${teamId}/${projectId}/document/${documentId}/info`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
).then((res) => res.json());

await fetch(
  `https://dimens.bintelai.com/api/app/documents/${teamId}/${projectId}/document/update`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId,
      content: '<h1>更新后的标题</h1><p>正文内容</p>',
      version: Number(doc.data.version),
      createVersion: true,
    }),
  }
);
```

## 7. Web 端报表页预览组件数据

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

## 8. Web 页面调用 AI 聊天兼容接口

```ts
await fetch(`https://dimens.bintelai.com/api/app/flow/${teamId}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'team-default',
    messages: [
      {
        role: 'user',
        content: '帮我总结今日线索变化',
      },
    ],
  }),
});
```

说明：

- 适合对话型页面
- 如果要处理工作流挂载问题，回到 `dimens-workflow`
