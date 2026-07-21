# AI 工作流生成规范

本文档用于指导 AI 根据用户描述生成可落地的 AI 工作流，不覆盖审批挂起语义。

如需直接拼装节点 JSON，先看 `ai-node-templates.md`。本文档负责选择模板、组织场景和说明落地边界。

## 1. 适用场景

当用户提出下面需求时，优先使用本文档：

| 用户表达 | 默认意图 |
| --- | --- |
| 一键生成 AI 工作流 | 生成 AI 编排草案和落地步骤 |
| 生成分析/总结/生成型流程 | 从输入、模型调用、工具调用、结果汇总角度组织节点 |
| 生成带工具调用的流程 | 在模型节点之外补工具/API 节点 |
| 生成带条件判断的智能流程 | 在模型输出之后加入条件分支与结果整理 |

如果用户说的是人工审批、任务挂起、候选人、同意/拒绝，这属于审批工作流，应切到 `approval-generation.md`。

## 2. 执行前必须明确的信息

AI 生成工作流前，至少要明确以下信息：

| 信息 | 说明 | 缺失时默认处理 |
| --- | --- | --- |
| `teamId` | 团队上下文 | 不能真实写入，只能生成草案 |
| `projectId` | 项目上下文 | 可用于说明落地路径，缺失时只给通用草案 |
| 业务目标 | 例如总结、分析、问答、抽取、归纳、生成 | 从用户描述抽取 |
| 输入来源 | 表格、消息、文档、外部接口、用户输入 | 默认按结构化输入说明 |
| 模型能力 | 需要模型总结、分类、抽取、生成还是多轮编排 | 先按“模型调用 + 结果汇总”模板处理 |
| 工具依赖 | 是否需要 API、文件、表格或其他工具 | 没有则不加工具节点 |

## 3. 标准节点结构

AI 工作流建议至少包含以下节点层次：

1. 开始节点
2. 输入整理节点
3. 提示词组装节点
4. 模型调用节点
5. 工具/API 或检索节点
6. 结构化解析节点
7. 质量检查或条件判断节点
8. 结果汇总节点
9. 写回节点
10. 结束节点

不是所有场景都需要十类节点。最小链路是：

`start -> prepare_input -> build_prompt -> llm_generate -> summarize_result -> end`

只有当业务明确需要外部数据、工具调用、结构化字段或写回时，才补对应节点。

直接生成节点时，优先复用 `ai-node-templates.md` 中的模板，不要每次临时发明字段名。

## 4. 节点配置清单

| 节点语义 | 是否必备 | 推荐 id | 必填配置 | 常见可选配置 | 少了会怎样 |
| --- | --- | --- | --- | --- | --- |
| 开始节点 | 必备 | `start` | `label`, `variables` | `triggerSource`, `sourceSheetId` | 后续节点拿不到输入上下文 |
| 输入整理 | 必备 | `prepare_input` | `inputKeys`, `schema` | `normalizationRules`, `defaultValues` | 模型输入混乱，容易把缺字段当有效数据 |
| 提示词组装 | 必备 | `build_prompt` | `systemPrompt`, `userPromptTemplate` | `outputFormat`, `examples` | 模型节点缺少稳定任务边界 |
| 模型调用 | 必备 | `llm_generate` | `messages` 或 `promptRef` | `model`, `temperature`, `outputSchema` | 没有 AI 生成能力，只剩普通流程 |
| 检索节点 | 按需 | `retrieve_context` | `source`, `query` | `topK`, `filters` | 需要上下文时模型只能凭空回答 |
| 工具/API 节点 | 按需 | `call_tool` | `toolName`, `params` | `timeout`, `retry`, `onError` | 需要外部能力时无法真正执行动作 |
| 结构化解析 | 推荐 | `parse_result` | `schema`, `source` | `onFail`, `strict` | 后续节点只能消费长文本，难以分支或写回 |
| 质量检查 | 推荐 | `validate_ai_output` | `rules`, `source` | `retryTarget`, `failMessage` | 容易把格式错误或空结果继续传下去 |
| 条件判断 | 按需 | `route_by_result` | `expression` 或 `rules` | 分支标签 | 分流语义只能写在自然语言里 |
| 结果汇总 | 必备 | `summarize_result` | `summaryFields`, `outputFormat` | `includeRaw`, `language` | 输出不可控，难以展示或回写 |
| 写回节点 | 按需 | `write_back_result` | `target`, `mapping` | `writeMode`, `versionGuard` | AI 结果不会进入业务数据 |
| 结束节点 | 必备 | `end` | `label`, `result` | `summary` | 工作流无法明确收口 |

## 5. 推荐 JSON 草案

```json
{
  "pluginType": "ai",
  "nodes": [],
  "edges": [],
  "globalVariables": [],
  "meta": {
    "source": "dimens-manager",
    "scenario": "ai-generation"
  }
}
```

说明：

- `pluginType` 固定为 `ai`。
- `nodes` 需要体现输入整理、模型调用和结果汇总。
- `edges` 要保证从开始到结束路径完整。
- `globalVariables` 只放跨节点共享的关键变量。

## 6. 最小 JSON 模板

下面模板适合“从输入生成结构化摘要”的 AI 工作流：

```json
{
  "pluginType": "ai",
  "nodes": [
    {
      "id": "start",
      "type": "start",
      "data": {
        "label": "开始",
        "variables": ["sourceText", "businessGoal"]
      }
    },
    {
      "id": "prepare_input",
      "type": "action",
      "data": {
        "label": "整理输入",
        "inputKeys": ["sourceText", "businessGoal"],
        "schema": {
          "sourceText": "string",
          "businessGoal": "string"
        }
      }
    },
    {
      "id": "build_prompt",
      "type": "action",
      "data": {
        "label": "组装提示词",
        "systemPrompt": "你是维表智联 AI 工作流助手，请按指定结构输出。",
        "userPromptTemplate": "请基于 {{sourceText}} 完成 {{businessGoal}}，输出 JSON。"
      }
    },
    {
      "id": "llm_generate",
      "type": "llm",
      "data": {
        "label": "模型生成",
        "messages": "{{build_prompt.output}}",
        "temperature": 0.2,
        "outputSchema": {
          "summary": "string",
          "risks": "string[]",
          "nextActions": "string[]"
        }
      }
    },
    {
      "id": "parse_result",
      "type": "action",
      "data": {
        "label": "解析结构化结果",
        "source": "{{llm_generate.output}}",
        "schema": {
          "summary": "string",
          "risks": "array",
          "nextActions": "array"
        },
        "onFail": "return_raw_text"
      }
    },
    {
      "id": "summarize_result",
      "type": "action",
      "data": {
        "label": "汇总输出",
        "summaryFields": ["summary", "risks", "nextActions"],
        "outputFormat": "json"
      }
    },
    {
      "id": "end",
      "type": "end",
      "data": {
        "label": "结束",
        "result": "{{summarize_result.output}}"
      }
    }
  ],
  "edges": [
    { "id": "edge_start_prepare", "source": "start", "target": "prepare_input" },
    { "id": "edge_prepare_prompt", "source": "prepare_input", "target": "build_prompt" },
    { "id": "edge_prompt_llm", "source": "build_prompt", "target": "llm_generate" },
    { "id": "edge_llm_parse", "source": "llm_generate", "target": "parse_result" },
    { "id": "edge_parse_summary", "source": "parse_result", "target": "summarize_result" },
    { "id": "edge_summary_end", "source": "summarize_result", "target": "end" }
  ],
  "globalVariables": [
    { "key": "sourceText", "type": "string", "required": true },
    { "key": "businessGoal", "type": "string", "required": true }
  ],
  "meta": {
    "source": "dimens-manager",
    "scenario": "ai-generation",
    "template": "structured-summary"
  }
}
```

## 7. 常见模板

### 7.1 摘要生成

推荐链路：

`start -> prepare_input -> build_prompt -> llm_generate -> parse_result -> summarize_result -> end`

节点模板看 `ai-node-templates.md#3-摘要类模板`。

适用场景：

- 项目周报总结
- 客户沟通记录摘要
- 工单处理记录归纳
- 文档内容提炼

### 7.2 工具增强分析

推荐链路：

`start -> prepare_input -> build_prompt -> llm_reason -> call_tool -> parse_result -> summarize_result -> end`

节点模板看 `ai-node-templates.md#6-工具调用模板`。

适用场景：

- 先让模型判断需要查询什么，再调用工具或接口。
- 先根据用户问题抽取条件，再查询表格或外部系统。
- 先生成分析计划，再调用工具完成补充分析。

### 7.3 条件分流

推荐链路：

`start -> prepare_input -> build_prompt -> llm_generate -> route_by_result -> branch_a / branch_b -> summarize_result -> end`

节点模板看 `ai-node-templates.md#4-分类类模板`。

适用场景：

- 按风险等级分流
- 按客户意向分流
- 按数据质量分流
- 按模型分类结果选择下一步动作

### 7.4 检索增强生成

推荐链路：

`start -> prepare_input -> retrieve_context -> build_prompt -> llm_generate -> parse_result -> summarize_result -> end`

节点模板看 `ai-node-templates.md#5-检索增强模板`。

适用场景：

- 从知识库、文档或表格中取上下文后回答。
- 先检索历史记录，再生成解释或建议。
- 需要避免模型凭空生成时，优先使用该模板。

### 7.5 写回业务数据

推荐链路：

`start -> prepare_input -> build_prompt -> llm_generate -> parse_result -> validate_ai_output -> write_back_result -> end`

节点模板看 `ai-node-templates.md#7-写回模板`。

适用场景：

- 把 AI 分类结果写回字段。
- 把摘要写入文档或表格列。
- 把风险等级、建议动作、标签等结构化结果回填。

## 8. 输出要求

生成 AI 工作流时，至少输出：

1. 场景说明
2. 节点列表
3. 连线关系
4. 全局变量
5. 项目落地说明

如果用户要求项目内落地，要同时说明：

- 是否已知 `projectId`
- 是否需要先创建项目
- 是否只是草案，还是可直接挂载

如果输出 JSON 草案，必须额外说明：

- 哪些节点是必备节点。
- 哪些节点是可删减节点。
- 哪些能力当前只是草案，不代表 CLI 已经创建或发布。

## 9. 生成时的高风险点

| 风险 | 说明 | 修正 |
| --- | --- | --- |
| 把 AI 工作流写成审批流 | 出现候选人、同意、拒绝、挂起等语义 | 切换到 `approval-generation.md` |
| 节点只剩自然语言 | 只写“AI 分析一下” | 拆成输入、提示词、模型、解析、汇总等节点 |
| 工具节点空壳 | 写了工具节点但没有工具名和参数 | 删除工具节点或补 `toolName/params` |
| 模型输出不可消费 | 后续节点直接消费长文本 | 增加 `parse_result` 或 `validate_ai_output` |
| 写回目标不清 | 写了回写节点但没有字段映射 | 补 `target/mapping/writeMode` |
| 默认模型假设过度 | 认为普通 LLM 节点一定继承团队默认模型 | 按 `model-routing.md` 提醒当前实现边界 |

## 10. 推荐 AI 提示语

```text
你是维表智联 AI 工作流生成助手。
请根据我的业务描述，输出五部分：
1. AI 工作流业务目标
2. 节点清单，细化到输入整理、提示词组装、模型调用、解析、质检、汇总、写回
3. pluginType=ai 的工作流 JSON 草案，包含 nodes、edges、globalVariables、meta
4. 项目落地计划，说明是否需要 teamId/projectId、是否只是草案、是否涉及 server-only 能力
5. 验证清单，检查节点 id、连线、变量、模型边界和写回目标

业务描述：
{{用户业务描述}}

约束：
- 不要把审批挂起、候选人、同意/拒绝写进 AI 工作流
- 不要声称草案已经创建、发布或挂载
- 普通 LLM 节点是否继承团队默认模型，需要按当前实现确认
- 能用 CLI 辅助生成草案时，可给 dimens-cli ai chat-completions 命令
```

## 11. 验证要点

1. 节点是否覆盖输入、处理和输出。
2. 条件节点是否有清晰分支语义。
3. 工具节点是否只在确实需要时出现。
4. 是否避免把审批挂起语义写进 AI 工作流。
5. 是否明确说明这是草案还是已落地流程。
6. 写回节点是否明确目标字段和写入模式。
7. 模型节点是否说明当前模型来源和默认模型边界。
