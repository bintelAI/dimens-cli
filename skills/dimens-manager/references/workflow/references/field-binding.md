# 审批工作流字段绑定与行数据链路

本文档专门说明多维表格 `workflow` 字段如何绑定审批工作流、如何从行数据发起审批、以及审批摘要如何回写到同一个字段。

它补充 `approval-generation.md`，解决一个核心问题：

**审批工作流不是只保存一张流程图，还必须有表格字段入口和行数据上下文。**

## 1. 适用场景

当用户提出下面需求时，必须看本文档：

| 用户表达 | 默认意图 |
| --- | --- |
| 给行数据绑定审批工作流 | 用 `workflow` 字段作为某一行的审批发起入口 |
| 给表格加审批字段 | 创建或配置 `workflow` 类型字段 |
| 审批流程绑定到某张表 | 让表格行能触发审批 |
| 审批结果回写行数据 | 将审批摘要写回 `workflow` 字段 |
| 字段状态不刷新 | 排查 `sourceSnapshot`、字段类型、Yjs 协同刷新 |

如果用户只是要生成流程图或画布，先回到画布章节；如果用户要真实可执行审批，必须继续补齐本文档的字段绑定与行数据链路。

## 2. 一句话原则

**团队工作流负责定义，项目绑定负责入口，`workflow` 字段负责从行数据发起和展示摘要，审批实例表负责保存审批真值。**

不要把表格单元格当成审批真值存储；单元格只保存摘要。

## 3. 前置条件

真实落地前至少要确认：

| 信息 | 作用 |
| --- | --- |
| `teamId` | 团队隔离与鉴权上下文 |
| `projectId` | 项目上下文 |
| `sheetId` | 哪张表发起审批 |
| `fieldId` | 哪个 `workflow` 字段作为入口 |
| `rowId` | 哪一行发起审批 |
| `flowId` | 字段绑定的审批流 |
| `systemView=approval` | 项目入口必须是审批视图 |

缺少 `sheetId/fieldId/rowId` 时，不能声称已经完成“行数据绑定工作流”。

## 4. 字段绑定链路

### 4.1 字段类型要求

表格发起审批时，入口字段必须是 `workflow` 类型字段。

字段配置默认包含：

```json
{
  "type": "workflow",
  "label": "审批",
  "config": {
    "flowId": "FLOW_ID",
    "systemView": "approval"
  }
}
```

注意：

- `flowId` 必须指向当前项目可用的审批工作流。
- 项目级审批流优先；如果使用团队级流程，要确认项目绑定关系存在。
- 字段配置只能选择挂到 `approval` 系统视图的流程。

### 4.2 字段创建或更新前的检查

建议顺序：

1. `column list` 确认表里是否已有 `workflow` 字段。
2. 如果没有，创建 `workflow` 字段。
3. 如果已有，先读取当前字段配置，再合并 `flowId/systemView`。
4. 回查字段配置，确认类型仍是 `workflow`。

不要把 `workflow` 字段误建成普通 `select` 或 `text` 字段。

当前 CLI 已支持字段配置落地：

```bash
dimens-cli column create \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --label 审批 \
  --type workflow \
  --flow-id FLOW_ID \
  --system-view approval
```

已有字段改绑审批流时：

```bash
dimens-cli column update \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --field-id FIELD_ID \
  --flow-id FLOW_ID \
  --system-view approval
```

如果需要传完整字段配置，也可以使用通用 JSON：

```bash
dimens-cli column update \
  --team-id TEAM_ID \
  --project-id PROJECT_ID \
  --sheet-id SHEET_ID \
  --field-id FIELD_ID \
  --config '{"flowId":"FLOW_ID","systemView":"approval","displayMode":"summary"}'
```

注意：`column update` 会先读取当前 `structure.columns`，再合并 `config`；`--flow-id/--system-view` 只负责字段入口绑定，不等同于创建、发布或挂载审批流。

## 5. 行数据发起链路

从表格字段发起审批时，前端入口是 `WorkflowCell`。发起请求必须携带能定位单元格和业务行的数据。

关键入参：

| 字段 | 来源 | 作用 |
| --- | --- | --- |
| `flowId` | 字段绑定的审批流 | 定位要运行的流程 |
| `sourceType='workflow_field'` | 固定来源 | 标识这是表格工作流字段发起 |
| `sourceBizId=rowId` | 当前行 ID | 关联业务行 |
| `bizKey=sheetId:rowId:fieldId` | 当前单元格定位 | 唯一定位一次字段审批 |
| `sourceSnapshot.projectId/sheetId/rowId/fieldId` | 当前项目/表/行/字段 | 后端回写摘要时定位单元格 |
| `bizData.rowData` | 当前行数据 | 审批详情展示和条件判断输入 |
| `bizData.payload` | 开始节点字段映射结果 | 把表格字段映射成审批输入变量 |
| `requestId` | 前端生成 UUID | 生成运行追踪与 checkpoint 标识 |

## 6. `bizData.payload` 与审批变量

审批工作流的开始节点不要只写抽象变量，必须能从行数据映射出来。

推荐映射结构：

```json
{
  "bizData": {
    "rowData": {
      "amount": 6200,
      "reason": "差旅报销",
      "applicantId": "u_1"
    },
    "payload": {
      "rowId": "ROW_ID",
      "applicantId": "u_1",
      "amount": 6200,
      "reason": "差旅报销"
    }
  }
}
```

审批图里的 `globalVariables` 应与 `payload` 对齐：

```json
[
  { "key": "rowId", "type": "string", "required": true },
  { "key": "applicantId", "type": "string", "required": true },
  { "key": "amount", "type": "number", "required": true },
  { "key": "reason", "type": "string", "required": true }
]
```

如果流程条件依赖金额、天数、风险等级等字段，必须确保这些字段能从 `rowData` 或 `payload` 中读取。

## 7. 摘要回写链路

审批状态变更后，后端通过 `ApprovalCellSyncService` 把摘要写回 `workflow` 字段。

回写条件：

1. `approvalInstance.sourceType === 'workflow_field'`
2. `sourceSnapshot` 包含 `projectId/sheetId/rowId/fieldId`
3. 目标 sheet 存在
4. 目标 column 存在且 `column.type === 'workflow'`

摘要值结构：

```ts
{
  approvalInstanceId: number;
  flowInstanceId: number;
  flowId: number;
  status: 'waiting_approval' | 'approved' | 'rejected' | 'recalled' | 'cancelled' | 'failed';
  title?: string;
  currentNodeName?: string;
  currentApproverNames?: string[];
  startedAt?: string;
  endedAt?: string;
  finalResult?: any;
}
```

回写链路：

1. 构造审批摘要。
2. 通过系统托管写入能力更新目标行目标字段。
3. 通知 Yjs 协同链路刷新在线协作者。

因此，前端看到的 `workflow` 单元格值只是审批摘要，不是完整审批实例。

CLI 的 `row set-cell --value-json` 可以写入对象值，适合调试普通对象型字段或验证单元格契约：

```bash
dimens-cli row set-cell \
  --sheet-id SHEET_ID \
  --row-id ROW_ID \
  --field-id FIELD_ID \
  --value-json '{"status":"waiting_approval","flowId":"FLOW_ID"}' \
  --version 1
```

但对 `workflow` 字段，真实审批摘要应由后端审批链路托管回写；除排查和测试外，不建议手工用 `row set-cell` 改审批状态，否则会造成单元格摘要和审批实例真值不一致。

## 8. Skill 输出时必须包含的内容

当用户要求“绑定行数据工作流 / 表格字段发起审批”时，输出至少包含：

1. `workflow` 字段是否存在。
2. 字段绑定的 `flowId`。
3. 项目工作流是否挂到 `systemView=approval`。
4. 发起审批时的 `sourceSnapshot`。
5. 从 `rowData` 到 `bizData.payload` 的字段映射。
6. 摘要回写目标：`sheetId + rowId + fieldId`。
7. 验证方式：审批实例、任务、字段摘要、协同刷新。

## 9. 常见错误与修正

| 错误 | 原因 | 修正 |
| --- | --- | --- |
| 字段选不到审批流 | 流程没有挂到当前项目的 `approval` 系统视图 | 检查项目工作流绑定和 `systemView=approval` |
| 发起时报找不到流程 | `flowId` 无效或审批流未启用/未发布 | 回查项目级审批流或团队绑定流程 |
| 条件节点取不到金额/天数 | `bizData.payload` 没映射对应字段 | 补开始节点字段映射和 `globalVariables` |
| 字段状态不刷新 | `sourceSnapshot` 缺少 `sheetId/rowId/fieldId` 或字段类型不是 `workflow` | 补完整 sourceSnapshot，确认 column 类型 |
| 单元格里想保存全部审批详情 | 概念混淆 | 详情在审批实例表，单元格只展示摘要 |
| AI 自动审批没有触发 | 决策变量路径没有落到 `bizData.payload` | 补 `approvalDecision/approvalReason` 等变量映射 |

## 10. 验收清单

| 场景 | 操作 | 预期 |
| --- | --- | --- |
| 字段绑定 | 查看字段配置 | 字段类型是 `workflow`，绑定 `flowId` |
| 行发起审批 | 在某行的 `workflow` 字段发起 | 创建审批实例和当前审批任务 |
| 条件分支 | 行数据金额/天数满足分支 | 流程走到正确审批节点 |
| 摘要回写 | 审批同意/拒绝/撤回 | `workflow` 字段摘要状态更新 |
| 协同刷新 | 多人同时打开表格 | 其他在线用户能看到字段状态变化 |
| 权限过滤 | 非发起人或非候选人查看详情 | 不可见或无权查看 |

## 11. 与其他文档的关系

- 生成审批流程图看 `approval-generation.md`
- 项目挂载与系统视图看 `project-binding.md`
- 行数据与字段操作看 `../../table/overview.md`
- 行读取、字段 ID、字段类型回查看 `../../table/references/examples.md`
