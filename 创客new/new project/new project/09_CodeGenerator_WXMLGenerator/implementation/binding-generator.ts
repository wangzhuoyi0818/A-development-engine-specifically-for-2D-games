/**
 * 绑定生成器 - 处理数据绑定和事件绑定
 *
 * 职责：
 * - 将变量路径转换为WXML绑定语法
 * - 处理表达式求值
 * - 处理条件和循环的绑定
 */

import type {
  DataBinding,
  ComponentEvent,
  ListRenderingConfig
} from '../../../01_Core_ProjectStructure/implementation/types';
import type {
  BindingType,
  BindingExpression
} from './types';

/**
 * 绑定生成器
 * 负责将数据绑定转换为WXML绑定语法
 */
export class BindingGenerator {
  /**
   * 生成数据绑定表达式
   *
   * @param dataPath 数据路径（如 "user.name"）
   * @returns 绑定表达式（如 "{{user.name}}"）
   */
  static toBindingExpression(dataPath: string): string {
    // 如果已经是绑定表达式，直接返回
    if (dataPath.startsWith('{{') && dataPath.endsWith('}}')) {
      return dataPath;
    }

    // 转换为绑定表达式
    return `{{${dataPath}}}`;
  }

  /**
   * 生成数据绑定属性字符串
   *
   * @param binding 数据绑定对象
   * @returns 属性字符串
   */
  static generateDataBinding(binding: DataBinding): string {
    const { property, dataPath, mode } = binding;

    if (mode === 'twoWay') {
      // 双向绑定
      return `model:${property}="${this.toBindingExpression(dataPath)}"`;
    } else {
      // 单向绑定
      return `${property}="${this.toBindingExpression(dataPath)}"`;
    }
  }

  /**
   * 生成事件绑定属性字符串
   *
   * @param event 事件对象
   * @param componentId 组件ID
   * @returns 属性字符串
   */
  static generateEventBinding(event: ComponentEvent, componentId: string): string {
    const eventName = event.name;
    const handlerName = event.handler || this.generateEventHandlerName(componentId, eventName);

    // 判断事件类型（bind 或 catch）
    const eventPrefix = this.getEventPrefix(eventName);

    return `${eventPrefix}="${handlerName}"`;
  }

  /**
   * 生成条件渲染属性
   *
   * @param condition 条件表达式
   * @returns 属性字符串
   */
  static generateConditionalAttributes(condition: string): string {
    return `wx:if="${this.toBindingExpression(condition)}"`;
  }

  /**
   * 生成列表渲染属性
   *
   * @param config 列表渲染配置
   * @returns 属性字符串数组
   */
  static generateListAttributes(config: ListRenderingConfig): string[] {
    const attrs: string[] = [];

    // wx:for 属性
    attrs.push(`wx:for="${this.toBindingExpression(config.dataSource)}"`);

    // wx:for-item 属性
    const itemName = config.itemName || 'item';
    attrs.push(`wx:for-item="${itemName}"`);

    // wx:for-index 属性
    if (config.indexName) {
      attrs.push(`wx:for-index="${config.indexName}"`);
    }

    // wx:key 属性
    if (config.key) {
      attrs.push(`wx:key="${config.key}"`);
    } else {
      // 默认使用 *this
      attrs.push(`wx:key="*this"`);
    }

    return attrs;
  }

  /**
   * 生成事件处理函数名
   *
   * @param componentId 组件ID
   * @param eventName 事件名
   * @returns 处理函数名
   */
  private static generateEventHandlerName(componentId: string, eventName: string): string {
    // 格式：on{ComponentId}{EventName}
    // 例如：onButton1Tap
    const cleanComponentId = this.toPascalCase(componentId);
    const cleanEventName = this.toPascalCase(eventName);
    return `on${cleanComponentId}${cleanEventName}`;
  }

  /**
   * 获取事件前缀
   *
   * @param eventName 事件名
   * @returns 事件前缀（bind 或 catch）
   */
  private static getEventPrefix(eventName: string): string {
    // 默认使用 bind 前缀
    if (eventName.startsWith('bind')) {
      return eventName;
    }
    if (eventName.startsWith('catch')) {
      return eventName;
    }
    // 为常见事件添加 bind 前缀
    return `bind${eventName}`;
  }

  /**
   * 转换为帕斯卡命名法
   *
   * @param str 输入字符串
   * @returns 帕斯卡命名法字符串
   */
  private static toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * 验证绑定表达式
   *
   * @param expression 绑定表达式
   * @returns 是否有效
   */
  static isValidBinding(expression: string): boolean {
    // 检查是否是有效的绑定语法
    if (!expression) {
      return false;
    }

    // 检查双花括号格式
    if (expression.startsWith('{{') && expression.endsWith('}}')) {
      const content = expression.slice(2, -2).trim();
      return content.length > 0;
    }

    // 普通变量路径
    return /^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(expression);
  }

  /**
   * 提取绑定表达式中的变量名
   *
   * @param expression 绑定表达式
   * @returns 变量名列表
   */
  static extractVariables(expression: string): string[] {
    const variables: string[] = [];

    // 移除 {{ }}
    let content = expression;
    if (content.startsWith('{{') && content.endsWith('}}')) {
      content = content.slice(2, -2);
    }

    // 匹配变量名（简单实现，可扩展）
    const matches = content.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/g);
    if (matches) {
      variables.push(...matches);
    }

    return [...new Set(variables)]; // 去重
  }

  /**
   * 判断是否是表达式绑定
   *
   * @param expression 表达式
   * @returns 是否是表达式
   */
  static isExpression(expression: string): boolean {
    // 简单判断：包含运算符或函数调用
    const operators = ['+', '-', '*', '/', '>', '<', '=', '!', '?', ':', '(', ')'];
    return operators.some(op => expression.includes(op));
  }

  /**
   * 格式化绑定表达式
   *
   * @param expression 表达式
   * @returns 格式化后的表达式
   */
  static formatExpression(expression: string): string {
    // 移除多余的空格
    let formatted = expression.replace(/\s+/g, ' ').trim();

    // 确保有双花括号
    if (!formatted.startsWith('{{')) {
      formatted = `{{${formatted}}}`;
    }

    return formatted;
  }

  /**
   * 生成复合绑定表达式
   * 例如：将多个变量组合成一个表达式
   *
   * @param variables 变量列表
   * @param template 模板字符串
   * @returns 绑定表达式
   */
  static generateCompositeBinding(variables: string[], template: string): string {
    // 替换模板中的变量占位符
    let result = template;
    variables.forEach((variable, index) => {
      result = result.replace(`{${index}}`, variable);
    });

    return this.toBindingExpression(result);
  }

  /**
   * 转换计算属性
   *
   * @param expression 计算表达式
   * @returns 绑定表达式
   */
  static toComputedBinding(expression: string): string {
    // 确保表达式格式正确
    const cleaned = expression.trim();

    // 如果是简单的变量访问，直接返回
    if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(cleaned)) {
      return this.toBindingExpression(cleaned);
    }

    // 如果是表达式，保持原样
    return this.toBindingExpression(cleaned);
  }
}
