# 自定义页面脚手架开发说明

## 1. 使用场景

当用户提到下面诉求时，系统总控应进入本说明：

- 用 SDK 开发一个维表自定义页面。
- 基于 `dimens-web` 脚手架新增业务页面。
- 把自定义页面嵌入维表主应用、项目菜单、表视图、行按钮或弹窗。
- 页面需要读取维表项目、表、行、文档、报表或 AI 能力。
- 需要说明自定义页面如何本地开发、部署到 CDN、由 Wujie 微前端承载。

如果用户只是要用 CLI 创建项目、建表、改字段、导数据、配置权限、报表或画布，不进入本说明，继续走 `references/command-mapping.md` 和 `dimens-manager` 对应章节。

## 2. 两条主线分工

| 方向 | 入口 | 适用任务 |
| --- | --- | --- |
| CLI 操作维表 | `references/command-mapping.md`、`dimens-manager/references/*/overview.md` | 认证、团队、项目、表、字段、行、权限、工作流、报表、画布等资源操作 |
| SDK 自定义页面开发 | `references/custom-page-scaffold.md`、`dimens-cli/dimens-web` | React 自定义页面、Wujie 嵌入、运行上下文、token 透传、页面内读取数据 |

总控输出时要先判断用户要的是“操作资源”还是“开发页面”。页面开发可以引用 CLI 作为初始化和验收工具，但页面代码本身应通过 SDK 和脚手架完成。

## 3. 脚手架定位

脚手架路径：

```text
dimens-cli/dimens-web
```

`dimens-web` 是维表自定义前端项目基础脚手架，支持两种运行方式：

1. 普通 CDN 访问：构建后的 `dist/` 上传到 CDN 子目录，通过 Hash Router 访问。
2. Wujie 微前端嵌入：维表宿主传入运行上下文、权限、token、初始路由和业务配置。

技术栈：

- React 19
- Vite
- TypeScript
- Tailwind CSS 3
- Zustand
- lucide-react
- react-router-dom Hash Router

## 4. 开发前确认项

开始写自定义页面前，先确认这些输入：

| 输入 | 说明 |
| --- | --- |
| 页面定位 | 是项目菜单页、表视图页、行按钮弹窗、单元格按钮弹窗、视图工具栏弹窗，还是自定义入口 |
| 数据来源 | 需要读取哪个 `projectId / sheetId / viewId / rowId / selectedRowIds` |
| 权限边界 | 是否只读、可编辑、可配置，是否允许写行数据 |
| 宿主运行方式 | CDN 独立访问，还是 Wujie 嵌入 |
| 初始路由 | 默认进入 `/`、`/custom`、`/records` 或新增路由 |
| 配置来源 | 使用宿主 `appConfig`、URL `configUrl`、本地开发配置，还是 `.env` |
| 设计要求 | 是否需要调用 `ui-ux-pro-max-plus` 确定 UI 风格、配色、图表、布局密度和关键 UX 模式 |

如果缺少 `teamId / projectId / token`，页面可以启动，但真实接口调用会失败。真实执行前仍然需要先通过 CLI 或宿主后端完成登录态准备。

## 5. 脚手架目录决策

新增或改造自定义页面前，先判断页面目录，不要默认覆盖已有工程：

| 用户输入 | 默认处理 |
| --- | --- |
| 已指定已有目录 | 进入目录，检查 `package.json / src / vite.config.ts`，确认是否为 `dimens-web` 或兼容脚手架；不要重新执行创建命令 |
| 已指定新目录 | 使用 `dimens-cli create --dir <目录名>` 初始化，再进入该目录开发 |
| 只说“新增自定义页面”但没给目录 | 先询问是否新建自定义页面目录；推荐目录名可按业务命名，如 `customer-page`、`approval-page` |
| 目标目录存在且非空 | 让 CLI 交互确认覆盖；确认后旧内容迁移到同级 `backupDel/<目录名>-<时间戳>/`，不会直接删除 |

推荐初始化命令：

```bash
dimens-cli create --dir
dimens-cli create --dir ./my-custom-page
dimens-cli create --dir=./my-custom-page
```

命令规则：

- `create --dir` 会下载 `https://imgs.bintelai.com/dimens-web.zip` 并解压成自定义页面脚手架。
- 未传目录值时，CLI 会交互询问目录名，默认推荐 `dimens-web`。
- 目标目录已存在且非空时，CLI 会询问是否覆盖；确认后旧内容迁移到同级 `backupDel/<目录名>-<时间戳>/`，不会直接删除。
- 下载失败直接失败并提示检查网络，不使用本地兜底。
- 如果用户明确是在已有脚手架里新增页面，不要再次执行 `create --dir`，直接修改现有 `src/pages`、`src/router/routes.tsx` 和相关 SDK resource。

## 6. 本地开发

```bash
cd <自定义页面目录>
pnpm install
```

需要启动且当前没有热加载进程时，才执行：

```bash
pnpm run dev
```

默认端口是 `3100`。如果项目已经热加载运行，不要重复启动新端口。

本地开发可先用 CLI 获取上下文：

```bash
dimens-cli auth api-key-login --api-key ak_xxx --api-secret sk_xxx
dimens-cli auth use-team TEAM_ID
dimens-cli auth use-project PROJECT_ID
dimens-cli auth status --output json
```

然后把 `baseUrl / teamId / projectId / token / refreshToken / sheetId` 填到开发页 `/#/settings`，或者通过 URL query/hash query 传入。

浏览器生产模式不要保存 `apiSecret`。如果需要 API Key / Secret 换 token，应放在宿主后端或 BFF 执行，再把短期 token 传给页面。

## 7. 目录结构

常用文件：

| 文件 | 用途 |
| --- | --- |
| `src/pages/CustomPage.tsx` | 默认自定义业务页面，占位内容从这里替换 |
| `src/pages/RecordsPage.tsx` | 读取表和行数据的示例页面 |
| `src/router/routes.tsx` | Hash 路由注册，生产构建默认只暴露首页和 `/custom` |
| `src/router/navigation.ts` | 宿主感知的路由跳转与路由变更通知 |
| `src/lib/dimens/useDimens.ts` | React 页面内获取 SDK |
| `src/lib/dimens/appSdk.ts` | SDK 资源聚合入口 |
| `src/lib/dimens/client.ts` | fetch 封装、token header、业务错误处理 |
| `src/runtime/resolveRuntimeContext.ts` | 运行上下文解析与合并 |
| `src/types/micro-module.ts` | 宿主 props、权限、动作快照、运行上下文类型 |
| `src/config/appConfig.ts` | 应用配置默认值、远程配置、本地配置合并 |
| `src/bridge/wujieBridge.ts` | Wujie props、事件、toast、token 过期通知 |

单文件超过 700 行时优先拆分组件、hooks、数据适配器或展示组件；不要把所有业务逻辑堆进 `CustomPage.tsx`。

## 8. UI/UX 设计协同

自定义页面不仅是接接口，还要保证页面能被业务用户高频使用。遇到下面情况时，先关联 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`）做设计判断，再写 `dimens-web` 页面代码：

- 用户要求页面“好看、专业、现代、像 SaaS、像管理后台、看板、驾驶舱、数据大屏、移动端适配”。
- 页面包含指标卡、表格、筛选器、图表、时间线、审批流、客户画像、资产列表、工单队列等需要信息架构设计的内容。
- 需要选择配色、字体层级、图表类型、组件形态、空状态、加载态、错误态或响应式布局。
- 需要从业务场景判断页面密度：运营后台优先紧凑高效，展示页可以更强调视觉层次。

协同顺序：

1. 先明确业务用户、核心任务、数据主次和页面入口。
2. 用 `ui-ux-pro-max-plus` 选择 UI 风格、配色、图表类型、组件布局和 UX 模式。
3. 回到 `dimens-web` 脚手架实现：复用 Tailwind、lucide-react、`StateView`、`KeyValueGrid`、`AppShell` 和现有 SDK。
4. 设计方案要服务于业务效率，不要为了视觉效果引入大段无关动画、装饰图形或新的 UI 框架。

输出页面实现方案时，至少包含：

| 项 | 内容 |
| --- | --- |
| 设计技能 | 标明已按 `ui-ux-pro-max-plus` 的 UI/UX 资源做风格和布局决策 |
| 页面风格 | 例如企业 SaaS、运营看板、审批工作台、客户跟进台等 |
| 布局结构 | 顶部摘要、筛选区、主数据区、详情侧栏、空状态和错误态 |
| 视觉约束 | 主色、中性色、状态色、密度、圆角、图表类型 |
| 落地文件 | 需要新增或修改的 `src/pages`、`src/router/routes.tsx`、resource 或组件文件 |

## 9. 自定义页面路由边界

在已有 `dimens-web` 脚手架里新增业务页面时，路由必须保持隔离，避免影响首页、内置示例页和测试页：

- 不要改动根路由 `/` 的页面含义；`/` 默认保留给概览页或宿主默认入口。
- 不要覆盖或重命名现有示例/调试路由：`/custom`、`/records`、`/settings`、`/embed`、`/debug/context`。
- 新业务页面使用独立直达路由，例如 `/customer`、`/approval`、`/report-board`，CDN 访问形式是 `index.html#/customer`。
- 只在 `src/router/routes.tsx` 里新增一条业务路由，并新建对应 `src/pages/<BusinessPage>.tsx`；不要为了新增页面重写路由结构、删除现有路由或改 `AppShell` 的基础布局。
- 如果生产环境需要访问该业务页，必须把新增路由同步加入 `import.meta.env.PROD` 分支；开发环境示例页仍保留。
- 如果需要导航入口，只追加新的导航项或由宿主菜单直达该路由；不要把原有“概览 / 自定义页面 / 数据 / 设置 / 调试”等入口改成业务页。

推荐模式：

```tsx
// src/router/routes.tsx
{ path: 'customer', element: <CustomerPage /> }
```

对应访问：

```text
https://cdn.example.com/dimens-web/index.html#/customer
```

## 10. 运行上下文

脚手架会合并多种运行上下文。下面按“高优先级覆盖低优先级”的顺序说明。

Wujie 环境优先级：

1. Wujie props
2. localStorage 开发配置
3. URL query / hash query
4. `.env`

非 Wujie 环境优先级：

1. 显式传入的 host patch
2. URL query / hash query
3. localStorage 开发配置
4. `.env`

最终解析为 `ResolvedRuntimeContext`，关键字段包括：

| 字段 | 说明 |
| --- | --- |
| `baseUrl` | API 根路径，默认 `/api` |
| `teamId` | 团队 ID |
| `projectId` | 项目 ID |
| `token` / `refreshToken` | 宿主或开发配置传入的登录态 |
| `instanceId` | 页面实例 ID |
| `moduleCode` | 模块编码 |
| `sourceLocation` | 页面来源：`PROJECT_MENU`、`SHEET_VIEW`、`ROW_BUTTON_MODAL`、`CELL_BUTTON_MODAL`、`VIEW_TOOLBAR_MODAL`、`CUSTOM` |
| `sheetId / viewId / rowId / columnId` | 当前资源上下文 |
| `selectedRowIds` | 当前选中行 |
| `permissions` | 可见、可编辑、可配置、可读写数据等权限 |
| `initialRoute` | 宿主指定的初始路由 |

页面代码不要直接读取 localStorage token，不要手动拼接 `teamId/projectId` 到每个接口。优先使用 `useRuntimeStore` 读取上下文，用 `useDimens()` 访问维表资源。

## 11. 宿主 props 示例

Wujie 宿主传入 props 时，建议保持下面结构：

```ts
{
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  token: 'user-token',
  refreshToken: 'refresh-token',
  userId: 'USER1',
  userName: '张三',
  instanceId: 'mmi_customer',
  moduleCode: 'customer-module',
  sourceLocation: 'PROJECT_MENU',
  sourceId: 'menu_customer',
  sheetId: 'SHEET1',
  viewId: 'VIEW1',
  initialRoute: '/custom',
  permissions: {
    visible: true,
    editable: true,
    canConfigure: true,
    canReadData: true,
    canWriteData: false
  },
  appConfig: {
    appName: '客户管理',
    moduleCode: 'customer-module',
    defaultRoute: '/custom',
    defaultSheetId: 'SHEET1',
    features: {
      records: true,
      settings: false,
      debug: false
    },
    theme: {
      primaryColor: '#b86e3c',
      density: 'comfortable'
    }
  }
}
```

如果是行按钮或单元格按钮入口，可补充 `actionSnapshot`：

```ts
{
  actionSnapshot: {
    trigger: { type: 'row', id: 'btn_follow', label: '跟进' },
    sheetId: 'SHEET1',
    viewId: 'VIEW1',
    rowId: 'ROW1',
    selectedRowIds: ['ROW1']
  }
}
```

## 12. SDK 调用方式

React 页面内使用：

```ts
import { useDimens } from '@/lib/dimens/useDimens';

const dimens = useDimens();

const sheets = await dimens.sheet.list();
const rows = await dimens.row.page(sheetId, { page: 1, size: 50 });
```

非 React Hook 场景使用：

```ts
import { createDimensAppSdk } from '@/lib/dimens/appSdk';

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

当前脚手架聚合的资源：

| 资源 | 能力 |
| --- | --- |
| `project` | 项目列表、项目详情 |
| `sheet` | 表列表、表树、表详情 |
| `row` | 行分页、行详情 |
| `document` | 文档详情、按菜单资源 ID 获取文档 |
| `report` | 报表列表、报表详情 |
| `ai` | AI completions |

`createRetryableDimensAppSdk` 会在 token 失效时按脚手架的重试机制刷新登录态。页面内优先用 `useDimens()`，避免自己重复写刷新逻辑。

## 13. 新增自定义页面流程

推荐执行顺序：

1. 确认目标目录；没有目录时先走 `dimens-cli create --dir <目录名>`。
2. 涉及页面设计时，先用 `ui-ux-pro-max-plus` 确认 UI 风格、配色、组件布局、图表类型和 UX 状态。
3. 在 `src/pages` 新建或改造业务页面组件。
4. 在 `src/router/routes.tsx` 注册独立业务路由，例如 `/customer`；不要改 `/` 根页面，不要覆盖 `/custom`、`/records`、`/settings`、`/embed`、`/debug/context` 等既有示例或测试路由；生产构建需要访问的路由要加入 `PROD` 分支。
5. 在页面内通过 `useRuntimeStore` 读取上下文和权限。
6. 通过 `useDimens()` 读取项目、表、行、文档、报表或 AI 数据。
7. 按 `permissions.canReadData / canWriteData / editable / canConfigure` 控制按钮和请求。
8. 使用 `StateView` 呈现缺上下文、无权限、空数据、加载失败等状态。
9. 如需通知宿主，使用 `toastHost`、`notifyRouteChange`、`requestRuntimeRefresh`，不要直接假设宿主实现。
10. 本地验证通过后再构建并部署。

示例骨架：

```tsx
import { useEffect, useState } from 'react';
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function CustomerPage() {
  const dimens = useDimens();
  const context = useRuntimeStore(state => state.context);
  const [rows, setRows] = useState<unknown>();
  const [error, setError] = useState<string>();

  const sheetId = context.sheetId;
  const canRead = context.permissions.canReadData !== false;

  useEffect(() => {
    if (!sheetId || !canRead) return;
    let active = true;
    dimens.row.page(sheetId, { page: 1, size: 50 })
      .then(response => {
        if (active) setRows(response.data);
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      active = false;
    };
  }, [canRead, dimens, sheetId]);

  if (!sheetId) {
    return <StateView title="缺少数据表上下文" description="请由宿主传入 sheetId，或在开发配置中指定默认数据表。" />;
  }

  if (!canRead) {
    return <StateView title="当前无读取权限" description="permissions.canReadData 为 false。" />;
  }

  if (error) {
    return <StateView title="读取失败" description={error} />;
  }

  return (
    <pre className="overflow-auto text-xs">
      {rows ? JSON.stringify(rows, null, 2) : '正在读取数据...'}
    </pre>
  );
}
```

## 14. 配置与部署

应用配置优先级：

1. Wujie props `appConfig`
2. URL `configUrl` 指向的 JSON
3. localStorage 开发配置
4. `.env`
5. 内置默认值

`configUrl` 只放非敏感配置，不要放 token、refreshToken、apiSecret。

构建：

```bash
pnpm run build
```

部署时把 `dist/` 下所有文件上传到 CDN 同一目录。Vite 使用 `base: './'`，资源路径不依赖固定域名或根路径。

可访问示例：

```text
https://cdn.example.com/dimens-web/index.html#/
https://cdn.example.com/dimens-web/index.html#/custom
```

CDN 不需要配置 SPA fallback，因为路由使用 Hash Router。

## 15. 验收清单

交付自定义页面前至少验证：

| 验收项 | 验证方式 |
| --- | --- |
| 类型检查 | `pnpm run typecheck` |
| 单测 | `pnpm run test` |
| 构建 | `pnpm run build` |
| 本地运行 | 已存在热加载进程时直接访问，不重复启动端口 |
| 上下文 | 页面能展示或使用 `teamId / projectId / sheetId` |
| 权限 | 无读写权限时不会发起越权写入，按钮禁用或隐藏 |
| 设计 | 已按 `ui-ux-pro-max-plus` 明确风格、配色、布局、图表和 UX 状态 |
| Token | token 失效能触发刷新或通知宿主 |
| Wujie 嵌入 | 宿主 props 能覆盖本地配置，路由变化能通知宿主 |
| CDN 访问 | Hash 路由可直接打开，不依赖 SPA fallback |
| 路由隔离 | 新业务页通过 `/xxx` 直达，`/`、`/custom` 和开发测试路由仍可访问 |

## 16. 常见错误

| 错误 | 修正 |
| --- | --- |
| 没有确认目录就开始写自定义页面 | 先判断已有目录；没有目录时询问并推荐 `dimens-cli create --dir <目录名>` |
| 在已有脚手架目录里重复执行 `create --dir` | 直接修改现有页面、路由和 resource，避免覆盖工程 |
| 不做设计判断就堆页面组件 | 先用 `ui-ux-pro-max-plus` 确定 UI 风格、配色、布局密度、图表和 UX 模式 |
| 新增业务页时直接改 `/` 或覆盖 `/custom` 示例页 | 保留根页和既有示例/测试路由，新页面使用 `/xxx` 独立路由 |
| 下载失败后改用本地 zip 兜底 | 直接失败并提示检查网络或稍后重试，远程 zip 是权威来源 |
| 页面里手写 `/app/...` 接口路径 | 使用 `useDimens()` 或 `createDimensAppSdk()` |
| 在浏览器保存 `apiSecret` | API Key 换 token 放到后端或 BFF，页面只接收短期 token |
| 每个请求都手动传 `teamId/projectId` | SDK 已从上下文绑定，页面只传业务资源 ID |
| 生产构建后访问不到新增路由 | 检查 `routes.tsx` 的 `PROD` 分支是否注册 |
| 独立 CDN 页面刷新 404 | 使用 `index.html#/route` 访问，不依赖 history fallback |
| 无权限时仍显示写入按钮 | 用 `permissions.canWriteData / editable / canConfigure` 控制 |
| 开发中重复启动多个端口 | 如果热加载进程已存在，直接复用已有端口 |
| 把 SDK 页面开发和资源创建混在一起 | 资源初始化走 CLI/manager，页面读取和展示走 SDK/脚手架 |
