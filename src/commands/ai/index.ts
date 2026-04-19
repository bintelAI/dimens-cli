import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { FlowChatSDK } from '../../sdk/flow-chat';
import {
  createClient,
  getContext,
  parseFlags,
  printError,
  printSuccess,
  requireTeamId,
} from '../utils';

export function registerAICommands(): void {
  createCommandGroup('ai', 'AI 对话');

  registerGroupCommand(
    'ai',
    createCommand(
      'chat-completions',
      '调用工作流 OpenAI 兼容聊天接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const teamId = requireTeamId(context, flags);
          const message = flags.message;
          if (!message) {
            throw new Error('缺少 message，请传入 --message');
          }

          const sdk = new FlowChatSDK(createClient(context));
          const payload: {
            model: string;
            messages: Array<{ role: 'user'; content: string }>;
            stream: boolean;
            user?: string;
          } = {
            model: flags.model || 'default',
            messages: [
              {
                role: 'user',
                content: message,
              },
            ],
            stream: flags.stream === 'true',
          };
          if (flags.user) {
            payload.user = flags.user;
          }

          const result = await sdk.completions(teamId, payload);
          printSuccess(context, 'AI 对话调用成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'ai chat-completions --message <text> [--model default] [--team-id <teamId>]',
        examples: [
          'dimens-cli ai chat-completions --message "你好" --model default',
        ],
      }
    )
  );
}
