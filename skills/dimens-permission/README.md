# dimens-permission

## 技能简介

`dimens-permission` 是维表智联项目内的统一权限技能目录，当前同时承载：

- 自定义角色
- 项目 / 表级权限
- 行级策略
- 单行 ACL
- 权限排查与协同诊断

## 适用场景

- 需要直接创建角色并给用户分配角色
- 需要为角色配置项目级 / 表级 / 资源级权限
- 需要做“只能看自己 / 只能改自己”这类行级策略
- 需要给单条记录做特例授权
- 用户能看但不能改资源
- 行分页正常但协同异常
- 公开访问、只读、越权同步类问题

## 快速开始

优先先确认：

- `projectId`
- 当前用户或角色上下文
- 当前前端权限快照和后端 `myPermissions` 是否一致

如果用户给的是维表页面地址，例如：

```text
https://dimens.bintelai.com/#/TTFFEN/PXWXBJQ/
```

则可直接在命令里传 `--app-url`，CLI 会自动解析当前 `teamId / projectId / baseUrl`。

当前 `references/command-mapping.md` 里的主链示例优先按 `--app-url` 组织，便于其他产品直接复用，不需要先手动拆 `teamId / projectId`。

但要注意：

- `role` / `permission` 的操作不能只看 CLI 是否成功返回
- 必须同时参考前端 `permissionStore` 的展示结果
- 必须同时参考后端 `/permission/myPermissions` 和真实服务端权限合并逻辑

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：权限矩阵、命令速查、示例、能力状态等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

## 参考资料

- `references/command-mapping.md`
- `references/matrix.md`
- `references/examples.md`
- `references/scenario-routing.md`
- `references/capability-status.md`

涉及复杂项目权限时，建议额外对照：

- `web/src/store/permissionStore.ts`
- `server/src/modules/mul/service/permission.ts`
- `server/src/modules/mul/service/role.ts`
