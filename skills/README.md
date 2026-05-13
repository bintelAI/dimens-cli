# 维表智联 Skill 体系

## 1. 技能体系定位

这里是 `dimens-cli/skills/` 的独立 Skill 体系总入口。

这套 Skill 体系只服务于一个产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

这套体系的核心约束只有三条：

1. Skill 内部不要再引用外部文档体系
2. 只能通过 Skill 与 Skill 之间互相路由、互相引用
3. CLI 优先；只要 `dimens-cli` 已覆盖对应能力，就不要把手写 HTTP、拼接页面 URL 或人工页面操作当成首选路径

也就是说：

- 不再把外部规则文档当成 Skill 的前置依赖
- Skill 自己就是一套独立的产品操作知识体系
- 系统总控只负责系统级拆解、执行顺序、风险识别和章节路由，项目内落地交给 `dimens-manager`，开发者接入交给 `dimens-sdk`

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

### 2.1 Windows 中文写入前提

Windows 环境下使用 Skill 生成或修改中文文件时，必须先看：

```text
windows-utf8.md
```

统一规则：

- 中文文件必须以 UTF-8 写入。
- 不要使用 `cmd echo 中文 > file.md` 或未指定编码的重定向写中文正文。
- 优先使用 Node.js `fs.writeFileSync(file, content, "utf8")`，或 PowerShell `Set-Content -Encoding utf8`。
- 写入后重新读取文件，确认中文没有变成 `??`。

如果文件里已经出现 `??`，通常说明写入阶段已经有损替换，不能只靠切换显示编码恢复。

## 3. 总入口维护表

### 3.1 全局统一流程

在进入任何 `dimens-manager` 章节之前，先统一遵守下面三条总规则：

1. 所有更新类操作统一按“拿数据 -> 改数据 -> 更新数据”执行
2. 所有资源类更新统一按“先 upload 拿 url -> 把 url 写回当前业务数据 -> 再 update”执行
3. 能用 `dimens-cli` 命令行解决的问题，优先推荐并执行 `dimens-cli` 命令；不要把拼接自定义 URL、让用户手动打开 URL 或绕过 CLI 的 HTTP 地址当成首选方案。

这些规则适用于项目、表格、字段、行、文档、报表、权限等所有更新型场景，不要把局部 patch 当成通用更新模式，也不要用自定义 URL 替代 CLI 已封装的查询、创建、更新、上传和验证链路。

### 3.2 Skill 总入口维护表

| Skill / 模块 | 命令域 | 作用 | 细节说明 |
| --- | --- | --- | --- |
| `dimens-system-orchestrator` | 系统级编排命令、Skill 路由 | 负责系统搭建、模块拆解、执行顺序规划 | 适合“帮我搭一个系统/平台”这类总控任务，不直接替代具体资源命令 |
| `dimens-manager/references/key-auth/overview.md` | `dimens-cli auth api-key-login`、`api_key_*` | 负责 Key 登录、token 复用、第三方接入边界 | 这是认证入口，不是资源更新入口；登录成功不代表自动有资源权限 |
| `dimens-manager/references/team/overview.md` | `team info`、`project list/info`、上下文切换 | 负责团队、项目、租户、默认上下文判断 | 很多问题先确认 `teamId/projectId`，上下文不对，后面所有结论都不稳 |
| `dimens-manager/references/project/overview.md` | `project *`、`upload file`、`doc *`、`report *` 起始链路 | 负责项目创建、项目初始化、三驾马车入口 | 资源类更新默认先上传拿 `url`，项目和文档更新默认先读当前数据再提交 |
| `dimens-manager/references/table/overview.md` | `sheet *`、`column *`、`view *`、`row *` | 负责工作表、字段、视图、行数据建模与更新 | `sheet/column/row` 的更新都走“先读再改再更”，字段设计还要考虑后续报表映射 |
| `dimens-manager/references/permission/overview.md` | `role *`、`permission *`、`row-policy *`、`row-acl *` | 负责角色、项目权限、行级策略、单行 ACL | 权限类更新也走“先拿当前记录再更新”，CLI 成功不等于权限快照已全部收敛 |
| `dimens-manager/references/workflow/overview.md` | `flow_*`、`dimens-cli ai *` | 负责工作流定义、项目挂载、运行调用、模型边界 | 先分清团队定义、项目挂载、运行调用三层，不要混用结论 |
| `dimens-manager/references/report/overview.md` | `report *`、`widget-*`、`query*`、`preview` | 负责报表主资源、组件、查询和预检链路 | 报表和组件更新都默认先取当前数据，新增或修改组件前优先走 `preview` |
| `dimens-manager/references/canvas/overview.md` | `canvas *`、`sheet create --type canvas` | 负责画布资源、AI 生成图数据、版本和组件资源市场 | 保存前先 `canvas info` 拿版本，再 `canvas save --base-version`，不要把画布当成可执行工作流 |
| `dimens-sdk` | SDK / HTTP 接入链路 | 负责 Node、Web、H5、App、BFF 的接入方式说明 | 适合端侧接入和 SDK 使用，不替代 CLI 资源运维主链 |

### 3.3 强调细节

- 所有 `update`、`widget-update`、`row update`、`column update`、`sheet update`、`permission update`、`role update`、`row-policy update` 一律不要直接盲传局部 patch。
- 项目封面、图标、文档图片、文档附件、其他文件资源，一律先 `dimens-cli upload file` 拿到 `url`，再把 `url` 写回当前业务数据。
- 文档更新默认先 `doc info` 拿当前内容和 `version`，再改内容后 `doc update`。
- 报表更新默认先 `report info`；报表组件更新默认先拿当前报表和当前组件，再合并变更。
- 表格链路里 `sheet update`、`column update`、`row update` 也统一按“先读当前数据，再改字段，再更新”处理。
- 权限链路里 `role update`、`permission update`、`row-policy update` 也统一按同一模型处理，不要例外化。
- 技能输出操作方案时，默认给 `dimens-cli ...` 命令；自定义 URL 只用于解析 `teamId/projectId/sheetId/viewId` 或在 CLI 暂未覆盖且用户明确要求时作为补充说明。

## 4. 当前 Skill 总览

当前 `维表智联` 的顶层 Skill 体系只保留 3 个正式技能。画布属于 `dimens-manager` 下的业务章节，不再单独发布顶层 Skill：

| Skill | 业务域 | 什么时候优先用 |
| --- | --- | --- |
| `dimens-system-orchestrator` | 系统级总控编排、模块拆解、执行顺序 | 处理“生成一个 XX 系统 / 平台 / 管理系统 / 业务系统” |
| `dimens-manager` | 项目内业务资源管理：Key 鉴权、团队上下文、项目、表格、权限、工作流、报表 | 处理维表智联项目内创建、配置、维护和排查 |
| `dimens-sdk` | Node.js SDK 与 Web/H5/App HTTP 对接、端侧接入路径与调用边界 | 处理 Web 端、移动端、BFF、Node 服务端接入维表智联 SDK / HTTP API |

`dimens-manager` 内部按 references 分域承载业务章节：

| 章节 | 入口 | 什么时候优先看 |
| --- | --- | --- |
| Key 鉴权 | `dimens-manager/references/key-auth/overview.md` | API Key / Secret、换 token、鉴权边界 |
| 团队上下文 | `dimens-manager/references/team/overview.md` | 团队、成员、部门、项目、租户隔离、默认上下文 |
| 项目初始化 | `dimens-manager/references/project/overview.md` | 项目创建、项目初始化、建表前置、默认公开视图补齐 |
| 多维表格 | `dimens-manager/references/table/overview.md` | 工作表、字段、视图、行数据、系统视图字段 |
| 权限管理 | `dimens-manager/references/permission/overview.md` | 准入、表级、列级、行级、协同权限、公开访问者 |
| 工作流 | `dimens-manager/references/workflow/overview.md` | 工作流、AI 分析、审批、自动化、默认模型问题 |
| 报表 | `dimens-manager/references/report/overview.md` | 报表、图表、参数筛选、数据源查询与创建前预检 |
| 画布 | `dimens-manager/references/canvas/overview.md` | 画布、白板、流程图、AI 生成画布、版本恢复、资源市场 |

审批工作流 AI 自动生成属于 `dimens-manager/references/workflow/references/approval-generation.md`，负责把业务描述转换为审批蓝图、`pluginType=approval` 的工作流 JSON 草案和项目落地计划。

## 5. 首页先记住的统一规则

在进入任意 `dimens-manager` 章节之前，先统一记住下面几条产品级规则：

### 5.1 项目资源默认按“三驾马车”理解

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

当用户提出“帮我创建一个项目 / 系统 / 平台”这类需求时，默认不要直接开始执行命令，而要先按维表特性完成建模设计，再进入创建流程。

默认标准引导路径是：

1. 创建项目
2. 创建多表格
3. 创建多字段
4. 设计 `1 对多 / 多对一` 关联数据
5. 补案例数据
6. 看需求补项目文档
7. 看需求补项目报表
8. 看需求补角色
9. 看需求补权限

其中：

- 多表、多字段、关联、案例数据属于基础建模路径，默认不应跳过
- 文档、报表、角色、权限属于按需补齐的后置模块
- 项目创建不是结束，而是后续持续修改表格、文档、报表的起点

### 5.2 字段里有几类特殊情况，不能按普通下拉糊过去

如果字段语义本身就是下面这些：

- 人员
- 部门
- 带固定业务语义的枚举下拉

就不要一律退化成普通 `select`。

统一规则：

- 人员字段优先使用人员字段
- 部门字段优先使用部门字段
- 普通下拉字段如果要自定义候选项，同一个字段下每个选项 `id` 必须唯一
- 从 Excel 创建普通下拉字段时，必须先从该列实际值提取候选项，再创建字段；行数据只能写入字段 `options` 中已有的值，缺少选项时先补选项再导入

否则后续在权限、筛选、统计、报表映射上都容易出问题。

### 5.3 报表不是“建一个空资源”就结束

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

### 5.4 首页级高风险跑偏点

- 不要把系统搭建理解成“只建几张表”
- 不要把项目初始化理解成“只创建项目壳子”或“只补一种资源”
- 不要在维表建模方案还没明确前，直接跳到命令执行
- 不要跳过多表、多字段、关联和案例数据这条基础路径
- 不要把人员字段、部门字段误建成普通下拉
- 不要让下拉选项 `id` 重复
- 不要把报表理解成只有一个空主资源
- 不要跳过固定预检链直接创建图表组件
- 不要把任何更新命令理解成“直接发局部 patch 就行”；统一按“先拿当前数据 -> 修改目标字段 -> 再提交 update”执行
- 不要把文件、图片、封面直接塞进更新请求；统一先 `upload file` 拿 `url`，再把 `url` 写回当前业务数据后更新

## 6. 默认路由顺序

很多问题不是单 Skill 能独立解释的，建议按下面顺序判断。

### 6.1 系统级任务优先

如果用户的问题是：

- 帮我生成一个客户管理系统
- 帮我做一个项目管理平台
- 搭一个审批系统
- 生成一个业务系统

优先从 `dimens-system-orchestrator` 入手。

### 6.2 上下文优先

如果用户的问题里没有明确：

- `teamId`
- `projectId`
- 资源归属

优先从 `dimens-manager/references/team/overview.md` 入手。

如果用户已经明确要“创建项目 / 初始化项目 / 建一个能直接继续搭表的项目”，优先进入 `dimens-manager/references/project/overview.md`。

### 6.3 资源域优先

如果资源对象已经明确，再切到具体 `dimens-manager` 业务章节：

| 资源类型 | 优先 Skill |
| --- | --- |
| 系统建设 / 平台规划 / 管理系统 | `dimens-system-orchestrator` |
| 工作流 / AI 分析 / 审批 / 自动化 | `dimens-manager/references/workflow/overview.md` |
| API Key / token / 第三方鉴权 | `dimens-manager/references/key-auth/overview.md` |
| Web 接入 / 移动端接入 / SDK 封装 / HTTP 对接 | `dimens-sdk` |
| 项目创建 / 项目初始化 / 默认公开视图补齐 | `dimens-manager/references/project/overview.md` |
| 工作表 / 字段 / 行 / 视图 | `dimens-manager/references/table/overview.md` |
| 权限 / 公开访问 / 协同越权 | `dimens-manager/references/permission/overview.md` |
| 报表 / 图表 / 参数 / 数据源 | `dimens-manager/references/report/overview.md` |

补充说明：

- 如果已经进入 `dimens-manager/references/report/overview.md`，不要只理解成“加一个图表”
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

## 7. 技能目录结构

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
└── dimens-sdk/
    ├── SKILL.md
    ├── README.md
    ├── rules/
    ├── assets/
    └── references/
```

### 7.1 `SKILL.md` 的职责

每个主 `SKILL.md` 负责：

- frontmatter 中定义 Skill 名称与触发条件
- 给出执行前必读
- 给出命令维护表
- 给出核心约束
- 给出必查 Skill
- 给出高频使用场景

### 7.2 `rules/` 与 `assets/` 的职责

- `rules/`：兼容 ClawHub / OpenClaw 等平台的规则目录扫描
- `assets/`：兼容平台资源目录要求，并统一承接封面、图标、截图等视觉资源说明

如果平台不保留原始相对链接，优先按“当前技能目录下的 `SKILL.md -> README.md -> references/`”顺序阅读。

素材命名、尺寸和推荐清单统一参考：

- `assets-命名规范.md`

### 7.3 `references/` 的职责

`references/` 用来承接：

- 详细示例
- 接口级入参 / 出参清单
- 长篇业务规则
- 特定专题说明
- 不适合塞进主 `SKILL.md` 的补充知识

## 8. Skill 之间如何互相调用

这是一个独立 Skill 体系，所以默认只允许 Skill 之间互相路由。

推荐理解方式：

| 当前问题 | 优先进入 |
| --- | --- |
| 先拆系统、再决定做哪些模块 | `dimens-system-orchestrator` |
| 先确认团队、项目、上下文 | `dimens-manager/references/team/overview.md` |
| 先创建项目并补齐默认公开视图 | `dimens-manager/references/project/overview.md` |
| 先设计表、字段、关联、row/page | `dimens-manager/references/table/overview.md` |
| 解释谁能看、谁能改、协同为什么异常 | `dimens-manager/references/permission/overview.md` |
| 解释工作流、默认模型、AI 分析 | `dimens-manager/references/workflow/overview.md` |
| 解释图表、看板、数据源、参数联动 | `dimens-manager/references/report/overview.md` |
| 解释 Key 登录、token 复用、第三方接入 | `dimens-manager/references/key-auth/overview.md` |
| 解释画布、流程图、思维导图、PPT 画布 | `dimens-manager/references/canvas/overview.md` |
| 解释 SDK、HTTP、Web、BFF、Node.js、移动端接入 | `dimens-sdk` |

其中 `dimens-manager/references/report/overview.md`默认阅读顺序建议是：

1. 先看 `dimens-manager/SKILL.md`
2. 再看 `dimens-manager/references/report/overview.md`
3. 如果要生成组件，再看 `dimens-manager/references/report/references/recharts-widget-guide.md`
4. 如果要看接口和命令案例，再看 `dimens-manager/references/report/references/examples.md`

## 9. Skill 体系的产品统一口径

后续新增或修改 Skill 时，统一使用以下产品口径：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

不要再混用模糊名称作为主产品名。

## 10. 当前推荐阅读顺序

当前建议按下面顺序查：

1. 先看本 README，确认问题落在哪个 Skill
2. 如果是系统建设类需求，先看 `dimens-system-orchestrator`
3. 如果是团队和项目边界问题，先看 `dimens-manager/references/team/overview.md`
4. 如果是项目创建、项目初始化、建表前置问题，先看 `dimens-manager/references/project/overview.md`
5. 如果是表、字段、row/page 问题，先看 `dimens-manager/references/table/overview.md`
6. 如果是工作流、权限、报表、画布、Key 接入问题，再进入对应 `dimens-manager` 业务章节。
7. 如果是报表生成类需求，优先先看 `dimens-manager/references/report/overview.md`，并按 `report create -> report preview -> report widget-add -> report query-widget -> report query` 的固定预检链执行。
8. 如果是 AI 一键生成画布、流程图、思维导图，直接进入 `dimens-manager/references/canvas/overview.md` 和 `dimens-manager/references/canvas/references/generation-guide.md`。
9. 需要接口级细节时，再继续看 dimens-manager/references/{业务域}/references/*.md 或对应顶层技能的 `references/*.md`。

### 10.1 报表类需求的默认防跑偏规则

如果问题落到报表：

1. 先确认是不是已经有 `projectId`
2. 再确认是不是多维表格数据源
3. 如果是多维表格数据源，不要直接输出组件命令，先确认 `sheet.columns + fieldIds + previewMapping + dataMapping`
4. 如果用户要求“直接生成”，也必须优先给预检步骤，而不是只给最终创建命令

## 11. 发布兼容说明

当前顶层正式技能目录只包含 3 个主技能：

- `dimens-system-orchestrator`
- `dimens-manager`
- `dimens-sdk`

发布到 ClawHub / OpenClaw 时，建议按下面口径理解：

- 顶层入口只暴露上述允许的技能目录。
- 业务正文以每个顶层技能目录下的 `SKILL.md` 和 `README.md` 为主。
- `dimens-manager/references/` 按业务域保留接口级和场景级扩展资料。
- 封面、图标、截图的命名规范统一看 `assets-命名规范.md`。
- 如果平台不稳定支持深层相对链接，优先进入 `dimens-manager` 后再按业务域阅读。

## 12. 技能开发标准

新增或改动 Skill 前，先阅读：

- `技能开发标准.md`

该文档约束当前顶层 Skill 的边界、`SKILL.md` 写法、references 组织方式、发布验证和高风险错误。
