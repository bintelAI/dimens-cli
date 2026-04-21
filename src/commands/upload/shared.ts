import type { UploadFileOptions } from '../../sdk/upload';

export function buildUploadOptions(flags: Record<string, string>): UploadFileOptions {
  const options: UploadFileOptions = {};

  if (flags.key) {
    options.key = flags.key;
  }
  if (flags.type) {
    options.type = flags.type;
  }
  if (flags['biz-type']) {
    options.bizType = flags['biz-type'];
  }
  if (flags.scene) {
    options.scene = flags.scene;
  }
  if (flags['team-id']) {
    options.teamId = flags['team-id'];
  }
  if (flags['project-id']) {
    options.projectId = flags['project-id'];
  }

  return options;
}

export function toUploadArgs(
  options: UploadFileOptions
): string | UploadFileOptions | undefined {
  const optionKeys = Object.keys(options);

  if (optionKeys.length === 0) {
    return undefined;
  }
  if (optionKeys.length === 1 && options.key) {
    return options.key;
  }

  return options;
}
