/**
 * 微信小程序可视化开发平台 - JavaScript主生成器
 *
 * 负责生成完整的Page和Component JavaScript代码
 */

import type {
  JSGenerator as IJSGenerator,
  JSGenerationConfig,
  JSGenerationResult,
  GenerationContext,
  DEFAULT_GENERATION_CONFIG,
} from './types';

import type {
  Page,
  Component,
} from '../../../01_Core_ProjectStructure/implementation/types';

import { CodeFormatter } from './formatter';
import { ImportGenerator } from './import-generator';
import { DataManagerGenerator } from './data-manager-generator';
import { LifecycleGenerator } from './lifecycle-generator';
import { EventHandlerGenerator } from './event-handler-generator';
import { MethodGenerator } from './method-generator';

/**
 * JavaScript主生成器实现
 */
export class JSGenerator implements IJSGenerator {
  private config: JSGenerationConfig;
  private formatter: CodeFormatter;
  private importGen: ImportGenerator;
  private dataManagerGen: DataManagerGenerator;
  private lifecycleGen: LifecycleGenerator;
  private eventHandlerGen: EventHandlerGenerator;
  private methodGen: MethodGenerator;

  constructor(config: Partial<JSGenerationConfig> = {}) {
    this.config = { ...DEFAULT_GENERATION_CONFIG as any, ...config };
    this.formatter = new CodeFormatter({
      indentSize: this.config.indentSize,
      quotes: this.config.useSingleQuotes ? 'single' : 'double',
    });

    // 初始化所有子生成器
    this.importGen = new ImportGenerator();
    this.dataManagerGen = new DataManagerGenerator(this.formatter);
    this.lifecycleGen = new LifecycleGenerator(this.formatter);
    this.eventHandlerGen = new EventHandlerGenerator(this.formatter);
    this.methodGen = new MethodGenerator(this.formatter);
  }

  /**
   * 生成页面代码
   */
  generatePageCode(page: Page, config?: JSGenerationConfig): JSGenerationResult {
    const startTime = Date.now();

    try {
      // 合并配置
      const genConfig = { ...this.config, ...config, target: 'page' as const };

      // 创建生成上下文
      const context: GenerationContext = {
        type: 'page',
        name: page.name,
        variables: page.variables || [],
        imports: new Set(),
        methods: new Map(),
        helpers: new Map(),
        indentLevel: 0,
        inAsyncContext: false,
        requiredAPIs: new Set(),
        config: genConfig,
      };

      // 生成代码
      const code = this.buildPageCode(page, context);

      // 格式化代码
      const formattedCode = this.formatter.formatPageOrComponent(code);

      const duration = Date.now() - startTime;

      return {
        success: true,
        code: formattedCode,
        errors: [],
        warnings: [],
        stats: {
          lines: formattedCode.split('\n').length,
          size: Buffer.byteLength(formattedCode, 'utf8'),
          duration,
          methodCount: context.methods.size,
          lifecycleCount: page.lifecycleEvents?.length || 0,
          eventHandlerCount: page.customEvents?.length || 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            code: 'GENERATION_ERROR',
            message: error.message || '生成失败',
          },
        ],
        warnings: [],
        stats: {
          lines: 0,
          size: 0,
          duration: Date.now() - startTime,
          methodCount: 0,
          lifecycleCount: 0,
          eventHandlerCount: 0,
        },
      };
    }
  }

  /**
   * 生成组件代码
   */
  generateComponentCode(component: Component, config?: JSGenerationConfig): JSGenerationResult {
    const startTime = Date.now();

    try {
      // 合并配置
      const genConfig = { ...this.config, ...config, target: 'component' as const };

      // 创建生成上下文
      const context: GenerationContext = {
        type: 'component',
        name: component.name || component.type,
        variables: [],
        imports: new Set(),
        methods: new Map(),
        helpers: new Map(),
        indentLevel: 0,
        inAsyncContext: false,
        requiredAPIs: new Set(),
        config: genConfig,
      };

      // 生成代码
      const code = this.buildComponentCode(component, context);

      // 格式化代码
      const formattedCode = this.formatter.formatPageOrComponent(code);

      const duration = Date.now() - startTime;

      return {
        success: true,
        code: formattedCode,
        errors: [],
        warnings: [],
        stats: {
          lines: formattedCode.split('\n').length,
          size: Buffer.byteLength(formattedCode, 'utf8'),
          duration,
          methodCount: context.methods.size,
          lifecycleCount: 0,
          eventHandlerCount: component.events?.length || 0,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [
          {
            code: 'GENERATION_ERROR',
            message: error.message || '生成失败',
          },
        ],
        warnings: [],
        stats: {
          lines: 0,
          size: 0,
          duration: Date.now() - startTime,
          methodCount: 0,
          lifecycleCount: 0,
          eventHandlerCount: 0,
        },
      };
    }
  }

  /**
   * 获取生成器配置
   */
  getConfig(): JSGenerationConfig {
    return { ...this.config };
  }

  /**
   * 设置生成器配置
   */
  setConfig(config: Partial<JSGenerationConfig>): void {
    this.config = { ...this.config, ...config };

    // 更新formatter配置
    this.formatter = new CodeFormatter({
      indentSize: this.config.indentSize,
      quotes: this.config.useSingleQuotes ? 'single' : 'double',
    });
  }

  /**
   * 构建页面代码
   */
  private buildPageCode(page: Page, context: GenerationContext): string {
    const parts: string[] = [];

    // 1. 导入语句
    const imports = this.importGen.generateImports(context);
    if (imports) {
      parts.push(imports);
    }

    // 2. 构建Page对象
    parts.push('Page({');

    const pageParts: string[] = [];

    // 3. data对象
    if (page.variables && page.variables.length > 0) {
      const dataCode = this.dataManagerGen.generateDataObject(page.variables, context);
      pageParts.push(`  ${dataCode}`);
    }

    // 4. 生命周期函数
    if (page.lifecycleEvents && page.lifecycleEvents.length > 0) {
      const lifecycleCode = this.lifecycleGen.generate(
        { events: page.lifecycleEvents, target: 'page' },
        context
      );
      pageParts.push(`  ${lifecycleCode}`);
    }

    // 5. 事件处理器
    if (page.customEvents && page.customEvents.length > 0) {
      const eventCode = this.eventHandlerGen.generate(
        { customEvents: page.customEvents },
        context
      );
      pageParts.push(`  ${eventCode}`);
    }

    parts.push(pageParts.join(',\n\n'));
    parts.push('})');

    return parts.join('\n');
  }

  /**
   * 构建组件代码
   */
  private buildComponentCode(component: Component, context: GenerationContext): string {
    const parts: string[] = [];

    // 1. 导入语句
    const imports = this.importGen.generateImports(context);
    if (imports) {
      parts.push(imports);
    }

    // 2. 构建Component对象
    parts.push('Component({');

    const componentParts: string[] = [];

    // 3. properties
    if (component.properties && component.properties.length > 0) {
      const propsCode = this.dataManagerGen.generateProperties(component.properties, context);
      componentParts.push(`  ${propsCode}`);
    }

    // 4. data对象
    componentParts.push('  data: {}');

    // 5. 方法
    if (component.events && component.events.length > 0) {
      const methodsCode = this.eventHandlerGen.generate(
        { componentEvents: component.events },
        context
      );

      componentParts.push(`  methods: {\n${methodsCode}\n  }`);
    }

    parts.push(componentParts.join(',\n\n'));
    parts.push('})');

    return parts.join('\n');
  }

  /**
   * 生成注释头
   */
  private generateFileHeader(name: string, type: 'page' | 'component'): string {
    const typeLabel = type === 'page' ? '页面' : '组件';

    return `
/**
 * ${name} - ${typeLabel}
 * 自动生成的代码,请勿手动修改
 * Generated by 微信小程序可视化开发平台
 */
`.trim();
  }
}

/**
 * 创建JavaScript生成器
 */
export function createJSGenerator(config?: Partial<JSGenerationConfig>): JSGenerator {
  return new JSGenerator(config);
}

/**
 * 快速生成页面代码
 */
export function generatePage(page: Page, config?: JSGenerationConfig): string {
  const generator = new JSGenerator(config);
  const result = generator.generatePageCode(page, config);

  if (!result.success) {
    throw new Error(result.errors[0]?.message || '生成失败');
  }

  return result.code || '';
}

/**
 * 快速生成组件代码
 */
export function generateComponent(component: Component, config?: JSGenerationConfig): string {
  const generator = new JSGenerator(config);
  const result = generator.generateComponentCode(component, config);

  if (!result.success) {
    throw new Error(result.errors[0]?.message || '生成失败');
  }

  return result.code || '';
}
