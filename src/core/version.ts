/**
 * 版本信息
 */

import packageJson from '../../package.json';

export function getVersion(): string {
  return packageJson.version;
}

export const version = getVersion();

export function getUserAgent(): string {
  return `DimensCLI/${version} (Node.js/${process.version})`;
}
