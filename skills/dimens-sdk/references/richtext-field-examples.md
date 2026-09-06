# 富文本字段接入案例

本页只讲一件事：**富文本字段**，不是在线文档。

在线文档走 `doc create / doc info / doc update`，富文本字段走 `richtext-field content / richtext-field save`。

## 1. AI 生成 HTML 后写回富文本字段

```ts
const html = `
<h1>AI 生成说明</h1>
<div style="background:#eff6ff;color:#1d4ed8;border-left:4px solid #60a5fa;padding:12px 14px;border-radius:10px;margin:12px 0;">
  <strong>摘要：</strong>这里是 AI 生成的字段内容。
</div>
<p><span style="background:#ecfdf5;color:#047857;padding:2px 8px;border-radius:999px;">已生成</span></p>
`;

await sdk.richtextField.save('TEAM1', 'PROJ1', {
  sheetId: 'sh_1',
  rowId: 'row_1',
  fieldId: 'fld_richtext',
  documentId: 'DOC_RTF_1',
  content: html,
  rowVersion: 7,
  title: 'AI 生成说明',
});
```

说明：

- `content` 只收 HTML，不要再塞 Markdown 原文
- 这条链路会把 HTML 写回富文本字段，并同步生成字段预览文本
- 如果已经有文档 ID，可以顺手传 `documentId`

## 2. 读取富文本字段关联内容

```ts
const result = await sdk.richtextField.getContent('TEAM1', 'PROJ1', 'DOC_RTF_1');
```

CLI 对应命令：

```bash
dimens-cli richtext-field content --team-id TEAM1 --project-id PROJ1 --document-id DOC_RTF_1
```

## 3. 推荐的 AI 驱动链路

1. AI 先产出 HTML
2. 用 `richtext-field save` 写回字段
3. 用 `richtext-field content` 校验结果

不要把这条链路写成 `doc update`，它不是在线文档。
