# 文件与媒体接入总览

## 适用场景

用于上传图片、附件、封面、文档插图、表格附件字段、画布封面或资源市场素材。

| 场景 | 推荐路径 | 必读文档 |
| --- | --- | --- |
| Node.js / BFF 上传文件 | `sdk.upload.uploadFile` 或 `dimens-cli upload file` | `../upload-examples.md` |
| 上传并进入素材库 | `sdk.upload.uploadMaterialWithCdnFallback` 或 `dimens-cli upload file --source material --team-id <teamId>` | `../upload-examples.md` |
| 文档追加图片 | 先上传，再写入文档富文本 | `../document-examples.md` |
| 表格附件字段 | 先上传拿 `url/fileId`，再写入行字段 | `../table-examples.md` |
| 移动端图片上传 | 端侧不要直持密钥，优先经业务服务端 | `../mobile-examples.md` |

## 默认输出顺序

1. 说明文件来源：本地路径、浏览器 `File`、移动端图片还是远程 URL。
2. 说明执行位置：浏览器、移动端、BFF、Node.js。
3. 先上传拿 `url/fileId/key`。
4. 再写入目标资源，更新类仍按“先读 -> 合并 -> 更新”。
5. 最后回查目标文档、行、报表或画布资源。

素材库上传优先使用 CDN 链路：先读上传模式，启用七牛 CDN 时申请短期 token 并直传 CDN，再调用素材库完成接口入库；CDN 未启用或配置不完整时回退本地上传。端侧和 BFF 都不要保存七牛 AK/SK。

## 不要做

- 不要把上传成功当成业务资源已经引用成功。
- 不要把大文件、私密附件直接从端侧传到不受控地址。
- 不要在日志里打印带签名的私密访问 URL。
- 不要为了进入素材库只调用普通 `uploadFile`；素材库场景优先用 `uploadMaterialWithCdnFallback` 或 CLI 的 `--source material --team-id`。
