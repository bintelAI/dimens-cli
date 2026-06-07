/**
 * 版本信息
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

let _version: string | undefined;

export function getVersion(): string {
  if (_version) return _version;

  try {
    const __filename = fileURLToPath(import.meta.url);
    const packageJson = readNearestPackageJson(dirname(__filename));
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

function readNearestPackageJson(startDir: string): { version: string } {
  let currentDir = startDir;

  for (let depth = 0; depth < 6; depth += 1) {
    const packageJsonPath = join(currentDir, 'package.json');
    try {
      return JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string };
    } catch {
      const parentDir = dirname(currentDir);
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }
  }

  throw new Error('package.json not found');
}
