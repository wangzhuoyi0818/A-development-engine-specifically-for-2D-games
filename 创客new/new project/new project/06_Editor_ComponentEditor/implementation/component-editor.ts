/**
 * 组件编辑器
 *
 * 负责组件的整体编辑管理,包括属性、样式、事件等
 */

import {
  ComponentLibraryItem,
  EventBinding,
  EventBindingType,
  EventAction,
  ValidationResult,
} from './types';
import { wxComponentLibrary } from './component-library';
import { PropertyEditor, PropertyEditorFactory } from './property-editor';

/**
 * 组件编辑器错误
 */
export class ComponentEditorError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ComponentEditorError';
  }
}

/**
 * 组件数据
 */
export interface ComponentData {
  /** 组件ID */
  id: string;

  /** 组件类型 */
  type: string;

  /** 组件名称 */
  name?: string;

  /** 组件属性 */
  properties: Record<string, any>;

  /** 组件样式 */
  styles: Record<string, any>;

  /** 事件绑定 */
  events: EventBinding[];

  /** 子组件 */
  children: ComponentData[];
}

/**
 * 组件编辑器
 *
 * 负责组件的创建、编辑、验证等操作
 */
export class ComponentEditor {
  private component: ComponentData;
  private definition: ComponentLibraryItem;
  private propertyEditor: PropertyEditor;

  constructor(component: ComponentData) {
    this.component = component;

    // 获取组件定义
    const definition = wxComponentLibrary.getComponent(component.type);
    if (!definition) {
      throw new ComponentEditorError(
        'COMPONENT_NOT_FOUND',
        `组件类型 "${component.type}" 不存在`,
      );
    }
    this.definition = definition;

    // 创建属性编辑器
    this.propertyEditor = PropertyEditorFactory.createEditor(
      component.id,
      component.type,
      component.properties || {},
      (property, value) => {
        this.component.properties[property] = value;
      },
    );
  }

  /**
   * 获取组件数据
   */
  getComponent(): ComponentData {
    return this.component;
  }

  /**
   * 获取组件定义
   */
  getDefinition(): ComponentLibraryItem {
    return this.definition;
  }

  /**
   * 获取属性编辑器
   */
  getPropertyEditor(): PropertyEditor {
    return this.propertyEditor;
  }

  /**
   * 更新组件名称
   */
  updateName(name: string): void {
    this.component.name = name;
  }

  /**
   * 更新组件属性
   */
  updateProperty(property: string, value: any): void {
    this.propertyEditor.updateProperty(property, value);
  }

  /**
   * 批量更新属性
   */
  updateProperties(properties: Record<string, any>): void {
    this.propertyEditor.updateProperties(properties);
  }

  /**
   * 获取属性值
   */
  getPropertyValue(property: string): any {
    return this.propertyEditor.getPropertyValue(property);
  }

  /**
   * 更新组件样式
   */
  updateStyle(property: string, value: any): void {
    if (!this.component.styles) {
      this.component.styles = {};
    }
    this.component.styles[property] = value;
  }

  /**
   * 批量更新样式
   */
  updateStyles(styles: Record<string, any>): void {
    Object.entries(styles).forEach(([property, value]) => {
      this.updateStyle(property, value);
    });
  }

  /**
   * 获取样式值
   */
  getStyleValue(property: string): any {
    return this.component.styles?.[property];
  }

  /**
   * 添加事件绑定
   */
  addEventBinding(binding: Omit<EventBinding, 'id'>): EventBinding {
    const eventDef = this.definition.events.find((e) => e.name === binding.eventName);
    if (!eventDef) {
      throw new ComponentEditorError(
        'EVENT_NOT_FOUND',
        `事件 "${binding.eventName}" 不存在`,
      );
    }

    const newBinding: EventBinding = {
      id: this.generateEventBindingId(),
      componentId: this.component.id,
      ...binding,
    };

    if (!this.component.events) {
      this.component.events = [];
    }

    this.component.events.push(newBinding);
    return newBinding;
  }

  /**
   * 更新事件绑定
   */
  updateEventBinding(id: string, updates: Partial<EventBinding>): EventBinding {
    const index = this.component.events?.findIndex((e) => e.id === id);
    if (index === undefined || index === -1) {
      throw new ComponentEditorError(
        'EVENT_BINDING_NOT_FOUND',
        `事件绑定 "${id}" 不存在`,
      );
    }

    this.component.events[index] = {
      ...this.component.events[index],
      ...updates,
    };

    return this.component.events[index];
  }

  /**
   * 删除事件绑定
   */
  removeEventBinding(id: string): boolean {
    if (!this.component.events) return false;

    const index = this.component.events.findIndex((e) => e.id === id);
    if (index === -1) return false;

    this.component.events.splice(index, 1);
    return true;
  }

  /**
   * 获取事件绑定
   */
  getEventBinding(id: string): EventBinding | undefined {
    return this.component.events?.find((e) => e.id === id);
  }

  /**
   * 获取所有事件绑定
   */
  getEventBindings(): EventBinding[] {
    return this.component.events || [];
  }

  /**
   * 获取指定事件名称的绑定
   */
  getEventBindingsByName(eventName: string): EventBinding[] {
    return this.component.events?.filter((e) => e.eventName === eventName) || [];
  }

  /**
   * 验证组件
   */
  validate(): ValidationResult {
    const errors: string[] = [];

    // 验证必填属性
    this.definition.properties.forEach((propDef) => {
      if (propDef.required) {
        const value = this.component.properties[propDef.name];
        if (value === null || value === undefined || value === '') {
          errors.push(`属性 "${propDef.label}" 是必填的`);
        }
      }
    });

    // 验证子组件
    if (this.component.children?.length > 0) {
      if (!this.definition.canHaveChildren) {
        errors.push(`组件 "${this.definition.label}" 不允许有子组件`);
      }

      if (this.definition.allowedChildren) {
        this.component.children.forEach((child) => {
          if (!this.definition.allowedChildren!.includes(child.type)) {
            errors.push(
              `组件 "${this.definition.label}" 不允许有 "${child.type}" 类型的子组件`,
            );
          }
        });
      }
    }

    return {
      valid: errors.length === 0,
      message: errors.join('; '),
    };
  }

  /**
   * 生成事件绑定ID
   */
  private generateEventBindingId(): string {
    return `binding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 克隆组件
   */
  clone(): ComponentData {
    return JSON.parse(JSON.stringify(this.component));
  }

  /**
   * 导出为 JSON
   */
  toJSON(): string {
    return JSON.stringify(this.component, null, 2);
  }
}

/**
 * 组件编辑器管理器
 *
 * 管理多个组件的编辑器
 */
export class ComponentEditorManager {
  private editors: Map<string, ComponentEditor> = new Map();

  /**
   * 创建组件
   */
  createComponent(type: string, properties?: Record<string, any>): ComponentData {
    const definition = wxComponentLibrary.getComponent(type);
    if (!definition) {
      throw new ComponentEditorError(
        'COMPONENT_NOT_FOUND',
        `组件类型 "${type}" 不存在`,
      );
    }

    // 初始化默认属性值
    const defaultProperties: Record<string, any> = {};
    definition.properties.forEach((prop) => {
      if (prop.defaultValue !== undefined) {
        defaultProperties[prop.name] = prop.defaultValue;
      }
    });

    const component: ComponentData = {
      id: this.generateComponentId(),
      type,
      properties: { ...defaultProperties, ...(properties || {}) },
      styles: definition.defaultStyle || {},
      events: [],
      children: [],
    };

    return component;
  }

  /**
   * 获取编辑器
   */
  getEditor(componentId: string): ComponentEditor | undefined {
    return this.editors.get(componentId);
  }

  /**
   * 创建编辑器
   */
  createEditor(component: ComponentData): ComponentEditor {
    const editor = new ComponentEditor(component);
    this.editors.set(component.id, editor);
    return editor;
  }

  /**
   * 移除编辑器
   */
  removeEditor(componentId: string): boolean {
    return this.editors.delete(componentId);
  }

  /**
   * 清空所有编辑器
   */
  clearEditors(): void {
    this.editors.clear();
  }

  /**
   * 批量创建组件
   */
  createComponents(types: string[]): ComponentData[] {
    return types.map((type) => this.createComponent(type));
  }

  /**
   * 生成组件ID
   */
  private generateComponentId(): string {
    return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 导出默认管理器实例
 */
export const componentEditorManager = new ComponentEditorManager();
