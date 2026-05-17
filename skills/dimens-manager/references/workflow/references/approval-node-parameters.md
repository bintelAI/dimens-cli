# 审批工作流节点参数说明

本文用于补齐审批工作流每类节点的参数要求。AI 生成审批工作流时，不能只输出 `id/type/label`，必须给出足够参数，让节点能被校验、发布、运行和排查。

## 1. 通用节点结构

每个节点至少包含：

```json
{
  "id": "stable_node_id",
  "type": "start",
  "data": {
    "label": "节点显示名",
    "options": {},
    "inputParams": [],
    "outputParams": []
  }
}
```

通用字段说明：

| 字段 | 是否必填 | 说明 | 生成要求 |
| --- | --- | --- | --- |
| `id` | 是 | 节点唯一标识 | 英文短名，不能重复，不能使用中文空格 |
| `type` | 是 | 节点类型 | 只能使用白名单类型；审批发布草案优先 `start/approval/condition/notification/end` |
| `data.label` | 是 | 节点显示名 | 简短说明业务动作，例如“直属负责人审批” |
| `data.options` | 是 | 节点运行配置 | 即使为空也保留 `{}` |
| `data.inputParams` | 建议 | 节点入参声明 | 开始节点、项目表节点必须写清楚 |
| `data.outputParams` | 建议 | 节点出参声明 | 条件、项目表回写、结束节点建议写清楚 |

每条边至少包含：

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 边唯一标识 |
| `source` | 是 | 来源节点 id，必须存在 |
| `target` | 是 | 目标节点 id，必须存在 |
| `sourceHandle` | 条件节点必填 | 条件分支使用 `source-if` / `source-else` |
| `targetHandle` | 建议 | 常用 `target` |
| `label` | 分支建议 | 分支含义，例如“超过 5000”“不超过 5000”“拒绝” |

## 2. 开始节点：`start`

用途：接收审批发起上下文，尤其是从多维表格 `workflow` 字段发起时的行数据和字段映射。

### 必填参数

| 参数路径 | 类型 | 说明 |
| --- | --- | --- |
| `data.label` | string | 显示名，例如“提交申请” |
| `data.options.approvalInputConfig.sourceType` | string | 固定推荐 `mul_table` |
| `data.options.approvalInputConfig.projectId` | string | 发起审批所在项目 |
| `data.options.approvalInputConfig.sheetId` | string | 发起审批所在表 |
| `data.options.approvalInputConfig.fields` | array | 审批输入字段列表 |
| `data.inputParams` | array | 运行入参，必须包含 `rowId`、`sheetId` 和需要进入 `payload` 的字段 |

### `approvalInputConfig.fields[]`

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `fieldId` | 是 | 多维表字段 ID |
| `fieldName` | 是 | 字段原名 |
| `fieldType` | 是 | 字段类型，例如 `text/number/relation/signature/person` |
| `variableName` | 是 | 进入 `payload` 的变量名，优先稳定英文或字段 ID |
| `label` | 是 | 显示名 |
| `required` | 是 | 是否必填 |
| `permission` | 是 | 发起时字段权限，常用 `editable/readonly/hidden` |
| `includeInPayload` | 是 | 是否进入 `bizData.payload`；审批条件要用的字段必须为 `true` |

### 绑定表格场景详细规则

从多维表格 `workflow` 字段发起审批时，开始节点不是普通表单变量节点，而是“当前项目数据表字段到审批变量”的映射节点。生成时按下面规则处理：

| 规则 | 说明 |
| --- | --- |
| 表来源 | 只绑定当前项目下的数据表，`approvalInputConfig.projectId` 必须与审批工作流所属 `projectId` 一致 |
| 表类型 | 只选择表格类 `sheet`，不要把文档、报表、画布、外部表写成审批输入来源 |
| 入口字段 | 表格里需要有 `workflow` 类型字段绑定该审批流，字段配置包含 `flowId`、`systemView=approval` |
| 业务字段 | `approvalInputConfig.fields[]` 来自同一张表的真实字段，不能编造不存在的 `fieldId` |
| 变量名 | `variableName` 用于 `payload`、条件、审批字段权限和 AI 自动审批；非 `\w` 字符会规范化为 `_`，为空时回退到 `fieldId` |
| 入参 | `data.inputParams` 必须包含 `rowId`、`sheetId`，并包含所有 `includeInPayload=true` 且后续节点会用到的变量 |
| 可见性 | `permission` 是发起时字段权限；审批节点里的 `fieldConfig` 是审批时字段权限，两者不要混用 |
| 变量过滤 | `includeInPayload=false` 的字段不会进入变量选择、审批数据策略和 `payload`，条件或 AI 自动审批不能引用它 |
| 摘要回写 | `workflow` 字段的审批摘要由后端审批链路托管回写，不要生成 `sync_workflow_cell` 节点 |

运行时从 `WorkflowCell` 发起审批时，还需要能构造下面这些上下文；生成草案或落地计划时必须说明这些字段的映射：

| 运行时字段 | 来源 | 作用 |
| --- | --- | --- |
| `flowId` | `workflow` 字段绑定配置 | 定位要启动的审批流 |
| `sourceType` | 固定 `workflow_field` | 标识从表格工作流字段发起 |
| `sourceBizId` | 当前行 `rowId` | 关联业务行 |
| `bizKey` | `sheetId:rowId:fieldId` | 唯一定位审批入口单元格 |
| `sourceSnapshot.projectId` | 当前项目 | 摘要回写和权限上下文 |
| `sourceSnapshot.sheetId` | 当前表 | 摘要回写定位表 |
| `sourceSnapshot.rowId` | 当前行 | 摘要回写定位行 |
| `sourceSnapshot.fieldId` | `workflow` 字段 ID | 摘要回写定位单元格 |
| `bizData.rowData` | 当前行原始数据 | 审批详情展示和兜底查询 |
| `bizData.payload` | `approvalInputConfig.fields[]` 映射结果 | 条件、审批字段权限、AI 自动审批读取的主要变量 |

`globalVariables` 与 `payload` 保持同名即可，不要把整张表字段都塞进去。只声明跨节点会读取的变量，例如 `rowId`、`sheetId`、`amount`、`reason`、`applicantId`。

完整开始节点示例：

```json
{
  "id": "start",
  "type": "start",
  "data": {
    "label": "从报销表提交申请",
    "options": {
      "approvalInputConfig": {
        "sourceType": "mul_table",
        "projectId": "PROJECT_ID",
        "projectName": "财务项目",
        "sheetId": "SHEET_ID",
        "sheetName": "报销申请表",
        "fields": [
          {
            "fieldId": "fld_amount",
            "fieldName": "报销金额",
            "fieldType": "number",
            "variableName": "amount",
            "label": "报销金额",
            "required": true,
            "permission": "editable",
            "includeInPayload": true
          },
          {
            "fieldId": "fld_reason",
            "fieldName": "报销事由",
            "fieldType": "text",
            "variableName": "reason",
            "label": "报销事由",
            "required": true,
            "permission": "editable",
            "includeInPayload": true
          },
          {
            "fieldId": "fld_applicant",
            "fieldName": "申请人",
            "fieldType": "person",
            "variableName": "applicantId",
            "label": "申请人",
            "required": true,
            "permission": "readonly",
            "includeInPayload": true
          },
          {
            "fieldId": "fld_signature",
            "fieldName": "申请人签名",
            "fieldType": "signature",
            "variableName": "applicantSignature",
            "label": "申请人签名",
            "required": false,
            "permission": "editable",
            "includeInPayload": true
          }
        ]
      }
    },
    "inputParams": [
      { "name": "rowId", "field": "rowId", "type": "string", "label": "审批行 Row ID", "required": true },
      { "name": "sheetId", "field": "sheetId", "type": "string", "label": "审批表 Sheet ID", "required": true },
      { "name": "amount", "field": "amount", "type": "number", "label": "报销金额", "required": true },
      { "name": "reason", "field": "reason", "type": "string", "label": "报销事由", "required": true },
      { "name": "applicantId", "field": "applicantId", "type": "string", "label": "申请人", "required": true },
      { "name": "applicantSignature", "field": "applicantSignature", "type": "signature", "label": "申请人签名", "required": false }
    ],
    "outputParams": []
  }
}
```

运行时 payload 示例：

```json
{
  "flowId": 16,
  "sourceType": "workflow_field",
  "sourceBizId": "ROW_ID",
  "bizKey": "SHEET_ID:ROW_ID:WORKFLOW_FIELD_ID",
  "sourceSnapshot": {
    "projectId": "PROJECT_ID",
    "sheetId": "SHEET_ID",
    "rowId": "ROW_ID",
    "fieldId": "WORKFLOW_FIELD_ID"
  },
  "bizData": {
    "rowData": {
      "fld_amount": 6200,
      "fld_reason": "差旅报销",
      "fld_applicant": "u_1001"
    },
    "payload": {
      "rowId": "ROW_ID",
      "sheetId": "SHEET_ID",
      "amount": 6200,
      "reason": "差旅报销",
      "applicantId": "u_1001"
    }
  }
}
```

### 最小示例

```json
{
  "id": "start",
  "type": "start",
  "data": {
    "label": "提交报销申请",
    "options": {
      "approvalInputConfig": {
        "sourceType": "mul_table",
        "projectId": "PROJECT_ID",
        "sheetId": "SHEET_ID",
        "fields": [
          {
            "fieldId": "fld_amount",
            "fieldName": "报销金额",
            "fieldType": "number",
            "variableName": "amount",
            "label": "报销金额",
            "required": true,
            "permission": "editable",
            "includeInPayload": true
          }
        ]
      }
    },
    "inputParams": [
      { "name": "rowId", "field": "rowId", "type": "string", "label": "审批行 Row ID", "required": true },
      { "name": "sheetId", "field": "sheetId", "type": "string", "label": "审批表 Sheet ID", "required": true },
      { "name": "amount", "field": "amount", "type": "number", "label": "报销金额", "required": true }
    ],
    "outputParams": []
  }
}
```

常见错误：

- 只写 `variables`，没有 `approvalInputConfig`，导致表格字段无法映射。
- 条件节点引用 `{{payload.amount}}`，但开始节点没有把 `amount` 加进 `inputParams`。
- 把 `permission` 写成自然语言，例如“可编辑”，应使用 `editable`。
- 绑定非当前项目的表，导致审批入口、权限和摘要回写都无法稳定定位。
- 条件或 AI 自动审批引用 `includeInPayload=false` 的字段。
- 把 `workflow` 字段摘要当作审批业务真值；真实审批判断应读取 `payload`、审批任务和审批实例。

## 3. 审批节点：`approval`

用途：创建人工审批任务；可在节点内部启用 AI 自动审批。

### 必填参数

| 参数路径 | 类型 | 说明 |
| --- | --- | --- |
| `data.label` | string | 审批节点名称 |
| `data.options.approvalType` | string | 审批类型，允许 `single/any/all` |
| `data.options.participantRules` | array | 参与者规则；发布校验不能为空 |
| `data.options.timeout` | number | 超时时间，建议秒级，例如 `86400` |

### `participantRules[]`

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `sourceType` | 是 | 来源类型 |
| `sourceValue` | 视类型而定 | 用户、部门、角色等 ID |
| `sourceName` | 建议 | 显示名 |
| `sourceLabel` | 建议 | 显示名 |

常用 `sourceType`：

| sourceType | sourceValue | 说明 |
| --- | --- | --- |
| `user` | 用户 ID | 指定项目成员；适合固定责任人，例如财务专员 |
| `department` | 部门 ID | 部门内成员；适合“行政部任一成员处理”这类场景 |
| `dept_leader` | 可空或部门 ID | 为空表示发起人部门负责人；有值表示指定部门负责人 |
| `direct_manager` | 空 | 发起人的直属上级；适合主管审批 |
| `project_role` | 项目角色 ID | 项目角色成员；适合按项目权限角色派单 |
| `project_role_owner` | 项目角色 ID | 项目角色负责人；适合角色负责人复核 |

### 可选参数

| 参数路径 | 类型 | 说明 |
| --- | --- | --- |
| `data.options.fieldConfig` | object | 审批时字段权限，值为 `editable/readonly/hidden` |
| `data.options.buttonConfig` | object | 审批按钮显示控制 |
| `data.options.autoApproval` | object | AI 自动审批配置 |
| `data.options.approver` | string | 历史兼容字段；新草案不要只依赖它 |

### 审批节点详细规则

| 配置项 | 生成规则 |
| --- | --- |
| `approvalType` | 发布草案优先用 `single/any/all`；前端历史配置里可能出现 `parallel/serial`，生成新草案时不要默认写这两个值 |
| `approvalStrategy` | 可作为前端展示语义，但服务端发布校验重点仍是 `participantRules` |
| `participantRules` | 必须非空；不要只写自然语言、姓名或 `approver` |
| `fieldConfig` | key 使用开始节点字段的 `variableName`，也可兼容 `fieldId`；值只能是 `editable/readonly/hidden` |
| `buttonConfig` | 只控制按钮文案和显示，不决定审批人解析 |
| `timeout` | 草案优先写秒，例如 1 天 `86400`；如同时写 `timeoutUnit`，必须与秒值语义一致 |
| `autoApproval` | 只能放在审批节点内部；AI 结果只允许自动通过、自动驳回、人工审批三类 |

`fieldConfig` 的可用字段来自开始节点 `approvalInputConfig.fields[]`，并且会过滤 `includeInPayload=false` 和系统字段。审批节点字段权限解析时优先匹配 `variableName`，再兼容匹配 `fieldId`：

```json
{
  "amount": "readonly",
  "reason": "readonly",
  "applicantSignature": "editable"
}
```

不要把 `fieldConfig` 写成字段中文名，例如 `{ "报销金额": "只读" }`，这类配置无法稳定匹配。

### AI 自动审批参数

`autoApproval` 只能放在审批节点内部，不能生成独立 `approval_ai_review` 节点。

| 参数 | 是否必填 | 说明 |
| --- | --- | --- |
| `enabled` | 是 | 是否启用 |
| `fallback` | 是 | 建议 `manual`，表示异常或不确定时转人工 |
| `model/configId/supplier` | 视模型配置而定 | 模型配置来源 |
| `systemPrompt` | 建议 | AI 审批系统提示词 |
| `approveRules` | 建议 | 自动通过规则 |
| `rejectRules` | 建议 | 自动驳回规则 |
| `manualRules` | 建议 | 转人工规则 |
| `userPrompt` | 可选 | 补充上下文 |

AI 自动审批的输出会被归一化为：

| AI 输出 | 归一化动作 | 运行结果 |
| --- | --- | --- |
| `自动通过` / `approve` / `auto_approve` | `auto_approve` | 当前审批任务自动通过，并继续后续节点 |
| `自动驳回` / `reject` / `auto_reject` | `auto_reject` | 当前审批任务自动驳回，并结束或进入拒绝路径 |
| `人工审批` / `manual` / `manual_approval` | `manual` | 保留人工任务 |
| 空值、非法 JSON、未知值、模型异常 | `manual` | 按 `fallback=manual` 转人工 |

如果 AI 规则引用 `{{payload.amount}}`、`{{payload.riskLevel}}` 等变量，这些变量必须来自开始节点且 `includeInPayload=true`。

### 完整示例

```json
{
  "id": "manager_approval",
  "type": "approval",
  "data": {
    "label": "直属负责人审批",
    "options": {
      "approvalType": "single",
      "timeout": 86400,
      "timeoutUnit": "second",
      "participantRules": [
        { "sourceType": "direct_manager", "sourceName": "直属上级", "sourceLabel": "直属上级" }
      ],
      "fieldConfig": {
        "amount": "readonly",
        "reason": "readonly",
        "applicantSignature": "editable"
      },
      "buttonConfig": {
        "approveText": "同意",
        "rejectText": "驳回",
        "commentRequiredOnReject": true
      },
      "autoApproval": {
        "enabled": true,
        "fallback": "manual",
        "approveRules": "报销金额小于 20 且事由完整时自动通过",
        "rejectRules": "报销金额大于 100 且缺少有效说明时自动驳回",
        "manualRules": "金额在 20 到 100 之间、字段缺失、模型无法判断时转人工",
        "userPrompt": "请基于 payload.amount、payload.reason 和申请人信息判断审批动作。"
      }
    },
    "inputParams": [
      { "name": "amount", "field": "amount", "type": "number", "nodeId": "start", "nodeType": "start" },
      { "name": "reason", "field": "reason", "type": "string", "nodeId": "start", "nodeType": "start" }
    ],
    "outputParams": [
      { "name": "approvalAction", "field": "approvalAction", "type": "string" },
      { "name": "approvalComment", "field": "approvalComment", "type": "string" }
    ]
  }
}
```

常见错误：

- `participantRules` 为空，只写了“主管审批”四个字。
- 把审批人写成固定姓名，导致不同项目无法解析。
- 把 AI 自动审批写成独立节点。
- `timeout` 单位混乱；草案里优先用秒，例如一天写 `86400`。
- `fieldConfig` 引用的变量不在开始节点中，或引用了 `includeInPayload=false` 的字段。
- AI 自动审批规则引用了未进入 `payload` 的字段，导致模型无法可靠判断并转人工。

## 4. 条件节点：`condition`

用途：根据 `payload`、系统变量或上游节点输出决定走哪条边。

### 必填参数

| 参数路径 | 类型 | 说明 |
| --- | --- | --- |
| `data.label` | string | 条件说明 |
| `data.options.IF` | array | 条件列表 |
| `data.outputParams` | array | 至少声明 `{ "field": "result", "type": "boolean" }` |
| 出边 `sourceHandle` | string | 必须区分 `source-if` 和 `source-else` |

### IF 条件项

| 字段 | 是否必填 | 说明 |
| --- | --- | --- |
| `field` | 是 | 被判断字段 |
| `template` | 是 | 变量模板，例如 `{{payload.amount}}` |
| `refPath` | 建议 | 同 `template` |
| `nodeId` | 建议 | 变量来源节点，例如 `start` |
| `nodeType` | 建议 | 变量来源类型，例如 `start` |
| `condition` | 是 | 操作符 |
| `value` | 视操作符而定 | 比较值 |
| `operator` | 多条件时使用 | `AND/OR` |

可用操作符：

`include`、`exclude`、`startWith`、`endWith`、`equal`、`notEqual`、`greaterThan`、`greaterThanOrEqual`、`lessThan`、`lessThanOrEqual`、`isNull`、`isNotNull`。

最小示例：

```json
{
  "id": "amount_branch",
  "type": "condition",
  "data": {
    "label": "金额是否超过 5000",
    "options": {
      "IF": [
        {
          "field": "amount",
          "nodeId": "start",
          "nodeType": "start",
          "template": "{{payload.amount}}",
          "refPath": "{{payload.amount}}",
          "condition": "greaterThan",
          "value": "5000"
        }
      ],
      "ELSE": []
    },
    "outputParams": [{ "field": "result", "type": "boolean" }]
  }
}
```

常见错误：

- 条件节点有两个目标，但边没有 `source-if/source-else`。
- `template` 引用的变量没有在开始节点中声明。
- 金额比较写成自然语言，未填 `condition/value`。

## 5. 通知节点：`notification`

用途：发送站内消息通知。审批发布草案可用，普通通知优先 `channel=inbox`。

### 参数说明

| 参数路径 | 是否必填 | 说明 |
| --- | --- | --- |
| `data.label` | 是 | 通知节点名称 |
| `data.options.channel` | 建议 | 推荐 `inbox` |
| `data.options.participantRules` | 建议 | 接收人规则；仅 `sourceType=user` 能直接解析为接收人 |
| `data.options.receiverIds` | 可选 | 明确用户 ID 列表 |
| `data.options.title` | 建议 | 消息标题 |
| `data.options.message/content/summary` | 建议 | 消息内容，支持变量模板 |

最小示例：

```json
{
  "id": "notify_applicant",
  "type": "notification",
  "data": {
    "label": "通知申请人",
    "options": {
      "channel": "inbox",
      "title": "审批结果通知",
      "message": "你的申请 {{payload.rowId}} 已处理",
      "participantRules": [
        { "sourceType": "user", "sourceValue": "1002", "sourceName": "申请人" }
      ]
    }
  }
}
```

常见错误：

- 只写 `recipient` 文本，运行时无法解析为用户。
- 没有 `teamId/projectId` 上下文时期待站内消息一定发送。

## 6. 结束节点：`end`

用途：收口流程。审批发布校验要求至少一个结束节点。

### 参数说明

| 参数路径 | 是否必填 | 说明 |
| --- | --- | --- |
| `data.label` | 是 | 结束状态，例如“审批通过”“审批拒绝” |
| `data.options.result` | 可选 | 结构化结果，例如 `approved/rejected/recalled/timeout` |
| `data.inputParams` | 可选 | 结束输出映射 |

最小示例：

```json
{
  "id": "approved_end",
  "type": "end",
  "data": {
    "label": "审批通过",
    "options": { "result": "approved" },
    "inputParams": [],
    "outputParams": []
  }
}
```

常见错误：

- 只有通过结束，没有拒绝结束。
- 撤回、超时单独编造节点类型；应使用 `end` 的结果语义或运行时接口说明。

## 7. 项目表回写节点：`mul_update_row`

用途：真实案例 17 中使用过，用于审批后新增或修改项目表行。注意：项目审批流发布接口可能不接受该类型；如果发布接口不支持，就写入落地计划，不放进发布草案。

### 参数说明

| 参数路径 | 是否必填 | 说明 |
| --- | --- | --- |
| `type` | 是 | 固定 `mul_update_row` |
| `data.options.targetProjectId` | 是 | 目标项目 ID |
| `data.options.sheetId` | 是 | 目标表 ID |
| `data.options.rowIdTemplate` | 可选 | 行 ID；为空时创建新行 |
| `data.options.fieldMappingsJson` | 是 | JSON 对象字符串，key 为目标字段 ID，value 为固定值或变量模板 |
| `data.options.targetBinding` | 建议 | 可视化绑定信息，包含项目、表、字段映射 |
| `data.inputParams` | 建议 | 映射中引用到的变量 |
| `data.outputParams` | 建议 | `data.row`、`data.rowId`、`data.updated` |

最小示例：

```json
{
  "id": "update_expense_row",
  "type": "mul_update_row",
  "data": {
    "label": "写回报销表",
    "options": {
      "targetProjectId": "PROJECT_ID",
      "sheetId": "TARGET_SHEET_ID",
      "rowIdTemplate": "",
      "fieldMappingsJson": "{\"fld_amount\":\"{{payload.amount}}\",\"fld_title\":\"财务出差报销\"}"
    },
    "inputParams": [
      { "name": "amount", "type": "any", "field": "amount", "nodeId": "start", "nodeType": "start" }
    ],
    "outputParams": [
      { "name": "data.row", "type": "object", "field": "data.row" },
      { "name": "data.rowId", "type": "string", "field": "data.rowId" },
      { "name": "data.updated", "type": "boolean", "field": "data.updated" }
    ]
  }
}
```

常见错误：

- 把回写写成 `action` 或 `sync_workflow_cell`。
- `fieldMappingsJson` 不是合法 JSON 对象。
- 目标字段 ID 不存在，运行时会被过滤，导致没有可写字段。
- 把 `workflow` 字段摘要回写和项目表行回写混为一谈；`workflow` 字段摘要优先由后端审批链路托管回写。

## 8. 生成前参数自检

输出审批工作流前逐项自检：

1. 每个节点都有 `id/type/data.label/data.options`。
2. `start` 有 `approvalInputConfig` 和 `inputParams`。
3. 每个 `approval` 有 `approvalType/participantRules/timeout`。
4. AI 自动审批只存在于 `approval.data.options.autoApproval`。
5. 每个 `condition` 有 `IF` 条件和 `source-if/source-else` 出边。
6. 每个 `notification` 有可解析的接收人规则或 `receiverIds`。
7. 每个 `end` 能表达结果状态。
8. 如出现 `mul_update_row`，必须说明发布接口边界并补齐目标表和字段映射。
9. 不出现 `action/sync_workflow_cell/approval_ai_review/withdraw_end/timeout_end/auto_archive` 这类不存在或已废弃的节点类型。
