# Web / H5 接入案例

如果是 `dimens-cli/dimens-web` 自定义页面，不优先使用本页手写 HTTP 示例。应先看 `references/dimens-web-scaffold.md`，用 `useDimens()` 调用脚手架 SDK；只有脚手架资源层尚未封装某个接口时，才参考本页的 HTTP 路径补 resource 方法。

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
- 如果要处理工作流挂载问题，回到 `dimens-manager/references/workflow/overview.md`

## 9. 真实场景：React 客户列表页先拉项目，再拉首张表的行数据

适用场景：

- 用户说“我已经拿到 token 了，React 页面要先展示项目，再展示客户表行数据”
- 不是 `dimens-web` 脚手架，而是普通 Web/H5/React 前端

```ts
export async function loadCustomerPage(
  token: string,
  teamId: string
) {
  const projects = await fetchProjects(token, teamId);
  const firstProject = projects.data?.list?.[0];

  if (!firstProject?.id) {
    throw new Error('当前团队下没有可用项目');
  }

  const sheets = await fetch(
    `https://dimens.bintelai.com/api/app/mul/project/${firstProject.id}/sheet/list`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  ).then((res) => res.json());

  const firstSheet = sheets.data?.[0];

  if (!firstSheet?.sheetId && !firstSheet?.id) {
    throw new Error('当前项目下没有可用数据表');
  }

  const sheetId = firstSheet.sheetId || firstSheet.id;

  const rows = await fetchSheetRows(
    token,
    teamId,
    firstProject.id,
    sheetId
  );

  return {
    project: firstProject,
    sheet: firstSheet,
    rows: rows.data,
  };
}
```

最小排查顺序：

- 401：先查 token 是否过期，是否需要 refresh / retry
- 403：先查当前用户是否属于目标团队/项目
- 404：先查 `teamId/projectId/sheetId` 是否串了上下文

CLI 预检：

```bash
dimens-cli project list --team-id TEAM1
dimens-cli sheet list --project-id PROJ1
dimens-cli row page --team-id TEAM1 --project-id PROJ1 --sheet-id SHEET1
```

## 10. 真实场景：浏览器端只读报表组件数据，不创建报表

适用场景：

- 用户说“前端页面只想读报表数据，不负责新建报表”
- 已知 `projectId / reportId / widgetId`

```ts
export async function fetchReportWidget(
  token: string,
  projectId: string,
  reportId: string,
  widgetId: string
) {
  const response = await fetch(
    `https://dimens.bintelai.com/api/app/report/query/${projectId}/widget`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportId,
        widgetId,
      }),
    }
  );

  return response.json();
}
```

判断顺序：

- 401：token 失效，走 refresh / retry
- 403：当前用户没有项目或报表权限
- 404：`projectId/reportId/widgetId` 不匹配，或资源已被移动/删除
