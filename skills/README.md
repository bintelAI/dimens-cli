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

当前 `维表智联` 的 Skill 体系已落地 7 个正式技能：

| Skill | 业务域 | 什么时候优先用 |
| --- | --- | --- |
| `dimens-system-orchestrator` | 系统级总控编排、模块拆解、Skill 路由、执行顺序 | 处理“生成一个 XX 系统 / 平台 / 管理系统 / 业务系统” |
| `dimens-workflow` | 工作流、模型路由、项目挂载、OpenAI 兼容聊天 | 处理工作流、AI 分析、审批、自动化、默认模型问题 |
| `dimens-key-auth` | API Key / Secret、换 token、鉴权边界 | 处理 `api-key-login`、第三方接入、token 复用问题 |
| `dimens-team` | 团队、成员、部门、项目、租户隔离、默认上下文 | 处理团队/项目上下文、看不到项目、上下文切换问题 |
| `dimens-table` | 工作表、字段、视图、行数据、系统视图字段 | 处理多维表格、字段、行写入、系统视图映射问题 |
| `dimens-permission` | 准入、表级、列级、行级、协同权限、公开访问者 | 处理权限、只读、越权同步、公开访问问题 |
| `dimens-report` | 报表、图表组件、参数联动、数据源与查询链路 | 处理报表、图表、参数筛选、数据源查询问题 |

## 4. 默认路由顺序

很多问题不是单 Skill 能独立解释的，建议按下面顺序判断。

### 4.1 系统级任务优先

如果用户的问题是：

- 帮我生成一个客户管理系统
- 帮我做一个项目管理平台
- 搭一个审批系统
- 生成一个业务系统

优先从 `dimens-system-orchestrator` 入手。

### 4.2 上下文优先

如果用户的问题里没有明确：

- `teamId`
- `projectId`
- 资源归属

优先从 `dimens-team` 入手。

### 4.3 资源域优先

如果资源对象已经明确，再切到具体业务 Skill：

| 资源类型 | 优先 Skill |
| --- | --- |
| 系统建设 / 平台规划 / 管理系统 | `dimens-system-orchestrator` |
| 工作流 / AI 分析 / 审批 / 自动化 | `dimens-workflow` |
| API Key / token / 第三方鉴权 | `dimens-key-auth` |
| 工作表 / 字段 / 行 / 视图 | `dimens-table` |
| 权限 / 公开访问 / 协同越权 | `dimens-permission` |
| 报表 / 图表 / 参数 / 数据源 | `dimens-report` |

## 5. 技能目录结构

当前目录结构遵循“主 Skill + references”的组织方式：

```text
skills/
├── README.md
├── references/
│   └── cli-api-catalog.md
├── dimens-system-orchestrator/
│   ├── SKILL.md
│   └── references/
├── dimens-workflow/
│   ├── SKILL.md
│   └── references/
├── dimens-key-auth/
│   ├── SKILL.md
│   └── references/
├── dimens-team/
│   ├── SKILL.md
│   └── references/
├── dimens-table/
│   ├── SKILL.md
│   └── references/
├── dimens-permission/
│   ├── SKILL.md
│   └── references/
└── dimens-report/
    ├── SKILL.md
    └── references/
```

### 5.1 `SKILL.md` 的职责

每个主 `SKILL.md` 负责：

- frontmatter 中定义 Skill 名称与触发条件
- 给出执行前必读
- 给出快速索引
- 给出核心约束
- 给出必查 Skill
- 给出高频使用场景

### 5.2 `references/` 的职责

`references/` 用来承接：

- 详细示例
- 接口级入参 / 出参清单
- 长篇业务规则
- 特定专题说明
- 不适合塞进主 `SKILL.md` 的补充知识

## 6. Skill 之间如何互相调用

这是一个独立 Skill 体系，所以默认只允许 Skill 之间互相路由。

推荐理解方式：

| 当前问题 | 优先进入 |
| --- | --- |
| 先拆系统、再决定做哪些模块 | `dimens-system-orchestrator` |
| 先确认团队、项目、上下文 | `dimens-team` |
| 先设计表、字段、关联、row/page | `dimens-table` |
| 解释谁能看、谁能改、协同为什么异常 | `dimens-permission` |
| 解释工作流、默认模型、AI 分析 | `dimens-workflow` |
| 解释图表、看板、数据源、参数联动 | `dimens-report` |
| 解释 Key 登录、token 复用、第三方接入 | `dimens-key-auth` |

## 7. Skill 体系的产品统一口径

后续新增或修改 Skill 时，统一使用以下产品口径：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

不要再混用模糊名称作为主产品名。

## 8. 当前推荐阅读顺序

当前建议按下面顺序查：

1. 先看本 README，确认问题落在哪个 Skill
2. 如果是系统建设类需求，先看 `dimens-system-orchestrator`
3. 如果是团队和项目边界问题，先看 `dimens-team`
4. 如果是表、字段、row/page 问题，先看 `dimens-table`
5. 如果是工作流、权限、报表、Key 接入问题，再进入对应业务 Skill
6. 需要接口级细节时，再继续看对应 Skill 下的 `references/*.md`
