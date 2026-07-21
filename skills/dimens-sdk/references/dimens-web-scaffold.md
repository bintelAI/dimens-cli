# dimens-web 脚手架接入说明

## 1. 适用场景

当用户的问题是下面这些类型时，`dimens-sdk` 的前端回答应优先基于 `dimens-cli/dimens-web` 脚手架，而不是重新生成一套通用 React/Vue SDK 封装：

- 开发维表自定义页面。
- 页面要嵌入维表主应用、项目菜单、表视图、行按钮、单元格按钮或工具栏弹窗。
- 页面需要从宿主接收 `teamId / projectId / sheetId / viewId / rowId / token / permissions`。
- 页面需要使用 Wujie 微前端、CDN Hash 路由或宿主 props。
- 用户明确提到 `dimens-web`、脚手架、自定义页面、微前端、Wujie。

如果用户进一步提到“页面、按钮、视图三类微模块”、`sourceLocation`、`viewState`、`actionSnapshot`、按钮弹窗、抽屉、Wujie props 或宿主传参，必须继续读取 `references/micro-module-wujie-context.md`。该文件保存三类微模块的完整 demo props、快照策略和按钮兜底匹配规则。

如果用户是在已有业务前端、移动端、BFF 或 Node.js 服务中直接接 HTTP / SDK，不强行迁移到 `dimens-web`；继续使用对应 overview 和示例。

## 1.1 UI/UX 前置要求

所有 `dimens-web` 自定义页面开发都必须先做 UI/UX 设计，不要等用户明确说“好看、专业、看板”才触发。

执行顺序：

1. 先确认当前运行环境是否已安装 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`）。
2. 未安装时，先安装 UI Ux Pro Max 技能；已安装或可用时，直接使用该技能。
3. 用 `ui-ux-pro-max` 明确目标用户、页面任务、信息架构、布局密度、主色/中性色/状态色、组件形态、图表类型、加载态、空状态、错误态和响应式策略。
4. 设计口径明确后，再进入 `dimens-web` 脚手架目录判断、路由设计、SDK resource 调用和页面编码。

输出或实现前至少给出：

| 项 | 要求 |
| --- | --- |
| UI/UX 技能状态 | 已安装 / 已可用 / 需要先安装 |
| 页面定位 | 工作台、操作台、审批详情、数据看板、客户画像等 |
| 信息架构 | 页面区域、主次层级、筛选和操作入口 |
| 视觉规范 | 色彩、密度、圆角、字体层级、状态色 |
| 组件策略 | 表格、卡片、图表、详情面板、抽屉、弹窗、批量操作 |
| 状态设计 | loading、empty、error、no permission、readonly、success |
| 实现落点 | `src/pages`、`src/router/routes.tsx`、组件或 resource 文件 |

## 2. 与通用前端接入的区别

| 场景 | 推荐处理 |
| --- | --- |
| `dimens-web` 自定义页面 | 使用脚手架已有 `useDimens()`、`createRetryableDimensAppSdk()`、`useRuntimeStore`、`resolveRuntimeContext()` |
| 普通 React/Vue 项目 | 可参考 `frontend-auth-flow.md`、`react-auth-example.md` 自己封装 auth、storage、SDK、retry |
| BFF 下发短期 token | 前端只消费 token；API Key / Secret 留在 BFF |
| Node.js/服务端脚本 | 使用 `@bintel/dimens-cli` SDK 或 CLI 命令 |

核心判断：

- 如果是“自定义页面开发”，不要让用户新建 `dimens-storage.ts / dimens-auth.ts / dimens-sdk.ts / dimens-request.ts`。
- 如果是“已有前端项目接接口”，可以按通用分层文档落地。

## 3. 脚手架路径

```text
dimens-cli/dimens-web
```

关键文件：

| 文件 | 作用 |
| --- | --- |
| `src/lib/dimens/useDimens.ts` | React 页面内获取维表 SDK |
| `src/lib/dimens/appSdk.ts` | 聚合 project、sheet、row、document、report、ai 资源 |
| `src/lib/dimens/client.ts` | fetch 封装、token header、业务错误识别 |
| `src/lib/dimens/retry.ts` | token 失效后的刷新与重试 |
| `src/runtime/resolveRuntimeContext.ts` | 解析 Wujie props、URL、localStorage、`.env` 上下文 |
| `src/store/runtimeStore.ts` | 保存运行上下文、auth 和 appConfig |
| `src/types/micro-module.ts` | 宿主 props、权限、动作快照、运行上下文类型 |
| `src/bridge/wujieBridge.ts` | 宿主事件、toast、token 过期通知、路由通知 |
| `src/pages/CustomPage.tsx` | 自定义业务页面入口示例 |
| `src/pages/RecordsPage.tsx` | 表和行数据读取示例 |
| `src/router/routes.tsx` | Hash Router 路由注册 |

三类微模块额外关注：

| 文件或能力 | 作用 |
| --- | --- |
| `src/types/micro-module.ts` | `ResolvedRuntimeContext`、`MicroModuleViewState`、`MicroModuleActionSnapshot` 类型 |
| `src/runtime/resolveRuntimeContext.ts` | 合并 Wujie props、URL、localStorage、`.env`，必须返回 `viewState/actionSnapshot` |
| `src/pages/ContextDebugPage.tsx` | 联调时检查上下文，需展示 `viewState/actionSnapshot` |
| `src/pages/EmbedPage.tsx` | 宿主嵌入调试页，需能观察三类入口上下文 |
| `src/lib/dimens/useMicroModuleRuntime.ts` | 建议的入口判断 helper：页面、视图、按钮 |

## 4. UI/UX 设计协同

`dimens-web` 自定义页面开发需要同时关注 SDK 接入和页面体验。所有新增或改造业务页面，都先确认/安装并使用 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`）做设计决策，再落到脚手架代码。

触发场景：

- 用户说要做“好看、专业、现代、SaaS、管理后台、数据看板、驾驶舱、大屏、移动端适配”等页面。
- 页面包含指标卡、表格、筛选、图表、时间线、审批流、详情面板、客户画像、工单队列等复杂信息组织。
- 需要选择配色、字体层级、图表类型、组件形态、空状态、加载态、错误态或响应式布局。

推荐协同流程：

1. 确认 `ui-ux-pro-max-plus` 是否已安装；没有则先安装，已可用则直接调用。
2. 用 `ui-ux-pro-max` 明确目标用户、页面风格、主色/中性色/状态色、布局密度、图表类型和 UX 模式。
3. 回到 `dimens-web`，用 Tailwind、lucide-react、`StateView`、`KeyValueGrid`、`AppShell` 和现有 SDK 资源实现。
4. 不新增重型 UI 框架；除非项目已有依赖，否则优先用脚手架现有技术栈完成。
5. 设计方案要服务于业务效率：多维表自定义页面通常偏工作台、看板、操作台，不要默认做营销式落地页。

输出方案时至少说明：

| 项 | 内容 |
| --- | --- |
| 设计来源 | 已确认/安装并使用 `ui-ux-pro-max-plus` 做 UI/UX 决策 |
| 页面风格 | 企业 SaaS、运营看板、审批工作台、客户跟进台等 |
| 信息结构 | 摘要区、筛选区、主列表/图表、详情区、状态反馈 |
| 视觉约束 | 主色、中性色、状态色、密度、圆角、图表类型 |
| 实现落点 | `src/pages`、`src/router/routes.tsx`、resource 或组件文件 |

## 5. 自定义页面路由边界

在已有 `dimens-web` 脚手架中开发新业务页面时，默认使用独立直达路由，不要影响根页、内置示例页和开发测试页：

- `/` 保留为脚手架概览页或宿主默认入口，不要把新业务页直接挂到根路由。
- `/custom`、`/records`、`/settings`、`/embed`、`/debug/context` 是既有示例、配置或调试路由，不要覆盖、删除或重命名。
- 新页面使用 `/xxx` 形式，例如 `/customer`、`/approval`、`/assets-board`，CDN 访问使用 `index.html#/xxx`。
- 通常只需要在 `src/pages` 新增页面组件，并在 `src/router/routes.tsx` 追加一条路由；不要重写 router、`AppShell` 或现有导航逻辑。
- 生产环境也要访问的新业务页，需要同步加入 `import.meta.env.PROD` 分支；开发测试页继续只在开发分支暴露。
- 如果要展示导航入口，优先追加新导航项或由宿主菜单直达，不要把原有导航项改成业务页。

推荐路由写法：

```tsx
// src/router/routes.tsx
{ path: 'customer', element: <CustomerPage /> }
```

对应访问：

```text
https://cdn.example.com/dimens-web/index.html#/customer
```

## 6. 页面内推荐写法

在脚手架页面中，直接使用已有 Hook 和 store：

```tsx
import { useEffect, useState } from 'react';
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useRuntimeStore } from '@/store/runtimeStore';

export default function CustomDataPage() {
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

注意：

- 页面层不直接拼 `/app/...` 接口路径。
- 页面层不直接读写 token localStorage。
- 页面层不重复传 `teamId/projectId`；SDK 已由运行上下文绑定。
- 读写按钮要受 `permissions.canReadData / canWriteData / editable / canConfigure` 控制。

## 7. 宿主上下文

Wujie 宿主 props 建议结构：

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
    defaultSheetId: 'SHEET1'
  }
}
```

上面的结构是页面型基础示例。三类微模块的完整 props 示例见 `references/micro-module-wujie-context.md`：

| 入口 | 必看章节 |
| --- | --- |
| 项目页面 / 插入页面 | `页面体系` |
| 多维表格视图 | `视图体系` |
| 按钮字段 / 行按钮 / 单元格按钮 | `按钮体系` |

快速判断：

```ts
if (context.sourceLocation === 'PROJECT_MENU') {
  // 页面型：读取 instanceConfig.page，必要时按配置中的 sheetId 主动拉数据。
}

if (context.sourceLocation === 'SHEET_VIEW') {
  // 视图型：优先渲染 context.viewState?.displayRows。
}

if (context.sourceLocation === 'ROW_BUTTON_MODAL' || context.sourceLocation === 'CELL_BUTTON_MODAL') {
  // 按钮型：优先展示 context.actionSnapshot?.rowSnapshot，再按 rowId 重新拉取权威数据。
}
```

运行上下文高优先级覆盖低优先级：

| 运行环境 | 优先级 |
| --- | --- |
| Wujie | Wujie props -> localStorage 开发配置 -> URL query/hash query -> `.env` |
| 非 Wujie | 显式 host patch -> URL query/hash query -> localStorage 开发配置 -> `.env` |

## 8. 资源调用能力

当前脚手架 `createDimensAppSdk()` 聚合：

| 资源 | 能力 |
| --- | --- |
| `project` | `list`、`info` |
| `sheet` | `list`、`tree`、`info` |
| `row` | `page`、`info` |
| `document` | `info`、`getBySheetId` |
| `report` | `list`、`info` |
| `ai` | `completions` |

如果用户要新增脚手架未封装的资源能力，推荐顺序：

1. 先看 `src/lib/dimens/resources/*` 是否已有同类资源。
2. 在对应 resource 文件中补最小方法。
3. 在 `appSdk.ts` 聚合暴露。
4. 为新增方法补单测。
5. 页面通过 `useDimens()` 调用，不绕过 SDK。

## 9. 脚手架目录决策

开始自定义页面开发前，先确认代码落在哪个目录：

| 用户输入 | 推荐处理 |
| --- | --- |
| 指定了已有 `dimens-web` 或兼容目录 | 进入目录，读取 `package.json / src / vite.config.ts`，复用现有 `useDimens / runtimeStore / appSdk / retry` |
| 指定了新目录 | 执行 `dimens-cli create --dir <目录名>` 初始化脚手架 |
| 没有指定目录 | 先询问是否创建自定义页面目录；推荐给出 `dimens-cli create --dir <目录名>` |
| 只是要在已有脚手架中加一个页面 | 不要重跑创建命令，直接新增 `src/pages`、注册路由、按需补 SDK resource |

初始化命令：

```bash
dimens-cli create --dir
dimens-cli create --dir ./my-custom-page
dimens-cli create --dir=./my-custom-page
```

行为说明：

- 命令会执行 `git clone --depth 1 https://gitee.com/bintelai/dimens-web.git <目标目录>`，并保留 `.git` 供后续更新。
- `--dir` 不带值时会交互询问目录名，默认推荐 `dimens-web`。
- 目标目录非空时会询问是否覆盖；确认后旧内容迁移到同级 `backupDel/<目录名>-<时间戳>/`。
- 使用前需确保本机已安装 Git；克隆失败直接提示检查 Git 和网络，不回退到本地包。
- 覆盖由 CLI 交互确认；技能回答不要建议手动删除目录。

## 10. 本地开发与验证

先检查 `vite.config.ts` 中 `/api` 代理目标是否可达。线上联调通常指向 `https://dimens.bintelai.com`；只有本地后端进程真实存在时才指向本地地址。出现空响应或 `Unexpected end of JSON input` 时先检查代理目标和 Network 响应，不要先改 SDK 解包。

升级 `@bintel/dimens-cli` 后如果运行行为仍像旧版本，先核对锁文件与实际解析版本。确需刷新 Vite 预构建缓存时，不直接删除 `node_modules/.vite/deps`：将旧缓存迁移到项目根 `backupDel/`，并只在没有可复用热加载进程或用户确认后重启原服务，禁止另起新端口。

```bash
cd <自定义页面目录>
pnpm install
```

需要启动且当前没有热加载进程时，才执行：

```bash
pnpm run dev
```

默认端口是 `3100`。如果热加载进程已经存在，不要重复启动新端口。

验证：

```bash
pnpm run typecheck
pnpm run test
pnpm run build
```

本地认证上下文可先用 CLI 准备：

```bash
dimens-cli auth api-key-login --api-key ak_xxx --api-secret sk_xxx
dimens-cli auth use-team TEAM_ID
dimens-cli auth use-project PROJECT_ID
dimens-cli auth status --output json
```

然后把 `baseUrl / teamId / projectId / token / refreshToken / sheetId` 填到开发页 `/#/settings`，或通过 URL query/hash query 传入。

## 11. 部署

```bash
pnpm run build
```

把 `dist/` 下所有文件上传到 CDN 同一目录。脚手架使用 Hash Router 和 `base: './'`，访问形式：

```text
https://cdn.example.com/dimens-web/index.html#/
https://cdn.example.com/dimens-web/index.html#/custom
```

CDN 不需要配置 SPA fallback。

## 12. 常见错误

| 错误 | 修正 |
| --- | --- |
| 未确认目录就直接生成页面代码 | 先判断已有目录；没有目录时询问并推荐 `dimens-cli create --dir <目录名>` |
| 在已有脚手架里重复执行 `create --dir` | 复用现有工程，只新增页面、路由或 resource 方法 |
| 不做页面设计判断就直接堆组件 | 先用 `ui-ux-pro-max-plus` 确定风格、配色、布局、图表和 UX 状态 |
| 新业务页覆盖 `/`、`/custom` 或开发测试路由 | 保留根页和既有示例/调试页，新页面通过 `/xxx` 独立访问 |
| 下载失败后使用本地 zip 兜底 | 直接失败，提示检查网络或稍后重试 |
| 热加载进程已存在还启动新端口 | 复用已有端口，不重复执行 `pnpm run dev` |
| 在 `dimens-web` 里又生成一套通用 auth/storage/sdk/retry | 使用脚手架已有 `useDimens`、`runtimeStore`、`appSdk`、`retry` |
| 自定义页面直接保存 `apiSecret` | API Key 换 token 放 BFF 或宿主后端，页面只接收短期 token |
| 页面组件直接拼接口 URL | 走 `useDimens()` 或补 resource 方法 |
| 生产构建访问不到新增路由 | 检查 `routes.tsx` 的生产分支是否注册 |
| 无权限时仍然展示写入按钮 | 按 `permissions` 控制按钮、入口和请求 |
| token 失效后页面静默失败 | 依赖脚手架 retry 和 `notifyTokenExpired` 通知宿主 |
| 把页面、视图、按钮三类入口混用一份上下文 | 按 `sourceLocation` 拆分：`PROJECT_MENU`、`SHEET_VIEW`、`ROW_BUTTON_MODAL/CELL_BUTTON_MODAL` |
| 视图微模块拿不到滚动 | Wujie 宿主容器要允许滚动；主应用传 `scrollable`，子应用内部用 `h-full overflow-auto` |
| 按钮微模块只保存 `pluginId = test` 后点击找不到模块 | 按钮运行器先 keyword 查询，再无 keyword 兜底，并按 `moduleCode/code/id/name` 精确匹配 |
| 把 `displayRows` 或 `rowSnapshot` 当成最终数据 | 这两个只是快照；需要最新数据时用 `useDimens()` 按 `sheetId/rowId` 重新读取 |
