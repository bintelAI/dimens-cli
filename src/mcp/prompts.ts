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
