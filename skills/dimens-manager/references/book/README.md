# dimens-manager 维表设计（book）章节

本章节专门处理维表智联 `server/src/modules/e_magazine` 对应的电子书、画册、海报、H5 等设计项目资源。

## 入口

- `overview.md`：章节边界、上下文、执行顺序和风险
- `references/design-model.md`：项目、页面快照和页面列表的数据模型
- `references/command-mapping.md`：`book` CLI 与 `sdk.book` 方法映射
- `references/examples.md`：项目和页面的创建、查询、修改、删除、列表案例

## 适用范围

- 维表设计项目创建、查询和修改
- 项目内页面快照读取和页面列表读取
- 页面创建、保存修改和软删除
- 页面版本冲突、`baseRevision` 和项目类型推断

## 不在本章节处理

- 普通维表的 sheet、column、row、view 建模：看 `../table/overview.md`
- 普通在线文档：看 `../project/overview.md` 和 `doc` 命令
- 电子书区块、素材、发布、模板、公开阅读：当前 `dimens-cli` 未封装，先核对服务端真实接口，不要编造 `book` 命令
- Yjs 协作和权限改造：分别回到协同、权限章节，不在本章节扩展
