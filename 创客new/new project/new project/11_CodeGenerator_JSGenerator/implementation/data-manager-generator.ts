/**
 * 微信小程序可视化开发平台 - 数据管理代码生成器
 *
 * 负责生成data对象、setData调用和组件properties
 */

import type {
  DataManagerGenerator as IDataManagerGenerator,
  DataManagerGeneratorInput,
  GenerationContext,
  ValidationResult,
} from './types';

import type { Variable } from '../../../01_Core_ProjectStructure/implementation/types';

import { CodeFormatter } from './formatter';

/**
 * 数据管理代码生成器实现
 */
export class DataManagerGenerator implements IDataManagerGenerator {
  private formatter: CodeFormatter;

  constructor(formatter?: CodeFormatter) {
    this.formatter = formatter || new CodeFormatter();
  }

  /**
   * 生成data对象
   */
  generateDataObject(variables: Variable[], context: GenerationContext): string {
    if (variables.length === 0) {
      return 'data: {}';
    }

    const dataObject: Record<string, any> = {};

    variables.forEach((variable) => {
      dataObject[variable.name] = this.convertInitialValue(variable);
    });

    const formattedData = this.formatter.beautifyObject(dataObject);

    return `data: ${formattedData}`;
  }

  /**
   * 生成setData调用
   */
  generateSetDataCall(updates: Record<string, any>, context: GenerationContext): string {
    if (Object.keys(updates).length === 0) {
      return '';
    }

    // 优化: 合并多个setData调用
    const formattedUpdates = this.formatter.beautifyObject(updates);

    return `this.setData(${formattedUpdates})`;
  }

  /**
   * 生成properties定义(组件)
   */
  generateProperties(properties: any[], context: GenerationContext): string {
    if (properties.length === 0) {
      return 'properties: {}';
    }

    const propsObject: Record<string, any> = {};

    properties.forEach((prop) => {
      propsObject[prop.name] = this.generatePropertyDefinition(prop);
    });

    const formattedProps = this.formatter.beautifyObject(propsObject);

    return `properties: ${formattedProps}`;
  }

  /**
   * 生成代码
   */
  generate(input: DataManagerGeneratorInput, context: GenerationContext): string {
    const parts: string[] = [];

    // 生成properties(仅组件)
    if (context.type === 'component' && input.properties) {
      parts.push(this.generateProperties(input.properties, context));
    }

    // 生成data对象
    if (input.variables && input.variables.length > 0) {
      parts.push(this.generateDataObject(input.variables, context));
    }

    return parts.join(',\n\n');
  }

  /**
   * 验证输入
   */
  validate(input: DataManagerGeneratorInput): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // 验证变量名
    if (input.variables) {
      const names = new Set<string>();

      input.variables.forEach((variable, index) => {
        // 检查变量名有效性
        if (!this.isValidVariableName(variable.name)) {
          errors.push({
            code: 'INVALID_VARIABLE_NAME',
            message: `无效的变量名: ${variable.name}`,
            location: `variables[${index}]`,
          });
        }

        // 检查重复
        if (names.has(variable.name)) {
          errors.push({
            code: 'DUPLICATE_VARIABLE',
            message: `重复的变量名: ${variable.name}`,
            location: `variables[${index}]`,
          });
        }

        names.add(variable.name);

        // 检查初始值类型
        if (!this.isValidInitialValue(variable)) {
          warnings.push({
            code: 'INVALID_INITIAL_VALUE',
            message: `变量 ${variable.name} 的初始值可能无效`,
            location: `variables[${index}]`,
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 生成计算属性
   */
  generateComputedProperty(name: string, expression: string, context: GenerationContext): string {
    return `
  ${name}() {
    return ${expression}
  }`.trim();
  }

  /**
   * 生成响应式更新
   */
  generateReactiveUpdate(variable: Variable, newValue: string, context: GenerationContext): string {
    return `this.setData({ ${variable.name}: ${newValue} })`;
  }

  /**
   * 生成批量setData
   */
  generateBatchSetData(updates: Array<{ key: string; value: string }>, context: GenerationContext): string {
    const updatesObj: Record<string, string> = {};

    updates.forEach(({ key, value }) => {
      updatesObj[key] = value;
    });

    return this.generateSetDataCall(updatesObj, context);
  }

  /**
   * 转换初始值
   */
  private convertInitialValue(variable: Variable): any {
    const { type, initialValue } = variable;

    // 如果已经有初始值,直接使用
    if (initialValue !== undefined && initialValue !== null) {
      return initialValue;
    }

    // 根据类型提供默认值
    switch (type) {
      case 'string':
        return '';

      case 'number':
        return 0;

      case 'boolean':
        return false;

      case 'array':
        return [];

      case 'object':
        return {};

      default:
        return null;
    }
  }

  /**
   * 生成property定义
   */
  private generatePropertyDefinition(prop: any): any {
    const definition: any = {
      type: this.convertTypeToWxType(prop.type),
    };

    // 设置默认值
    if (prop.defaultValue !== undefined) {
      definition.value = prop.defaultValue;
    }

    // 设置observer
    if (prop.observer) {
      definition.observer = prop.observer;
    }

    return definition;
  }

  /**
   * 转换类型为微信小程序类型
   */
  private convertTypeToWxType(type: string): any {
    const typeMap: Record<string, any> = {
      string: String,
      number: Number,
      boolean: Boolean,
      object: Object,
      array: Array,
    };

    return typeMap[type] || null;
  }

  /**
   * 验证变量名
   */
  private isValidVariableName(name: string): boolean {
    // JavaScript标识符规则
    const identifierPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;

    if (!identifierPattern.test(name)) {
      return false;
    }

    // 检查保留字
    const reservedWords = [
      'break', 'case', 'catch', 'class', 'const', 'continue',
      'debugger', 'default', 'delete', 'do', 'else', 'enum',
      'export', 'extends', 'false', 'finally', 'for', 'function',
      'if', 'import', 'in', 'instanceof', 'new', 'null',
      'return', 'super', 'switch', 'this', 'throw', 'true',
      'try', 'typeof', 'var', 'void', 'while', 'with',
      'let', 'static', 'yield', 'await', 'async',
    ];

    return !reservedWords.includes(name);
  }

  /**
   * 验证初始值
   */
  private isValidInitialValue(variable: Variable): boolean {
    const { type, initialValue } = variable;

    if (initialValue === undefined || initialValue === null) {
      return true; // 可以为空
    }

    const actualType = typeof initialValue;

    switch (type) {
      case 'string':
        return actualType === 'string';

      case 'number':
        return actualType === 'number' && !isNaN(initialValue);

      case 'boolean':
        return actualType === 'boolean';

      case 'array':
        return Array.isArray(initialValue);

      case 'object':
        return actualType === 'object' && !Array.isArray(initialValue);

      default:
        return true;
    }
  }

  /**
   * 生成Observer函数
   */
  generateObserver(propertyName: string, observerFn: string): string {
    return `
  observer(newVal, oldVal) {
    ${observerFn}
  }`.trim();
  }

  /**
   * 生成数据路径访问
   */
  generateDataPath(path: string): string {
    // 将 'user.name' 转换为 'this.data.user.name'
    return `this.data.${path}`;
  }

  /**
   * 生成部分更新路径
   */
  generatePartialUpdatePath(path: string, value: any): string {
    // 支持数组索引和对象路径
    // 例如: 'list[0].name' -> this.setData({ 'list[0].name': value })
    return `this.setData({ '${path}': ${JSON.stringify(value)} })`;
  }
}

/**
 * 创建数据管理生成器
 */
export function createDataManagerGenerator(formatter?: CodeFormatter): DataManagerGenerator {
  return new DataManagerGenerator(formatter);
}

/**
 * 快速生成data对象
 */
export function generateData(variables: Variable[]): string {
  const generator = new DataManagerGenerator();
  const context: GenerationContext = {
    type: 'page',
    name: '',
    variables: [],
    imports: new Set(),
    methods: new Map(),
    helpers: new Map(),
    indentLevel: 0,
    inAsyncContext: false,
    requiredAPIs: new Set(),
    config: { target: 'page' },
  };

  return generator.generateDataObject(variables, context);
}

/**
 * 快速生成setData调用
 */
export function generateSetData(updates: Record<string, any>): string {
  const generator = new DataManagerGenerator();
  const context: GenerationContext = {
    type: 'page',
    name: '',
    variables: [],
    imports: new Set(),
    methods: new Map(),
    helpers: new Map(),
    indentLevel: 0,
    inAsyncContext: false,
    requiredAPIs: new Set(),
    config: { target: 'page' },
  };

  return generator.generateSetDataCall(updates, context);
}
