/**
 * 代码优化器
 *
 * 负责优化WXML/WXSS/JS代码和压缩资源
 */

import type { OptimizationOptions } from './types';
import { DEFAULT_OPTIMIZATION_OPTIONS } from './types';

/**
 * 代码优化器
 */
export class Optimizer {
  private options: Required<OptimizationOptions>;

  constructor(options: OptimizationOptions = {}) {
    this.options = {
      wxml: { ...DEFAULT_OPTIMIZATION_OPTIONS.wxml, ...options.wxml },
      wxss: { ...DEFAULT_OPTIMIZATION_OPTIONS.wxss, ...options.wxss },
      js: { ...DEFAULT_OPTIMIZATION_OPTIONS.js, ...options.js },
      image: { ...DEFAULT_OPTIMIZATION_OPTIONS.image, ...options.image },
    };
  }

  /**
   * 优化WXML代码
   * @param code WXML代码
   * @returns 优化后的代码
   */
  async optimizeWXML(code: string): Promise<string> {
    let optimized = code;

    // 移除注释
    if (this.options.wxml.removeComments) {
      optimized = this.removeXMLComments(optimized);
    }

    // 移除多余空白
    if (this.options.wxml.removeWhitespace) {
      optimized = this.removeExcessWhitespace(optimized);
    }

    // 压缩属性
    if (this.options.wxml.compressAttributes) {
      optimized = this.compressAttributes(optimized);
    }

    return optimized;
  }

  /**
   * 优化WXSS代码
   * @param code WXSS代码
   * @returns 优化后的代码
   */
  async optimizeWXSS(code: string): Promise<string> {
    let optimized = code;

    // CSS压缩
    if (this.options.wxss.minify) {
      optimized = this.minifyCSS(optimized);
    }

    // 合并选择器
    if (this.options.wxss.mergeSelectors) {
      optimized = this.mergeSelectors(optimized);
    }

    return optimized;
  }

  /**
   * 优化JavaScript代码
   * @param code JavaScript代码
   * @returns 优化后的代码
   */
  async optimizeJS(code: string): Promise<string> {
    let optimized = code;

    // 移除console
    if (this.options.js.removeConsole) {
      optimized = this.removeConsoleStatements(optimized);
    }

    // 基础压缩(移除注释和空白)
    if (this.options.js.minify) {
      optimized = this.minifyJS(optimized);
    }

    return optimized;
  }

  /**
   * 优化图片
   * @param imagePath 图片路径
   * @returns 优化后的图片路径
   */
  async optimizeImage(imagePath: string): Promise<string> {
    // 简化实现: 实际项目中可以使用sharp或imagemin库
    // 这里只返回原路径
    return imagePath;
  }

  /**
   * 移除XML注释
   * @param code XML代码
   * @returns 移除注释后的代码
   */
  private removeXMLComments(code: string): string {
    return code.replace(/<!--[\s\S]*?-->/g, '');
  }

  /**
   * 移除多余空白
   * @param code 代码
   * @returns 移除空白后的代码
   */
  private removeExcessWhitespace(code: string): string {
    return code
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n')
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ');
  }

  /**
   * 压缩属性
   * @param code XML代码
   * @returns 压缩后的代码
   */
  private compressAttributes(code: string): string {
    // 移除属性值周围的多余空格
    return code.replace(/\s*=\s*"/g, '="').replace(/"\s+/g, '" ');
  }

  /**
   * CSS压缩
   * @param code CSS代码
   * @returns 压缩后的代码
   */
  private minifyCSS(code: string): string {
    return code
      // 移除注释
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 移除多余空白
      .replace(/\s+/g, ' ')
      // 移除空格: 选择器前后
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      // 移除空格: 属性冒号前后
      .replace(/\s*:\s*/g, ':')
      // 移除空格: 分号前
      .replace(/\s*;\s*/g, ';')
      // 移除空格: 逗号后
      .replace(/\s*,\s*/g, ',')
      // 移除最后的分号
      .replace(/;}/g, '}')
      .trim();
  }

  /**
   * 合并相同选择器
   * @param code CSS代码
   * @returns 合并后的代码
   */
  private mergeSelectors(code: string): string {
    // 简化实现: 实际项目中可以使用postcss
    // 这里只返回原代码
    return code;
  }

  /**
   * 移除console语句
   * @param code JavaScript代码
   * @returns 移除console后的代码
   */
  private removeConsoleStatements(code: string): string {
    return code.replace(/console\.(log|warn|error|info|debug)\(.*?\);?/g, '');
  }

  /**
   * JavaScript压缩
   * @param code JavaScript代码
   * @returns 压缩后的代码
   */
  private minifyJS(code: string): Promise<string> {
    // 基础压缩: 移除注释和多余空白
    let minified = code
      // 移除单行注释
      .replace(/\/\/.*$/gm, '')
      // 移除多行注释
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // 移除多余空白
      .replace(/\s+/g, ' ')
      // 移除空白: 大括号前后
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*}\s*/g, '}')
      // 移除空白: 括号前后
      .replace(/\s*\(\s*/g, '(')
      .replace(/\s*\)\s*/g, ')')
      // 移除空白: 逗号后
      .replace(/\s*,\s*/g, ',')
      // 移除空白: 分号前后
      .replace(/\s*;\s*/g, ';')
      .trim();

    return Promise.resolve(minified);
  }

  /**
   * 批量优化文件
   * @param files 文件映射 { 文件路径: 文件内容 }
   * @returns 优化后的文件映射
   */
  async optimizeFiles(
    files: Record<string, string>
  ): Promise<Record<string, string>> {
    const optimized: Record<string, string> = {};

    for (const [filePath, content] of Object.entries(files)) {
      const ext = this.getFileExtension(filePath);

      switch (ext) {
        case '.wxml':
          optimized[filePath] = await this.optimizeWXML(content);
          break;
        case '.wxss':
          optimized[filePath] = await this.optimizeWXSS(content);
          break;
        case '.js':
          optimized[filePath] = await this.optimizeJS(content);
          break;
        default:
          // 其他文件不优化
          optimized[filePath] = content;
      }
    }

    return optimized;
  }

  /**
   * 获取文件扩展名
   * @param filePath 文件路径
   * @returns 扩展名
   */
  private getFileExtension(filePath: string): string {
    const match = filePath.match(/\.[^.]+$/);
    return match ? match[0] : '';
  }

  /**
   * 计算压缩比
   * @param originalSize 原始大小
   * @param compressedSize 压缩后大小
   * @returns 压缩比
   */
  calculateCompressionRatio(
    originalSize: number,
    compressedSize: number
  ): number {
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize) * 100;
  }
}
