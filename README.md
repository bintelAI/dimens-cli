# Dimens CLI

`dimens-cli` 是多维项目的本地命令行与 Node.js SDK 封装，当前已经落地可直接执行的本地 CLI 主链。

当前实现重点收口为两条主能力：

- 认证侧：`API Key + API Secret` 换取系统 `token`
- AI 侧：`POST /app/flow/:teamId/v1/chat/completions`

默认 `baseUrl` 固定为：

```text
https://dimens.bintelai.com/api
```

只有当用户显式传入 `--base-url`、profile 配置或环境变量时，才会覆盖默认地址。

## 当前已实现能力

当前仓库里已经实现并验证的命令组有：

- `auth`
- `project`
- `doc`
- `view`
- `report`
- `upload`
- `role`
- `permission`
- `sheet`
- `column`
- `row`
- `row-policy`
- `row-acl`
- `ai`
- `skill`
- `system`

对应 SDK 业务域有：

- `sdk.auth`
- `sdk.project`
- `sdk.document`
- `sdk.view`
- `sdk.report`
- `sdk.upload`
- `sdk.role`
- `sdk.permission`
- `sdk.sheet`
- `sdk.column`
- `sdk.row`
- `sdk.rowPolicy`
- `sdk.rowAcl`
- `sdk.ai`

## 安装

作为 npm 包安装：

```bash
npm install @bintel/dimens-cli
```

或：

```bash
pnpm add @bintel/dimens-cli
```

如果你本地执行 `dimens-cli` 提示“command not found”，说明当前环境还没有这个命令。先安装 `@bintel/dimens-cli`，安装完成后再继续看 `skills/` 文档、CLI 案例和 Skill 路由说明。

如果你是在当前仓库里开发 `dimens-cli`，再看下面的“本地开发使用”。

## 本地开发使用

进入目录：

```bash
cd /Users/lixiang/data/代码库管理/binterAi/多维项目开发/dimens-cli
```

安装依赖：

```bash
pnpm install
```

构建：

```bash
pnpm build
```

本地直接执行 CLI：

```bash
node ./bin/dimens-cli.js help
```

如果你希望像全局命令一样使用：

```bash
npm link
dimens-cli help
```

## CLI 快速开始

查看帮助：

```bash
node ./bin/dimens-cli.js help
node ./bin/dimens-cli.js help auth
node ./bin/dimens-cli.js help doc
node ./bin/dimens-cli.js help upload
node ./bin/dimens-cli.js help report
node ./bin/dimens-cli.js help view
node ./bin/dimens-cli.js help role
node ./bin/dimens-cli.js help permission
node ./bin/dimens-cli.js help row-policy
node ./bin/dimens-cli.js help row-acl
node ./bin/dimens-cli.js help ai
node ./bin/dimens-cli.js help skill
```

查看技能列表：

```bash
node ./bin/dimens-cli.js skill list
node ./bin/dimens-cli.js skill list --output json
```

查看技能详情：

```bash
node ./bin/dimens-cli.js skill info dimens-manager
node ./bin/dimens-cli.js skill info dimens-system-orchestrator
node ./bin/dimens-cli.js skill show dimens-manager --references
node ./bin/dimens-cli.js skill show dimens-manager --mapping-only
```

说明：

- `skill info <name>` 现在除了主文件、命令映射、references 外，还会显示“推荐关键词示例”
- 这个区块用于反向说明：什么样的输入更容易命中当前 Skill
- `--output json` 下会返回 `recommendExamples` 字段

根据关键词推荐技能：

```bash
node ./bin/dimens-cli.js skill recommend 工作流 默认模型 AI 分析
node ./bin/dimens-cli.js skill recommend 'AI 一键生成业务工作流画布'
node ./bin/dimens-cli.js skill recommend api-key token --output json
node ./bin/dimens-cli.js skill recommend 生成一个客户管理系统
node ./bin/dimens-cli.js skill recommend '帮我做一个项目管理平台'
node ./bin/dimens-cli.js skill recommend '生成一个审批系统' --output json
```

说明：

- `skill recommend` 支持关键词输入，也支持自然语言整句输入
- 如果输入是“生成一个 XX 系统 / 平台 / 管理系统 / 业务系统”这类系统建设需求，当前会优先推荐 `dimens-system-orchestrator`
- 如果输入是“AI 一键生成画布 / 流程图 / 思维导图 / 工作流画布”这类可视化生成需求，当前会优先推荐 `dimens-manager`
- `--output json` 不会再污染推荐文本，参数值不会被拼进 query
- `--output json` 下的推荐结果除了 `score`，还会额外返回 `matchedBy` 和 `reason`，用于解释“为什么命中这个 Skill”
- 文档链接里常见的 `sh_xxx` 是菜单资源 `sheetId`，不是文档内容 `documentId`；如果用户给的是文档页面链接，优先用 `doc info --sheet-id sh_xxx` 或 `doc info sh_xxx`，拿到真实 `documentId` 后再继续 `doc update`

JSON 输出示例：

```json
{
  "success": true,
  "message": "技能推荐完成",
  "data": [
    {
      "score": 22,
      "matchedBy": ["system-build-intent"],
      "reason": "命中系统建设意图",
      "skill": {
        "name": "dimens-system-orchestrator"
      }
    }
  ]
}
```

当前已经支持的高频解释标签包括：

- `system-build-intent`：系统建设意图
- `workflow-intent`：工作流意图
- `auth-intent`：鉴权接入意图
- `table-intent`：多维表格意图
- `permission-intent`：权限意图
- `report-intent`：报表意图
- `canvas-intent`：画布意图

画布资源命令：

```bash
node ./bin/dimens-cli.js help canvas
node ./bin/dimens-cli.js canvas create --project-id PROJ1 --name 业务流程画布
node ./bin/dimens-cli.js canvas info canvas_1 --team-id TEAM1 --project-id PROJ1
node ./bin/dimens-cli.js canvas save canvas_1 --team-id TEAM1 --project-id PROJ1 --base-version 1 --file ./workflow-canvas.json --summary AI生成业务工作流
node ./bin/dimens-cli.js canvas versions canvas_1 --team-id TEAM1 --project-id PROJ1
node ./bin/dimens-cli.js canvas resource-market --team-id TEAM1 --keyword 审批
```

例如：

```bash
node ./bin/dimens-cli.js skill info dimens-manager --output json
```

返回结果中会包含类似：

```json
{
  "recommendExamples": [
    "api-key token",
    "api secret 登录",
    "第三方鉴权接入"
  ]
}
```

使用 API Key 换 Token：

```bash
node ./bin/dimens-cli.js auth api-key-login \
  --api-key ak_xxx \
  --api-secret sk_xxx
```

写入默认团队：

```bash
node ./bin/dimens-cli.js auth use-team TEAM1
```

获取项目列表：

```bash
node ./bin/dimens-cli.js project list --team-id TEAM1
```

上传本地文件：

```bash
node ./bin/dimens-cli.js upload file --path ./demo.txt
node ./bin/dimens-cli.js upload file --path ./cover.png --key docs/cover.png
node ./bin/dimens-cli.js upload file --path ./project-cover.png --team-id TEAM1 --project-id PROJ1 --scene project-cover
node ./bin/dimens-cli.js upload file --path ./logo.svg --team-id TEAM1 --source material
node ./bin/dimens-cli.js upload mode
```

统一规则：

- 所有文件、图片、封面都统一先走 `upload file`
- 上传接口返回 `fileId`、`key`、`url`
- 业务命令只消费上传后的 `url`，不再各自实现一套独立的存储逻辑
- 典型场景包括：项目封面、文档图片、文档附件
- 所有更新命令统一按“先拿当前数据 -> 修改目标字段 -> 再提交 update”执行，避免只传局部字段造成数据丢失
- 如果上传资源明确归属于某个团队或项目，建议同时传 `--team-id`、`--project-id`，必要时补充 `--scene`
- 如果希望上传后直接进入素材管理，必须显式传 `--source material`；CLI 会自动补 `name`、`size`、`mimeType`

项目初始化与菜单骨架示例：

```bash
node ./bin/dimens-cli.js project create --team-id TEAM1 --name 客户管理系统 --description 客户全生命周期管理 --project-type spreadsheet
node ./bin/dimens-cli.js upload file --path ./project-cover.svg --team-id TEAM1 --scene project-cover
node ./bin/dimens-cli.js sheet create --project-id PROJ1 --name 客户中心 --type folder
node ./bin/dimens-cli.js sheet create --project-id PROJ1 --name 项目文档 --type folder
node ./bin/dimens-cli.js sheet create --project-id PROJ1 --name 经营分析 --type folder
node ./bin/dimens-cli.js sheet create --project-id PROJ1 --name 客户表 --folder-id FOLDER_SHEET_ID
node ./bin/dimens-cli.js sheet create --project-id PROJ1 --name 联系人表 --folder-id FOLDER_SHEET_ID
node ./bin/dimens-cli.js doc create --team-id TEAM1 --project-id PROJ1 --title 项目说明文档 --parent-id FOLDER_SHEET_ID --format richtext
node ./bin/dimens-cli.js report create --project-id PROJ1 --name 销售漏斗
node ./bin/dimens-cli.js sheet tree --project-id PROJ1
```

说明：

- 如果项目需要封面表达，建议先用 SVG 工具生成一张符合项目主题、具备动态动画效果的 SVG，再上传拿 URL
- 项目封面更新建议按“先上传，再把返回的 URL 传给 `project update --cover-image`”执行
- 项目菜单骨架默认至少包含：目录、表格、文档、报表
- `sheet create --type folder` 用于创建目录节点
- `sheet create --folder-id <folderSheetId>` 用于把资源挂到目录下
- 文档当前挂目录走 `doc create --parent-id <folderSheetId>`
- 创建完成后用 `sheet tree` 回查目录和资源归位
- 如果要查看命令级帮助，直接执行 `node ./bin/dimens-cli.js help sheet`、`node ./bin/dimens-cli.js help sheet create`、`node ./bin/dimens-cli.js help sheet tree`

文档主链示例：

```bash
node ./bin/dimens-cli.js doc create --team-id TEAM1 --project-id PROJ1 --title 在线文档 --content '<p>Hello TipTap</p>' --format richtext
node ./bin/dimens-cli.js doc info --team-id TEAM1 --project-id PROJ1 --document-id DOC_1
node ./bin/dimens-cli.js doc update --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --content '<p>更新后的内容</p>' --version 1
node ./bin/dimens-cli.js doc attach-file --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --file ./release.pdf --title 发布清单.pdf
node ./bin/dimens-cli.js doc append-image --team-id TEAM1 --project-id PROJ1 --document-id DOC_1 --file ./cover.png --alt 封面图
node ./bin/dimens-cli.js doc versions --team-id TEAM1 --project-id PROJ1 --document-id DOC_1
```

说明：

- `doc attach-file` 和 `doc append-image` 本质上也是“先上传，再把返回的 URL 写入文档内容”
- 如果只是想拿上传后的 URL 给其他业务命令复用，可以直接先执行 `upload file`
- `doc update` 只负责提交文档内容和版本，不直接接收本地文件

分页读取行数据：

```bash
node ./bin/dimens-cli.js row page \
  --team-id TEAM1 \
  --project-id PROJ1 \
  --sheet-id SHEET1 \
  --page 1 \
  --size 20
```

说明：

- `row page` 是当前唯一保留的行读取命令
- 不再使用 `row list`

## 权限命令快速示例

权限链路建议按“角色 -> 项目/表权限 -> 行级策略 -> 单行 ACL”理解和使用，这也与仓库内权限设计文档的分层保持一致。

查看角色与权限帮助：

```bash
node ./bin/dimens-cli.js help role
node ./bin/dimens-cli.js help permission
node ./bin/dimens-cli.js help row-policy
node ./bin/dimens-cli.js help row-acl
```

创建角色：

```bash
node ./bin/dimens-cli.js role create \
  --project-id PROJ1 \
  --name 班主任 \
  --description 班级管理角色 \
  --can-manage-sheets false \
  --can-edit-schema false \
  --can-edit-data true
```

给用户分配角色：

```bash
node ./bin/dimens-cli.js role assign-user \
  --project-id PROJ1 \
  --role-id role_teacher \
  --user-id 1001 \
  --sheet-id sh_class
```

创建表级权限：

```bash
node ./bin/dimens-cli.js permission create \
  --project-id PROJ1 \
  --role-id role_teacher \
  --sheet-id sh_class \
  --data-access private_rw \
  --can-read true \
  --can-write true \
  --column-visibility '{"fld_name":true,"fld_class_no":true}' \
  --column-readonly '{"fld_score":true}'
```

设置文档 / 报表 / 页面等资源权限：

```bash
node ./bin/dimens-cli.js permission set-resource \
  --project-id PROJ1 \
  --role-id role_teacher \
  --resource-id doc_xxx \
  --resource-type document \
  --visible true \
  --editable false
```

创建“仅查看自己”行策略：

```bash
node ./bin/dimens-cli.js row-policy create \
  --project-id PROJ1 \
  --sheet-id sh_class \
  --role-id role_teacher \
  --name 仅查看自己 \
  --effect allow \
  --actions view,edit \
  --conditions '[{"columnId":"createdBy","operator":"equals","value":"{{currentUser}}"}]' \
  --priority 10 \
  --match-type and \
  --active true
```

启用 / 禁用行策略：

```bash
node ./bin/dimens-cli.js row-policy enable \
  --project-id PROJ1 \
  --id policy_xxx \
  --sheet-id sh_class

node ./bin/dimens-cli.js row-policy disable \
  --project-id PROJ1 \
  --id policy_xxx \
  --sheet-id sh_class
```

给指定行追加 ACL：

```bash
node ./bin/dimens-cli.js row-acl grant-user \
  --sheet-id sh_class \
  --row-id row_xxx \
  --user-id 1001 \
  --permission view \
  --can-transfer false

node ./bin/dimens-cli.js row-acl grant-role \
  --sheet-id sh_class \
  --row-id row_xxx \
  --role-id role_teacher \
  --permission edit

node ./bin/dimens-cli.js row-acl revoke-role \
  --sheet-id sh_class \
  --row-id row_xxx \
  --role-id role_teacher
```

说明：

- `permission` 负责项目 / 表 / 资源层权限配置
- `row-policy` 负责批量规则化的行级授权
- `row-acl` 负责对单行做额外精细授权
- 如果文档结论与服务端实现出现差异，应优先对照 `.trae/已开发文档/权限机制架构设计图.md` 与 `.trae/已开发文档/权限流程图.md` 再确认

调用 AI chat completions：

```bash
node ./bin/dimens-cli.js ai chat-completions \
  --team-id TEAM1 \
  --message "你好" \
  --model default
```

执行前显示相关 Skill 提示：

```bash
node ./bin/dimens-cli.js ai chat-completions \
  --team-id TEAM1 \
  --message "你好" \
  --model default \
  --show-skill
```

执行前只看 Skill 映射：

```bash
node ./bin/dimens-cli.js ai chat-completions \
  --team-id TEAM1 \
  --message "你好" \
  --show-skill mapping
```

执行前查看完整 Skill 文档：

```bash
node ./bin/dimens-cli.js ai chat-completions \
  --team-id TEAM1 \
  --message "你好" \
  --show-skill full
```

如果是系统建设类需求，也可以直接先看系统级总控 Skill：

```bash
node ./bin/dimens-cli.js skill info dimens-system-orchestrator
node ./bin/dimens-cli.js skill show dimens-system-orchestrator --references
```

## SDK 快速开始

当前 SDK 不是旧版 `callTool()` 风格，而是“统一客户端 + 分域 SDK”结构。

```ts
import { createSDK } from '@bintel/dimens-cli';

const sdk = createSDK({
  baseUrl: 'https://dimens.bintelai.com',
});

const loginResult = await sdk.auth.exchangeTokenByApiKey({
  apiKey: 'ak_xxx',
  apiSecret: 'sk_xxx',
});

const businessSdk = createSDK({
  baseUrl: 'https://dimens.bintelai.com',
  token: loginResult.data.token,
  refreshToken: loginResult.data.refreshToken,
  teamId: 'TEAM1',
  projectId: 'PROJ1',
});

const projects = await businessSdk.project.page('TEAM1', {
  page: 1,
  size: 20,
});

const chat = await businessSdk.ai.completions('TEAM1', {
  model: 'default',
  messages: [
    {
      role: 'user',
      content: '你好',
    },
  ],
});

console.log(projects.data);
console.log(chat.data);
```

## 仓库内一键 Smoke Test

仓库开发场景已经提供现成脚本：

```bash
cd /Users/lixiang/data/代码库管理/binterAi/多维项目开发/dimens-cli

export DIMENS_API_KEY="ak_xxx"
export DIMENS_API_SECRET="sk_xxx"
export DIMENS_TEAM_ID="TEAM1"

bash ./scripts/smoke-test.sh
```

可选变量：

```bash
export DIMENS_BASE_URL="https://dimens.bintelai.com"
export DIMENS_SMOKE_MESSAGE="CLI smoke test"
export DIMENS_SMOKE_MODEL="default"
```

注意：

- `scripts/smoke-test.sh` 是仓库内联调脚本
- 如果你是通过 npm 安装包到其他项目中使用，请直接调用 `dimens-cli` 命令或 SDK，不依赖这份仓库脚本

## 文档索引

- [业务控制说明](./文档/业务控制说明.md)
- [命令结构设计](./文档/命令结构设计.md)
- [SDK使用指南](./文档/SDK使用指南.md)
- [cli 命令使用指南](./文档/cli%20命令使用指南.md)
- [skills/README.md](./skills/README.md)
- [实现计划](./文档/实现计划.md)

## 开发命令

```bash
pnpm build
pnpm test
pnpm typecheck
pnpm publish:check
```

`pnpm publish:check` 会顺序执行：

- 测试
- 类型检查
- 构建
- `npm pack --dry-run`

常用版本命令：

```bash
pnpm release:patch
pnpm release:minor
pnpm release:major
```

更完整的发布步骤见：

- [发布检查清单](./文档/发布检查清单.md)
- [版本发布流程](./文档/版本发布流程.md)

## 项目结构

```text
dimens-cli/
├── bin/                # CLI 入口
├── dist/               # 构建产物
├── scripts/            # 辅助脚本
├── src/
│   ├── cli.ts          # CLI 分发入口
│   ├── commands/       # 命令层
│   ├── core/           # 上下文、配置、输出
│   └── sdk/            # SDK 封装
├── tests/              # 测试
└── 文档/               # 设计与使用文档
```

## 说明

- 当前 `api key` 只保留“换 token”这一条主链，不扩展 API Key 管理命令
- 当前 `ai` 只保留 `chat-completions` 一条使用接口
- 当前 `skill` 命令组用于本地查看、推荐和展示 Skills，不调用后端接口
- 旧版 `callTool/getTools/getSkills` 文档口径已废弃，不再适用于当前实现
# dimens-cli
