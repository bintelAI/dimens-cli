/**
 * 版本信息
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

let _version: string | undefined;

export function getVersion(): string {
  if (_version) return _version;

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    _version = packageJson.version;
  } catch {
    _version = '1.0.0';
  }

  return _version ?? '1.0.0';
}

export const version = getVersion();

export function getUserAgent(): string {
  return `DimensCLI/${version} (Node.js/${process.version})`;
}
