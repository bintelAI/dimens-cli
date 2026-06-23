# AI 调用案例

维表 AI 能力统一走维表后端代理 new-api。调用方使用维表登录态或 API Key 换回来的维表 `token`，不直连 new-api，也不保存或展示 `sk-` token。

当前 SDK 入口统一是 `sdk.ai`，覆盖聊天、Responses、Messages、图片、视频、音频、Embedding、Rerank 和模型列表。

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
- `model` 可传 `default` 或 `team-default`，由后端按团队默认模型注入
- 历史聊天入口可以按后端规则兼容 `flowId`，但图片、视频、音频、Embedding、Rerank 不使用这个兼容规则

## 2. 图片生成

```ts
const image = await sdk.ai.generateImage('TEAM1', {
  model: 'default',
  prompt: '企业数据驾驶舱海报',
  size: '1024x1024',
  n: 1,
  projectId: 'PROJ1',
  resourceId: 'poster_1',
});

const first = image.data.data?.[0];
const src = first?.url || first?.image_url || first?.b64_json;
```

CLI 验证：

```bash
dimens-cli ai image-generate --team-id TEAM1 --prompt "企业数据驾驶舱海报" --model default --size 1024x1024
```

注意：

- 结果优先读取 `data[].url`，其次读取 `data[].image_url`，最后读取 `data[].b64_json`
- 临时签名 URL 必须保留完整 query string
- 如果业务需要把图片写回项目资源，先保存或上传拿稳定 URL，再写入表格/文档/画布

## 3. 视频生成任务

```ts
const task = await sdk.ai.createVideo('TEAM1', {
  model: 'default',
  prompt: '数据看板动画展示',
  seconds: '8',
  projectId: 'PROJ1',
  resourceId: 'video_1',
});

const status = await sdk.ai.getVideo('TEAM1', task.data.id);
const content = await sdk.ai.getVideoContent('TEAM1', task.data.id);
```

CLI 验证：

```bash
dimens-cli ai video-create --team-id TEAM1 --prompt "数据看板动画展示" --model default --seconds 8
dimens-cli ai video-status --team-id TEAM1 --task-id video_task_1
dimens-cli ai video-content --team-id TEAM1 --task-id video_task_1
```

视频查询和内容获取会走维表后端团队归属校验，不能跨团队读任务。

## 4. 音频、Embedding、Rerank

```ts
await sdk.ai.createSpeech('TEAM1', {
  model: 'default',
  input: '欢迎使用维表智联',
  voice: 'alloy',
  response_format: 'mp3',
});

await sdk.ai.embeddings('TEAM1', {
  model: 'default',
  input: ['hello', 'world'],
  projectId: 'PROJ1',
  resourceId: 'kb_1',
});

await sdk.ai.rerank('TEAM1', {
  model: 'default',
  query: '项目风险',
  documents: ['风险台账', '会议纪要'],
});
```

本地文件转写：

```ts
const form = new FormData();
form.append('file', new File([audioBuffer], 'meeting.mp3'));
form.append('model', 'default');
form.append('response_format', 'json');

await sdk.ai.transcribeAudio('TEAM1', form);
```

CLI 验证：

```bash
dimens-cli ai audio-speech --team-id TEAM1 --input "欢迎使用维表智联" --voice alloy
dimens-cli ai audio-transcribe --team-id TEAM1 --file ./meeting.mp3
dimens-cli ai embeddings --team-id TEAM1 --input '["hello","world"]'
dimens-cli ai rerank --team-id TEAM1 --query "项目风险" --documents '["风险台账","会议纪要"]'
```

## 5. 模型列表和模式控制

```ts
await sdk.ai.models('TEAM1', {
  capability: 'image',
  modelScope: 'platform_default',
});
```

通用归因字段：

| 字段 | 说明 |
| --- | --- |
| `projectId` | 维表项目归因 |
| `resourceId` | 业务资源归因，如 `poster_1`、`video_1`、`kb_1` |
| `modelScope` | `platform_default` 或 `team_customize` |
| `tokenScope` | `default` 或 `customize` |

这些字段用于后端选择团队 token、默认模型和写入 `new_api_usage_map`，不会透传给 new-api 上游。

## 6. Web / BFF / 移动端接入边界

适用前提：

- 前端已经从安全来源拿到维表 `token`
- `teamId` 来自当前团队上下文
- 不在浏览器、App 或小程序保存 `apiSecret`、new-api `sk-` token

BFF 封装示例：

```ts
export async function generatePoster(token: string, teamId: string, prompt: string) {
  const sdk = createDimensService(token);

  return sdk.ai.generateImage(teamId, {
    model: 'default',
    prompt,
    size: '1024x1024',
  });
}
```

移动端推荐调用自家服务端，由服务端持有维表 token 或短期凭据，不把密钥打进包体。

## 7. AI 接入高风险误区

- 不要把 `chat/completions` 当成工作流发布、挂载、调试全能力
- 不要忽略 `teamId`
- 不要把模型选择逻辑写死成单一值而不考虑团队默认模型
- 不要把 401 以外的错误都当成登录失效；403 常见于团队或模型权限不足
- 不要在 SDK 里私自添加后端未开放代理的 new-api 原生路径
- 不要在端侧保存或展示 new-api `sk-` token

## 8. 最小验证命令

```bash
dimens-cli ai chat-completions --team-id TEAM1 --message "帮我总结本周项目风险"
dimens-cli ai models --team-id TEAM1 --capability image
dimens-cli ai image-generate --team-id TEAM1 --prompt "企业数据驾驶舱海报" --model default --size 1024x1024
```

如果 CLI 调用失败，先排查 token、团队权限、模型配置和网络，再调整 Web / BFF 代码。

## 9. 真实场景：Node.js 服务端生成海报图，再写回表格附件字段

适用场景：

- 用户说“服务端调用 AI 生图，然后把结果存回多维表记录”
- 需要完整走 “AI 生成 -> 拿 URL -> 读取当前行 -> 更新字段”

```ts
const image = await sdk.ai.generateImage('TEAM1', {
  model: 'default',
  prompt: '客户经营分析海报',
  size: '1024x1024',
  projectId: 'PROJ1',
  resourceId: 'poster_customer_1',
});

const first = image.data.data?.[0];
const imageUrl = first?.url || first?.image_url;

if (!imageUrl) {
  throw new Error('生图结果缺少可写回的 URL');
}

const row = await sdk.row.info('TEAM1', 'PROJ1', 'SHEET1', 'ROW1');

await sdk.row.update(
  'SHEET1',
  'ROW1',
  {
    ...(row.data as Record<string, unknown>),
    field_attachment: [
      {
        name: 'customer-poster.png',
        url: imageUrl,
      },
    ],
  },
  Number((row.data as { version?: number }).version)
);
```

说明：

- 先读行数据再更新，避免直接覆盖其他字段
- 临时签名 URL 需要完整保留 query string
- 如果业务侧要求稳定资源 URL，先上传或落素材库，再回写表格
