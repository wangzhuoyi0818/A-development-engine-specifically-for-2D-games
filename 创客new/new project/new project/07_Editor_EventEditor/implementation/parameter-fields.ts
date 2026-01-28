/**
 * 参数字段组件
 *
 * 提供各种参数输入组件:
 * - TextInput: 文本输入
 * - NumberInput: 数字输入
 * - Select: 选择框
 * - VariablePicker: 变量选择器
 * - ExpressionEditor: 表达式编辑器
 */

import { Expression, Variable } from '../../02_Core_EventSystem/implementation/types';
import { ParameterEditConfig, ParameterValueSource } from './types';

/**
 * 参数值管理器
 */
export class ParameterFieldManager {
  /**
   * 创建默认表达式
   */
  createDefaultExpression(
    config: ParameterEditConfig,
    source: ParameterValueSource = 'constant',
  ): Expression {
    return {
      value: config.defaultValue?.toString() || '',
      type: this.getExpressionType(source, config.type),
    };
  }

  /**
   * 切换参数值来源
   */
  switchValueSource(
    current: Expression,
    newSource: ParameterValueSource,
    config: ParameterEditConfig,
  ): Expression {
    return {
      value: current.value || '',
      type: this.getExpressionType(newSource, config.type),
    };
  }

  /**
   * 验证参数值
   */
  validateValue(value: string, config: ParameterEditConfig): { valid: boolean; error?: string } {
    if (!config.optional && !value) {
      return { valid: false, error: '该参数不能为空' };
    }

    if (config.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        return { valid: false, error: '必须是有效的数字' };
      }
      if (config.min !== undefined && num < config.min) {
        return { valid: false, error: `必须大于等于 ${config.min}` };
      }
      if (config.max !== undefined && num > config.max) {
        return { valid: false, error: `必须小于等于 ${config.max}` };
      }
    }

    if (config.pattern) {
      const regex = new RegExp(config.pattern);
      if (!regex.test(value)) {
        return { valid: false, error: '格式不正确' };
      }
    }

    return { valid: true };
  }

  /**
   * 格式化显示值
   */
  formatDisplayValue(expression: Expression, variables: Variable[]): string {
    if (expression.type === 'variable') {
      const variable = variables.find((v) => v.name === expression.value);
      return variable ? `{{${variable.name}}}` : expression.value;
    }

    if (expression.type === 'expression') {
      return `= ${expression.value}`;
    }

    return expression.value;
  }

  /**
   * 推断表达式类型
   */
  private getExpressionType(
    source: ParameterValueSource,
    configType: string,
  ): 'literal' | 'variable' | 'expression' {
    if (source === 'variable') {
      return 'variable';
    }
    if (source === 'expression') {
      return 'expression';
    }
    return 'literal';
  }
}

/**
 * 变量选择器
 */
export class VariablePicker {
  /**
   * 过滤变量
   */
  filterVariables(
    variables: Variable[],
    searchTerm: string,
    filterType?: string,
  ): Variable[] {
    return variables.filter((v) => {
      const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (v.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !filterType || v.type === filterType;
      return matchesSearch && matchesType;
    });
  }

  /**
   * 按作用域分组
   */
  groupByScope(variables: Variable[]): Record<string, Variable[]> {
    return variables.reduce((groups, variable) => {
      const scope = this.inferScope(variable.name);
      if (!groups[scope]) {
        groups[scope] = [];
      }
      groups[scope].push(variable);
      return groups;
    }, {} as Record<string, Variable[]>);
  }

  /**
   * 推断变量作用域
   */
  private inferScope(variableName: string): string {
    if (variableName.startsWith('global.')) {
      return '全局变量';
    }
    if (variableName.startsWith('data.')) {
      return '页面数据';
    }
    return '局部变量';
  }
}

/**
 * 表达式编辑器辅助类
 */
export class ExpressionEditorHelper {
  /**
   * 提取表达式中引用的变量
   */
  extractVariableReferences(expression: string): string[] {
    const references: string[] = [];
    const regex = /\b(data|global)\.[a-zA-Z_$][a-zA-Z0-9_$]*/g;
    let match;

    while ((match = regex.exec(expression)) !== null) {
      references.push(match[0]);
    }

    return [...new Set(references)];
  }

  /**
   * 语法高亮 (简化版,返回带样式的token列表)
   */
  tokenize(expression: string): Array<{ type: string; value: string }> {
    const tokens: Array<{ type: string; value: string }> = [];
    const keywords = ['if', 'else', 'for', 'while', 'return', 'function', 'const', 'let', 'var'];
    const operators = ['+', '-', '*', '/', '=', '==', '!=', '>', '<', '>=', '<=', '&&', '||'];

    // 简单的词法分析
    const parts = expression.split(/(\s+|[+\-*\/=(){}[\],.;])/);
    for (const part of parts) {
      if (!part || /^\s+$/.test(part)) {
        continue;
      }

      if (keywords.includes(part)) {
        tokens.push({ type: 'keyword', value: part });
      } else if (operators.includes(part)) {
        tokens.push({ type: 'operator', value: part });
      } else if (/^\d+$/.test(part)) {
        tokens.push({ type: 'number', value: part });
      } else if (/^".*"$/.test(part) || /^'.*'$/.test(part)) {
        tokens.push({ type: 'string', value: part });
      } else if (/^(data|global)\.[a-zA-Z_$]/.test(part)) {
        tokens.push({ type: 'variable', value: part });
      } else {
        tokens.push({ type: 'identifier', value: part });
      }
    }

    return tokens;
  }

  /**
   * 简单的表达式验证
   */
  validateSyntax(expression: string): { valid: boolean; error?: string } {
    if (!expression || expression.trim() === '') {
      return { valid: false, error: '表达式不能为空' };
    }

    // 检查括号匹配
    const openBrackets = (expression.match(/[({[]/g) || []).length;
    const closeBrackets = (expression.match(/[)}\]]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      return { valid: false, error: '括号不匹配' };
    }

    // 尝试使用Function构造函数检查语法
    try {
      new Function(`return (${expression})`);
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: `语法错误: ${e instanceof Error ? e.message : '未知错误'}`,
      };
    }
  }
}
