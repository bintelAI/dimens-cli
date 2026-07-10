# 公开工作流与公开插件 API 接入示例

## 1. 公开工作流

公开工作流遵循文档 126 的边界：

- 管理态配置：`/app/flow/:teamId/info/:flowId/public-access`
- 免登录调用：`/open/flow/:publicId/v1/chat/completions`
- `publicSecret` 只用于公开工作流调用，不是用户 token、refreshToken、new-api token 或 API Key 登录密钥。

CLI：

```bash
dimens-cli workflow-public invoke \
  --public-id wfpub_xxx \
  --public-secret wfsk_xxx \
  --message "分析客户风险" \
  --metadata '{"source":"crm"}'
```

SDK：

```ts
import { createSDK } from '@bintel/dimens-cli';

const sdk = createSDK({
  baseUrl: 'https://dimens.bintelai.com/api',
});

const result = await sdk.workflowPublic.invoke('wfpub_xxx', 'wfsk_xxx', {
  model: 'workflow',
  messages: [{ role: 'user', content: '分析客户风险' }],
  metadata: { source: 'crm' },
});

console.log(result.data.choices[0]?.message.content);
```

管理态创建或更新配置需要登录态 token：

```ts
await sdk.workflowPublic.upsert('TEAM1', 12, {
  enabled: true,
  runAsUserId: 1001,
  projectId: 'PROJ1',
  ipWhitelist: ['1.2.3.4'],
  rateLimit: { perMinute: 60, concurrency: 5 },
});
```

## 2. 公开插件

公开插件以应用市场文档为准：

- 团队插件发布：`POST /app/plugin/:teamId/info/publish`
- 市场列表：`GET /app/market/resource/list?resourceType=flow_plugin`
- 安装公开插件：`POST /app/market/install/flow`

CLI：

```bash
dimens-cli plugin-public publish --team-id TEAM1 --plugin-id 3
dimens-cli plugin-public list --keyword "审批"
dimens-cli plugin-public install-flow --team-id TEAM2 --resource-id 88 --project-scope-type all_projects
```

SDK：

```ts
await sdk.pluginPublic.publish('TEAM1', 3);

const plugins = await sdk.pluginPublic.list({
  keyword: '审批',
  page: 1,
  size: 20,
});

await sdk.pluginPublic.installFlow({
  teamId: 'TEAM2',
  resourceId: 88,
  projectScopeType: 'all_projects',
});

console.log(plugins.data.list);
```

注意：

- `pluginId` 是团队插件或源工作流 ID。
- `resourceId` 是公开市场 `market_resource.id`。
- 安装公开插件会在目标团队生成团队插件实例，不等同于免登录公开工作流调用。
