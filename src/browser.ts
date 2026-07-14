import { AuthSDK } from './sdk/auth';
import { CanvasSDK } from './sdk/canvas';
import { DimensClient, type DimensClientOptions } from './sdk/client';
import { ColumnSDK } from './sdk/column';
import { DocumentSDK } from './sdk/document';
import { FlowChatSDK } from './sdk/flow-chat';
import { PermissionSDK } from './sdk/permission';
import { PluginPublicSDK } from './sdk/plugin-public';
import { ProjectSDK } from './sdk/project';
import { ReportSDK } from './sdk/report';
import { RichTextFieldSDK } from './sdk/richtext-field';
import { RoleSDK } from './sdk/role';
import { RowSDK } from './sdk/row';
import { RowAclSDK } from './sdk/row-acl';
import { RowPolicySDK } from './sdk/row-policy';
import { SheetSDK } from './sdk/sheet';
import { TeamSDK } from './sdk/team';
import { UserSDK } from './sdk/user';
import { ViewSDK } from './sdk/view';
import { WorkflowPublicSDK } from './sdk/workflow-public';

export type SDKConfig = DimensClientOptions;

export class DimensSDK {
  readonly client: DimensClient;
  readonly auth: AuthSDK;
  readonly project: ProjectSDK;
  readonly report: ReportSDK;
  readonly canvas: CanvasSDK;
  readonly role: RoleSDK;
  readonly permission: PermissionSDK;
  readonly pluginPublic: PluginPublicSDK;
  readonly sheet: SheetSDK;
  readonly team: TeamSDK;
  readonly user: UserSDK;
  readonly column: ColumnSDK;
  readonly document: DocumentSDK;
  readonly view: ViewSDK;
  readonly row: RowSDK;
  readonly rowPolicy: RowPolicySDK;
  readonly rowAcl: RowAclSDK;
  readonly ai: FlowChatSDK;
  readonly richtextField: RichTextFieldSDK;
  readonly workflowPublic: WorkflowPublicSDK;

  constructor(config: SDKConfig) {
    this.client = new DimensClient(config);
    this.auth = new AuthSDK(this.client);
    this.project = new ProjectSDK(this.client);
    this.report = new ReportSDK(this.client);
    this.canvas = new CanvasSDK(this.client);
    this.role = new RoleSDK(this.client);
    this.permission = new PermissionSDK(this.client);
    this.pluginPublic = new PluginPublicSDK(this.client);
    this.sheet = new SheetSDK(this.client);
    this.team = new TeamSDK(this.client);
    this.user = new UserSDK(this.client);
    this.column = new ColumnSDK(this.client);
    this.document = new DocumentSDK(this.client);
    this.view = new ViewSDK(this.client);
    this.row = new RowSDK(this.client);
    this.rowPolicy = new RowPolicySDK(this.client);
    this.rowAcl = new RowAclSDK(this.client);
    this.ai = new FlowChatSDK(this.client);
    this.richtextField = new RichTextFieldSDK(this.client);
    this.workflowPublic = new WorkflowPublicSDK(this.client);
  }
}

export function createSDK(config: SDKConfig): DimensSDK {
  return new DimensSDK(config);
}

export { DimensClient, DimensRequestError } from './sdk/client';
export type { APIResponse, DimensClientOptions } from './sdk/client';
export type { ProjectInfo, ProjectPagePayload, ProjectPageResult } from './sdk/project';
export type { TeamInfo, TeamSummary } from './sdk/team';
export type { UserInfo } from './sdk/user';
