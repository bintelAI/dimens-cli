# AI 工作流节点模板库

本文档提供可直接复用的 AI 工作流节点模板。生成 AI 工作流时，先根据业务目标选择模板，再按 `ai-generation.md` 补全连线、变量和落地计划。

## 1. 使用方式

1. 先判断场景属于摘要、分类、检索增强、工具调用、质检还是写回。
2. 从本文档复制对应节点模板。
3. 按真实业务改 `id`、`label`、变量名和目标字段。
4. 最后按 `workflow-spec.md` 校验节点唯一性、连线有效性和结束路径。

## 2. 通用节点模板

### 2.1 开始节点

```json
{
  "id": "start",
  "type": "start",
  "data": {
    "label": "开始",
    "variables": ["sourceText", "businessGoal"]
  }
}
```

### 2.2 输入整理节点

```json
{
  "id": "prepare_input",
  "type": "action",
  "data": {
    "label": "整理输入",
    "inputKeys": ["sourceText", "businessGoal"],
    "schema": {
      "sourceText": "string",
      "businessGoal": "string"
    },
    "normalizationRules": [
      "trimText",
      "dropEmptyLines"
    ]
  }
}
```

### 2.3 提示词组装节点

```json
{
  "id": "build_prompt",
  "type": "action",
  "data": {
    "label": "组装提示词",
    "systemPrompt": "你是维表智联 AI 工作流助手，请严格按输出格式返回。",
    "userPromptTemplate": "业务目标：{{businessGoal}}\n输入内容：{{sourceText}}\n请输出 JSON。",
    "variables": ["businessGoal", "sourceText"]
  }
}
```

### 2.4 模型调用节点

```json
{
  "id": "llm_generate",
  "type": "llm",
  "data": {
    "label": "模型生成",
    "messages": "{{build_prompt.output}}",
    "temperature": 0.2,
    "outputSchema": {
      "summary": "string",
      "confidence": "number"
    }
  }
}
```

说明：

- 如果需要指定模型，可补 `model` 或模型配置字段。
- 不要默认普通 LLM 节点一定自动继承团队默认模型，模型边界看 `model-routing.md`。

### 2.5 结构化解析节点

```json
{
  "id": "parse_result",
  "type": "action",
  "data": {
    "label": "解析结果",
    "source": "{{llm_generate.output}}",
    "schema": {
      "summary": "string",
      "confidence": "number"
    },
    "onFail": "return_raw_text"
  }
}
```

### 2.6 质量检查节点

```json
{
  "id": "validate_ai_output",
  "type": "condition",
  "data": {
    "label": "检查 AI 输出",
    "rules": [
      {
        "field": "confidence",
        "operator": ">=",
        "value": 0.6
      },
      {
        "field": "summary",
        "operator": "notEmpty"
      }
    ],
    "failAction": "manual_review"
  }
}
```

### 2.7 汇总节点

```json
{
  "id": "summarize_result",
  "type": "action",
  "data": {
    "label": "汇总输出",
    "summaryFields": ["summary", "confidence"],
    "outputFormat": "json"
  }
}
```

### 2.8 结束节点

```json
{
  "id": "end",
  "type": "end",
  "data": {
    "label": "结束",
    "result": "{{summarize_result.output}}"
  }
}
```

## 3. 摘要类模板

适用场景：会议纪要、客户沟通、工单记录、文档摘要。

推荐链路：

```text
start -> prepare_input -> build_prompt -> llm_generate -> parse_result -> summarize_result -> end
```

模型输出 schema：

```json
{
  "summary": "string",
  "keyPoints": "string[]",
  "risks": "string[]",
  "nextActions": "string[]"
}
```

## 4. 分类类模板

适用场景：工单分级、客户意向分类、风险等级判断、线索标签。

推荐链路：

```text
start -> prepare_input -> build_prompt -> llm_generate -> parse_result -> route_by_result -> summarize_result -> end
```

模型输出 schema：

```json
{
  "category": "string",
  "confidence": "number",
  "reason": "string"
}
```

分支节点模板：

```json
{
  "id": "route_by_result",
  "type": "condition",
  "data": {
    "label": "按分类结果分流",
    "rules": [
      {
        "field": "category",
        "operator": "equals",
        "value": "high"
      }
    ]
  }
}
```

## 5. 检索增强模板

适用场景：基于知识库回答、历史记录分析、表格上下文问答。

推荐链路：

```text
start -> prepare_input -> retrieve_context -> build_prompt -> llm_generate -> parse_result -> summarize_result -> end
```

检索节点模板：

```json
{
  "id": "retrieve_context",
  "type": "action",
  "data": {
    "label": "检索上下文",
    "source": "project_knowledge",
    "query": "{{prepare_input.output.query}}",
    "topK": 5,
    "filters": {
      "projectId": "{{projectId}}"
    }
  }
}
```

注意：

- 不要把整张表或整篇文档直接塞进模型。
- 检索结果要进入 `build_prompt`，不要让模型凭空回答。

## 6. 工具调用模板

适用场景：需要查询项目数据、调用外部接口、执行确定性工具。

推荐链路：

```text
start -> prepare_input -> build_prompt -> llm_reason -> route_by_result -> call_tool -> parse_result -> summarize_result -> end
```

工具节点模板：

```json
{
  "id": "call_tool",
  "type": "action",
  "data": {
    "label": "调用工具",
    "toolName": "query_project_data",
    "params": {
      "projectId": "{{projectId}}",
      "query": "{{llm_reason.output.query}}"
    },
    "timeout": 30000,
    "retry": 1,
    "onError": "return_error_summary"
  }
}
```

注意：

- 没有明确工具名和参数来源时，不要保留工具节点。
- 工具结果要经过解析或汇总后再进入结束节点。

## 7. 写回模板

适用场景：自动打标签、写入摘要、回填风险等级、保存 AI 建议。

推荐链路：

```text
start -> prepare_input -> build_prompt -> llm_generate -> parse_result -> validate_ai_output -> write_back_result -> end
```

写回节点模板：

```json
{
  "id": "write_back_result",
  "type": "action",
  "data": {
    "label": "写回 AI 结果",
    "target": "sheet.column",
    "mapping": {
      "summary": "ai_summary",
      "confidence": "ai_confidence"
    },
    "writeMode": "update_current_row",
    "versionGuard": true
  }
}
```

注意：

- 真实更新仍要遵守“先读取当前数据 -> 修改目标字段 -> 再提交更新”。
- 写回字段不存在时，先进入表格章节补字段，不要在工作流草案里假设字段已存在。

## 8. 组合模板

### 8.1 摘要 + 写回

```text
start -> prepare_input -> build_prompt -> llm_generate -> parse_result -> validate_ai_output -> write_back_result -> end
```

### 8.2 检索 + 总结

```text
start -> prepare_input -> retrieve_context -> build_prompt -> llm_generate -> parse_result -> summarize_result -> end
```

### 8.3 分类 + 分流 + 写回

```text
start -> prepare_input -> build_prompt -> llm_generate -> parse_result -> route_by_result -> validate_ai_output -> write_back_result -> end
```

## 9. 生成前检查

生成 AI 工作流前，先检查：

1. 是否真的属于 AI 工作流，而不是审批工作流。
2. 是否明确输入来源。
3. 是否需要模型调用。
4. 是否需要工具、检索或写回。
5. 是否明确模型输出 schema。
6. 是否需要质量检查。
7. 是否明确项目落地边界。
