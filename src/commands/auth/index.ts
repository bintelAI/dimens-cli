import { registerGroupCommand, createCommandGroup, createCommand } from '../registry';
import { AuthSDK } from '../../sdk/auth';
import {
  createClient,
  getContext,
  mergeProfile,
  printError,
  printSuccess,
  saveProfile,
  parseFlags,
  getProfile,
} from '../utils';

export function registerAuthCommands(): void {
  createCommandGroup('auth', '认证与上下文');

  registerGroupCommand(
    'auth',
    createCommand(
      'login',
      '登录并保存本地凭证',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const username = flags.username;
          const password = flags.password;

          if (!username || !password) {
            throw new Error('缺少登录参数，请传入 --username 和 --password');
          }

          const sdk = new AuthSDK(createClient(context));
          const result = await sdk.login({ username, password });
          const nextProfile = mergeProfile(
            context.baseUrl
              ? {
                  baseUrl: context.baseUrl,
                  token: result.data.token,
                }
              : {
                  token: result.data.token,
                }
          );

          if (result.data.refreshToken) {
            nextProfile.refreshToken = result.data.refreshToken;
          }

          await saveProfile(nextProfile);

          printSuccess(context, '登录成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'auth login --username <name> --password <password> [--base-url <url>]',
        examples: [
          'dimens-cli auth login --username admin --password 123456',
          'dimens-cli auth login --base-url https://custom.example.com --username admin --password 123456',
        ],
      }
    )
  );

  registerGroupCommand(
    'auth',
    createCommand(
      'api-key-login',
      '使用 apiKey 和 apiSecret 登录并换取 token',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const apiKey = flags['api-key'];
          const apiSecret = flags['api-secret'];

          if (!apiKey || !apiSecret) {
            throw new Error('缺少登录参数，请传入 --api-key 和 --api-secret');
          }

          const sdk = new AuthSDK(createClient(context));
          const result = await sdk.loginByApiKey({ apiKey, apiSecret });
          const nextProfile = mergeProfile(
            context.baseUrl
              ? {
                  baseUrl: context.baseUrl,
                  token: result.data.token,
                }
              : {
                  token: result.data.token,
                }
          );

          if (result.data.refreshToken) {
            nextProfile.refreshToken = result.data.refreshToken;
          }

          await saveProfile(nextProfile);
          printSuccess(context, 'API Key 登录成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'auth api-key-login --api-key <apiKey> --api-secret <apiSecret> [--base-url <url>]',
        examples: [
          'dimens-cli auth api-key-login --api-key ak_xxx --api-secret sk_xxx',
          'dimens-cli auth api-key-login --base-url https://custom.example.com --api-key ak_xxx --api-secret sk_xxx',
        ],
      }
    )
  );

  registerGroupCommand(
    'auth',
    createCommand(
      'refresh',
      '刷新 token',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const sdk = new AuthSDK(createClient(context));
          const result = await sdk.refreshToken();
          const nextProfile = mergeProfile({
            token: result.data.token,
          });

          const refreshToken = result.data.refreshToken ?? context.refreshToken;
          if (refreshToken) {
            nextProfile.refreshToken = refreshToken;
          }

          await saveProfile(nextProfile);

          printSuccess(context, '刷新成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'auth refresh [--base-url <url>]',
      }
    )
  );

  registerGroupCommand(
    'auth',
    createCommand(
      'status',
      '查看当前上下文',
      async args => {
        const context = getContext(parseFlags(args));
        printSuccess(context, '当前上下文', context);
      },
      {
        usage: 'auth status',
      }
    )
  );

  registerGroupCommand(
    'auth',
    createCommand(
      'use-team',
      '设置默认团队',
      async args => {
        const context = getContext();
        try {
          const teamId = args[0];
          if (!teamId) {
            throw new Error('缺少 teamId，请传入 auth use-team <teamId>');
          }
          await saveProfile(
            mergeProfile({
              teamId,
            })
          );
          printSuccess(context, '默认团队已更新', { teamId });
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'auth use-team <teamId>',
      }
    )
  );

  registerGroupCommand(
    'auth',
    createCommand(
      'use-project',
      '设置默认项目',
      async args => {
        const context = getContext();
        try {
          const projectId = args[0];
          if (!projectId) {
            throw new Error('缺少 projectId，请传入 auth use-project <projectId>');
          }
          await saveProfile(
            mergeProfile({
              projectId,
            })
          );
          printSuccess(context, '默认项目已更新', { projectId });
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'auth use-project <projectId>',
      }
    )
  );

  registerGroupCommand(
    'auth',
    createCommand(
      'profile',
      '查看本地 profile',
      async args => {
        const context = getContext(parseFlags(args));
        printSuccess(context, '本地 Profile', getProfile());
      },
      {
        usage: 'auth profile',
      }
    )
  );
}
