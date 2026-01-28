/**
 * WXSS生成器 - 样式编译器
 *
 * 负责将ComponentStyle编译为CSS规则，处理单位转换、嵌套展开等
 */

import type {
  Component,
  ComponentStyle,
} from '../../01_Core_ProjectStructure/implementation/types';
import type {
  CSSRule,
  CSSUnit,
  CSSValue,
  NestedStyles,
  Breakpoint,
  ConvertOptions,
  WXSSGenerateOptions,
  InvalidPropertyError,
} from './types';
import { WXSSGeneratorError } from './types';

// ============================================================================
// 样式编译器类
// ============================================================================

/**
 * 样式编译器
 *
 * 职责:
 * - 将ComponentStyle对象编译为CSS规则
 * - 处理单位转换 (rpx, px, %)
 * - 生成响应式媒体查询
 * - 支持CSS嵌套和变量
 */
export class StyleCompiler {
  /** 默认断点配置 */
  private defaultBreakpoints: Breakpoint[] = [
    { name: 'xs', maxWidth: 375, query: '(max-width: 375px)' },
    { name: 'sm', minWidth: 375, maxWidth: 667, query: '(min-width: 375px) and (max-width: 667px)' },
    { name: 'md', minWidth: 667, maxWidth: 768, query: '(min-width: 667px) and (max-width: 768px)' },
    { name: 'lg', minWidth: 768, maxWidth: 1024, query: '(min-width: 768px) and (max-width: 1024px)' },
    { name: 'xl', minWidth: 1024, query: '(min-width: 1024px)' },
  ];

  /** 需要默认使用rpx的属性 */
  private rpxProperties = new Set([
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
    'top', 'right', 'bottom', 'left',
    'gap', 'row-gap', 'column-gap',
  ]);

  /** 需要默认使用px的属性 (主要是字体相关) */
  private pxProperties = new Set([
    'font-size', 'line-height', 'letter-spacing', 'word-spacing',
  ]);

  /**
   * 编译组件样式
   * @param component 组件
   * @param options 生成选项
   * @returns CSS规则数组
   */
  compileComponentStyle(component: Component, options?: WXSSGenerateOptions): CSSRule[] {
    const rules: CSSRule[] = [];
    const selector = this.generateSelector(component);

    // 编译基础样式
    if (component.style && Object.keys(component.style).length > 0) {
      const rule = this.compileStyle(component.style, selector, component.id);
      if (rule.properties && Object.keys(rule.properties).length > 0) {
        rules.push(rule);
      }
    }

    // 递归编译子组件
    if (component.children && component.children.length > 0) {
      for (const child of component.children) {
        rules.push(...this.compileComponentStyle(child, options));
      }
    }

    return rules;
  }

  /**
   * 编译样式对象
   * @param style 样式对象
   * @param selector 选择器
   * @param sourceId 源组件ID
   * @returns CSS规则
   */
  compileStyle(style: ComponentStyle, selector: string, sourceId?: string): CSSRule {
    const properties: Record<string, string> = {};

    for (const [key, value] of Object.entries(style)) {
      if (value === undefined || value === null) {
        continue;
      }

      // 转换属性名: camelCase → kebab-case
      const property = this.camelToKebab(key);

      // 处理属性值
      const processedValue = this.processValue(String(value), property);

      properties[property] = processedValue;
    }

    return {
      selector,
      properties,
      sourceId,
    };
  }

  /**
   * 编译嵌套样式
   * @param styles 嵌套样式
   * @param parentSelector 父选择器
   * @returns CSS规则数组
   */
  compileNested(styles: NestedStyles, parentSelector: string = ''): CSSRule[] {
    const rules: CSSRule[] = [];

    // 编译基础样式
    if (styles.base) {
      const rule = this.compileStyle(styles.base, parentSelector);
      if (Object.keys(rule.properties).length > 0) {
        rules.push(rule);
      }
    }

    // 编译嵌套选择器
    if (styles.nested) {
      for (const [selector, nestedStyle] of Object.entries(styles.nested)) {
        const fullSelector = this.combineSelectors(parentSelector, selector);

        if (this.isNestedStyles(nestedStyle)) {
          // 递归处理嵌套
          rules.push(...this.compileNested(nestedStyle, fullSelector));
        } else {
          // 编译单层样式
          const rule = this.compileStyle(nestedStyle, fullSelector);
          if (Object.keys(rule.properties).length > 0) {
            rules.push(rule);
          }
        }
      }
    }

    return rules;
  }

  /**
   * 生成媒体查询
   * @param breakpoint 断点
   * @param rules CSS规则
   * @returns 媒体查询字符串
   */
  generateMediaQuery(breakpoint: Breakpoint, rules: CSSRule[]): string {
    const cssRules = rules.map(rule => this.formatRule(rule)).join('\n\n');
    return `@media ${breakpoint.query} {\n${this.indent(cssRules, 2)}\n}`;
  }

  /**
   * 转换单位
   * @param value 值
   * @param unit 目标单位
   * @param options 转换选项
   * @returns 转换后的值
   */
  convertUnit(value: string, unit: CSSUnit, options?: ConvertOptions): string {
    const parsed = this.parseValue(value);

    if (!parsed.value || parsed.isKeyword || parsed.isVariable) {
      return value;
    }

    const from = parsed.unit || (options?.from as CSSUnit);
    if (!from || from === unit) {
      return value;
    }

    // px → rpx 转换
    if (from === 'px' && unit === 'rpx') {
      const ratio = options?.ratio || 1;
      return `${parsed.value * ratio}rpx`;
    }

    // rpx → px 转换
    if (from === 'rpx' && unit === 'px') {
      const ratio = options?.ratio || 1;
      return `${parsed.value / ratio}px`;
    }

    // 其他单位转换暂不支持
    return value;
  }

  /**
   * 生成组件选择器
   * @param component 组件
   * @returns 选择器字符串
   */
  private generateSelector(component: Component): string {
    // 优先使用组件名称
    if (component.name) {
      return `.${this.sanitizeClassName(component.name)}`;
    }

    // 使用类型和ID
    return `.${component.type}-${component.id}`;
  }

  /**
   * 处理属性值
   * @param value 原始值
   * @param property 属性名
   * @returns 处理后的值
   */
  private processValue(value: string, property: string): string {
    // 已经有单位，直接返回
    if (this.hasUnit(value)) {
      return value;
    }

    // 纯数字，添加默认单位
    if (this.isNumeric(value)) {
      const defaultUnit = this.getDefaultUnit(property);
      return `${value}${defaultUnit}`;
    }

    // 关键字、变量、函数等，保持原样
    return value;
  }

  /**
   * 获取默认单位
   * @param property 属性名
   * @returns 默认单位
   */
  private getDefaultUnit(property: string): CSSUnit {
    if (this.pxProperties.has(property)) {
      return 'px';
    }
    if (this.rpxProperties.has(property)) {
      return 'rpx';
    }
    return 'rpx'; // 默认使用rpx
  }

  /**
   * 解析CSS值
   * @param value 值字符串
   * @returns 解析结果
   */
  private parseValue(value: string): CSSValue {
    const trimmed = value.trim();

    // 检查是否是变量
    if (trimmed.startsWith('var(')) {
      return {
        raw: trimmed,
        isVariable: true,
      };
    }

    // 检查是否是关键字
    const keywords = ['auto', 'inherit', 'initial', 'unset', 'none', 'normal'];
    if (keywords.includes(trimmed.toLowerCase())) {
      return {
        raw: trimmed,
        isKeyword: true,
      };
    }

    // 解析数值和单位
    const match = trimmed.match(/^(-?\d+\.?\d*)(rpx|px|%|vw|vh|rem|em)?$/);
    if (match) {
      return {
        raw: trimmed,
        value: parseFloat(match[1]),
        unit: match[2] as CSSUnit,
      };
    }

    // 无法解析，返回原始值
    return {
      raw: trimmed,
    };
  }

  /**
   * 检查值是否包含单位
   * @param value 值
   * @returns 是否包含单位
   */
  private hasUnit(value: string): boolean {
    return /rpx|px|%|vw|vh|rem|em|deg|s|ms$/i.test(value);
  }

  /**
   * 检查是否是纯数字
   * @param value 值
   * @returns 是否是数字
   */
  private isNumeric(value: string): boolean {
    return /^-?\d+\.?\d*$/.test(value.trim());
  }

  /**
   * camelCase转kebab-case
   * @param str 字符串
   * @returns 转换后的字符串
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * 组合选择器
   * @param parent 父选择器
   * @param child 子选择器
   * @returns 组合后的选择器
   */
  private combineSelectors(parent: string, child: string): string {
    // & 表示父选择器
    if (child.startsWith('&')) {
      return parent + child.substring(1);
    }

    // 伪类/伪元素
    if (child.startsWith(':')) {
      return parent + child;
    }

    // 后代选择器
    return `${parent} ${child}`;
  }

  /**
   * 检查是否是嵌套样式
   * @param obj 对象
   * @returns 是否是嵌套样式
   */
  private isNestedStyles(obj: any): obj is NestedStyles {
    return obj && typeof obj === 'object' && ('base' in obj || 'nested' in obj);
  }

  /**
   * 格式化CSS规则
   * @param rule CSS规则
   * @returns 格式化后的字符串
   */
  private formatRule(rule: CSSRule): string {
    const properties = Object.entries(rule.properties)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n');

    return `${rule.selector} {\n${properties}\n}`;
  }

  /**
   * 缩进文本
   * @param text 文本
   * @param spaces 空格数
   * @returns 缩进后的文本
   */
  private indent(text: string, spaces: number): string {
    const indent = ' '.repeat(spaces);
    return text.split('\n').map(line => indent + line).join('\n');
  }

  /**
   * 清理类名
   * @param name 类名
   * @returns 清理后的类名
   */
  private sanitizeClassName(name: string): string {
    // 移除非法字符，只保留字母、数字、下划线、连字符
    return name.replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  /**
   * 合并样式
   * @param styles 样式数组
   * @returns 合并后的样式
   */
  mergeStyles(...styles: ComponentStyle[]): ComponentStyle {
    return Object.assign({}, ...styles);
  }

  /**
   * 验证样式属性
   * @param property 属性名
   * @param value 属性值
   * @returns 是否有效
   */
  validateProperty(property: string, value: string): boolean {
    // 基本验证: 非空
    if (!property || !value) {
      return false;
    }

    // 检查属性名格式
    if (!/^[a-z-]+$/.test(property)) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// 导出
// ============================================================================

export default StyleCompiler;
