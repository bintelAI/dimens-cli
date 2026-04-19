/**
 * 配置管理
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { logger } from './logger';
import type { CLIProfile } from '../types';

interface ConfigData {
  version: string;
  profile: CLIProfile;
  skills: Record<string, unknown>;
  preferences: Record<string, unknown>;
}

const DEFAULT_CONFIG: ConfigData = {
  version: '1.0.0',
  profile: {},
  skills: {},
  preferences: {},
};

class ConfigManager {
  private configPath: string;
  private config: ConfigData;

  constructor() {
    this.configPath = join(homedir(), '.dimens-cli', 'config.json');
    this.config = DEFAULT_CONFIG;
  }

  async load(): Promise<void> {
    try {
      const data = await readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(data) as Partial<ConfigData>;
      this.config = {
        ...DEFAULT_CONFIG,
        ...parsed,
        profile: {
          ...DEFAULT_CONFIG.profile,
          ...(parsed.profile || {}),
        },
        skills: parsed.skills || {},
        preferences: parsed.preferences || {},
      };
      logger.debug('配置加载成功', { path: this.configPath });
    } catch (error) {
      logger.debug('配置文件不存在，使用默认配置');
      this.config = {
        ...DEFAULT_CONFIG,
        profile: { ...DEFAULT_CONFIG.profile },
      };
    }
  }

  async save(): Promise<void> {
    try {
      const { mkdir } = await import('fs/promises');
      await mkdir(join(homedir(), '.dimens-cli'), { recursive: true });
      await writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      logger.debug('配置保存成功', { path: this.configPath });
    } catch (error) {
      logger.error('配置保存失败', { error: String(error) });
      throw error;
    }
  }

  get<K extends keyof ConfigData>(key: K): ConfigData[K] {
    return this.config[key];
  }

  set<K extends keyof ConfigData>(key: K, value: ConfigData[K]): void {
    this.config[key] = value;
  }

  getAll(): ConfigData {
    return {
      ...this.config,
      profile: { ...this.config.profile },
      skills: { ...this.config.skills },
      preferences: { ...this.config.preferences },
    };
  }
}

export const config = new ConfigManager();
