/**
 * 组件注册表
 *
 * 管理所有可用的微信小程序组件定义，提供注册、查询、搜索等功能
 */

import {
  ComponentDefinition,
  ComponentCategory,
  ComponentSearchQuery,
  ComponentSearchResult,
  ComponentRegistrationOptions,
  BatchRegistrationResult,
  ComponentNotFoundError,
  DuplicateComponentError,
  InvalidInputError,
} from './types';

/**
 * 组件注册表类
 */
export class ComponentRegistry {
  /**
   * 主索引: ID -> 组件定义
   */
  private components: Map<string, ComponentDefinition>;

  /**
   * 分类索引: 分类 -> 组件ID集合
   */
  private categoryIndex: Map<ComponentCategory, Set<string>>;

  /**
   * 类型索引: 组件名称 -> 组件定义
   */
  private typeIndex: Map<string, ComponentDefinition>;

  /**
   * 标签索引: 标签 -> 组件ID集合
   */
  private tagIndex: Map<string, Set<string>>;

  constructor() {
    this.components = new Map();
    this.categoryIndex = new Map();
    this.typeIndex = new Map();
    this.tagIndex = new Map();

    // 初始化分类索引
    Object.values(ComponentCategory).forEach((category) => {
      this.categoryIndex.set(category, new Set());
    });
  }

  // ========================================================================
  // 注册方法
  // ========================================================================

  /**
   * 注册单个组件
   */
  register(
    definition: ComponentDefinition,
    options: ComponentRegistrationOptions = {}
  ): void {
    const { override = false, validate = true } = options;

    // 验证组件定义
    if (validate) {
      this.validateComponentDefinition(definition);
    }

    // 检查是否已存在
    if (this.components.has(definition.id) && !override) {
      throw new DuplicateComponentError(definition.id);
    }

    // 添加到主索引
    this.components.set(definition.id, definition);

    // 添加到分类索引
    const categorySet = this.categoryIndex.get(definition.category);
    if (categorySet) {
      categorySet.add(definition.id);
    }

    // 添加到类型索引
    this.typeIndex.set(definition.name, definition);

    // 添加到标签索引
    if (definition.tags) {
      definition.tags.forEach((tag) => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(definition.id);
      });
    }

    // 调用注册回调
    if (options.onRegistered) {
      options.onRegistered(definition);
    }
  }

  /**
   * 批量注册组件
   */
  registerBatch(
    definitions: ComponentDefinition[],
    options: ComponentRegistrationOptions = {}
  ): BatchRegistrationResult {
    const result: BatchRegistrationResult = {
      successCount: 0,
      failureCount: 0,
      failures: [],
    };

    definitions.forEach((definition) => {
      try {
        this.register(definition, options);
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.failures.push({
          definition,
          error: error as Error,
        });
      }
    });

    return result;
  }

  /**
   * 注销组件
   */
  unregister(id: string): boolean {
    const definition = this.components.get(id);
    if (!definition) {
      return false;
    }

    // 从主索引删除
    this.components.delete(id);

    // 从分类索引删除
    const categorySet = this.categoryIndex.get(definition.category);
    if (categorySet) {
      categorySet.delete(id);
    }

    // 从类型索引删除
    this.typeIndex.delete(definition.name);

    // 从标签索引删除
    if (definition.tags) {
      definition.tags.forEach((tag) => {
        const tagSet = this.tagIndex.get(tag);
        if (tagSet) {
          tagSet.delete(id);
          // 如果标签集合为空，删除该标签
          if (tagSet.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }

    return true;
  }

  // ========================================================================
  // 查询方法
  // ========================================================================

  /**
   * 根据 ID 获取组件定义
   */
  getById(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  /**
   * 根据类型（组件名称）获取组件定义
   */
  getByType(type: string): ComponentDefinition | undefined {
    return this.typeIndex.get(type);
  }

  /**
   * 根据分类获取组件列表
   */
  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) {
      return [];
    }

    return Array.from(ids)
      .map((id) => this.components.get(id))
      .filter((def): def is ComponentDefinition => def !== undefined);
  }

  /**
   * 根据标签获取组件列表
   */
  getByTag(tag: string): ComponentDefinition[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) {
      return [];
    }

    return Array.from(ids)
      .map((id) => this.components.get(id))
      .filter((def): def is ComponentDefinition => def !== undefined);
  }

  /**
   * 获取所有组件
   */
  getAllComponents(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * 获取所有分类
   */
  getCategories(): ComponentCategory[] {
    return Array.from(this.categoryIndex.keys());
  }

  /**
   * 获取所有标签
   */
  getAllTags(): string[] {
    return Array.from(this.tagIndex.keys());
  }

  /**
   * 检查组件是否存在
   */
  has(id: string): boolean {
    return this.components.has(id);
  }

  /**
   * 检查类型是否存在
   */
  hasType(type: string): boolean {
    return this.typeIndex.has(type);
  }

  /**
   * 获取组件数量
   */
  getCount(): number {
    return this.components.size;
  }

  /**
   * 获取分类下的组件数量
   */
  getCategoryCount(category: ComponentCategory): number {
    const ids = this.categoryIndex.get(category);
    return ids ? ids.size : 0;
  }

  // ========================================================================
  // 搜索方法
  // ========================================================================

  /**
   * 搜索组件
   */
  search(query: ComponentSearchQuery): ComponentSearchResult {
    let candidates = this.getAllComponents();

    // 按分类过滤
    if (query.category !== undefined) {
      candidates = this.getByCategory(query.category);
    }

    // 按关键词过滤
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      candidates = candidates.filter((def) => {
        return (
          def.name.toLowerCase().includes(keyword) ||
          def.label.toLowerCase().includes(keyword) ||
          def.description?.toLowerCase().includes(keyword) ||
          def.tags?.some((tag) => tag.toLowerCase().includes(keyword))
        );
      });
    }

    // 按标签过滤
    if (query.tags && query.tags.length > 0) {
      candidates = candidates.filter((def) => {
        return query.tags!.some((tag) => def.tags?.includes(tag));
      });
    }

    // 按容器类型过滤
    if (query.isContainer !== undefined) {
      candidates = candidates.filter((def) => def.isContainer === query.isContainer);
    }

    // 按内联类型过滤
    if (query.isInline !== undefined) {
      candidates = candidates.filter((def) => def.isInline === query.isInline);
    }

    // 按是否允许子组件过滤
    if (query.canHaveChildren !== undefined) {
      candidates = candidates.filter((def) => def.canHaveChildren === query.canHaveChildren);
    }

    // 排序
    this.sortResults(candidates, query.sortBy || 'name', query.sortOrder || 'asc');

    // 分页
    const page = query.page || 0;
    const pageSize = query.pageSize || candidates.length;
    const total = candidates.length;
    const totalPages = Math.ceil(total / pageSize);

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const items = candidates.slice(startIndex, endIndex);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 排序搜索结果
   */
  private sortResults(
    results: ComponentDefinition[],
    sortBy: 'name' | 'label' | 'category' | 'relevance',
    sortOrder: 'asc' | 'desc'
  ): void {
    const compare = (a: ComponentDefinition, b: ComponentDefinition): number => {
      let valueA: any;
      let valueB: any;

      switch (sortBy) {
        case 'name':
          valueA = a.name;
          valueB = b.name;
          break;
        case 'label':
          valueA = a.label;
          valueB = b.label;
          break;
        case 'category':
          valueA = a.category;
          valueB = b.category;
          break;
        case 'relevance':
          // 相关度排序（简单实现：按标签数量）
          valueA = a.tags?.length || 0;
          valueB = b.tags?.length || 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    };

    results.sort(compare);
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 清空注册表
   */
  clear(): void {
    this.components.clear();
    this.typeIndex.clear();
    this.tagIndex.clear();

    // 重新初始化分类索引
    this.categoryIndex.forEach((set) => set.clear());
  }

  /**
   * 导出所有组件定义
   */
  export(): ComponentDefinition[] {
    return this.getAllComponents();
  }

  /**
   * 从数组导入组件定义
   */
  import(definitions: ComponentDefinition[], override: boolean = false): BatchRegistrationResult {
    return this.registerBatch(definitions, { override });
  }

  /**
   * 获取组件的父组件限制
   */
  getAllowedParents(componentId: string): string[] | undefined {
    const definition = this.getById(componentId);
    return definition?.allowedParents;
  }

  /**
   * 获取组件的子组件限制
   */
  getAllowedChildren(componentId: string): string[] | undefined {
    const definition = this.getById(componentId);
    return definition?.allowedChildren;
  }

  /**
   * 检查两个组件是否可以嵌套
   */
  canNest(parentType: string, childType: string): boolean {
    const parentDef = this.getByType(parentType);
    const childDef = this.getByType(childType);

    if (!parentDef || !childDef) {
      return false;
    }

    // 检查父组件是否允许子组件
    if (!parentDef.canHaveChildren) {
      return false;
    }

    // 检查父组件的子组件类型限制
    if (parentDef.allowedChildren && !parentDef.allowedChildren.includes(childType)) {
      return false;
    }

    // 检查子组件的父组件类型限制
    if (childDef.allowedParents && !childDef.allowedParents.includes(parentType)) {
      return false;
    }

    return true;
  }

  /**
   * 获取可以作为指定组件子组件的组件列表
   */
  getAvailableChildren(parentType: string): ComponentDefinition[] {
    const parentDef = this.getByType(parentType);
    if (!parentDef || !parentDef.canHaveChildren) {
      return [];
    }

    // 如果没有限制，返回所有组件
    if (!parentDef.allowedChildren) {
      return this.getAllComponents();
    }

    // 根据限制返回允许的组件
    return parentDef.allowedChildren
      .map((type) => this.getByType(type))
      .filter((def): def is ComponentDefinition => def !== undefined);
  }

  /**
   * 获取可以作为指定组件父组件的组件列表
   */
  getAvailableParents(childType: string): ComponentDefinition[] {
    const childDef = this.getByType(childType);
    if (!childDef) {
      return [];
    }

    // 如果没有限制，返回所有容器组件
    if (!childDef.allowedParents) {
      return this.getAllComponents().filter((def) => def.canHaveChildren);
    }

    // 根据限制返回允许的组件
    return childDef.allowedParents
      .map((type) => this.getByType(type))
      .filter((def): def is ComponentDefinition => def !== undefined && def.canHaveChildren);
  }

  // ========================================================================
  // 验证方法
  // ========================================================================

  /**
   * 验证组件定义
   */
  private validateComponentDefinition(definition: ComponentDefinition): void {
    // 验证必填字段
    if (!definition.id) {
      throw new InvalidInputError('Component id is required');
    }

    if (!definition.name) {
      throw new InvalidInputError('Component name is required');
    }

    if (!definition.label) {
      throw new InvalidInputError('Component label is required');
    }

    if (!definition.category) {
      throw new InvalidInputError('Component category is required');
    }

    // 验证ID格式（建议格式）
    if (!definition.id.startsWith('wechat-') && !definition.id.startsWith('custom-')) {
      console.warn(
        `Component id "${definition.id}" should start with "wechat-" or "custom-"`
      );
    }

    // 验证分类是否有效
    if (!Object.values(ComponentCategory).includes(definition.category)) {
      throw new InvalidInputError(`Invalid component category: ${definition.category}`);
    }

    // 验证属性定义
    if (definition.properties) {
      definition.properties.forEach((prop, index) => {
        if (!prop.name) {
          throw new InvalidInputError(`Property at index ${index} is missing name`);
        }
        if (!prop.type) {
          throw new InvalidInputError(`Property "${prop.name}" is missing type`);
        }
      });
    }

    // 验证事件定义
    if (definition.events) {
      definition.events.forEach((event, index) => {
        if (!event.name) {
          throw new InvalidInputError(`Event at index ${index} is missing name`);
        }
      });
    }

    // 验证容器组件
    if (definition.isContainer && !definition.canHaveChildren) {
      console.warn(
        `Component "${definition.id}" is marked as container but cannot have children`
      );
    }
  }

  /**
   * 获取统计信息
   */
  getStatistics() {
    const stats = {
      totalComponents: this.components.size,
      categories: {} as Record<string, number>,
      containers: 0,
      inline: 0,
      withBehaviors: 0,
      deprecated: 0,
    };

    // 统计各分类数量
    this.categoryIndex.forEach((ids, category) => {
      stats.categories[category] = ids.size;
    });

    // 统计其他属性
    this.components.forEach((def) => {
      if (def.isContainer) stats.containers++;
      if (def.isInline) stats.inline++;
      if (def.behaviors && def.behaviors.length > 0) stats.withBehaviors++;
      if (def.deprecated) stats.deprecated++;
    });

    return stats;
  }
}

/**
 * 创建默认的组件注册表实例
 */
export function createComponentRegistry(): ComponentRegistry {
  return new ComponentRegistry();
}

/**
 * 全局组件注册表实例（单例）
 */
let globalRegistry: ComponentRegistry | null = null;

/**
 * 获取全局组件注册表实例
 */
export function getGlobalRegistry(): ComponentRegistry {
  if (!globalRegistry) {
    globalRegistry = createComponentRegistry();
  }
  return globalRegistry;
}

/**
 * 重置全局组件注册表
 */
export function resetGlobalRegistry(): void {
  globalRegistry = null;
}
