/**
 * WXML生成器 - 核心生成器类
 *
 * 职责：
 * - 从组件树生成WXML代码
 * - 协调各子模块工作
 * - 处理组件层级关系
 * - 生成最终的WXML字符串
 */

import type {
  Component,
  Page
} from '../../../01_Core_ProjectStructure/implementation/types';
import type {
  WXMLGeneratorOptions,
  WXMLGenerationResult,
  GenerationContext,
  DEFAULT_GENERATOR_OPTIONS
} from './types';
import { AttributeGenerator } from './attribute-generator';
import { BindingGenerator } from './binding-generator';
import { Formatter } from './formatter';
import { Validator } from './validator';

/**
 * WXML生成器主类
 * 负责将组件树转换为WXML代码
 */
export class WXMLGenerator {
  /** 默认选项 */
  private static readonly defaultOptions: Required<WXMLGeneratorOptions> = {
    indent: '  ',
    addComments: true,
    format: true,
    validate: true,
    selfClosingTags: ['input', 'image', 'import', 'include', 'progress', 'checkbox', 'radio'],
    useShortSyntax: false
  };

  /**
   * 从页面对象生成完整的WXML代码
   *
   * @param page 页面对象
   * @param options 生成选项
   * @returns 生成结果
   */
  static generate(page: Page, options: Partial<WXMLGeneratorOptions> = {}): WXMLGenerationResult {
    const startTime = Date.now();
    const opts = { ...this.defaultOptions, ...options };

    // 初始化上下文
    const context: GenerationContext = {
      indentLevel: 0,
      generatedIds: new Set(),
      errors: [],
      warnings: [],
      options: opts,
      parentStack: []
    };

    // 验证组件树
    if (opts.validate) {
      const validationResult = Validator.validateComponentTree(page.components);
      context.errors.push(...validationResult.errors);
      context.warnings.push(...validationResult.warnings);

      // 如果有错误，直接返回
      if (validationResult.errors.length > 0) {
        return {
          code: '',
          success: false,
          errors: context.errors,
          warnings: context.warnings,
          componentCount: 0,
          duration: Date.now() - startTime
        };
      }
    }

    // 生成WXML代码
    let wxml = '';

    // 添加文件头注释
    if (opts.addComments) {
      wxml += Formatter.addComment(`页面: ${page.name}`, 0, opts.indent) + '\n';
      wxml += Formatter.addComment(`路径: pages/${page.path}.wxml`, 0, opts.indent) + '\n';
      wxml += Formatter.addComment('此文件由WXML生成器自动生成', 0, opts.indent) + '\n\n';
    }

    // 生成组件代码
    try {
      wxml += this.generateComponents(page.components, context);
    } catch (error) {
      context.errors.push({
        code: 'GENERATION_ERROR',
        message: error instanceof Error ? error.message : String(error)
      });

      return {
        code: wxml,
        success: false,
        errors: context.errors,
        warnings: context.warnings,
        componentCount: context.generatedIds.size,
        duration: Date.now() - startTime
      };
    }

    // 格式化代码
    if (opts.format) {
      wxml = Formatter.format(wxml, {
        indent: opts.indent,
        preserveWhitespace: false
      });
    }

    // 验证生成的WXML
    if (opts.validate) {
      const wxmlValidation = Validator.validateWXML(wxml);
      context.errors.push(...wxmlValidation.errors);
      context.warnings.push(...wxmlValidation.warnings);
    }

    return {
      code: wxml,
      success: context.errors.length === 0,
      errors: context.errors,
      warnings: context.warnings,
      componentCount: context.generatedIds.size,
      duration: Date.now() - startTime
    };
  }

  /**
   * 生成组件列表
   *
   * @param components 组件列表
   * @param context 生成上下文
   * @returns WXML代码
   */
  private static generateComponents(components: Component[], context: GenerationContext): string {
    const parts: string[] = [];

    for (const component of components) {
      const code = this.generateComponent(component, context);
      if (code) {
        parts.push(code);
      }
    }

    return parts.join('\n');
  }

  /**
   * 生成单个组件
   *
   * @param component 组件对象
   * @param context 生成上下文
   * @returns WXML代码
   */
  private static generateComponent(component: Component, context: GenerationContext): string {
    // 检查ID是否重复
    if (context.generatedIds.has(component.id)) {
      context.errors.push({
        code: 'DUPLICATE_ID',
        message: `重复的组件ID: ${component.id}`,
        path: component.id
      });
      return '';
    }
    context.generatedIds.add(component.id);

    // 添加到父组件栈
    context.parentStack.push(component);

    const indent = Formatter.indent(context.indentLevel, context.options.indent);
    const tagName = component.type;

    // 生成属性
    const attributes = AttributeGenerator.generateAttributes(component);

    // 判断是否是自闭合标签
    const isSelfClosing = this.isSelfClosingComponent(component, context);

    let code = '';

    if (isSelfClosing) {
      // 自闭合标签
      code = `${indent}<${tagName}${attributes} />`;
    } else {
      // 有子元素的标签
      code = `${indent}<${tagName}${attributes}>`;

      // 处理子元素
      if (component.children.length > 0) {
        context.indentLevel++;
        const childrenCode = this.generateComponents(component.children, context);
        context.indentLevel--;

        if (childrenCode) {
          code += '\n' + childrenCode + '\n' + indent;
        }
      } else if (component.type === 'text') {
        // text 组件的文本内容
        const content = this.getTextContent(component);
        if (content) {
          code += content;
        }
      }

      code += `</${tagName}>`;
    }

    // 从父组件栈移除
    context.parentStack.pop();

    return code;
  }

  /**
   * 判断组件是否是自闭合标签
   *
   * @param component 组件对象
   * @param context 生成上下文
   * @returns 是否自闭合
   */
  private static isSelfClosingComponent(component: Component, context: GenerationContext): boolean {
    // 有子组件的不是自闭合
    if (component.children.length > 0) {
      return false;
    }

    // text 组件不是自闭合
    if (component.type === 'text') {
      return false;
    }

    // 检查是否在自闭合列表中
    return context.options.selfClosingTags.includes(component.type);
  }

  /**
   * 获取text组件的文本内容
   *
   * @param component 组件对象
   * @returns 文本内容
   */
  private static getTextContent(component: Component): string {
    // 从属性中查找content
    const contentProp = component.properties.find(p => p.name === 'content');
    if (contentProp) {
      return this.escapeTextContent(String(contentProp.value));
    }

    // 从数据绑定中查找
    const contentBinding = component.dataBindings?.find(b => b.property === 'content');
    if (contentBinding) {
      return BindingGenerator.toBindingExpression(contentBinding.dataPath);
    }

    return '';
  }

  /**
   * 转义文本内容
   *
   * @param text 文本内容
   * @returns 转义后的文本
   */
  private static escapeTextContent(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * 生成WXML并保存到字符串
   *
   * @param page 页面对象
   * @param options 生成选项
   * @returns WXML字符串
   */
  static generateToString(page: Page, options?: Partial<WXMLGeneratorOptions>): string {
    const result = this.generate(page, options);
    if (!result.success) {
      throw new Error(`WXML生成失败: ${result.errors.map(e => e.message).join(', ')}`);
    }
    return result.code;
  }

  /**
   * 批量生成多个页面的WXML
   *
   * @param pages 页面列表
   * @param options 生成选项
   * @returns 生成结果映射
   */
  static generateMultiple(
    pages: Page[],
    options?: Partial<WXMLGeneratorOptions>
  ): Map<string, WXMLGenerationResult> {
    const results = new Map<string, WXMLGenerationResult>();

    for (const page of pages) {
      const result = this.generate(page, options);
      results.set(page.path, result);
    }

    return results;
  }

  /**
   * 从组件生成WXML片段
   *
   * @param component 组件对象
   * @param options 生成选项
   * @returns WXML代码
   */
  static generateFragment(component: Component, options?: Partial<WXMLGeneratorOptions>): string {
    const opts = { ...this.defaultOptions, ...options };

    const context: GenerationContext = {
      indentLevel: 0,
      generatedIds: new Set(),
      errors: [],
      warnings: [],
      options: opts,
      parentStack: []
    };

    return this.generateComponent(component, context);
  }

  /**
   * 获取生成器版本
   *
   * @returns 版本号
   */
  static getVersion(): string {
    return '1.0.0';
  }
}
