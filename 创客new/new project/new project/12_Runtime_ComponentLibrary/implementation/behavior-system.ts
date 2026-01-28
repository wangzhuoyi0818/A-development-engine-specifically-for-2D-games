/**
 * 行为系统
 *
 * 提供可复用的组件行为定义和管理功能
 */

import {
  BehaviorDefinition,
  PropertyDefinition,
  EventDefinition,
  BehaviorNotFoundError,
  InvalidInputError,
} from './types';

/**
 * 行为接口
 */
export interface Behavior {
  /** 行为名称 */
  name: string;

  /** 行为描述 */
  description?: string;

  /**
   * 应用行为到组件
   */
  apply(component: any): void;

  /**
   * 移除行为
   */
  remove(component: any): void;

  /**
   * 检查组件是否有此行为
   */
  has(component: any): boolean;
}

/**
 * 行为管理器
 */
export class BehaviorManager {
  private behaviors: Map<string, BehaviorDefinition>;

  constructor() {
    this.behaviors = new Map();
    // 注册内置行为
    this.registerBuiltinBehaviors();
  }

  /**
   * 注册行为
   */
  register(behavior: BehaviorDefinition): void {
    if (!behavior.name) {
      throw new InvalidInputError('Behavior name is required');
    }

    this.behaviors.set(behavior.name, behavior);
  }

  /**
   * 批量注册行为
   */
  registerBatch(behaviors: BehaviorDefinition[]): void {
    behaviors.forEach((behavior) => this.register(behavior));
  }

  /**
   * 获取行为
   */
  get(name: string): BehaviorDefinition | undefined {
    return this.behaviors.get(name);
  }

  /**
   * 检查行为是否存在
   */
  has(name: string): boolean {
    return this.behaviors.has(name);
  }

  /**
   * 获取所有行为
   */
  getAllBehaviors(): BehaviorDefinition[] {
    return Array.from(this.behaviors.values());
  }

  /**
   * 应用行为到组件
   */
  applyBehavior(component: any, behaviorName: string): void {
    const behavior = this.get(behaviorName);
    if (!behavior) {
      throw new BehaviorNotFoundError(behaviorName);
    }

    // 检查是否已应用
    if (this.hasBehavior(component, behaviorName)) {
      return;
    }

    // 添加行为属性
    if (behavior.addedProperties) {
      if (!component.properties) {
        component.properties = [];
      }
      component.properties.push(...behavior.addedProperties);
    }

    // 添加行为事件
    if (behavior.addedEvents) {
      if (!component.events) {
        component.events = [];
      }
      component.events.push(...behavior.addedEvents);
    }

    // 应用行为配置
    if (behavior.config) {
      if (!component.behaviorConfig) {
        component.behaviorConfig = {};
      }
      component.behaviorConfig[behaviorName] = { ...behavior.config };
    }

    // 标记行为已应用
    if (!component.behaviors) {
      component.behaviors = [];
    }
    component.behaviors.push(behaviorName);

    // 调用自定义应用函数
    if (behavior.apply) {
      behavior.apply(component);
    }
  }

  /**
   * 应用多个行为
   */
  applyBehaviors(component: any, behaviorNames: string[]): void {
    behaviorNames.forEach((name) => this.applyBehavior(component, name));
  }

  /**
   * 移除行为
   */
  removeBehavior(component: any, behaviorName: string): void {
    const behavior = this.get(behaviorName);
    if (!behavior) {
      throw new BehaviorNotFoundError(behaviorName);
    }

    // 检查是否已应用
    if (!this.hasBehavior(component, behaviorName)) {
      return;
    }

    // 移除行为属性
    if (behavior.addedProperties && component.properties) {
      const propertyNames = behavior.addedProperties.map((p) => p.name);
      component.properties = component.properties.filter(
        (p: any) => !propertyNames.includes(p.name)
      );
    }

    // 移除行为事件
    if (behavior.addedEvents && component.events) {
      const eventNames = behavior.addedEvents.map((e) => e.name);
      component.events = component.events.filter((e: any) => !eventNames.includes(e.name));
    }

    // 移除行为配置
    if (component.behaviorConfig && component.behaviorConfig[behaviorName]) {
      delete component.behaviorConfig[behaviorName];
    }

    // 移除行为标记
    if (component.behaviors) {
      component.behaviors = component.behaviors.filter((name: string) => name !== behaviorName);
    }

    // 调用自定义移除函数
    if (behavior.remove) {
      behavior.remove(component);
    }
  }

  /**
   * 获取组件的所有行为
   */
  getComponentBehaviors(component: any): string[] {
    return component.behaviors || [];
  }

  /**
   * 检查组件是否有指定行为
   */
  hasBehavior(component: any, behaviorName: string): boolean {
    return this.getComponentBehaviors(component).includes(behaviorName);
  }

  /**
   * 清空所有行为
   */
  clear(): void {
    this.behaviors.clear();
    this.registerBuiltinBehaviors();
  }

  /**
   * 注册内置行为
   */
  private registerBuiltinBehaviors(): void {
    // 可拖拽行为
    this.register(createDraggableBehavior());

    // 可选择行为
    this.register(createSelectableBehavior());

    // 可调整大小行为
    this.register(createResizableBehavior());

    // 可旋转行为
    this.register(createRotatableBehavior());

    // 响应式行为
    this.register(createResponsiveBehavior());

    // 动画行为
    this.register(createAnimatableBehavior());
  }
}

// ============================================================================
// 内置行为定义
// ============================================================================

/**
 * 创建可拖拽行为
 */
export function createDraggableBehavior(): BehaviorDefinition {
  return {
    name: 'draggable',
    label: '可拖拽',
    description: '使组件可以拖拽移动',
    addedProperties: [
      {
        name: 'draggable',
        label: '可拖拽',
        type: 'boolean' as any,
        defaultValue: true,
        description: '是否可以拖拽',
      },
      {
        name: 'drag-direction',
        label: '拖拽方向',
        type: 'enum' as any,
        defaultValue: 'all',
        description: '拖拽方向限制',
        options: [
          { value: 'all', label: '全方向' },
          { value: 'horizontal', label: '水平' },
          { value: 'vertical', label: '垂直' },
          { value: 'none', label: '禁用' },
        ],
      },
    ],
    addedEvents: [
      {
        name: 'dragstart',
        label: '拖拽开始',
        description: '拖拽开始时触发',
        params: [
          { name: 'x', type: 'number', description: 'X坐标' },
          { name: 'y', type: 'number', description: 'Y坐标' },
        ],
      },
      {
        name: 'dragmove',
        label: '拖拽移动',
        description: '拖拽移动时触发',
        params: [
          { name: 'x', type: 'number', description: 'X坐标' },
          { name: 'y', type: 'number', description: 'Y坐标' },
          { name: 'deltaX', type: 'number', description: 'X方向移动距离' },
          { name: 'deltaY', type: 'number', description: 'Y方向移动距离' },
        ],
      },
      {
        name: 'dragend',
        label: '拖拽结束',
        description: '拖拽结束时触发',
        params: [
          { name: 'x', type: 'number', description: 'X坐标' },
          { name: 'y', type: 'number', description: 'Y坐标' },
        ],
      },
    ],
  };
}

/**
 * 创建可选择行为
 */
export function createSelectableBehavior(): BehaviorDefinition {
  return {
    name: 'selectable',
    label: '可选择',
    description: '使组件可以被选择',
    addedProperties: [
      {
        name: 'selectable',
        label: '可选择',
        type: 'boolean' as any,
        defaultValue: true,
        description: '是否可以选择',
      },
      {
        name: 'selected',
        label: '已选择',
        type: 'boolean' as any,
        defaultValue: false,
        description: '是否已选择',
      },
      {
        name: 'selection-style',
        label: '选择样式',
        type: 'object' as any,
        defaultValue: {
          border: '2px solid #1890ff',
          outline: 'none',
        },
        description: '选择时的样式',
      },
    ],
    addedEvents: [
      {
        name: 'select',
        label: '选择',
        description: '组件被选择时触发',
      },
      {
        name: 'deselect',
        label: '取消选择',
        description: '组件取消选择时触发',
      },
    ],
  };
}

/**
 * 创建可调整大小行为
 */
export function createResizableBehavior(): BehaviorDefinition {
  return {
    name: 'resizable',
    label: '可调整大小',
    description: '使组件可以调整大小',
    addedProperties: [
      {
        name: 'resizable',
        label: '可调整大小',
        type: 'boolean' as any,
        defaultValue: true,
        description: '是否可以调整大小',
      },
      {
        name: 'min-width',
        label: '最小宽度',
        type: 'number' as any,
        defaultValue: 0,
        description: '最小宽度（像素）',
      },
      {
        name: 'min-height',
        label: '最小高度',
        type: 'number' as any,
        defaultValue: 0,
        description: '最小高度（像素）',
      },
      {
        name: 'max-width',
        label: '最大宽度',
        type: 'number' as any,
        description: '最大宽度（像素）',
      },
      {
        name: 'max-height',
        label: '最大高度',
        type: 'number' as any,
        description: '最大高度（像素）',
      },
      {
        name: 'aspect-ratio',
        label: '宽高比',
        type: 'boolean' as any,
        defaultValue: false,
        description: '是否保持宽高比',
      },
    ],
    addedEvents: [
      {
        name: 'resizestart',
        label: '调整开始',
        description: '开始调整大小时触发',
      },
      {
        name: 'resize',
        label: '调整中',
        description: '调整大小时触发',
        params: [
          { name: 'width', type: 'number', description: '新宽度' },
          { name: 'height', type: 'number', description: '新高度' },
        ],
      },
      {
        name: 'resizeend',
        label: '调整结束',
        description: '调整大小结束时触发',
        params: [
          { name: 'width', type: 'number', description: '最终宽度' },
          { name: 'height', type: 'number', description: '最终高度' },
        ],
      },
    ],
  };
}

/**
 * 创建可旋转行为
 */
export function createRotatableBehavior(): BehaviorDefinition {
  return {
    name: 'rotatable',
    label: '可旋转',
    description: '使组件可以旋转',
    addedProperties: [
      {
        name: 'rotatable',
        label: '可旋转',
        type: 'boolean' as any,
        defaultValue: true,
        description: '是否可以旋转',
      },
      {
        name: 'rotation',
        label: '旋转角度',
        type: 'number' as any,
        defaultValue: 0,
        min: 0,
        max: 360,
        description: '当前旋转角度（度）',
      },
      {
        name: 'rotation-step',
        label: '旋转步长',
        type: 'number' as any,
        defaultValue: 1,
        description: '旋转的最小步长（度）',
      },
    ],
    addedEvents: [
      {
        name: 'rotatestart',
        label: '旋转开始',
        description: '开始旋转时触发',
      },
      {
        name: 'rotate',
        label: '旋转中',
        description: '旋转时触发',
        params: [{ name: 'angle', type: 'number', description: '当前角度' }],
      },
      {
        name: 'rotateend',
        label: '旋转结束',
        description: '旋转结束时触发',
        params: [{ name: 'angle', type: 'number', description: '最终角度' }],
      },
    ],
  };
}

/**
 * 创建响应式行为
 */
export function createResponsiveBehavior(): BehaviorDefinition {
  return {
    name: 'responsive',
    label: '响应式',
    description: '使组件支持响应式布局',
    addedProperties: [
      {
        name: 'responsive',
        label: '响应式',
        type: 'boolean' as any,
        defaultValue: true,
        description: '是否启用响应式',
      },
      {
        name: 'breakpoints',
        label: '断点配置',
        type: 'object' as any,
        defaultValue: {
          xs: 375, // 超小屏
          sm: 576, // 小屏
          md: 768, // 中屏
          lg: 992, // 大屏
          xl: 1200, // 超大屏
        },
        description: '响应式断点配置',
      },
    ],
    addedEvents: [
      {
        name: 'breakpointchange',
        label: '断点变化',
        description: '屏幕尺寸跨越断点时触发',
        params: [{ name: 'breakpoint', type: 'string', description: '当前断点' }],
      },
    ],
  };
}

/**
 * 创建动画行为
 */
export function createAnimatableBehavior(): BehaviorDefinition {
  return {
    name: 'animatable',
    label: '可动画',
    description: '使组件支持动画效果',
    addedProperties: [
      {
        name: 'animation',
        label: '动画名称',
        type: 'string' as any,
        description: '动画效果名称',
      },
      {
        name: 'animation-duration',
        label: '动画时长',
        type: 'number' as any,
        defaultValue: 300,
        min: 0,
        description: '动画持续时间（毫秒）',
        unit: 'ms',
      },
      {
        name: 'animation-timing',
        label: '动画曲线',
        type: 'enum' as any,
        defaultValue: 'ease',
        description: '动画时间曲线',
        options: [
          { value: 'linear', label: '线性' },
          { value: 'ease', label: '缓动' },
          { value: 'ease-in', label: '缓入' },
          { value: 'ease-out', label: '缓出' },
          { value: 'ease-in-out', label: '缓入缓出' },
        ],
      },
      {
        name: 'animation-delay',
        label: '动画延迟',
        type: 'number' as any,
        defaultValue: 0,
        min: 0,
        description: '动画延迟时间（毫秒）',
        unit: 'ms',
      },
      {
        name: 'animation-iteration',
        label: '动画次数',
        type: 'number' as any,
        defaultValue: 1,
        min: 1,
        description: '动画播放次数（-1表示无限循环）',
      },
    ],
    addedEvents: [
      {
        name: 'animationstart',
        label: '动画开始',
        description: '动画开始时触发',
      },
      {
        name: 'animationend',
        label: '动画结束',
        description: '动画结束时触发',
      },
      {
        name: 'animationiteration',
        label: '动画迭代',
        description: '动画每次迭代时触发',
      },
    ],
  };
}

/**
 * 创建默认的行为管理器实例
 */
export function createBehaviorManager(): BehaviorManager {
  return new BehaviorManager();
}

/**
 * 全局行为管理器实例（单例）
 */
let globalBehaviorManager: BehaviorManager | null = null;

/**
 * 获取全局行为管理器实例
 */
export function getGlobalBehaviorManager(): BehaviorManager {
  if (!globalBehaviorManager) {
    globalBehaviorManager = createBehaviorManager();
  }
  return globalBehaviorManager;
}

/**
 * 重置全局行为管理器
 */
export function resetGlobalBehaviorManager(): void {
  globalBehaviorManager = null;
}
