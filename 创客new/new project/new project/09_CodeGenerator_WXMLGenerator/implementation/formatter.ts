/**
 * 代码格式化器 - 处理WXML代码的格式化
 *
 * 职责：
 * - 生成缩进
 * - 格式化代码结构
 * - 处理自闭合标签
 * - 添加注释
 */

import type { FormatterOptions } from './types';

/**
 * WXML格式化器
 * 负责代码的格式化和美化
 */
export class Formatter {
  /** 默认缩进字符 */
  private static readonly DEFAULT_INDENT = '  ';

  /**
   * 生成缩进字符串
   *
   * @param level 缩进级别
   * @param indent 缩进字符（默认2个空格）
   * @returns 缩进字符串
   */
  static indent(level: number, indent: string = this.DEFAULT_INDENT): string {
    return indent.repeat(Math.max(0, level));
  }

  /**
   * 格式化WXML代码
   *
   * @param wxml 未格式化的WXML字符串
   * @param options 格式化选项
   * @returns 格式化后的WXML字符串
   */
  static format(wxml: string, options: Partial<FormatterOptions> = {}): string {
    const opts: FormatterOptions = {
      indent: options.indent || this.DEFAULT_INDENT,
      maxLineLength: options.maxLineLength || 100,
      breakAttributes: options.breakAttributes ?? false,
      preserveWhitespace: options.preserveWhitespace ?? false
    };

    if (!wxml || wxml.trim().length === 0) {
      return '';
    }

    // 清理多余空白（保留关键空格）
    let cleaned = wxml
      .replace(/>\s+</g, '><') // 移除标签间的空白
      .replace(/\s+/g, ' ')     // 合并多个空格
      .trim();

    // 添加换行和缩进
    let formatted = '';
    let level = 0;
    let inTag = false;
    let tagBuffer = '';

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const nextChar = cleaned[i + 1];
      const prevChar = cleaned[i - 1];

      if (char === '<') {
        // 开始标签
        inTag = true;
        tagBuffer = char;

        // 如果不是文本节点前，添加换行
        if (formatted.trim().length > 0 && !formatted.endsWith('\n')) {
          formatted += '\n';
        }
      } else if (char === '>') {
        // 结束标签
        tagBuffer += char;
        inTag = false;

        // 判断标签类型
        const isClosingTag = tagBuffer.startsWith('</');
        const isSelfClosing = tagBuffer.endsWith('/>');
        const isCommentOrDeclaration = tagBuffer.startsWith('<!--') || tagBuffer.startsWith('<?');

        if (isClosingTag && !isSelfClosing) {
          level = Math.max(0, level - 1);
        }

        // 添加缩进
        if (!formatted.endsWith('\n')) {
          formatted += '\n';
        }
        formatted += this.indent(level, opts.indent) + tagBuffer;

        if (!isClosingTag && !isSelfClosing && !isCommentOrDeclaration) {
          level++;
        }

        tagBuffer = '';
      } else if (inTag) {
        tagBuffer += char;
      } else if (char.trim()) {
        // 文本内容
        if (!formatted.endsWith(' ')) {
          formatted += ' ';
        }
        formatted += char;
      }
    }

    // 最后一个标签
    if (tagBuffer) {
      formatted += '\n' + this.indent(level, opts.indent) + tagBuffer;
    }

    // 清理多余空行
    formatted = formatted
      .replace(/\n\s*\n/g, '\n')
      .trim();

    return formatted + '\n';
  }

  /**
   * 判断标签是否是自闭合标签
   *
   * @param tagName 标签名
   * @returns 是否自闭合
   */
  static isSelfClosingTag(tagName: string): boolean {
    const selfClosingTags = new Set([
      'input', 'image', 'import', 'include',
      'progress', 'checkbox', 'radio', 'br', 'hr'
    ]);
    return selfClosingTags.has(tagName);
  }

  /**
   * 格式化属性字符串
   * 可选地将长属性列表换行
   *
   * @param attributes 属性字符串
   * @param breakLongLines 是否换行长属性
   * @param indent 缩进字符
   * @param maxLength 最大行长
   * @returns 格式化后的属性字符串
   */
  static formatAttributes(
    attributes: string,
    breakLongLines: boolean = false,
    indent: string = this.DEFAULT_INDENT,
    maxLength: number = 100
  ): string {
    if (!attributes.trim()) {
      return '';
    }

    // 如果不需要换行，直接返回
    if (!breakLongLines || attributes.length < maxLength) {
      return attributes;
    }

    // 解析属性
    const attrRegex = /(\w+(?::\w+)?)="([^"]*)"/g;
    const attrs: string[] = [];
    let match;

    while ((match = attrRegex.exec(attributes)) !== null) {
      attrs.push(`${match[1]}="${match[2]}"`);
    }

    // 如果属性很少，不换行
    if (attrs.length <= 2) {
      return attributes;
    }

    // 换行格式
    return '\n' + attrs.map(attr => indent + indent + attr).join('\n') + '\n' + indent;
  }

  /**
   * 添加注释
   *
   * @param text 注释文本
   * @param level 缩进级别
   * @param indent 缩进字符
   * @returns 注释字符串
   */
  static addComment(text: string, level: number = 0, indent: string = this.DEFAULT_INDENT): string {
    const cleanText = text.replace(/-->/g, '--').trim();
    return `${this.indent(level, indent)}<!-- ${cleanText} -->`;
  }

  /**
   * 添加块注释
   *
   * @param lines 注释行数组
   * @param level 缩进级别
   * @param indent 缩进字符
   * @returns 块注释字符串
   */
  static addBlockComment(lines: string[], level: number = 0, indent: string = this.DEFAULT_INDENT): string {
    const indentStr = this.indent(level, indent);
    const formattedLines = lines.map(line => `${indentStr}<!-- ${line.trim()} -->`);
    return formattedLines.join('\n');
  }

  /**
   * 最小化WXML（移除注释和不必要的空白）
   *
   * @param wxml WXML字符串
   * @returns 最小化后的字符串
   */
  static minify(wxml: string): string {
    return wxml
      .replace(/<!--[\s\S]*?-->/g, '')    // 移除注释
      .replace(/\s+/g, ' ')               // 合并空白
      .replace(/>\s+</g, '><')            // 移除标签间空白
      .replace(/\s*([="])\s*/g, '$1')     // 移除等号周围空白
      .trim();
  }

  /**
   * 美化代码块
   *
   * @param code 代码字符串
   * @param startLevel 起始缩进级别
   * @param indent 缩进字符
   * @returns 美化后的代码
   */
  static beautify(code: string, startLevel: number = 0, indent: string = this.DEFAULT_INDENT): string {
    const lines = code.split('\n');
    const beautified: string[] = [];
    let level = startLevel;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        continue;
      }

      // 计算缩进级别
      if (trimmed.startsWith('</')) {
        level = Math.max(0, level - 1);
      }

      beautified.push(this.indent(level, indent) + trimmed);

      // 检查是否需要增加缩进
      if (trimmed.startsWith('<') && !trimmed.startsWith('</')) {
        // 开始标签
        if (!trimmed.endsWith('/>') && !trimmed.endsWith('-->')) {
          level++;
        }
      }
    }

    return beautified.join('\n');
  }

  /**
   * 计算代码行数
   *
   * @param wxml WXML字符串
   * @returns 行数
   */
  static getLineCount(wxml: string): number {
    return wxml.split('\n').length;
  }

  /**
   * 获取指定行的代码
   *
   * @param wxml WXML字符串
   * @param lineNumber 行号（从1开始）
   * @returns 该行代码
   */
  static getLine(wxml: string, lineNumber: number): string | undefined {
    const lines = wxml.split('\n');
    return lines[lineNumber - 1];
  }

  /**
   * 获取指定范围的代码
   *
   * @param wxml WXML字符串
   * @param startLine 起始行号
   * @param endLine 结束行号
   * @returns 代码片段
   */
  static getLines(wxml: string, startLine: number, endLine: number): string {
    const lines = wxml.split('\n');
    return lines.slice(startLine - 1, endLine).join('\n');
  }

  /**
   * 标准化行尾
   *
   * @param wxml WXML字符串
   * @returns 标准化后的字符串
   */
  static normalizeLineEndings(wxml: string): string {
    return wxml.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * 移除BOM标记
   *
   * @param wxml WXML字符串
   * @returns 移除BOM后的字符串
   */
  static removeBOM(wxml: string): string {
    return wxml.replace(/^\uFEFF/, '');
  }

  /**
   * 生成开始注释
   *
   * @param fileName 文件名
   * @returns 注释字符串
   */
  static generateFileHeader(fileName: string): string {
    const lines = [
      `WXML Template: ${fileName}`,
      `Generated by WXML Generator`,
      `Last modified: ${new Date().toISOString()}`
    ];
    return this.addBlockComment(lines, 0);
  }
}
