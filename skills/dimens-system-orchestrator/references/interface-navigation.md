# dimens-system-orchestrator 接口导航

## 1. 文档目标

这份文档用于解决一个常见问题：

系统级 Skill 完成了模块拆解和子 Skill 路由之后，用户下一步应该去哪里看真实接口、CLI 命令和 references。

它的职责不是重复系统拆解，而是把“系统方案”继续落到接口级资料。

---

## 2. 默认导航顺序

当用户提出“帮我生成一个 XX 系统，并把后面会用到的接口也指清楚”时，建议默认按下面顺序导航：

1. 先看团队 / 项目上下文
2. 再看项目初始化和默认公开视图
3. 再看表 / 字段 / 行
4. 然后再按需扩展权限 / 工作流 / 报表 / 对接
5. 最后用总目录确认哪些能力已经 CLI 化

---

## 3. 子 Skill 到接口级文档的落点

| 子 Skill | 优先查看文档 | 用途 |
| --- | --- | --- |
| `dimens-team` | `dimens-team/references/examples.md` | 看团队、项目、默认上下文、成员与项目入口 |
| `dimens-project` | `dimens-project/references/examples.md` | 看项目创建、初始化主链和默认公开视图补齐 |
| `dimens-project` | `dimens-project/references/bootstrap-flow.md` | 看项目创建后如何推进到建表、视图、权限主链 |
| `dimens-table` | `dimens-table/references/examples.md` | 看表、字段、行的真实接口与 CLI |
| `dimens-table` | `dimens-table/references/field-design-patterns.md` | 看字段设计、relation 设计、默认建模骨架 |
| `dimens-table` | `dimens-table/references/row-filters.md` | 看 `row/page` 的搜索、筛选、排序、`viewId` 继承 |
| `dimens-permission` | `dimens-permission/references/command-mapping.md` | 用户直接要角色 / 项目权限命令时，先看权限命令主链 |
| `dimens-permission` | `dimens-permission/references/examples.md` | 看权限接口案例 |
| `dimens-permission` | `dimens-permission/references/matrix.md` | 看五层权限判断矩阵 |
| `dimens-workflow` | `dimens-workflow/references/examples.md` | 看工作流运行接口与使用案例 |
| `dimens-workflow` | `dimens-workflow/references/usage.md` | 看工作流使用边界与项目挂载说明 |
| `dimens-report` | `dimens-report/references/examples.md` | 看报表、组件、查询、模板、版本接口 |
| `dimens-key-auth` | `dimens-key-auth/references/examples.md` | 看 Key 登录与管理接口案例 |
| `dimens-key-auth` | `dimens-key-auth/references/login-flow.md` | 看登录流程、token 换取边界 |

---

## 4. 总目录落点

如果用户明确问下面这些问题：

- 哪些能力已经有 CLI 命令
- 哪些能力目前只有 server 接口
- 哪些命令和 server 真实接口还没有完全对齐

则继续查看：

- `command-mapping.md`
- 对应子 Skill 的 `SKILL.md`

这一步非常重要，因为总控 Skill 不能只给抽象导航，还要告诉用户当前能力状态。

---

## 5. 三种能力状态的标准口径

总控 Skill 在做接口导航时，必须显式区分下面三种状态：

| 状态 | 含义 | 输出要求 |
| --- | --- | --- |
| `已封装` | 当前已有 CLI 命令 | 可以直接给命令案例 |
| `server-only` | 当前只有后端接口或服务入口 | 只能给接口案例，不能伪装成 CLI 能力 |
| `部分对齐` | CLI 有命令，但和 server 真实接口还没完全收敛 | 必须提示差异和风险 |

---

## 6. 默认输出模板

建议总控 Skill 在输出系统方案后，固定补一段接口导航：

```md
### 接口导航
- 团队 / 项目上下文：看 `dimens-team/references/examples.md`
- 项目初始化 / 默认公开视图：看 `dimens-project/references/examples.md`、`dimens-project/references/bootstrap-flow.md`
- 表、字段、行：看 `dimens-table/references/examples.md`
- 字段设计：看 `dimens-table/references/field-design-patterns.md`
- 行筛选与排序：看 `dimens-table/references/row-filters.md`
- 如需扩展权限：先看 `dimens-permission/references/command-mapping.md`，再看 `examples.md`、`matrix.md`
- 如需扩展工作流：看 `dimens-workflow/references/examples.md`
- 如需扩展报表：看 `dimens-report/references/examples.md`
- 如需扩展外部对接：看 `dimens-key-auth/references/examples.md`
- CLI 封装现状总览：看 `command-mapping.md` 和各子 Skill 的 `SKILL.md`
```

---

## 7. CRM 作为单一案例

如果拆出来的是 CRM，推荐这样继续落到接口目录：

| 模块 | 优先落点 | 当前重点关注 |
| --- | --- | --- |
| 客户、联系人、跟进、商机 | `dimens-table/references/examples.md` | 表、字段、行读取链路 |
| 字段模板与 relation | `dimens-table/references/field-design-patterns.md` | 建模质量是否足够支撑后续筛选 |
| 客户搜索、状态过滤、时间排序 | `dimens-table/references/row-filters.md` | `row/page` 请求结构是否真实可用 |
| 客户归属、角色设计、项目权限、公开访问、协同限制 | `dimens-permission/references/command-mapping.md`、`examples.md`、`matrix.md` | 先确认角色 / 项目权限命令主链，再明确准入、表级、列级、行级边界 |
| 商机审批、提醒、AI 分析 | `dimens-workflow/references/examples.md` | 工作流与系统对象挂载边界 |
| 客户漏斗、销售报表 | `dimens-report/references/examples.md` | 报表是否为 `server-only` |
| ERP / 官网线索同步 | `dimens-key-auth/references/examples.md` | Key 登录和外部调用边界 |

---

## 8. 最小闭环

总控 Skill 做完系统级输出后，至少要形成这个闭环：

1. 先拆模块。
2. 再给子 Skill 路由。
3. 再给项目初始化和默认视图落点。
4. 再给接口导航。
5. 最后标记 `已封装 / server-only / 部分对齐`。

如果缺后两步，后续 AI 很容易继续停留在抽象方案层。
