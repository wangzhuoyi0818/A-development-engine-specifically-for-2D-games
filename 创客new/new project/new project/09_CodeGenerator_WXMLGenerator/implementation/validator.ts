/**
 * 验证器 - 验证组件树和生成的WXML的有效性
 *
 * 职责：
 * - 验证组件树结构
 * - 检查必填属性
 * - 检查嵌套规则
 * - 验证生成的WXML代码
 */

import type {
  Component,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../../../01_Core_ProjectStructure/implementation/types';
import { AttributeGenerator } from './attribute-generator';

/**
 * 微信小程序组件嵌套规则
 * 定义哪些组件可以嵌套在其他组件中
 */
const NESTING_RULES: Record<string, string[]> = {
  // view 可以包含任何组件
  view: [],

  // scroll-view 可以包含 view
  'scroll-view': ['view', 'text', 'image'],

  // swiper 只能包含 swiper-item
  swiper: ['swiper-item'],

  // swiper-item 可以包含任何组件
  'swiper-item': [],

  // movable-area 可以包含 movable-view
  'movable-area': ['movable-view'],

  // movable-view 可以包含任何组件
  'movable-view': [],

  // cover-view 可以包含 cover-view, cover-image, text
  'cover-view': ['cover-view', 'cover-image', 'text'],

  // form 可以包含 input, checkbox, radio, slider, switch, picker, textarea
  form: ['input', 'checkbox', 'radio', 'slider', 'switch', 'picker', 'textarea', 'text', 'view'],

  // text 不能包含任何组件（纯文本）
  text: [],

  // button 可以包含 text
  button: ['text'],

  // label 可以包含任何组件
  label: [],

  // map 不能包含其他组件
  map: [],

  // canvas 不能包含其他组件
  canvas: [],

  // video 不能包含其他组件
  video: [],

  // audio 不能包含其他组件
  audio: [],

  // image 不能包含其他组件
  image: [],

  // input 不能包含其他组件
  input: [],

  // textarea 不能包含其他组件
  textarea: [],

  // picker 不能包含其他组件
  picker: [],

  // checkbox 不能包含其他组件
  checkbox: [],

  // radio 不能包含其他组件
  radio: [],

  // slider 不能包含其他组件
  slider: [],

  // switch 不能包含其他组件
  switch: [],

  // progress 不能包含其他组件
  progress: []
};

/**
 * 验证器类
 * 负责验证组件树和WXML代码的有效性
 */
export class Validator {
  /**
   * 验证整个组件树
   *
   * @param components 组件列表
   * @returns 验证结果
   */
  static validateComponentTree(components: Component[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const seenIds = new Set<string>();

    for (const component of components) {
      this.validateComponentRecursive(component, errors, warnings, seenIds, null);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 递归验证单个组件
   *
   * @param component 组件对象
   * @param errors 错误收集器
   * @param warnings 警告收集器
   * @param seenIds 已见ID集合
   * @param parent 父组件
   */
  private static validateComponentRecursive(
    component: Component,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    seenIds: Set<string>,
    parent: Component | null
  ): void {
    // 1. 验证基本属性
    if (!component.id) {
      errors.push({
        code: 'MISSING_ID',
        message: '组件必须有ID',
        path: '未知'
      });
      return;
    }

    // 2. 检查ID重复
    if (seenIds.has(component.id)) {
      errors.push({
        code: 'DUPLICATE_ID',
        message: `重复的组件ID: ${component.id}`,
        path: component.id
      });
    }
    seenIds.add(component.id);

    // 3. 验证组件类型
    if (!component.type) {
      errors.push({
        code: 'MISSING_TYPE',
        message: '组件必须有类型',
        path: component.id
      });
      return;
    }

    // 4. 验证属性
    const attrErrors = AttributeGenerator.validateAttributes(component);
    errors.push(...attrErrors);

    // 5. 验证嵌套规则
    if (parent) {
      const nestingErrors = this.validateNesting(parent, component);
      errors.push(...nestingErrors);
    }

    // 6. 验证数据绑定
    const bindingErrors = this.validateDataBindings(component);
    errors.push(...bindingErrors);

    // 7. 验证条件渲染
    if (component.condition) {
      const conditionErrors = this.validateCondition(component);
      errors.push(...conditionErrors);
    }

    // 8. 验证列表渲染
    if (component.listRendering) {
      const listErrors = this.validateListRendering(component);
      errors.push(...listErrors);
    }

    // 9. 检查常见问题（警告）
    const commonWarnings = this.checkCommonIssues(component);
    warnings.push(...commonWarnings);

    // 10. 递归验证子组件
    for (const child of component.children) {
      this.validateComponentRecursive(child, errors, warnings, seenIds, component);
    }
  }

  /**
   * 验证父子嵌套规则
   *
   * @param parent 父组件
   * @param child 子组件
   * @returns 错误列表
   */
  private static validateNesting(parent: Component, child: Component): ValidationError[] {
    const errors: ValidationError[] = [];

    const rules = NESTING_RULES[parent.type];

    // 如果没有嵌套规则，表示不允许有子组件
    if (!rules || rules.length === 0) {
      if (parent.type !== 'view' && parent.type !== 'swiper-item' && parent.type !== 'label') {
        // 某些组件类型可能不支持子组件
        if (['text', 'image', 'input', 'button', 'map', 'canvas'].includes(parent.type)) {
          // 这些组件通常不允许子组件
          if (child.type !== 'text' && parent.type !== 'button') {
            errors.push({
              code: 'INVALID_NESTING',
              message: `${parent.type} 组件不能包含 ${child.type} 组件`,
              path: child.id
            });
          }
        }
      }
      return errors;
    }

    // 检查子组件是否在允许列表中
    if (rules.length > 0 && !rules.includes(child.type) && rules[0] !== '*') {
      errors.push({
        code: 'INVALID_NESTING',
        message: `${parent.type} 组件不能包含 ${child.type} 组件，允许的类型: ${rules.join(', ')}`,
        path: child.id
      });
    }

    return errors;
  }

  /**
   * 验证数据绑定
   *
   * @param component 组件对象
   * @returns 错误列表
   */
  private static validateDataBindings(component: Component): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const binding of component.dataBindings || []) {
      // 检查必要字段
      if (!binding.property) {
        errors.push({
          code: 'INVALID_BINDING',
          message: '数据绑定必须有property字段',
          path: component.id
        });
      }

      if (!binding.dataPath) {
        errors.push({
          code: 'INVALID_BINDING',
          message: '数据绑定必须有dataPath字段',
          path: component.id
        });
      }

      // 检查dataPath格式
      if (binding.dataPath && !this.isValidDataPath(binding.dataPath)) {
        errors.push({
          code: 'INVALID_DATA_PATH',
          message: `无效的数据路径: ${binding.dataPath}`,
          path: component.id
        });
      }
    }

    return errors;
  }

  /**
   * 验证条件渲染
   *
   * @param component 组件对象
   * @returns 错误列表
   */
  private static validateCondition(component: Component): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!component.condition) {
      return errors;
    }

    // 检查条件表达式
    if (typeof component.condition !== 'string') {
      errors.push({
        code: 'INVALID_CONDITION',
        message: '条件表达式必须是字符串',
        path: component.id
      });
      return errors;
    }

    const condition = component.condition.trim();
    if (condition.length === 0) {
      errors.push({
        code: 'EMPTY_CONDITION',
        message: '条件表达式不能为空',
        path: component.id
      });
    }

    return errors;
  }

  /**
   * 验证列表渲染
   *
   * @param component 组件对象
   * @returns 错误列表
   */
  private static validateListRendering(component: Component): ValidationError[] {
    const errors: ValidationError[] = [];

    const config = component.listRendering;
    if (!config) {
      return errors;
    }

    // 检查必要字段
    if (!config.dataSource) {
      errors.push({
        code: 'MISSING_DATA_SOURCE',
        message: '列表渲染必须指定数据源',
        path: component.id
      });
    }

    // 检查数据源格式
    if (config.dataSource && !this.isValidDataPath(config.dataSource)) {
      errors.push({
        code: 'INVALID_DATA_SOURCE',
        message: `无效的数据源: ${config.dataSource}`,
        path: component.id
      });
    }

    // 检查循环变量名
    if (config.itemName && !this.isValidVariableName(config.itemName)) {
      errors.push({
        code: 'INVALID_ITEM_NAME',
        message: `无效的循环项变量名: ${config.itemName}`,
        path: component.id
      });
    }

    return errors;
  }

  /**
   * 检查常见问题
   *
   * @param component 组件对象
   * @returns 警告列表
   */
  private static checkCommonIssues(component: Component): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // 警告1: text 组件没有内容
    if (component.type === 'text') {
      const hasContent = component.properties.some(p => p.name === 'content') ||
                         component.dataBindings?.some(b => b.property === 'content');
      if (!hasContent && component.children.length === 0) {
        warnings.push({
          code: 'EMPTY_TEXT',
          message: 'text 组件没有内容',
          path: component.id
        });
      }
    }

    // 警告2: button 组件没有文本
    if (component.type === 'button') {
      const hasText = component.children.some(c => c.type === 'text') ||
                      component.properties.some(p => p.name === 'content');
      if (!hasText) {
        warnings.push({
          code: 'EMPTY_BUTTON',
          message: 'button 组件建议包含文本内容',
          path: component.id
        });
      }
    }

    // 警告3: 组件有很多子组件
    if (component.children.length > 10) {
      warnings.push({
        code: 'TOO_MANY_CHILDREN',
        message: `组件有 ${component.children.length} 个子组件，考虑拆分`,
        path: component.id
      });
    }

    // 警告4: 检查是否有未使用的属性
    const unusedProps = this.findUnusedProperties(component);
    for (const prop of unusedProps) {
      warnings.push({
        code: 'UNUSED_PROPERTY',
        message: `属性 ${prop} 可能未使用`,
        path: component.id
      });
    }

    return warnings;
  }

  /**
   * 找出未使用的属性
   *
   * @param component 组件对象
   * @returns 未使用的属性列表
   */
  private static findUnusedProperties(component: Component): string[] {
    const unused: string[] = [];

    // 实现简单的启发式检查
    const allProps = component.properties.map(p => p.name);
    const knownProps = new Set([
      'id', 'class', 'style', 'content', 'value', 'placeholder',
      'type', 'checked', 'disabled', 'readonly', 'required'
    ]);

    for (const prop of allProps) {
      if (!knownProps.has(prop) && !component.dataBindings?.some(b => b.property === prop)) {
        unused.push(prop);
      }
    }

    return unused;
  }

  /**
   * 验证数据路径格式
   *
   * @param path 数据路径
   * @returns 是否有效
   */
  private static isValidDataPath(path: string): boolean {
    // 允许的格式: foo, foo.bar, foo[0], foo.bar[0].baz 等
    const pattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[\d+\])*$/;
    return pattern.test(path);
  }

  /**
   * 验证变量名
   *
   * @param name 变量名
   * @returns 是否有效
   */
  private static isValidVariableName(name: string): boolean {
    const pattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    return pattern.test(name);
  }

  /**
   * 验证生成的WXML代码
   *
   * @param wxml WXML代码
   * @returns 验证结果
   */
  static validateWXML(wxml: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!wxml || wxml.trim().length === 0) {
      errors.push({
        code: 'EMPTY_WXML',
        message: '生成的WXML代码为空'
      });
      return { valid: false, errors, warnings };
    }

    // 检查基本XML结构
    const tagRegex = /<\/?[a-zA-Z][a-zA-Z0-9-]*\s*[^>]*>/g;
    const tags = wxml.match(tagRegex) || [];

    let tagStack: string[] = [];

    for (const tag of tags) {
      if (tag.startsWith('</')) {
        // 结束标签
        const tagName = tag.match(/<\/([a-zA-Z][a-zA-Z0-9-]*)/)?.[1];
        if (!tagName) continue;

        if (tagStack.pop() !== tagName) {
          errors.push({
            code: 'UNMATCHED_TAG',
            message: `标签不匹配: ${tag}`
          });
        }
      } else if (tag.endsWith('/>')) {
        // 自闭合标签
        continue;
      } else {
        // 开始标签
        const tagName = tag.match(/<([a-zA-Z][a-zA-Z0-9-]*)/)?.[1];
        if (tagName) {
          tagStack.push(tagName);
        }
      }
    }

    if (tagStack.length > 0) {
      errors.push({
        code: 'UNCLOSED_TAG',
        message: `未关闭的标签: ${tagStack.join(', ')}`
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
