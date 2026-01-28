/**
 * 组件验证器
 *
 * 验证组件属性、嵌套关系、必填属性等
 */

import {
  ComponentDefinition,
  PropertyDefinition,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ComponentValidationError,
} from './types';

/**
 * 组件验证器
 */
export class ComponentValidator {
  /**
   * 验证单个组件定义
   */
  validateComponentDefinition(component: ComponentDefinition): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 验证必填字段
    if (!component.id) {
      errors.push({
        code: 'MISSING_ID',
        message: '组件ID不能为空',
        path: 'id',
      });
    }

    if (!component.name) {
      errors.push({
        code: 'MISSING_NAME',
        message: '组件名称不能为空',
        path: 'name',
      });
    }

    if (!component.label) {
      errors.push({
        code: 'MISSING_LABEL',
        message: '组件显示名称不能为空',
        path: 'label',
      });
    }

    if (!component.category) {
      errors.push({
        code: 'MISSING_CATEGORY',
        message: '组件分类不能为空',
        path: 'category',
      });
    }

    // 验证ID格式
    if (component.id && !this.isValidComponentId(component.id)) {
      errors.push({
        code: 'INVALID_ID_FORMAT',
        message: '组件ID格式不符合规范（建议: wechat-component-name）',
        path: 'id',
        details: { id: component.id },
      });
    }

    // 验证名称格式
    if (component.name && !this.isValidComponentName(component.name)) {
      errors.push({
        code: 'INVALID_NAME_FORMAT',
        message: '组件名称格式不符合规范',
        path: 'name',
        details: { name: component.name },
      });
    }

    // 验证属性定义
    if (component.properties && Array.isArray(component.properties)) {
      component.properties.forEach((prop, index) => {
        const propErrors = this.validatePropertyDefinition(prop);
        propErrors.forEach((err) => {
          errors.push({
            ...err,
            path: `properties[${index}].${err.path || ''}`,
          });
        });
      });
    }

    // 验证事件定义
    if (component.events && Array.isArray(component.events)) {
      const eventNames = new Set<string>();
      component.events.forEach((event, index) => {
        if (!event.name) {
          errors.push({
            code: 'MISSING_EVENT_NAME',
            message: '事件名称不能为空',
            path: `events[${index}].name`,
          });
        } else if (eventNames.has(event.name)) {
          errors.push({
            code: 'DUPLICATE_EVENT_NAME',
            message: `事件名称重复: ${event.name}`,
            path: `events[${index}].name`,
          });
        } else {
          eventNames.add(event.name);
        }

        if (!event.label) {
          errors.push({
            code: 'MISSING_EVENT_LABEL',
            message: '事件显示名称不能为空',
            path: `events[${index}].label`,
          });
        }
      });
    }

    // 验证父子组件关系
    if (component.allowedParents && component.allowedChildren) {
      if (component.canHaveChildren === false && component.allowedChildren.length > 0) {
        warnings.push({
          code: 'CONFLICTING_CHILDREN_RESTRICTION',
          message: '组件不允许有子组件，但定义了allowedChildren',
          path: 'allowedChildren',
        });
      }
    }

    // 验证默认属性值
    if (component.defaultProperties) {
      const propNames = new Set(component.properties.map((p) => p.name));
      Object.keys(component.defaultProperties).forEach((key) => {
        if (!propNames.has(key)) {
          warnings.push({
            code: 'UNKNOWN_DEFAULT_PROPERTY',
            message: `默认属性'${key}'未在properties中定义`,
            path: `defaultProperties.${key}`,
          });
        }
      });
    }

    // 验证废弃配置
    if (component.deprecated && !component.deprecationMessage) {
      warnings.push({
        code: 'MISSING_DEPRECATION_MESSAGE',
        message: '组件被标记为废弃，但缺少废弃说明',
        path: 'deprecationMessage',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证属性定义
   */
  validatePropertyDefinition(property: PropertyDefinition): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!property.name) {
      errors.push({
        code: 'MISSING_PROPERTY_NAME',
        message: '属性名称不能为空',
        path: 'name',
      });
    }

    if (!property.label) {
      errors.push({
        code: 'MISSING_PROPERTY_LABEL',
        message: '属性显示名称不能为空',
        path: 'label',
      });
    }

    if (!property.type) {
      errors.push({
        code: 'MISSING_PROPERTY_TYPE',
        message: '属性类型不能为空',
        path: 'type',
      });
    }

    // 验证枚举类型必须有选项
    if (property.type === 'enum' && (!property.options || property.options.length === 0)) {
      errors.push({
        code: 'MISSING_ENUM_OPTIONS',
        message: '枚举类型属性必须定义options',
        path: 'options',
      });
    }

    // 验证数值范围
    if (property.type === 'number') {
      if (property.min !== undefined && property.max !== undefined && property.min > property.max) {
        errors.push({
          code: 'INVALID_NUMBER_RANGE',
          message: '最小值不能大于最大值',
          path: 'min',
          details: { min: property.min, max: property.max },
        });
      }
    }

    // 验证字符串长度范围
    if (property.type === 'string') {
      if (
        property.minLength !== undefined &&
        property.maxLength !== undefined &&
        property.minLength > property.maxLength
      ) {
        errors.push({
          code: 'INVALID_STRING_LENGTH_RANGE',
          message: '最小长度不能大于最大长度',
          path: 'minLength',
          details: { minLength: property.minLength, maxLength: property.maxLength },
        });
      }

      // 验证正则表达式
      if (property.pattern) {
        try {
          new RegExp(property.pattern);
        } catch (err) {
          errors.push({
            code: 'INVALID_REGEX_PATTERN',
            message: `正则表达式无效: ${(err as Error).message}`,
            path: 'pattern',
            details: { pattern: property.pattern },
          });
        }
      }
    }

    return errors;
  }

  /**
   * 验证组件属性值
   */
  validatePropertyValue(property: PropertyDefinition, value: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 如果值为空，检查是否必填
    if (value === null || value === undefined) {
      if (property.required) {
        errors.push({
          code: 'MISSING_REQUIRED_PROPERTY',
          message: `必填属性'${property.name}'不能为空`,
          path: property.name,
        });
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    // 验证类型
    const typeValidationResult = this.validatePropertyValueType(property, value);
    if (!typeValidationResult.valid) {
      errors.push(...typeValidationResult.errors);
    }

    // 验证范围
    if (property.type === 'number') {
      if (property.min !== undefined && value < property.min) {
        errors.push({
          code: 'VALUE_BELOW_MIN',
          message: `值${value}小于最小值${property.min}`,
          path: property.name,
        });
      }
      if (property.max !== undefined && value > property.max) {
        errors.push({
          code: 'VALUE_ABOVE_MAX',
          message: `值${value}大于最大值${property.max}`,
          path: property.name,
        });
      }
    }

    // 验证字符串长度
    if (property.type === 'string' && typeof value === 'string') {
      if (property.minLength !== undefined && value.length < property.minLength) {
        errors.push({
          code: 'STRING_BELOW_MIN_LENGTH',
          message: `字符串长度${value.length}小于最小长度${property.minLength}`,
          path: property.name,
        });
      }
      if (property.maxLength !== undefined && value.length > property.maxLength) {
        errors.push({
          code: 'STRING_ABOVE_MAX_LENGTH',
          message: `字符串长度${value.length}大于最大长度${property.maxLength}`,
          path: property.name,
        });
      }

      // 验证正则表达式
      if (property.pattern) {
        const regex = new RegExp(property.pattern);
        if (!regex.test(value)) {
          errors.push({
            code: 'PATTERN_MISMATCH',
            message: `值不符合正则表达式'${property.pattern}'`,
            path: property.name,
            details: { value, pattern: property.pattern },
          });
        }
      }
    }

    // 验证枚举选项
    if (property.type === 'enum' && property.options) {
      const validValues = property.options.map((opt) => opt.value);
      if (!validValues.includes(value)) {
        errors.push({
          code: 'INVALID_ENUM_VALUE',
          message: `'${value}'不是有效的枚举值`,
          path: property.name,
          details: { value, validValues },
        });
      }
    }

    // 调用自定义验证器
    if (property.validator) {
      const customResult = property.validator(value);
      if (!customResult.valid) {
        errors.push(...customResult.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证属性值类型
   */
  private validatePropertyValueType(
    property: PropertyDefinition,
    value: any
  ): ValidationResult {
    const errors: ValidationError[] = [];

    const expectedType = property.type;

    if (expectedType === 'string' && typeof value !== 'string') {
      errors.push({
        code: 'TYPE_MISMATCH',
        message: `属性'${property.name}'应为string类型，但收到${typeof value}`,
        path: property.name,
        details: { expected: 'string', received: typeof value },
      });
    } else if (expectedType === 'number' && typeof value !== 'number') {
      errors.push({
        code: 'TYPE_MISMATCH',
        message: `属性'${property.name}'应为number类型，但收到${typeof value}`,
        path: property.name,
        details: { expected: 'number', received: typeof value },
      });
    } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
      errors.push({
        code: 'TYPE_MISMATCH',
        message: `属性'${property.name}'应为boolean类型，但收到${typeof value}`,
        path: property.name,
        details: { expected: 'boolean', received: typeof value },
      });
    } else if (expectedType === 'array' && !Array.isArray(value)) {
      errors.push({
        code: 'TYPE_MISMATCH',
        message: `属性'${property.name}'应为array类型，但收到${typeof value}`,
        path: property.name,
        details: { expected: 'array', received: typeof value },
      });
    } else if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
      errors.push({
        code: 'TYPE_MISMATCH',
        message: `属性'${property.name}'应为object类型，但收到${typeof value}`,
        path: property.name,
        details: { expected: 'object', received: typeof value },
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * 验证组件嵌套关系
   */
  validateNestingRelationship(
    parentComponent: ComponentDefinition,
    childComponent: ComponentDefinition
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 检查父组件是否允许有子组件
    if (!parentComponent.canHaveChildren) {
      errors.push({
        code: 'PARENT_CANNOT_HAVE_CHILDREN',
        message: `组件'${parentComponent.name}'不允许有子组件`,
        path: 'parent.canHaveChildren',
        details: {
          parent: parentComponent.name,
          child: childComponent.name,
        },
      });
      return { valid: false, errors, warnings };
    }

    // 检查子组件是否被允许
    if (
      parentComponent.allowedChildren &&
      parentComponent.allowedChildren.length > 0 &&
      !parentComponent.allowedChildren.includes(childComponent.name)
    ) {
      errors.push({
        code: 'CHILD_NOT_ALLOWED',
        message: `组件'${parentComponent.name}'不允许包含'${childComponent.name}'子组件`,
        path: 'parent.allowedChildren',
        details: {
          parent: parentComponent.name,
          child: childComponent.name,
          allowedChildren: parentComponent.allowedChildren,
        },
      });
    }

    // 检查父组件是否被允许
    if (
      childComponent.allowedParents &&
      childComponent.allowedParents.length > 0 &&
      !childComponent.allowedParents.includes(parentComponent.name)
    ) {
      errors.push({
        code: 'PARENT_NOT_ALLOWED',
        message: `组件'${childComponent.name}'不允许在'${parentComponent.name}'中使用`,
        path: 'child.allowedParents',
        details: {
          parent: parentComponent.name,
          child: childComponent.name,
          allowedParents: childComponent.allowedParents,
        },
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证必填属性
   */
  validateRequiredProperties(
    component: ComponentDefinition,
    values: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const requiredProperties = component.properties.filter((prop) => prop.required);

    requiredProperties.forEach((prop) => {
      const value = values[prop.name];
      if (value === null || value === undefined || value === '') {
        errors.push({
          code: 'MISSING_REQUIRED_PROPERTY',
          message: `必填属性'${prop.label}'（${prop.name}）不能为空`,
          path: prop.name,
          details: { propertyName: prop.name, propertyLabel: prop.label },
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证条件显示
   */
  validateConditionalVisibility(
    property: PropertyDefinition,
    values: Record<string, any>
  ): boolean {
    if (!property.visibleWhen) {
      return true;
    }

    const condition = property.visibleWhen;
    const conditionValue = values[condition.property];

    switch (condition.operator) {
      case 'equals':
        return conditionValue === condition.value;
      case 'notEquals':
        return conditionValue !== condition.value;
      case 'contains':
        return String(conditionValue).includes(String(condition.value));
      case 'notContains':
        return !String(conditionValue).includes(String(condition.value));
      case 'greaterThan':
        return conditionValue > condition.value;
      case 'lessThan':
        return conditionValue < condition.value;
      default:
        return true;
    }
  }

  /**
   * 验证组件ID格式
   */
  private isValidComponentId(id: string): boolean {
    return /^[a-z0-9\-_]+$/.test(id);
  }

  /**
   * 验证组件名称格式
   */
  private isValidComponentName(name: string): boolean {
    return /^[a-z0-9\-_]+$/.test(name);
  }

  /**
   * 批量验证组件定义
   */
  validateComponentDefinitions(components: ComponentDefinition[]): Map<string, ValidationResult> {
    const results = new Map<string, ValidationResult>();

    components.forEach((component) => {
      const result = this.validateComponentDefinition(component);
      results.set(component.id, result);

      if (!result.valid) {
        throw new ComponentValidationError(`组件定义验证失败: ${component.id}`, result);
      }
    });

    return results;
  }

  /**
   * 验证所有组件属性值
   */
  validateAllPropertyValues(
    component: ComponentDefinition,
    values: Record<string, any>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    component.properties.forEach((prop) => {
      const result = this.validatePropertyValue(prop, values[prop.name]);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * 创建全局验证器实例
 */
export const createComponentValidator = (): ComponentValidator => {
  return new ComponentValidator();
};

/**
 * 快速验证组件定义
 */
export function quickValidateComponent(component: ComponentDefinition): ValidationResult {
  const validator = new ComponentValidator();
  return validator.validateComponentDefinition(component);
}

/**
 * 快速验证属性值
 */
export function quickValidatePropertyValue(
  property: PropertyDefinition,
  value: any
): ValidationResult {
  const validator = new ComponentValidator();
  return validator.validatePropertyValue(property, value);
}
