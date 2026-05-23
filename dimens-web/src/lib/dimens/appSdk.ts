import type { ResolvedRuntimeContext } from '@/types/micro-module';
import { createDimensClient } from './client';
import { getToken } from './auth/authService';
import type { DimensAuthState } from './auth/types';
import { createAiResource } from './resources/ai';
import { createDocumentResource } from './resources/document';
import { createProjectResource } from './resources/project';
import { createReportResource } from './resources/report';
import { createRowResource } from './resources/row';
import { createSheetResource } from './resources/sheet';
import { withDimensRetry } from './retry';

export interface DimensAppSdkOptions {
  baseUrl: string;
  token?: string;
  refreshToken?: string;
  teamId: string;
  projectId: string;
}

export function createDimensAppSdk(options: DimensAppSdkOptions) {
  const client = createDimensClient({
    baseUrl: options.baseUrl,
    token: options.token,
    refreshToken: options.refreshToken,
  });

  return {
    client,
    project: createProjectResource(client, options.teamId),
    sheet: createSheetResource(client, options.teamId, options.projectId),
    row: createRowResource(client, options.teamId, options.projectId),
    document: createDocumentResource(client, options.teamId, options.projectId),
    report: createReportResource(client, options.projectId),
    ai: createAiResource(client, options.teamId),
  };
}

export type DimensAppSdk = ReturnType<typeof createDimensAppSdk>;

export function createRetryableDimensAppSdk(context: ResolvedRuntimeContext, auth: DimensAuthState) {
  const createSdk = (nextAuth: DimensAuthState) =>
    createDimensAppSdk({
      baseUrl: context.baseUrl,
      token: nextAuth.token || context.token,
      refreshToken: nextAuth.refreshToken || context.refreshToken,
      teamId: context.teamId,
      projectId: context.projectId,
    });

  const run = <T>(runner: (sdk: DimensAppSdk) => Promise<T>) =>
    withDimensRetry(context, auth, nextAuth => runner(createSdk(nextAuth)));

  return {
    client: createSdk(auth).client,
    project: {
      list: (...args: Parameters<DimensAppSdk['project']['list']>) => run(sdk => sdk.project.list(...args)),
      info: (...args: Parameters<DimensAppSdk['project']['info']>) => run(sdk => sdk.project.info(...args)),
    },
    sheet: {
      list: (...args: Parameters<DimensAppSdk['sheet']['list']>) => run(sdk => sdk.sheet.list(...args)),
      tree: (...args: Parameters<DimensAppSdk['sheet']['tree']>) => run(sdk => sdk.sheet.tree(...args)),
      info: (...args: Parameters<DimensAppSdk['sheet']['info']>) => run(sdk => sdk.sheet.info(...args)),
    },
    row: {
      page: (...args: Parameters<DimensAppSdk['row']['page']>) => run(sdk => sdk.row.page(...args)),
      info: (...args: Parameters<DimensAppSdk['row']['info']>) => run(sdk => sdk.row.info(...args)),
    },
    document: {
      info: (...args: Parameters<DimensAppSdk['document']['info']>) => run(sdk => sdk.document.info(...args)),
      getBySheetId: (...args: Parameters<DimensAppSdk['document']['getBySheetId']>) =>
        run(sdk => sdk.document.getBySheetId(...args)),
    },
    report: {
      list: (...args: Parameters<DimensAppSdk['report']['list']>) => run(sdk => sdk.report.list(...args)),
      info: (...args: Parameters<DimensAppSdk['report']['info']>) => run(sdk => sdk.report.info(...args)),
    },
    ai: {
      completions: (...args: Parameters<DimensAppSdk['ai']['completions']>) =>
        run(sdk => sdk.ai.completions(...args)),
    },
  };
}

export type RetryableDimensAppSdk = ReturnType<typeof createRetryableDimensAppSdk>;

export async function createDimensAppSdkFromRuntime(context: ResolvedRuntimeContext, auth?: DimensAuthState) {
  const resolvedAuth = auth || await getToken(context);
  return createRetryableDimensAppSdk(context, resolvedAuth);
}
