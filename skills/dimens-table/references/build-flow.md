# dimens-table 建模落地链路

## 1. 文档目标

这份文档专门补“怎么一步步把系统搭出来”。

前面的 references 已经分别说明了：

- 接口总览：`examples.md`
- 字段设计：`field-design-patterns.md`
- 行筛选与排序：`row-filters.md`
- 系统视图规则：`field-rules.md`

但用户还需要一条更直接的落地链路：

1. 先有项目
2. 再有表 / 文档
3. 再补公开默认视图
4. 再设计字段
5. 再写示例数据
6. 最后用查询案例验证这套结构是否真的能用

---

## 2. 默认落地顺序

当用户说“帮我搭一个系统”时，围绕表格能力，默认建议按这个顺序落地：

1. 确认项目
2. 创建表 / 文档
3. 补公开默认视图
4. 设计字段
5. 组织 relation
6. 写示例行数据
7. 用 `row/page` 验证搜索、筛选、排序

这条顺序的重点是：

- 先把容器和结构搭出来
- 再把筛选、排序依赖的默认公开视图补齐
- 再验证它是不是可搜索、可筛选、可排序

---

## 3. 第一步：从项目进入

表格能力默认先从项目进入，而不是脱离项目单独开始。

建议先确认：

| 需要确认的项 | 说明 |
| --- | --- |
| `teamId` | 团队上下文 |
| `projectId` | 业务系统容器 |
| 项目名称 | 用户最终看到的系统名称 |
| 项目菜单是否已有入口 | 决定后续表 / 文档入口如何组织 |

如果项目还没建，可以先用项目命令作为第一步：

```bash
dimens-cli project create --team-id TTFFEN --name 客户管理系统
```

注意：

- 这是上游步骤，虽然命令属于 `dimens-team`，但对 `dimens-table` 的落地链路非常关键。
- 如果项目不明确，后续所有表结构讨论都会飘。

---

## 4. 第二步：创建表 / 文档

### 4.1 先决定是表还是文档

一般建议：

| 资源类型 | 适合场景 |
| --- | --- |
| 表 | 结构化业务对象，例如客户、联系人、工单、商机 |
| 文档 | 说明页、制度页、知识沉淀、操作说明 |

对多数业务系统，默认主线仍然是先建表。

### 4.2 创建表的基本路径

接口路径：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/project/:projectId/sheet/create` |

CLI 命令：

```bash
dimens-cli sheet create --project-id PUQUNFE --name 客户表
```

创建表前建议先明确：

| 项 | 说明 |
| --- | --- |
| 表名 | 用户能直接理解的业务名 |
| 表的业务对象 | 客户、联系人、工单、商机等 |
| 是否需要多个核心表 | 一般是 |
| 是否需要辅助文档 | 视业务复杂度决定 |

### 4.3 创建表后立即检查默认公开视图

用户这轮反馈已经证明，只建表和字段还不够，技能链路如果没有公开默认视图，前端常见表现就是“无法筛选”。

所以建表后默认追加下面两步：

1. 先执行 `view list` 检查是否已经存在公开视图
2. 如果没有，就显式创建一个公开的 `grid` 默认视图

推荐检查命令：

```bash
dimens-cli view list \
  --team-id TTFFEN \
  --project-id PUQUNFE \
  --sheet-id sh_customer
```

推荐补建命令：

```bash
dimens-cli view create \
  --team-id TTFFEN \
  --project-id PUQUNFE \
  --sheet-id sh_customer \
  --name 默认视图 \
  --type grid \
  --is-public true \
  --config '{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}'
```

默认公开视图建议采用下面这组最小配置：

| 配置项 | 建议值 |
| --- | --- |
| `name` | `默认视图` |
| `type` | `grid` |
| `isPublic` | `true` |
| `filters` | `[]` |
| `filterMatchType` | `and` |
| `sortRule` | `null` |
| `groupBy` | `[]` |
| `hiddenColumnIds` | `[]` |
| `rowHeight` | `medium` |

注意：

- 不要假设后端或前端一定会自动补齐，技能链路必须显式检查
- 如果 `view list` 已经返回公开默认视图，就不要重复创建
- 当前 CLI 只稳定支持 `view list/create`，这里不要展开成更复杂的视图编排

---

## 5. 第四步：设计并创建字段

### 5.1 创字段前先确认什么

不要一上来只问“这个字段叫什么”，至少要先确认：

| 需要确认的项 | 说明 |
| --- | --- |
| 字段名 | 业务上怎么称呼 |
| 类型 | `text` / `select` / `date` / `number` / `relation` 等 |
| 是否主展示 | 决定列表标题和 relation 展示 |
| 是否必填 | 决定录入约束 |
| 是否唯一 | 编号、手机号等常见需要 |
| 是否参与搜索 | 用于 `keyword + searchFieldIds` |
| 是否参与筛选 | 用于 `filters` |
| 是否参与排序 | 用于 `sortRule` |

如果是 relation 字段，还要继续确认：

- 目标表
- 展示字段
- 是否多选
- 是否双向
- `editViewFields`

更详细的字段模板，请直接查看 `field-design-patterns.md`。

### 5.2 创建字段的基本路径

接口路径：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/:teamId/:projectId/sheet/:sheetId/column/create` |

CLI 命令：

```bash
dimens-cli column create \
  --team-id TTFFEN \
  --project-id PUQUNFE \
  --sheet-id sh_customer \
  --label 客户名称 \
  --type text
```

实践建议：

- 先建主展示字段
- 再建状态字段、时间字段、人员字段
- 最后建 relation 字段
- 当前 CLI 已兼容旧参数 `--title`，但推荐统一改用 `--label`，与服务端字段名保持一致

---

## 6. 第五步：组织 relation

如果系统不只是单表，默认要尽早把 relation 设计出来。

例如 CRM：

| 表 | relation 设计 |
| --- | --- |
| 联系人表 | 所属客户 -> 客户表 |
| 商机表 | 所属客户 -> 客户表 |
| 跟进记录表 | 所属客户 -> 客户表；所属联系人 -> 联系人表 |

relation 的目标不是“看起来有关系”，而是为了后续能做：

- 关联选择
- 关联追踪
- 关联筛选
- 多表查询解释

---

## 7. 第六步：写示例行数据

### 7.1 示例数据不要只写一条

为了验证表结构是否真能用，建议每张表至少写 3-5 条案例数据，并覆盖：

| 覆盖项 | 说明 |
| --- | --- |
| 主状态 | 例如潜客、跟进中、成交、流失 |
| 典型对象 | 例如重点客户、普通客户 |
| 时间差异 | 例如最近跟进、超期未跟进 |
| 负责人差异 | 例如不同销售负责人 |
| 关联关系 | 例如一个客户对应多个联系人 |

### 7.2 创建行的基本路径

接口路径：

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/mul/sheet/:sheetId/row/create` |

CLI 命令：

```bash
dimens-cli row create \
  --sheet-id sh_customer \
  --values '{"fld_customerName":"华东智造","fld_customerLevel":"A","fld_customerStatus":"跟进中"}'
```

注意：

- 行创建前要先通过 `column list` 查询字段列表，拿到真实 `fieldId`
- `--values` 只是 CLI 参数名，CLI 内部会映射为服务端需要的 `data`
- 不要直接把中文字段名当请求体 key，服务端真实写入以 `fieldId` 为准

---

## 8. 第七步：用 `row/page` 验证结构是否可用

表搭出来之后，不能只看“有数据”，还要验证它能不能支撑真实查询。

至少建议做 4 类验证：

### 8.1 关键词搜索

验证主展示字段和编号字段是否真的能被搜到。

### 8.2 单字段筛选

验证状态、等级、负责人等字段是否真的适合筛选。

### 8.3 排序

验证时间、金额等字段是否真的适合排序。

### 8.4 relation 筛选

验证跨表关系能不能支撑“查某客户下全部联系人 / 商机 / 跟进记录”。

更详细的查询结构，请直接查看 `row-filters.md`。

---

## 9. CRM 作为单一案例

下面给一条更接近用户视角的最小落地链路：

### 9.1 创建项目

```bash
dimens-cli project create --team-id TTFFEN --name 客户管理系统
```

### 9.2 创建 4 张核心表

```bash
dimens-cli sheet create --project-id PUQUNFE --name 客户表
dimens-cli sheet create --project-id PUQUNFE --name 联系人表
dimens-cli sheet create --project-id PUQUNFE --name 跟进记录表
dimens-cli sheet create --project-id PUQUNFE --name 商机表
```

### 9.2.1 为每张核心表确认默认公开视图

```bash
dimens-cli view list --team-id TTFFEN --project-id PUQUNFE --sheet-id sh_customer
dimens-cli view create --team-id TTFFEN --project-id PUQUNFE --sheet-id sh_customer --name 默认视图 --type grid --is-public true --config '{"filters":[],"filterMatchType":"and","sortRule":null,"groupBy":[],"hiddenColumnIds":[],"rowHeight":"medium"}'
```

如果 `view list` 已经有公开默认视图，就跳过 `view create`。

### 9.3 设计关键字段

- 客户表：客户名称、客户编号、客户等级、客户状态、销售负责人、最近跟进时间
- 联系人表：联系人姓名、手机号、职位、所属客户
- 跟进记录表：跟进主题、跟进时间、所属客户、所属联系人、跟进结果
- 商机表：商机名称、所属客户、商机阶段、预计金额、预计成交日期

### 9.4 写案例数据

- 客户表至少覆盖 A/B/C 等级和不同客户状态
- 联系人表至少覆盖一个客户多个联系人
- 商机表至少覆盖不同阶段和不同金额
- 跟进记录表至少覆盖最近跟进和超期未跟进两类情况

### 9.5 做查询验证

- 搜“华东”能搜到客户名称
- 筛 A 级客户能命中客户等级字段
- 按最近跟进时间倒序能排序
- 按所属客户 relation 能查到该客户下全部联系人

---

## 10. 与其他 references 的关系

建议按下面顺序组合使用：

1. 先看本文件，明确搭系统时的默认落地顺序。
2. 再看 `field-design-patterns.md`，把字段设计细化。
3. 再看 `row-filters.md`，把查询验证写成真实结构。
4. 最后看 `examples.md`，确认接口路径、CLI 命令和当前能力状态。
