# 在线文档接入案例

## 1. 创建文档并自动挂一张文档表

```ts
const result = await sdk.document.createWithSheet('TEAM1', 'PROJ1', {
  title: '项目说明',
  content: '<h1>项目说明</h1><p>这里是项目介绍。</p>',
  format: 'richtext',
});
```

说明：

- 适合项目初始化时补一份在线说明
- 返回结果里同时包含文档和挂载的 sheet 信息

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

## 4. 先查详情再更新，避免版本冲突

```ts
const doc = await sdk.document.info('TEAM1', 'PROJ1', 'DOC1');

await sdk.document.update('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  content: '<p>补充了新的总结</p>',
  version: Number(doc.data.version),
});
```

## 5. 查询历史版本列表

```ts
const versions = await sdk.document.versions('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  page: 1,
  size: 10,
});
```

## 6. 查询指定版本

```ts
const versionDetail = await sdk.document.version('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  version: 2,
});
```

## 7. 恢复某个旧版本

```ts
await sdk.document.restore('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  version: 2,
});
```

## 8. 删除文档

```ts
await sdk.document.delete('TEAM1', 'PROJ1', 'DOC1');
```

## 9. Web 前端读取文档详情

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

## 10. 文档接入高风险误区

- 不要更新文档时忽略 `version`
- 不要把上传和文档写回当成同一个接口
- 不要把文档只当一次性备注，不考虑持续维护和版本恢复
- 不要跳过“先拿数据 -> 改数据 -> 更新数据”这条统一更新流程
- 不要上传完文件后直接假设业务数据已更新；要把返回的 `url` 写回当前文档内容后再 update
