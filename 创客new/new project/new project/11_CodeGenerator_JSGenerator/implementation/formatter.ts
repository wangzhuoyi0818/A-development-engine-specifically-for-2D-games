/**
 * 微信小程序可视化开发平台 - 代码格式化器
 *
 * 负责格式化生成的JavaScript代码,确保代码风格一致
 */

import type { CodeFormatter as ICodeFormatter, FormatterOptions } from './types';

/**
 * 默认格式化选项
 */
const DEFAULT_OPTIONS: FormatterOptions = {
  indentSize: 2,
  useTabs: false,
  quotes: 'single',
  trailingComma: false,
  semi: false,
  printWidth: 100,
};

/**
 * 代码格式化器实现
 */
export class CodeFormatter implements ICodeFormatter {
  private options: FormatterOptions;

  constructor(options: Partial<FormatterOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 格式化代码
   */
  format(code: string, options?: FormatterOptions): string {
    const opts = { ...this.options, ...options };

    let formatted = code;

    // 处理引号
    if (opts.quotes === 'single') {
      formatted = this.convertToSingleQuotes(formatted);
    }

    // 处理分号
    if (!opts.semi) {
      formatted = this.removeSemicolons(formatted);
    }

    // 处理缩进
    formatted = this.normalizeIndentation(formatted, opts.indentSize || 2, opts.useTabs || false);

    // 删除多余空行
    formatted = this.removeExcessiveBlankLines(formatted);

    // 格式化对象和数组
    formatted = this.formatObjectsAndArrays(formatted, opts);

    return formatted.trim();
  }

  /**
   * 添加缩进
   */
  indent(code: string, level: number): string {
    const indentStr = this.getIndentString(level);
    return code
      .split('\n')
      .map((line) => {
        if (line.trim().length === 0) return '';
        return indentStr + line;
      })
      .join('\n');
  }

  /**
   * 美化对象字面量
   */
  beautifyObject(obj: any, options?: FormatterOptions): string {
    const opts = { ...this.options, ...options };
    return this.formatValue(obj, 0, opts);
  }

  /**
   * 获取缩进字符串
   */
  private getIndentString(level: number): string {
    const { indentSize = 2, useTabs = false } = this.options;

    if (useTabs) {
      return '\t'.repeat(level);
    }

    return ' '.repeat(level * indentSize);
  }

  /**
   * 格式化值(递归)
   */
  private formatValue(value: any, depth: number, opts: FormatterOptions): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';

    const type = typeof value;

    switch (type) {
      case 'string':
        return this.formatString(value, opts);

      case 'number':
      case 'boolean':
        return String(value);

      case 'function':
        return this.formatFunction(value, depth, opts);

      case 'object':
        if (Array.isArray(value)) {
          return this.formatArray(value, depth, opts);
        }
        return this.formatObject(value, depth, opts);

      default:
        return String(value);
    }
  }

  /**
   * 格式化字符串
   */
  private formatString(str: string, opts: FormatterOptions): string {
    const quote = opts.quotes === 'single' ? "'" : '"';
    const escaped = str.replace(/\\/g, '\\\\').replace(new RegExp(quote, 'g'), '\\' + quote);
    return `${quote}${escaped}${quote}`;
  }

  /**
   * 格式化函数
   */
  private formatFunction(fn: Function, depth: number, opts: FormatterOptions): string {
    // 简单处理,返回函数字符串
    return fn.toString();
  }

  /**
   * 格式化对象
   */
  private formatObject(obj: Record<string, any>, depth: number, opts: FormatterOptions): string {
    const entries = Object.entries(obj);

    if (entries.length === 0) {
      return '{}';
    }

    // 单行还是多行
    const singleLine = this.shouldUseSingleLine(obj, opts);

    if (singleLine) {
      const items = entries.map(([key, value]) => {
        const formattedValue = this.formatValue(value, depth + 1, opts);
        return `${this.formatKey(key)}: ${formattedValue}`;
      });

      return `{ ${items.join(', ')} }`;
    }

    // 多行格式
    const indent = this.getIndentString(depth + 1);
    const closeIndent = this.getIndentString(depth);

    const items = entries.map(([key, value]) => {
      const formattedValue = this.formatValue(value, depth + 1, opts);
      const comma = opts.trailingComma ? ',' : '';
      return `${indent}${this.formatKey(key)}: ${formattedValue}${comma}`;
    });

    return `{\n${items.join(',\n').replace(/,\n/g, '\n')}\n${closeIndent}}`;
  }

  /**
   * 格式化数组
   */
  private formatArray(arr: any[], depth: number, opts: FormatterOptions): string {
    if (arr.length === 0) {
      return '[]';
    }

    // 简单数组使用单行
    const allSimple = arr.every((item) => {
      const type = typeof item;
      return type === 'string' || type === 'number' || type === 'boolean' || item === null;
    });

    if (allSimple && arr.length <= 5) {
      const items = arr.map((item) => this.formatValue(item, depth + 1, opts));
      return `[${items.join(', ')}]`;
    }

    // 复杂数组使用多行
    const indent = this.getIndentString(depth + 1);
    const closeIndent = this.getIndentString(depth);

    const items = arr.map((item) => {
      const formattedValue = this.formatValue(item, depth + 1, opts);
      return `${indent}${formattedValue}`;
    });

    return `[\n${items.join(',\n')}\n${closeIndent}]`;
  }

  /**
   * 格式化对象键
   */
  private formatKey(key: string): string {
    // 如果键是有效标识符,不需要引号
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      return key;
    }

    // 否则需要引号
    return this.formatString(key, this.options);
  }

  /**
   * 判断是否应该使用单行
   */
  private shouldUseSingleLine(obj: Record<string, any>, opts: FormatterOptions): boolean {
    const entries = Object.entries(obj);

    // 空对象或单个简单属性
    if (entries.length === 0 || entries.length === 1) {
      const [, value] = entries[0] || [];
      const type = typeof value;
      return type !== 'object' || value === null;
    }

    // 估算长度
    const estimatedLength = entries.reduce((sum, [key, value]) => {
      return sum + key.length + String(value).length + 4; // 4 for ': ' and ', '
    }, 2); // 2 for '{}'

    return estimatedLength < (opts.printWidth || 100) / 2;
  }

  /**
   * 转换为单引号
   */
  private convertToSingleQuotes(code: string): string {
    // 简单替换(实际应该用AST,这里简化处理)
    return code.replace(/"([^"]*)"/g, "'$1'");
  }

  /**
   * 移除分号
   */
  private removeSemicolons(code: string): string {
    return code.replace(/;(\s*\n)/g, '$1');
  }

  /**
   * 标准化缩进
   */
  private normalizeIndentation(code: string, indentSize: number, useTabs: boolean): string {
    const lines = code.split('\n');
    const indentChar = useTabs ? '\t' : ' '.repeat(indentSize);

    return lines
      .map((line) => {
        // 计算当前缩进级别
        const match = line.match(/^(\s*)/);
        if (!match) return line;

        const currentIndent = match[1];
        const level = this.calculateIndentLevel(currentIndent);

        // 重新生成缩进
        const newIndent = indentChar.repeat(level);
        return newIndent + line.trim();
      })
      .join('\n');
  }

  /**
   * 计算缩进级别
   */
  private calculateIndentLevel(indent: string): number {
    const { indentSize = 2, useTabs = false } = this.options;

    if (useTabs) {
      return indent.split('\t').length - 1;
    }

    return Math.floor(indent.length / indentSize);
  }

  /**
   * 删除多余空行
   */
  private removeExcessiveBlankLines(code: string): string {
    // 最多保留一个空行
    return code.replace(/\n\s*\n\s*\n/g, '\n\n');
  }

  /**
   * 格式化对象和数组
   */
  private formatObjectsAndArrays(code: string, opts: FormatterOptions): string {
    // 简化处理:在 { 后和 } 前添加适当的空格和换行
    // 实际应该用AST

    // { 后面换行
    code = code.replace(/\{\s*([a-zA-Z])/g, '{\n  $1');

    // } 前面换行
    code = code.replace(/([^\s])\s*\}/g, '$1\n}');

    // [ 和 ] 的处理类似
    code = code.replace(/\[\s*([^\]])/g, '[\n  $1');
    code = code.replace(/([^\s])\s*\]/g, '$1\n]');

    return code;
  }

  /**
   * 格式化Page/Component结构
   */
  formatPageOrComponent(code: string): string {
    // 特殊处理Page()和Component()结构
    let formatted = code;

    // 确保主结构格式正确
    formatted = formatted.replace(/(Page|Component)\s*\(\s*\{/, '$1({\n');
    formatted = formatted.replace(/\}\s*\)/, '\n})');

    // 格式化方法定义
    formatted = this.formatMethods(formatted);

    return this.format(formatted);
  }

  /**
   * 格式化方法定义
   */
  private formatMethods(code: string): string {
    // 方法之间添加空行
    code = code.replace(/(\})\s*([a-zA-Z_$][\w$]*\s*\([^)]*\)\s*\{)/g, '$1\n\n  $2');

    // 生命周期函数特殊处理
    const lifecycleMethods = [
      'onLoad',
      'onShow',
      'onReady',
      'onHide',
      'onUnload',
      'onPullDownRefresh',
      'onReachBottom',
      'onShareAppMessage',
      'attached',
      'detached',
      'ready',
    ];

    lifecycleMethods.forEach((method) => {
      const regex = new RegExp(`(${method}\\s*\\([^)]*\\)\\s*\\{)`, 'g');
      code = code.replace(regex, '\n  $1');
    });

    return code;
  }
}

/**
 * 创建默认代码格式化器
 */
export function createFormatter(options?: Partial<FormatterOptions>): CodeFormatter {
  return new CodeFormatter(options);
}

/**
 * 快速格式化函数
 */
export function formatCode(code: string, options?: FormatterOptions): string {
  const formatter = new CodeFormatter(options);
  return formatter.format(code);
}

/**
 * 美化对象
 */
export function beautifyObject(obj: any, options?: FormatterOptions): string {
  const formatter = new CodeFormatter(options);
  return formatter.beautifyObject(obj, options);
}
