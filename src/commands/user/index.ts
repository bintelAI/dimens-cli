import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { UserSDK } from '../../sdk/user';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
} from '../utils';

export function registerUserCommands(): void {
  createCommandGroup('user', '用户信息');

  registerGroupCommand(
    'user',
    createCommand(
      'me',
      '获取当前用户信息',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const sdk = new UserSDK(createClient(context));
          const result = await sdk.me();
          printSuccess(context, '当前用户信息获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'user me [--base-url <url>] [--token <token>]',
        examples: [
          'dimens-cli user me',
          'dimens-cli user me --base-url https://dimens.bintelai.com/api --token TOKEN',
        ],
      }
    )
  );
}
