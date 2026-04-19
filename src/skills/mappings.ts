import type { Skill } from '../types';

type SkillMapping = Pick<
  Skill,
  'commandGroups' | 'commands' | 'sdkModules' | 'toolNames' | 'tags' | 'version'
>;

export const SKILL_MAPPINGS: Record<string, SkillMapping> = {
  'dimens-system-orchestrator': {
    version: '1.0.0',
    tags: ['system', 'orchestrator', 'planner', 'routing', 'builder'],
    commandGroups: ['skill'],
    commands: ['skill recommend', 'skill info', 'skill show'],
    sdkModules: [],
    toolNames: ['system_decomposition', 'skill_routing'],
  },
  'dimens-workflow': {
    version: '1.0.0',
    tags: ['workflow', 'flow', 'ai', 'project', 'team'],
    commandGroups: ['ai'],
    commands: ['ai chat-completions'],
    sdkModules: ['FlowChatSDK', 'DimensSDK.ai'],
    toolNames: ['flow_list', 'project_workflow_binding_list', 'flow_run_invoke', 'flow_run_debug', 'flow_config_get'],
  },
  'dimens-key-auth': {
    version: '1.0.0',
    tags: ['auth', 'api-key', 'token', 'login', 'security'],
    commandGroups: ['auth'],
    commands: ['auth api-key-login', 'auth login', 'auth refresh', 'auth status', 'auth profile'],
    sdkModules: ['AuthSDK', 'DimensSDK.auth'],
    toolNames: ['api_key_create', 'api_key_list', 'api_key_status', 'api_key_delete', 'api_key_reset_secret', 'api_key_log_page'],
  },
  'dimens-team': {
    version: '1.0.0',
    tags: ['team', 'project', 'tenant', 'member', 'context'],
    commandGroups: ['auth', 'project'],
    commands: ['auth use-team', 'auth use-project', 'project list', 'project info', 'project create', 'project update', 'project trash', 'project restore'],
    sdkModules: ['ProjectSDK', 'DimensSDK.project'],
    toolNames: ['team_info', 'team_user_list', 'project_list', 'project_info', 'project_create', 'project_update', 'project_trash', 'project_restore'],
  },
  'dimens-table': {
    version: '1.0.0',
    tags: ['table', 'sheet', 'row', 'column', 'view'],
    commandGroups: ['sheet', 'column', 'view', 'row'],
    commands: ['sheet list', 'sheet tree', 'sheet create', 'sheet info', 'sheet update', 'sheet delete', 'column list', 'column create', 'column update', 'column delete', 'view list', 'view create', 'row page', 'row info', 'row create', 'row update', 'row delete', 'row set-cell'],
    sdkModules: ['SheetSDK', 'ColumnSDK', 'ViewSDK', 'RowSDK', 'DimensSDK.sheet', 'DimensSDK.column', 'DimensSDK.view', 'DimensSDK.row'],
    toolNames: ['sheet_list', 'sheet_info', 'column_list', 'column_create', 'view_list', 'view_create', 'row_page', 'row_update', 'row_set_cell'],
  },
  'dimens-permission': {
    version: '1.0.0',
    tags: ['permission', 'acl', 'row-policy', 'yjs', 'security'],
    commandGroups: [],
    commands: [],
    sdkModules: [],
    toolNames: ['project_authority_check', 'permission_resolve', 'column_permission_resolve', 'row_policy_check', 'yjs_permission_snapshot'],
  },
  'dimens-report': {
    version: '1.0.0',
    tags: ['report', 'chart', 'dashboard', 'parameter', 'query'],
    commandGroups: [],
    commands: [],
    sdkModules: [],
    toolNames: ['report_list', 'report_info', 'report_widget_list', 'report_parameter_list', 'report_query', 'report_export'],
  },
};

export function getSkillMapping(name: string): SkillMapping | undefined {
  return SKILL_MAPPINGS[name];
}
