# 维表设计操作示例

## 创建项目并读取类型

```bash
dimens-cli book project create \
  --team-id TEAM1 \
  --name 产品画册 \
  --description 产品发布册

dimens-cli book project info \
  --team-id TEAM1 \
  --project-id BOOK1
```

创建接口默认使用服务端的 `magazine` 类型。需要其他类型时才传 `--project-type poster`、`presentation`、`h5` 或 `video`。

## 获取项目内全部页面数据

```bash
dimens-cli book page list \
  --team-id TEAM1 \
  --project-id BOOK1
```

返回数据包含：

- `document`：当前项目类型的完整 document
- `pages`：`document.draftSnapshot.pages` 全部页面
- `scenes`：`document.draftSnapshot.scenes` 场景数据

如果项目存在多个类型，分别查询：

```bash
dimens-cli book page list --team-id TEAM1 --project-id BOOK1 --project-type poster
```

## 创建与保存页面

```bash
dimens-cli book page create \
  --team-id TEAM1 \
  --project-id BOOK1 \
  --title 首页 \
  --draft-snapshot '{"pages":[{"id":"page-1","title":"封面"}],"scenes":{}}'

dimens-cli book page update \
  --team-id TEAM1 \
  --project-id BOOK1 \
  --page-id DOC1 \
  --base-revision 0 \
  --draft-snapshot '{"pages":[{"id":"page-1","title":"更新后的封面"}],"scenes":{}}' \
  --change-summary 更新封面文案
```

更新前应先执行 `book page info` 或 `book page list`，把返回的 `draftRevision` 作为 `baseRevision`。收到冲突错误时，重新读取当前快照，合并用户变更后再保存。

## 删除页面 document

```bash
dimens-cli book page delete \
  --team-id TEAM1 \
  --project-id BOOK1 \
  --page-id DOC1
```

这里的 `delete` 实际调用 `document/archive`，会归档整个页面 document。它不是从 `pages` 数组中删除单个页面对象。
