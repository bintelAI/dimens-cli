---
name: dimens-manager-book
slug: dimens-manager-book
description: 用于维表智联 e_magazine 维表设计项目和页面管理，覆盖 book 项目创建修改、页面快照列表、页面创建保存和软删除。
version: 1.0.0
author: 方块智联工作室
tags: [book, design, e-magazine, page, snapshot, dimens-cli]
---

# 维表设计章节（book）

## 章节定位

`book` 是 `server/src/modules/e_magazine` 在 `dimens-cli` 中的独立业务入口。涉及电子书、画册、海报、演示稿、H5 或视频设计项目时，优先读取本章节。

本章节只描述当前真实接口和已实现 CLI/SDK，不把服务端尚未封装的区块、素材、发布、模板接口写成可用命令。

## 必须确认的上下文

- `teamId`：项目所属团队
- `projectId`：维表设计项目 ID
- `baseUrl` 和有效 token
- 项目详情中的 `projectType`

项目类型由项目自身保存。常见值为 `magazine`、`poster`、`presentation`、`h5`、`video`。页面命令通常不需要用户再次传 `--project-type`；`sdk.book.page` 会先读取项目详情并推断类型。显式传入只用于已明确类型或减少一次项目详情请求的场景。

## 当前真实数据模型

一个项目在同一个 `projectType` 下对应一条活动 document。页面不是独立数据库表，也没有独立的后端 page list 接口：

- 页面数组：`document.draftSnapshot.pages`
- 场景对象：`document.draftSnapshot.scenes`
- 页面列表命令：读取 `document/info` 后由 CLI/SDK 聚合 `document/pages/scenes`
- 页面删除：调用 `document/archive`，属于软删除
- 页面保存：调用 `document/save`，必须带 `baseRevision`

因此“获取项目内所有页面”默认使用 `book page list`，而不是虚构 `/page/list` 接口。

## 默认执行顺序

1. 先确认认证、`teamId`、`projectId` 和项目归属。
2. 读取 `book project info`，确认项目存在、状态有效和 `projectType`。
3. 查询页面或全部页面时使用 `book page info/list`。
4. 创建页面时准备合法的 `draftSnapshot` JSON，至少保证 `pages` 为数组、页面 ID 唯一。
5. 更新页面前先读取当前 document，使用当前 `draftRevision` 作为 `baseRevision`，合并变更后执行 `book page update`。
6. 删除页面使用 `book page delete`，确认这是 document 软删除，不是物理删除单个 `pages` 元素。
7. 写操作完成后重新执行 `book project info` 或 `book page list` 回查。

## 快速命令

```bash
dimens-cli book project page --team-id <teamId>
dimens-cli book project info --team-id <teamId> --project-id <projectId>
dimens-cli book project create --team-id <teamId> --name <name>
dimens-cli book project update --team-id <teamId> --project-id <projectId> --name <name>

dimens-cli book page info --team-id <teamId> --project-id <projectId>
dimens-cli book page list --team-id <teamId> --project-id <projectId>
dimens-cli book page create --team-id <teamId> --project-id <projectId> --title <title> --draft-snapshot '<json>'
dimens-cli book page update --team-id <teamId> --project-id <projectId> --page-id <documentId> --base-revision <revision> --draft-snapshot '<json>'
dimens-cli book page delete --team-id <teamId> --project-id <projectId> --page-id <documentId>
```

## 风险边界

- 不要把 `pageId` 当成独立后端资源 ID；`--page-id` 实际是 document ID。
- 不要省略 `baseRevision`，否则无法进行服务端并发保护。
- 不要把 `book page delete` 理解为从 `draftSnapshot.pages` 中删除一个页面；它归档整个 document。
- 不要为了读取页面去改动 Yjs Socket、权限计算或项目主链路。
- 页面快照中禁止写入 token、API Key、Secret、Cookie、Authorization 等敏感字段。

## 关联章节

| 目标 | 阅读位置 |
| --- | --- |
| 确认团队、项目和认证 | `../team/overview.md`、`../key-auth/overview.md` |
| 普通多维表设计 | `../table/overview.md` |
| 普通项目菜单和文档 | `../project/overview.md` |
| 权限控制 | `../permission/overview.md` |
| SDK/HTTP 接入 | `../../../dimens-sdk/references/node/overview.md` |
