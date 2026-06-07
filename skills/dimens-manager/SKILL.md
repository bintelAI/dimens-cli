---
name: dimens-manager
slug: dimens-manager
description: 用于维表智联项目内业务资源创建、配置、维护和排查，适合处理 Key、团队、项目、表格、权限、工作流、报表、画布等落地问题。
version: 1.0.3
author: 方块智联工作室
tags: [manager, project, table, permission, workflow, report, canvas, auth, dimens-cli]
---

# 维表智联业务管理技能（dimens-manager）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 当前技能负责项目内业务资源落地，不负责完整系统方案拆解；系统级需求先用 `dimens-system-orchestrator`。
- ✅ SDK、HTTP、Web、BFF、Node.js 接入问题先用 `dimens-sdk`。
- ✅ Windows 下生成或修改中文文件时，必须遵守 `../windows-utf8.md`：用 UTF-8 写入，禁止 `cmd echo` / 默认重定向写中文正文，写完读回确认没有 `??`。
- ✅ 每次准备使用 `dimens-cli` 前，先执行 `dimens-cli --version` 查看当前版本；只有命令不存在、版本明显低于需求、当前 help/source 与技能规则不一致，或用户确认升级时，才执行 `npm -g install @bintel/dimens-cli@latest`。升级后必须再次执行 `dimens-cli --version` 和必要的 `dimens-cli help <group>` 复核。
- ✅ 项目内查询、创建、更新、上传、验证等操作优先推荐并执行 `dimens-cli` 命令；自定义 URL 只作为上下文解析或 CLI 未覆盖时的补充路径，不作为首选解决方案。
- ✅ 执行任何写操作前先确认认证、`teamId`、`projectId` 与资源归属。
- ✅ 更新类操作统一遵循“先读取当前数据 -> 修改目标字段 -> 再提交更新”。
- ✅ 项目资源默认按“三驾马车”理解：表格、文档、报表。
- ✅ 报表创建当前走项目菜单 `sheet/create type=report`；返回的 `reportId` 等于 `sheetId`。
- ✅ 用户只给自然语言目标时，先把目标归类到业务域，再给 CLI 步骤；不要直接编造不存在的命令或字段。
- ✅ 如果上下文、权限或资源 ID 缺失，先列出缺口和最小补齐命令，再继续执行或给方案。
- ✅ 创建项目内资源时，不能只看命令返回 success；目录必须 `sheet tree` 回查，表格必须逐表 `column list` 获取真实 `fieldId`，行数据必须写后 `row page` 验证 `data` 非空，报表必须跑 `preview / query-widget / query`。
- ✅ `sheet create --folder-id` 当前不能作为最终归位证据；创建后如果 `parentId` 为空、菜单树不在目标目录或目录为空，立即用 `sheet move --folder-id` 修正并再次 `sheet tree`。
- ✅ 字段 ID 是表级独立生成的系统 ID；同名字段在不同表也不能复用。行数据 JSON 只能使用目标表 `column list` 返回的真实 `fieldId`。
- ✅ 吸收历史项目经验时，先判断是稳定规则还是特定版本问题；CLI 命令、参数、返回结构、字段类型和旧 bug 必须复核当前源码、help 或 references 后再固化。

## 职责边界

| 问题类型 | 应使用技能 |
| --- | --- |
| 完整系统、平台、管理应用的规划和拆解 | `dimens-system-orchestrator` |
| 项目内资源创建、配置、更新、排查 | `dimens-manager` |
| SDK、HTTP API、Web/BFF/Node.js/移动端接入 | `dimens-sdk` |

## 快速路由表

| 业务域 | 入口文档 | 适用场景 |
| --- | --- | --- |
| Key 鉴权 | `references/key-auth/overview.md` | API Key / Secret 换 token、第三方接入、密钥边界排查 |
| 团队上下文 | `references/team/overview.md` | 确认 `teamId/projectId`、成员、租户隔离、资源归属 |
| 项目初始化 | `references/project/overview.md` | 创建项目、项目菜单、文档资源、初始化主链 |
| 多维表格 | `references/table/overview.md` | 表、字段、视图、行数据、relation、筛选查询 |
| 权限管理 | `references/permission/overview.md` | 角色、项目权限、表/列/行权限、ACL、公开访问 |
| 工作流 | `references/workflow/overview.md` | 工作流定义、项目挂载、运行调用、模型配置 |
| 报表 | `references/report/overview.md` | 报表、图表组件、参数联动、数据源查询 |
| 画布 | `references/canvas/overview.md` | 画布资源、AI 生成画布、PPT 画布、版本管理、组件资源市场 |

## 默认处理顺序

1. 识别用户目标：查询、创建、更新、排查、导入、生成画布或验证。
2. 只要后续会执行或给出 `dimens-cli` 命令，先执行 `dimens-cli --version`；命令不可用或版本不满足当前任务时再安装/升级，并在升级后复核版本和 help。
3. 先看 `references/key-auth/overview.md`，确认认证方式。
4. 再看 `references/team/overview.md`，明确 `teamId / projectId / baseUrl`。
5. 项目容器问题看 `references/project/overview.md`。
6. 数据模型问题看 `references/table/overview.md`。
7. 访问控制问题看 `references/permission/overview.md`。
8. 自动化和 AI 流程问题看 `references/workflow/overview.md`。
   - 审批工作流 AI 自动生成必须继续看 `references/workflow/references/approval-generation.md`。
   - 审批工作流节点类型必须继续对照 `references/workflow/references/approval-existing-cases.md`，不能生成不存在的节点。
   - 审批工作流节点参数必须继续看 `references/workflow/references/approval-node-parameters.md`，不能只输出空节点。
9. 统计分析和看板问题看 `references/report/overview.md`。
10. 画布、白板、流程图、PPT 画布和 AI 一键生成画布看 `references/canvas/overview.md`。
11. 输出前按“CLI 已升级、命令链、必要参数、验证命令、风险点”检查一遍。
12. 如果是项目初始化或批量建表，最后必须执行一次全量验收：`sheet tree` 确认无空目录，逐表 `column list` 确认字段，逐表 `row page` 确认非空数据，逐报表 `query-widget/query` 确认可出数。

### 全量验收矩阵

项目初始化、批量建表、导入数据、生成报表、配置权限后，按下面证据判断是否完成：

| 资源/动作 | 必须回查 | 通过标准 |
| --- | --- | --- |
| 菜单目录 | `sheet tree` | 设计中应归位的表、文档、报表、画布都在目标目录；没有无意义空目录 |
| 表字段 | 逐表 `column list` | 每张表都有真实 `fieldId` 映射；同名字段也按表独立记录 |
| 行数据 | 逐表 `row page` | `rows.length > 0` 且业务 `data` 非空；数值字段、选项字段结构正确 |
| 报表 | `row page -> report preview -> widget-add -> query-widget -> query` | 数据源非空、组件可查、整报表不为空；空结果必须有原因和修正动作 |
| 权限 | `role/permission/row-policy` 回查 + `myPermissions` 或权限快照 | 业务角色已绑定用户或说明待绑定；项目/表/资源/字段/行级权限已配置并说明缓存刷新风险 |
| 画布/工作流 | `canvas info/save` 或 workflow 发布/运行回查 | 不是空壳资源；可渲染、可保存或可运行的证据明确 |

## 输出契约

处理项目内业务资源时，默认输出下面 4 类信息：

1. `目标域`：命中哪个章节，例如表格、权限、报表、画布。
2. `前置条件`：认证状态、`teamId/projectId`、资源 ID、权限要求。
3. `执行链路`：优先给 `dimens-cli` 命令；更新类必须体现“先读再改再更”。
4. `验证链路`：给出回查命令和通过标准；权限、报表、画布不能只看创建成功。

如果用户要求直接执行，但缺少必要上下文，先输出缺口和补齐命令，不要假装已经完成。

## 高风险跑偏点

- 不要把 `dimens-manager` 当成系统级需求分析器。
- 不要在 Windows 下用 `echo 中文 > file`、未指定编码的 `Out-File` 或默认重定向写中文文件；这会导致中文变成 `??`。
- 不要把 API Key 当成独立权限体系；Key 登录后仍继承绑定用户权限。
- 不要脱离团队和项目上下文处理表格、权限、工作流、报表。
- 部门字段当前执行规则：当前禁止生成 `department` 字段类型，统一使用 `text` 字段保存部门名称；不要改成普通下拉，避免 Web 前端因 `department` 类型渲染白屏。
- 不要跳过报表预检链直接创建复杂图表。
- 不要把业务工作流画布直接等同于可执行工作流；可执行链路仍要回到工作流章节。
- 不要把 AI 生成的审批流程文字等同于已发布审批工作流；必须补齐图草案、项目挂载、`workflow` 字段入口和审批运行验证。
- 不要为审批流编造节点类型；AI 自动审批放在 `approval` 节点配置里，项目表回写用已存在的 `mul_update_row`，不要生成 `action`、`sync_workflow_cell` 或 `approval_ai_review`。
- 不要只生成 `id/type/label` 空节点；每个审批节点都要按 `approval-node-parameters.md` 补齐必填参数。
- 不要只看 CLI 命令执行成功就判断权限生效；还要关注缓存失效、权限快照和前端刷新。
- 不要只看 `sheet create --folder-id` 就判断资源已进入目录；必须 `sheet tree` 回查，必要时 `sheet move`。
- 不要复用其它表的 `fieldId` 写入当前表；`row batch-create` 即使返回成功，也可能因为字段 ID 错误导致业务 `data` 为空。
- 不要把空目录、空表、行 `data:{}`、空报表留到用户反馈后再修；这些都属于执行阶段必须主动发现的问题。
- 不要把历史规则文档里的 Windows 路径、旧 CLI 版本行为或未复核 bug 当成当前通用事实；先复核再固化。
- 不要只创建业务角色就声称权限完成；角色、权限、资源可见性、行级策略、用户绑定和权限快照是连续链路。

## 常见错误与修正

| 错误 | 修正 |
| --- | --- |
| 只给 `projectId` 就开始改资源 | 先确认 `teamId` 和资源归属 |
| 直接局部 update | 先读取当前数据，再合并目标字段 |
| 报表创建后读取不到 `reportId` | 使用返回的 `sheetId` 作为 `reportId`，或使用已归一化的 CLI 输出 |
| 权限创建成功就认为前端已生效 | 继续检查权限快照、缓存失效和前端刷新 |
| `sheet create --folder-id` 后目录仍为空 | 执行 `sheet move RESOURCE_ID --folder-id FOLDER_ID`，再 `sheet tree` 回查 |
| 行创建成功但表格业务字段为空 | 逐表 `column list` 获取真实 `fieldId`，重建数据 JSON 后重新导入，并用 `row page` 验证 `data` 非空 |
| 报表资源存在但无组件或无数据 | 先 `row page` 查数据源，再 `report preview -> widget-add -> query-widget -> query`，不能把空壳当完成 |
| AI 只输出审批说明，没有图草案 | 按 `approval-generation.md` 补齐 `pluginType=approval` 的 `nodes/edges/globalVariables/meta` |
| AI 生成了不存在的审批节点 | 对照 `approval-existing-cases.md` 和 `approval-generation.md` 白名单，把节点收敛到 `start/approval/condition/notification/end`；项目表回写只用 `mul_update_row` 并说明发布边界 |
| AI 生成了空壳节点 | 按 `approval-node-parameters.md` 补齐 `start.approvalInputConfig`、`approval.participantRules`、`condition.IF`、`notification` 接收人、`end.result` 等参数 |

## 干跑测试样本

维护本技能时使用 `test-prompts.json` 做 dry-run 复测，至少覆盖：

- 项目内资源创建和回查。
- 权限或团队上下文缺失时的补齐路径。
- 报表、工作流、画布这类需要预检或版本回查的复杂链路。

## 参考文档

- `../windows-utf8.md`
- `README.md`
- `references/key-auth/overview.md`
- `references/team/overview.md`
- `references/project/overview.md`
- `references/table/overview.md`
- `references/permission/overview.md`
- `references/workflow/overview.md`
- `references/workflow/references/approval-generation.md`
- `references/workflow/references/approval-existing-cases.md`
- `references/workflow/references/approval-node-parameters.md`
- `references/report/overview.md`
- `references/canvas/overview.md`
