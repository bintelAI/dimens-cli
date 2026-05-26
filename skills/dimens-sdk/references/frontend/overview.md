# 前端接入总览

## 适用场景

用于 Web、H5、React、Vue 等浏览器端接入维表智联能力。

如果用户是开发维表自定义页面、Wujie 嵌入页，或明确使用 `dimens-cli/dimens-web` 脚手架，先读：

- `../dimens-web-scaffold.md`

这种场景不要重新生成 `dimens-storage.ts / dimens-auth.ts / dimens-sdk.ts / dimens-request.ts`，应复用脚手架已有的 `useDimens()`、`runtimeStore`、`appSdk.ts` 和 retry 机制。

自定义页面场景还必须把 UI/UX 设计前置：先确认是否已安装 `ui-ux-pro-max-plus`（技能名 `ui-ux-pro-max`），未安装先安装；安装或可用后，先用该技能确定页面风格、配色、布局、组件、图表和状态设计，再进入脚手架代码实现。

先判断用户有没有安全来源的用户 `token`：

| 场景 | 推荐路径 | 必读文档 |
| --- | --- | --- |
| 维表自定义页面 / Wujie / `dimens-web` | 复用脚手架上下文和 SDK | `../dimens-web-scaffold.md` |
| 首次接入前端 SDK / HTTP | 先跑通登录态主链 | `../frontend-quickstart.md` |
| 需要登录、刷新、退出 | 建立 auth + storage + retry 分层 | `../frontend-auth-flow.md` |
| React / Vue 项目落代码 | 按 `src/lib`、`src/api`、`hooks` 拆分 | `../react-auth-example.md` |
| token 过期、并发 401 | 串行 refresh，成功后重试原请求 | `../request-retry-example.md` |
| 少量接口直连 | 用已安全取得的 token 走 HTTP | `../web-examples.md` |

## 默认输出顺序

1. 说明浏览器端不能保存 `apiSecret`。
2. 说明 token 来源：用户登录、BFF 下发或服务端短期 token。
3. 明确 `teamId/projectId` 来自当前团队和项目上下文，不能写死。
4. 如果是 `dimens-web`，先输出 `ui-ux-pro-max` 页面设计结论，再给脚手架文件路径和 `useDimens()` 示例；如果是普通前端，再给最小文件拆分：`dimens-storage.ts`、`dimens-auth.ts`、`dimens-sdk.ts`、`dimens-request.ts`。
5. 给 401、403、404、409 的处理边界。
6. 给 `dimens-cli auth status`、`project info`、`sheet/report/doc info` 这类验证命令。

## 不要做

- 不要把 `apiSecret`、高权限 token 或 refresh token 明文写进前端配置。
- 不要把 403、404 都当成 token 过期。
- 不要让页面组件直接散落 `localStorage`、refresh 和接口拼接逻辑。
- 不要让一个全局 SDK 实例在 token 刷新后继续使用旧 token。
- 不要在 `dimens-web` 自定义页面里绕过 `useDimens()` 直接拼接口 URL。
- 不要在 `dimens-web` 自定义页面里跳过 UI/UX 前置设计；先用 `ui-ux-pro-max` 定设计，再写页面。
