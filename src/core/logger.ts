/**
 * 日志工具
 */

import type { LogLevel, LogEntry } from '../types';

class Logger {
  private context: string;
  private level: LogLevel = 'info';

  constructor(context: string) {
    this.context = context;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = this.context ? `[${this.context}]` : '';
    return `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
    };
    if (context !== undefined) {
      entry.context = context;
    }

    const formatted = this.formatMessage(entry);
    
    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'debug':
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}

export const logger = createLogger('dimens-cli');
