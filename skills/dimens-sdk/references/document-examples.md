# 在线文档接入案例

## 1. 创建文档并自动挂一张文档表

```ts
const result = await sdk.document.createWithSheet('TEAM1', 'PROJ1', {
  title: '项目说明',
  content:
    '<h1>项目说明</h1>' +
    '<div style="background:#eff6ff;color:#1d4ed8;border-left:4px solid #60a5fa;padding:12px 14px;border-radius:10px;margin:12px 0;"><strong>项目摘要：</strong>这里是项目目标、范围和当前状态。</div>' +
    '<p><span style="background:#ecfdf5;color:#047857;padding:2px 8px;border-radius:999px;">已初始化</span><span style="background:#fffbeb;color:#b45309;padding:2px 8px;border-radius:999px;margin-left:8px;">待补权限</span></p>',
  format: 'richtext',
});
```

说明：

- 适合项目初始化时补一份在线说明
- 返回结果里同时包含文档和挂载的 sheet 信息
- 创建文档时不要只写黑白正文，默认加入淡色摘要卡片、状态标签或提示块，让文档更生动

## 2. 查询文档详情

```ts
const doc = await sdk.document.info('TEAM1', 'PROJ1', 'DOC1');
```

## 3. 更新富文本内容

```ts
const current = await sdk.document.info('TEAM1', 'PROJ1', 'DOC1');

await sdk.document.update('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  content: '<h1>项目周报</h1><p>本周已完成 8 项任务。</p>',
  version: Number(current.data.version),
  createVersion: true,
  changeSummary: '更新周报正文',
});
```

说明：

- 文档更新默认不要直接手填旧 `version`
- 统一先 `info` 读取当前数据，再修改内容，再调用 `update`
- 富文本内容建议用颜色表达状态、风险和提示，但颜色要服务于信息语义

## 4. 先查详情再更新，避免版本冲突

```ts
const doc = await sdk.document.info('TEAM1', 'PROJ1', 'DOC1');

await sdk.document.update('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  content: '<p>补充了新的总结</p>',
  version: Number(doc.data.version),
});
```

## 5. 写入 Mermaid 业务流程图

```ts
const doc = await sdk.document.info('TEAM1', 'PROJ1', 'DOC1');

await sdk.document.update('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  content: `<h1>审批流程说明</h1>
<p>下面是当前业务审批流。</p>
<pre data-type="mermaid"><code>flowchart TD
  A[提交申请] --> B[部门主管审批]
  B --> C{是否通过}
  C -- 通过 --> D[进入执行]
  C -- 驳回 --> E[退回修改]
</code></pre>`,
  version: Number(doc.data.version),
  createVersion: true,
  changeSummary: '补充 Mermaid 审批流程图',
});
```

说明：

- 富文本编辑器已支持 Mermaid 数据，流程图、审批流、状态流转、系统对接链路可直接写入文档
- Mermaid 只放图表 DSL，详细说明放在图表前后的段落里
- 不要把 Mermaid 图当截图上传；写入文档内容更适合后续编辑和版本管理

## 6. 查询历史版本列表

```ts
const versions = await sdk.document.versions('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  page: 1,
  size: 10,
});
```

## 7. 查询指定版本

```ts
const versionDetail = await sdk.document.version('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  version: 2,
});
```

## 8. 恢复某个旧版本

```ts
await sdk.document.restore('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  version: 2,
});
```

## 9. 删除文档

```ts
await sdk.document.delete('TEAM1', 'PROJ1', 'DOC1');
```

删除前建议先 `info` 确认文档归属和用途；如果只是误改内容，优先考虑 `versions/version/restore`，不要直接删除。

## 10. Web 前端读取文档详情

适用前提：

- 前端已经从安全来源拿到 `token`
- 已确认 `teamId/projectId/documentId`
- 如果用户给的是文档页面 `sheetId`，先通过 `doc info --sheet-id` 或等价接口换出真实 `documentId`

```ts
await fetch(
  `https://dimens.bintelai.com/api/app/documents/${teamId}/${projectId}/document/${documentId}/info`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
```

## 11. 文档接入高风险误区

- 不要更新文档时忽略 `version`
- 不要把上传和文档写回当成同一个接口
- 不要把文档只当一次性备注，不考虑持续维护和版本恢复
- 不要跳过“先拿数据 -> 改数据 -> 更新数据”这条统一更新流程
- 不要上传完文件后直接假设业务数据已更新；要把返回的 `url` 写回当前文档内容后再 update
- 不要把 Mermaid 业务流程图截图上传；优先写入 Mermaid 数据，方便版本维护
- 不要生成只有黑白文字的单调文档；默认至少补状态标签、摘要卡片或提示块
- 不要把 403/404 都当成 token 过期；先确认权限、文档 ID 和菜单资源 ID 是否混用

## 12. 最小验证命令

```bash
dimens-cli doc info DOC1 --team-id TEAM1 --project-id PROJ1
dimens-cli doc versions --team-id TEAM1 --project-id PROJ1 --document-id DOC1
```

如果用户只有文档页面链接里的 `sh_xxx`，先用：

```bash
dimens-cli doc info --sheet-id sh_xxx --team-id TEAM1 --project-id PROJ1
```
