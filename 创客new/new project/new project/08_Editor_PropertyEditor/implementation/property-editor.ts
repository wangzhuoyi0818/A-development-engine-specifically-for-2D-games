/**
 * 微信小程序可视化开发平台 - 属性编辑器核心
 *
 * 提供统一的属性编辑、验证、分组和管理功能
 */

import { EventEmitter } from 'events';
import {
  PropertyDefinition,
  PropertyValue,
  PropertyType,
  PropertyGroup,
  PropertyEditorConfig,
  ValidationResult,
  ValidationError,
  PropertyChangeEvent,
  PropertyEditorEventHandlers,
} from './types';
import { PropertyFormatter } from './property-formatter';

/**
 * 属性编辑器核心类
 * 管理属性定义、值、验证和编辑状态
 */
export class PropertyEditor extends EventEmitter {
  /** 属性定义映射 */
  private definitions: Map<string, PropertyDefinition> = new Map();

  /** 属性分组映射 */
  private groups: Map<string, PropertyGroup> = new Map();

  /** 当前属性值 */
  private currentValues: Record<string, PropertyValue> = {};

  /** 原始属性值 (用于重置) */
  private originalValues: Record<string, PropertyValue> = {};

  /** 正在编辑的属性 */
  private editingProperty?: string;

  /** 错误状态 */
  private errors: Map<string, ValidationError[]> = new Map();

  /** 批量编辑模式 */
  private batchMode: boolean = false;

  /** 批量编辑值 */
  private batchValues: Partial<Record<string, PropertyValue>> = {};

  /** 搜索文本 */
  private searchText: string = '';

  /** 可见属性列表 */
  private visibleProperties: string[] = [];

  /** 展开的分组 */
  private expandedGroups: Set<string> = new Set();

  /** 自定义验证函数 */
  private customValidators: Record<string, (value: PropertyValue) => ValidationError | null> = {};

  /** 配置 */
  private config: PropertyEditorConfig;

  constructor(config: PropertyEditorConfig) {
    super();
    this.config = config;
    this.initialize();
  }

  /**
   * 初始化编辑器
   */
  private initialize(): void {
    // 注册属性定义
    if (this.config.definitions) {
      for (const definition of this.config.definitions) {
        this.registerDefinition(definition);
      }
    }

    // 设置初始值
    if (this.config.initialValues) {
      this.currentValues = { ...this.config.initialValues };
      this.originalValues = { ...this.config.initialValues };
    }

    // 默认展开所有分组
    for (const groupName of this.groups.keys()) {
      this.expandedGroups.add(groupName);
    }

    // 所有属性默认可见
    this.updateVisibleProperties();
  }

  /**
   * 注册属性定义
   */
  registerDefinition(definition: PropertyDefinition): void {
    this.definitions.set(definition.name, definition);

    // 添加到分组
    const groupName = definition.group || '其他';
    if (!this.groups.has(groupName)) {
      this.groups.set(groupName, {
        name: groupName,
        label: groupName,
        order: 999,
        properties: [],
      });
    }

    const group = this.groups.get(groupName)!;
    if (!group.properties.includes(definition.name)) {
      group.properties.push(definition.name);
    }

    // 设置默认值
    if (definition.defaultValue !== undefined && !this.currentValues.hasOwnProperty(definition.name)) {
      this.currentValues[definition.name] = definition.defaultValue;
      this.originalValues[definition.name] = definition.defaultValue;
    }
  }

  /**
   * 注册自定义验证函数
   */
  registerValidator(
    propertyName: string,
    validator: (value: PropertyValue) => ValidationError | null
  ): void {
    this.customValidators[propertyName] = validator;
  }

  /**
   * 获取属性定义
   */
  getDefinition(name: string): PropertyDefinition | undefined {
    return this.definitions.get(name);
  }

  /**
   * 获取属性值
   */
  getProperty(name: string): PropertyValue {
    return this.currentValues[name];
  }

  /**
   * 获取所有属性值
   */
  getAllProperties(): Record<string, PropertyValue> {
    return { ...this.currentValues };
  }

  /**
   * 更新属性值
   */
  updateProperty(name: string, value: PropertyValue): ValidationResult {
    // 验证属性
    const validation = this.validateProperty(name, value);

    if (!validation.valid) {
      // 记录错误状态
      this.errors.set(name, validation.errors);
      // 触发验证事件
      this.emit('validate', name, validation);
      return validation;
    }

    // 清除错误
    this.errors.delete(name);

    // 更新值
    const oldValue = this.currentValues[name];
    this.currentValues[name] = value;

    // 触发验证事件
    this.emit('validate', name, validation);

    // 触发变化事件
    if (!this.batchMode) {
      const event: PropertyChangeEvent = {
        propertyName: name,
        newValue: value,
        oldValue,
        allValues: { ...this.currentValues },
      };
      this.emit('change', event);
    }

    return validation;
  }

  /**
   * 批量更新属性
   */
  batchUpdateProperties(updates: Record<string, PropertyValue>): ValidationResult {
    const allResults = this.validateAll();

    if (allResults.valid) {
      for (const [name, value] of Object.entries(updates)) {
        this.currentValues[name] = value;
      }
    }

    return allResults;
  }

  /**
   * 重置单个属性
   */
  resetProperty(name: string): void {
    if (this.originalValues.hasOwnProperty(name)) {
      const oldValue = this.currentValues[name];
      const newValue = this.originalValues[name];
      this.currentValues[name] = newValue;
      this.errors.delete(name);

      if (!this.batchMode) {
        const event: PropertyChangeEvent = {
          propertyName: name,
          newValue,
          oldValue,
          allValues: { ...this.currentValues },
        };
        this.emit('change', event);
      }
    }
  }

  /**
   * 重置所有属性
   */
  resetAll(): void {
    this.currentValues = { ...this.originalValues };
    this.errors.clear();
    this.emit('resetAll');
  }

  /**
   * 验证单个属性
   */
  validateProperty(name: string, value: PropertyValue): ValidationResult {
    const definition = this.definitions.get(name);

    if (!definition) {
      return {
        valid: false,
        errors: [
          {
            code: 'UNKNOWN_PROPERTY' as any,
            message: `未知属性: ${name}`,
            propertyName: name,
          },
        ],
      };
    }

    const errors: ValidationError[] = [];

    // 必填验证
    if (definition.required) {
      const error = PropertyFormatter.validateRequired(value);
      if (error) {
        errors.push({ ...error, propertyName: name });
      }
    }

    // 类型验证
    if (value !== null && value !== undefined) {
      const error = PropertyFormatter.validateType(value, definition.type);
      if (error) {
        errors.push({ ...error, propertyName: name });
      }
    }

    // 验证规则
    if (definition.validation && value !== null && value !== undefined) {
      const error = PropertyFormatter.validate(value, definition.validation);
      if (error) {
        errors.push({ ...error, propertyName: name });
      }
    }

    // 自定义验证
    if (this.customValidators[name]) {
      const error = this.customValidators[name](value);
      if (error) {
        errors.push({ ...error, propertyName: name });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证所有属性
   */
  validateAll(): ValidationResult {
    const allErrors: ValidationError[] = [];

    for (const [name, value] of Object.entries(this.currentValues)) {
      const result = this.validateProperty(name, value);
      if (!result.valid) {
        allErrors.push(...result.errors);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * 开始批量编辑
   */
  startBatchEdit(): void {
    this.batchMode = true;
    this.batchValues = {};
    this.emit('batchStart');
  }

  /**
   * 在批量编辑中更新属性
   */
  updateBatchProperty(name: string, value: PropertyValue): void {
    if (!this.batchMode) {
      throw new Error('未在批量编辑模式');
    }

    this.batchValues[name] = value;
  }

  /**
   * 提交批量编辑
   */
  commitBatchEdit(): ValidationResult {
    if (!this.batchMode) {
      throw new Error('未在批量编辑模式');
    }

    // 验证所有批量值
    const allResults = this.validateAll();

    if (!allResults.valid) {
      return allResults;
    }

    // 应用批量值
    for (const [name, value] of Object.entries(this.batchValues)) {
      this.currentValues[name] = value;
    }

    this.batchMode = false;
    this.batchValues = {};

    // 触发批量提交事件
    this.emit('batchCommit', { ...this.currentValues });

    return allResults;
  }

  /**
   * 取消批量编辑
   */
  cancelBatchEdit(): void {
    if (!this.batchMode) {
      throw new Error('未在批量编辑模式');
    }

    this.batchMode = false;
    this.batchValues = {};
    this.emit('batchCancel');
  }

  /**
   * 搜索属性
   */
  search(text: string): void {
    this.searchText = text.toLowerCase();
    this.updateVisibleProperties();
    this.emit('search', text);
  }

  /**
   * 更新可见属性列表
   */
  private updateVisibleProperties(): void {
    if (!this.searchText) {
      // 不搜索，显示所有非隐藏属性
      this.visibleProperties = Array.from(this.definitions.values())
        .filter(d => !d.hidden)
        .map(d => d.name);
    } else {
      // 搜索，过滤属性
      this.visibleProperties = Array.from(this.definitions.values())
        .filter(d => {
          if (d.hidden) return false;

          return (
            d.name.toLowerCase().includes(this.searchText) ||
            d.label.toLowerCase().includes(this.searchText) ||
            (d.description && d.description.toLowerCase().includes(this.searchText))
          );
        })
        .map(d => d.name);
    }
  }

  /**
   * 获取可见属性列表
   */
  getVisibleProperties(): string[] {
    return this.visibleProperties;
  }

  /**
   * 获取分组列表
   */
  getGroups(): PropertyGroup[] {
    return Array.from(this.groups.values())
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }

  /**
   * 获取分组中的属性
   */
  getGroupProperties(groupName: string): PropertyDefinition[] {
    const group = this.groups.get(groupName);
    if (!group) return [];

    return group.properties
      .filter(name => this.visibleProperties.includes(name))
      .map(name => this.definitions.get(name))
      .filter((d) => d !== undefined) as PropertyDefinition[];
  }

  /**
   * 切换分组展开/折叠
   */
  toggleGroup(groupName: string): void {
    if (this.expandedGroups.has(groupName)) {
      this.expandedGroups.delete(groupName);
    } else {
      this.expandedGroups.add(groupName);
    }
    this.emit('groupToggle', groupName, this.expandedGroups.has(groupName));
  }

  /**
   * 判断分组是否展开
   */
  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroups.has(groupName);
  }

  /**
   * 获取错误信息
   */
  getErrors(): Map<string, ValidationError[]> {
    return new Map(this.errors);
  }

  /**
   * 获取属性错误
   */
  getPropertyErrors(name: string): ValidationError[] {
    return this.errors.get(name) || [];
  }

  /**
   * 检查是否有错误
   */
  hasErrors(): boolean {
    return this.errors.size > 0;
  }

  /**
   * 清除所有错误
   */
  clearErrors(): void {
    this.errors.clear();
  }

  /**
   * 导出为 JSON
   */
  export(): string {
    return JSON.stringify({
      definitions: Array.from(this.definitions.values()),
      values: this.currentValues,
    }, null, 2);
  }

  /**
   * 从 JSON 导入
   */
  import(json: string): void {
    try {
      const data = JSON.parse(json);

      if (data.definitions) {
        for (const definition of data.definitions) {
          this.registerDefinition(definition);
        }
      }

      if (data.values) {
        for (const [name, value] of Object.entries(data.values)) {
          this.currentValues[name] = value as PropertyValue;
        }
      }
    } catch (error) {
      throw new Error(`导入失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取编辑器状态
   */
  getState() {
    return {
      definitions: Array.from(this.definitions.values()),
      groups: Array.from(this.groups.values()),
      currentValues: { ...this.currentValues },
      originalValues: { ...this.originalValues },
      errors: Array.from(this.errors.entries()),
      batchMode: this.batchMode,
      batchValues: { ...this.batchValues },
      searchText: this.searchText,
      visibleProperties: this.visibleProperties,
      expandedGroups: Array.from(this.expandedGroups),
    };
  }

  /**
   * 销毁编辑器
   */
  destroy(): void {
    this.removeAllListeners();
    this.definitions.clear();
    this.groups.clear();
    this.errors.clear();
  }
}

/**
 * 创建属性编辑器实例
 */
export function createPropertyEditor(config: PropertyEditorConfig): PropertyEditor {
  return new PropertyEditor(config);
}
