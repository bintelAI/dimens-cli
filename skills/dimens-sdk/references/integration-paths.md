# SDK / HTTP 接入路径说明

## 1. 什么时候优先用 SDK

优先使用 `@bintel/dimens-cli` SDK 的场景：

- Node.js 服务端
- Next.js / Nuxt 的服务端路由
- BFF 聚合层
- 内部自动化脚本
- 需要统一封装 token、错误处理、重试和日志的场景

核心原因：

- 便于统一 `baseUrl`
- 便于集中处理 `Authorization`
- 便于按资源域拆分服务层
- 更适合隐藏 `apiSecret`

## 2. 什么时候可以直接走 HTTP

可以直接走 HTTP 的场景：

- 前端已经拿到了安全来源的用户 token
- 只是消费少量清晰的业务接口
- 团队不希望再维护一层 BFF
- 不涉及在端上长期保存高权限密钥

注意：

- 直接 HTTP 不代表可以把密钥放到浏览器或 App 包里
- 只要需要 `apiKey + apiSecret` 换 token，默认优先放在服务端

## 3. Web / H5 推荐路径

推荐：

1. 业务系统用户先登录
2. 服务端持有维表认证逻辑
3. 前端拿受控 token 或直接调 BFF
4. 业务代码按项目、表格、文档、报表拆模块

## 4. App / 小程序 推荐路径

推荐：

1. App 不直接持有 `apiSecret`
2. 服务端代管密钥并换 token
3. App 只使用短期 token 或透传接口

## 5. Node.js / BFF 推荐路径

推荐：

1. 安装 `@bintel/dimens-cli`
2. 初始化 `createSDK({ baseUrl, token })`
3. 业务函数显式接收 `teamId/projectId`
4. 按 `project/sheet/document/report/ai` 拆服务
