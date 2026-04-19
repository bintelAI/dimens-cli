# dimens-report 接口案例

本文档聚焦维表智联当前已经落地的报表模块接口，按接口维度整理：

1. 报表列表 / 详情 / 增删改
2. 图表组件接口
3. 查询执行接口
4. 模板接口
5. 版本接口

当前 `dimens-cli` 还没有直接封装报表命令，所以这里的案例主要服务于 Skill 解释与后续 CLI 扩展，不伪装成“已经有现成 CLI 命令”。

更细的规则说明请分别查看：

- `usage.md`
- `capability-status.md`

---

## 1. 报表主资源接口

### 1.1 路径前缀

| 项 | 内容 |
| --- | --- |
| 前缀 | `/app/report/:projectId` |
| 入口角色 | 报表主资源入口 |

### 1.2 查询报表列表

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/report/:projectId/list` |
| 鉴权 | `Authorization: Bearer {token}` |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `keyword` | `string` | 否 | 关键词 |
| `type` | `string` | 否 | 报表类型 |
| `status` | `number` | 否 | 状态 |
| `page` | `number` | 否 | 页码，默认 `1` |
| `size` | `number` | 否 | 每页条数，默认 `20` |

### 1.3 查询报表详情

| 项 | 内容 |
| --- | --- |
| 方法 | `GET` |
| 路径 | `/app/report/:projectId/info?reportId=:reportId` |
| 鉴权 | `Authorization: Bearer {token}` |

查询参数：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `reportId` | `string` | 是 |

返回重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.reportId` | `string` | 报表 ID |
| `data.projectId` | `string` | 所属项目 |
| `data.config` | `object` | 报表配置 |
| `data.widgets` | `array` | 组件列表 |
| `data.parameters` | `array` | 参数列表 |

### 1.4 新增报表

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/report/:projectId/add` |

请求体重点：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 报表名 |
| `description` | `string` | 否 | 描述 |
| `type` | `string` | 否 | 报表类型 |
| `config` | `object` | 否 | 报表整体配置 |
| `widgets` | `array` | 否 | 初始组件 |
| `parameters` | `array` | 否 | 初始参数 |

成功返回：

```json
{
  "code": 1000,
  "message": "success",
  "data": {
    "reportId": "report_xxx"
  }
}
```

### 1.5 更新 / 删除 / 复制 / 发布 / 归档 / 排序 / 移动 / 校验

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/app/report/:projectId/update` | 更新报表 |
| `POST` | `/app/report/:projectId/delete` | 删除报表 |
| `POST` | `/app/report/:projectId/copy` | 复制报表 |
| `POST` | `/app/report/:projectId/publish` | 发布报表 |
| `POST` | `/app/report/:projectId/archive` | 归档报表 |
| `POST` | `/app/report/:projectId/sort` | 排序 |
| `POST` | `/app/report/:projectId/move` | 移动到其他项目 |
| `POST` | `/app/report/:projectId/validate` | 校验报表配置 |

Skill 在解释报表生命周期时，至少要把这些接口区分清楚，不要把“详情查询”和“发布/归档/校验”混成一个概念。

---

## 2. 图表组件接口

### 2.1 路径前缀

| 项 | 内容 |
| --- | --- |
| 前缀 | `/app/report/widget/:projectId` |
| 入口角色 | 图表组件入口 |

### 2.2 新增组件

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/report/widget/:projectId/add` |

请求体重点：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reportId` | `string` | 是 | 报表 ID |
| `type` | `string` | 是 | 组件类型 |
| `title` | `string` | 否 | 组件标题 |
| `dataSource` | `object` | 是 | 数据源定义 |
| `layout` | `object` | 否 | 布局信息 |
| `dataMapping` | `object` | 否 | 字段映射 |
| `chartConfig` | `object` | 否 | 图表配置 |
| `orderNum` | `number` | 否 | 排序 |

成功返回：

```json
{
  "code": 1000,
  "message": "success",
  "data": {
    "widgetId": "widget_xxx"
  }
}
```

### 2.3 更新 / 删除 / 排序 / 批量覆盖

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/app/report/widget/:projectId/update` | 更新组件 |
| `POST` | `/app/report/widget/:projectId/delete` | 删除组件 |
| `POST` | `/app/report/widget/:projectId/sort` | 调整排序 |
| `POST` | `/app/report/widget/:projectId/batch` | 以 widgets 数组整批重建 |

`batch` 请求体重点：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `reportId` | `string` | 是 |
| `widgets` | `array` | 是 |

Skill 在解释“组件为什么丢了”或“组件顺序为什么变了”时，必须知道存在 `batch` 这种整批覆盖写法。

---

## 3. 报表查询接口

### 3.1 路径前缀

| 项 | 内容 |
| --- | --- |
| 前缀 | `/app/report/query/:projectId` |
| 入口角色 | 报表查询入口 |

### 3.2 执行整个报表查询

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/report/query/:projectId` |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reportId` | `string` | 是 | 报表 ID |
| `parameterValues` | `object` | 否 | 参数值 |
| `widgetIds` | `string[]` | 否 | 仅查询指定组件 |

返回特点：

- 返回按 `widgetId` 聚合的结果
- 每个组件单独查询
- 查询日志会记录耗时、结果条数、成功/失败状态

### 3.3 查询单个组件

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/report/query/:projectId/widget` |

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `reportId` | `string` | 是 | 报表 ID |
| `widgetId` | `string` | 是 | 组件 ID |
| `parameterValues` | `object` | 否 | 参数值 |
| `dataSource` | `object` | 否 | 临时覆盖组件数据源 |
| `dataMapping` | `object` | 否 | 临时覆盖数据映射 |

成功返回：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.data` | `array` | 组件查询结果 |
| `data.total` | `number` | 结果总数 |

失败返回：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.error` | `string` | 错误消息 |

### 3.4 数据预览

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/report/query/:projectId/preview` |

请求体：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `dataSource` | `object` | 是 |
| `dataMapping` | `object` | 否 |
| `parameterValues` | `object` | 否 |

这条接口是 Skill 解释“为什么图表空白，但其实查询本身没问题”时很关键的一条辅助接口。

---

## 4. 报表模板接口

### 4.1 路径前缀

| 项 | 内容 |
| --- | --- |
| 前缀 | `/app/report/template` |
| 入口角色 | 报表模板入口 |

## 6. 这份文档的职责边界

这份文档只负责接口级案例总览，不再展开：

- 报表主资源、组件、查询、参数联动之间的业务分层
- 当前能力是否已 CLI 化

这些内容已经拆到独立 references 中，方便后续 Skill 精确引用。

### 4.2 模板列表

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/report/template/list` |

请求体：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `category` | `string` | 否 |
| `keyword` | `string` | 否 |
| `page` | `number` | 否 |
| `size` | `number` | 否 |

### 4.3 模板详情

| 方法 | 路径 |
| --- | --- |
| `GET` | `/app/report/template/info?templateId=:templateId` |

### 4.4 模板分类

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/report/template/categories` |

### 4.5 应用模板到项目

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/report/template/:projectId/apply` |

请求体：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `templateId` | `number` | 是 |
| `name` | `string` | 否 |

成功返回：

```json
{
  "code": 1000,
  "message": "success",
  "data": {
    "reportId": "report_xxx"
  }
}
```

---

## 5. 报表版本接口

### 5.1 路径前缀

| 项 | 内容 |
| --- | --- |
| 前缀 | `/app/report/version/:projectId` |
| 入口角色 | 报表版本入口 |

### 5.2 版本列表

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/report/version/:projectId/list` |

请求体：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `reportId` | `string` | 是 |
| `page` | `number` | 否 |
| `size` | `number` | 否 |

### 5.3 版本详情

| 方法 | 路径 |
| --- | --- |
| `GET` | `/app/report/version/:projectId/info?versionId=:versionId` |

### 5.4 版本对比

| 方法 | 路径 |
| --- | --- |
| `POST` | `/app/report/version/:projectId/compare` |

请求体：

| 字段 | 类型 | 必填 |
| --- | --- | --- |
| `sourceVersionId` | `string` | 是 |
| `targetVersionId` | `string` | 是 |

---

## 6. Skill 输出要求

当用户提到报表、图表、数据源、参数联动时，Skill 至少要说清：

1. 当前问题属于报表主资源、组件、查询、模板还是版本。
2. 具体接口路径是什么。
3. 请求里哪些字段是核心入参，例如 `projectId`、`reportId`、`widgetId`、`parameterValues`。
4. 报表能打开但没数据时，不能只盯页面，要继续检查 query / widget / preview 这几层。
5. 当前 `dimens-cli` 还没有直接封装报表命令，因此这里是 server 真实接口案例，不要误写成已存在 CLI 命令。
