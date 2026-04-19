# dimens-workflow 接口案例

本文档聚焦维表智联当前最明确、且已由 `dimens-cli` 对接的工作流接口：OpenAI 兼容聊天接口。

同时补充项目入口、模型解析和返回格式案例，保证 Skill 在解释工作流问题时不会只停留在概念层。

更细的规则说明请分别查看：

- `usage.md`
- `project-binding.md`
- `model-routing.md`
- `capability-status.md`

---

## 1. OpenAI 兼容聊天接口

### 1.1 服务端接口

| 项 | 内容 |
| --- | --- |
| 方法 | `POST` |
| 路径 | `/app/flow/:teamId/v1/chat/completions` |
| 入口角色 | 工作流聊天兼容入口 |
| 中间件 | `FlowTeamMiddleware` |
| 鉴权 | `Authorization: Bearer {token}` |

### 1.2 请求体

请求体定义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `model` | `string \| number` | 否 | 为空、`default`、`team-default` 时，会按默认模型请求处理 |
| `messages` | `array` | 是 | 对话消息数组 |
| `stream` | `boolean` | 否 | 是否流式返回 |
| `user` | `string` | 否 | 用户标识 |
| `sessionId` | `string` | 否 | 会话 ID |

消息数组项：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `role` | `'system' \| 'user' \| 'assistant'` | 是 | 消息角色 |
| `content` | `string` | 是 | 消息内容 |

请求示例：

```json
{
  "model": "default",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ],
  "stream": false,
  "user": "u_1"
}
```

### 1.3 返回体

非流式返回重点：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `data.id` | `string` | 请求 ID |
| `data.object` | `string` | 通常是 `chat.completion` |
| `data.created` | `number` | 时间戳 |
| `data.model` | `string` | 实际模型或工作流标识 |
| `data.choices` | `array` | 回复列表 |
| `data.choices[0].message.role` | `string` | `assistant` |
| `data.choices[0].message.content` | `string` | 回复文本 |
| `data.usage` | `object` | token 使用量 |

流式返回时，服务端返回的是 SSE：

- `Content-Type: text/event-stream`
- 每个 chunk 的 `object` 是 `chat.completion.chunk`
- 最终以 `data: [DONE]` 结束

### 1.4 model 的解析规则

Skill 必须明确说明当前接口实现里的真实判断：

#### 默认模型请求

以下情况会被当成“默认模型模式”：

- `model` 未传
- `model === null`
- `model === ""`
- `model === "default"`
- `model === "team-default"`

#### 指定模型 / 指定工作流

- `model` 为数字配置 ID 时，可能按团队已配置的 LLM 模型处理
- `model` 为字符串时，也可能被解释为某个工作流标签或某个模型标识

因此 Skill 不能把 `model` 只解释成一个固定概念。

---

## 2. CLI 命令

### 2.1 当前命令入口

```bash
dimens-cli ai chat-completions \
  --team-id TTFFEN \
  --message "你好" \
  --model default \
  --output json
```

CLI 入参：

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `--team-id` | 是，若 profile 无默认值 | 团队 ID |
| `--message` | 是 | 单条用户消息，CLI 会组装成 `messages` 数组 |
| `--model` | 否 | 默认 `default` |
| `--user` | 否 | 用户标识 |
| `--output` | 否 | 输出格式 |

CLI 到 HTTP 请求体的映射：

```json
{
  "model": "default",
  "messages": [
    {
      "role": "user",
      "content": "你好"
    }
  ]
}
```

---

## 3. Skill 在说明项目看不到工作流时必须给出的接口层排查点

虽然当前 CLI 主要直接封装了 `chat/completions`，但 Skill 解释问题时不能遗漏下列接口层事实：

1. 团队级工作流定义和项目级工作流挂载不是一回事。
2. 一个工作流“存在”，不代表项目里“可见”。
3. 项目入口要继续结合：
   - `teamId`
   - `projectId`
   - 工作流绑定关系
   - 系统视图入口
   - 权限可见性

如果用户问“项目里为什么看不到工作流”，Skill 不能只回答 `chat/completions`，而要明确这是运行入口，不是完整的项目挂载查询接口。

---

## 4. 返回结构案例

### 4.1 非流式成功返回模板

```json
{
  "code": 1000,
  "message": "success",
  "data": {
    "id": "req_default",
    "object": "chat.completion",
    "created": 1234567890,
    "model": "default",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "默认模型回复"
        },
        "finish_reason": "stop"
      }
    ],
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 20,
      "total_tokens": 30
    }
  }
}
```

### 4.2 流式 chunk 返回模板

```json
{
  "id": "request-id",
  "object": "chat.completion.chunk",
  "created": 1234567890,
  "model": "default",
  "choices": [
    {
      "index": 0,
      "delta": {
        "content": "你好"
      },
      "finish_reason": null
    }
  ]
}
```

---

## 5. Skill 输出要求

当用户提到工作流、AI 分析、默认模型、chat completions 时，Skill 至少要说清：

1. 当前调用的具体 HTTP 路径。
2. `teamId`、`messages`、`model` 的实际入参结构。
3. `model` 在当前实现里并不只代表一种含义。
4. 非流式和流式的返回结构分别是什么。
5. `chat/completions` 是工作流体系的一条运行入口，不等于完整工作流管理接口。

## 6. 这份文档的职责边界

这份文档只负责接口级案例总览，不再展开：

- 项目挂载为什么影响项目可见性
- 工作流能力哪些已封装、哪些仍是 `server-only`
- 默认模型与节点模型的完整边界解释

这些内容已经拆到独立 references 中，方便后续 Skill 精确引用。
