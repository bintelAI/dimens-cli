# dimens-sdk

用于维表智联 Web 端、移动端、Node.js / BFF 场景下的 SDK 与 HTTP 对接技能。

## 定位

`dimens-sdk` 只处理开发者接入问题：浏览器、BFF、Node.js、移动端、HTTP API、`@bintel/dimens-cli` SDK、token 刷新、密钥存放和资源调用代码。

项目内资源创建、配置、权限、报表、工作流、画布等业务落地，优先进入 `dimens-manager`；完整系统拆解优先进入 `dimens-system-orchestrator`。

## 目录

| 目录或文件 | 用途 |
| --- | --- |
| `references/frontend/overview.md` | Web/H5/React/Vue 接入总览 |
| `references/bff/overview.md` | BFF、SSR、服务端代理接入总览 |
| `references/node/overview.md` | Node.js SDK、脚本和后端任务接入总览 |
| `references/mobile/overview.md` | App、小程序、移动 H5 安全接入总览 |
| `references/resources/overview.md` | 表格、文档、报表、权限、画布、AI 等资源域代码调用 |
| `references/media/overview.md` | 上传图片、附件、封面、素材后的业务写入链路 |
| `references/integration-paths.md` | SDK / HTTP / BFF 接入路径选择 |
| `references/capability-status.md` | 当前 SDK 已封装能力和使用边界 |
| `references` 下的 `*-examples.md` | 具体代码案例 |

## 阅读顺序

1. 先看命中的 `overview.md`，确认接入位置和安全边界。
2. 再看 `integration-paths.md` 与 `capability-status.md`，确认 SDK / HTTP / BFF 选型。
3. 最后进入对应 `*-examples.md`，只读取当前任务需要的案例。

## 维护原则

- `SKILL.md` 只保留入口、路由和风险约束。
- 端侧、服务端、资源域、上传等细节下沉到 `references` 子目录的 `overview.md`。
- 具体代码片段放在 `references` 下的 `*-examples.md`。
- 文档里的 SDK 模块和方法名必须以 `dimens-cli/src/sdk/` 当前实现为准。
