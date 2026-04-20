# dimens-system-orchestrator 示例

## 场景 1：客户管理系统

用户：

```text
帮我生成一个客户管理系统
```

建议输出：

1. 识别系统级任务
2. 先拆客户、联系人、跟进、商机四张核心表
3. 给出每张表的字段设计、关联关系和示例行数据
4. 给出常用筛选和查询案例
5. 路由子 Skill：
   - `dimens-team`
   - `dimens-project`
   - `dimens-table`
6. 只有用户继续要求时，再补：
   - `dimens-permission`
   - `dimens-workflow`
   - `dimens-report`
7. 先输出方案，再等待确认

如果用户在这一步已经明确提出“角色怎么配”“项目权限怎么落地”“谁能看谁的数据”，则不要只写成可选扩展，而要继续补：

- `dimens-permission/references/command-mapping.md`
- 角色 / 项目权限主链：`role create -> permission create -> role assign-user -> row-policy create`

## 场景 2：通用系统级输出骨架

用户：

```text
帮我生成一个 XX 系统
```

建议输出：

1. 不要先假设用户要 CRM、项目管理、售后或审批模板。
2. 先输出统一骨架，让用户看到“这个系统至少要拆到哪一层”。
3. 默认先收口到：
   - 项目
   - 核心表
   - 字段设计
   - 关联关系
   - 示例数据
   - 查询案例
4. 只有用户继续要求时，再补：
   - 权限
   - 工作流
   - 报表
   - 外部对接

## 场景 3：系统级输出骨架示例

用户：

```text
帮我生成一个 XX 系统
```

建议输出示例：

```md
这是一个系统级建设任务，建议先做系统拆解，再进入具体业务 Skill。

### 1. 系统定位
- 这个系统要解决什么问题
- 主要使用角色有哪些

### 2. 核心业务对象
- 主对象
- 从对象
- 关键关系

### 3. 项目与表
- 项目名称
- 主表
- 从表
- 可选文档

### 4. 字段与关联
- 每张表都要标出主展示字段、状态字段、时间字段、关联字段
- 表之间的 relation 关系

### 5. 示例数据
- 每张表至少给 3 条案例数据
- 示例数据要覆盖主要状态和典型场景

### 6. 查询案例
- 查主对象
- 查某状态
- 查某时间范围
- 查某负责人
- 查某关联对象

### 7. 推荐子 Skill 路由
1. dimens-team
2. dimens-project
3. dimens-table
4. dimens-permission（可选扩展）
5. dimens-workflow（可选扩展）
6. dimens-report（可选扩展）
7. dimens-key-auth（可选扩展）

### 8. 待确认项
- 主对象和从对象分别是什么
- 哪些字段必须支持搜索、筛选、排序
- 是否需要多表关联
- 是否需要文档或知识说明页
```

## 场景 4：系统级导航到接口目录

用户：

```text
帮我做一个 XX 系统，并把后面会用到的接口也指清楚
```

建议输出：

1. 先识别这是系统级建设任务。
2. 先拆项目、核心表、字段、关联、示例数据、查询案例。
3. 给出子 Skill 路由。
4. 再明确接口目录落点：
   - `dimens-project/references/examples.md`
   - `dimens-table/references/examples.md`
5. 优先提醒 `dimens-table/references/examples.md` 中查看：
   - 字段案例
   - relation 配置
   - `row/page` 筛选案例
6. 如用户后续继续扩展，再补：
   - `dimens-permission/references/command-mapping.md`
   - `dimens-permission/references/examples.md`
   - `dimens-workflow/references/examples.md`
   - `dimens-report/references/examples.md`
   - `dimens-key-auth/references/examples.md`
7. 最后提醒查看 `command-mapping.md` 和各子 Skill 的 `SKILL.md` 区分：
   - 哪些已封装为 CLI
   - 哪些仍是 `server-only`
   - 哪些只是 `部分对齐`

补充：

- 更细的接口导航现在统一收口到 `interface-navigation.md`。
- `examples.md` 只保留场景化输出示例，不再继续承载完整导航规则。

## 场景 5：带接口状态标记的系统级输出模板

建议输出示例：

```md
这是一个系统级建设任务，建议先拆模块，再路由到接口级案例。

### 1. 模块拆解
- 团队 / 项目上下文
- 核心业务对象
- 字段设计与关联关系
- 示例数据
- 常用筛选与查询
- 可选扩展：权限 / 流程 / 报表 / 对接

### 2. 子 Skill 路由
1. dimens-team
2. dimens-project
3. dimens-table
4. 可选扩展：dimens-permission / dimens-workflow / dimens-report / dimens-key-auth

### 3. 接口落点
- 团队 / 上下文：`dimens-team/references/examples.md`
- 项目初始化：`dimens-project/references/examples.md`
- 表 / 字段 / 行：`dimens-table/references/examples.md`
- 字段设计：`dimens-table/references/field-design-patterns.md`
- 行筛选与排序：`dimens-table/references/row-filters.md`
- 如需扩展权限 / 协同：`dimens-permission/references/command-mapping.md`、`examples.md`、`matrix.md`
- 如需扩展工作流 / AI：`dimens-workflow/references/examples.md`
- 如需扩展报表：`dimens-report/references/examples.md`
- 如需扩展 Key / 外部登录：`dimens-key-auth/references/examples.md`

### 4. 当前能力状态
- 已封装：`auth api-key-login`、`project list/info`、`sheet list/tree/info`、`column list`、`row page/info`、`ai chat-completions`
- server-only：大部分报表接口、工作流管理与挂载接口
- 部分对齐：`row create`、`row update`、`row set-cell`
```

补充：

- 角色、项目权限、资源权限、行级策略的主链已应当优先视为 `dimens-permission` 内的已封装 CLI 能力，不应再在总控示例里笼统归为“权限管理接口都是 server-only”。

## 场景 6：CRM 作为单一案例

说明：

- CRM 这里只是一个案例，不代表总控 Skill 默认就该生成 CRM 模板。
- 当用户没有明确系统类型时，应先输出统一骨架，不要替用户决定业务域。

补充：

- 更完整的默认主线拆解请看 `system-decomposition.md`。
- 更完整的接口导航请看 `interface-navigation.md`。

建议输出示例：

```md
### 1. 项目
- 项目名称：客户管理系统

### 2. 核心表
- 客户表
- 联系人表
- 跟进记录表
- 商机表

### 3. 字段设计
- 客户表：客户名称、客户等级、行业、负责人、跟进状态、最近跟进时间
- 联系人表：联系人姓名、手机号、职位、所属客户
- 跟进记录表：跟进主题、跟进时间、跟进方式、跟进结果、所属客户、所属联系人
- 商机表：商机名称、阶段、预计金额、预计成交日期、所属客户

### 4. 关联关系
- 联系人 -> 客户
- 跟进记录 -> 客户
- 跟进记录 -> 联系人
- 商机 -> 客户

### 5. 示例数据
- 每张表至少写 3 条案例数据

### 6. 常用查询案例
- 查 A 级客户
- 查某销售负责人的客户
- 查最近 30 天未跟进客户
- 查某客户下所有联系人
- 查某客户的全部商机
```
