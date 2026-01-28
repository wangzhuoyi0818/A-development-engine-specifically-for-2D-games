/**
 * 属性生成器 - 处理组件属性到WXML属性字符串的转换
 *
 * 职责：
 * - 生成组件属性字符串
 * - 处理特殊属性（data-*等）
 * - 转义属性值
 * - 区分静态和动态属性
 */

import type {
  Component,
  ComponentProperty,
  ValidationError
} from '../../../01_Core_ProjectStructure/implementation/types';
import type {
  AttributeGenerationResult,
  AttributeType
} from './types';

/**
 * 微信小程序内置组件的必填属性
 */
const REQUIRED_ATTRIBUTES: Record<string, string[]> = {
  button: [],
  input: [],
  image: ['src'],
  video: ['src'],
  audio: ['src'],
  map: [],
  form: [],
  slider: [],
  switch: [],
  picker: [],
  textarea: [],
  scroll_view: []
};

/**
 * 微信小程序内置的自闭合组件
 */
const SELF_CLOSING_TAGS = new Set([
  'input',
  'image',
  'import',
  'include',
  'progress',
  'checkbox',
  'radio'
]);

/**
 * 属性生成器
 * 负责将组件属性转换为WXML属性字符串
 */
export class AttributeGenerator {
  /**
   * 生成组件的所有属性字符串
   *
   * @param component 组件对象
   * @returns 属性字符串（包括前面的空格）
   */
  static generateAttributes(component: Component): string {
    const parts: string[] = [];

    // 1. 生成ID属性
    if (component.id) {
      parts.push(this.generateId(component.id));
    }

    // 2. 生成普通属性
    for (const prop of component.properties) {
      const attr = this.generateProperty(prop);
      if (attr) {
        parts.push(attr);
      }
    }

    // 3. 生成数据绑定属性
    for (const binding of component.dataBindings || []) {
      const attr = this.generateDataBindingAttribute(binding);
      if (attr) {
        parts.push(attr);
      }
    }

    // 4. 生成事件绑定属性
    for (const event of component.events) {
      const attr = this.generateEventAttribute(event, component.id);
      if (attr) {
        parts.push(attr);
      }
    }

    // 5. 生成条件渲染属性
    if (component.condition) {
      parts.push(`wx:if="{{${this.escapeAttributeValue(component.condition)}}}"`);
    }

    // 6. 生成列表渲染属性
    if (component.listRendering) {
      const listAttrs = this.generateListRenderingAttributes(component.listRendering);
      parts.push(...listAttrs);
    }

    // 7. 生成样式类属性
    if (component.style && Object.keys(component.style).length > 0) {
      parts.push(`class="${this.generateStyleClassName(component.id)}"`);
    }

    return parts.length > 0 ? ' ' + parts.join(' ') : '';
  }

  /**
   * 生成单个属性字符串
   *
   * @param property 属性对象
   * @returns 属性字符串
   */
  static generateProperty(property: ComponentProperty): string {
    // 跳过某些特殊属性
    if (property.name === 'content') {
      return '';
    }

    // 跳过绑定标记的属性（通过dataBindings处理）
    if (property.isBinding) {
      return '';
    }

    const value = this.escapeAttributeValue(String(property.value));
    return `${property.name}="${value}"`;
  }

  /**
   * 生成ID属性
   *
   * @param id 组件ID
   * @returns 属性字符串
   */
  private static generateId(id: string): string {
    const escapedId = this.escapeAttributeValue(id);
    return `id="${escapedId}"`;
  }

  /**
   * 生成数据绑定属性
   *
   * @param binding 数据绑定对象
   * @returns 属性字符串
   */
  private static generateDataBindingAttribute(binding: any): string {
    const { property, dataPath, mode } = binding;

    if (mode === 'twoWay') {
      // 双向绑定使用 model: 前缀
      return `model:${property}="{{${this.escapeAttributeValue(dataPath)}}}"`;
    } else {
      // 单向绑定
      return `${property}="{{${this.escapeAttributeValue(dataPath)}}}"`;
    }
  }

  /**
   * 生成事件属性
   *
   * @param event 事件对象
   * @param componentId 组件ID（用于生成处理函数名）
   * @returns 属性字符串
   */
  private static generateEventAttribute(event: any, componentId: string): string {
    const eventName = event.name;
    // 生成事件处理函数名：on{ComponentId}{EventName}
    const handlerName = `on${this.toPascalCase(componentId)}${this.toPascalCase(eventName)}`;
    const eventPrefix = eventName === 'tap' ? 'bindtap' : `bind${eventName}`;

    return `${eventPrefix}="${handlerName}"`;
  }

  /**
   * 生成列表渲染属性
   *
   * @param config 列表渲染配置
   * @returns 属性字符串数组
   */
  private static generateListRenderingAttributes(config: any): string[] {
    const attrs: string[] = [];

    attrs.push(`wx:for="{{${this.escapeAttributeValue(config.dataSource)}}}"`);

    if (config.itemName) {
      attrs.push(`wx:for-item="${config.itemName}"`);
    }

    if (config.indexName) {
      attrs.push(`wx:for-index="${config.indexName}"`);
    }

    if (config.key) {
      attrs.push(`wx:key="${config.key}"`);
    }

    return attrs;
  }

  /**
   * 生成样式类名
   *
   * @param componentId 组件ID
   * @returns 类名
   */
  private static generateStyleClassName(componentId: string): string {
    // 将驼峰式ID转换为类名
    return componentId.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * 转义属性值
   * 处理特殊字符：", <, >, &
   *
   * @param value 属性值
   * @returns 转义后的值
   */
  static escapeAttributeValue(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * 验证属性
   *
   * @param component 组件对象
   * @returns 验证错误列表
   */
  static validateAttributes(component: Component): ValidationError[] {
    const errors: ValidationError[] = [];

    // 检查必填属性
    const requiredAttrs = REQUIRED_ATTRIBUTES[component.type] || [];
    for (const requiredAttr of requiredAttrs) {
      const hasAttr = component.properties.some(p => p.name === requiredAttr) ||
                      component.dataBindings?.some(b => b.property === requiredAttr);

      if (!hasAttr) {
        errors.push({
          code: 'MISSING_REQUIRED_ATTRIBUTE',
          message: `组件 ${component.type} 缺少必填属性: ${requiredAttr}`,
          path: component.id
        });
      }
    }

    // 检查属性值有效性
    for (const prop of component.properties) {
      if (!this.isValidPropertyValue(component.type, prop.name, prop.value)) {
        errors.push({
          code: 'INVALID_PROPERTY_VALUE',
          message: `组件 ${component.type} 的属性 ${prop.name} 值无效: ${prop.value}`,
          path: component.id
        });
      }
    }

    return errors;
  }

  /**
   * 判断属性值是否有效
   *
   * @param componentType 组件类型
   * @param propertyName 属性名
   * @param value 属性值
   * @returns 是否有效
   */
  private static isValidPropertyValue(
    componentType: string,
    propertyName: string,
    value: any
  ): boolean {
    // 基本验证
    if (value === null || value === undefined) {
      return false;
    }

    // 组件特定属性验证
    if (componentType === 'button' && propertyName === 'type') {
      return ['default', 'primary', 'warn'].includes(String(value));
    }

    if (componentType === 'input' && propertyName === 'type') {
      return ['text', 'number', 'idcard', 'digit'].includes(String(value));
    }

    return true;
  }

  /**
   * 是否是自闭合标签
   *
   * @param componentType 组件类型
   * @returns 是否自闭合
   */
  static isSelfClosing(componentType: string): boolean {
    return SELF_CLOSING_TAGS.has(componentType);
  }
}
