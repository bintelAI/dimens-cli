import { AuthSDK } from './auth';
import { CanvasSDK } from './canvas';
import { DimensClient, type APIResponse, type DimensClientOptions } from './client';
import { ColumnSDK } from './column';
import { DocumentSDK } from './document';
import { FlowChatSDK } from './flow-chat';
import { PermissionSDK } from './permission';
import { ProjectSDK } from './project';
import { ReportSDK } from './report';
import { RichTextFieldSDK } from './richtext-field';
import { RowSDK } from './row';
import { RowAclSDK } from './row-acl';
import { RowPolicySDK } from './row-policy';
import { RoleSDK } from './role';
import { SheetSDK } from './sheet';
import { TeamSDK } from './team';
import { UploadSDK } from './upload';
import { UserSDK } from './user';
import { ViewSDK } from './view';

export type { APIResponse, DimensClientOptions };

export interface SDKConfig extends DimensClientOptions {}

export class DimensSDK {
  readonly client: DimensClient;
  readonly auth: AuthSDK;
  readonly project: ProjectSDK;
  readonly report: ReportSDK;
  readonly canvas: CanvasSDK;
  readonly role: RoleSDK;
  readonly permission: PermissionSDK;
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
  readonly upload: UploadSDK;
  readonly richtextField: RichTextFieldSDK;

  constructor(config: SDKConfig) {
    this.client = new DimensClient(config);
    this.auth = new AuthSDK(this.client);
    this.project = new ProjectSDK(this.client);
    this.report = new ReportSDK(this.client);
    this.canvas = new CanvasSDK(this.client);
    this.role = new RoleSDK(this.client);
    this.permission = new PermissionSDK(this.client);
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
    this.upload = new UploadSDK(this.client);
    this.richtextField = new RichTextFieldSDK(this.client);
  }
}

export function createSDK(config: SDKConfig): DimensSDK {
  return new DimensSDK(config);
}

export { DimensClient } from './client';
export { AuthSDK } from './auth';
export { CanvasSDK } from './canvas';
export { ProjectSDK } from './project';
export { ReportSDK } from './report';
export { RichTextFieldSDK } from './richtext-field';
export { RoleSDK } from './role';
export { PermissionSDK } from './permission';
export { SheetSDK } from './sheet';
export { TeamSDK } from './team';
export { ColumnSDK } from './column';
export { DocumentSDK } from './document';
export { ViewSDK } from './view';
export { RowSDK } from './row';
export { RowPolicySDK } from './row-policy';
export { RowAclSDK } from './row-acl';
export { FlowChatSDK } from './flow-chat';
export { UploadSDK } from './upload';
export { UserSDK } from './user';
