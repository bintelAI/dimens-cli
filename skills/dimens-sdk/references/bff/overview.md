# BFF / 服务端接入总览

## 适用场景

用于 Node.js、Next.js Route Handler、Nuxt Server Route、NestJS、Express、Serverless Function 等服务端或 BFF 层接入。

| 场景 | 推荐路径 | 必读文档 |
| --- | --- | --- |
| 服务端集中保存密钥 | `apiSecret` 放环境变量或密钥系统 | `../bff-examples.md` |
| 服务端换 token 给前端 | BFF 代理登录或资源请求 | `../frontend-auth-flow.md` |
| 需要 SDK 初始化 | `createSDK({ baseUrl, token })` | `../capability-status.md` |
| 请求失败重试 | 只对 401 refresh，403/404/409 分开处理 | `../request-retry-example.md` |

## 默认输出顺序

1. 说明 `apiSecret` 只放服务端，日志不能打印完整密钥、token、refreshToken。
2. 说明 `baseUrl` 默认 `https://dimens.bintelai.com/api`，也可以由环境变量覆盖。
3. 说明业务函数显式接收 `teamId/projectId`，不要把团队或项目写死在单例里。
4. 按资源域拆服务：`project`、`sheet`、`document`、`report`、`ai`、`upload`。
5. 写操作按“先读当前数据 -> 合并目标字段 -> 再提交更新”。
6. 给 CLI 预检和回查命令，先排除认证、权限和资源 ID 问题。

## 不要做

- 不要把 BFF 写成简单透传所有维表接口的万能代理。
- 不要在日志、错误上报或前端响应里泄漏密钥。
- 不要在 SDK 单例里绑定某个固定 `teamId/projectId` 后复用到所有用户。
