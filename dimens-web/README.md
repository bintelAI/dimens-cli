# dimens-web

`dimens-web` 是维表自定义前端项目的基础脚手架。它面向两种运行方式：

- 普通 CDN 访问：构建后的 `dist/` 可以直接上传到任意 CDN 子目录，通过 Hash 路由访问。
- Wujie 微前端嵌入：由维表主应用传入运行上下文、权限、token 和初始路由。

## 技术栈

- React 19
- Vite
- TypeScript
- Tailwind CSS 3
- Zustand
- lucide-react
- react-router-dom Hash Router

## 本地启动

```bash
cd /Users/lixiang/data/代码库管理/binterAi/多维项目开发/dimens-cli/dimens-web
pnpm install
pnpm run dev
```

默认端口是 `3100`。如果项目已经在热加载运行，不需要重复启动新的端口。

## CDN 部署

```bash
pnpm run build
```

把 `dist/` 下所有文件上传到 CDN 同一目录即可。Vite 配置使用 `base: './'`，所以资源路径是相对路径，不依赖固定域名或根路径。

可访问：

```text
https://cdn.example.com/dimens-web/index.html#/
https://cdn.example.com/dimens-web/index.html#/records
https://cdn.example.com/dimens-web/index.html#/view-context
https://cdn.example.com/dimens-web/index.html#/button-context
https://cdn.example.com/dimens-web/index.html#/settings
https://cdn.example.com/dimens-web/index.html#/embed
https://cdn.example.com/dimens-web/index.html#/debug/context
```

CDN 不需要配置 SPA fallback，因为路由使用 Hash Router。

## Wujie 入口

宿主可使用以下 URL 作为子应用入口：

```text
https://cdn.example.com/dimens-web/index.html
https://cdn.example.com/dimens-web/index.html#/records
```

### 页面微模块 props

页面型微模块从项目菜单打开，`sourceLocation` 固定为 `PROJECT_MENU`。

```ts
{
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  token: 'user-token',
  refreshToken: 'refresh-token',
  instanceId: 'mmi_customer',
  moduleCode: 'customer-module',
  sourceLocation: 'PROJECT_MENU',
  sheetId: 'SHEET1',
  initialRoute: '/records',
  permissions: {
    visible: true,
    editable: true,
    canConfigure: true,
    canReadData: true,
    canWriteData: false
  },
  appConfig: {
    appName: '客户管理',
    defaultRoute: '/records',
    defaultSheetId: 'SHEET1'
  }
}
```

### 视图微模块 props

视图型微模块从多维表格视图标签打开，`sourceLocation` 固定为 `SHEET_VIEW`。宿主传入的 `displayRows` 是当前视图轻量快照，不承诺全量数据。

```ts
{
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  token: 'user-token',
  instanceId: 'mmi_view_customer',
  moduleCode: 'customer-view',
  sourceLocation: 'SHEET_VIEW',
  sourceId: 'VIEW1',
  sheetId: 'SHEET1',
  viewId: 'VIEW1',
  initialRoute: '/view-context',
  viewState: {
    viewId: 'VIEW1',
    viewType: 'plugin',
    filters: [],
    filterMatchType: 'and',
    sortRule: null,
    groupBy: [],
    hiddenColumnIds: [],
    selectedRowIds: ['ROW1'],
    displayRows: [{ rowId: 'ROW1', title: '客户 A' }],
    displayState: { source: 'filtered', lastUpdatedAt: Date.now() }
  },
  permissions: {
    visible: true,
    editable: true,
    canConfigure: true,
    canReadData: true,
    canWriteData: true
  },
  instanceConfig: {
    fieldMapping: {
      titleColumnId: 'fld_title'
    }
  }
}
```

### 按钮微模块 props

按钮型微模块从行按钮或单元格按钮打开，默认使用 `ROW_BUTTON_MODAL`。宿主传入的 `rowSnapshot` 是点击时轻量快照，微模块需要最新数据时应通过 SDK 按 `sheetId/rowId` 重新拉取。

```ts
{
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  token: 'user-token',
  instanceId: 'mmi_button_customer',
  moduleCode: 'customer-action',
  sourceLocation: 'ROW_BUTTON_MODAL',
  sourceId: 'ROW1',
  sheetId: 'SHEET1',
  viewId: 'VIEW1',
  rowId: 'ROW1',
  columnId: 'fld_action',
  initialRoute: '/button-context',
  actionSnapshot: {
    trigger: { type: 'button', id: 'fld_action', label: '处理客户' },
    sheetId: 'SHEET1',
    viewId: 'VIEW1',
    rowId: 'ROW1',
    columnId: 'fld_action',
    fieldId: 'fld_action',
    recordIds: ['ROW1'],
    selectedRowIds: ['ROW1'],
    rowSnapshot: { rowId: 'ROW1', title: '客户 A' }
  },
  permissions: {
    visible: true,
    editable: false,
    canConfigure: false,
    canReadData: true,
    canWriteData: false
  },
  instanceConfig: {
    actionName: '处理客户'
  }
}
```

快照只用于首屏展示和交互上下文，不是权威数据源。任何写入、最新数据读取和权限裁决都必须走维表 SDK/API，由后端完成最终校验。

## Token 获取机制

脚手架对齐 `dimens-cli auth` 的主链路：

- `auth login`：用户名密码登录，对应 `POST /login`
- `auth api-key-login`：API Key 换 token，对应 `POST /open/user/login/apiKey`
- `auth refresh`：刷新 token，对应 `GET /refreshToken`
- `auth status/use-team/use-project`：通过本地开发配置模拟上下文查看与切换

浏览器生产模式不要保存 `apiSecret`。如果必须用 API Key / Secret 换 token，应放在宿主后端或 BFF 执行，再把短期 token 传给 `dimens-web`。

本地开发可以先用 CLI 获取上下文：

```bash
dimens-cli auth api-key-login --api-key ak_xxx --api-secret sk_xxx
dimens-cli auth use-team TEAM1
dimens-cli auth use-project PROJ1
dimens-cli auth status --output json
```

然后把 `baseUrl/teamId/projectId/token/refreshToken` 填到 `/#/settings`。

## 配置来源优先级

运行上下文：

1. Wujie props
2. Wujie Bridge 事件
3. URL query / hash query
4. localStorage 开发配置
5. `.env`

应用配置：

1. Wujie props `appConfig`
2. URL `configUrl` 指向的 JSON
3. localStorage 开发配置
4. `.env`
5. 内置默认值

`configUrl` 适合 CDN 场景，但只放非敏感配置，不要放 token、refreshToken、apiSecret。

## Dimens 调用方式

页面中使用：

```ts
const dimens = useDimens();

const sheets = await dimens.sheet.list();
const rows = await dimens.row.page(sheetId, { page: 1, size: 50 });
```

非 React Hook 场景使用：

```ts
const dimens = createDimensAppSdk({
  baseUrl: '/api',
  token,
  refreshToken,
  teamId,
  projectId,
});

await dimens.project.list({ page: 1, size: 20 });
await dimens.sheet.list();
await dimens.row.page(sheetId, { page: 1, size: 50 });
```

页面组件不要直接拼 `/app/...` 路径，不要直接读取 localStorage token，不要重复传 `teamId/projectId`。

## 验证

```bash
pnpm run typecheck
pnpm run test
pnpm run build
```
