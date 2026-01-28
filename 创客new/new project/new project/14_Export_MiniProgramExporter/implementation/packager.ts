/**
 * 打包器
 *
 * 负责将项目打包为zip文件
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as archiver from 'archiver';

/**
 * 打包器
 */
export class Packager {
  /**
   * 打包为zip文件
   * @param sourcePath 源目录路径
   * @param outputPath 输出zip文件路径
   * @returns zip文件路径
   */
  async packToZip(sourcePath: string, outputPath: string): Promise<string> {
    // 确保输出目录存在
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      // 创建输出流
      const output = createWriteStream(outputPath);

      // 创建archiver实例
      const archive = archiver('zip', {
        zlib: { level: 9 }, // 最高压缩级别
      });

      // 监听完成事件
      output.on('close', () => {
        resolve(outputPath);
      });

      // 监听错误事件
      archive.on('error', (error: Error) => {
        reject(error);
      });

      output.on('error', (error: Error) => {
        reject(error);
      });

      // 连接输出流
      archive.pipe(output);

      // 添加目录到压缩包
      archive.directory(sourcePath, false);

      // 完成打包
      archive.finalize();
    });
  }

  /**
   * 打包为上传包(移除开发文件)
   * @param sourcePath 源目录路径
   * @param outputPath 输出zip文件路径
   * @returns zip文件路径
   */
  async packForUpload(sourcePath: string, outputPath: string): Promise<string> {
    // 确保输出目录存在
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        resolve(outputPath);
      });

      archive.on('error', reject);
      output.on('error', reject);

      archive.pipe(output);

      // 添加目录,但排除开发文件
      archive.glob('**/*', {
        cwd: sourcePath,
        ignore: [
          'node_modules/**',
          '**/*.map',
          '**/*.ts',
          '.git/**',
          '.gitignore',
          '.eslintrc.*',
          '.prettierrc.*',
          'tsconfig.json',
          'package-lock.json',
          'yarn.lock',
        ],
      });

      archive.finalize();
    });
  }

  /**
   * 获取压缩包信息
   * @param zipPath zip文件路径
   * @returns 压缩包信息
   */
  async getZipInfo(zipPath: string): Promise<{
    size: number;
    fileCount: number;
  }> {
    const stats = await fs.stat(zipPath);

    // 简化实现: 实际可以解压并统计文件数
    return {
      size: stats.size,
      fileCount: 0, // 需要解压才能准确统计
    };
  }

  /**
   * 计算目录大小
   * @param dirPath 目录路径
   * @returns 总大小(字节)
   */
  async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    }

    await traverse(dirPath);
    return totalSize;
  }

  /**
   * 统计目录文件数
   * @param dirPath 目录路径
   * @returns 文件数
   */
  async countFiles(dirPath: string): Promise<number> {
    let count = 0;

    async function traverse(currentPath: string) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
          count++;
        }
      }
    }

    await traverse(dirPath);
    return count;
  }
}
