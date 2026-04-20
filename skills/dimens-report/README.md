# dimens-report

## 技能简介

`dimens-report` 用于处理维表智联中的报表、图表组件、数据源配置、参数联动和查询链路说明。

它不是只负责“解释报表是什么”，而是要把报表主资源、组件配置、查询预检和最终验证串成一条完整可执行链路。

## 适用场景

- 查询或解释报表结构
- 排查图表不显示、查不到数据
- 分析参数联动和导出链路
- 说明报表与项目权限、多维表格数据源的关系
- 直接生成经营看板、图表组件或统计报表
- 在创建组件前先预览数据源，避免一次生成失败

## 当前能力范围

当前 `dimens-cli` 在报表这块已经覆盖三条主链：

1. 主资源链
   `report create/update/copy/publish/delete/archive/validate/sort/move`
2. 组件链
   `widget-add/update/delete/batch/sort`
3. 查询链
   `query/query-widget/preview`

这意味着 `dimens-report` 已经不是纯说明型技能，而是可以直接指导用户从报表创建走到组件预检、单组件试跑、整报表验证。

## 固定预检链

如果用户要“直接生成一个报表 / 看板 / 图表组件”，默认不要从 `widget-add` 开始，而要按下面顺序推进：

1. `report create`
2. `report preview`
3. `report widget-add`
4. `report query-widget`
5. `report query`

这条顺序在本目录里统一叫“固定预检链”。

## 快速开始

优先准备：

- `projectId`
- `reportId`
- 相关参数定义
- 数据源信息

如果是多维表格数据源，通常还要补齐：

- `sheetId`
- `sheet.columns`
- `fieldIds`
- `recommendedMapping`
- `previewMapping`
- `dataMapping`

不要只给 `sheetId` 就开始创建组件。

## 高风险跑偏点

下面这些是使用 `dimens-report` 时最容易做错的地方：

1. 把报表理解成只有一个空主资源
2. 跳过固定预检链，直接 `widget-add`
3. 把 `recommendedMapping` 当成最终渲染映射
4. 只写 `sheetId`，不补 `columns / fieldIds / previewMapping / dataMapping`
5. 没确认字段类型，就把文本列当数值轴
6. 没跑 `preview` 或 `query-widget`，就断言图表一定能成功创建

如果出现这些情况，优先回到：

- `SKILL.md`
- `references/recharts-widget-guide.md`
- `references/capability-status.md`

## 推荐阅读顺序

建议按下面顺序阅读：

1. `SKILL.md`
2. `references/capability-status.md`
3. `references/recharts-widget-guide.md`
4. `references/examples.md`
5. `references/usage.md`

## 目录说明

- `SKILL.md`：平台识别入口和技能主体
- `rules/`：发布平台兼容入口，当前用于指向原始规则文档
- `references/`：用法、示例、能力范围等补充资料
  关系说明：`rules/` 面向发布平台规则扫描，`references/` 保持技能知识文档沉淀。

## 关键 references 说明

- `references/capability-status.md`
  说明当前哪些报表能力已经 CLI 化，哪些只是部分对齐
- `references/recharts-widget-guide.md`
  说明 Recharts 真实支持的组件类型、字段映射和一次生成成功规则
- `references/examples.md`
  说明接口路径、命令案例和多维表格报表组件示例
- `references/usage.md`
  说明报表问题排查时的业务分层

## 一句话规则

报表生成不要跳过预检；对多维表格报表，不要省略字段元信息和最终映射。

## 参考资料

- `SKILL.md`
- `references/usage.md`
- `references/examples.md`
- `references/capability-status.md`
- `references/recharts-widget-guide.md`
