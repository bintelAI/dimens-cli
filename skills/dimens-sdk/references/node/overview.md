# Node.js SDK 接入总览

## 适用场景

用于脚本、服务端任务、内部自动化、Node.js 后端直接使用 `@bintel/dimens-cli` SDK。

| 场景 | 推荐路径 | 必读文档 |
| --- | --- | --- |
| 选择 SDK 还是 HTTP | 先定接入架构 | `../integration-paths.md` |
| 确认 SDK 模块能力 | 对照当前已封装模块 | `../capability-status.md` |
| 服务端资源调用 | `createSDK({ baseUrl, token })` | `../bff-examples.md` |
| AI 聊天兼容调用 | 使用 `sdk.ai` 或 CLI 预检 | `../ai-examples.md` |

## 当前基础要求

- `@bintel/dimens-cli` 的 Node.js 要求是 `>=20`。
- 包入口导出 `createSDK`、`DimensSDK` 和各业务 SDK 类。
- SDK 初始化只负责 `baseUrl/token/refreshToken` 等客户端配置，资源上下文仍应由业务函数显式传入。

## 默认输出顺序

1. 给安装方式：`pnpm add @bintel/dimens-cli` 或当前仓库本地开发路径。
2. 给 `createSDK` 初始化片段。
3. 根据资源域选择 `project/sheet/column/view/row/document/report/canvas/upload/ai` 示例。
4. 写操作必须说明读取当前版本或当前数据后再更新。
5. 给 CLI 预检命令和 SDK 代码的对应关系。

## 不要做

- 不要假设所有服务端接口都已有稳定 SDK 封装。
- 不要跳过 `version/baseVersion` 直接覆盖文档、行或画布数据。
- 不要把 `chat/completions` 误写成完整工作流管理接口。
