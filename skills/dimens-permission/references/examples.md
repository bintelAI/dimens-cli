# dimens-permission 接口案例

本文档把权限 Skill 要引用的真实接口和真实权限链路拆开说明，重点覆盖：

1. 项目准入与项目内资源授权的区别
2. 项目权限接口
3. 行级策略接口
4. Yjs 协同连接与权限快照入口
5. 当前 CLI 未直接封装，但 Skill 必须解释的平台真实接口

更细的规则说明请分别查看：

- `matrix.md`
- `scenario-routing.md`
- `capability-status.md`

---

## 1. 项目准入不是最终授权

Skill 在解释权限时，第一句话必须先区分这两个层次：

1. 能不能进入项目
2. 能不能操作项目内资源

### 1.1 项目准入链路

项目准入依赖项目访问校验链路。

准入判断要点：

| 判断项 | 说明 |
| --- | --- |
| 项目是否存在 | 项目不存在直接拒绝 |
| 项目是否过期 | 过期则拒绝 |
| 项目是否禁用 | 禁用则拒绝 |
| 是否是项目成员 | 是则直接通过 |
| 是否是公开项目 | 不是成员但 `visibility = public_read` 时，可按公开访问者进入 |

准入成功后注入上下文：

| 字段 | 说明 |
| --- | --- |
| `ctx.project` | 当前项目 |
| `ctx.projectAccess.isProjectMember` | 是否项目成员 |
| `ctx.projectAccess.isPublicVisitor` | 是否公开访问者 |
| `ctx.projectAccess.visibility` | 项目可见性 |

结论：

- 通过准入只代表能进入项目上下文
- 不代表自动有表、字段、行、协同权限

---

## 2. 项目权限接口

### 2.1 路径前缀

| 项 | 内容 |
| --- | --- |
| 前缀 | `/app/mul/project/:projectId/permission` |
| 入口角色 | 项目权限管理入口 |

这些接口当前主要服务于项目内权限管理界面和权限诊断，CLI 还没有直接封装，但 Skill 不能遗漏。

### 2.2 查询我的权限快照

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/mul/project/:projectId/permission/myPermissions` |
| 鉴权 | `Authorization: Bearer {token}` |

返回字段重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.roles.globalRoles` | `array` | 全局角色 |
| `data.roles.sheetRoles` | `array` | 表级角色 |
| `data.isGuest` | `boolean` | 是否公开访问者 |
| `data.visibility` | `string` | 项目可见性 |
| `data.publicRoleId` | `string \| null` | 公开角色 |
| `data.effectiveDataAccess` | `string` | 生效数据访问范围 |
| `data.effectiveCanRead` | `boolean` | 是否可读 |
| `data.effectiveCanWrite` | `boolean` | 是否可写 |
| `data.capabilities` | `object` | 管理表、编辑结构、编辑数据能力 |
| `data.access` | `object` | 设置、成员、角色、审计、回收站入口权限 |
| `data.currentRole` | `object \| null` | 当前主要角色 |

这是 Skill 解释“为什么这个人能看/不能看项目设置、成员、角色、回收站”的主要接口依据。

### 2.3 查询某张表的权限配置列表

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/mul/project/:projectId/permission/list?sheetId=:sheetId` |
| 鉴权 | `Authorization: Bearer {token}` |

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `sheetId` | `string` | 否 | 指定表时返回该表权限；不传时可查项目级权限 |

### 2.4 新增权限配置

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/mul/project/:projectId/permission/add` |
| 鉴权 | `Authorization: Bearer {token}` |

请求体说明：

- body 是 `MulPermissionEntity` 的部分字段
- 若带 `sheetId`，服务端会校验该表属于当前项目

成功返回：

```json
{
  "code": 1000,
  "message": "success",
  "data": {
    "...": "权限记录"
  }
}
```

### 2.5 更新 / 删除权限配置

更新：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/project/:projectId/permission/update` |

删除：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/project/:projectId/permission/delete` |

删除请求体重点：

```json
{
  "ids": [1, 2, 3],
  "sheetId": "sh_xxx"
}
```

说明：

- 删除和更新后会触发 `yjsSyncService.notifyPermissionChanged`
- 所以 Skill 在解释“为什么协同权限会跟着变化”时，要把权限变更事件也提到

---

## 3. 行级策略接口

### 3.1 路径前缀

| 项 | 内容 |
| --- | --- |
| 前缀 | `/app/mul/project/:projectId/row_policy` |
| 入口角色 | 行级策略入口 |

### 3.2 查询策略列表

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/mul/project/:projectId/row_policy/list?sheetId=:sheetId` |

查询参数：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `sheetId` | `string` | 是 |

### 3.3 新增策略

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/mul/project/:projectId/row_policy/add` |

说明：

- body 是 `MulRowPolicyEntity` 的部分字段
- 如果带 `sheetId`，服务端会校验这张表属于当前项目

### 3.4 带冲突检测的新增 / 更新

新增并检测冲突：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/project/:projectId/row_policy/addWithCheck` |

更新并检测冲突：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/project/:projectId/row_policy/updateWithCheck` |

冲突返回结构重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | `1001` | 存在严重冲突 |
| `data.conflicts` | `array` | 冲突列表 |
| `data.hasErrors` | `boolean` | 是否有错误级冲突 |

### 3.5 行级判定与过滤接口

检查单行访问：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/project/:projectId/row_policy/check` |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `sheetId` | `string` | 是 | 表 ID |
| `rowData` | `object` | 是 | 要判断的行数据 |
| `action` | `string` | 是 | 常见 `view` / `edit` |
| `context` | `object` | 否 | 当前用户/部门上下文 |

批量过滤行：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/project/:projectId/row_policy/filter` |

请求体：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `sheetId` | `string` | 是 |
| `rows` | `array` | 是 |
| `action` | `string` | 是 |
| `context` | `object` | 否 |

### 3.6 Skill 应该怎么用这些接口结论

当用户说：

- “为什么这行看不到”
- “为什么这行能编辑，那行不能”
- “公开角色明明只能看自己，为什么还看到了别人的行”

Skill 不能只说“去查策略”，而要明确：

1. 这类问题要落到 `row_policy/check` 或 `row_policy/filter` 这一层
2. 最终判定依赖 `rowData + action + context`
3. 同一个项目里，不同行数据命中的策略可以不同

## 6. 这份文档的职责边界

这份文档只负责接口级案例总览，不再展开：

- 用户场景应该优先走哪条排查路径
- 哪些能力只是 `server-only`
- 五层权限结构的长篇判断说明

这些内容已经拆到独立 references 中，方便后续 Skill 精确引用。

---

## 4. 协同权限与 Yjs 入口

### 4.1 WebSocket 连接入口

| 项 | 内容 |
| --- | --- |
| 协议入口 | `/mul/yjs/*` |
| 入口角色 | 协同连接入口 |

连接查询参数重点：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `token` | 是 | 当前用户 JWT，WebSocket 这里直接从 query 里取 |
| `type` | 否 | 新版连接类型，例如 `sheet` |
| `id` | 否 | 资源 ID，常见是 `sheetId` |
| `projectId` | 否 | 项目 ID |

### 4.2 协同连接阶段的权限判断

连接时会做这些事：

1. `jwt.verify(token, secret)` 解析用户身份
2. 解析 `sheetId` 和 `projectId`
3. 调 `yjsPermissionFilter.getUserPermission`
4. 调 `permissionGuardService.canViewSheet`
5. 调 `permissionGuardService.canEditSheet`
6. 若 `canView` 不通过，直接拒绝连接

这意味着：

- 协同连接本身就是一层独立权限门槛
- 行分页接口能读，不代表 WebSocket 一定能连上

### 4.3 协同失败的典型控制消息

如果连接失败，服务端会发类似：

```json
{
  "type": "session:kicked",
  "code": "NO_VIEW_PERMISSION",
  "message": "当前无权访问该表格",
  "canView": false,
  "canEdit": false
}
```

Skill 在解释“为什么协同打不开”时，要把这一层区别于普通 HTTP 读取链路说清楚。

---

## 5. Skill 输出要求

当用户提到权限、公开访问、协同越权、只读、行级控制时，Skill 至少要明确这些事实：

1. 项目准入和项目内资源授权不是一回事。
2. `myPermissions` 适合看当前人的综合权限快照。
3. `row_policy` 接口是解释单行/批量行可见性与可写性的关键入口。
4. 协同连接单独走 WebSocket 权限判断，和普通分页读取不是同一条入口。
5. 权限变更会触发协同权限刷新事件，不能把协同结果当成静态缓存。
