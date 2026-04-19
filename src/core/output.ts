import type { OutputMode } from '../types';

export function formatSuccess(
  message: string,
  data: unknown,
  mode: OutputMode
): string {
  if (mode === 'json') {
    return JSON.stringify({ success: true, message, data }, null, 2);
  }
  if (mode === 'raw') {
    return [message, typeof data === 'string' ? data : JSON.stringify(data)].join(
      '\n'
    );
  }
  return [message, JSON.stringify(data, null, 2)].join('\n');
}

export function formatError(
  message: string,
  mode: OutputMode,
  options?: { relatedSkills?: string[] }
): string {
  const relatedSkills = options?.relatedSkills ?? [];

  if (mode === 'json') {
    return JSON.stringify(
      {
        success: false,
        message,
        relatedSkills,
      },
      null,
      2
    );
  }

  if (relatedSkills.length === 0) {
    return message;
  }

  return [
    message,
    '',
    '相关 Skill:',
    ...relatedSkills.map(skill => `- ${skill}`),
  ].join('\n');
}
