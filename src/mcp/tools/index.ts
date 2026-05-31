export { createAuthTools } from './auth';
export { createCanvasTools } from './canvas';
export { createColumnTools } from './column';
export { createContextTools } from './context';
export { createDocumentTools } from './document';
export { createPermissionTools } from './permission';
export { createProjectTools } from './project';
export { createReportTools } from './report';
export { createRoleTools } from './role';
export { createRowAclTools } from './row-acl';
export { createRowPolicyTools } from './row-policy';
export { createRowTools } from './row';
export { createSheetTools } from './sheet';
export { createTeamTools } from './team';
export { createUploadTools } from './upload';
export { createUserTools } from './user';
export { createViewTools } from './view';

import type { McpToolDefinition, McpToolFactoryContext } from './types';
import { createAuthTools } from './auth';
import { createCanvasTools } from './canvas';
import { createColumnTools } from './column';
import { createContextTools } from './context';
import { createDocumentTools } from './document';
import { createPermissionTools } from './permission';
import { createProjectTools } from './project';
import { createReportTools } from './report';
import { createRoleTools } from './role';
import { createRowAclTools } from './row-acl';
import { createRowPolicyTools } from './row-policy';
import { createRowTools } from './row';
import { createSheetTools } from './sheet';
import { createTeamTools } from './team';
import { createUploadTools } from './upload';
import { createUserTools } from './user';
import { createViewTools } from './view';

export type { McpToolDefinition, McpToolFactoryContext } from './types';

export function createAllMcpTools(context: McpToolFactoryContext): McpToolDefinition[] {
  return [
    ...createAuthTools(context),
    ...createContextTools(context),
    ...createProjectTools(context),
    ...createSheetTools(context),
    ...createColumnTools(context),
    ...createViewTools(context),
    ...createRowTools(context),
    ...createDocumentTools(context),
    ...createUploadTools(context),
    ...createReportTools(context),
    ...createRoleTools(context),
    ...createPermissionTools(context),
    ...createTeamTools(context),
    ...createUserTools(context),
    ...createCanvasTools(context),
    ...createRowPolicyTools(context),
    ...createRowAclTools(context),
  ];
}