# 移动端接入总览

## 适用场景

用于 App、React Native、小程序、移动 H5 这类端侧接入。

| 场景 | 推荐路径 | 必读文档 |
| --- | --- | --- |
| App / 小程序调用维表能力 | 自家服务端代管维表密钥 | `../mobile-examples.md` |
| 移动端上传图片或附件 | 端侧传业务服务端，服务端上传或签发受控链路 | `../upload-examples.md` |
| 端侧读取表格、文档、报表 | 端侧只拿短期 token 或调用自家 BFF | `../web-examples.md` |
| 移动端 token 失效 | 由自家登录态和 BFF 统一刷新 | `../request-retry-example.md` |

## 默认输出顺序

1. 说明 App 包体、小程序代码和移动 H5 不能保存 `apiSecret`。
2. 推荐链路：`app login -> app server -> exchange token -> app request business api -> business api call dimens`。
3. 说明端侧只使用短期 token 或自家业务接口。
4. 上传类场景先拿文件 `url/fileId`，再写入表格字段、文档内容或画布资源。
5. 说明离线、弱网、重复提交需要业务侧幂等或重试控制。

## 不要做

- 不要把 `apiKey/apiSecret` 打进 App 或小程序包体。
- 不要让端侧直接长期保存维表高权限 token。
- 不要上传成功后直接认为业务写入成功，必须继续回查目标资源。
