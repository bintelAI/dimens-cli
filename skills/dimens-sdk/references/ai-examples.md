# AI 调用案例

## 1. Node.js 调用聊天兼容接口

```ts
await sdk.ai.completions('TEAM1', {
  model: 'team-default',
  messages: [
    {
      role: 'user',
      content: '帮我总结今天新增的客户跟进记录',
    },
  ],
});
```

说明：

- 当前是聊天兼容入口
- 不等于完整工作流管理接口

## 2. Web 前端直连 AI 接口

适用前提：

- 前端已经从安全来源拿到 `token`
- `teamId` 来自当前团队上下文
- 不在浏览器保存 `apiSecret`

```ts
await fetch(`https://dimens.bintelai.com/api/app/flow/${teamId}/v1/chat/completions`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'team-default',
    messages: [
      {
        role: 'user',
        content: '帮我总结本周项目风险',
      },
    ],
  }),
});
```

## 3. BFF 封装一个摘要接口

```ts
export async function summarizeByAi(token: string, teamId: string, content: string) {
  const sdk = createDimensService(token);

  return sdk.ai.completions(teamId, {
    model: 'team-default',
    messages: [
      {
        role: 'user',
        content: `请帮我总结以下内容：${content}`,
      },
    ],
  });
}
```

## 4. 移动端通过业务服务端请求摘要

```ts
await fetch('https://your-app.example.com/api/dimens/ai/summary', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${appToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    teamId,
    content: '今天新增了 12 条巡检记录，2 条异常待处理',
  }),
});
```

## 5. 传入会话 ID 做连续对话

```ts
await sdk.ai.completions('TEAM1', {
  model: 'team-default',
  sessionId: 'session-001',
  messages: [
    {
      role: 'user',
      content: '继续补充上一轮分析结论',
    },
  ],
});
```

## 6. AI 接入高风险误区

- 不要把 `chat/completions` 当成工作流发布、挂载、调试全能力
- 不要忽略 `teamId`
- 不要把模型选择逻辑写死成单一值而不考虑团队默认模型
- 不要把 401 以外的错误都当成登录失效；403 常见于团队或模型权限不足

## 7. 最小验证命令

```bash
dimens-cli ai chat-completions --team-id TEAM1 --message "帮我总结本周项目风险"
```

如果 CLI 调用失败，先排查 token、团队权限、模型配置和网络，再调整 Web / BFF 代码。
