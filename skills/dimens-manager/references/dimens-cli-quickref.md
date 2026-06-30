---
name: dimens-manager-cli-quickref
slug: dimens-manager-cli-quickref
description: dimens-cli 命令速查手册，覆盖认证、项目、表格、文档、画布、报表、权限、AI 等全部命令组。执行任何 dimens-cli 操作前必须优先查阅此文档。
version: 1.0.0
author: 方块智联工作室
tags: [dimens-cli, quickref, command, reference, mandatory]
---

# dimens-cli 命令速查

> **⚠️ 强制查阅：在执行任何 `dimens-cli` 命令前，必须先查阅本文档确认命令名称、参数格式和前置条件。**
> **不查阅本文档直接使用 CLI 可能因拼写错误、参数遗漏或缺失前置条件导致操作失败。**

包名：`@bintel/dimens-cli` | 全局命令：`dimens-cli` | 默认 API：`https://dimens.bintelai.com/api`

---

## 📖 使用方式

```bash
dimens-cli help                    # 查看所有命令组
dimens-cli help <group>            # 查看命令组下的子命令
dimens-cli help <group> <command>  # 查看具体命令的用法和示例
```

## 🔐 认证与上下文 (auth)

| 命令 | 说明 | 必知 |
|------|------|------|
| `auth api-key-login --api-key <ak> --api-secret <sk>` | API Key 换 token | **所有操作的前置步骤** |
| `auth login --username <name> --password <pwd>` | 用户名密码登录 | 备用认证方式 |
| `auth refresh` | 刷新 token | token 过期后续期 |
| `auth me` | 查看当前用户信息 | 确认登录状态 |
| `auth status` | 查看当前上下文 | 确认 baseUrl/token/teamId |
| `auth use-team <teamId>` | 设置默认团队 | 省去每次传 `--team-id` |
| `auth use-project <projectId>` | 设置默认项目 | 省去每次传 `--project-id` |
| `auth profile` | 查看本地 profile | 检查持久化配置 |

## 👥 团队与成员 (team)

| 命令 | 说明 |
|------|------|
| `team info [--team-id <id>]` | 获取团队信息 |
| `team users [--team-id <id>] [--keyword <keyword>]` | 获取成员列表 |

## 👤 用户信息 (user)

| 命令 | 说明 |
|------|------|
| `user me` | 获取当前用户信息 |

## 📁 项目管理 (project)

| 命令 | 说明 |
|------|------|
| `project list [--team-id <id>] [--page 1] [--size 20]` | 项目列表 |
| `project info --id <projectId>` | 项目详情 |
| `project create --name <name> [--description <desc>] [--project-type <type>]` | 创建项目 |
| `project update --id <projectId> [--name <n>] [--icon <url>] [--cover-image <url>]` | 更新项目 |
| `project trash --ids <id1,id2>` | 移入回收站 |
| `project restore --ids <id1,id2>` | 恢复项目 |
| `project use <projectId>` | 切换默认项目 |

## 📋 项目菜单与多维表资源管理 (sheet)

| 命令 | 说明 |
|------|------|
| `sheet list [--project-id <id>]` | 资源列表 |
| `sheet tree [--project-id <id>]` | 菜单树（回查目录结构） |
| `sheet create --name <name> [--type sheet\|folder\|document\|report\|canvas] [--folder-id <id>]` | 创建资源节点 |
| `sheet info <sheetId>` | 资源详情 |
| `sheet update <sheetId> [--name <n>] [--folder-id <id>]` | 更新节点 |
| `sheet move <sheetId> --folder-id <folderId>` | 移动到目录 |
| `sheet delete <sheetId>` | 删除节点 |
| `sheet structure <sheetId>` | 表结构 |

## 🏛️ 字段管理 (column)

| 命令 | 说明 |
|------|------|
| `column list --sheet-id <id>` | 字段列表 |
| `column create --sheet-id <id> --label <label> [--type <type>] [--config <json>] [--options <json>]` | 创建字段 |
| `column update --sheet-id <id> --field-id <fid> [--label <l>] [--type <t>]` | 更新字段 |
| `column delete --sheet-id <id> --field-id <fid>` | 删除字段 |

> `select`/`multiSelect` 类型必须传 `--options`，格式：`[{"label":"待提交","color":"bg-slate-100 text-slate-700"}]`

## 👁️ 视图管理 (view)

| 命令 | 说明 |
|------|------|
| `view list --sheet-id <id>` | 视图列表 |
| `view create --sheet-id <id> --name <name> [--type grid] [--public true]` | 创建视图 |

## 📊 行数据管理 (row)

| 命令 | 说明 |
|------|------|
| `row page --sheet-id <id> --page 1 --size 20 [--keyword <kw>] [--filters <json>] [--sort-rule <json>]` | 分页查询行 |
| `row info --sheet-id <id> --row-id <rid> [--include relations,richtext]` | 行详情；显式 include 时附加单向关联目标行和富文本原始 content |
| `row open-info --team-id <teamId> --project-id <projectId> --sheet-id <id> --row-id <rid> [--include relations,richtext]` | 公开行详情；仍受公开角色、表级、行级、列级权限控制 |
| `row create --sheet-id <id> [--values <json>]` | 创建行 |
| `row batch-create --sheet-id <id> --file <path>` | **批量创建行**（JSON 文件，默认 200 行一批） |
| `row update --sheet-id <id> --row-id <rid> --version <v> [--values <json>]` | 更新行 |
| `row delete --sheet-id <id> --row-id <rid>` | 删除行 |
| `row set-cell --sheet-id <id> --row-id <rid> --field-id <fid> --value <v>` | 更新单元格 |

> `row batch-create` 后端单批上限 1000 行，CLI 默认按 200 行分片稳定写入。

## 📝 文档管理 (doc)

| 命令 | 说明 |
|------|------|
| `doc create --title <title> [--content <html>] [--format richtext\|markdown\|html] [--parent-id <folderId>]` | 创建文档 |
| `doc info [--document-id <id> \| --sheet-id <id> \| <doc_xxx\|sh_xxx>]` | 文档详情 |
| `doc update --document-id <id> --content <html> --version <v>` | 更新文档 |
| `doc version --document-id <id> --version <v>` | 指定版本快照 |
| `doc versions --document-id <id>` | 版本列表 |
| `doc restore --document-id <id> --version <v>` | 恢复到指定版本 |
| `doc delete --document-id <id>` | 删除文档 |
| `doc attach-file --document-id <id> --file <path> [--title <t>]` | 上传文件 → 追加为附件节点 |
| `doc append-image --document-id <id> --file <path> [--alt <alt>]` | 上传图片 → 追加为图片节点 |

## 🎨 画布资源管理 (canvas)

| 命令 | 说明 |
|------|------|
| `canvas create --name <name> [--data <json> \| --file <path>]` | 创建画布 |
| `canvas info <sheetId>` | 画布详情 |
| `canvas save <sheetId> --base-version <v> (--data <json> \| --file <path>) [--summary <text>]` | 保存画布版本 |
| `canvas versions <sheetId>` | 版本列表 |
| `canvas version <sheetId> --version <v>` | 指定版本快照 |
| `canvas restore <sheetId> --version <v>` | 恢复版本 |
| `canvas validate --data <json> \| --file <path>` | 校验 JSON 结构 |
| `canvas resource-list [--keyword <text>]` | 我的组件资源 |
| `canvas resource-save --name <n> --nodes <json-array>` | 保存为组件资源 |
| `canvas resource-delete <id>` | 删除组件资源 |
| `canvas resource-publish <id>` | 发布到市场 |
| `canvas resource-market [--keyword <text>]` | 市场资源 |

## 📈 报表管理 (report)

| 命令 | 说明 |
|------|------|
| `report list [--project-id <id>]` | 报表列表 |
| `report info --report-id <id>` | 报表详情 |
| `report create --name <name>` | 创建报表 |
| `report update --report-id <id> [--name <n>] [--desc <d>]` | 更新报表 |
| `report copy --report-id <id> [--name <n>]` | 复制报表 |
| `report delete --report-id <id>` | 删除报表 |
| `report archive --report-id <id>` | 归档报表 |
| `report publish --report-id <id> --is-public true\|false` | 发布/取消公开 |
| `report sort --report-id <id> --target-index <n>` | 调整排序 |
| `report move --report-id <id> --target-project-id <pid>` | 迁移到其他项目 |
| `report query --report-id <id>` | 执行报表查询 |
| `report query-widget --report-id <id> --widget-id <wid>` | 单组件查询 |
| `report preview --data-source <json>` | 预览数据源 |
| `report validate --config <json>` | 校验配置 |
| `report widget-add --report-id <id> --type <type> --data-source <json>` | 新增图表组件 |
| `report widget-update --widget-id <wid> [...]` | 更新组件 |
| `report widget-delete --widget-id <wid>` | 删除组件 |
| `report widget-batch --report-id <id> --widgets <json-array>` | 批量覆盖组件 |
| `report widget-sort --report-id <id> --widget-id <wid> --target-order <n>` | 组件排序 |

> 支持的图表类型：line, bar, area, pie, composed, radar, scatter, funnel, radialBar, treemap, stat, heatmap, timeline, table, wordCloud

## 📤 文件上传 (upload)

| 命令 | 说明 |
|------|------|
| `upload file --file <path> [--key <key>] [--scene <scene>] [--source material]` | 上传文件 |
| `upload mode` | 查看上传模式 |

> 素材库上传优先命令：`upload file --file <path> --team-id <teamId> --source material [--classify-id <id>]`。该链路会优先走 CDN 直传并完成素材入库；CDN 未启用或配置不完整时回退本地上传。普通资源只拿 URL 时不需要 `--source material`。

## 👤 角色管理 (role)

| 命令 | 说明 |
|------|------|
| `role list [--project-id <id>]` | 角色列表 |
| `role info --role-id <id>` | 角色详情 |
| `role create --name <name> [--can-manage-sheets true\|false] [--can-edit-schema true\|false] [--can-edit-data true\|false]` | 创建角色 |
| `role update --role-id <id> [--name <n>]` | 更新角色 |
| `role delete --role-ids <id1,id2>` | 删除角色 |
| `role assign-user --role-id <id> --user-id <uid> [--sheet-id <sid>]` | 分配用户 |
| `role revoke-user --role-id <id> --user-id <uid>` | 移除用户 |

## 🔒 项目权限管理 (permission)

| 命令 | 说明 |
|------|------|
| `permission list [--sheet-id <id>]` | 权限列表 |
| `permission create --role-id <id> --sheet-id <sid> [--data-access <access>] [--can-read true] [--can-write true] [--column-visibility <json>] [--column-readonly <json>]` | 创建表权限 |
| `permission update --id <n> --sheet-id <sid> --role-id <id> [...]` | 更新权限 |
| `permission delete --sheet-id <sid> --ids <1,2>` | 删除权限 |
| `permission set-resource --role-id <id> --resource-id <rid> --resource-type <type> --visible true --editable false` | 设置资源权限 |

## 🛡️ 行策略权限 (row-policy)

| 命令 | 说明 |
|------|------|
| `row-policy list --sheet-id <id>` | 策略列表 |
| `row-policy create --sheet-id <id> --name <n> --effect allow\|deny --actions <view,edit> --conditions <json> [--role-id <rid>] [--priority 10] [--match-type and] [--active true]` | 创建行策略 |
| `row-policy update --id <pid> --sheet-id <sid> [...]` | 更新策略 |
| `row-policy delete --sheet-id <sid> --ids <pid1,pid2>` | 删除策略 |
| `row-policy enable --id <pid> --sheet-id <sid>` | 启用策略 |
| `row-policy disable --id <pid> --sheet-id <sid>` | 禁用策略 |

## 🔑 单行 ACL 权限 (row-acl)

| 命令 | 说明 |
|------|------|
| `row-acl list --sheet-id <id> --row-id <rid>` | 行 ACL 列表 |
| `row-acl grant-user --sheet-id <id> --row-id <rid> --user-id <uid> --permission view\|edit` | 授予用户 |
| `row-acl grant-role --sheet-id <id> --row-id <rid> --role-id <rid> --permission view\|edit` | 授予角色 |
| `row-acl grant-dept --sheet-id <id> --row-id <rid> --dept-id <did> --permission view\|edit` | 授予部门 |
| `row-acl revoke-role --sheet-id <id> --row-id <rid> --role-id <rid>` | 移除角色权限 |

## 🤖 AI 多能力模型代理 (ai)

| 命令 | 说明 |
|------|------|
| `ai chat-completions --message <text> [--model default]` | 对话 |
| `ai models [--capability image]` | 模型列表 |
| `ai responses --payload <json>` | Responses 接口 |
| `ai messages --payload <json>` | Claude Messages 接口 |
| `ai proxy --method GET --path <path>` | 代理路径 |
| `ai image-generate --prompt <text> [--size 1024x1024]` | 图片生成 |
| `ai image-edit --image <path> --prompt <text>` | 图片编辑 |
| `ai image-variation --image <path>` | 图片变体 |
| `ai video-create --prompt <text> [--seconds 8]` | 创建视频任务 |
| `ai video-status --task-id <id>` | 视频任务状态 |
| `ai video-content --task-id <id>` | 视频内容获取 |
| `ai audio-speech --input <text> --voice <voice>` | 文本转语音 |
| `ai audio-transcribe --file <path>` | 音频转写 |
| `ai audio-translate --file <path>` | 音频翻译 |
| `ai embeddings --input <text>` | 文本向量化 |
| `ai rerank --query <text> --documents <json-array>` | 重排序 |

## 📚 技能查看 (skill)

| 命令 | 说明 |
|------|------|
| `skill list` | 列出所有技能 |
| `skill info <name>` | 技能元信息 |
| `skill show <name> [--references] [--mapping-only]` | 技能文档内容 |
| `skill recommend <text>` | 推荐技能 |

## 🏗️ 系统命令

| 命令 | 说明 |
|------|------|
| `help [group] [command]` | 帮助信息 |
| `version` | 版本号 |
| `create --dir [目录]` | 创建自定义页面脚手架 |

## ⚙️ 全局通用参数

```
--base-url <url>    覆盖默认 API 地址
--token <token>     手动指定 token
--team-id <id>      指定团队
--project-id <id>   指定项目
--app-url <url>     从 Web URL 解析 teamId/projectId
--output json       JSON 格式输出
```

## ✅ 执行前强制检查清单

在执行任何 `dimens-cli` 命令前，必须按以下顺序检查：

1. **版本**：`dimens-cli --version` — 确认已安装且为最新
2. **认证**：先执行 `auth api-key-login` 或确认本地有有效 token
3. **上下文**：确认 `teamId`、`projectId` 已设置或通过 `--team-id` / `--project-id` 传入
4. **命令确认**：在上方表格中找到正确的命令名和参数，避免拼写错误
5. **前置条件**：创建类操作确认父资源已存在；更新类操作先读取当前数据再合并提交
6. **验证**：执行后使用对应的 `list` / `info` 命令回查操作结果

## 📋 权限链路推荐顺序

```
role → permission → row-policy → row-acl
(定义角色 → 配置表/资源权限 → 批量行级规则 → 单行精细授权)
```
