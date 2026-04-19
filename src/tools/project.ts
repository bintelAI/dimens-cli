/**
 * 项目管理工具
 */

import type { Tool } from '../types';
import { registerTool } from './registry';

const projectListTool: Tool = {
  name: 'project_list',
  description: '获取项目列表',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: '项目状态筛选',
        enum: ['active', 'archived', 'all'],
        default: 'active',
      },
      limit: {
        type: 'number',
        description: '返回数量限制',
        default: 20,
      },
    },
  },
  handler: async () => {
    return {
      success: true,
      data: {
        projects: [],
        total: 0,
      },
      message: '项目列表获取成功',
    };
  },
};

const projectCreateTool: Tool = {
  name: 'project_create',
  description: '创建新项目',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '项目名称',
      },
      description: {
        type: 'string',
        description: '项目描述',
      },
      template: {
        type: 'string',
        description: '项目模板',
        enum: ['web', 'mobile', 'api', 'cli'],
      },
    },
    required: ['name'],
  },
  handler: async (params) => {
    const { name, description } = params as {
      name?: unknown;
      description?: unknown;
    };
    return {
      success: true,
      data: {
        id: 'proj_' + Date.now(),
        name,
        description,
        createdAt: new Date().toISOString(),
      },
      message: '项目创建成功',
    };
  },
};

const projectInfoTool: Tool = {
  name: 'project_info',
  description: '获取项目详细信息',
  parameters: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: '项目ID',
      },
    },
    required: ['projectId'],
  },
  handler: async (params) => {
    const { projectId } = params as { projectId?: unknown };
    return {
      success: true,
      data: {
        id: projectId,
        name: '示例项目',
        description: '这是一个示例项目',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      message: '项目信息获取成功',
    };
  },
};

export function registerProjectTools(): void {
  registerTool(projectListTool);
  registerTool(projectCreateTool);
  registerTool(projectInfoTool);
}
