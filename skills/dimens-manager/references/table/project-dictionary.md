# 项目数据字典

## 何时创建

先统计同一组选项的使用位置：

- 只有一个字段、一个页面或一个流程使用：直接创建 `select` / `multiSelect`，选项放在字段配置中。
- 同一组选项明确会被多个表、字段或流程复用：创建项目数据字典，再让各字段引用同一个 `dictionaryId`。

“要求唯一”本身不是创建字典的理由；唯一性只需在普通 `select` 字段内约束即可。

## 编码规则

- 字典 `code` 和选项 `value` 必填，只允许小写英文、数字、下划线、连字符：`^[a-z0-9_-]+$`。
- Skill 可以根据中文名称生成可编辑的 ASCII slug 建议，例如“客户等级”建议 `customer_level`；中文无法可靠转换时，应要求用户提供英文语义。
- 建议编码与项目已有字典/整棵选项树比较，冲突时建议追加 `_2`、`_3`，写入前让用户确认。
- 默认生成顺序固定为：优先复用用户给出的英文标识；否则将英文短语转小写并把空格/标点归一为 `_`，去除首尾分隔符；中文名称不能凭空猜拼音，需先给出英文语义候选。选项 `value` 同样按“稳定语义 + 小写编码”生成，例如“高级客户”建议 `vip` 或 `premium`，不得使用随机 UUID。
- Skill 输出创建方案时同时展示“建议编码”和“最终确认编码”，并列出冲突检查范围（当前项目字典 `code`、当前字典整棵树的 `value`）。用户未确认前只输出方案，不执行写入。
- 编码一旦被业务使用不要修改。字典 `code` 创建后不可修改；选项 `value` 已被字段行数据使用时不可修改。历史 UUID 仍可读取。

## CLI 创建

```bash
dimens-cli project-dict create \
  --team-id TEAM1 --project-id PROJ1 \
  --name 客户等级 --code customer_level \
  --options '[{"id":"vip","label":"VIP","value":"vip"}]'
```

选项较多时使用 `--options-file ./customer-level.json`。创建后必须执行：

```bash
dimens-cli project-dict info --team-id TEAM1 --project-id PROJ1 --id <dictId>
```

更新前先 `info`，合并完整选项树后再 `project-dict update`；删除必须显式传 `--confirm true`，已被字段引用的字典由服务端拒绝删除。
