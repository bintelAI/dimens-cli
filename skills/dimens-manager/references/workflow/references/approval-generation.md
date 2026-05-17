# 审批工作流生成规范

本文档用于指导 AI 根据用户描述生成可落地的审批工作流。它属于 `dimens-manager` 的工作流章节，不新增顶层 Skill。

## 1. 适用场景

当用户提出下面这类需求时，优先使用本文档：

| 用户表达 | 默认意图 |
| --- | --- |
| AI 自动生成审批工作流 | 生成审批流定义草案，并给出落地步骤 |
| 一键生成业务审批流程 | 从业务规则抽取触发条件、审批节点、分支和动作 |
| 请假 / 报销 / 采购 / 合同审批流程 | 按真实业务表单字段和角色生成审批链路 |
| 审批节点自动化处理 | 在人工审批节点前后补通知、回写和归档节点 |
| 把审批流程挂到项目里 | 补齐团队定义、项目挂载、系统视图与权限检查 |

如果用户说的是“生成一个审批系统”，这是系统级建设需求，应先路由到 `dimens-system-orchestrator`；如果用户说的是“生成审批工作流 / 审批流程 / 审批节点”，才进入本文档。

## 2. 执行前必须收集的信息

AI 生成审批工作流前，至少要明确下面信息：

| 信息 | 说明 | 缺失时默认处理 |
| --- | --- | --- |
| `teamId` | 团队隔离上下文 | 不能执行真实写入，只能生成方案和草案 |
| `projectId` | 项目创建上下文 | 允许直接创建项目内审批流；缺失时只能生成草案，不能落到项目路由 |
| 业务对象 | 例如请假单、报销单、采购单、合同 | 从用户描述抽取，没有则先问清 |
| 发起入口 | 通常是多维表格 `workflow` 字段 | 默认按表格字段发起和展示摘要 |
| 审批角色 | 直接主管、部门负责人、财务、法务、管理员等 | 缺失时使用角色占位，不写死用户 |
| 条件分支 | 金额、天数、风险等级、合同类型等 | 没有则生成直线审批链路 |
| 结束动作 | 通过、拒绝、撤回、超时、回写字段、通知 | 默认包含通过、拒绝、撤回三类 |

## 2.1 节点类型硬约束

AI 生成的审批工作流节点必须是当前系统已经存在或发布接口能规范化的节点类型，禁止为了业务语义临时编造节点。

项目审批流创建 / 发布接口可接受的主类型：

| 草案中可写 | 服务端规范化后 | 用途 |
| --- | --- | --- |
| `start` | `approval_start` | 审批开始节点 |
| `approval` | `approval_user_task` | 人工审批节点，可在节点配置里开启 AI 自动审批 |
| `condition` | `approval_condition` | 条件分支节点 |
| `notification` | `approval_notify` | 通知节点 |
| `end` | `approval_end` | 结束节点 |

历史案例和通用工作流里已经出现，但发布接口要谨慎处理的类型：

| 类型 | 用途 | 使用原则 |
| --- | --- | --- |
| `judge` | 条件分支 | 真实案例 17 出现过，新生成优先用 `condition` |
| `mul_update_row` | 修改项目表行 | 真实案例 17 出现过；发布接口不支持时，改为后置写回计划，不要强行塞进发布草案 |

禁止生成：

- `action`：不是当前审批发布白名单节点。
- `sync_workflow_cell`：是业务动作名，不是节点类型。
- `approval_ai_review`：已废弃；AI 自动审批要配置在 `approval.data.options.autoApproval`。

生成前必须先做一次节点类型检查：`nodes[].type` 只能来自上面表格或明确说明为历史兼容节点。

选定节点类型后必须继续按 `approval-node-parameters.md` 补齐参数。输出草案时，每个节点至少要包含 `id/type/data.label/data.options`；开始、审批、条件、通知、结束、项目表回写节点还要补齐各自必填参数。

## 3. 生成结果分三层

AI 输出不能只给自然语言说明，必须按三层组织。

### 3.1 业务审批蓝图

蓝图用于让用户确认业务规则，至少包含：

- 触发条件
- 申请人输入字段
- 审批角色与顺序
- 条件分支
- 自动化动作
- 结束状态
- 异常路径

### 3.2 工作流图草案

草案用于落到 `flow_info.draft/data`，建议输出 JSON 对象，至少包含：

```json
{
  "pluginType": "approval",
  "nodes": [],
  "edges": [],
  "globalVariables": [],
  "meta": {
    "source": "dimens-manager",
    "scenario": "approval-generation"
  }
}
```

说明：

- `pluginType` 固定为 `approval`。
- `nodes` 和 `edges` 必须稳定可读，节点 `id` 使用英文短名。
- 每个节点必须按 `approval-node-parameters.md` 补齐参数，不能只输出节点壳。
- `globalVariables` 只放跨节点共享的变量，不要把整张表字段全部塞进去。
- 如果审批从表格行发起，必须按 `approval-node-parameters.md` 的“绑定表格场景详细规则”补齐 `approvalInputConfig`、`inputParams`、`sourceSnapshot`、`bizData.payload`，`globalVariables` 必须能从 `bizData.payload` 映射出来；字段绑定与行数据链路看 `field-binding.md`。
- 如果只是文档草案，不要声称已经创建或发布了工作流。

### 3.3 项目落地计划

落地计划必须覆盖：

1. 如果有 `projectId`，优先直接调用项目内创建接口生成审批流。
2. 保存草稿并调试。
3. 发布工作流。
4. 验证项目内审批流是否可在当前项目中直接读取和执行。
5. 如果还存在团队级复用需求，再考虑团队安装实例或项目绑定。
6. `systemView` 设置为 `approval`。
7. 在表格里用 `workflow` 类型字段作为发起入口。
8. 验证审批实例、任务、候选人、动作日志和字段摘要回写。
9. 如果绑定到具体行数据，补齐 `sheetId/rowId/fieldId`、`sourceSnapshot` 和 `bizData.payload` 映射。

## 4. 审批节点结构

审批工作流生成时，先按“核心必备节点”和“按场景补充节点”拆开，不要把可选节点写成必备，也不要少掉拒绝路径。

### 4.1 核心必备节点

| 节点语义 | 是否必备 | 推荐 id 示例 | 必填配置 | 常见可选配置 | 少了会怎样 |
| --- | --- | --- | --- | --- | --- |
| 开始节点 | 必备 | `start` | `label`, `approvalInputConfig`, `inputParams` | `projectName`, `sheetName`, `globalVariables` | 没有表格字段映射，后续审批节点拿不到申请单上下文 |
| 表单校验 | 按需 | `validate_request` | `label`, `rules` | `failMessage`, `haltOnFail` | 校验规则不完整时，草案一执行就容易报参数或规则错误；发布草案里可用 `condition` 表达 |
| 条件判断 | 按需，但审批分支常用 | `amount_branch` | `label`, `expression` 或 `rules` | 边标签 `通过/驳回/超过阈值/不超过阈值` | 分支条件不明确会导致连线方向和业务语义混乱 |
| 人工审批 | 大多数审批必备 | `manager_approval` | `label`, `participantRules` | `timeout`, `autoApproval`, `fieldConfig` | 没有参与者规则时，发布会报“审批节点必须配置参与者规则” |
| 多级审批 | 按需 | `finance_approval` | `label`, `participantRules` | `timeout`, `autoApproval`, `fieldConfig` | 多级审批少了这一层，会把财务、法务、负责人等关键节点跳过去 |
| 通过终点 | 必备 | `approved_end` | `label`, `result` | `summary`, `notifyTemplate` | 没有通过终点，流程无法正常收口 |
| 拒绝终点 | 必备 | `rejected_end` | `label`, `result` | `reasonField`, `notifyTemplate` | 没有拒绝终点，拒绝路径会断掉，容易出现悬挂状态 |

### 4.2 按场景补充节点

| 节点语义 | 是否必备 | 推荐 id 示例 | 必填配置 | 常见可选配置 | 少了会怎样 |
| --- | --- | --- | --- | --- | --- |
| 通知节点 | 推荐 | `notify_result` | `label`, `recipients`, `template` 或 `message` | `trigger`, `notifyApplicant`, `notifyApprovers` | 没有通知配置时，审批结束后只能“默默结束” |
| 项目表回写节点 | 按需 | `update_expense_row` | `targetProjectId`, `sheetId`, `fieldMappingsJson` | `targetBinding`, `rowIdTemplate` | 只能使用已存在的 `mul_update_row` 类型；如果发布接口不支持，写入落地计划，不放进发布草案 |
| 归档动作 | 按需 | 不单独生成节点 | 在落地计划中说明归档字段、目标状态、执行时机 | `archiveReason`, `writeBackFields` | 当前发布草案不把归档写成新节点类型 |
| 撤回结果 | 按需 | 使用 `end` | `label=审批撤回` 或在运行时撤回接口收口 | `reasonField` | 用户要求“可撤回”时，说明撤回接口和结果语义，不编造 `withdraw_end` |
| 超时结果 | 按需 | 使用 `end` 或审批节点超时配置 | `timeout`、超时处理说明 | `timeoutMinutes`, `escalation` | 有超时要求时放到审批节点配置或落地计划，不编造 `timeout_end` |

### 4.3 节点配置原则

1. `node.id` 必须稳定、唯一，建议使用英文短名，不要用中文和空格。
2. 每个审批节点都必须明确“谁来处理”，发布草案优先用 `participantRules`；历史案例里的 `approver` 可作为兼容形态参考，但不要写死自然人姓名。
3. 条件节点必须至少有两条出边，且边标签要能看出分支含义。
4. 通知、项目表回写、归档类节点如果被使用，就必须填完整目标配置，不能只留空壳。
5. 终点必须能区分通过、拒绝、撤回、超时等不同结果，不要把所有结果都落到一个终点里。
6. 不要硬编 `withdraw_end`、`timeout_end`、`auto_archive` 这类不存在的节点类型，改用 `end` 节点的 `label/result`、审批节点 `timeout` 或落地计划表达语义。
7. 如果某个场景不需要通知、回写或归档，就不要为了“凑节点数”强行加节点。
8. AI 自动审批不是独立节点，必须放进 `approval` 节点的 `data.options.autoApproval`。
9. 从表格发起审批时，开始节点必须绑定当前项目真实 `sheet` 和真实字段；审批节点的 `fieldConfig`、条件节点、AI 自动审批只能引用开始节点已经进入 `payload` 的变量。

## 5. 最小 JSON 模板

下面模板适合“普通金额审批”场景，优先满足项目审批流发布接口；项目表行回写作为可选落地步骤处理，不在发布草案中生成不存在节点：

```json
{
  "pluginType": "approval",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "data": {
        "label": "提交申请",
        "options": {
          "approvalInputConfig": {
            "sourceType": "mul_table",
            "projectId": "PROJECT_ID",
            "sheetId": "SHEET_ID",
            "fields": [
              {
                "fieldId": "amount",
                "fieldName": "报销金额",
                "fieldType": "number",
                "variableName": "amount",
                "label": "报销金额",
                "required": true,
                "permission": "editable",
                "includeInPayload": true
              },
              {
                "fieldId": "reason",
                "fieldName": "报销事由",
                "fieldType": "text",
                "variableName": "reason",
                "label": "报销事由",
                "required": true,
                "permission": "editable",
                "includeInPayload": true
              }
            ]
          }
        },
        "inputParams": [
          { "name": "rowId", "type": "string", "field": "rowId", "label": "审批行 Row ID", "required": true },
          { "name": "sheetId", "type": "string", "field": "sheetId", "label": "审批表 Sheet ID", "required": true },
          { "name": "amount", "type": "number", "field": "amount", "label": "报销金额", "required": true },
          { "name": "reason", "type": "string", "field": "reason", "label": "报销事由", "required": true }
        ],
        "outputParams": []
      }
    },
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
        "outputParams": [{ "type": "boolean", "field": "result" }]
      }
    },
    {
      "id": "manager_approval",
      "type": "approval",
      "data": {
        "label": "直属负责人审批",
        "options": {
          "approvalType": "single",
          "timeout": 86400,
          "participantRules": [
            { "sourceType": "project_role", "sourceValue": "ROLE_DIRECT_MANAGER" }
          ]
        }
      }
    },
    {
      "id": "finance_approval",
      "type": "approval",
      "data": {
        "label": "财务复核",
        "options": {
          "approvalType": "single",
          "timeout": 86400,
          "participantRules": [
            { "sourceType": "project_role", "sourceValue": "ROLE_FINANCE_REVIEWER" }
          ]
        }
      }
    },
    {
      "id": "approved_end",
      "type": "end",
      "data": {
        "label": "审批通过"
      }
    },
    {
      "id": "rejected_end",
      "type": "end",
      "data": {
        "label": "审批拒绝"
      }
    }
  ],
  "edges": [
    { "id": "edge_start_amount", "source": "start", "target": "amount_branch", "sourceHandle": "source", "targetHandle": "target" },
    { "id": "edge_amount_finance", "source": "amount_branch", "target": "finance_approval", "sourceHandle": "source-if", "targetHandle": "target", "label": "超过 5000" },
    { "id": "edge_amount_manager", "source": "amount_branch", "target": "manager_approval", "sourceHandle": "source-else", "targetHandle": "target", "label": "不超过 5000" },
    { "id": "edge_manager_end", "source": "manager_approval", "target": "approved_end", "sourceHandle": "source", "targetHandle": "target", "label": "同意" },
    { "id": "edge_manager_reject", "source": "manager_approval", "target": "rejected_end", "label": "拒绝" },
    { "id": "edge_finance_end", "source": "finance_approval", "target": "approved_end", "sourceHandle": "source", "targetHandle": "target", "label": "同意" },
    { "id": "edge_finance_reject", "source": "finance_approval", "target": "rejected_end", "label": "拒绝" }
  ],
  "globalVariables": [
    { "key": "rowId", "type": "string", "required": true },
    { "key": "applicantId", "type": "string", "required": true },
    { "key": "amount", "type": "number", "required": true },
    { "key": "reason", "type": "string", "required": true }
  ],
  "meta": {
    "source": "dimens-manager",
    "scenario": "approval-generation"
  }
}
```

如果业务要求审批通过后写入另一张项目表，不能生成 `type=action`。可选方案：

1. 发布接口草案保持上面的白名单节点。
2. 在落地计划里补充“通过后增加项目表回写能力”。
3. 如果使用通用工作流兼容节点，节点类型必须是 `mul_update_row`，配置 `targetProjectId/sheetId/fieldMappingsJson/targetBinding`，并说明发布接口可能需要服务端能力确认。

## 5.1 真实案例参考

生成审批流前优先对照 `approval-existing-cases.md`：

- 案例 16 是 `start -> approval -> approval -> end` 的两级人工审批。
- 案例 17 是 `start -> judge -> approval / approval -> mul_update_row -> end` 的条件分支、AI 自动审批配置和项目表回写案例。
- 两个案例都证明：AI 自动审批放在 `approval.data.options.autoApproval`，项目表写回使用 `mul_update_row`，不要生成独立 `approval_ai_review` 或 `action` 节点。

## 6. 项目挂载规则

审批工作流要进入项目业务入口，不能只创建团队工作流定义。

必须检查：

- 工作流是否已发布。
- `usageType` 是否为 `approval`。
- 项目绑定关系是否存在。
- `systemView` 是否为 `approval`。
- 当前用户是否具备项目可见和审批操作权限。
- 表格是否已有 `workflow` 类型字段作为发起入口。
- 如果从行发起，是否能构造 `sourceSnapshot.projectId/sheetId/rowId/fieldId`。
- 审批变量是否能从 `bizData.rowData` 或 `bizData.payload` 中读取。

一句话规则：

**团队工作流负责定义，项目绑定负责入口，审批运行表负责真值，`workflow` 字段只负责发起和展示摘要。**

字段绑定、行数据发起和摘要回写细节看 `field-binding.md`。

## 7. 当前 CLI 能力边界

当前 `dimens-cli` 已封装的是 `ai chat-completions` 等运行/调用入口；项目内审批流创建、更新、发布已经有独立服务端路由，但不等于 CLI 已完整封装。

因此 Skill 输出时必须区分：

| 输出内容 | 可以怎么说 |
| --- | --- |
| 生成审批工作流草案 | 可以直接输出 JSON 和落地步骤 |
| 调用 AI 辅助生成 | 可用 `dimens-cli ai chat-completions` 让模型产出草案 |
| 创建 / 更新 / 发布项目审批流 | 优先说明项目内路由 `/app/approval/:teamId/:projectId/workflow/create|update|publish`，并明确创建结果是项目归属，不是团队安装实例 |
| 回查项目审批流 | 使用 `/app/approval/:teamId/:projectId/workflow/info?flowId=<id>` 或 `/app/approval/:teamId/:projectId/workflow/page?page=1&size=20&keyword=<keyword>` |
| 团队工作流安装 / 跨项目绑定 | 说明仍需要看团队定义、项目挂载和绑定关系 |
| 验证运行结果 | 需要看审批实例、任务、候选人、日志、字段摘要和权限 |

接口请求体要点：

- `create`：`POST /app/approval/:teamId/:projectId/workflow/create`，请求体包含 `name`、`label`、`description?`、`draft`。
- `update`：`POST /app/approval/:teamId/:projectId/workflow/update`，请求体包含 `flowId`，可带 `name`、`description`、`draft`、`status`。
- `publish`：`POST /app/approval/:teamId/:projectId/workflow/publish`，请求体包含 `flowId`。
- `draft` 当前服务端会规范化并保存 `nodes/edges`；`globalVariables/meta` 更适合保存在节点 `data.options` 或外部草案文件中，不能依赖发布后顶层字段一定保留。
- 审批节点发布校验要求：有且只有一个 `approval_start`，至少一个 `approval_user_task`，至少一个 `approval_end`，连线必须可达；每个 `approval_user_task` 的 `data.options.participantRules` 不能为空。
- 参与者规则可使用 `sourceType=project_role` 并传项目角色 `roleId`，例如财务负责人、HR负责人、管理员等。
- 发布接口不支持 `action`、`sync_workflow_cell`、`mul_update_row` 时，不要把它们塞进发布草案；项目表写回作为后置落地计划或通用工作流兼容节点单独说明。

## 8. 推荐 AI 提示语

```text
你是维表智联审批工作流生成助手。
请根据我的业务描述，输出三部分：
1. 业务审批蓝图
2. pluginType=approval 的工作流 JSON 草案，包含 nodes、edges、globalVariables、meta
3. 项目落地计划，覆盖项目内创建接口、发布、workflow 字段入口、权限和运行验证

业务描述：
{{用户业务描述}}

约束：
- 不要新增顶层 Skill
- 不要把审批画布等同于可执行审批工作流
- 不要声称 server-only 能力已被 CLI 完整封装
- 审批真值以后端审批实例表为准，表格 workflow 字段只展示摘要
- 节点类型只能使用 start/approval/condition/notification/end；如需项目表写回，只能说明 mul_update_row 后置能力，不能生成 action/sync_workflow_cell
```

## 9. 项目内创建接口

当 `projectId` 已知时，优先输出下面这个创建请求，而不是只给团队级草案：

```http
POST /app/approval/:teamId/:projectId/workflow/create
```

请求体示例：

```json
{
  "name": "报销审批",
  "label": "expense_approval",
  "description": "5000 元以内直属负责人审批，超过 5000 元追加财务复核",
  "draft": {
    "nodes": [],
    "edges": []
  }
}
```

返回语义里需要特别关注：

- `ownerScope = project`：这是项目归属审批流。
- `usageType = approval`：这是审批类型，不是通用工作流。
- `projectId = 当前项目`：说明它已经落在目标项目中。
- `bindScope = unbound`：这是这个创建路径的正常语义，不代表创建失败。
- `isInstalledInstance = false`：说明它不是团队安装实例，而是项目内直接创建的审批流。

如果后续要更新、发布或分页读取，继续使用同一条项目路由。

## 10. 验证清单

生成审批工作流后，至少按下面清单检查：

- 节点是否存在唯一 `id`。
- 节点 `type` 是否来自白名单；不能出现 `action/sync_workflow_cell/approval_ai_review`。
- 每个节点是否按 `approval-node-parameters.md` 补齐必填参数。
- 连线 `source/target` 是否都能指向已有节点。
- 是否至少有开始、人工审批、通过结束、拒绝结束四类节点。
- 条件分支是否有清晰的通过和异常路径。
- 审批人是否用角色、部门或人员策略表达，而不是写死姓名。
- 是否说明了 `teamId/projectId/systemView=approval`。
- 是否说明了 `workflow` 字段入口和摘要回写边界。
- 如果绑定行数据，是否说明了 `sheetId/rowId/fieldId`、`sourceSnapshot` 和 `bizData.payload` 映射。
- 是否区分了 CLI 已封装能力与 server-only 能力。

### 10.1 更细的节点校验

- `start` 是否包含能串起整条审批链路的上下文变量。
- `validate_request` 是否把必填字段和失败处理写明。
- 每个审批节点是否都能定位到明确审批人策略。
- 条件节点是否至少有两条有意义的出边。
- 通知节点是否明确通知对象和触发时机。
- 项目表回写如果存在，是否使用 `mul_update_row` 并说明发布接口边界；`workflow` 字段摘要是否交给后端托管回写。
- 拒绝路径是否直达 `rejected_end` 或拒绝终点链路。
- 通过路径是否直达 `approved_end` 或通过终点链路。
- 是否存在没有后继节点的“悬挂节点”。
- 是否存在重复 `id` 或指向不存在节点的边。

### 10.2 场景模板校验

- 请假模板至少要能覆盖单级审批和多天数升级两种情况。
- 报销模板至少要能覆盖金额阈值分支和财务复核。
- 采购模板至少要能覆盖金额分支和合规检查扩展位。
- 合同模板至少要能覆盖法务审批和拒绝通知。

## 11. 常见报错与修正

| 报错 / 异常 | 常见原因 | 修正方式 |
| --- | --- | --- |
| 只有开始和结束，没有审批节点 | 把审批流写成了普通动作流 | 补 `manager_approval`，必要时再补 `finance_approval` |
| 审批节点报“找不到审批人” | `participantRules` 为空，或历史 `approver` 无法解析为候选人 | 先明确使用项目角色、部门还是指定人员，再补参与者规则 |
| 条件分支跑偏 | `expression`、`rules` 或边标签不清楚 | 让分支条件和边标签一一对应，避免一条边承载多个语义 |
| 拒绝后没有结束 | 只有通过终点，没有拒绝终点 | 必须补 `rejected_end`，并让拒绝边直接指向它 |
| 回写字段没有变化 | 把回写写成了不存在的 `sync_workflow_cell/action`，或 `mul_update_row` 缺少目标表字段映射 | 先确认是 `workflow` 摘要托管回写还是项目表行回写；项目表行回写用 `mul_update_row` |
| 通知没发出去 | `recipients` 或 `template/message` 为空 | 先确认通知对象，再决定模板或消息内容 |
| 草案能看懂但运行时报错 | 节点 id 重复、边指向不存在节点、或用了未支持的节点类型 | 先查节点唯一性和边连通性，再对照当前实现收敛节点类型 |

## 12. 标准审批场景模板

下面四类模板是最常见的审批工作流场景。生成时不要从零发散，优先在这些模板上按业务字段做增删。

### 12.1 请假审批

适用场景：年假、事假、调休、病假、外出申请。

建议节点：

```text
start -> validate_request -> manager_approval -> approved_end
                             └-> rejected_end
```

建议补充条件：

- 请假天数大于阈值时，增加部门负责人审批。
- 病假、外出类可根据类型增加附件或证明材料校验。
- 超过某个天数时，增加行政复核。

### 12.2 报销审批

适用场景：差旅报销、办公报销、采购报销、业务招待。

建议节点：

```text
start -> validate_request -> amount_branch -> manager_approval -> approved_end
                                       ├-> finance_approval -> approved_end
                                       └-> rejected_end
```

建议补充条件：

- 金额低于阈值时只走直属负责人审批。
- 金额高于阈值时增加财务复核。
- 涉及票据或附件时必须加附件校验节点。

### 12.3 采购审批

适用场景：物料采购、服务采购、固定资产采购、供应商比价。

建议节点：

```text
start -> validate_request -> amount_branch -> manager_approval -> finance_approval -> approved_end
                                     └-> rejected_end
```

建议补充条件：

- 金额超过阈值时，增加更高层级审批。
- 涉及供应商选择时，增加比价或合规检查节点。
- 固定资产类采购可增加资产编码或入账校验节点。

### 12.4 合同审批

适用场景：销售合同、采购合同、服务合同、补充协议。

建议节点：

```text
start -> validate_request -> amount_branch -> manager_approval -> legal_approval -> approved_end
                                     └-> rejected_end
```

建议补充条件：

- 合同金额、期限、风险等级决定是否进入法务审批。
- 模板类合同可增加条款校验节点。
- 涉及对外签署时可增加通知或归档节点。

### 12.5 场景选择原则

1. 先确定申请类型，再选模板，不要先选节点再倒推业务。
2. 先确定是否需要金额分支，再决定是否引入 `amount_branch`。
3. 先确定是否需要多人审批，再决定是否加 `finance_approval`、`legal_approval` 或更高层级节点。
4. 先确定是否需要附件、票据、合同文本校验，再决定是否加校验节点。
5. 如果只是单级审批，不要强行塞入财务、法务或超时节点。
6. 如果业务明确要求“拒绝后通知申请人”，拒绝终点必须配通知动作，不要只写结束。
7. 如果业务要求“审批通过后回写表格”，通过终点前必须有回写节点或回写动作。
