import * as fs from 'fs';
import * as path from 'path';
import { logger } from './Logger';

export interface FileWatchOptions {
  patterns?: string[];
  ignored?: string[];
  persistent?: boolean;
  ignoreInitial?: boolean;
  followSymlinks?: boolean;
  awaitWriteFinish?: boolean;
}

export interface DirectoryInfo {
  path: string;
  exists: boolean;
  isDirectory: boolean;
  files: string[];
  subdirectories: string[];
  totalSize: number;
}

export class FileSystemUtils {
  /**
   * Ensure directory exists, create if it doesn't
   */
  public static ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.debug(`Created directory: ${dirPath}`, 'FS');
    }
  }

  /**
   * Safely read file with error handling
   */
  public static readFile(filePath: string, encoding: BufferEncoding = 'utf8'): string | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.readFileSync(filePath, encoding);
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, 'FS', error);
      return null;
    }
  }

  /**
   * Safely write file with error handling and backup
   */
  public static writeFile(filePath: string, content: string, createBackup: boolean = false): boolean {
    try {
      // Create backup if requested
      if (createBackup && fs.existsSync(filePath)) {
        const backupPath = `${filePath}.bak`;
        fs.copyFileSync(filePath, backupPath);
        logger.debug(`Created backup: ${backupPath}`, 'FS');
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      this.ensureDirectory(dir);

      fs.writeFileSync(filePath, content, 'utf8');
      logger.debug(`Wrote file: ${filePath}`, 'FS');
      return true;
    } catch (error) {
      logger.error(`Failed to write file: ${filePath}`, 'FS', error);
      return false;
    }
  }

  /**
   * Read JSON file with error handling
   */
  public static readJsonFile<T>(filePath: string): T | null {
    const content = this.readFile(filePath);
    if (content === null) {
      return null;
    }

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      logger.error(`Failed to parse JSON file: ${filePath}`, 'FS', error);
      return null;
    }
  }

  /**
   * Write JSON file with pretty formatting
   */
  public static writeJsonFile<T>(filePath: string, data: T, createBackup: boolean = false): boolean {
    try {
      const content = JSON.stringify(data, null, 2);
      return this.writeFile(filePath, content, createBackup);
    } catch (error) {
      logger.error(`Failed to serialize JSON for file: ${filePath}`, 'FS', error);
      return false;
    }
  }

  /**
   * Copy file with error handling
   */
  public static copyFile(source: string, destination: string): boolean {
    try {
      if (!fs.existsSync(source)) {
        logger.error(`Source file does not exist: ${source}`, 'FS');
        return false;
      }

      const destDir = path.dirname(destination);
      this.ensureDirectory(destDir);

      fs.copyFileSync(source, destination);
      logger.debug(`Copied file: ${source} -> ${destination}`, 'FS');
      return true;
    } catch (error) {
      logger.error(`Failed to copy file: ${source} -> ${destination}`, 'FS', error);
      return false;
    }
  }

  /**
   * Delete file with error handling
   */
  public static deleteFile(filePath: string): boolean {
    try {
      if (!fs.existsSync(filePath)) {
        return true; // Already deleted
      }

      fs.unlinkSync(filePath);
      logger.debug(`Deleted file: ${filePath}`, 'FS');
      return true;
    } catch (error) {
      logger.error(`Failed to delete file: ${filePath}`, 'FS', error);
      return false;
    }
  }

  /**
   * Get directory information
   */
  public static getDirectoryInfo(dirPath: string): DirectoryInfo {
    const info: DirectoryInfo = {
      path: dirPath,
      exists: false,
      isDirectory: false,
      files: [],
      subdirectories: [],
      totalSize: 0
    };

    try {
      if (!fs.existsSync(dirPath)) {
        return info;
      }

      const stats = fs.statSync(dirPath);
      info.exists = true;
      info.isDirectory = stats.isDirectory();

      if (!info.isDirectory) {
        return info;
      }

      const items = fs.readdirSync(dirPath);
      let totalSize = 0;

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStats = fs.statSync(itemPath);

        if (itemStats.isDirectory()) {
          info.subdirectories.push(item);
        } else {
          info.files.push(item);
          totalSize += itemStats.size;
        }
      }

      info.totalSize = totalSize;
    } catch (error) {
      logger.error(`Failed to get directory info: ${dirPath}`, 'FS', error);
    }

    return info;
  }

  /**
   * Find files matching a pattern
   */
  public static findFiles(dirPath: string, pattern: RegExp, recursive: boolean = true): string[] {
    const results: string[] = [];

    try {
      if (!fs.existsSync(dirPath)) {
        return results;
      }

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory() && recursive) {
          results.push(...this.findFiles(itemPath, pattern, recursive));
        } else if (stats.isFile() && pattern.test(item)) {
          results.push(itemPath);
        }
      }
    } catch (error) {
      logger.error(`Failed to find files in: ${dirPath}`, 'FS', error);
    }

    return results;
  }

  /**
   * Clean directory (remove all contents)
   */
  public static cleanDirectory(dirPath: string): boolean {
    try {
      if (!fs.existsSync(dirPath)) {
        return true;
      }

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          this.removeDirectory(itemPath);
        } else {
          fs.unlinkSync(itemPath);
        }
      }

      logger.debug(`Cleaned directory: ${dirPath}`, 'FS');
      return true;
    } catch (error) {
      logger.error(`Failed to clean directory: ${dirPath}`, 'FS', error);
      return false;
    }
  }

  /**
   * Remove directory recursively
   */
  public static removeDirectory(dirPath: string): boolean {
    try {
      if (!fs.existsSync(dirPath)) {
        return true;
      }

      fs.rmSync(dirPath, { recursive: true, force: true });
      logger.debug(`Removed directory: ${dirPath}`, 'FS');
      return true;
    } catch (error) {
      logger.error(`Failed to remove directory: ${dirPath}`, 'FS', error);
      return false;
    }
  }

  /**
   * Watch files for changes
   */
  public static watchFiles(paths: string | string[], options: FileWatchOptions = {}): any {
    const chokidar = require('chokidar');

    const watchOptions = {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
      },
      ignored: [
        '**/node_modules/**',
        '**/target/**',
        '**/.git/**',
        '**/.anchor/**',
        ...(options.ignored || [])
      ],
      ...options
    };

    const watcher = chokidar.watch(paths, watchOptions);
    
    logger.debug(`Watching files: ${Array.isArray(paths) ? paths.join(', ') : paths}`, 'FS');
    
    return watcher;
  }

  /**
   * Get file stats
   */
  public static getFileStats(filePath: string): fs.Stats | null {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      return fs.statSync(filePath);
    } catch (error) {
      logger.error(`Failed to get file stats: ${filePath}`, 'FS', error);
      return null;
    }
  }

  /**
   * Check if file is newer than another file
   */
  public static isFileNewer(file1: string, file2: string): boolean {
    const stats1 = this.getFileStats(file1);
    const stats2 = this.getFileStats(file2);

    if (!stats1 || !stats2) {
      return false;
    }

    return stats1.mtime > stats2.mtime;
  }

  /**
   * Create temporary file
   */
  public static createTempFile(content: string, extension: string = '.tmp'): string {
    const os = require('os');
    const tmpDir = os.tmpdir();
    const fileName = `anchor-enhancement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;
    const filePath = path.join(tmpDir, fileName);

    this.writeFile(filePath, content);
    return filePath;
  }

  /**
   * Create temporary directory
   */
  public static createTempDirectory(): string {
    const os = require('os');
    const tmpDir = os.tmpdir();
    const dirName = `anchor-enhancement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const dirPath = path.join(tmpDir, dirName);

    this.ensureDirectory(dirPath);
    return dirPath;
  }

  /**
   * Calculate directory size recursively
   */
  public static getDirectorySize(dirPath: string): number {
    let totalSize = 0;

    try {
      if (!fs.existsSync(dirPath)) {
        return 0;
      }

      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) {
        return stats.size;
      }

      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const itemStats = fs.statSync(itemPath);

        if (itemStats.isDirectory()) {
          totalSize += this.getDirectorySize(itemPath);
        } else {
          totalSize += itemStats.size;
        }
      }
    } catch (error) {
      logger.error(`Failed to calculate directory size: ${dirPath}`, 'FS', error);
    }

    return totalSize;
  }

  /**
   * Format file size for display
   */
  public static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 100) / 100} ${units[unitIndex]}`;
  }

  /**
   * Get relative path from base directory
   */
  public static getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Check if path is within another path
   */
  public static isWithinPath(childPath: string, parentPath: string): boolean {
    const relative = path.relative(parentPath, childPath);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  /**
   * Merge directories (copy contents from source to destination)
   */
  public static mergeDirectories(source: string, destination: string): boolean {
    try {
      if (!fs.existsSync(source)) {
        logger.error(`Source directory does not exist: ${source}`, 'FS');
        return false;
      }

      this.ensureDirectory(destination);
      
      const items = fs.readdirSync(source);

      for (const item of items) {
        const sourcePath = path.join(source, item);
        const destPath = path.join(destination, item);
        const stats = fs.statSync(sourcePath);

        if (stats.isDirectory()) {
          this.mergeDirectories(sourcePath, destPath);
        } else {
          this.copyFile(sourcePath, destPath);
        }
      }

      logger.debug(`Merged directories: ${source} -> ${destination}`, 'FS');
      return true;
    } catch (error) {
      logger.error(`Failed to merge directories: ${source} -> ${destination}`, 'FS', error);
      return false;
    }
  }
}