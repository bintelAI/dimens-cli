/**
 * 版本命令
 */

import type { CLICommand } from '../types';
import { registerGroupCommand } from './registry';
import { getVersion } from '../core/version';

const versionCommand: CLICommand = {
  name: 'version',
  description: '显示版本信息',
  usage: 'version',
  aliases: ['v', '-v', '--version'],
  handler: async () => {
    console.log(`Dimens CLI v${getVersion()}`);
  },
};

export function registerVersionCommand(): void {
  registerGroupCommand('system', versionCommand);
}
