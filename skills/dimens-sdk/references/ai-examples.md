# AI 调用案例

维表 AI 能力统一走维表后端。下面的适配器只解决 SDK 边界的响应差异；使用前仍要记录当前 `@bintel/dimens-cli` 版本和一份脱敏真实响应。不要把某次线上结构写成永久类型。

## 1. 统一归一化边界

```ts
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function candidates(value: unknown): unknown[] {
  const values: unknown[] = [value];
  let current = value;
  for (let depth = 0; depth < 3 && isRecord(current) && 'data' in current; depth += 1) {
    current = current.data;
    values.push(current);
  }
  return values;
}

export function extractList<T>(response: unknown): T[] {
  for (const value of candidates(response)) {
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export function extractObject(response: unknown): UnknownRecord | undefined {
  const queue = [...candidates(response)];
  for (const value of queue) {
    if (!isRecord(value)) continue;
    for (const key of ['output', 'result']) {
      if (isRecord(value[key])) queue.push(value[key]);
    }
    if ('id' in value || 'taskId' in value || 'task_id' in value || 'status' in value) {
      return value;
    }
  }
  return undefined;
}
```

组件不要接触原始响应。把 `extractList/extractObject` 放在应用的 AI 适配层，输出稳定的 `models/images/task/videoUrl` 业务对象。

## 2. 模型与图片

```ts
type ModelInfo = { id: string; name?: string; description?: string };
type ImageItem = {
  url?: string;
  image_url?: string;
  b64_json?: string;
  data?: { url?: string; image_url?: string };
};

export function pickImageSource(item: ImageItem): string | undefined {
  return item.url
    || item.image_url
    || item.data?.url
    || item.data?.image_url
    || (item.b64_json ? `data:image/png;base64,${item.b64_json}` : undefined);
}

const modelResponse = await sdk.ai.models(teamId, { capability: 'image' });
const models = extractList<ModelInfo>(modelResponse);
const selectedModel = models[0]?.id || 'default';

const imageResponse = await sdk.ai.generateImage(teamId, {
  model: selectedModel,
  prompt: '企业数据驾驶舱海报',
  size: '1024x1024',
});
const imageSource = pickImageSource(extractList<ImageItem>(imageResponse)[0] || {});
if (!imageSource) throw new Error('图片响应缺少可识别的 URL 或 base64 数据');
```

规则：

- `model` 使用模型查询返回的真实 `id`；业务引擎代码必须先映射，不能直接提交。
- 某 capability 列表为空时，只有当前后端支持默认模型注入才使用 `default`；否则显示不可用。
- 模型名称仅用于展示，按实际字段选择 `description || name || id`。
- 中文 SVG 转 base64 时优先使用 `TextEncoder`/`Blob` 等 UTF-8 安全方案；不要直接 `btoa(svg)`，也不要新增依赖已废弃 `unescape` 的代码。

## 3. 视频任务轮询

```ts
const SUCCESS = new Set(['completed', 'succeeded', 'success', 'done']);
const FAILURE = new Set(['failed', 'error', 'canceled', 'cancelled', 'rejected', 'expired']);

function textField(value: UnknownRecord | undefined, keys: string[]): string | undefined {
  for (const key of keys) {
    const field = value?.[key];
    if ((typeof field === 'string' || typeof field === 'number') && String(field).trim()) {
      return String(field).trim();
    }
  }
  return undefined;
}

function extractVideoResource(
  response: unknown,
  apiBaseUrl: string,
  resolveResourceKey?: (key: string) => string,
): { url?: string | undefined; resourceKey?: string | undefined } {
  const queue = [...candidates(response)];
  let resourceKey: string | undefined;
  while (queue.length) {
    const value = queue.shift();
    if (typeof value === 'string' && value.trim()) {
      return { url: new URL(value, apiBaseUrl).toString(), resourceKey };
    }
    if (!isRecord(value)) continue;
    for (const key of ['resource', 'data', 'output', 'result']) {
      if (value[key] !== undefined) queue.push(value[key]);
    }
    resourceKey ||= textField(value, ['key']);
    const url = textField(value, ['url', 'video_url', 'content_url']);
    if (url) return { url: new URL(url, apiBaseUrl).toString(), resourceKey };
  }
  return {
    url: resourceKey && resolveResourceKey ? resolveResourceKey(resourceKey) : undefined,
    resourceKey,
  };
}

async function withinDeadline<T>(
  operation: () => Promise<T>,
  deadline: number,
  signal?: AbortSignal,
): Promise<T> {
  const remainingMs = deadline - Date.now();
  if (remainingMs <= 0) throw new Error('视频任务轮询超时');
  if (signal?.aborted) throw signal.reason || new Error('视频轮询已取消');

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    let onAbort: () => void;
    const settle = (finish: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      finish();
    };

    onAbort = () => settle(() => reject(signal?.reason || new Error('视频轮询已取消')));
    timer = setTimeout(() => settle(() => reject(new Error('视频任务轮询超时'))), remainingMs);
    signal?.addEventListener('abort', onAbort, { once: true });
    let request: Promise<T>;
    try {
      request = operation();
    } catch (error) {
      settle(() => reject(error));
      return;
    }
    request.then(
      value => settle(() => resolve(value)),
      error => settle(() => reject(error)),
    );
  });
}

function describeShape(value: unknown): string {
  const parts: string[] = [];
  const visited = new Set<object>();
  const visit = (current: unknown, path: string, depth: number) => {
    if (Array.isArray(current)) {
      parts.push(`${path}:array`);
      return;
    }
    if (!isRecord(current)) {
      parts.push(`${path}:${typeof current}`);
      return;
    }
    if (visited.has(current) || depth > 3) return;
    visited.add(current);
    parts.push(`${path}:keys=[${Object.keys(current).slice(0, 8).join(',')}]`);
    for (const key of ['data', 'output', 'result', 'resource']) {
      if (current[key] !== undefined) visit(current[key], `${path}.${key}`, depth + 1);
    }
  };
  visit(value, 'response', 0);
  return parts.join(' -> ');
}

export async function createAndPollVideo(
  teamId: string,
  prompt: string,
  apiBaseUrl: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
    resolveResourceKey?: (key: string) => string;
  } = {},
) {
  const intervalMs = options.intervalMs ?? 3000;
  const timeoutMs = options.timeoutMs ?? 5 * 60_000;
  const deadline = Date.now() + timeoutMs;
  const createdResponse = await withinDeadline(
    () => sdk.ai.createVideo(teamId, { model: 'default', prompt }),
    deadline,
    options.signal,
  );
  const created = extractObject(createdResponse);
  const taskId = textField(created, ['id', 'taskId', 'task_id']);
  if (!taskId) throw new Error(`视频任务响应缺少 taskId：${describeShape(createdResponse)}`);

  while (Date.now() < deadline) {
    options.signal?.throwIfAborted();
    const taskResponse = await withinDeadline(
      () => sdk.ai.getVideo(teamId, taskId),
      deadline,
      options.signal,
    );
    const task = extractObject(taskResponse);
    if (!task) throw new Error(`视频状态响应结构未知：${describeShape(taskResponse)}`);
    const status = textField(task, ['status'])?.toLowerCase();
    if (!status) throw new Error(`视频状态响应缺少 status：${describeShape(taskResponse)}`);
    if (status && FAILURE.has(status)) throw new Error(`视频任务失败：${status}`);
    if (status && SUCCESS.has(status)) {
      const content = await withinDeadline(
        () => sdk.ai.getVideoContent(teamId, taskId),
        deadline,
        options.signal,
      );
      const resource = extractVideoResource(content, apiBaseUrl, options.resolveResourceKey);
      if (!resource.url) {
        const reason = resource.resourceKey ? '仅返回 resource.key，调用方需提供解析函数' : '缺少可识别资源 URL';
        throw new Error(`视频内容不可播放：${reason}；${describeShape(content)}`);
      }
      return { taskId, url: resource.url, resourceKey: resource.resourceKey };
    }
    await withinDeadline(
      () => new Promise<void>(resolve => setTimeout(resolve, intervalMs)),
      deadline,
      options.signal,
    );
  }
  throw new Error(`视频任务轮询超时：${taskId}`);
}
```

未知状态按“尚未完成”处理并受总超时约束；缺少任务对象或 `status` 属于未知结构，应记录脱敏字段名后立即失败。`withinDeadline` 能让调用流程按总时限返回，但当前 SDK 方法不接收 `AbortSignal`，底层已发出的 HTTP 请求仍可能继续。当前服务端内容接口优先返回团队空间的 `resource.url/resource.key`；`resource.key` 需要调用方提供解析函数，不能直接伪装成 URL，历史直接字符串或 `url/video_url` 只作兼容。

## 4. 图片编辑

```ts
const form = new FormData();
form.append('image', file, file.name);
form.append('model', selectedModel);
form.append('prompt', '改成产品海报');
const result = await sdk.ai.editImage(teamId, form);
```

使用扁平方法 `sdk.ai.editImage`，没有 `sdk.ai.images.edit` 命名空间。

## 5. Node.js 调用聊天兼容接口

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

## 6. Web 前端直连 AI 接口

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

## 7. BFF 封装一个摘要接口

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

## 8. 移动端通过业务服务端请求摘要

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

## 9. 传入会话 ID 做连续对话

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

## 10. AI 接入高风险误区

- 不要把 `chat/completions` 当成工作流发布、挂载、调试全能力
- 不要忽略 `teamId`
- 不要把模型选择逻辑写死成单一值而不考虑团队默认模型
- 不要把 401 以外的错误都当成登录失效；403 常见于团队或模型权限不足
- 不要固定读取 `response.data.data` 或用 `as` 掩盖未知响应
- 不要把业务引擎代码直接传给 `model`
- 不要把 AI 客户端未初始化静默伪装成生产成功
- 不要只判断一个视频终态或省略总超时

## 11. 最小验证命令

```bash
dimens-cli ai chat-completions --team-id TEAM1 --message "帮我总结本周项目风险"
dimens-cli ai models --team-id TEAM1 --capability image
dimens-cli ai image-generate --team-id TEAM1 --prompt "企业数据驾驶舱海报" --model default --size 1024x1024
```

如果 CLI 调用失败，先排查 token、团队权限、模型配置和网络，再调整 Web / BFF 代码。
