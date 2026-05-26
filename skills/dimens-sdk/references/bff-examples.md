# BFF / 服务端接入案例

## 1. Node.js 初始化统一 SDK 实例

```ts
import { createSDK } from '@bintel/dimens-cli';

export function createDimensService(token: string) {
  return createSDK({
    baseUrl: process.env.DIMENS_BASE_URL || 'https://dimens.bintelai.com/api',
    token,
  });
}
```

适用场景：

- Express
- NestJS
- Next.js Route Handler
- Serverless Function

BFF 侧安全边界：

- `apiSecret` 只允许保存在服务端环境变量或密钥系统
- 前端只拿 BFF 返回的短期 token 或业务数据
- 日志里不要打印完整 token、refreshToken、apiSecret
- 所有业务函数都显式接收 `teamId/projectId`，不要把团队或项目写死在单例里

## 2. BFF 代理项目查询

```ts
export async function getCurrentUser(token: string) {
  const sdk = createDimensService(token);
  return sdk.user.me();
}
```

说明：

- `sdk.user.me()` 和 `sdk.auth.me()` 都读取 `GET /app/user/info/person`。
- 登录返回的 `userInfo` 适合保存登录态快照；进入页面或做权限判断前，建议回查一次当前用户信息。

## 3. BFF 代理团队详情与成员列表

```ts
export async function getTeamContext(token: string, teamId: string, keyword?: string) {
  const sdk = createDimensService(token);

  const [team, members] = await Promise.all([
    sdk.team.info(teamId),
    sdk.team.members(teamId, { keyword }),
  ]);

  return {
    team: team.data,
    members: members.data,
  };
}
```

说明：

- `sdk.team.info(teamId)` 读取 `/app/org/:teamId/team/info`。
- `sdk.team.members(teamId, query?)` 读取 `/app/org/:teamId/team_user/list`，可传 `projectId` 收敛到项目成员范围。
- 不要用团队名替代 `teamId`；缺 ID 时先通过宿主上下文、URL 或 CLI profile 明确。

## 4. BFF 代理项目查询

```ts
export async function listProjects(token: string, teamId: string, keyword?: string) {
  const sdk = createDimensService(token);

  return sdk.project.page(teamId, {
    page: 1,
    size: 20,
    keyword,
  });
}
```

## 5. BFF 创建项目并初始化第一张表

```ts
export async function bootstrapProject(token: string, teamId: string) {
  const sdk = createDimensService(token);

  const project = await sdk.project.create(teamId, {
    name: '巡检项目',
    description: '用于现场巡检',
    projectType: 'spreadsheet',
  });

  const projectId = project.data.id;

  const sheet = await sdk.sheet.create(projectId, {
    name: '巡检记录',
  });

  return {
    projectId,
    sheetId: sheet.data.id,
  };
}
```

## 6. BFF 查询表格结构并补字段

```ts
export async function ensureCoreColumns(
  token: string,
  teamId: string,
  projectId: string,
  sheetId: string
) {
  const sdk = createDimensService(token);

  const columns = await sdk.column.list(teamId, projectId, sheetId);

  if (!columns.data.find((item) => item.label === '巡检结果')) {
    await sdk.column.create(teamId, projectId, sheetId, {
      label: '巡检结果',
      type: 'text',
    });
  }
}
```

## 7. BFF 分页读取行数据并做二次转换

```ts
export async function getSheetRows(
  token: string,
  teamId: string,
  projectId: string,
  sheetId: string
) {
  const sdk = createDimensService(token);

  const result = await sdk.row.page(teamId, projectId, sheetId, {
    page: 1,
    size: 20,
  });

  return result.data.list.map((item) => ({
    id: item.id,
    raw: item,
  }));
}
```

## 8. BFF 更新单元格并处理版本冲突

```ts
export async function updateStatus(
  token: string,
  teamId: string,
  projectId: string,
  sheetId: string,
  rowId: string,
  fieldId: string,
  value: string
) {
  const sdk = createDimensService(token);
  const rowInfo = await sdk.row.info(teamId, projectId, sheetId, rowId);

  return sdk.row.updateCell(sheetId, {
    rowId,
    fieldId,
    value,
    version: Number(rowInfo.data.version),
  });
}
```

## 9. BFF 文档富文本更新

```ts
export async function updateDocumentWeeklyReport(
  token: string,
  teamId: string,
  projectId: string,
  documentId: string,
  html: string
) {
  const sdk = createDimensService(token);
  const doc = await sdk.document.info(teamId, projectId, documentId);

  return sdk.document.update(teamId, projectId, {
    documentId,
    content: html,
    version: Number(doc.data.version),
    createVersion: true,
    changeSummary: 'BFF 更新周报',
  });
}
```

## 10. BFF 上传文件后返回 URL 给前端

```ts
export async function uploadAttachment(token: string, filePath: string) {
  const sdk = createDimensService(token);
  const upload = await sdk.upload.uploadFile(filePath, {
    bizType: 'document',
  });

  return {
    url: upload.data.url,
    key: upload.data.key,
  };
}
```

## 11. BFF 创建报表并预览数据

```ts
export async function createSalesReport(token: string, projectId: string) {
  const sdk = createDimensService(token);

  const report = await sdk.report.createProjectReport(projectId, {
    name: '销售汇总',
    description: '销售核心指标看板',
  });

  await sdk.report.preview(projectId, {
    dataSource: {
      type: 'sheet',
      sheetId: 'SHEET1',
    },
  });

  return report.data;
}
```

注意：当前新建项目报表走项目菜单 `sheet/create type=report` 链路，SDK 会把服务端返回的 `sheetId` 兼容成 `reportId`。不要在 BFF 新建报表时继续调用旧 `sdk.report.create()` 并期待后端直接返回 `data.reportId`。

## 12. BFF 调用 AI 聊天兼容接口

```ts
export async function summarizeByAi(token: string, teamId: string, content: string) {
  const sdk = createDimensService(token);

  return sdk.ai.completions(teamId, {
    model: 'team-default',
    messages: [
      {
        role: 'user',
        content: `请帮我总结以下内容：${content}`,
      },
    ],
  });
}
```

## 13. BFF 高风险误区

- 不要把 `teamId/projectId` 偷偷写死在单例里导致跨团队串数据
- 不要把登录响应里的 `userInfo` 当成长期有效的当前用户详情；需要最新数据时用 `sdk.user.me()`
- 不要只用 `auth use-team` 判断团队真实存在；需要团队详情时用 `sdk.team.info()` 或 `dimens-cli team info`
- 不要把项目接口和表格接口当成同一路径模板
- 不要在 SDK 返回失败时只把原始错误直接透传给前端
- 不要在更新行和文档时忽略版本号
- 不要把 AI 聊天接口误当成工作流全量管理接口
- 不要把服务端持有的 `apiSecret` 返回给浏览器或 App
