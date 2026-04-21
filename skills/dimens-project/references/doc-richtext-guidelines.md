# dimens-project TipTap 文档样式与上传约束

## 1. 这份文档解决什么问题

这份文档专门给在线文档 Skill 使用，解决三件事：

1. TipTap 文档内容应该怎么写，才不像一坨纯文本
2. 文档里的颜色、状态、类型怎么控制
3. 文件、图片、附件在当前产品和 CLI 里分别是什么能力边界

## 2. 当前真实能力边界

当前仓库已经确认的事实：

- `dimens-cli` 已有文档主链：
  - `doc create`
  - `doc info`
  - `doc update`
  - `doc delete`
  - `doc versions`
  - `doc version`
  - `doc restore`
- `dimens-cli` 已有上传命令：
  - `upload file`
  - `upload mode`
- 产品接口层已有上传入口：
  - `POST /app/base/comm/upload`
- 服务端文档清洗逻辑允许保留富文本相关属性：
  - `class`
  - `style`
  - `id`
  - `data-video`
  - `data-attachment`
  - `data-file-name`
  - `data-file-size`

所以结论要分清：

- “文档富文本编辑”是当前 CLI 已经覆盖的能力
- “文件/图片上传”是当前 CLI 和产品接口都已覆盖的能力
- “上传后直接并入文档”也已有 CLI 主链：`doc attach-file`、`doc append-image`

## 3. TipTap 文档的默认结构建议

如果 Skill 要帮用户生成项目说明、制度、操作手册、知识页，默认建议至少按下面结构组织：

1. 主标题
2. 简介段落
3. 状态区或提示区
4. 小节标题
5. 列表或步骤
6. 附件 / 图片 / 相关链接

不要直接输出一大段没有层次的正文。

## 4. 颜色与状态要怎么控

文档里如果有“状态”“风险”“提示”“类型”等语义，建议显式带颜色语义。

推荐语义如下：

| 场景 | 推荐风格 |
| --- | --- |
| 普通说明 / 默认状态 | `slate` / 灰色系 |
| 处理中 / 进行中 | `blue` / 蓝色系 |
| 已完成 / 已发布 / 正常 | `emerald` 或 `green` |
| 警告 / 待确认 | `yellow` 或 `orange` |
| 驳回 / 风险 / 异常 | `rose` 或 `red` |
| 分类标签 / 辅助强调 | `purple` / `indigo` / `pink` |

要求：

- 同一篇文档内，颜色语义要稳定
- 不要一段一个色，颜色必须服务于信息层级
- 状态类内容最好采用标签、提示块、卡片摘要，而不是只靠文字描述

## 5. 文档内容类型建议

Skill 生成文档时，建议至少控制下面几类内容：

| 内容类型 | 适合表达方式 |
| --- | --- |
| 标题 | `h1/h2/h3` 层级 |
| 正文说明 | 段落 |
| 关键状态 | 彩色标签或提示块 |
| 步骤说明 | 有序列表 |
| 注意事项 | 警示块 / 加粗提示 |
| 示例数据 | 列表、表格、代码块 |
| 图片附件 | 图片节点或附件节点 |

## 6. 文件图片上传怎么讲才不误导

当前技能必须明确区分：

### 6.1 已有能力

- 产品已有上传接口：`/app/base/comm/upload`
- 前端已有图片上传使用方式
- 多维表格已有 `image`、`file` 字段类型

### 6.2 CLI 当前主链

- 已有 `dimens-cli upload file`
- 已有 `dimens-cli upload mode`
- 已有 `dimens-cli doc attach-file`
- 已有 `dimens-cli doc append-image`

### 6.3 Skill 应该怎么表达

可以这样说：

1. 如果只需要上传素材，先执行 `dimens-cli upload file`
2. 如果要把附件直接并入文档，执行 `dimens-cli doc attach-file`
3. 如果要把图片直接并入文档，执行 `dimens-cli doc append-image`
4. 如果要完全自定义 TipTap 结构，再执行 `doc update --content ...`

不要这样说：

1. “只有产品接口能上传，CLI 还不支持”
2. “文档附件必须先手动拼 URL，CLI 不能直接写回”

## 7. 输出文档内容时的最低要求

如果 Skill 生成的是 TipTap 富文本内容，最低要求是：

- 有标题
- 有正文
- 有一个带颜色语义的状态区或提示区

如果是操作手册、制度、知识库页面，建议再补：

- 分节标题
- 步骤列表
- 图片或附件占位说明

## 8. 示例片段

下面是一个适合通过 `doc create` / `doc update` 传入的简化富文本片段示例：

```html
<h1>项目发布说明</h1>
<p>本文档用于说明本次版本的上线范围、状态和附件资料。</p>
<p>
  <span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:999px;">发布中</span>
  <span style="background:#ecfdf5;color:#047857;padding:2px 8px;border-radius:999px;margin-left:8px;">已校验</span>
</p>
<h2>变更范围</h2>
<ul>
  <li>补充字段颜色规范</li>
  <li>补充文档富文本规范</li>
  <li>补充文件与图片上传说明</li>
</ul>
<h2>附件</h2>
<p data-attachment="true" data-file-name="发布清单.pdf" data-file-size="245760">发布清单.pdf</p>
```

## 9. 不要这样做

- 不要把在线文档当成纯文本备注字段
- 不要完全不写颜色语义，导致状态信息不可视
- 不要忽略 `upload file / upload mode / doc attach-file / doc append-image` 这条现成主链
- 不要只放图片 URL，不说明图片/附件在文档中的用途
