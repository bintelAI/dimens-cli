import { z } from 'zod';
import type {
  ProjectReportCreatePayload,
  ReportPreviewPayload,
  ReportQueryPayload,
  ReportWidgetPayload,
} from '../../sdk/report';
import { asObject, contextSchema, createSimpleTool, stringArg, writeAnnotations } from './common';
import { requireMcpProjectId } from '../context';
import type { McpToolDefinition, McpToolFactoryContext } from './types';

function projectIdFrom(toolContext: McpToolFactoryContext, args: Record<string, unknown>) {
  const context = toolContext.getContext(args);
  return {
    context,
    projectId: requireMcpProjectId(context, { projectId: stringArg(args.projectId) }),
  };
}

export function createReportTools(toolContext: McpToolFactoryContext): McpToolDefinition[] {
  return [
    createSimpleTool({
      name: 'dimens_report_create',
      title: '创建项目报表',
      description: '在项目菜单中创建报表资源。',
      inputSchema: {
        ...contextSchema,
        name: z.string(),
        description: z.string().optional(),
        dashboardId: z.string().optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const name = stringArg(args.name);
        if (!name) throw new Error('缺少 name，请传入报表名称');
        const payload: ProjectReportCreatePayload = { name };
        const description = stringArg(args.description);
        if (description) payload.description = description;
        const dashboardId = stringArg(args.dashboardId);
        if (dashboardId) payload.dashboardId = dashboardId;
        const result = await toolContext.createSDK(context).report.createProjectReport(projectId, payload);
        return { message: '报表创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_report_preview',
      title: '预览报表数据源',
      description: '预览报表数据源和映射结果。',
      inputSchema: {
        ...contextSchema,
        dataSource: z.record(z.unknown()),
        dataMapping: z.record(z.unknown()).optional(),
        parameterValues: z.record(z.unknown()).optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const payload: ReportPreviewPayload = {
          dataSource: asObject(args.dataSource, 'dataSource'),
        };
        if (args.dataMapping !== undefined) payload.dataMapping = asObject(args.dataMapping, 'dataMapping');
        if (args.parameterValues !== undefined) payload.parameterValues = asObject(args.parameterValues, 'parameterValues');
        const result = await toolContext.createSDK(context).report.preview(projectId, payload);
        return { message: '报表预览成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_report_widget_add',
      title: '新增报表组件',
      description: '给报表新增图表组件。',
      inputSchema: {
        ...contextSchema,
        reportId: z.string(),
        type: z.string(),
        title: z.string().optional(),
        dataSource: z.record(z.unknown()),
        dataMapping: z.record(z.unknown()).optional(),
        chartConfig: z.record(z.unknown()).optional(),
        layout: z.record(z.unknown()).optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const reportId = stringArg(args.reportId);
        const type = stringArg(args.type);
        if (!reportId || !type) throw new Error('缺少 reportId 或 type');
        const payload: ReportWidgetPayload = {
          reportId,
          type,
          dataSource: asObject(args.dataSource, 'dataSource'),
        };
        const title = stringArg(args.title);
        if (title) payload.title = title;
        if (args.dataMapping !== undefined) payload.dataMapping = asObject(args.dataMapping, 'dataMapping');
        if (args.chartConfig !== undefined) payload.chartConfig = asObject(args.chartConfig, 'chartConfig');
        if (args.layout !== undefined) payload.layout = asObject(args.layout, 'layout');
        const result = await toolContext.createSDK(context).report.addWidget(projectId, payload);
        return { message: '报表组件创建成功', data: result.data };
      },
    }),
    createSimpleTool({
      name: 'dimens_report_query',
      title: '查询报表',
      description: '查询报表整体或指定组件数据。',
      inputSchema: {
        ...contextSchema,
        reportId: z.string(),
        widgetIds: z.array(z.string()).optional(),
        parameterValues: z.record(z.unknown()).optional(),
      },
      annotations: writeAnnotations,
      async run(args) {
        const { context, projectId } = projectIdFrom(toolContext, args);
        const reportId = stringArg(args.reportId);
        if (!reportId) throw new Error('缺少 reportId');
        const payload: ReportQueryPayload = { reportId };
        if (Array.isArray(args.widgetIds)) payload.widgetIds = args.widgetIds.filter((item): item is string => typeof item === 'string');
        if (args.parameterValues !== undefined) payload.parameterValues = asObject(args.parameterValues, 'parameterValues');
        const result = await toolContext.createSDK(context).report.query(projectId, payload);
        return { message: '报表查询成功', data: result.data };
      },
    }),
  ];
}
