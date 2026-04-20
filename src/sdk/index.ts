import { AuthSDK } from './auth';
import { DimensClient, type APIResponse, type DimensClientOptions } from './client';
import { ColumnSDK } from './column';
import { DocumentSDK } from './document';
import { FlowChatSDK } from './flow-chat';
import { PermissionSDK } from './permission';
import { ProjectSDK } from './project';
import { ReportSDK } from './report';
import { RowSDK } from './row';
import { RowAclSDK } from './row-acl';
import { RowPolicySDK } from './row-policy';
import { RoleSDK } from './role';
import { SheetSDK } from './sheet';
import { ViewSDK } from './view';

export type { APIResponse, DimensClientOptions };

export interface SDKConfig extends DimensClientOptions {}

export class DimensSDK {
  readonly client: DimensClient;
  readonly auth: AuthSDK;
  readonly project: ProjectSDK;
  readonly report: ReportSDK;
  readonly role: RoleSDK;
  readonly permission: PermissionSDK;
  readonly sheet: SheetSDK;
  readonly column: ColumnSDK;
  readonly document: DocumentSDK;
  readonly view: ViewSDK;
  readonly row: RowSDK;
  readonly rowPolicy: RowPolicySDK;
  readonly rowAcl: RowAclSDK;
  readonly ai: FlowChatSDK;

  constructor(config: SDKConfig) {
    this.client = new DimensClient(config);
    this.auth = new AuthSDK(this.client);
    this.project = new ProjectSDK(this.client);
    this.report = new ReportSDK(this.client);
    this.role = new RoleSDK(this.client);
    this.permission = new PermissionSDK(this.client);
    this.sheet = new SheetSDK(this.client);
    this.column = new ColumnSDK(this.client);
    this.document = new DocumentSDK(this.client);
    this.view = new ViewSDK(this.client);
    this.row = new RowSDK(this.client);
    this.rowPolicy = new RowPolicySDK(this.client);
    this.rowAcl = new RowAclSDK(this.client);
    this.ai = new FlowChatSDK(this.client);
  }
}

export function createSDK(config: SDKConfig): DimensSDK {
  return new DimensSDK(config);
}

export { DimensClient } from './client';
export { AuthSDK } from './auth';
export { ProjectSDK } from './project';
export { ReportSDK } from './report';
export { RoleSDK } from './role';
export { PermissionSDK } from './permission';
export { SheetSDK } from './sheet';
export { ColumnSDK } from './column';
export { DocumentSDK } from './document';
export { ViewSDK } from './view';
export { RowSDK } from './row';
export { RowPolicySDK } from './row-policy';
export { RowAclSDK } from './row-acl';
export { FlowChatSDK } from './flow-chat';
