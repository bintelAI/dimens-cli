---
name: dimens-manager-market
slug: dimens-manager-market
description: 用于维表智联应用市场、公开插件、公开资源浏览与安装。
version: 1.0.0
author: 方块智联工作室
tags: [market, plugin, flow_plugin, public, dimens-cli]
---

# dimens-manager 应用市场与公开插件章节

## 执行前必读

- ✅ 公开插件以 `.trae/已开发文档/应用市场架构设计.md` 为准：团队插件发布后同步生成或更新公开市场 `flow_plugin` 资源。
- ✅ 团队插件发布入口是 `POST /app/plugin/:teamId/info/publish`，CLI 对应 `dimens-cli plugin-public publish`。
- ✅ 公开插件浏览和详情走 `/app/market/resource/list` 与 `/app/market/resource/detail`，资源类型固定为 `flow_plugin`。
- ✅ 公开插件安装到团队后，落地为目标团队侧的 `flow_info` 工作流/插件实例。
- ✅ 公开插件不是公开工作流调用接口；公开工作流看 `references/workflow/overview.md` 的 `workflow-public` 命令。

## 命令维护表

| 命令 | 作用 | 必填参数 | 常用可选 | 说明 |
| --- | --- | --- | --- | --- |
| `dimens-cli plugin-public publish` | 发布团队插件到公开插件市场 | `teamId`, `pluginId` | - | 后端会发布插件版本并幂等创建/更新 `flow_plugin` 市场资源 |
| `dimens-cli plugin-public list` | 查询公开插件列表 | - | `keyword`, `page`, `size` | 默认 `resourceType=flow_plugin,status=1` |
| `dimens-cli plugin-public detail` | 查询公开插件详情 | `resourceId` | - | 用市场资源 ID，不是源工作流 ID |
| `dimens-cli plugin-public install-flow` | 安装公开插件为团队工作流实例 | `teamId`, `resourceId` | `projectScopeType`, `projectIds`, `instanceName` | 推荐安装 `flow_plugin` 时优先使用 |
| `dimens-cli plugin-public install` | 走市场通用安装入口 | `teamId`, `resourceId` | `projectId`, `instanceName` | 用于兼容通用市场安装 |
| `dimens-cli plugin-public uninstall` | 卸载公开插件安装实例 | `resourceId` | `teamId` | 不删除原公开市场资源 |
| `dimens-cli plugin-public upgrade` | 升级公开插件安装实例 | `resourceId` | `teamId` | 按后端市场升级规则执行 |

## 常用链路

### 发布团队插件为公开插件

```bash
dimens-cli plugin-public publish \
  --team-id TEAM1 \
  --plugin-id 3
```

发布后验证：

```bash
dimens-cli plugin-public list --keyword "审批"
```

### 安装公开插件

```bash
dimens-cli plugin-public install-flow \
  --team-id TEAM2 \
  --resource-id 88 \
  --project-scope-type selected_projects \
  --project-ids PROJ1,PROJ2 \
  --instance-name "审批助手"
```

## 边界说明

- `pluginId` 是团队插件/源 `flow_info` ID；`resourceId` 是公开市场 `market_resource.id`。
- 公开插件市场负责可见性、版本和安装；插件实例执行仍回到团队工作流/插件体系。
- 如果用户要“免登录 HTTP 调用某个工作流”，不要使用 `plugin-public`，应使用 `workflow-public`。
- 如果用户要“发布公开应用或模板”，当前 CLI 本次只整理公开插件主链；项目公开应用/模板仍以产品页面或后续 CLI 能力为准。
