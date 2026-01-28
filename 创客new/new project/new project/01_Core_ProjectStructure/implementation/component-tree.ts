/**
 * 微信小程序可视化开发平台 - 组件树管理器
 *
 * 本文件实现了 ComponentTreeManager 类
 * 负责管理页面内组件树的增删改查、移动、复制等操作
 */

import { v4 as uuid } from 'uuid';
import type {
  Component,
  Page,
  ComponentProperty,
  ComponentStyle,
  ValidationResult,
  ValidationError as IValidationError,
} from './types';

// ============================================================================
// 错误类定义
// ============================================================================

/**
 * 组件错误基类
 */
export class ComponentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ComponentError';
  }
}

/**
 * 组件未找到错误
 */
export class ComponentNotFoundError extends ComponentError {
  constructor(componentId: string) {
    super(
      `组件未找到: ${componentId}`,
      'COMPONENT_NOT_FOUND',
      { componentId }
    );
    this.name = 'ComponentNotFoundError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends ComponentError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// 组件树管理器主类
// ============================================================================

/**
 * 组件树管理器
 *
 * 职责:
 * - 管理组件树的增删改查
 * - 提供组件查找和路径查询
 * - 支持组件的移动和复制
 * - 验证组件树的有效性
 */
export class ComponentTreeManager {
  /** 允许有子组件的组件类型 */
  private static readonly CONTAINER_COMPONENTS = new Set([
    'view',
    'scroll-view',
    'swiper',
    'swiper-item',
    'movable-area',
    'movable-view',
    'cover-view',
    'block',
    'form',
  ]);

  /** 最大嵌套深度 */
  private static readonly MAX_DEPTH = 10;

  // ==========================================================================
  // 组件树操作
  // ==========================================================================

  /**
   * 添加组件到页面
   *
   * @param page - 页面对象
   * @param component - 组件对象
   * @param parentId - 父组件ID (可选,为空则添加到根级别)
   * @param index - 插入位置索引 (可选,为空则添加到末尾)
   * @throws ComponentNotFoundError 如果父组件不存在
   * @throws ValidationError 如果验证失败
   */
  addComponent(
    page: Page,
    component: Component,
    parentId?: string,
    index?: number
  ): void {
    // 确保组件有ID
    if (!component.id) {
      component.id = uuid();
    }

    // 初始化组件默认值
    component.properties = component.properties || [];
    component.style = component.style || {};
    component.events = component.events || [];
    component.children = component.children || [];
    component.dataBindings = component.dataBindings || [];

    // 验证组件
    this.validateComponent(component);

    if (!parentId) {
      // 添加到根级别
      if (index !== undefined && index >= 0) {
        page.components.splice(index, 0, component);
      } else {
        page.components.push(component);
      }
    } else {
      // 查找父组件
      const parent = this.findComponent(page.components, parentId);

      if (!parent) {
        throw new ComponentNotFoundError(parentId);
      }

      // 检查父组件是否允许有子组件
      if (!this.canHaveChildren(parent.type)) {
        throw new ValidationError(
          `组件类型 ${parent.type} 不允许有子组件`
        );
      }

      // 添加到父组件
      if (index !== undefined && index >= 0) {
        parent.children.splice(index, 0, component);
      } else {
        parent.children.push(component);
      }

      // 验证嵌套深度
      const depth = this.getComponentDepth(page.components, component.id);
      if (depth > ComponentTreeManager.MAX_DEPTH) {
        // 回滚操作
        this.removeComponent(page, component.id);
        throw new ValidationError(
          `组件嵌套深度超过限制 (最大 ${ComponentTreeManager.MAX_DEPTH} 层)`
        );
      }
    }
  }

  /**
   * 移除组件
   *
   * @param page - 页面对象
   * @param componentId - 组件ID
   * @returns 是否成功移除
   */
  removeComponent(page: Page, componentId: string): boolean {
    return this.removeComponentRecursive(page.components, componentId);
  }

  /**
   * 移动组件
   *
   * @param page - 页面对象
   * @param componentId - 要移动的组件ID
   * @param newParentId - 新父组件ID (可选,为空则移到根级别)
   * @param index - 插入位置索引 (可选,为空则添加到末尾)
   * @throws ComponentNotFoundError 如果组件或父组件不存在
   * @throws ValidationError 如果会造成循环引用
   */
  moveComponent(
    page: Page,
    componentId: string,
    newParentId?: string,
    index?: number
  ): void {
    // 查找要移动的组件
    const component = this.findComponent(page.components, componentId);

    if (!component) {
      throw new ComponentNotFoundError(componentId);
    }

    // 检查是否会造成循环引用
    if (newParentId) {
      if (newParentId === componentId) {
        throw new ValidationError('不能将组件移动到自己下面');
      }

      // 检查新父组件是否是当前组件的子孙
      const isDescendant = this.isDescendant(
        component,
        newParentId
      );

      if (isDescendant) {
        throw new ValidationError(
          '不能将组件移动到自己的子孙组件下面(会造成循环引用)'
        );
      }

      // 检查新父组件是否存在
      const newParent = this.findComponent(page.components, newParentId);
      if (!newParent) {
        throw new ComponentNotFoundError(newParentId);
      }

      // 检查新父组件是否允许有子组件
      if (!this.canHaveChildren(newParent.type)) {
        throw new ValidationError(
          `组件类型 ${newParent.type} 不允许有子组件`
        );
      }
    }

    // 克隆组件(保持完整性)
    const clonedComponent = this.cloneComponent(component);

    // 从原位置移除
    this.removeComponent(page, componentId);

    try {
      // 添加到新位置
      if (!newParentId) {
        // 移到根级别
        if (index !== undefined && index >= 0) {
          page.components.splice(index, 0, clonedComponent);
        } else {
          page.components.push(clonedComponent);
        }
      } else {
        // 移到指定父组件下
        const newParent = this.findComponent(page.components, newParentId)!;

        if (index !== undefined && index >= 0) {
          newParent.children.splice(index, 0, clonedComponent);
        } else {
          newParent.children.push(clonedComponent);
        }
      }

      // 验证嵌套深度
      const depth = this.getComponentDepth(page.components, componentId);
      if (depth > ComponentTreeManager.MAX_DEPTH) {
        throw new ValidationError(
          `移动后组件嵌套深度超过限制 (最大 ${ComponentTreeManager.MAX_DEPTH} 层)`
        );
      }
    } catch (error) {
      // 移动失败,恢复原状
      // (实际应用中应该使用事务机制)
      throw error;
    }
  }

  /**
   * 更新组件属性
   *
   * @param page - 页面对象
   * @param componentId - 组件ID
   * @param updates - 更新内容
   * @returns 更新后的组件对象
   * @throws ComponentNotFoundError 如果组件不存在
   */
  updateComponent(
    page: Page,
    componentId: string,
    updates: Partial<Component>
  ): Component {
    const component = this.findComponent(page.components, componentId);

    if (!component) {
      throw new ComponentNotFoundError(componentId);
    }

    // 应用更新
    if (updates.type !== undefined) {
      component.type = updates.type;
    }

    if (updates.name !== undefined) {
      component.name = updates.name;
    }

    if (updates.properties !== undefined) {
      component.properties = updates.properties;
    }

    if (updates.style !== undefined) {
      component.style = { ...component.style, ...updates.style };
    }

    if (updates.events !== undefined) {
      component.events = updates.events;
    }

    if (updates.dataBindings !== undefined) {
      component.dataBindings = updates.dataBindings;
    }

    if (updates.condition !== undefined) {
      component.condition = updates.condition;
    }

    if (updates.listRendering !== undefined) {
      component.listRendering = updates.listRendering;
    }

    // 验证更新后的组件
    this.validateComponent(component);

    return component;
  }

  // ==========================================================================
  // 查询操作
  // ==========================================================================

  /**
   * 查找组件
   *
   * @param components - 组件列表
   * @param componentId - 组件ID
   * @returns 组件对象,未找到返回 null
   */
  findComponent(
    components: Component[],
    componentId: string
  ): Component | null {
    for (const component of components) {
      if (component.id === componentId) {
        return component;
      }

      const found = this.findComponent(component.children, componentId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * 按类型查找组件
   *
   * @param components - 组件列表
   * @param type - 组件类型
   * @returns 组件列表
   */
  findComponentsByType(
    components: Component[],
    type: string
  ): Component[] {
    const result: Component[] = [];

    for (const component of components) {
      if (component.type === type) {
        result.push(component);
      }

      result.push(...this.findComponentsByType(component.children, type));
    }

    return result;
  }

  /**
   * 获取组件路径
   *
   * @param components - 组件列表
   * @param componentId - 组件ID
   * @param path - 当前路径(递归使用)
   * @returns 组件ID路径数组,未找到返回 null
   */
  getComponentPath(
    components: Component[],
    componentId: string,
    path: string[] = []
  ): string[] | null {
    for (const component of components) {
      if (component.id === componentId) {
        return [...path, component.id];
      }

      const found = this.getComponentPath(
        component.children,
        componentId,
        [...path, component.id]
      );

      if (found) {
        return found;
      }
    }

    return null;
  }

  /**
   * 获取组件的父组件
   *
   * @param page - 页面对象
   * @param componentId - 组件ID
   * @returns 父组件对象,如果是根级组件则返回 null
   */
  getComponentParent(
    page: Page,
    componentId: string
  ): Component | null {
    return this.findParentRecursive(page.components, componentId);
  }

  /**
   * 获取组件深度
   *
   * @param components - 组件列表
   * @param componentId - 组件ID
   * @param currentDepth - 当前深度(递归使用)
   * @returns 组件深度,未找到返回 -1
   */
  getComponentDepth(
    components: Component[],
    componentId: string,
    currentDepth: number = 1
  ): number {
    for (const component of components) {
      if (component.id === componentId) {
        return currentDepth;
      }

      const depth = this.getComponentDepth(
        component.children,
        componentId,
        currentDepth + 1
      );

      if (depth !== -1) {
        return depth;
      }
    }

    return -1;
  }

  // ==========================================================================
  // 树形遍历
  // ==========================================================================

  /**
   * 遍历组件树
   *
   * @param components - 组件列表
   * @param visitor - 访问函数
   */
  traverseComponents(
    components: Component[],
    visitor: (component: Component, depth: number) => void,
    depth: number = 0
  ): void {
    for (const component of components) {
      visitor(component, depth);
      this.traverseComponents(component.children, visitor, depth + 1);
    }
  }

  /**
   * 验证组件树
   *
   * @param components - 组件列表
   * @returns 验证结果
   */
  validateComponentTree(components: Component[]): ValidationResult {
    const errors: IValidationError[] = [];
    const warnings: IValidationError[] = [];

    // 检查重复ID
    const idSet = new Set<string>();

    this.traverseComponents(components, (component, depth) => {
      // 检查ID唯一性
      if (idSet.has(component.id)) {
        errors.push({
          code: 'DUPLICATE_ID',
          message: `组件ID重复: ${component.id}`,
          path: component.id,
        });
      }
      idSet.add(component.id);

      // 检查嵌套深度
      if (depth > ComponentTreeManager.MAX_DEPTH) {
        errors.push({
          code: 'MAX_DEPTH_EXCEEDED',
          message: `组件嵌套深度超过限制: ${depth} > ${ComponentTreeManager.MAX_DEPTH}`,
          path: component.id,
        });
      }

      // 检查容器组件
      if (component.children.length > 0 && !this.canHaveChildren(component.type)) {
        errors.push({
          code: 'INVALID_CHILDREN',
          message: `组件类型 ${component.type} 不允许有子组件`,
          path: component.id,
        });
      }

      // 检查组件类型
      if (!component.type || component.type.trim() === '') {
        errors.push({
          code: 'MISSING_TYPE',
          message: '组件类型不能为空',
          path: component.id,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ==========================================================================
  // 私有辅助方法
  // ==========================================================================

  /**
   * 递归移除组件
   */
  private removeComponentRecursive(
    components: Component[],
    componentId: string
  ): boolean {
    for (let i = 0; i < components.length; i++) {
      if (components[i].id === componentId) {
        components.splice(i, 1);
        return true;
      }

      if (this.removeComponentRecursive(components[i].children, componentId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 递归查找父组件
   */
  private findParentRecursive(
    components: Component[],
    componentId: string
  ): Component | null {
    for (const component of components) {
      // 检查直接子组件
      if (component.children.some((child) => child.id === componentId)) {
        return component;
      }

      // 递归查找
      const parent = this.findParentRecursive(component.children, componentId);
      if (parent) {
        return parent;
      }
    }

    return null;
  }

  /**
   * 克隆组件(深拷贝)
   */
  private cloneComponent(component: Component): Component {
    return structuredClone(component);
  }

  /**
   * 检查组件类型是否允许有子组件
   */
  private canHaveChildren(type: string): boolean {
    return ComponentTreeManager.CONTAINER_COMPONENTS.has(type);
  }

  /**
   * 检查目标组件是否是源组件的子孙
   */
  private isDescendant(
    source: Component,
    targetId: string
  ): boolean {
    for (const child of source.children) {
      if (child.id === targetId) {
        return true;
      }

      if (this.isDescendant(child, targetId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 验证单个组件
   */
  private validateComponent(component: Component): void {
    // 验证组件类型
    if (!component.type || component.type.trim() === '') {
      throw new ValidationError('组件类型不能为空');
    }

    // 验证组件ID
    if (!component.id || component.id.trim() === '') {
      throw new ValidationError('组件ID不能为空');
    }
  }
}
