# 上传接入案例

## 1. Node.js / BFF 上传本地文件

```ts
const uploaded = await sdk.upload.uploadFile('/tmp/customer-cover.png', {
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  bizType: 'project-cover',
});

const fileUrl = uploaded.data.url;
```

说明：

- `uploadFile` 会读取本地文件并组装 `FormData`
- 推荐在 BFF / Node.js 服务端执行
- 不要在日志里打印完整私密 URL、token 或签名参数

## 2. CLI 预检上传能力

```bash
dimens-cli upload mode
dimens-cli upload file ./customer-cover.png --team-id TEAM1 --project-id PROJ1
```

如果 CLI 上传失败，先排查：

- 当前 token 是否有效
- 用户是否属于目标团队
- 项目 ID 是否属于该团队
- 文件路径和大小是否符合后端限制

## 3. 上传后写入文档图片

```ts
const uploaded = await sdk.upload.uploadFile('/tmp/summary.png', {
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  bizType: 'document-image',
});

const current = await sdk.document.info('TEAM1', 'PROJ1', 'DOC1');

await sdk.document.update('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  content: `${current.data.content ?? ''}<p><img src="${uploaded.data.url}" /></p>`,
  version: Number(current.data.version),
  createVersion: true,
  changeSummary: '追加图片',
});
```

## 4. 上传后写入表格附件字段

```ts
const uploaded = await sdk.upload.uploadFile('/tmp/inspection.jpg', {
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  bizType: 'row-attachment',
});

const row = await sdk.row.info('TEAM1', 'PROJ1', 'SHEET1', 'ROW1');

await sdk.row.update(
  'SHEET1',
  'ROW1',
  {
    ...(row.data.data as Record<string, unknown>),
    field_attachment: [
      {
        name: uploaded.data.name,
        url: uploaded.data.url,
        fileId: uploaded.data.fileId ?? uploaded.data.id,
      },
    ],
  },
  Number(row.data.version)
);
```

## 5. 上传后作为画布资源封面

```ts
const uploaded = await sdk.upload.uploadFile('/tmp/canvas-cover.png', {
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  bizType: 'canvas-cover',
});

await sdk.canvas.saveMineResource('TEAM1', {
  projectId: 'PROJ1',
  sheetId: 'CANVAS1',
  name: '审批流程模板',
  description: '用于审批流程初始化',
  nodes,
  edges,
  cover: uploaded.data.url,
});
```

说明：

- 上传只是素材准备
- 文档、表格、画布等目标资源仍要单独更新并回查
- 移动端上传建议走自家服务端，不要把维表高权限凭据下发到端上
