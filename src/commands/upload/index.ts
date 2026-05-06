import { createCommand, createCommandGroup, registerGroupCommand } from '../registry';
import { UploadSDK } from '../../sdk/upload';
import { createClient, getContext, parseFlags, printError, printSuccess } from '../utils';
import { buildUploadOptions, toUploadArgs } from './shared';

export function registerUploadCommands(): void {
  createCommandGroup('upload', '文件上传');

  registerGroupCommand(
    'upload',
    createCommand(
      'file',
      '上传本地文件到应用上传接口',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const filePath = flags.file || flags.path || args[0];
          if (!filePath) {
            throw new Error('缺少文件路径，请传入 --file 或 --path');
          }

          const sdk = new UploadSDK(createClient(context));
          const uploadArgs = toUploadArgs(buildUploadOptions(flags));
          const result = await sdk.uploadFile(filePath, uploadArgs);
          printSuccess(context, '文件上传成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage:
          'upload file --file <path> [--key <objectKey>] [--type <type>] [--biz-type <bizType>] [--scene <scene>] [--source <source>] [--classify-id <classifyId>] [--team-id <teamId>] [--project-id <projectId>]',
        examples: [
          'dimens-cli upload file --file ./demo.txt',
          'dimens-cli upload file --file ./demo.txt --key docs/demo.txt',
          'dimens-cli upload file --file ./logo.svg --team-id TEAM1 --source material',
        ],
      }
    )
  );

  registerGroupCommand(
    'upload',
    createCommand(
      'mode',
      '获取当前上传模式',
      async args => {
        const flags = parseFlags(args);
        const context = getContext(flags);

        try {
          const sdk = new UploadSDK(createClient(context));
          const result = await sdk.getMode();
          printSuccess(context, '上传模式获取成功', result.data);
        } catch (error) {
          printError(context, error);
        }
      },
      {
        usage: 'upload mode [--app-url <url>] [--base-url <url>] [--token <token>]',
        examples: ['dimens-cli upload mode'],
      }
    )
  );
}
