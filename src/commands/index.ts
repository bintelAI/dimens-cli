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
import { registerHelpCommand } from './help';
import { registerVersionCommand } from './version';
import { createCommandGroup } from './registry';
import { registerAuthCommands } from './auth/index';
import { registerCanvasCommands } from './canvas/index';
import { registerColumnCommands } from './column/index';
import { registerDocCommands } from './doc/index';
import { registerProjectCommands } from './project/index';
import { registerPermissionCommands } from './permission/index';
import { registerReportCommands } from './report/index';
import { registerRoleCommands } from './role/index';
import { registerRowCommands } from './row/index';
import { registerRowAclCommands } from './row-acl/index';
import { registerRowPolicyCommands } from './row-policy/index';
import { registerSheetCommands } from './sheet/index';
import { registerSkillCommands } from './skill/index';
import { registerUploadCommands } from './upload/index';
import { registerViewCommands } from './view/index';

export function registerCommands(): void {
  logger.info('开始注册所有命令...');

  createCommandGroup('system', '系统命令');
  registerHelpCommand();
  registerVersionCommand();
  registerAuthCommands();
  registerSkillCommands();
  registerUploadCommands();
  registerProjectCommands();
  registerDocCommands();
  registerCanvasCommands();
  registerReportCommands();
  registerRoleCommands();
  registerPermissionCommands();
  registerSheetCommands();
  registerColumnCommands();
  registerViewCommands();
  registerRowCommands();
  registerRowPolicyCommands();
  registerRowAclCommands();
  registerAICommands();

  logger.info('所有命令注册完成');
}
