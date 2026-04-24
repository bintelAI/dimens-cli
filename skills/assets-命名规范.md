# dimens-cli/skills 素材命名规范

## 1. 目的

这份文档用于统一 `dimens-cli/skills` 在 ClawHub / OpenClaw 等技能平台发布时的素材目录规范，避免每个技能各写各的命名方式。

## 2. 适用范围

当前顶层正式技能目录只有 3 个：

- `dimens-system-orchestrator`
- `dimens-manager`
- `dimens-sdk`

`dimens-manager/references/*/` 是内部业务章节，不再作为独立顶层技能发布；如需章节级素材，应优先放在 `dimens-manager/assets/` 并通过文件名体现业务域。

## 3. 基础原则

- 文件名统一使用小写英文字母、数字和连字符。
- 不使用空格。
- 不使用中文文件名。
- 不把“最终版”“新新版本”这类状态写进文件名。
- 顶层技能素材默认放在各技能目录自己的 `assets/` 下。

推荐文件名：

- `cover.png`
- `icon.png`
- `screenshot-01.png`
- `screenshot-02.png`
- `screenshot-03.png`

如果 `dimens-manager` 需要业务域截图，可使用：

- `screenshot-table-01.png`
- `screenshot-permission-01.png`
- `screenshot-report-01.png`

## 4. 推荐格式

| 类型 | 推荐格式 | 推荐尺寸 |
| --- | --- | --- |
| 封面 | `png` / `webp` | 1600x900 或 1200x675 |
| 图标 | `png` / `svg` | 512x512 或 256x256 |
| 截图 | `png` | 1600x900 以内 |

## 5. 视觉口径

| 技能 | 推荐主题 |
| --- | --- |
| `dimens-system-orchestrator` | 系统搭建、模块拆解、链路编排 |
| `dimens-manager` | 项目管理、表格、权限、工作流、报表的统一业务管理 |
| `dimens-sdk` | SDK、API、Web/BFF/Node.js 集成 |

## 6. 最小发布口径

如果当前还没有正式视觉素材，每个顶层技能目录允许只保留：

- `assets/README.md`

这表示目录结构满足平台要求，但视觉资源尚未补齐。
