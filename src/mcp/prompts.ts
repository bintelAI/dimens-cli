import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerDimensPrompts(server: Pick<McpServer, 'registerPrompt'>): void {
  server.registerPrompt(
    'dimens_design_table',
    {
      title: '维表建模',
      description: '根据业务需求输出维表、字段、视图和初始化数据设计。',
      argsSchema: {
        requirement: z.string(),
      },
    },
    async ({ requirement }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              '请基于维表智联能力进行多维表建模。',
              '输出项目资源、表结构、字段类型、视图、权限注意点和初始化数据建议。',
              '创建工作表和字段必须输出 customId 后缀；最终 ID 由后端按 projectId_suffix 生成，字段后缀仅在当前 sheetId 内唯一；不要让请求回退到后端随机 ID。',
              '对于 select/multiSelect，先判断选项是否跨多个字段、表或流程复用；单点使用直接配置普通下拉，只有明确复用才创建项目字典。字典 code 与选项 value 必须显式提供并保持小写编码格式。',
              `业务需求：${requirement}`,
            ].join('\n'),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'dimens_create_project_workspace',
    {
      title: '项目初始化工作区',
      description: '生成创建项目工作区的 MCP 工具调用计划。',
      argsSchema: {
        projectGoal: z.string(),
      },
    },
    async ({ projectGoal }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              '请为维表智联项目初始化生成分步执行计划。',
              '优先顺序：确认上下文 -> 创建目录/表 -> 创建字段 -> 创建视图 -> 写入示例行 -> 验证结构。',
              '所有写操作前说明目标 teamId/projectId/sheetId。',
              '创建工作表和字段时必须使用 customId 后缀；不要提交最终 sheetId/fieldId，创建后分别用 sheet info/column list 回查。',
              '如果选项会被多个位置复用，使用 project-dict create 创建项目字典；Skill 可先生成可编辑的唯一编码建议，写入前必须确认。',
              `项目目标：${projectGoal}`,
            ].join('\n'),
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'dimens_import_rows',
    {
      title: '批量导入行数据',
      description: '根据数据样例生成安全批量导入计划。',
      argsSchema: {
        sheetId: z.string(),
        dataDescription: z.string(),
      },
    },
    async ({ sheetId, dataDescription }) => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: [
              '请为维表行数据批量导入生成执行计划。',
              '必须先读取表结构，确认 fieldId 映射后再调用批量写入。',
              '单批不超过 1000 行，建议默认 200 行一批。',
              `目标 sheetId：${sheetId}`,
              `数据说明：${dataDescription}`,
            ].join('\n'),
          },
        },
      ],
    })
  );
}
