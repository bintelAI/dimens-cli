# 维表设计命令与 SDK 映射

| 业务能力 | CLI | SDK |
| --- | --- | --- |
| 项目分页 | `book project page` | `sdk.book.project.page()` |
| 项目详情 | `book project info` | `sdk.book.project.info()` |
| 创建项目 | `book project create` | `sdk.book.project.create()` |
| 修改项目 | `book project update` | `sdk.book.project.update()` |
| 页面详情 | `book page info` | `sdk.book.page.info()` |
| 项目全部页面 | `book page list` | `sdk.book.page.list()` |
| 创建页面 | `book page create` | `sdk.book.page.create()` |
| 保存页面修改 | `book page update` | `sdk.book.page.update()` |
| 删除页面 | `book page delete` | `sdk.book.page.delete()` |

## 类型推断

页面命令不要求 `--project-type`。SDK 会先请求：

```text
GET /app/e-magazine/:teamId/project/:projectId
```

读取项目的 `projectType`，再请求 document 接口。显式传入 `projectType` 仍可用于减少一次请求或处理已知类型。

## 页面列表的接口边界

服务端当前没有 `/document/page/list`。`book page list` 的真实链路是：

```text
project info -> document info -> draftSnapshot.pages/scenes 聚合
```

不要把这个命令描述为数据库分页，也不要声称它能跨多个 `projectType` 自动合并。需要读取多个类型时，分别调用 `book page list`。
