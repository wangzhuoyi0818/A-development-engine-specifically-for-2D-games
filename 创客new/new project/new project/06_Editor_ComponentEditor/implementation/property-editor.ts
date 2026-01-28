/**
 * 属性编辑器
 *
 * 负责组件属性的编辑、验证和数据绑定
 */

import {
  PropertyDefinition,
  PropertyEditorConfig,
  PropertyChange,
  ValidationResult,
  PropertyType,
  PropertyCondition,
} from './types';
import { wxComponentLibrary } from './component-library';

/**
 * 属性验证错误
 */
export class PropertyValidationError extends Error {
  constructor(
    public code: string,
    message: string,
    public property?: string,
  ) {
    super(message);
    this.name = 'PropertyValidationError';
  }
}

/**
 * 属性编辑器
 *
 * 负责管理组件属性的编辑、验证和变更追踪
 */
export class PropertyEditor {
  private config: PropertyEditorConfig;
  private changes: PropertyChange[] = [];
  private originalValues: Record<string, any> = {};

  constructor(config: PropertyEditorConfig) {
    this.config = config;
    this.originalValues = { ...config.values };
  }

  /**
   * 更新属性值
   */
  updateProperty(property: string, value: any): PropertyChange {
    const propDef = this.findProperty(property);
    if (!propDef) {
      throw new PropertyValidationError(
        'PROPERTY_NOT_FOUND',
        `属性 "${property}" 不存在`,
        property,
      );
    }

    // 验证属性值
    const validation = this.validateProperty(propDef, value);
    if (!validation.valid) {
      throw new PropertyValidationError(
        validation.code || 'VALIDATION_ERROR',
        validation.message || '属性值验证失败',
        property,
      );
    }

    const oldValue = this.config.values[property];
    this.config.values[property] = value;

    const change: PropertyChange = {
      componentId: this.config.componentId,
      property,
      oldValue,
      newValue: value,
      timestamp: new Date(),
    };

    this.changes.push(change);

    // 触发变更回调
    this.config.onChange?.(property, value);

    return change;
  }

  /**
   * 批量更新属性
   */
  updateProperties(values: Record<string, any>): PropertyChange[] {
    const changes: PropertyChange[] = [];

    Object.entries(values).forEach(([property, value]) => {
      try {
        const change = this.updateProperty(property, value);
        changes.push(change);
      } catch (error) {
        // 继续处理其他属性,但记录错误
        console.error(`更新属性 "${property}" 失败:`, error);
      }
    });

    return changes;
  }

  /**
   * 获取属性值
   */
  getPropertyValue(property: string): any {
    return this.config.values[property];
  }

  /**
   * 获取所有属性值
   */
  getAllValues(): Record<string, any> {
    return { ...this.config.values };
  }

  /**
   * 重置属性
   */
  resetProperty(property: string): PropertyChange {
    const originalValue = this.originalValues[property];
    return this.updateProperty(property, originalValue);
  }

  /**
   * 重置所有属性
   */
  resetAll(): PropertyChange[] {
    return this.updateProperties(this.originalValues);
  }

  /**
   * 获取变更历史
   */
  getChanges(): PropertyChange[] {
    return [...this.changes];
  }

  /**
   * 清空变更历史
   */
  clearChanges(): void {
    this.changes = [];
    this.originalValues = { ...this.config.values };
  }

  /**
   * 验证单个属性
   */
  private validateProperty(propDef: PropertyDefinition, value: any): ValidationResult {
    // 验证必填
    if (propDef.required && (value === null || value === undefined || value === '')) {
      return {
        valid: false,
        message: `"${propDef.label}" 是必填的`,
        code: 'REQUIRED_FIELD',
      };
    }

    if (value === null || value === undefined) {
      return { valid: true };
    }

    // 根据类型验证
    switch (propDef.type) {
      case PropertyType.String:
        return this.validateString(propDef, value);
      case PropertyType.Number:
        return this.validateNumber(propDef, value);
      case PropertyType.Boolean:
        return this.validateBoolean(propDef, value);
      case PropertyType.Color:
        return this.validateColor(propDef, value);
      case PropertyType.Enum:
        return this.validateEnum(propDef, value);
      default:
        return { valid: true };
    }
  }

  /**
   * 验证字符串属性
   */
  private validateString(propDef: PropertyDefinition, value: any): ValidationResult {
    if (typeof value !== 'string') {
      return {
        valid: false,
        message: `"${propDef.label}" 必须是字符串`,
        code: 'INVALID_TYPE',
      };
    }

    if (propDef.pattern) {
      const regex = new RegExp(propDef.pattern);
      if (!regex.test(value)) {
        return {
          valid: false,
          message: `"${propDef.label}" 格式不正确`,
          code: 'INVALID_FORMAT',
        };
      }
    }

    return { valid: true };
  }

  /**
   * 验证数字属性
   */
  private validateNumber(propDef: PropertyDefinition, value: any): ValidationResult {
    if (typeof value !== 'number') {
      // 尝试转换为数字
      const num = Number(value);
      if (isNaN(num)) {
        return {
          valid: false,
          message: `"${propDef.label}" 必须是数字`,
          code: 'INVALID_TYPE',
        };
      }
      value = num;
    }

    if (propDef.min !== undefined && value < propDef.min) {
      return {
        valid: false,
        message: `"${propDef.label}" 不能小于 ${propDef.min}`,
        code: 'VALUE_TOO_SMALL',
      };
    }

    if (propDef.max !== undefined && value > propDef.max) {
      return {
        valid: false,
        message: `"${propDef.label}" 不能大于 ${propDef.max}`,
        code: 'VALUE_TOO_LARGE',
      };
    }

    return { valid: true };
  }

  /**
   * 验证布尔值属性
   */
  private validateBoolean(propDef: PropertyDefinition, value: any): ValidationResult {
    if (typeof value !== 'boolean') {
      return {
        valid: false,
        message: `"${propDef.label}" 必须是布尔值`,
        code: 'INVALID_TYPE',
      };
    }

    return { valid: true };
  }

  /**
   * 验证颜色属性
   */
  private validateColor(propDef: PropertyDefinition, value: any): ValidationResult {
    if (typeof value !== 'string') {
      return {
        valid: false,
        message: `"${propDef.label}" 必须是字符串`,
        code: 'INVALID_TYPE',
      };
    }

    // 简单的颜色验证(支持 hex, rgb, rgba, 颜色名称)
    const colorRegex = /^(#([0-9A-Fa-f]{3}){1,2}|rgb\(.*\)|rgba\(.*\)|[a-z]+)$/i;
    if (!colorRegex.test(value)) {
      return {
        valid: false,
        message: `"${propDef.label}" 不是有效的颜色值`,
        code: 'INVALID_COLOR',
      };
    }

    return { valid: true };
  }

  /**
   * 验证枚举属性
   */
  private validateEnum(propDef: PropertyDefinition, value: any): ValidationResult {
    if (!propDef.options) {
      return { valid: true };
    }

    const validValues = propDef.options.map((opt) => opt.value);
    if (!validValues.includes(value)) {
      return {
        valid: false,
        message: `"${propDef.label}" 的值不在允许的选项中`,
        code: 'INVALID_ENUM_VALUE',
      };
    }

    return { valid: true };
  }

  /**
   * 找到属性定义
   */
  private findProperty(property: string): PropertyDefinition | undefined {
    return this.config.properties.find((prop) => prop.name === property);
  }

  /**
   * 检查属性是否满足条件
   */
  isPropertyVisible(property: string): boolean {
    const propDef = this.findProperty(property);
    if (!propDef) return false;

    if (propDef.visible === false) {
      return false;
    }

    // 检查条件显示
    if (propDef.visibleWhen) {
      return this.evaluateCondition(propDef.visibleWhen);
    }

    return true;
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: PropertyCondition): boolean {
    const value = this.config.values[condition.property];

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'notContains':
        return !String(value).includes(String(condition.value));
      default:
        return true;
    }
  }

  /**
   * 获取属性分组
   */
  getPropertyGroups(): string[] {
    const groups = new Set<string>();

    this.config.properties.forEach((prop) => {
      if (prop.group) {
        groups.add(prop.group);
      }
    });

    return Array.from(groups);
  }

  /**
   * 获取指定分组的属性
   */
  getPropertiesByGroup(group: string): PropertyDefinition[] {
    return this.config.properties.filter(
      (prop) => prop.group === group && this.isPropertyVisible(prop.name),
    );
  }

  /**
   * 导出为 JSON
   */
  toJSON(): string {
    return JSON.stringify({
      componentId: this.config.componentId,
      componentType: this.config.componentType,
      values: this.config.values,
      changes: this.changes,
    });
  }
}

/**
 * 属性编辑器工厂
 */
export class PropertyEditorFactory {
  /**
   * 为组件创建属性编辑器
   */
  static createEditor(
    componentId: string,
    componentType: string,
    values: Record<string, any>,
    onChange?: (property: string, value: any) => void,
  ): PropertyEditor {
    // 从组件库获取组件定义
    const component = wxComponentLibrary.getComponent(componentType);
    if (!component) {
      throw new Error(`组件类型 "${componentType}" 不存在`);
    }

    const config: PropertyEditorConfig = {
      componentId,
      componentType,
      properties: component.properties,
      values: values || {},
      onChange,
    };

    return new PropertyEditor(config);
  }
}
