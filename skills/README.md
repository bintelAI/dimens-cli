# 维表智联 Skill 体系

## 1. 技能体系定位

这里是 `dimens-cli/skills/` 的独立 Skill 体系总入口。

这套 Skill 体系只服务于一个产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

这套体系的核心约束只有两条：

1. Skill 内部不要再引用外部文档体系
2. 只能通过 Skill 与 Skill 之间互相路由、互相引用

也就是说：

- 不再把外部规则文档当成 Skill 的前置依赖
- Skill 自己就是一套独立的产品操作知识体系

## 2. 使用前提

这些 Skill 默认建立在 `dimens-cli` 已可用的前提下。

如果本地还没有 `dimens-cli` 命令，需要先安装：

```bash
npm install -g @bintel/dimens-cli
```

或：

```bash
npm install @bintel/dimens-cli
```

或：

```bash
pnpm add @bintel/dimens-cli
```

只有当 `@bintel/dimens-cli` 已安装，并且本地能执行 `dimens-cli` 或 `node ./bin/dimens-cli.js` 时，这些 Skill 里的命令、案例和映射才成立。

## 3. 当前 Skill 总览

当前 `维表智联` 的 Skill 体系已落地 8 个正式技能：

| Skill | 业务域 | 什么时候优先用 |
| --- | --- | --- |
| `dimens-system-orchestrator` | 系统级总控编排、模块拆解、Skill 路由、执行顺序 | 处理“生成一个 XX 系统 / 平台 / 管理系统 / 业务系统” |
| `dimens-workflow` | 工作流、模型路由、项目挂载、OpenAI 兼容聊天 | 处理工作流、AI 分析、审批、自动化、默认模型问题 |
| `dimens-key-auth` | API Key / Secret、换 token、鉴权边界 | 处理 `api-key-login`、第三方接入、token 复用问题 |
| `dimens-team` | 团队、成员、部门、项目、租户隔离、默认上下文 | 处理团队/项目上下文、看不到项目、上下文切换问题 |
| `dimens-project` | 项目创建、项目初始化、建表前置、默认公开视图补齐 | 处理从 `teamId` 开始落项目，再衔接表和权限主链 |
| `dimens-table` | 工作表、字段、视图、行数据、系统视图字段 | 处理多维表格、字段、行写入、系统视图映射问题 |
| `dimens-permission` | 准入、表级、列级、行级、协同权限、公开访问者 | 处理权限、只读、越权同步、公开访问问题 |
| `dimens-report` | 报表主资源、图表组件、参数联动、数据源与查询链路 | 处理报表、图表、参数筛选、数据源查询与创建前预检问题 |

## 4. 首页先记住的统一规则

在进入任意子 Skill 之前，先统一记住下面几条产品级规则：

### 4.1 项目资源默认按“三驾马车”理解

项目初始化或系统搭建时，默认不要只想到表格。

项目内核心资源默认是：

1. 表格
2. 文档
3. 报表

推荐理解方式：

- 表格负责承接结构化业务对象
- 文档负责承接 TipTap 在线说明、制度、知识沉淀
- 报表负责承接统计分析、经营看板、仪表盘

如果一个项目只补了其中一个资源，就不要过早声称“项目初始化已完成”。

同样不要把项目理解成“只能创建，不能持续修改”。项目创建完成后，默认还要允许围绕三驾马车继续维护：

- 表格可继续增改字段、视图、行数据
- 文档可继续增删改查与版本恢复
- 报表可继续调整主资源、组件和查询链路

文档资源默认也不是只有 `doc create`，而是文档主链：

`doc create -> doc info -> doc update -> doc delete`

如果用户明确提到历史版本、回滚、恢复旧内容，还要继续进入版本主链：

`doc versions -> doc version -> doc restore`

### 4.2 字段里有几类特殊情况，不能按普通下拉糊过去

如果字段语义本身就是下面这些：

- 人员
- 部门
- 带固定业务语义的枚举下拉

就不要一律退化成普通 `select`。

统一规则：

- 人员字段优先使用人员字段
- 部门字段优先使用部门字段
- 普通下拉字段如果要自定义候选项，同一个字段下每个选项 `id` 必须唯一

否则后续在权限、筛选、统计、报表映射上都容易出问题。

### 4.3 报表不是“建一个空资源”就结束

如果问题已经落到报表，默认要先记住两件事：

1. 当前报表 Skill 覆盖三条主链
2. 直接生成图表前必须先走固定预检链

当前报表 Skill 默认覆盖三条主链：

1. 主资源链：`report create/update/copy/publish/delete/archive/validate/sort/move`
2. 组件链：`widget-add/update/delete/batch/sort`
3. 查询链：`query/query-widget/preview`

当用户要“直接生成一个报表 / 看板 / 图表组件”时，默认固定预检链是：

`report create -> report preview -> report widget-add -> report query-widget -> report query`

不要跳过这条链，直接从 `widget-add` 开始。

### 4.4 首页级高风险跑偏点

- 不要把系统搭建理解成“只建几张表”
- 不要把项目初始化理解成“只创建项目壳子”或“只补一种资源”
- 不要把人员字段、部门字段误建成普通下拉
- 不要让下拉选项 `id` 重复
- 不要把报表理解成只有一个空主资源
- 不要跳过固定预检链直接创建图表组件

## 5. 默认路由顺序

很多问题不是单 Skill 能独立解释的，建议按下面顺序判断。

### 5.1 系统级任务优先

如果用户的问题是：

- 帮我生成一个客户管理系统
- 帮我做一个项目管理平台
- 搭一个审批系统
- 生成一个业务系统

优先从 `dimens-system-orchestrator` 入手。

### 5.2 上下文优先

如果用户的问题里没有明确：

- `teamId`
- `projectId`
- 资源归属

优先从 `dimens-team` 入手。

如果用户已经明确要“创建项目 / 初始化项目 / 建一个能直接继续搭表的项目”，优先进入 `dimens-project`。

### 5.3 资源域优先

如果资源对象已经明确，再切到具体业务 Skill：

| 资源类型 | 优先 Skill |
| --- | --- |
| 系统建设 / 平台规划 / 管理系统 | `dimens-system-orchestrator` |
| 工作流 / AI 分析 / 审批 / 自动化 | `dimens-workflow` |
| API Key / token / 第三方鉴权 | `dimens-key-auth` |
| 项目创建 / 项目初始化 / 默认公开视图补齐 | `dimens-project` |
| 工作表 / 字段 / 行 / 视图 | `dimens-table` |
| 权限 / 公开访问 / 协同越权 | `dimens-permission` |
| 报表 / 图表 / 参数 / 数据源 | `dimens-report` |

补充说明：

- 如果已经进入 `dimens-report`，不要只理解成“加一个图表”
- 当前报表 Skill 默认覆盖三条主链：
  1. 主资源链：`report create/update/copy/publish/delete/archive/validate/sort/move`
  2. 组件链：`widget-add/update/delete/batch/sort`
  3. 查询链：`query/query-widget/preview`
- 当用户要“直接生成一个报表 / 看板 / 图表组件”时，默认固定预检链是：
  `report create -> report preview -> report widget-add -> report query-widget -> report query`

高风险跑偏点：

- 不要把“报表”理解成只有一个空主资源；空报表不等于可用报表
- 不要跳过固定预检链，直接从 `widget-add` 开始
- 不要把 `recommendedMapping` 当成最终渲染映射；真正渲染看的是 `dataMapping`
- 不要只写 `sheetId` 就认为多维表格数据源已完整；通常还需要 `columns`、`fieldIds`、`previewMapping`
- 不要假设 Skill 文档说得通，CLI 就一定能创建成功；必须结合 `preview` 或 `query-widget` 验证

## 6. 技能目录结构

当前目录结构遵循“主 Skill + README + rules + assets + references”的组织方式：

```text
skills/
├── README.md
├── dimens-system-orchestrator/
│   ├── SKILL.md
│   ├── README.md
│   ├── rules/
│   ├── assets/
│   └── references/
├── dimens-workflow/
│   ├── SKILL.md
│   ├── README.md
│   ├── rules/
│   ├── assets/
│   └── references/
├── dimens-key-auth/
│   ├── SKILL.md
│   ├── README.md
│   ├── rules/
│   ├── assets/
│   └── references/
├── dimens-team/
│   ├── SKILL.md
│   ├── README.md
│   ├── rules/
│   ├── assets/
│   └── references/
├── dimens-project/
│   ├── SKILL.md
│   ├── README.md
│   ├── rules/
│   ├── assets/
│   └── references/
├── dimens-table/
│   ├── SKILL.md
│   ├── README.md
│   ├── rules/
│   ├── assets/
│   └── references/
├── dimens-permission/
│   ├── SKILL.md
│   ├── README.md
│   ├── rules/
│   ├── assets/
│   └── references/
└── dimens-report/
    ├── SKILL.md
    ├── README.md
    ├── rules/
    ├── assets/
    └── references/
```

### 6.1 `SKILL.md` 的职责

每个主 `SKILL.md` 负责：

- frontmatter 中定义 Skill 名称与触发条件
- 给出执行前必读
- 给出快速索引
- 给出核心约束
- 给出必查 Skill
- 给出高频使用场景

### 6.2 `rules/` 与 `assets/` 的职责

- `rules/`：兼容 ClawHub / OpenClaw 等平台的规则目录扫描
- `assets/`：兼容平台资源目录要求，并统一承接封面、图标、截图等视觉资源说明

如果平台不保留原始相对链接，优先按“当前技能目录下的 `SKILL.md -> README.md -> references/`”顺序阅读。

素材命名、尺寸和推荐清单统一参考：

- `assets-命名规范.md`

### 6.3 `references/` 的职责

`references/` 用来承接：

- 详细示例
- 接口级入参 / 出参清单
- 长篇业务规则
- 特定专题说明
- 不适合塞进主 `SKILL.md` 的补充知识

## 7. Skill 之间如何互相调用

这是一个独立 Skill 体系，所以默认只允许 Skill 之间互相路由。

推荐理解方式：

| 当前问题 | 优先进入 |
| --- | --- |
| 先拆系统、再决定做哪些模块 | `dimens-system-orchestrator` |
| 先确认团队、项目、上下文 | `dimens-team` |
| 先创建项目并补齐默认公开视图 | `dimens-project` |
| 先设计表、字段、关联、row/page | `dimens-table` |
| 解释谁能看、谁能改、协同为什么异常 | `dimens-permission` |
| 解释工作流、默认模型、AI 分析 | `dimens-workflow` |
| 解释图表、看板、数据源、参数联动 | `dimens-report` |
| 解释 Key 登录、token 复用、第三方接入 | `dimens-key-auth` |

其中 `dimens-report` 的默认阅读顺序建议是：

1. 先看 `dimens-report/SKILL.md`
2. 再看 `dimens-report/references/capability-status.md`
3. 如果要生成组件，再看 `dimens-report/references/recharts-widget-guide.md`
4. 如果要看接口和命令案例，再看 `dimens-report/references/examples.md`

## 8. Skill 体系的产品统一口径

后续新增或修改 Skill 时，统一使用以下产品口径：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

不要再混用模糊名称作为主产品名。

## 9. 当前推荐阅读顺序

当前建议按下面顺序查：

1. 先看本 README，确认问题落在哪个 Skill
2. 如果是系统建设类需求，先看 `dimens-system-orchestrator`
3. 如果是团队和项目边界问题，先看 `dimens-team`
4. 如果是项目创建、项目初始化、建表前置问题，先看 `dimens-project`
5. 如果是表、字段、row/page 问题，先看 `dimens-table`
6. 如果是工作流、权限、报表、Key 接入问题，再进入对应业务 Skill
7. 如果是报表生成类需求，优先先看 `dimens-report`，并按 `report create -> report preview -> report widget-add -> report query-widget -> report query` 的固定预检链执行
8. 需要接口级细节时，再继续看对应 Skill 下的 `references/*.md`

### 9.1 报表类需求的默认防跑偏规则

如果问题落到报表：

1. 先确认是不是已经有 `projectId`
2. 再确认是不是多维表格数据源
3. 如果是多维表格数据源，不要直接输出组件命令，先确认 `sheet.columns + fieldIds + previewMapping + dataMapping`
4. 如果用户要求“直接生成”，也必须优先给预检步骤，而不是只给最终创建命令

## 10. 发布兼容说明

当前 8 个正式技能目录都已经补齐：

- `SKILL.md`
- `README.md`
- `rules/`
- `assets/`

发布到 ClawHub / OpenClaw 时，建议按下面口径理解：

- 业务正文仍以每个技能目录下的 `SKILL.md` 和 `README.md` 为主
- `references/` 保留接口级和场景级扩展资料
- `rules/` 和 `assets/` 主要用于兼容平台目录规范
- 封面、图标、截图的命名规范统一看 `assets-命名规范.md`
- 如果平台不稳定支持相对链接，优先按技能目录名进入对应目录阅读，不依赖 `../...` 形式跳转
