# relation 字段模式与 CLI 接入

`relation` 仍然是唯一的关联字段类型，通过 `config.relationConfig.relationMode` 区分单表关联和多表关联。不要新建 `relationSingle` 或 `relationMultiple` 字段类型。

## 配置结构

```json
{
  "label": "所属客户",
  "type": "relation",
  "config": {
    "relationConfig": {
      "targetSheetId": "sh_customer",
      "displayColumnId": "fld_customer_name",
      "relationMode": "single"
    }
  }
}
```

| `relationMode` | 行值存储 | `maxSelection` | 典型场景 |
| --- | --- | --- | --- |
| `single` | 一个 `rowId` 或 `null` | 不传 | 联系人所属客户、工单所属项目 |
| `multiple` | `rowId[]` 或 `[]` | 不传表示不限；传入时必须是 `>= 2` 的正整数 | 客户关联多个联系人、项目关联多个工单 |

关联模式是字段结构属性，只能在创建字段时决定。字段创建后可以更新名称、展示字段等普通配置，但不能把 `single` 改成 `multiple`，也不能反向修改。

## CLI

单表关联不需要输入限制数量：

```bash
dimens-cli column create \
  --team-id TEAM1 \
  --project-id PROJ1 \
  --sheet-id sh_contact \
  --label 所属客户 \
  --type relation \
  --target-sheet-id sh_customer \
  --display-column-id fld_customer_name \
  --relation-mode single
```

多表关联不限制数量时省略 `--max-selection`；需要限制时显式传入数量：

```bash
dimens-cli column create \
  --team-id TEAM1 \
  --project-id PROJ1 \
  --sheet-id sh_customer \
  --label 联系人列表 \
  --type relation \
  --target-sheet-id sh_contact \
  --display-column-id fld_contact_name \
  --relation-mode multiple \
  --max-selection 10
```

命令层会在请求前校验：

- `--relation-mode` 只能是 `single` 或 `multiple`。
- `single` 不能同时传 `--max-selection`。
- `multiple` 的 `--max-selection` 必须是大于等于 2 的整数；不传即不限。
- 旧参数 `--multiple true|false` 仍可使用，但会转换为正式的 `relationMode`，新脚本应改用 `--relation-mode`。
- `--config` 可以提供完整 `relationConfig`，命令参数优先覆盖同名配置，不会丢失未覆盖的目标表或展示字段。

## Node.js SDK

SDK 直接透传字段配置，推荐显式传 `relationMode`：

```ts
await sdk.column.create('TEAM1', 'PROJ1', 'sh_contact', {
  label: '所属客户',
  type: 'relation',
  config: {
    relationConfig: {
      targetSheetId: 'sh_customer',
      displayColumnId: 'fld_customer_name',
      relationMode: 'single',
    },
  },
});
```

多表不限数量时省略 `maxSelection`；有上限时传正整数（最小为 2）：

```ts
await sdk.column.create('TEAM1', 'PROJ1', 'sh_customer', {
  label: '联系人列表',
  type: 'relation',
  config: {
    relationConfig: {
      targetSheetId: 'sh_contact',
      relationMode: 'multiple',
      maxSelection: 10,
    },
  },
});
```

写行数据时，单表传单个目标行 ID，多表传 ID 数组：

```ts
await sdk.row.create('sh_contact', {
  data: { fld_customer_relation: 'row_customer_1' },
});

await sdk.row.create('sh_customer', {
  data: { fld_contact_relation: ['row_contact_1', 'row_contact_2'] },
});
```

## MCP 与通用 config

`dimens_column_create` 已支持通用 `config` 对象。MCP 调用时将同样的结构放入 `config.relationConfig`，不要使用顶层 `multiple` 或 `maxSelection`：

```json
{
  "label": "联系人列表",
  "type": "relation",
  "config": {
    "relationConfig": {
      "targetSheetId": "sh_contact",
      "displayColumnId": "fld_contact_name",
      "relationMode": "multiple",
      "maxSelection": 10
    }
  }
}
```

## 历史配置兼容

服务端和前端读取旧字段时按以下顺序确定模式：

1. 明确的 `relationMode` 优先。
2. 缺少 `relationMode` 且 `maxSelection === 1`，按 `single` 处理。
3. 其他缺少 `relationMode` 的历史字段按 `multiple` 处理。

历史单值或数组数据都可以读取；后续成功写入时按有效模式规范化。更新已有字段前先执行 `column list`，不要用 CLI 把模式切换当作普通配置更新。

## 验收

创建或迁移 relation 后至少回查：

```bash
dimens-cli column list --team-id TEAM1 --project-id PROJ1 --sheet-id SHEET1 --output json
dimens-cli row page --team-id TEAM1 --project-id PROJ1 --sheet-id SHEET1
```

确认 `relationConfig.relationMode`、`maxSelection`、目标表和展示字段与设计一致，再检查单表值为标量、多表值为数组。权限和协同链路仍按原有规则处理，本功能不改变 Yjs 协议。
