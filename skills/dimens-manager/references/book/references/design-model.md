# 维表设计数据模型

## 项目

项目接口前缀：`/app/e-magazine/:teamId/project`。

| 字段 | 说明 |
| --- | --- |
| `id` | 电子书设计项目 ID |
| `teamId` | 团队隔离字段 |
| `name` | 项目名称 |
| `description` | 项目说明 |
| `projectType` | `magazine`、`poster`、`presentation`、`h5`、`video` |
| `status` | `active` 或归档状态 |
| `shareCode` | 服务端生成的公开分享编码，不由 CLI 自行生成 |

## Document 与页面

文档接口前缀：`/app/e-magazine/:teamId/:projectId/document`。

`mag_project_document` 以 `projectId + projectType` 唯一。document 的核心数据如下：

```json
{
  "id": "DOC_1",
  "projectId": "BOOK1",
  "projectType": "magazine",
  "title": "产品画册",
  "draftRevision": 3,
  "draftSnapshot": {
    "pages": [
      { "id": "page-1", "title": "封面" }
    ],
    "scenes": {
      "page-1": {}
    }
  }
}
```

页面列表是 `draftSnapshot.pages` 的读取视图；`sdk.book.page.list()` 还会保留原始 `document` 和 `scenes`，方便页面设计工具继续处理完整快照。

## 保存约束

- `pages` 必须是数组。
- 每个页面必须有非空且唯一的 `id`。
- `scenes` 如果存在必须是对象。
- 快照最大 2 MB。
- 快照禁止 token、refreshToken、apiKey、apiSecret、authorization、cookie 等敏感键。
- 保存时 `baseRevision` 必须等于服务端当前 `draftRevision`；冲突时先重新读取再合并。
