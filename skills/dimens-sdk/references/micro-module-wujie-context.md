# 三类微模块 Wujie 上下文协议

本文用于 `dimens-sdk` 技能处理 `dimens-web` 微模块开发问题时引用。凡是用户提到页面、按钮、视图三类微模块、Wujie、`dimens-web` 脚手架、`sourceLocation`、`viewState`、`actionSnapshot`、按钮弹窗或抽屉，都应优先读取本文。

## 1. 核心结论

`dimens-web` 微模块运行时按三类入口拆分：

| 入口体系 | 定义级筛选 | 运行时来源 | 运行容器 | 数据特征 |
| --- | --- | --- | --- | --- |
| 页面 | `usageScene = INSERT_PAGE` + `mountLocation = FULL_PAGE` | `sourceLocation = PROJECT_MENU` | 项目页面 / Wujie 页面 | 项目级上下文，通常不传行数据 |
| 视图 | `usageScene = VIEW_DISPLAY` + `mountLocation = SHEET_VIEW_TAB` | `sourceLocation = SHEET_VIEW` | 多维表格视图页签 / Wujie 视图 | 当前视图状态 + 当前已加载展示行快照 |
| 按钮 | `usageScene = BUTTON_PLUGIN` + `mountLocation = TABLE_ROW_ACTION` | `sourceLocation = ROW_BUTTON_MODAL`，单元格可用 `CELL_BUTTON_MODAL` | 弹窗或抽屉 / Wujie 或本地插件 | 点击瞬间动作快照 + 当前行轻量快照 |

定义级继续用 `usageScene / mountLocation` 筛选模块，运行时统一用 `sourceLocation` 判断入口来源。

数据策略固定为“快照 + ID”：

1. 宿主必须传 ID：`teamId / projectId / sheetId / viewId / rowId / columnId / instanceId / sourceId`。
2. 宿主可以传轻量快照：`viewState.displayRows`、`actionSnapshot.rowSnapshot`、`actionSnapshot.viewStateSnapshot`。
3. 快照只用于首屏和联调，不是权威数据；需要最新或完整数据时，微模块必须通过 `useDimens()` 或 SDK/API 重新读取。
4. 写入必须走 SDK/API，由后端权限裁决；不能只凭前端 `permissions` 直接改主应用 Store。

## 2. 运行上下文字段

三类入口共用基础字段：

```ts
type MicroModuleSourceLocation =
  | 'PROJECT_MENU'
  | 'SHEET_VIEW'
  | 'ROW_BUTTON_MODAL'
  | 'CELL_BUTTON_MODAL'
  | 'VIEW_TOOLBAR_MODAL'
  | 'CUSTOM';

interface MicroModulePermissions {
  visible: boolean;
  editable: boolean;
  canConfigure: boolean;
  canReadData?: boolean;
  canWriteData?: boolean;
  canEnable?: boolean;
  canDisable?: boolean;
}

interface ResolvedRuntimeContext {
  teamId?: string;
  projectId?: string;
  token?: string;
  refreshToken?: string;
  userId?: string | number;
  userName?: string;
  instanceId?: string;
  moduleCode?: string;
  moduleVersion?: string;
  sourceModuleVersion?: string;
  sourceLocation?: MicroModuleSourceLocation;
  sourceId?: string;
  sheetId?: string;
  viewId?: string;
  rowId?: string;
  columnId?: string;
  initialRoute?: string;
  permissions: MicroModulePermissions;
  instanceConfig: Record<string, any>;
  appConfig?: Record<string, any>;
  viewState?: MicroModuleViewState;
  actionSnapshot?: MicroModuleActionSnapshot;
}
```

`viewState` 和 `actionSnapshot` 必须进入 `ResolvedRuntimeContext`，不能只停留在 Wujie props 类型里。

## 3. 页面体系

### 3.1 查询与运行

页面型微模块用于“插入页面”或项目菜单资源：

```ts
await getMicroModuleUsageList({
  teamId,
  projectId,
  usageScene: 'INSERT_PAGE',
  mountLocation: 'FULL_PAGE',
  page: 1,
  pageSize: 100,
});
```

运行时：

| 字段 | 值 |
| --- | --- |
| `sourceLocation` | `PROJECT_MENU` |
| `sourceId` | 项目菜单资源 ID，通常是 `mul_sheet.sheetId` |
| `sheetId` | 页面资源 ID 或绑定表 ID，视具体页面配置而定 |
| `initialRoute` | 页面默认路由，如 `/custom`、`/dashboard` |

### 3.2 页面 Wujie props demo

```json
{
  "teamId": "team_001",
  "projectId": "project_001",
  "token": "USER_TOKEN",
  "refreshToken": "REFRESH_TOKEN",
  "userId": "user_001",
  "userName": "张三",
  "instanceId": "mmi_customer_page_001",
  "moduleCode": "crm-customer-console",
  "sourceLocation": "PROJECT_MENU",
  "sourceId": "sheet_menu_customer",
  "sheetId": "sheet_menu_customer",
  "initialRoute": "/customer-console",
  "permissions": {
    "visible": true,
    "editable": true,
    "canConfigure": true,
    "canReadData": true,
    "canWriteData": false
  },
  "instanceConfig": {
    "common": {
      "title": "客户管理"
    },
    "page": {
      "boundSheetId": "sheet_customer",
      "defaultTab": "customers",
      "enabledFeatures": ["list", "detail", "import"]
    }
  },
  "appConfig": {
    "appName": "客户管理",
    "moduleCode": "crm-customer-console",
    "defaultRoute": "/customer-console"
  }
}
```

### 3.3 页面微模块处理建议

```tsx
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useMicroModuleRuntime } from '@/lib/dimens/useMicroModuleRuntime';

export default function CustomerConsolePage() {
  const dimens = useDimens();
  const runtime = useMicroModuleRuntime();

  if (!runtime.isPageContext) {
    return <StateView title="入口不匹配" description="该页面需要从项目菜单或页面入口打开。" />;
  }

  const sheetId = runtime.context.instanceConfig?.page?.boundSheetId;
  if (!sheetId) {
    return <StateView title="缺少绑定表" description="请在实例配置中设置 page.boundSheetId。" />;
  }

  // 快照不是权威数据；页面需要数据时按 sheetId 主动读取。
  // await dimens.row.page(sheetId, { page: 1, size: 50 })
}
```

## 4. 视图体系

### 4.1 查询与运行

视图型微模块用于多维表格视图页签：

```ts
await getMicroModuleUsageList({
  teamId,
  projectId,
  usageScene: 'VIEW_DISPLAY',
  mountLocation: 'SHEET_VIEW_TAB',
  page: 1,
  pageSize: 100,
});
```

运行时：

| 字段 | 值 |
| --- | --- |
| `sourceLocation` | `SHEET_VIEW` |
| `sourceId` | `mul_view.viewId` |
| `sheetId` | 当前表 ID |
| `viewId` | 当前视图 ID |
| `viewState` | 当前视图受控状态 |
| `instanceConfig` | 视图实例配置，如字段映射 |

Wujie 视图容器必须允许滚动；主应用侧 `WujieApp` 应传 `scrollable`。

### 4.2 viewState 字段

```ts
interface MicroModuleViewState {
  viewId: string;
  viewType: string;
  filters: unknown[];
  filterMatchType: 'and' | 'or';
  sortRule: unknown | null;
  groupBy: string[];
  hiddenColumnIds: string[];
  searchTerm?: string;
  selectedRowIds: string[];
  displayRows?: Array<Record<string, unknown>>;
  displayState?: {
    source: 'raw' | 'remoteSearch' | 'filtered' | 'sorted';
    lastUpdatedAt?: number;
  };
}
```

`displayRows` 只表示当前已加载、已渲染或当前视图状态下的轻量行快照，不承诺全量数据。远程搜索、分页加载、权限过滤后的全量数据必须通过 SDK 读取。

### 4.3 视图 Wujie props demo

```json
{
  "teamId": "team_001",
  "projectId": "project_001",
  "token": "USER_TOKEN",
  "userId": "user_001",
  "userName": "张三",
  "instanceId": "mmi_customer_view_001",
  "moduleCode": "customer-board-view",
  "sourceLocation": "SHEET_VIEW",
  "sourceId": "view_customer_board",
  "sheetId": "sheet_customer",
  "viewId": "view_customer_board",
  "initialRoute": "/view-context",
  "permissions": {
    "visible": true,
    "editable": true,
    "canConfigure": true,
    "canReadData": true,
    "canWriteData": false
  },
  "instanceConfig": {
    "view": {
      "titleFieldId": "fld_company",
      "statusFieldId": "fld_status",
      "ownerFieldId": "fld_owner"
    }
  },
  "viewState": {
    "viewId": "view_customer_board",
    "viewType": "plugin",
    "filters": [
      {
        "columnId": "fld_status",
        "operator": "eq",
        "value": "跟进中"
      }
    ],
    "filterMatchType": "and",
    "sortRule": {
      "columnId": "fld_update_time",
      "direction": "desc"
    },
    "groupBy": ["fld_owner"],
    "hiddenColumnIds": ["fld_internal_note"],
    "selectedRowIds": ["row_001"],
    "displayRows": [
      {
        "rowId": "row_001",
        "data": {
          "fld_company": "方块科技",
          "fld_status": "跟进中",
          "fld_owner": "张三"
        }
      }
    ],
    "displayState": {
      "source": "filtered",
      "lastUpdatedAt": 1779757200000
    }
  }
}
```

### 4.4 视图微模块处理建议

```tsx
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useMicroModuleRuntime } from '@/lib/dimens/useMicroModuleRuntime';

export default function CustomerBoardView() {
  const dimens = useDimens();
  const runtime = useMicroModuleRuntime();
  const { context } = runtime;

  if (!runtime.isViewContext) {
    return <StateView title="入口不匹配" description="该模块需要作为多维表格视图打开。" />;
  }

  const rows = context.viewState?.displayRows || [];

  async function reloadRows() {
    if (!context.sheetId) return;
    return dimens.row.page(context.sheetId, { page: 1, size: 50 });
  }

  return (
    <div className="h-full overflow-auto">
      <pre>{JSON.stringify(rows, null, 2)}</pre>
      <button onClick={reloadRows}>重新读取当前表数据</button>
    </div>
  );
}
```

## 5. 按钮体系

### 5.1 查询与运行

按钮型微模块用于字段按钮、行操作按钮或后续单元格按钮：

```ts
await getMicroModuleUsageList({
  teamId,
  projectId,
  usageScene: 'BUTTON_PLUGIN',
  mountLocation: 'TABLE_ROW_ACTION',
  page: 1,
  pageSize: 100,
});
```

运行时：

| 字段 | 值 |
| --- | --- |
| `sourceLocation` | 行按钮默认 `ROW_BUTTON_MODAL`，单元格按钮可用 `CELL_BUTTON_MODAL` |
| `sourceId` | 当前 `rowId` 或触发来源 ID |
| `sheetId` | 当前表 ID |
| `viewId` | 当前视图 ID |
| `rowId` | 当前行 ID |
| `columnId` | 当前按钮字段 ID 或单元格字段 ID |
| `actionSnapshot` | 点击瞬间动作快照 |

按钮字段配置需要保存：

```json
{
  "buttonConfig": {
    "text": "处理",
    "action": "plugin",
    "actionConfig": {
      "pluginId": "test",
      "openMode": "drawer-right",
      "drawerPlacement": "right",
      "drawerWidth": "60%",
      "modalWidth": 960,
      "modalHeight": "70vh"
    }
  }
}
```

支持的首期打开方式：

| openMode | 容器 |
| --- | --- |
| `drawer-right` | 右侧抽屉 |
| `drawer-left` | 左侧抽屉 |
| `drawer-top` | 顶部抽屉 |
| `drawer-bottom` | 底部抽屉 |
| `modal-center` | 中间弹窗 |

运行器必须支持 `WUJIE_MICRO_FRONTEND` 和 `LOCAL_CODE` 两种形态：

1. `WUJIE_MICRO_FRONTEND`：用 `WujieApp` 渲染 `entryRef`。
2. `LOCAL_CODE`：用 `PluginRegistry / PluginSlot` 或等价本地注册表渲染。

按钮运行器查找模块时，不能只依赖后端 `keyword`。推荐流程：

1. 先按 `keyword = pluginId` 查询 `BUTTON_PLUGIN + TABLE_ROW_ACTION`。
2. 前端按 `moduleCode / code / id / moduleName / name` 精确匹配。
3. 如果没找到，再无 `keyword` 查询一页按钮插件列表。
4. 再按同样候选字段精确匹配。
5. 仍未找到才提示 `未找到按钮微模块: <pluginId>`。

这个兜底用于兼容后端 `keyword` 只按名称匹配、但字段配置保存的是 `code = test` 的情况。

### 5.2 actionSnapshot 字段

```ts
interface MicroModuleActionSnapshot {
  trigger: {
    type: 'button' | 'toolbar' | 'row' | 'cell' | 'column';
    id?: string;
    label?: string;
  };
  sheetId?: string;
  viewId?: string;
  rowId?: string;
  columnId?: string;
  fieldId?: string;
  recordIds?: string[];
  selectedRowIds?: string[];
  rowSnapshot?: Record<string, unknown>;
  viewStateSnapshot?: MicroModuleViewState;
}
```

`rowSnapshot` 只传当前行轻量数据，建议包含当前渲染行可见字段和必要系统字段。按钮微模块需要最新行详情时，通过 SDK 再拉取。

### 5.3 按钮 Wujie props demo

```json
{
  "teamId": "team_001",
  "projectId": "project_001",
  "token": "USER_TOKEN",
  "userId": "user_001",
  "userName": "张三",
  "instanceId": "test-row_001",
  "moduleCode": "test",
  "sourceLocation": "ROW_BUTTON_MODAL",
  "sourceId": "row_001",
  "sheetId": "sheet_customer",
  "viewId": "view_all",
  "rowId": "row_001",
  "columnId": "fld_action",
  "initialRoute": "/button-context",
  "permissions": {
    "visible": true,
    "editable": true,
    "canConfigure": true,
    "canReadData": true,
    "canWriteData": true
  },
  "instanceConfig": {
    "modal": {
      "title": "客户处理",
      "workflowId": "flow_customer_action"
    }
  },
  "buttonConfig": {
    "text": "处理",
    "actionConfig": {
      "pluginId": "test",
      "openMode": "drawer-right",
      "drawerPlacement": "right",
      "drawerWidth": "60%"
    }
  },
  "actionSnapshot": {
    "trigger": {
      "type": "button",
      "id": "fld_action",
      "label": "处理"
    },
    "sheetId": "sheet_customer",
    "viewId": "view_all",
    "rowId": "row_001",
    "columnId": "fld_action",
    "fieldId": "fld_action",
    "recordIds": ["row_001"],
    "selectedRowIds": ["row_001"],
    "rowSnapshot": {
      "rowId": "row_001",
      "data": {
        "fld_company": "方块科技",
        "fld_status": "跟进中",
        "fld_owner": "张三"
      }
    },
    "viewStateSnapshot": {
      "viewId": "view_all",
      "viewType": "grid",
      "filters": [],
      "filterMatchType": "and",
      "sortRule": null,
      "groupBy": [],
      "hiddenColumnIds": [],
      "selectedRowIds": ["row_001"],
      "displayState": {
        "source": "filtered",
        "lastUpdatedAt": 1779757200000
      }
    }
  }
}
```

### 5.4 按钮微模块处理建议

```tsx
import StateView from '@/components/common/StateView';
import { useDimens } from '@/lib/dimens/useDimens';
import { useMicroModuleRuntime } from '@/lib/dimens/useMicroModuleRuntime';

export default function ButtonActionPage() {
  const dimens = useDimens();
  const runtime = useMicroModuleRuntime();
  const { context } = runtime;

  if (!runtime.isButtonContext) {
    return <StateView title="入口不匹配" description="该模块需要从字段按钮或行按钮打开。" />;
  }

  const rowSnapshot = context.actionSnapshot?.rowSnapshot;

  async function reloadCurrentRow() {
    if (!context.sheetId || !context.rowId) return;
    return dimens.row.info(context.sheetId, context.rowId);
  }

  return (
    <div className="h-full overflow-auto">
      <pre>{JSON.stringify(rowSnapshot, null, 2)}</pre>
      <button onClick={reloadCurrentRow}>重新拉取当前行</button>
    </div>
  );
}
```

## 6. 子应用本地调试

URL/hash query 只传 ID 类字段，不传大对象：

```text
http://localhost:3100/#/view-context?teamId=team_001&projectId=project_001&sheetId=sheet_customer&viewId=view_all
http://localhost:3100/#/button-context?teamId=team_001&projectId=project_001&sheetId=sheet_customer&rowId=row_001
```

`viewState`、`actionSnapshot` 这类大对象通过 Wujie props 或脚手架设置页/localStorage 场景预设模拟。

本地调试要点：

1. 已有热加载进程时不要重复启动 `pnpm run dev`。
2. `dimens-web` 默认 dev 端口是 `3100`。
3. 微前端入口可使用 `http://localhost:3100/#/view-context` 或 `http://localhost:3100/#/button-context`。
4. `persistHostRuntimeForDev` 保存上下文时必须递归剔除敏感字段，如 `token / refreshToken / apiKey / apiSecret`。

## 7. 权限与安全

`permissions` 用于 UI 预判：

| 字段 | 控制 |
| --- | --- |
| `editable` | 是否可编辑实例配置 |
| `canConfigure` | 是否显示配置入口 |
| `canReadData` | 是否显示读取数据入口 |
| `canWriteData` | 是否显示写入按钮、是否允许发起写入请求 |

安全规则：

1. 微模块内部不得只凭前端 `permissions` 绕过后端校验。
2. 写入数据必须走 SDK/API，由后端按 `teamId / projectId / sheetId / rowId / instanceId` 再校验。
3. `rowSnapshot`、`displayRows` 不是权限或一致性的权威来源。
4. 前端不得保存 `apiSecret`。

## 8. 回答用户时的输出模板

当用户要求开发三类微模块时，输出应覆盖：

1. 当前入口类型：页面、视图、按钮。
2. 定义级查询参数：`usageScene / mountLocation`。
3. 运行时判别：`sourceLocation`。
4. 必传 ID：`teamId / projectId / sheetId / viewId / rowId / columnId / instanceId`。
5. 快照字段：页面无快照、视图 `viewState`、按钮 `actionSnapshot`。
6. 权限字段：`permissions.canReadData / canWriteData / canConfigure`。
7. SDK 使用方式：优先 `useDimens()`，不要直接拼接口。
8. 本地调试：大对象走设置页/localStorage，不塞 URL。
9. 验证：上下文调试页能看到 `viewState/actionSnapshot`，按钮点击能打开弹窗/抽屉。

