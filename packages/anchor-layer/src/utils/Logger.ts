import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

export interface LoggerConfig {
  level: LogLevel;
  writeToFile: boolean;
  logDir: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  colorize: boolean;
  includeTimestamp: boolean;
  includeContext: boolean;
}

export class Logger {
  private config: LoggerConfig;
  private logEntries: LogEntry[] = [];
  private currentLogFile?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      writeToFile: false,
      logDir: path.join(process.cwd(), '.anchor-enhancement', 'logs'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      colorize: true,
      includeTimestamp: true,
      includeContext: true,
      ...config
    };

    if (this.config.writeToFile) {
      this.ensureLogDirectory();
      this.initializeLogFile();
    }
  }

  public debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  public info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  public warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  public error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data
    };

    this.logEntries.push(entry);

    // Console output
    const formattedMessage = this.formatMessage(entry);
    this.writeToConsole(level, formattedMessage);

    // File output
    if (this.config.writeToFile && this.currentLogFile) {
      this.writeToFile(entry);
    }
  }

  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [];

    // Timestamp
    if (this.config.includeTimestamp) {
      const timestamp = entry.timestamp.toISOString().replace('T', ' ').replace('Z', '');
      parts.push(`[${timestamp}]`);
    }

    // Level
    const levelStr = LogLevel[entry.level].padEnd(5);
    parts.push(`[${levelStr}]`);

    // Context
    if (this.config.includeContext && entry.context) {
      parts.push(`[${entry.context}]`);
    }

    // Message
    parts.push(entry.message);

    // Data
    if (entry.data) {
      if (typeof entry.data === 'object') {
        parts.push('\n' + JSON.stringify(entry.data, null, 2));
      } else {
        parts.push(String(entry.data));
      }
    }

    return parts.join(' ');
  }

  private writeToConsole(level: LogLevel, message: string): void {
    if (!this.config.colorize) {
      console.log(message);
      return;
    }

    switch (level) {
      case LogLevel.DEBUG:
        console.log(chalk.gray(message));
        break;
      case LogLevel.INFO:
        console.log(chalk.blue(message));
        break;
      case LogLevel.WARN:
        console.log(chalk.yellow(message));
        break;
      case LogLevel.ERROR:
        console.log(chalk.red(message));
        break;
      default:
        console.log(message);
    }
  }

  private writeToFile(entry: LogEntry): void {
    if (!this.currentLogFile) return;

    const message = this.formatMessage(entry);
    const logLine = message + '\n';

    try {
      fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
      
      // Check file size and rotate if needed
      this.checkAndRotateLog();
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private initializeLogFile(): void {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    this.currentLogFile = path.join(this.config.logDir, `anchor-enhancement-${timestamp}.log`);
  }

  private checkAndRotateLog(): void {
    if (!this.currentLogFile || !fs.existsSync(this.currentLogFile)) {
      return;
    }

    const stats = fs.statSync(this.currentLogFile);
    if (stats.size > this.config.maxFileSize) {
      this.rotateLog();
    }
  }

  private rotateLog(): void {
    if (!this.currentLogFile) return;

    // Move current log to timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.currentLogFile.replace('.log', `-${timestamp}.log`);
    
    try {
      fs.renameSync(this.currentLogFile, backupPath);
      this.initializeLogFile();
      
      // Clean up old logs
      this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private cleanupOldLogs(): void {
    try {
      const files = fs.readdirSync(this.config.logDir)
        .filter(file => file.startsWith('anchor-enhancement-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.config.logDir, file),
          mtime: fs.statSync(path.join(this.config.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only maxFiles
      const filesToDelete = files.slice(this.config.maxFiles);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  public getLogEntries(count?: number): LogEntry[] {
    if (count) {
      return this.logEntries.slice(-count);
    }
    return [...this.logEntries];
  }

  public clearLogs(): void {
    this.logEntries = [];
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public getLevel(): LogLevel {
    return this.config.level;
  }

  public enableFileLogging(enabled: boolean = true): void {
    this.config.writeToFile = enabled;
    
    if (enabled && !this.currentLogFile) {
      this.ensureLogDirectory();
      this.initializeLogFile();
    }
  }

  // Create specialized loggers for different components
  public createChildLogger(context: string): Logger {
    const childConfig = { ...this.config };
    const childLogger = new Logger(childConfig);
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    (childLogger as any).log = (level: LogLevel, message: string, childContext?: string, data?: any) => {
      const fullContext = childContext ? `${context}:${childContext}` : context;
      originalLog(level, message, fullContext, data);
    };
    
    return childLogger;
  }

  // Enhanced logging methods with predefined contexts
  public logTestResult(testName: string, passed: boolean, duration: number): void {
    const message = `Test ${passed ? 'PASSED' : 'FAILED'}: ${testName} (${duration}ms)`;
    const level = passed ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, message, 'TEST', { testName, passed, duration });
  }

  public logDeployment(programId: string, network: string, success: boolean, transactionId?: string): void {
    const message = `Deployment ${success ? 'SUCCESS' : 'FAILED'}: ${programId} on ${network}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const data = { programId, network, success, transactionId };
    this.log(level, message, 'DEPLOY', data);
  }

  public logPerformanceMetric(metric: string, value: number, unit: string): void {
    const message = `Performance: ${metric} = ${value} ${unit}`;
    this.log(LogLevel.DEBUG, message, 'PERF', { metric, value, unit });
  }

  public logCommand(command: string, args: string[], exitCode: number, duration: number): void {
    const message = `Command: ${command} ${args.join(' ')} (exit ${exitCode}, ${duration}ms)`;
    const level = exitCode === 0 ? LogLevel.DEBUG : LogLevel.ERROR;
    this.log(level, message, 'CMD', { command, args, exitCode, duration });
  }
}

// Global logger instance
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  writeToFile: process.env.NODE_ENV !== 'test',
  colorize: process.stdout.isTTY
});

// Component-specific loggers
export const testLogger = logger.createChildLogger('TEST');
export const deployLogger = logger.createChildLogger('DEPLOY');
export const perfLogger = logger.createChildLogger('PERF');
export const vsCodeLogger = logger.createChildLogger('VSCODE');

// Utility functions for common logging patterns
export function logError(error: Error, context?: string): void {
  logger.error(error.message, context, {
    name: error.name,
    stack: error.stack
  });
}

export function logTiming<T>(fn: () => T, description: string, context?: string): T {
  const start = Date.now();
  
  try {
    const result = fn();
    const duration = Date.now() - start;
    logger.debug(`${description} completed in ${duration}ms`, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${description} failed after ${duration}ms`, context, error);
    throw error;
  }
}

export async function logTimingAsync<T>(
  fn: () => Promise<T>, 
  description: string, 
  context?: string
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug(`${description} completed in ${duration}ms`, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${description} failed after ${duration}ms`, context, error);
    throw error;
  }
}