---
name: dimens-system-orchestrator
slug: dimens-system-orchestrator
description: 用于维表智联系统级方案拆解与执行编排，适合“生成一个客户管理系统/平台”这类完整业务系统搭建需求。
version: 1.0.1
author: 方块智联工作室
tags: [orchestrator, system-design, routing, planning, dimens-cli]
---

# 系统级总控技能（dimens-system-orchestrator）

适用产品：

- 产品名称：`维表智联`
- 开发方：`方块智联工作室`
- 官网：[https://dimens.bintelai.com/](https://dimens.bintelai.com/)

## 执行前必读

- ✅ 当前技能只负责系统级拆解、执行顺序、章节路由和风险提示。
- ✅ 项目内业务操作统一进入 `dimens-manager`。
- ✅ SDK、HTTP、Web、BFF、Node.js、移动端接入统一进入 `dimens-sdk`。
- ✅ 默认节奏是“先方案，后执行”；系统边界没拆清前不要直接给创建命令。
- ✅ 项目资源默认按“三驾马车”理解：表格、文档、报表。
- ✅ 更新类操作统一遵循“先读取当前数据 -> 分析并修改目标字段 -> 再提交更新”。

## 职责边界

| 问题类型 | 应使用技能 |
| --- | --- |
| 完整系统、平台、管理应用的规划和拆解 | `dimens-system-orchestrator` |
| 项目内资源创建、配置、更新、排查 | `dimens-manager` |
| SDK、HTTP API、Web/BFF/Node.js/移动端接入 | `dimens-sdk` |

## 快速路由表

| 阶段 | 章节入口 | 作用 |
| --- | --- | --- |
| 认证阶段 | `dimens-manager/references/key-auth/overview.md` | API Key / Secret 换 token、第三方接入、登录边界 |
| 上下文阶段 | `dimens-manager/references/team/overview.md` | 确认 `teamId / projectId`、成员、租户隔离、资源归属 |
| 项目阶段 | `dimens-manager/references/project/overview.md` | 创建项目、项目菜单、文档资源、初始化主链 |
| 建模阶段 | `dimens-manager/references/table/overview.md` | 表、字段、视图、行数据、relation、筛选查询 |
| 权限阶段 | `dimens-manager/references/permission/overview.md` | 角色、项目权限、表/列/行权限、ACL、公开访问 |
| 工作流阶段 | `dimens-manager/references/workflow/overview.md` | 工作流定义、项目挂载、运行调用、模型配置 |
| 报表阶段 | `dimens-manager/references/report/overview.md` | 报表、组件、参数联动、数据源查询 |

## 默认处理顺序

1. 识别系统定位：系统名称、核心目标、主要使用者。
2. 归一化上下文：解析或确认 `teamId / projectId / baseUrl`。
3. 设计项目容器：项目名称、目录结构、菜单入口、文档与报表。
4. 拆核心对象：主对象、从对象、生命周期状态、对象关系。
5. 设计多表模型：表、字段类型、候选项、relation、默认视图、示例数据。
6. 设计查询与视图：常用筛选、列表视图、统计口径、报表数据源。
7. 按需补权限、工作流、报表和外部对接。
8. 最后给出下一步进入 `dimens-manager` 的具体章节路径。

## 执行完成判定

执行类任务不能只看“命令返回 success”。至少按下表回查后，才能说“系统初始化完成 / OK”：

| 动作 | 必做验证 | 不通过时 |
| --- | --- | --- |
| SVG 封面/图标上传 | 确认 SVG 为 `250x150px`、淡色背景、动态效果，文件保留 `.svg`，类型是 `image/svg+xml`，并拿到 `url` | 重新按“先读 -> 合并 URL -> update”执行 |
| 项目封面/图标写回 | `project info` 回查目标字段是否已经是上传后的 `url` | 重新按“先读 -> 合并 URL -> update”执行 |
| 创建目录 | 记录返回的目录 `sheetId`，后续子资源显式使用 `--folder-id` | 不要假设其他菜单自动进入目录 |
| 移动已有菜单资源 | 执行 `sheet update RESOURCE_ID --folder-id FOLDER_ID` 后再 `sheet tree` | 未归位则继续修正 `folderId` |
| 创建表格 | `sheet info`、`view list`、`column list` 回查结构 | 缺视图或字段时回到 table 章节补齐 |
| 创建报表 | `report create -> preview -> widget-add -> query-widget -> query` 至少跑通预检链 | 报表只是空壳，不能算完成 |

如果用户让“直接创建一套系统”，最后输出必须包含：已创建资源 ID、目录归位结果、上传 URL 写回结果、报表预检结果、下一步风险。

## 链接输入规则

| 链接形态 | 解析结果 | 下一步 |
| --- | --- | --- |
| `https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/` | `teamId`、`projectId` | 进入团队与项目章节 |
| `https://dimens.bintelai.com/#/TEAM_ID/PROJECT_ID/SHEET_ID?view=VIEW_ID` | `teamId`、`projectId`、`sheetId`、`viewId` | 如果是表格页面，进入表格章节；如果是在线文档页面，先把 `sheetId` 当菜单资源 ID，优先走 `doc info --sheet-id SHEET_ID` 取真实 `documentId` |

## 高风险跑偏点

- 不要把系统需求收缩成“只建几张表”。
- 不要跳过文档和报表资源。
- 不要在建模没明确前直接执行命令。
- 不要把权限、公开访问、部门隔离当成最后补丁。
- 不要以为“创建目录”会自动移动其他菜单；创建子资源必须带 `--folder-id`，已有资源必须再执行 `sheet update --folder-id`。
- 不要把 SVG 封面当普通文件上传；封面默认规格是 `250x150px`、淡色背景、动态效果，文件名必须保留 `.svg`，上传 MIME 应为 `image/svg+xml`。
- 不要让报表直接从 `widget-add` 开始；固定预检链是 `report create -> report preview -> report widget-add -> report query-widget -> report query`。
- 不要把 SDK 接入问题混入系统拆解；代码接入交给 `dimens-sdk`。
- 不要在没有 `sheet tree`、`project info`、报表 query 等回查证据时宣称“完成”。
- 不要把文档页面链接里的 `sh_xxx` 误当成 `documentId`；在线文档页面 URL 默认先产出 `sheetId`，需要先通过 `getBySheetId` 或 `doc info --sheet-id` 换出真实 `documentId`。

## 常见错误与修正

| 错误 | 修正 |
| --- | --- |
| 一个完整系统需求直接落到单个表 | 先拆项目、目录、表格、文档、报表和权限边界 |
| 方案还没确认就开始执行 | 先输出模块方案，再等用户确认或明确授权执行 |
| 只写“去 manager 看” | 必须给出具体章节路径 |
| 报表创建后找不到 `reportId` | 说明当前 `report create` 返回的 `reportId` 等于菜单资源 `sheetId` |
| 创建了目录但菜单没进去 | 对新建资源用 `sheet create --folder-id`，对已建资源用 `sheet update --folder-id` |
| SVG 上传后无法作为图片使用 | 生成 `250x150px` 淡色动态 SVG，保留 `.svg` 扩展名并走 `upload file`，确认上传类型是 `image/svg+xml` |

## 参考文档

- `references/system-decomposition.md`
- `references/skill-routing.md`
- `references/interface-navigation.md`
- `references/command-mapping.md`
- `references/examples.md`
