/**
 * 命令层入口
 */

export {
  registerCommand,
  registerGroupCommand,
  createCommandGroup,
  getCommand,
  getGroupCommand,
  getCommandGroup,
  getAllCommands,
  getAllCommandGroups,
  clearCommands,
  createCommand,
} from './registry';
export { registerHelpCommand } from './help';
export { registerVersionCommand } from './version';

import { logger } from '../core/logger';
import { registerAICommands } from './ai/index';
import { registerAuthCommands } from './auth/index';
import { registerCanvasCommands } from './canvas/index';
import { registerColumnCommands } from './column/index';
import { registerCreateCommands } from './create/index';
import { registerDocCommands } from './doc/index';
import { registerHelpCommand } from './help';
import { registerPermissionCommands } from './permission/index';
import { registerPluginPublicCommands } from './plugin-public/index';
import { registerProjectCommands } from './project/index';
import { createCommandGroup } from './registry';
import { registerReportCommands } from './report/index';
import { registerRichTextFieldCommands } from './richtext-field/index';
import { registerRoleCommands } from './role/index';
import { registerRowCommands } from './row/index';
import { registerRowAclCommands } from './row-acl/index';
import { registerRowPolicyCommands } from './row-policy/index';
import { registerSheetCommands } from './sheet/index';
import { registerSkillCommands } from './skill/index';
import { registerSystemCommands } from './system';
import { registerTeamCommands } from './team/index';
import { registerUploadCommands } from './upload/index';
import { registerUserCommands } from './user/index';
import { registerVersionCommand } from './version';
import { registerViewCommands } from './view/index';
import { registerWorkflowPublicCommands } from './workflow-public/index';

export function registerCommands(): void {
  logger.info('开始注册所有命令...');

  createCommandGroup('system', '系统命令');
  registerHelpCommand();
  registerVersionCommand();
  registerCreateCommands();
  registerAuthCommands();
  registerUserCommands();
  registerTeamCommands();
  registerSkillCommands();
  registerSystemCommands();
  registerUploadCommands();
  registerRichTextFieldCommands();
  registerProjectCommands();
  registerDocCommands();
  registerCanvasCommands();
  registerReportCommands();
  registerRoleCommands();
  registerPermissionCommands();
  registerWorkflowPublicCommands();
  registerPluginPublicCommands();
  registerSheetCommands();
  registerColumnCommands();
  registerViewCommands();
  registerRowCommands();
  registerRowPolicyCommands();
  registerRowAclCommands();
  registerAICommands();

  logger.info('所有命令注册完成');
}
