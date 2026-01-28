/**
 * 微信小程序可视化开发平台 - 方法生成器
 *
 * 负责生成自定义方法和API调用包装
 */

import type {
  MethodGenerator as IMethodGenerator,
  MethodGeneratorInput,
  GenerationContext,
  ValidationResult,
  FunctionDefinition,
  APICallConfig,
} from './types';

import { CodeFormatter } from './formatter';

/**
 * 方法生成器实现
 */
export class MethodGenerator implements IMethodGenerator {
  private formatter: CodeFormatter;

  constructor(formatter?: CodeFormatter) {
    this.formatter = formatter || new CodeFormatter();
  }

  /**
   * 生成方法定义
   */
  generateMethod(def: FunctionDefinition, context: GenerationContext): string {
    const { name, parameters, body, async: isAsync, arrow, jsdoc } = def;

    const parts: string[] = [];

    // 添加JSDoc注释
    if (jsdoc && context.config.includeComments) {
      parts.push(`/** ${jsdoc} */`);
    }

    // 生成参数列表
    const params = parameters.map((p) => {
      if (p.defaultValue) {
        return `${p.name} = ${p.defaultValue}`;
      }
      return p.name;
    }).join(', ');

    // 生成函数定义
    if (arrow) {
      const asyncPrefix = isAsync ? 'async ' : '';
      parts.push(`${name}: ${asyncPrefix}(${params}) => {`);
    } else {
      const asyncPrefix = isAsync ? 'async ' : '';
      parts.push(`${asyncPrefix}${name}(${params}) {`);
    }

    // 函数体
    parts.push(this.formatter.indent(body, 1));
    parts.push('}');

    return parts.join('\n');
  }

  /**
   * 生成API调用包装
   */
  generateAPIWrapper(apiName: string, params: any, context: GenerationContext): string {
    context.requiredAPIs.add(apiName);

    const paramsStr = JSON.stringify(params, null, 2);

    return `
${apiName}(${paramsStr})`.trim();
  }

  /**
   * 生成代码
   */
  generate(input: MethodGeneratorInput, context: GenerationContext): string {
    const methods: string[] = [];

    // 生成自定义方法
    if (input.customMethods) {
      input.customMethods.forEach((method) => {
        const code = this.generateMethod(method, context);
        methods.push(code);
      });
    }

    // 生成API包装方法
    if (input.apiCalls) {
      input.apiCalls.forEach((api) => {
        const code = this.generateAPIWrapperMethod(api, context);
        methods.push(code);
      });
    }

    return methods.join(',\n\n');
  }

  /**
   * 验证输入
   */
  validate(input: MethodGeneratorInput): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // 验证方法名
    if (input.customMethods) {
      const names = new Set<string>();

      input.customMethods.forEach((method, index) => {
        if (!this.isValidMethodName(method.name)) {
          errors.push({
            code: 'INVALID_METHOD_NAME',
            message: `无效的方法名: ${method.name}`,
            location: `customMethods[${index}]`,
          });
        }

        if (names.has(method.name)) {
          errors.push({
            code: 'DUPLICATE_METHOD',
            message: `重复的方法名: ${method.name}`,
            location: `customMethods[${index}]`,
          });
        }

        names.add(method.name);
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 生成API包装方法
   */
  private generateAPIWrapperMethod(api: APICallConfig, context: GenerationContext): string {
    const methodName = this.getAPIMethodName(api.name);
    const { params, async: isAsync, errorHandling } = api;

    let body = '';

    if (errorHandling) {
      body = `
return new Promise((resolve, reject) => {
  ${api.name}({
    ...${JSON.stringify(params)},
    success: (res) => resolve(res),
    fail: (err) => reject(err)
  })
})`.trim();
    } else {
      body = `${api.name}(${JSON.stringify(params)})`;
    }

    return this.generateMethod(
      {
        name: methodName,
        parameters: [],
        body,
        async: isAsync,
      },
      context
    );
  }

  /**
   * 从API名称生成方法名
   */
  private getAPIMethodName(apiName: string): string {
    // wx.request -> request
    // wx.showToast -> showToast
    return apiName.replace('wx.', '');
  }

  /**
   * 验证方法名
   */
  private isValidMethodName(name: string): boolean {
    const identifierPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
    return identifierPattern.test(name);
  }

  /**
   * 生成工具方法
   */
  generateUtilityMethod(name: string, body: string, context: GenerationContext): string {
    return this.generateMethod(
      {
        name,
        parameters: [],
        body,
      },
      context
    );
  }
}

/**
 * 创建方法生成器
 */
export function createMethodGenerator(formatter?: CodeFormatter): MethodGenerator {
  return new MethodGenerator(formatter);
}
