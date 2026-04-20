# dimens-cli/skills 素材命名规范

## 1. 目的

这份文档用于统一 `dimens-cli/skills` 在 ClawHub / OpenClaw 等技能平台发布时的素材目录规范，避免每个技能各写各的命名方式。

当前目标不是强制每个技能都立即补图片，而是先把：

- 文件命名
- 推荐尺寸
- 是否必填
- 素材用途

一次性定清楚，后续再补素材时可以直接照着交付。

## 2. 适用范围

当前规范适用于 8 个正式技能目录：

- `dimens-system-orchestrator`
- `dimens-workflow`
- `dimens-key-auth`
- `dimens-team`
- `dimens-project`
- `dimens-table`
- `dimens-permission`
- `dimens-report`

## 3. 基础原则

### 3.1 命名统一

- 文件名统一使用小写英文字母、数字和连字符
- 不使用空格
- 不使用中文文件名
- 不把技能名重复写进基础素材文件名里

推荐：

- `cover.png`
- `icon.png`
- `screenshot-01.png`

不推荐：

- `维表智联总控技能封面图最终版.png`
- `dimens-system-orchestrator-cover-final-v2.png`

### 3.2 格式统一

优先使用：

- `.png`
- `.jpg`
- `.jpeg`
- `.webp`
- `.svg` 仅用于图标或纯矢量素材

建议优先：

- 封面：`png` 或 `webp`
- 图标：`png` 或 `svg`
- 截图：`png`

### 3.3 目录统一

所有素材默认只放在各技能目录自己的 `assets/` 下，不再新建更深层目录。

例如：

```text
dimens-table/
└── assets/
    ├── README.md
    ├── cover.png
    ├── icon.png
    └── screenshot-01.png
```

## 4. 推荐素材清单

| 文件名 | 是否必填 | 推荐尺寸 | 用途 |
| --- | --- | --- | --- |
| `cover.png` | 可选 | 1600x900 或 1200x675 | 技能封面、卡片头图、市场详情首屏 |
| `icon.png` | 可选 | 512x512 或 256x256 | 技能图标、列表缩略图 |
| `screenshot-01.png` | 可选 | 1600x900 以内 | 第一张技能截图，展示核心能力 |
| `screenshot-02.png` | 可选 | 1600x900 以内 | 第二张技能截图，展示典型场景 |
| `screenshot-03.png` | 可选 | 1600x900 以内 | 第三张技能截图，展示补充流程 |

## 5. 推荐视觉口径

### 5.1 封面图

建议封面图只表达一个核心主题，不要把所有能力都堆在一张图里。

推荐做法：

- 标题只保留技能名或一句短描述
- 背景和主视觉保持简洁
- 优先突出该技能的业务域

例如：

- `dimens-table`：表格、字段、视图
- `dimens-permission`：角色、权限矩阵、访问控制
- `dimens-system-orchestrator`：系统搭建、链路编排

### 5.2 图标

建议图标保持高辨识度，不使用过多文字。

推荐：

- 单一主形状
- 明确业务象征
- 对比度足够

### 5.3 截图

截图建议优先展示：

1. 最核心能力入口
2. 典型执行结果
3. 与其他技能的衔接关系

截图不建议：

- 包含无关的本地系统窗口
- 使用分辨率过低的截图
- 把终端大段日志直接当海报

## 6. 最小发布口径

如果当前还没有正式视觉素材，每个技能目录允许只保留：

- `assets/README.md`

这表示目录结构已经满足平台要求，但视觉资源尚未补齐。

如果准备补最小可发布素材，建议至少补：

- `cover.png`
- `icon.png`

如果准备做更完整的市场展示，再补：

- `screenshot-01.png`
- `screenshot-02.png`

## 7. 技能目录内的推荐口径

每个技能目录下的 `assets/README.md` 建议保持同样的结构：

1. 当前技能名称
2. 推荐素材文件名
3. 当前是否必须
4. 若没有素材时如何处理
5. 指回本规范文档

## 8. 不建议做的事

- 不要在不同技能里发明不同的文件名规范
- 不要把封面命名成 `banner-final-v3.png` 这类临时名
- 不要把截图散落在 `references/` 或根目录
- 不要把平台素材和业务文档混放

## 9. 当前建议结论

当前 `dimens-cli/skills` 最稳的发布策略是：

1. 先统一目录结构和素材命名规范
2. 每个技能先保留 `assets/README.md`
3. 真正上架前，再按优先级补 `cover.png` 和 `icon.png`
4. 如果平台详情页支持多图，再继续补 `screenshot-01.png` 到 `screenshot-03.png`
