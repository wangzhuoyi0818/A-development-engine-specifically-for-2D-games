/**
 * 微信小程序可视化开发平台 - 生命周期代码生成器
 *
 * 负责生成页面和组件的生命周期函数代码
 */

import type {
  LifecycleGenerator as ILifecycleGenerator,
  LifecycleGeneratorInput,
  GenerationContext,
  ValidationResult,
  CodeSnippet,
} from './types';

import type {
  LifecycleEvent,
  LifecycleType,
} from '../../../01_Core_ProjectStructure/implementation/types';

import type { Action } from '../../../02_Core_EventSystem/implementation/types';

import { CodeFormatter } from './formatter';

/**
 * 页面生命周期方法签名
 */
const PAGE_LIFECYCLE_SIGNATURES: Record<string, string> = {
  onLoad: 'onLoad(options)',
  onShow: 'onShow()',
  onReady: 'onReady()',
  onHide: 'onHide()',
  onUnload: 'onUnload()',
  onPullDownRefresh: 'onPullDownRefresh()',
  onReachBottom: 'onReachBottom()',
  onShareAppMessage: 'onShareAppMessage(options)',
  onPageScroll: 'onPageScroll(e)',
  onTabItemTap: 'onTabItemTap(item)',
  onResize: 'onResize(size)',
};

/**
 * 组件生命周期方法签名
 */
const COMPONENT_LIFECYCLE_SIGNATURES: Record<string, string> = {
  created: 'created()',
  attached: 'attached()',
  ready: 'ready()',
  moved: 'moved()',
  detached: 'detached()',
  error: 'error(err)',
};

/**
 * 组件页面生命周期方法签名
 */
const COMPONENT_PAGE_LIFECYCLE_SIGNATURES: Record<string, string> = {
  show: 'show()',
  hide: 'hide()',
  resize: 'resize(size)',
};

/**
 * 生命周期代码生成器实现
 */
export class LifecycleGenerator implements ILifecycleGenerator {
  private formatter: CodeFormatter;

  constructor(formatter?: CodeFormatter) {
    this.formatter = formatter || new CodeFormatter();
  }

  /**
   * 生成页面生命周期
   */
  generatePageLifecycle(event: LifecycleEvent, context: GenerationContext): string {
    const signature = PAGE_LIFECYCLE_SIGNATURES[event.name];

    if (!signature) {
      throw new Error(`未知的页面生命周期: ${event.name}`);
    }

    const body = this.generateLifecycleBody(event, context);

    return `
  ${signature} {
${this.formatter.indent(body, 2)}
  }`.trim();
  }

  /**
   * 生成组件生命周期
   */
  generateComponentLifecycle(event: LifecycleEvent, context: GenerationContext): string {
    const signature =
      COMPONENT_LIFECYCLE_SIGNATURES[event.name] ||
      COMPONENT_PAGE_LIFECYCLE_SIGNATURES[event.name];

    if (!signature) {
      throw new Error(`未知的组件生命周期: ${event.name}`);
    }

    const body = this.generateLifecycleBody(event, context);

    return `
    ${signature} {
${this.formatter.indent(body, 3)}
    }`.trim();
  }

  /**
   * 生成代码
   */
  generate(input: LifecycleGeneratorInput, context: GenerationContext): string {
    const { events, target } = input;

    if (events.length === 0) {
      return '';
    }

    const lifecycleFunctions = events.map((event) => {
      if (target === 'page') {
        return this.generatePageLifecycle(event, context);
      } else {
        return this.generateComponentLifecycle(event, context);
      }
    });

    return lifecycleFunctions.join(',\n\n');
  }

  /**
   * 验证输入
   */
  validate(input: LifecycleGeneratorInput): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    const { events, target } = input;

    const validLifecycles =
      target === 'page'
        ? Object.keys(PAGE_LIFECYCLE_SIGNATURES)
        : Object.keys({
            ...COMPONENT_LIFECYCLE_SIGNATURES,
            ...COMPONENT_PAGE_LIFECYCLE_SIGNATURES,
          });

    events.forEach((event, index) => {
      if (!validLifecycles.includes(event.name)) {
        errors.push({
          code: 'INVALID_LIFECYCLE',
          message: `无效的生命周期: ${event.name}`,
          location: `events[${index}]`,
        });
      }

      // 检查actions
      if (!event.actions || event.actions.length === 0) {
        warnings.push({
          code: 'EMPTY_LIFECYCLE',
          message: `生命周期 ${event.name} 没有任何操作`,
          location: `events[${index}]`,
        });
      }
    });

    // 检查重复的生命周期
    const names = events.map((e) => e.name);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

    if (duplicates.length > 0) {
      errors.push({
        code: 'DUPLICATE_LIFECYCLE',
        message: `重复的生命周期: ${duplicates.join(', ')}`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 生成生命周期函数体
   */
  private generateLifecycleBody(event: LifecycleEvent, context: GenerationContext): string {
    if (!event.actions || event.actions.length === 0) {
      return '// TODO: 实现生命周期逻辑';
    }

    const statements: string[] = [];

    // 添加注释
    if (context.config.includeComments) {
      statements.push(`// ${this.getLifecycleComment(event.name)}`);
    }

    // 生成每个action的代码
    event.actions.forEach((action) => {
      const code = this.generateActionCode(action, context);
      if (code) {
        statements.push(code);
      }
    });

    return statements.join('\n');
  }

  /**
   * 生成action代码
   */
  private generateActionCode(action: Action, context: GenerationContext): string {
    const { type, parameters } = action;

    switch (type) {
      case 'setData':
        return this.generateSetDataAction(parameters, context);

      case 'navigateTo':
      case 'redirectTo':
      case 'reLaunch':
      case 'navigateBack':
        return this.generateNavigationAction(type, parameters, context);

      case 'showToast':
      case 'showModal':
      case 'showLoading':
      case 'showActionSheet':
        return this.generateUIAction(type, parameters, context);

      case 'request':
        return this.generateRequestAction(parameters, context);

      case 'setVariable':
        return this.generateSetVariableAction(parameters, context);

      case 'custom':
        return this.generateCustomAction(parameters, context);

      default:
        return `// TODO: 实现 ${type} 动作`;
    }
  }

  /**
   * 生成setData动作
   */
  private generateSetDataAction(parameters: any[], context: GenerationContext): string {
    if (parameters.length < 2) {
      return '';
    }

    const key = parameters[0]?.value || '';
    const value = parameters[1]?.value || '';

    return `this.setData({ ${key}: ${value} })`;
  }

  /**
   * 生成导航动作
   */
  private generateNavigationAction(
    type: string,
    parameters: any[],
    context: GenerationContext
  ): string {
    const url = parameters[0]?.value || '';

    switch (type) {
      case 'navigateTo':
        return `wx.navigateTo({ url: '${url}' })`;

      case 'redirectTo':
        return `wx.redirectTo({ url: '${url}' })`;

      case 'reLaunch':
        return `wx.reLaunch({ url: '${url}' })`;

      case 'navigateBack':
        const delta = parameters[0]?.value || 1;
        return `wx.navigateBack({ delta: ${delta} })`;

      default:
        return '';
    }
  }

  /**
   * 生成UI动作
   */
  private generateUIAction(type: string, parameters: any[], context: GenerationContext): string {
    const title = parameters[0]?.value || '';

    switch (type) {
      case 'showToast':
        return `wx.showToast({ title: '${title}', icon: 'none' })`;

      case 'showModal':
        const content = parameters[1]?.value || '';
        return `wx.showModal({ title: '${title}', content: '${content}' })`;

      case 'showLoading':
        return `wx.showLoading({ title: '${title}' })`;

      case 'showActionSheet':
        const itemList = parameters[1]?.value || [];
        return `wx.showActionSheet({ itemList: ${JSON.stringify(itemList)} })`;

      default:
        return '';
    }
  }

  /**
   * 生成请求动作
   */
  private generateRequestAction(parameters: any[], context: GenerationContext): string {
    const url = parameters[0]?.value || '';
    const method = parameters[1]?.value || 'GET';

    context.requiredAPIs.add('wx.request');

    return `
wx.request({
  url: '${url}',
  method: '${method}',
  success: (res) => {
    console.log('请求成功', res.data)
    this.setData({ apiData: res.data })
  },
  fail: (err) => {
    console.error('请求失败', err)
    wx.showToast({ title: '请求失败', icon: 'none' })
  }
})`.trim();
  }

  /**
   * 生成变量设置动作
   */
  private generateSetVariableAction(parameters: any[], context: GenerationContext): string {
    if (parameters.length < 2) {
      return '';
    }

    const varName = parameters[0]?.value || '';
    const value = parameters[1]?.value || '';

    return `this.setData({ ${varName}: ${value} })`;
  }

  /**
   * 生成自定义动作
   */
  private generateCustomAction(parameters: any[], context: GenerationContext): string {
    const methodName = parameters[0]?.value || '';
    const args = parameters.slice(1).map((p) => p.value || '');

    return `this.${methodName}(${args.join(', ')})`;
  }

  /**
   * 获取生命周期注释
   */
  private getLifecycleComment(lifecycle: LifecycleType | string): string {
    const comments: Record<string, string> = {
      onLoad: '页面加载时触发',
      onShow: '页面显示时触发',
      onReady: '页面初次渲染完成时触发',
      onHide: '页面隐藏时触发',
      onUnload: '页面卸载时触发',
      onPullDownRefresh: '用户下拉刷新时触发',
      onReachBottom: '页面上拉触底时触发',
      onShareAppMessage: '用户点击分享时触发',
      created: '组件实例刚刚被创建',
      attached: '组件实例进入页面节点树',
      ready: '组件在视图层布局完成',
      moved: '组件实例被移动到节点树另一个位置',
      detached: '组件实例被从页面节点树移除',
      show: '组件所在的页面被展示',
      hide: '组件所在的页面被隐藏',
    };

    return comments[lifecycle] || '生命周期函数';
  }

  /**
   * 生成所有生命周期结构
   */
  generateLifecycleStructure(
    events: LifecycleEvent[],
    target: 'page' | 'component',
    context: GenerationContext
  ): string {
    if (target === 'page') {
      return this.generate({ events, target }, context);
    }

    // 组件需要区分lifetimes和pageLifetimes
    const lifetimes: LifecycleEvent[] = [];
    const pageLifetimes: LifecycleEvent[] = [];

    events.forEach((event) => {
      if (COMPONENT_LIFECYCLE_SIGNATURES[event.name]) {
        lifetimes.push(event);
      } else if (COMPONENT_PAGE_LIFECYCLE_SIGNATURES[event.name]) {
        pageLifetimes.push(event);
      }
    });

    const parts: string[] = [];

    if (lifetimes.length > 0) {
      const lifetimesCode = this.generateLifetimesBlock(lifetimes, context);
      parts.push(lifetimesCode);
    }

    if (pageLifetimes.length > 0) {
      const pageLifetimesCode = this.generatePageLifetimesBlock(pageLifetimes, context);
      parts.push(pageLifetimesCode);
    }

    return parts.join(',\n\n');
  }

  /**
   * 生成lifetimes块
   */
  private generateLifetimesBlock(events: LifecycleEvent[], context: GenerationContext): string {
    const functions = events.map((event) => this.generateComponentLifecycle(event, context));

    return `
  lifetimes: {
${this.formatter.indent(functions.join(',\n\n'), 2)}
  }`.trim();
  }

  /**
   * 生成pageLifetimes块
   */
  private generatePageLifetimesBlock(events: LifecycleEvent[], context: GenerationContext): string {
    const functions = events.map((event) => this.generateComponentLifecycle(event, context));

    return `
  pageLifetimes: {
${this.formatter.indent(functions.join(',\n\n'), 2)}
  }`.trim();
  }
}

/**
 * 创建生命周期生成器
 */
export function createLifecycleGenerator(formatter?: CodeFormatter): LifecycleGenerator {
  return new LifecycleGenerator(formatter);
}

/**
 * 快速生成生命周期函数
 */
export function generateLifecycle(
  event: LifecycleEvent,
  target: 'page' | 'component'
): string {
  const generator = new LifecycleGenerator();
  const context: GenerationContext = {
    type: target,
    name: '',
    variables: [],
    imports: new Set(),
    methods: new Map(),
    helpers: new Map(),
    indentLevel: 0,
    inAsyncContext: false,
    requiredAPIs: new Set(),
    config: {
      target,
      includeComments: true,
    },
  };

  if (target === 'page') {
    return generator.generatePageLifecycle(event, context);
  } else {
    return generator.generateComponentLifecycle(event, context);
  }
}
