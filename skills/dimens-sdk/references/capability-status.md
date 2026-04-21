# 当前 SDK 能力状态

## 已封装业务域

- `auth`
- `project`
- `report`
- `role`
- `permission`
- `sheet`
- `column`
- `document`
- `view`
- `row`
- `rowPolicy`
- `rowAcl`
- `ai`
- `upload`

## 当前适合直接使用 SDK 的场景

- 项目创建与查询
- 表格、字段、行数据基础调用
- 文档读写与版本恢复
- 报表创建、查询、组件管理
- AI 聊天兼容调用
- 文件上传

## 使用时必须注意

- `baseUrl` 默认通常为 `https://dimens.bintelai.com/api`
- token 需要调用方自行管理
- `teamId/projectId` 不是所有接口都能自动推断，很多时候需要显式传入
- 行和单元格更新时要关注 `version`

## 不要默认假设

- 不要默认假设 SDK 等于完整开放平台
- 不要默认假设所有服务端接口都已经封装成稳定 SDK
- 不要默认假设聊天兼容接口等于完整工作流管理接口
