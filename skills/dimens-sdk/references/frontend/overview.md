# 前端接入总览

## 适用场景

用于 Web、H5、React、Vue 等浏览器端接入维表智联能力。

先判断用户有没有安全来源的用户 `token`：

| 场景 | 推荐路径 | 必读文档 |
| --- | --- | --- |
| 首次接入前端 SDK / HTTP | 先跑通登录态主链 | `../frontend-quickstart.md` |
| 需要登录、刷新、退出 | 建立 auth + storage + retry 分层 | `../frontend-auth-flow.md` |
| React / Vue 项目落代码 | 按 `src/lib`、`src/api`、`hooks` 拆分 | `../react-auth-example.md` |
| token 过期、并发 401 | 串行 refresh，成功后重试原请求 | `../request-retry-example.md` |
| 少量接口直连 | 用已安全取得的 token 走 HTTP | `../web-examples.md` |

## 默认输出顺序

1. 说明浏览器端不能保存 `apiSecret`。
2. 说明 token 来源：用户登录、BFF 下发或服务端短期 token。
3. 明确 `teamId/projectId` 来自当前团队和项目上下文，不能写死。
4. 给最小文件拆分：`dimens-storage.ts`、`dimens-auth.ts`、`dimens-sdk.ts`、`dimens-request.ts`。
5. 给 401、403、404、409 的处理边界。
6. 给 `dimens-cli auth status`、`project info`、`sheet/report/doc info` 这类验证命令。

## 不要做

- 不要把 `apiSecret`、高权限 token 或 refresh token 明文写进前端配置。
- 不要把 403、404 都当成 token 过期。
- 不要让页面组件直接散落 `localStorage`、refresh 和接口拼接逻辑。
- 不要让一个全局 SDK 实例在 token 刷新后继续使用旧 token。
