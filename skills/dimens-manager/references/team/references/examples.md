# dimens-manager 团队上下文章节 接口案例

本文档聚焦团队与项目上下文相关的真实接口案例。由于当前 `dimens-cli` 主要封装的是 `project` 域，团队侧更多是通过 `teamId` 作为上下文进入，所以示例重点放在：

1. 团队上下文如何进入项目接口
2. 项目列表 / 项目详情的真实入参与出参
3. CLI 默认上下文如何影响结果

示例使用约束：

- 上下文确认优先使用 `dimens-cli auth me/user me`、`team info/users`、`auth use-team/use-project`、`project list/info` 和显式参数复跑。
- 示例中的团队名、项目名不能替代真实 `teamId/projectId`；缺 ID 时先查询或询问。
- 排查“数据不对”时必须同时说明显式参数、本地 profile、环境变量三类上下文来源。
- Windows 下保存含中文上下文记录或排查日志时，必须使用 UTF-8 并读回确认。

更细的规则说明请分别查看：

- `context-sources.md`
- `project-entry.md`
- `isolation.md`

---

## 1. 获取当前用户信息

### 1.1 服务端接口

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/user/info/person` |
| 入口角色 | 当前 token 用户详情 |
| 鉴权 | `Authorization: Bearer {token}` |

返回字段重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.id` | `number \| string` | 用户 ID |
| `data.username` | `string` | 登录用户名 |
| `data.name` / `data.nickName` | `string` | 用户显示名称 |
| `data.email` / `data.phone` | `string` | 联系方式 |

### 1.2 CLI 命令

```bash
dimens-cli auth me --output json
dimens-cli user me --output json
```

说明：

- 两个命令读取同一个接口，`auth me` 适合登录态排查，`user me` 适合用户域表达。
- 登录接口返回的 `userInfo` 是登录响应快照；需要确认当前 token 对应用户时使用这里的命令。

### 1.3 SDK 调用

```ts
const user = await sdk.user.me();
// 或 const user = await sdk.auth.me();
```

---

## 2. 查询团队详情

### 2.1 服务端接口

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/org/:teamId/team/info` |
| 入口角色 | 团队详情 |
| 鉴权 | `Authorization: Bearer {token}` |

返回字段重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.id` | `string` | 团队 ID |
| `data.name` | `string` | 团队名称 |
| `data.remark` / `data.description` | `string` | 团队说明 |
| `data.billingPlanCode` | `string` | 当前套餐代码 |
| `data.billingSubscription` | `object \| null` | 当前订阅信息 |

### 2.2 CLI 命令

```bash
dimens-cli team info --team-id TTFFEN --output json
```

### 2.3 SDK 调用

```ts
const team = await sdk.team.info('TTFFEN');
```

说明：

- `auth use-team TTFFEN` 只是写本地默认团队，不会读取团队详情。
- 排查团队上下文时，优先用显式 `--team-id` 跑一次 `team info`。

---

## 3. 查询团队成员列表

### 3.1 服务端接口

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/org/:teamId/team_user/list` |
| 入口角色 | 团队成员列表 |
| 鉴权 | `Authorization: Bearer {token}` |

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `projectId` | `string` | 否 | 传入后返回项目成员范围 |

### 3.2 CLI 命令

```bash
dimens-cli team users --team-id TTFFEN --output json
dimens-cli team users --team-id TTFFEN --project-id PUQUNFE --output json
dimens-cli team users --team-id TTFFEN --keyword 张三 --output json
```

说明：

- `--keyword` 会在 CLI 层对返回成员按姓名、昵称、用户名、邮箱、手机号、ID 做本地过滤。
- 判断“用户是否属于团队”时，先查 `team users`；判断“是否能进某项目”时，再传 `--project-id` 收敛。

### 3.3 SDK 调用

```ts
const members = await sdk.team.members('TTFFEN', { projectId: 'PUQUNFE' });
// userList 是 members 的别名
const sameMembers = await sdk.team.userList('TTFFEN');
```

---

## 4. 设置默认团队

### CLI 命令

```bash
dimens-cli auth use-team TTFFEN
```

入参：

| 参数位置 | 必填 | 说明 |
| --- | --- | --- |
| `<teamId>` | 是 | 团队 ID |

成功输出：

```json
{
  "success": true,
  "message": "默认团队已更新",
  "data": {
    "teamId": "TTFFEN"
  }
}
```

作用：

- 写入本地 profile 的默认 `teamId`
- 后续部分命令可以省略 `--team-id`

---

## 5. 查询团队下的项目列表

### 5.1 服务端接口

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/org/:teamId/project/page` |
| 入口角色 | 团队项目分页入口 |
| 鉴权 | `Authorization: Bearer {token}` |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 页码，CLI 默认 `1` |
| `size` | `number` | 否 | 每页条数，CLI 默认 `20` |
| `keyword` | `string` | 否 | 项目名称关键词 |

请求示例：

```json
{
  "page": 1,
  "size": 20
}
```

返回字段重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.list` | `array` | 项目列表 |
| `data.list[].id` | `string` | 项目 ID |
| `data.list[].name` | `string` | 项目名称 |
| `data.list[].teamId` | `string` | 所属团队 |
| `data.list[].visibility` | `string` | `private` / `public_read` |
| `data.list[].publicRoleId` | `string` | 公开项目角色 ID |
| `data.list[].membercount` | `string \| null` | 成员数量 |
| `data.pagination.page` | `number` | 当前页 |
| `data.pagination.size` | `number` | 每页大小 |
| `data.pagination.total` | `number` | 总数 |

### 5.2 CLI 命令

```bash
dimens-cli project list --team-id TTFFEN --output json
```

CLI 入参：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `--team-id` | 是，若 profile 无默认值 | 团队 ID |
| `--page` | 否 | 页码，默认 `1` |
| `--size` | 否 | 每页条数，默认 `20` |
| `--keyword` | 否 | 搜索关键词 |
| `--output` | 否 | `json` / `table` / `raw` |

基于本次实测的真实结果：

```json
{
  "success": true,
  "message": "项目列表获取成功",
  "data": {
    "list": [
      {
        "id": "PUQUNFE",
        "name": "xcv",
        "teamId": "TTFFEN",
        "visibility": "public_read",
        "publicRoleId": "role_1Pe28cwWtI0XO4"
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 22
    }
  }
}
```

---

## 6. 查询项目详情

### 6.1 服务端接口

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/org/:teamId/project/info?id=:projectId` |
| 入口角色 | 团队项目详情入口 |
| 鉴权 | `Authorization: Bearer {token}` |

查询参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 项目 ID |

返回字段重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.id` | `string` | 项目 ID |
| `data.name` | `string` | 项目名 |
| `data.teamId` | `string` | 所属团队 |
| `data.config` | `object \| null` | 项目配置，包含菜单、品牌、外观等 |
| `data.visibility` | `string` | 可见性 |
| `data.publicRoleId` | `string` | 公开项目角色 ID |

### 6.2 CLI 命令

```bash
dimens-cli project info --team-id TTFFEN --id PUQUNFE --output json
```

### 6.3 菜单配置案例

本次实测项目 `PUQUNFE` 返回的菜单配置位于：

```json
{
  "config": {
    "appearance": {
      "topMenu": {
        "showManageButton": true,
        "items": [
          {
            "id": "sh_ja2IwgaBhV1jUWB4",
            "title": "数据管理",
            "type": "sheet",
            "targetId": "sh_ja2IwgaBhV1jUWB4"
          },
          {
            "id": "sh_Zp60Au58FrE9FhVi",
            "title": "工作表 2",
            "type": "sheet",
            "targetId": "sh_Zp60Au58FrE9FhVi"
          }
        ]
      }
    }
  }
}
```

这类项目级菜单配置，是 Skill 解释“项目菜单、项目入口、项目里能看到什么资源”时必须引用的真实案例。

---

## 7. 切换默认项目

### CLI 命令

```bash
dimens-cli auth use-project PUQUNFE
```

入参：

| 参数位置 | 必填 | 说明 |
| --- | --- | --- |
| `<projectId>` | 是 | 项目 ID |

作用：

- 写入本地 profile 默认 `projectId`
- 影响后续 `sheet/column/row/ai` 等命令的默认上下文

---

## 8. Skill 输出要求

当用户问团队、项目、上下文时，Skill 至少要说清这几件事：

1. 当前 token 对应哪个用户，可用 `auth me` / `user me` 校验。
2. 当前问题依赖哪个 `teamId`，可用 `team info` 校验真实团队。
3. 如涉及成员或权限，先用 `team users` 确认用户是否在团队范围内。
4. 项目接口是从哪个团队路径进入的。
5. `project list` 和 `project info` 的必填入参分别是什么。
6. 项目详情里哪些字段可以反映菜单、可见性和公开角色。
7. profile 默认值、显式参数、环境变量会共同影响结果，不能只看一条命令表面参数。

## 6. 这份文档的职责边界

这份文档只负责接口级案例总览，不再展开：

- 上下文来源优先级
- 系统建设时为什么要先从项目入口进入
- 团队级 / 项目级隔离与角色判断细则

这些内容已经拆到独立 references 中，方便后续 Skill 精确引用。
