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
dimens-cli upload file ./customer-cover.png --team-id TEAM1 --source material
```

如果目标是“上传后进入素材库”，优先使用第三条命令：`--source material --team-id` 会先尝试 CDN 直传并完成素材入库，CDN 未启用或配置不完整时回退本地上传。普通封面或附件只需要拿 URL 时，不要额外带 `--source material`。

如果 CLI 上传失败，先排查：

- 当前 token 是否有效
- 用户是否属于目标团队
- 项目 ID 是否属于该团队
- 文件路径和大小是否符合后端限制
- 素材库上传时 `upload mode` 是否启用 CDN，以及 token 接口是否返回“未启用/配置不完整”的可回退错误

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

## 6. 真实场景：上传到素材库，优先 CDN，失败时允许回退

适用场景：

- 用户说“这张图要进素材库，不只是拿一个 URL”
- 希望优先走 CDN，再入素材库记录

```ts
const material = await sdk.upload.uploadMaterialWithCdnFallback('/tmp/poster.png', {
  teamId: 'TEAM1',
  source: 'material',
  uploadSource: 'material',
  fileName: 'poster.png',
});

const materialUrl = material.data.url;
```

说明：

- 这条链路和普通 `uploadFile()` 不同，它会先看上传模式，再尝试 CDN token / 直传 / 完成入库
- `source=material` 时必须显式带 `teamId`
- 最终 URL 以服务端完成接口返回值为准：PNG/JPG 等位图可能返回 WebP 派生地址，SVG 和非图片文件保持原始文件地址
- 如果返回的是“CDN 未启用 / 配置不完整”这类可回退错误，SDK 会退回普通上传

CLI 对应验证：

```bash
dimens-cli upload mode
dimens-cli upload file ./poster.png --team-id TEAM1 --source material
```

## 7. 真实场景：上传图片后写回文档正文

适用场景：

- 用户说“先上传图片，再插进在线文档”
- 不是只返回 URL，而是要完整走“上传 -> 读文档 -> 更新文档”

```ts
const uploaded = await sdk.upload.uploadFile('/tmp/cover.png', {
  teamId: 'TEAM1',
  projectId: 'PROJ1',
  bizType: 'document-image',
});

const current = await sdk.document.info('TEAM1', 'PROJ1', 'DOC1');

await sdk.document.update('TEAM1', 'PROJ1', {
  documentId: 'DOC1',
  content: `${current.data.content ?? ''}<p><img src="${uploaded.data.url}" alt="封面图" /></p>`,
  version: Number(current.data.version),
  createVersion: true,
  changeSummary: '插入上传图片',
});
```

不要省略的步骤：

- 不要上传后就假设业务数据已更新
- 不要手填旧 `version`
- 不要把上传接口和文档更新接口混成同一步
