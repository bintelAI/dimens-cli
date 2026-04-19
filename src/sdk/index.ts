import { AuthSDK } from './auth';
import { DimensClient, type APIResponse, type DimensClientOptions } from './client';
import { ColumnSDK } from './column';
import { FlowChatSDK } from './flow-chat';
import { ProjectSDK } from './project';
import { RowSDK } from './row';
import { SheetSDK } from './sheet';

export type { APIResponse, DimensClientOptions };

export interface SDKConfig extends DimensClientOptions {}

export class DimensSDK {
  readonly client: DimensClient;
  readonly auth: AuthSDK;
  readonly project: ProjectSDK;
  readonly sheet: SheetSDK;
  readonly column: ColumnSDK;
  readonly row: RowSDK;
  readonly ai: FlowChatSDK;

  constructor(config: SDKConfig) {
    this.client = new DimensClient(config);
    this.auth = new AuthSDK(this.client);
    this.project = new ProjectSDK(this.client);
    this.sheet = new SheetSDK(this.client);
    this.column = new ColumnSDK(this.client);
    this.row = new RowSDK(this.client);
    this.ai = new FlowChatSDK(this.client);
  }
}

export function createSDK(config: SDKConfig): DimensSDK {
  return new DimensSDK(config);
}

export { DimensClient } from './client';
export { AuthSDK } from './auth';
export { ProjectSDK } from './project';
export { SheetSDK } from './sheet';
export { ColumnSDK } from './column';
export { RowSDK } from './row';
export { FlowChatSDK } from './flow-chat';
