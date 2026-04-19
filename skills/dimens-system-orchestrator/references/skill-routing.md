# dimens-system-orchestrator Skill 路由规则

## 1. 路由原则

系统级 Skill 的目标不是替代子 Skill，而是决定该调用谁。

## 2. 推荐路由顺序

| 阶段 | 子 Skill | 作用 |
| --- | --- | --- |
| 上下文阶段 | `dimens-team` | 确认团队、项目、成员和隔离边界 |
| 数据建模阶段 | `dimens-table` | 设计表、字段、视图和对象关系 |
| 权限阶段 | `dimens-permission` | 设计角色、数据范围和协同边界 |
| 流程阶段 | `dimens-workflow` | 设计审批、自动化、AI 分析 |
| 展示阶段 | `dimens-report` | 设计报表、统计和管理看板 |
| 对接阶段 | `dimens-key-auth` | 设计第三方脚本、开放登录和集成能力 |

## 2.1 链接输入优先转上下文

如果用户不是直接说“团队 ID / 项目 ID”，而是给出一个维表链接，例如：

```text
https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/
```

则默认先做这一步上下文归一化：

| 链接片段位置 | 含义 |
| --- | --- |
| `#/` 后第一段 | `teamId` |
| `#/` 后第二段 | `projectId` |

上面这个链接应直接理解为：

- `teamId = TTFFEN`
- `projectId = PXWXBJQ`

归一化完成后，再进入正常路由：

1. `dimens-team`
2. `dimens-table`
3. 按需追加 `dimens-permission` / `dimens-workflow` / `dimens-report` / `dimens-key-auth`

## 3. 子 Skill 之间的依赖关系

### 3.1 为什么通常先 `dimens-team`

因为很多后续判断都依赖上下文：

- 是团队级系统还是项目级系统
- 哪些成员属于默认参与者
- 哪些人是管理员、主管、普通成员、访客
- 数据到底按 `teamId` 还是 `projectId` 收敛

没有这一层，后面的表结构和权限设计很容易返工。

### 3.2 为什么 `dimens-table` 往往早于 `dimens-workflow`

因为流程、审批、自动化最终都要挂在业务对象上。若客户、工单、任务、商机这些对象没拆清，工作流节点和触发条件就会飘。

### 3.3 为什么 `dimens-permission` 不能最后才看

权限不是补丁，而是系统设计的一部分。只要用户提到下面任一场景，就要尽早进入 `dimens-permission`：

- 只看自己的数据
- 部门可见
- 公开访问
- 客户协同
- 外部成员参与
- 协同编辑但不能越权广播

### 3.4 `dimens-report` 为什么不是可有可无

如果系统存在管理视角、经营视角、运营视角，就必须把报表视为一等模块，因为：

- 它反过来决定字段口径
- 它影响哪些数据要沉淀为结构化字段
- 它决定是否需要参数联动、导出和权限隔离

### 3.5 `dimens-key-auth` 什么时候提前

如果用户一开始就说：

- 要给第三方系统调用
- 要开放 API Key
- 要做脚本对接
- 要做外部客户接入

那 `dimens-key-auth` 可以前置到 `dimens-report` 之前，甚至和 `dimens-permission` 并列分析。

## 4. 通用推荐路由

默认不要先假设用户要 CRM、项目管理、售后或审批模板。

更稳妥的通用路由是：

1. `team`
2. `table`
3. 可选扩展：`permission`
4. 可选扩展：`workflow`
5. 可选扩展：`report`
6. 可选扩展：`key-auth`

说明：

- `team -> table` 是默认主线，因为大多数用户先需要项目、表、字段、关联、样例数据和查询案例。
- `permission / workflow / report / key-auth` 只有当用户明确要求时再展开。

## 5. 什么时候不要进入总控 Skill

以下情况更适合直接进入业务 Skill：

- 只加字段
- 只改权限
- 只排查工作流
- 只处理 API Key
- 只处理报表

## 6. 风险识别规则

如果出现下面任意关键词，系统级 Skill 在输出路由时应显式标记风险：

| 关键词 | 风险点 | 建议同步路由 |
| --- | --- | --- |
| 多团队 / 多租户 | 团队与项目隔离容易混淆 | `dimens-team` |
| 公开访问 / 客户查看 | 项目准入、公开角色、行级权限叠加 | `dimens-permission` |
| 协同编辑 | Yjs 权限过滤与广播控制 | `dimens-permission` |
| 审批 / 自动化 | 工作流挂载与项目绑定边界 | `dimens-workflow` |
| 统计看板 / 漏斗 | 数据口径、参数联动、展示权限 | `dimens-report` |
| 第三方系统 / 开放平台 | Key 登录、Token 复用、外部访问边界 | `dimens-key-auth` |

## 7. 输出格式建议

总控 Skill 应该先输出：

1. 系统模块
2. 子 Skill 路由
3. 推荐顺序
4. 风险和待确认项

## 8. 路由后必须继续落到接口目录

总控 Skill 不应该只停在“建议使用哪个子 Skill”，还必须继续把用户带到接口级资料。

推荐固定使用下面这套导航：

| 子 Skill | 优先查看的接口级文档 | 用途 |
| --- | --- | --- |
| `dimens-team` | `../dimens-team/references/examples.md` | 看项目列表、项目详情、默认上下文 |
| `dimens-table` | `../dimens-table/references/examples.md` | 看表、字段、行的真实接口与 CLI |
| `dimens-permission` | `../dimens-permission/references/examples.md`、`../dimens-permission/references/matrix.md` | 看权限接口、五层判断矩阵 |
| `dimens-workflow` | `../dimens-workflow/references/examples.md`、`../dimens-workflow/references/usage.md` | 看工作流运行接口与团队/项目挂载边界 |
| `dimens-report` | `../dimens-report/references/examples.md` | 看报表、组件、查询、模板、版本接口 |
| `dimens-key-auth` | `../dimens-key-auth/references/examples.md`、`../dimens-key-auth/references/login-flow.md` | 看 Key 登录与管理接口 |

如果用户明确问“这些能力哪些已经有 CLI 命令，哪些还没有”，则继续查：

- `command-mapping.md`

## 9. 输出时必须显式标记的三种状态

总控 Skill 在做系统级导航时，必须显式区分：

| 状态 | 含义 | 输出要求 |
| --- | --- | --- |
| `已封装` | 当前已有 CLI 命令 | 可以直接给命令案例 |
| `server-only` | 当前只有后端接口或服务入口 | 只能给接口案例，不能伪装成 CLI 能力 |
| `部分对齐` | CLI 有命令，但和 server 真实接口还没完全收敛 | 必须提示差异和风险 |

## 10. 总控 Skill 的标准收口句式

当系统拆解结束后，建议固定补一句：

1. 先用子 Skill 确认业务边界。
2. 再去对应 `references/examples.md` 看接口级入参 / 出参。
3. 最后用 `command-mapping.md` 和各子 Skill 的 `SKILL.md` 判断哪些能力已经 CLI 化。
