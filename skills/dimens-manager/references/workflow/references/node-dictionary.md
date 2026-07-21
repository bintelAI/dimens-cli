# 工作流节点词典

本文档定义工作流章节中会反复出现的节点语义，供 AI 工作流与审批工作流共同引用。

## 1. 通用节点

| 节点语义 | 说明 | 常见位置 |
| --- | --- | --- |
| 开始节点 | 工作流入口，负责接收上下文、输入或触发事件 | 所有工作流开头 |
| 条件节点 | 基于表达式、规则或状态决定后续分支 | 分支决策点 |
| 动作节点 | 执行一个明确动作，如回写、通知、整理结果 | 处理中间层 |
| 结束节点 | 工作流收口，给出完成结果 | 所有工作流末尾 |

## 2. AI 工作流节点

| 节点语义 | 说明 | 常见配置 |
| --- | --- | --- |
| 输入整理节点 | 清洗、标准化、汇总上下文 | `inputKeys`, `schema`, `normalizationRules` |
| 提示词组装节点 | 把业务目标、上下文和输出格式组装成模型输入 | `systemPrompt`, `userPromptTemplate`, `variables` |
| 模型调用节点 | 调用模型生成结果或中间内容 | `model`, `temperature`, `messages`, `outputSchema` |
| 工具/API 节点 | 调用外部工具、服务或系统能力 | `toolName`, `params`, `timeout`, `retry` |
| 检索节点 | 从表格、文档、知识库或外部系统读取补充上下文 | `source`, `query`, `topK`, `filters` |
| 结构化解析节点 | 把模型文本解析成字段、JSON 或业务对象 | `parser`, `schema`, `onFail` |
| 质量检查节点 | 检查模型输出是否满足格式、事实或业务规则 | `rules`, `failAction`, `retryTarget` |
| 结果汇总节点 | 合并多个中间结果，形成最终输出 | `summaryFields`, `outputFormat` |
| 写回节点 | 将 AI 结果写回表格、文档或业务字段 | `target`, `mapping`, `writeMode` |

### 2.1 AI 节点生成细则

| 节点类型 | 推荐 id | 必填内容 | 不该做什么 |
| --- | --- | --- | --- |
| 输入整理 | `prepare_input` | 输入来源、字段映射、缺省处理 | 不要在这里调用模型 |
| 提示词组装 | `build_prompt` | 任务目标、上下文变量、输出格式 | 不要把业务校验写成自然语言散句 |
| 模型调用 | `llm_generate` | 模型用途、输入消息、输出要求 | 不要默认普通节点一定自动继承团队默认模型 |
| 工具/API 调用 | `call_tool` | 工具名、参数来源、失败处理 | 没有真实工具需求时不要强行加入 |
| 检索 | `retrieve_context` | 数据源、查询条件、返回数量 | 不要把整表全量塞给模型 |
| 结构化解析 | `parse_result` | 目标 schema、失败策略 | 不要让后续节点消费未结构化长文本 |
| 质量检查 | `validate_ai_output` | 检查规则、失败动作 | 不要只写“检查一下”这类空配置 |
| 结果汇总 | `summarize_result` | 汇总字段、输出格式 | 不要重复模型生成节点的职责 |
| 写回 | `write_back_result` | 写回目标、字段映射、写入模式 | 不要直接覆盖用户字段，除非业务明确要求 |

## 3. 审批工作流节点

| 节点语义 | 说明 | 常见配置 |
| --- | --- | --- |
| 表单校验节点 | 校验申请字段是否完整、合法 | `rules`, `failMessage`, `haltOnFail` |
| 人工审批节点 | 需要指定人员、部门或角色处理 | `participantRules`，兼容历史 `approver` |
| 通知节点 | 通知申请人、审批人或相关角色 | `recipients`, `message`, `template` |
| 回写节点 | 将审批结果写回表格或摘要字段 | `targetField`, `mapping`, `writeMode` |
| 归档节点 | 记录流程最终状态或归档结果 | `targetStatus`, `archiveReason` |

### 3.1 审批节点类型白名单

生成审批工作流 JSON 前先看当前可用节点类型，不要先写业务名再倒推节点类型。

选定节点类型后，必须继续查看 `approval-node-parameters.md` 补齐每个节点参数；不能只输出 `id/type/label`。

| 使用场景 | 可生成的节点 `type` | 发布后 / 服务端语义 | 说明 |
| --- | --- | --- | --- |
| 项目审批流发布接口 | `start` / `approval_start` | `approval_start` | 必须有且只有一个开始节点 |
| 项目审批流发布接口 | `approval` / `approval_user_task` | `approval_user_task` | 至少一个；`data.options.participantRules` 不能为空 |
| 项目审批流发布接口 | `condition` / `approval_condition` | `approval_condition` | 条件分支使用 `source-if` / `source-else` 出边 |
| 项目审批流发布接口 | `notification` / `approval_notify` | `approval_notify` | 用于审批过程通知 |
| 项目审批流发布接口 | `end` / `approval_end` | `approval_end` | 至少一个结束节点 |
| 历史 / 通用工作流兼容 | `judge` | 条件分支 | 真实案例 17 使用过；新草案优先用 `condition` |
| 历史 / 通用工作流兼容 | `mul_update_row` | 修改项目表行 | 真实案例 17 使用过；如果发布接口拒绝该节点，改为落地计划中的后置写回能力 |

禁止生成：

- `action`：当前审批发布校验不支持该节点类型。
- `sync_workflow_cell`：这是业务动作名，不是已存在节点类型。
- `approval_ai_review`：已废弃；AI 自动审批必须放在 `approval` 节点的 `data.options.autoApproval` 中。

## 4. 终点节点

| 节点语义 | 说明 |
| --- | --- |
| 通过终点 | 审批或 AI 流程正常完成 |
| 拒绝终点 | 审批被拒绝并收口 |
| 撤回终点 | 发起人撤回后收口 |
| 超时终点 | 处理超时后收口 |

## 5. 节点使用原则

1. 只在需要时加入节点，不要为了“看起来完整”而堆节点。
2. 节点名称要稳定、可解释，避免中文空格和不必要的缩写。
3. 同一场景不要重复定义语义相近的节点。
4. 审批节点必须能追溯到明确的处理人策略。
5. AI 工作流节点不要和审批挂起语义混用。
