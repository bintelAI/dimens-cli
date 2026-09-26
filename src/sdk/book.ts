import type { APIResponse } from './client';
import { DimensClient } from './client';

export interface BookProject {
  id: string;
  name: string;
  projectType?: string;
  [key: string]: unknown;
}

export interface BookProjectPageQuery {
  page?: number;
  size?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export interface BookProjectPageResult {
  list: BookProject[];
  total?: number;
  page?: number;
  size?: number;
  [key: string]: unknown;
}

export interface BookProjectCreatePayload {
  name: string;
  description?: string;
  projectType?: string;
}

export interface BookProjectUpdatePayload {
  name?: string;
  description?: string;
  projectType?: string;
}

export interface BookPage {
  id?: string;
  documentId?: string;
  projectId?: string;
  projectType?: string;
  title?: string;
  draftSnapshot?: Record<string, unknown>;
  draftRevision?: number;
  [key: string]: unknown;
}

export interface BookPageCreatePayload {
  projectType?: string;
  title?: string;
  draftSnapshot?: Record<string, unknown>;
  snapshotSchemaVersion?: string;
}

export interface BookPageUpdatePayload {
  documentId: string;
  baseRevision: number;
  draftSnapshot: Record<string, unknown>;
  title?: string;
  createRevision?: boolean;
  revisionType?: string;
  changeSummary?: string;
}

export interface BookPageListResult {
  document: BookPage | null;
  pages: unknown[];
  scenes: Record<string, unknown>;
}

export class BookProjectSDK {
  constructor(private readonly client: DimensClient) {}

  page(teamId: string, query: BookProjectPageQuery = {}): Promise<APIResponse<BookProjectPageResult>> {
    return this.client.get<BookProjectPageResult>(`/app/e-magazine/${teamId}/project/page`, query);
  }

  info(teamId: string, projectId: string): Promise<APIResponse<BookProject>> {
    return this.client.get<BookProject>(`/app/e-magazine/${teamId}/project/${projectId}`);
  }

  create(teamId: string, payload: BookProjectCreatePayload): Promise<APIResponse<BookProject>> {
    return this.client.post<BookProject>(`/app/e-magazine/${teamId}/project/create`, payload);
  }

  update(teamId: string, projectId: string, payload: BookProjectUpdatePayload): Promise<APIResponse<BookProject>> {
    return this.client.post<BookProject>(`/app/e-magazine/${teamId}/project/${projectId}/update`, payload);
  }
}

export class BookPageSDK {
  private readonly projectSdk: BookProjectSDK;

  constructor(private readonly client: DimensClient) {
    this.projectSdk = new BookProjectSDK(client);
  }

  async info(teamId: string, projectId: string, projectType?: string): Promise<APIResponse<BookPage | null>> {
    const resolvedProjectType = await this.resolveProjectType(teamId, projectId, projectType);
    return this.client.get<BookPage | null>(`/app/e-magazine/${teamId}/${projectId}/document/info`, {
      projectType: resolvedProjectType,
    });
  }

  async list(teamId: string, projectId: string, projectType?: string): Promise<APIResponse<BookPageListResult>> {
    const result = await this.info(teamId, projectId, projectType);
    const snapshot = result.data?.draftSnapshot;
    return {
      ...result,
      data: {
        document: result.data,
        pages: Array.isArray(snapshot?.pages) ? snapshot.pages : [],
        scenes: snapshot?.scenes && typeof snapshot.scenes === 'object' && !Array.isArray(snapshot.scenes)
          ? snapshot.scenes as Record<string, unknown>
          : {},
      },
    };
  }

  async create(teamId: string, projectId: string, payload: BookPageCreatePayload): Promise<APIResponse<BookPage>> {
    const projectType = await this.resolveProjectType(teamId, projectId, payload.projectType);
    return this.client.post<BookPage>(`/app/e-magazine/${teamId}/${projectId}/document/create`, {
      ...payload,
      projectType,
    });
  }

  update(teamId: string, projectId: string, payload: BookPageUpdatePayload): Promise<APIResponse<BookPage>> {
    return this.client.post<BookPage>(`/app/e-magazine/${teamId}/${projectId}/document/save`, payload);
  }

  delete(teamId: string, projectId: string, documentId: string): Promise<APIResponse<boolean>> {
    return this.client.post<boolean>(`/app/e-magazine/${teamId}/${projectId}/document/archive`, { documentId });
  }

  private async resolveProjectType(teamId: string, projectId: string, projectType?: string): Promise<string> {
    if (projectType) return projectType;
    const project = await this.projectSdk.info(teamId, projectId);
    if (typeof project.data.projectType !== 'string' || !project.data.projectType) {
      throw new Error('项目详情缺少 projectType，无法读取电子书页面');
    }
    return project.data.projectType;
  }
}

export class BookSDK {
  readonly project: BookProjectSDK;
  readonly page: BookPageSDK;

  constructor(client: DimensClient) {
    this.project = new BookProjectSDK(client);
    this.page = new BookPageSDK(client);
  }
}
