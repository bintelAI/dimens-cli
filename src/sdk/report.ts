import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface ReportInfo {
  reportId: string;
  projectId?: string;
  name?: string;
  description?: string;
  type?: number | string;
  config?: Record<string, unknown>;
  widgets?: Array<Record<string, unknown>>;
  parameters?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface ReportListPayload {
  keyword?: string;
  type?: number | string;
  status?: number;
  page?: number;
  size?: number;
}

export interface ReportListResult {
  list: ReportInfo[];
  pagination?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ReportCreatePayload {
  name: string;
  description?: string;
  type?: number | string;
  config?: Record<string, unknown>;
  widgets?: Array<Record<string, unknown>>;
  parameters?: Array<Record<string, unknown>>;
}

export interface ReportCreateResult {
  reportId: string;
  [key: string]: unknown;
}

export interface ReportUpdatePayload {
  reportId: string;
  name?: string;
  description?: string;
  type?: number | string;
  config?: Record<string, unknown>;
  widgets?: Array<Record<string, unknown>>;
  parameters?: Array<Record<string, unknown>>;
}

export interface ReportDeletePayload {
  reportId: string;
}

export interface ReportCopyPayload {
  reportId: string;
  name?: string;
}

export interface ReportSortPayload {
  reportId: string;
  targetIndex: number;
}

export interface ReportMovePayload {
  reportId: string;
  targetProjectId: string;
}

export interface ReportPublishPayload {
  reportId: string;
  isPublic: number;
}

export interface ReportQueryPayload {
  reportId: string;
  parameterValues?: Record<string, unknown>;
  widgetIds?: string[];
}

export type ReportQueryResult = Record<string, unknown>;

export interface ReportQueryWidgetPayload {
  reportId: string;
  widgetId: string;
  parameterValues?: Record<string, unknown>;
  dataSource?: Record<string, unknown>;
  dataMapping?: Record<string, unknown>;
}

export interface ReportPreviewPayload {
  dataSource: Record<string, unknown>;
  dataMapping?: Record<string, unknown>;
  parameterValues?: Record<string, unknown>;
}

export interface ReportValidatePayload {
  config: Record<string, unknown>;
}

export interface ReportWidgetPayload {
  reportId: string;
  type: string;
  title?: string;
  description?: string;
  dataSource: Record<string, unknown>;
  layout?: Record<string, unknown>;
  dataMapping?: Record<string, unknown>;
  chartConfig?: Record<string, unknown>;
  orderNum?: number;
  parentId?: string;
  visibility?: Record<string, unknown>;
}

export interface ReportWidgetUpdatePayload {
  widgetId: string;
  type?: string;
  title?: string;
  description?: string;
  dataSource?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  dataMapping?: Record<string, unknown>;
  chartConfig?: Record<string, unknown> | null;
  orderNum?: number;
  parentId?: string;
  visibility?: Record<string, unknown>;
}

export interface ReportWidgetDeletePayload {
  widgetId: string;
}

export interface ReportWidgetBatchPayload {
  reportId: string;
  widgets: Array<Record<string, unknown>>;
}

export interface ReportWidgetSortPayload {
  reportId: string;
  widgetId: string;
  targetOrder: number;
}

export interface ReportWidgetResult {
  widgetId: string;
  [key: string]: unknown;
}

export class ReportSDK {
  constructor(private readonly client: DimensClient) {}

  list(
    projectId: string,
    payload: ReportListPayload
  ): Promise<APIResponse<ReportListResult>> {
    return this.client.post<ReportListResult>(`/app/report/${projectId}/list`, payload);
  }

  info(projectId: string, reportId: string): Promise<APIResponse<ReportInfo | null>> {
    return this.client.get<ReportInfo | null>(`/app/report/${projectId}/info`, { reportId });
  }

  create(
    projectId: string,
    payload: ReportCreatePayload
  ): Promise<APIResponse<ReportCreateResult>> {
    return this.client.post<ReportCreateResult>(`/app/report/${projectId}/add`, payload);
  }

  update(
    projectId: string,
    payload: ReportUpdatePayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/update`, payload);
  }

  copy(
    projectId: string,
    payload: ReportCopyPayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/copy`, payload);
  }

  publish(
    projectId: string,
    payload: ReportPublishPayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/publish`, payload);
  }

  delete(
    projectId: string,
    payload: ReportDeletePayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/delete`, payload);
  }

  archive(
    projectId: string,
    payload: ReportDeletePayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/archive`, payload);
  }

  sort(
    projectId: string,
    payload: ReportSortPayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/sort`, payload);
  }

  move(
    projectId: string,
    payload: ReportMovePayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/move`, payload);
  }

  query(
    projectId: string,
    payload: ReportQueryPayload
  ): Promise<APIResponse<ReportQueryResult>> {
    return this.client.post<ReportQueryResult>(`/app/report/query/${projectId}`, payload);
  }

  queryWidget(
    projectId: string,
    payload: ReportQueryWidgetPayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/report/query/${projectId}/widget`,
      payload
    );
  }

  preview(
    projectId: string,
    payload: ReportPreviewPayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/report/query/${projectId}/preview`,
      payload
    );
  }

  validate(
    projectId: string,
    payload: ReportValidatePayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(`/app/report/${projectId}/validate`, payload);
  }

  addWidget(
    projectId: string,
    payload: ReportWidgetPayload
  ): Promise<APIResponse<ReportWidgetResult>> {
    return this.client.post<ReportWidgetResult>(`/app/report/widget/${projectId}/add`, payload);
  }

  updateWidget(
    projectId: string,
    payload: ReportWidgetUpdatePayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/report/widget/${projectId}/update`,
      payload
    );
  }

  deleteWidget(
    projectId: string,
    payload: ReportWidgetDeletePayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/report/widget/${projectId}/delete`,
      payload
    );
  }

  batchWidgets(
    projectId: string,
    payload: ReportWidgetBatchPayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/report/widget/${projectId}/batch`,
      payload
    );
  }

  sortWidget(
    projectId: string,
    payload: ReportWidgetSortPayload
  ): Promise<APIResponse<Record<string, unknown>>> {
    return this.client.post<Record<string, unknown>>(
      `/app/report/widget/${projectId}/sort`,
      payload
    );
  }
}
