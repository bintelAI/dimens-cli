# 真实审批工作流案例参考

本文记录从 MCP 数据库读取到的两个项目级审批工作流案例，只保留结构信息和节点配置形态，用于约束 AI 生成审批工作流时不要编造不存在的节点类型。

注意：

- 不写入密钥、模型供应商凭据、用户隐私等敏感配置。
- 这些案例的 `usageType` 当前为 `general`，但节点和连线是审批场景里已经实际存在的经典形态。
- 如果走项目审批流创建 / 发布接口，仍要遵守 `approval-generation.md` 中的发布校验节点类型。

## 案例 16：出差管理

基础信息：

| 字段 | 值 |
| --- | --- |
| `flowId` | `16` |
| 名称 | `出差管理` |
| `label` | `CHUCHSI` |
| `teamId` | `TTFFEN` |
| `projectId` | `PXMHRW7` |
| `ownerScope` | `project` |
| `status` | `1` |

节点顺序：

| 顺序 | 节点 id | 节点类型 | 语义 | 关键配置 |
| --- | --- | --- | --- | --- |
| 1 | `start_1778805804662` | `start` | 表格行发起审批 | `approvalInputConfig.sourceType=mul_table`，包含 `projectId/sheetId/sheetName/fields`，字段含 `text/number/signature` |
| 2 | `approval_1778805815983` | `approval` | 第一层人工审批 | `approver=编辑者负责人`，`approvalType=single`，`timeout=86400`，包含字段权限配置 |
| 3 | `approval_1778812278657` | `approval` | 第二层人工审批 | `approver=test02`，`approvalType=single`，`timeout=86400`，包含字段权限配置 |
| 4 | `end_1778805860541` | `end` | 流程结束 | 空配置 |

主链路：

```text
start -> approval -> approval -> end
```

生成要点：

- 简单多级审批不要硬塞条件节点、通知节点或回写节点。
- 开始节点必须携带 `approvalInputConfig`，并把表格字段映射为审批输入。
- 审批节点至少要有明确审批人策略和超时时间。
- 字段权限可以在不同审批节点上变化，例如某些字段在第一层隐藏、第二层可编辑。

## 案例 17：测试管理

基础信息：

| 字段 | 值 |
| --- | --- |
| `flowId` | `17` |
| 名称 | `测试管理` |
| `label` | `tes` |
| `teamId` | `TTFFEN` |
| `projectId` | `PXMHRW7` |
| `ownerScope` | `project` |
| `status` | `1` |

节点顺序：

| 顺序 | 节点 id | 节点类型 | 语义 | 关键配置 |
| --- | --- | --- | --- | --- |
| 1 | `start_1778899537506` | `start` | 表格行发起审批 | `approvalInputConfig.sourceType=mul_table`，字段含 `text/number/relation`，报销金额映射到 `payload` |
| 2 | `condition_1778899630403` | `judge` | 金额条件分支 | 使用 `{{payload.<fieldId>}}` 判断，出边区分 `source-if` 和 `source-else` |
| 3 | `approval_1778899561650` | `approval` | 第一条分支审批 | 支持在审批节点内部启用 AI 自动审批；自动通过、自动驳回、转人工都放在 `autoApproval` 配置内 |
| 4 | `approval_1778899650734` | `approval` | 第二条分支审批 | 普通人工审批 |
| 5 | `mul_update_row_1778924452366` | `mul_update_row` | 审批后写回项目表行 | 使用 `targetProjectId/sheetId/fieldMappingsJson/targetBinding`，变量引用形如 `{{payload.<fieldId>}}`、`{{system.initiator_id}}` |
| 6 | `end_1778899617856` | `end` | 流程结束 | 空配置 |

主链路：

```text
start -> judge
judge(source-if) -> approval -> end
judge(source-else) -> approval -> mul_update_row -> end
```

生成要点：

- 条件分支节点在历史数据中可能是 `judge`，但项目审批流发布接口建议用 `condition`，由后端规范化为 `approval_condition`。
- AI 自动审批不是独立节点；它是 `approval` 节点的 `data.options.autoApproval` 配置。
- 业务数据写回项目表行时使用已存在的 `mul_update_row` 节点，不要生成不存在的 `action` 或 `sync_workflow_cell` 节点类型。
- 如果只是回写 `workflow` 字段里的审批摘要，优先依赖后端审批摘要托管回写，不要额外创建一个虚构节点。

## 从案例提炼的硬规则

1. 生成节点前先选“已存在节点类型”，再写业务语义。
2. 表格发起审批的开始节点要包含 `approvalInputConfig`，至少说明 `projectId/sheetId/fields`。
3. 条件分支必须使用明确出边，例如 `source-if` / `source-else`。
4. 审批节点必须有处理人策略；AI 自动审批只能作为审批节点配置，不要生成 `approval_ai_review`。
5. 回写项目表行只能使用已存在的 `mul_update_row`，发布专用审批流不支持时要明确作为“通用/历史兼容节点”处理。
6. 所有边的 `source/target` 必须指向已有节点，不能出现孤立节点、重复 id 或指向不存在节点的边。
