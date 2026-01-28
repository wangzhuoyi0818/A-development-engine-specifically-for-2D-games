/**
 * 条件编辑器
 *
 * 提供条件的编辑功能,包括:
 * - 条件类型选择
 * - 参数编辑
 * - 条件组合 (AND/OR)
 * - 条件反转
 */

import { v4 as uuid } from 'uuid';
import {
  Condition,
  Expression,
  ValidationError,
} from '../../02_Core_EventSystem/implementation/types';
import {
  ConditionTypeMetadata,
  ParameterEditConfig,
  OperationResult,
  ExpressionValidationResult,
} from './types';

/**
 * 条件编辑器
 */
export class ConditionEditor {
  private availableConditionTypes: Map<string, ConditionTypeMetadata> = new Map();

  constructor(conditionTypes: ConditionTypeMetadata[] = []) {
    this.registerConditionTypes(conditionTypes);
  }

  // ============================================================================
  // 条件类型注册
  // ============================================================================

  /**
   * 注册条件类型
   */
  registerConditionType(metadata: ConditionTypeMetadata): void {
    this.availableConditionTypes.set(metadata.type, metadata);
  }

  /**
   * 批量注册条件类型
   */
  registerConditionTypes(metadataList: ConditionTypeMetadata[]): void {
    for (const metadata of metadataList) {
      this.registerConditionType(metadata);
    }
  }

  /**
   * 获取所有可用的条件类型
   */
  getAvailableConditionTypes(): ConditionTypeMetadata[] {
    return Array.from(this.availableConditionTypes.values());
  }

  /**
   * 根据类型获取条件元数据
   */
  getConditionTypeMetadata(type: string): ConditionTypeMetadata | null {
    return this.availableConditionTypes.get(type) || null;
  }

  // ============================================================================
  // 条件创建
  // ============================================================================

  /**
   * 创建新条件
   */
  createCondition(type: string): OperationResult<Condition> {
    const metadata = this.getConditionTypeMetadata(type);
    if (!metadata) {
      return {
        success: false,
        error: {
          code: 'UNKNOWN_CONDITION_TYPE',
          message: `未知的条件类型: ${type}`,
        },
      };
    }

    // 创建默认参数
    const parameters: Expression[] = metadata.parameters.map((param) => ({
      value: param.defaultValue?.toString() || '',
      type: this.inferExpressionType(param.type),
    }));

    const condition: Condition = {
      id: uuid(),
      type: type as any,
      parameters,
      inverted: false,
    };

    return {
      success: true,
      data: condition,
    };
  }

  /**
   * 克隆条件
   */
  cloneCondition(condition: Condition): Condition {
    return JSON.parse(JSON.stringify({
      ...condition,
      id: uuid(),
    }));
  }

  // ============================================================================
  // 条件组合
  // ============================================================================

  /**
   * 创建复合条件 (AND/OR)
   */
  createCompositeCondition(
    operator: 'AND' | 'OR',
    subConditions: Condition[] = [],
  ): Condition {
    return {
      id: uuid(),
      type: 'logical',
      parameters: [],
      subConditions,
      logicalOperator: operator,
    };
  }

  /**
   * 添加子条件到复合条件
   */
  addSubCondition(
    compositeCondition: Condition,
    subCondition: Condition,
  ): OperationResult {
    if (!compositeCondition.subConditions) {
      compositeCondition.subConditions = [];
    }

    compositeCondition.subConditions.push(subCondition);

    return { success: true };
  }

  /**
   * 删除子条件
   */
  removeSubCondition(
    compositeCondition: Condition,
    subConditionId: string,
  ): OperationResult {
    if (!compositeCondition.subConditions) {
      return {
        success: false,
        error: {
          code: 'NO_SUBCONDITIONS',
          message: '该条件没有子条件',
        },
      };
    }

    const index = compositeCondition.subConditions.findIndex((c) => c.id === subConditionId);
    if (index === -1) {
      return {
        success: false,
        error: {
          code: 'SUBCONDITION_NOT_FOUND',
          message: `未找到子条件: ${subConditionId}`,
        },
      };
    }

    compositeCondition.subConditions.splice(index, 1);

    return { success: true };
  }

  // ============================================================================
  // 条件验证
  // ============================================================================

  /**
   * 验证条件
   */
  validateCondition(condition: Condition): ExpressionValidationResult {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];

    // 检查条件类型
    const metadata = this.getConditionTypeMetadata(condition.type);
    if (!metadata) {
      errors.push({
        code: 'UNKNOWN_CONDITION_TYPE',
        message: `未知的条件类型: ${condition.type}`,
      });
      return { valid: false, errors, warnings };
    }

    // 检查参数数量
    if (metadata.parameters.length !== condition.parameters.length) {
      errors.push({
        code: 'PARAMETER_COUNT_MISMATCH',
        message: `参数数量不匹配: 期望 ${metadata.parameters.length}, 实际 ${condition.parameters.length}`,
      });
    }

    // 验证每个参数
    for (let i = 0; i < metadata.parameters.length; i++) {
      const paramConfig = metadata.parameters[i];
      const paramValue = condition.parameters[i];

      if (!paramConfig.optional && (!paramValue || !paramValue.value)) {
        errors.push({
          code: 'REQUIRED_PARAMETER_MISSING',
          message: `必需参数缺失: ${paramConfig.name}`,
          path: `parameters[${i}]`,
        });
      }

      // 验证参数类型 (简化版)
      if (paramValue && paramValue.value) {
        const validationResult = this.validateParameter(paramValue, paramConfig);
        errors.push(
          ...validationResult.errors.map((e) => ({
            ...e,
            path: `parameters[${i}]`,
          })),
        );
      }
    }

    // 验证子条件
    if (condition.subConditions) {
      for (let i = 0; i < condition.subConditions.length; i++) {
        const subResult = this.validateCondition(condition.subConditions[i]);
        errors.push(
          ...subResult.errors.map((e) => ({
            ...e,
            path: `subConditions[${i}]${e.path ? '.' + e.path : ''}`,
          })),
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证参数
   */
  private validateParameter(
    expression: Expression,
    config: ParameterEditConfig,
  ): ExpressionValidationResult {
    const errors: ValidationError[] = [];
    const warnings: any[] = [];

    // 检查是否为空
    if (!expression.value || expression.value.trim() === '') {
      if (!config.optional) {
        errors.push({
          code: 'EMPTY_PARAMETER',
          message: `参数 ${config.name} 不能为空`,
        });
      }
      return { valid: errors.length === 0, errors, warnings };
    }

    // 正则验证 (仅字符串类型)
    if (config.type === 'string' && config.pattern) {
      const regex = new RegExp(config.pattern);
      if (!regex.test(expression.value)) {
        errors.push({
          code: 'PATTERN_MISMATCH',
          message: `参数 ${config.name} 格式不正确`,
        });
      }
    }

    // 数值范围验证
    if (config.type === 'number') {
      const numValue = Number(expression.value);
      if (isNaN(numValue)) {
        errors.push({
          code: 'INVALID_NUMBER',
          message: `参数 ${config.name} 必须是有效的数字`,
        });
      } else {
        if (config.min !== undefined && numValue < config.min) {
          errors.push({
            code: 'VALUE_TOO_SMALL',
            message: `参数 ${config.name} 必须大于等于 ${config.min}`,
          });
        }
        if (config.max !== undefined && numValue > config.max) {
          errors.push({
            code: 'VALUE_TOO_LARGE',
            message: `参数 ${config.name} 必须小于等于 ${config.max}`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  /**
   * 推断表达式类型
   */
  private inferExpressionType(paramType: string): 'literal' | 'variable' | 'expression' {
    if (paramType === 'variable') {
      return 'variable';
    }
    if (paramType === 'expression') {
      return 'expression';
    }
    return 'literal';
  }
}

/**
 * 默认的条件类型元数据
 */
export const DEFAULT_CONDITION_TYPES: ConditionTypeMetadata[] = [
  // 比较条件
  {
    type: 'comparison',
    label: '比较',
    description: '比较两个值',
    icon: 'compare',
    category: '基本',
    parameters: [
      { name: '左值', type: 'expression', description: '要比较的左值' },
      { name: '操作符', type: 'string', description: '比较操作符', enumValues: [
        { label: '等于 (==)', value: '==' },
        { label: '不等于 (!=)', value: '!=' },
        { label: '大于 (>)', value: '>' },
        { label: '小于 (<)', value: '<' },
        { label: '大于等于 (>=)', value: '>=' },
        { label: '小于等于 (<=)', value: '<=' },
      ] },
      { name: '右值', type: 'expression', description: '要比较的右值' },
    ],
    example: 'data.count > 10',
  },
  // 变量条件
  {
    type: 'variable',
    label: '变量为真',
    description: '检查变量是否为真',
    icon: 'check',
    category: '变量',
    parameters: [
      { name: '变量名', type: 'variable', description: '要检查的变量' },
    ],
    example: 'data.isActive',
  },
  // 字符串条件
  {
    type: 'string',
    label: '字符串包含',
    description: '检查字符串是否包含子串',
    icon: 'text',
    category: '字符串',
    parameters: [
      { name: '字符串', type: 'expression', description: '要检查的字符串' },
      { name: '子串', type: 'string', description: '要查找的子串' },
    ],
    example: 'data.name 包含 "test"',
  },
];
