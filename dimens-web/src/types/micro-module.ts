import type { DimensWebAppConfig } from '@/config/appConfig';

export type MicroModuleSourceLocation =
  | 'PROJECT_MENU'
  | 'SHEET_VIEW'
  | 'ROW_BUTTON_MODAL'
  | 'CELL_BUTTON_MODAL'
  | 'VIEW_TOOLBAR_MODAL'
  | 'CUSTOM';

export interface MicroModulePermissions {
  visible: boolean;
  editable: boolean;
  canConfigure: boolean;
  canEnable?: boolean;
  canDisable?: boolean;
  canReadData?: boolean;
  canWriteData?: boolean;
}

export interface MicroModuleBaseContext {
  teamId: string;
  projectId: string;
  userId?: string | number;
  userName?: string;
  instanceId: string;
  moduleCode: string;
  moduleVersion?: string;
  sourceModuleVersion?: string;
  sourceLocation: MicroModuleSourceLocation;
  sourceId?: string;
  instanceConfig: Record<string, unknown>;
  permissions: MicroModulePermissions;
}

export interface MicroModuleMenuState {
  menuId?: string;
  routePath?: string;
  routeParams?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

export interface MicroModuleViewState {
  viewId: string;
  viewType: string;
  filters: unknown[];
  filterMatchType: 'and' | 'or';
  sortRule: unknown | null;
  groupBy: string[];
  hiddenColumnIds: string[];
  searchTerm?: string;
  selectedRowIds: string[];
  rawRows?: Array<Record<string, unknown>>;
  displayRows?: Array<Record<string, unknown>>;
  displayState?: {
    source: 'raw' | 'remoteSearch' | 'filtered' | 'sorted';
    lastUpdatedAt?: number;
  };
  remoteSearchState?: Record<string, unknown>;
}

export interface MicroModuleActionSnapshot {
  trigger: {
    type: 'button' | 'toolbar' | 'row' | 'cell' | 'column';
    id?: string;
    label?: string;
  };
  sheetId?: string;
  viewId?: string;
  rowId?: string;
  columnId?: string;
  fieldId?: string;
  recordIds?: string[];
  selectedRowIds?: string[];
  activeCell?: {
    rowId: string;
    columnId: string;
  };
  viewStateSnapshot?: MicroModuleViewState;
}

export interface RuntimeRouteProps {
  initialRoute?: string;
}

export interface DimensTokenProps {
  token?: string;
  refreshToken?: string;
}

export interface DimensWebHostProps
  extends Partial<MicroModuleBaseContext>,
    RuntimeRouteProps,
    DimensTokenProps {
  appConfig?: Partial<DimensWebAppConfig>;
  sheetId?: string;
  viewId?: string;
  rowId?: string;
  columnId?: string;
  selectedRowIds?: string[];
  viewState?: MicroModuleViewState;
  actionSnapshot?: MicroModuleActionSnapshot;
}

export interface ResolvedRuntimeContext extends MicroModuleBaseContext, RuntimeRouteProps {
  baseUrl: string;
  token?: string;
  refreshToken?: string;
  sheetId?: string;
  viewId?: string;
  rowId?: string;
  columnId?: string;
  selectedRowIds?: string[];
  source: 'host' | 'url' | 'local' | 'env' | 'mixed';
  isWujie: boolean;
}

export interface RuntimeResolution {
  context: ResolvedRuntimeContext;
  missing: Array<'baseUrl' | 'teamId' | 'projectId' | 'token'>;
}

export const DEFAULT_PERMISSIONS: MicroModulePermissions = {
  visible: true,
  editable: false,
  canConfigure: false,
  canReadData: true,
  canWriteData: false,
};
