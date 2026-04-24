import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { ReportSDK } from '../../sdk/report';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireProjectId,
} from '../utils';

const SUPPORTED_WIDGET_TYPES = new Set([
  'line',
  'bar',
  'area',
  'pie',
  'composed',
  'radar',
  'scatter',
  'funnel',
  'radialBar',
  'treemap',
  'stat',
  'heatmap',
  'timeline',
  'table',
  'wordCloud',
]);

function parseJsonFlag(flagValue: string, errorMessage: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(flagValue);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(errorMessage);
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error(errorMessage);
  }
}

function ensureWidgetType(type: string): void {
  if (!SUPPORTED_WIDGET_TYPES.has(type)) {
    throw new Error(`不支持的报表组件类型: ${type}`);
  }
}

function validateSheetDataSource(
  dataSource: Record<string, unknown>,
  dataMapping?: Record<string, unknown>
): void {
  if (dataSource.mode !== 'sheet') {
    return;
  }

  const sheet =
    dataSource.sheet && typeof dataSource.sheet === 'object' && !Array.isArray(dataSource.sheet)
      ? (dataSource.sheet as Record<string, unknown>)
      : null;
  if (!sheet) {
    throw new Error('sheet 数据源缺少 sheet 配置');
  }
  if (!sheet.sheetId || typeof sheet.sheetId !== 'string') {
    throw new Error('sheet 数据源缺少 sheetId');
  }
  if (!Array.isArray(sheet.columns) || sheet.columns.length === 0) {
    throw new Error('sheet 数据源缺少 columns');
  }
  if (!Array.isArray(sheet.fieldIds) || sheet.fieldIds.length === 0) {
    throw new Error('sheet 数据源缺少 fieldIds');
  }
  const recommendedMapping =
    sheet.recommendedMapping &&
    typeof sheet.recommendedMapping === 'object' &&
    !Array.isArray(sheet.recommendedMapping)
      ? (sheet.recommendedMapping as Record<string, unknown>)
      : null;
  if (!recommendedMapping?.nameKey || !recommendedMapping?.valueKey) {
    throw new Error('sheet 数据源缺少 recommendedMapping.nameKey/valueKey');
  }
  const previewMapping =
    sheet.previewMapping &&
    typeof sheet.previewMapping === 'object' &&
    !Array.isArray(sheet.previewMapping)
      ? (sheet.previewMapping as Record<string, unknown>)
      : null;
  if (!previewMapping?.nameKey || !previewMapping?.valueKey) {
    throw new Error('sheet 数据源缺少 previewMapping.nameKey/valueKey');
  }
  if (!dataMapping?.nameKey || !dataMapping?.valueKey) {
    throw new Error('sheet 报表组件缺少 dataMapping.nameKey/valueKey');
  }
}

function validateWidgetPayload(
  type: string,
  dataSource: Record<string, unknown>,
  dataMapping?: Record<string, unknown>
): void {
  ensureWidgetType(type);
  validateSheetDataSource(dataSource, dataMapping);
  if (type === 'scatter' && !dataMapping?.yKey) {
    throw new Error('scatter 组件缺少 dataMapping.yKey');
  }
}

function createDashboardId(): string {
  const cryptoLike = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoLike?.randomUUID) {
    return cryptoLike.randomUUID();
  }
  return `dashboard_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function registerReportCommands(): void {
  createCommandGroup('report', '报表管理');

  registerGroupCommand(
    'report',
    createCommand(
      'list',
      '获取报表列表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const sdk = new ReportSDK(createClient(context));
          const payload: {
            keyword?: string;
            type?: number | string;
            status?: number;
            page: number;
            size: number;
          } = {
            page: Number(flags.page || '1'),
            size: Number(flags.size || '20'),
          };
          if (flags.keyword) {
            payload.keyword = flags.keyword;
          }
          if (flags.type) {
            payload.type = Number.isNaN(Number(flags.type)) ? flags.type : Number(flags.type);
          }
          if (flags.status) {
            payload.status = Number(flags.status);
          }
          const result = await sdk.list(projectId, payload);
          printSuccess(context, '报表列表获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report list [--project-id <projectId>] [--page 1] [--size 20] [--keyword <keyword>] [--type <type>] [--status <status>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'sort',
      '调整报表排序',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          if (!flags['target-index']) {
            throw new Error('缺少目标位置，请传入 --target-index');
          }
          const targetIndex = Number(flags['target-index']);
          if (Number.isNaN(targetIndex)) {
            throw new Error('target-index 必须是数字');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.sort(projectId, { reportId, targetIndex });
          printSuccess(context, '报表排序更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report sort --report-id <reportId> --target-index <number> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'move',
      '移动报表到其他项目',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const targetProjectId = flags['target-project-id'];
          if (!targetProjectId) {
            throw new Error('缺少目标项目 ID，请传入 --target-project-id');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.move(projectId, { reportId, targetProjectId });
          printSuccess(context, '报表移动成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report move --report-id <reportId> --target-project-id <projectId> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'query-widget',
      '执行单个报表组件查询',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const widgetId = flags['widget-id'] || args[0];
          if (!widgetId) {
            throw new Error('缺少组件 ID，请传入 --widget-id');
          }
          const payload: {
            reportId: string;
            widgetId: string;
            parameterValues?: Record<string, unknown>;
            dataSource?: Record<string, unknown>;
            dataMapping?: Record<string, unknown>;
          } = {
            reportId,
            widgetId,
          };
          if (flags.params) {
            payload.parameterValues = parseJsonFlag(flags.params, 'params 必须是合法 JSON 对象');
          }
          if (flags['data-source']) {
            payload.dataSource = parseJsonFlag(
              flags['data-source'],
              'data-source 必须是合法 JSON 对象'
            );
          }
          if (flags['data-mapping']) {
            payload.dataMapping = parseJsonFlag(
              flags['data-mapping'],
              'data-mapping 必须是合法 JSON 对象'
            );
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.queryWidget(projectId, payload);
          printSuccess(context, '报表组件查询成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report query-widget --report-id <reportId> --widget-id <widgetId> [--params <json>] [--data-source <json>] [--data-mapping <json>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'preview',
      '预览报表数据源结果',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          if (!flags['data-source']) {
            throw new Error('缺少数据源，请传入 --data-source');
          }
          const payload: {
            dataSource: Record<string, unknown>;
            dataMapping?: Record<string, unknown>;
            parameterValues?: Record<string, unknown>;
          } = {
            dataSource: parseJsonFlag(
              flags['data-source'],
              'data-source 必须是合法 JSON 对象'
            ),
          };
          if (flags['data-mapping']) {
            payload.dataMapping = parseJsonFlag(
              flags['data-mapping'],
              'data-mapping 必须是合法 JSON 对象'
            );
          }
          if (flags.params) {
            payload.parameterValues = parseJsonFlag(flags.params, 'params 必须是合法 JSON 对象');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.preview(projectId, payload);
          printSuccess(context, '报表数据预览成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report preview --data-source <json> [--data-mapping <json>] [--params <json>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'update',
      '更新报表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const payload: {
            reportId: string;
            name?: string;
            description?: string;
            type?: number | string;
          } = {
            reportId,
          };
          if (flags.name) {
            payload.name = flags.name;
          }
          if (flags.description) {
            payload.description = flags.description;
          }
          if (flags.type) {
            payload.type = Number.isNaN(Number(flags.type)) ? flags.type : Number(flags.type);
          }
          const sdk = new ReportSDK(createClient(context));
          const currentReportResult = await sdk.info(projectId, reportId);
          const currentReport = currentReportResult.data;
          const mergedPayload: {
            reportId: string;
            name?: string;
            description?: string;
            type?: number | string;
          } = { reportId };
          if (currentReport && typeof currentReport.name === 'string') {
            mergedPayload.name = currentReport.name;
          }
          if (currentReport && typeof currentReport.description === 'string') {
            mergedPayload.description = currentReport.description;
          }
          if (currentReport && currentReport.type !== undefined) {
            mergedPayload.type = currentReport.type;
          }
          if (payload.name) {
            mergedPayload.name = payload.name;
          }
          if (payload.description) {
            mergedPayload.description = payload.description;
          }
          if (payload.type !== undefined) {
            mergedPayload.type = payload.type;
          }
          const result = await sdk.update(projectId, mergedPayload);
          printSuccess(context, '报表更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report update --report-id <reportId> [--name <name>] [--description <description>] [--type <type>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'copy',
      '复制报表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const payload: {
            reportId: string;
            name?: string;
          } = {
            reportId,
          };
          if (flags.name) {
            payload.name = flags.name;
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.copy(projectId, payload);
          printSuccess(context, '报表复制成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report copy --report-id <reportId> [--name <name>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'validate',
      '校验报表配置',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          if (!flags.config) {
            throw new Error('缺少报表配置，请传入 --config');
          }
          const config = parseJsonFlag(flags.config, 'config 必须是合法 JSON 对象');
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.validate(projectId, { config });
          printSuccess(context, '报表配置校验成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report validate --config <json> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'archive',
      '归档报表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.archive(projectId, { reportId });
          printSuccess(context, '报表归档成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report archive --report-id <reportId> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'publish',
      '发布或取消公开报表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const isPublicRaw = flags['is-public'];
          if (typeof isPublicRaw === 'undefined') {
            throw new Error('缺少公开状态，请传入 --is-public true|false');
          }
          const isPublic =
            isPublicRaw === 'true' || isPublicRaw === '1' || isPublicRaw === 'yes' ? 1 : 0;
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.publish(projectId, { reportId, isPublic });
          printSuccess(context, '报表发布状态更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report publish --report-id <reportId> --is-public <true|false> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'delete',
      '删除报表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.delete(projectId, { reportId });
          printSuccess(context, '报表删除成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report delete --report-id <reportId> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'info',
      '获取报表详情',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'] || args[0];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.info(projectId, reportId);
          printSuccess(context, '报表详情获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report info --report-id <reportId> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'create',
      '创建报表',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const name = flags.name;
          if (!name) {
            throw new Error('缺少报表名称，请传入 --name');
          }
          const sdk = new ReportSDK(createClient(context));
          const payload: {
            name: string;
            description?: string;
            dashboardId: string;
            createdAt: number;
          } = {
            name,
            dashboardId: createDashboardId(),
            createdAt: Date.now(),
          };
          if (flags.description) {
            payload.description = flags.description;
          }
          const result = await sdk.createProjectReport(projectId, payload);
          printSuccess(context, '报表创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report create --name <name> [--description <description>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'query',
      '执行报表查询',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const sdk = new ReportSDK(createClient(context));
          const payload: {
            reportId: string;
            parameterValues?: Record<string, unknown>;
            widgetIds?: string[];
          } = {
            reportId,
          };
          if (flags.params) {
            payload.parameterValues = JSON.parse(flags.params);
          }
          if (flags['widget-ids']) {
            payload.widgetIds = flags['widget-ids']
              .split(',')
              .map(item => item.trim())
              .filter(Boolean);
          }
          const result = await sdk.query(projectId, payload);
          printSuccess(context, '报表查询成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report query --report-id <reportId> [--params <json>] [--widget-ids <id1,id2>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'widget-add',
      '新增报表组件',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const type = flags.type;
          if (!type) {
            throw new Error('缺少组件类型，请传入 --type');
          }
          if (!flags['data-source']) {
            throw new Error('缺少组件数据源，请传入 --data-source');
          }
          const sdk = new ReportSDK(createClient(context));
          const dataSource = parseJsonFlag(flags['data-source'], 'data-source 必须是合法 JSON 对象');
          const dataMapping = flags['data-mapping']
            ? parseJsonFlag(flags['data-mapping'], 'data-mapping 必须是合法 JSON 对象')
            : undefined;
          validateWidgetPayload(type, dataSource, dataMapping);
          const payload: {
            reportId: string;
            type: string;
            title?: string;
            description?: string;
            dataSource: Record<string, unknown>;
            layout?: Record<string, unknown>;
            dataMapping?: Record<string, unknown>;
            chartConfig?: Record<string, unknown>;
            orderNum?: number;
          } = {
            reportId,
            type,
            dataSource,
          };
          if (flags.title) {
            payload.title = flags.title;
          }
          if (flags.description) {
            payload.description = flags.description;
          }
          if (flags.layout) {
            payload.layout = parseJsonFlag(flags.layout, 'layout 必须是合法 JSON 对象');
          }
          if (dataMapping) {
            payload.dataMapping = dataMapping;
          }
          if (flags['chart-config']) {
            payload.chartConfig = parseJsonFlag(
              flags['chart-config'],
              'chart-config 必须是合法 JSON 对象'
            );
          }
          if (flags['order-num']) {
            payload.orderNum = Number(flags['order-num']);
          }
          const result = await sdk.addWidget(projectId, payload);
          printSuccess(context, '报表组件创建成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report widget-add --report-id <reportId> --type <type> --data-source <json> [--title <title>] [--description <description>] [--layout <json>] [--data-mapping <json>] [--chart-config <json>] [--order-num <number>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'widget-update',
      '更新报表组件',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const widgetId = flags['widget-id'] || args[0];
          if (!widgetId) {
            throw new Error('缺少组件 ID，请传入 --widget-id');
          }
          const payload: {
            widgetId: string;
            type?: string;
            title?: string;
            description?: string;
            dataSource?: Record<string, unknown>;
            layout?: Record<string, unknown>;
            dataMapping?: Record<string, unknown>;
            chartConfig?: Record<string, unknown>;
            orderNum?: number;
          } = { widgetId };
          if (flags.type) {
            ensureWidgetType(flags.type);
            payload.type = flags.type;
          }
          if (flags.title) {
            payload.title = flags.title;
          }
          if (flags.description) {
            payload.description = flags.description;
          }
          if (flags['data-source']) {
            payload.dataSource = parseJsonFlag(
              flags['data-source'],
              'data-source 必须是合法 JSON 对象'
            );
          }
          if (flags.layout) {
            payload.layout = parseJsonFlag(flags.layout, 'layout 必须是合法 JSON 对象');
          }
          if (flags['data-mapping']) {
            payload.dataMapping = parseJsonFlag(
              flags['data-mapping'],
              'data-mapping 必须是合法 JSON 对象'
            );
          }
          if (flags['chart-config']) {
            payload.chartConfig = parseJsonFlag(
              flags['chart-config'],
              'chart-config 必须是合法 JSON 对象'
            );
          }
          if (flags['order-num']) {
            payload.orderNum = Number(flags['order-num']);
          }
          if (payload.type && payload.dataSource) {
            validateWidgetPayload(payload.type, payload.dataSource, payload.dataMapping);
          } else if (payload.dataSource) {
            validateSheetDataSource(payload.dataSource, payload.dataMapping);
          }
          const sdk = new ReportSDK(createClient(context));
          const currentReportResult = await sdk.info(projectId, flags['report-id'] || 'REPORT_1');
          const currentReport = currentReportResult.data;
          const currentWidget = Array.isArray(currentReport?.widgets)
            ? currentReport.widgets.find(
                widget =>
                  Boolean(widget) &&
                  typeof widget === 'object' &&
                  (widget as Record<string, unknown>).widgetId === widgetId
              )
            : undefined;
          const mergedPayload = {
            ...(currentWidget && typeof currentWidget === 'object'
              ? (currentWidget as Record<string, unknown>)
              : {}),
            ...payload,
            widgetId,
          };
          const result = await sdk.updateWidget(projectId, mergedPayload);
          printSuccess(context, '报表组件更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report widget-update --widget-id <widgetId> [--type <type>] [--title <title>] [--description <description>] [--data-source <json>] [--layout <json>] [--data-mapping <json>] [--chart-config <json>] [--order-num <number>] [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'widget-delete',
      '删除报表组件',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const widgetId = flags['widget-id'] || args[0];
          if (!widgetId) {
            throw new Error('缺少组件 ID，请传入 --widget-id');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.deleteWidget(projectId, { widgetId });
          printSuccess(context, '报表组件删除成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report widget-delete --widget-id <widgetId> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'widget-batch',
      '批量覆盖报表组件',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          if (!flags.widgets) {
            throw new Error('缺少组件数组，请传入 --widgets');
          }
          const parsedWidgets = JSON.parse(flags.widgets);
          if (!Array.isArray(parsedWidgets) || parsedWidgets.length === 0) {
            throw new Error('widgets 必须是非空 JSON 数组');
          }
          const widgets = parsedWidgets.map(widget => {
            if (!widget || typeof widget !== 'object' || Array.isArray(widget)) {
              throw new Error('widgets 数组中的每一项都必须是对象');
            }
            const widgetRecord = widget as Record<string, unknown>;
            const type = widgetRecord.type;
            const dataSource = widgetRecord.dataSource;
            const dataMapping =
              widgetRecord.dataMapping &&
              typeof widgetRecord.dataMapping === 'object' &&
              !Array.isArray(widgetRecord.dataMapping)
                ? (widgetRecord.dataMapping as Record<string, unknown>)
                : undefined;
            if (!type || typeof type !== 'string') {
              throw new Error('widgets 数组中的组件缺少 type');
            }
            if (!dataSource || typeof dataSource !== 'object' || Array.isArray(dataSource)) {
              throw new Error('widgets 数组中的组件缺少 dataSource');
            }
            validateWidgetPayload(
              type,
              dataSource as Record<string, unknown>,
              dataMapping
            );
            return widgetRecord;
          });
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.batchWidgets(projectId, { reportId, widgets });
          printSuccess(context, '报表组件批量更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report widget-batch --report-id <reportId> --widgets <json-array> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'report',
    createCommand(
      'widget-sort',
      '调整报表组件排序',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const projectId = requireProjectId(context, flags);
          const reportId = flags['report-id'];
          if (!reportId) {
            throw new Error('缺少报表 ID，请传入 --report-id');
          }
          const widgetId = flags['widget-id'] || args[0];
          if (!widgetId) {
            throw new Error('缺少组件 ID，请传入 --widget-id');
          }
          if (!flags['target-order']) {
            throw new Error('缺少目标排序，请传入 --target-order');
          }
          const targetOrder = Number(flags['target-order']);
          if (Number.isNaN(targetOrder)) {
            throw new Error('target-order 必须是数字');
          }
          const sdk = new ReportSDK(createClient(context));
          const result = await sdk.sortWidget(projectId, {
            reportId,
            widgetId,
            targetOrder,
          });
          printSuccess(context, '报表组件排序更新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'report widget-sort --report-id <reportId> --widget-id <widgetId> --target-order <number> [--project-id <projectId>] [--app-url <url>]',
      }
    )
  );
}
