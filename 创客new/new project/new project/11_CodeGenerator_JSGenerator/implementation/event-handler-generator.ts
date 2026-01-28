/**
 * 微信小程序可视化开发平台 - 事件处理器代码生成器
 *
 * 负责生成组件事件绑定和自定义事件处理器代码
 */

import type {
  EventHandlerGenerator as IEventHandlerGenerator,
  EventHandlerGeneratorInput,
  GenerationContext,
  ValidationResult,
} from './types';

import type {
  ComponentEvent,
  CustomEvent,
} from '../../../01_Core_ProjectStructure/implementation/types';

import { CodeFormatter } from './formatter';

/**
 * 事件处理器代码生成器实现
 */
export class EventHandlerGenerator implements IEventHandlerGenerator {
  private formatter: CodeFormatter;

  constructor(formatter?: CodeFormatter) {
    this.formatter = formatter || new CodeFormatter();
  }

  /**
   * 生成单个事件处理器
   */
  generateEventHandler(
    event: ComponentEvent | CustomEvent,
    context: GenerationContext
  ): string {
    const handler = 'handler' in event ? event.handler : event.name;
    const actions = event.actions || [];

    if (actions.length === 0) {
      return `
  ${handler}(e) {
    console.log('事件触发:', e)
  }`.trim();
    }

    const body = this.generateHandlerBody(actions, context);

    return `
  ${handler}(e) {
${this.formatter.indent(body, 2)}
  }`.trim();
  }

  /**
   * 生成事件绑定
   */
  generateEventBinding(event: ComponentEvent, context: GenerationContext): string {
    // 在WXML中使用: bind:tap="handleTap"
    return `bind:${event.name}="${event.handler}"`;
  }

  /**
   * 生成代码
   */
  generate(input: EventHandlerGeneratorInput, context: GenerationContext): string {
    const handlers: string[] = [];

    // 组件事件处理器
    if (input.componentEvents) {
      input.componentEvents.forEach((event) => {
        const code = this.generateEventHandler(event, context);
        handlers.push(code);
      });
    }

    // 自定义事件处理器
    if (input.customEvents) {
      input.customEvents.forEach((event) => {
        const code = this.generateEventHandler(event, context);
        handlers.push(code);
      });
    }

    return handlers.join(',\n\n');
  }

  /**
   * 验证输入
   */
  validate(input: EventHandlerGeneratorInput): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // 验证组件事件
    if (input.componentEvents) {
      input.componentEvents.forEach((event, index) => {
        if (!event.handler || event.handler.trim().length === 0) {
          errors.push({
            code: 'MISSING_HANDLER',
            message: `事件 ${event.name} 缺少处理器`,
            location: `componentEvents[${index}]`,
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
   * 生成处理器函数体
   */
  private generateHandlerBody(actions: any[], context: GenerationContext): string {
    const statements: string[] = [];

    actions.forEach((action) => {
      const code = this.generateActionCode(action, context);
      if (code) {
        statements.push(code);
      }
    });

    return statements.join('\n');
  }

  /**
   * 生成action代码(简化版)
   */
  private generateActionCode(action: any, context: GenerationContext): string {
    const { type, params } = action;

    switch (type) {
      case 'setData':
        return `this.setData({ ${params.key}: ${params.value} })`;

      case 'navigateTo':
        return `wx.navigateTo({ url: '${params.url}' })`;

      case 'showToast':
        return `wx.showToast({ title: '${params.title}', icon: 'none' })`;

      default:
        return `// ${type} action`;
    }
  }
}

/**
 * 创建事件处理器生成器
 */
export function createEventHandlerGenerator(formatter?: CodeFormatter): EventHandlerGenerator {
  return new EventHandlerGenerator(formatter);
}
