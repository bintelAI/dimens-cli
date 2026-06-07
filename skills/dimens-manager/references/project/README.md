# dimens-manager 项目初始化章节

当前目录是 `dimens-manager` 的 `project` 业务章节，承载原独立技能的业务说明、接口案例和规则资料。

## 入口

- `overview.md`：章节总览和执行前必读
- `references/`：接口级、场景级和命令级扩展资料
- `rules/`：平台兼容入口
- `assets/`：素材占位目录

## 快速模板入口

当用户要求“快速创建 / 一键创建 / 按行业模板创建 / 复用历史脚本 / 补齐项目资源”时，优先读取：

- `references/quick-project-template.md`：把餐饮新品运营、石油终端零售等历史创建脚本抽象成 `QuickProjectConfig`，再按阶段闸门执行项目、目录、表、字段、样例数据、文档、报表和画布创建。

注意：

- 不要把 `.trae/推进方案/*.mjs` 原样复制成通用执行脚本。
- 旧脚本里的行业字段、目录、样例数据只能作为变量草案。
- 执行默认 CLI 优先；文档必须转 TipTap `richtext`；报表维度和指标必须来自当前表 `column list`；画布必须补完整渲染字段和可读配色。
