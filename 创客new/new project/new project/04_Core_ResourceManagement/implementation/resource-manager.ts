/**
 * 微信小程序可视化开发平台 - 资源管理器
 *
 * 本文件实现了 ResourceManager 类
 * 负责资源的增删改查、验证等核心功能
 */

import { v4 as uuid } from 'uuid';
import type {
  Resource,
  ResourceType,
  ResourcePathType,
  ResourceCreateOptions,
  ResourceUpdateOptions,
  ResourceQuery,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';
import {
  RESOURCE_SIZE_LIMITS,
  SUPPORTED_FORMATS,
  MAX_RESOURCE_NAME_LENGTH,
} from './types';

// ============================================================================
// 错误类定义
// ============================================================================

/**
 * 资源错误基类
 */
export class ResourceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ResourceError';
  }
}

/**
 * 资源未找到错误
 */
export class ResourceNotFoundError extends ResourceError {
  constructor(resourceId: string) {
    super(
      `资源未找到: ${resourceId}`,
      'RESOURCE_NOT_FOUND',
      { resourceId }
    );
    this.name = 'ResourceNotFoundError';
  }
}

/**
 * 资源已存在错误
 */
export class ResourceAlreadyExistsError extends ResourceError {
  constructor(name: string) {
    super(
      `资源已存在: ${name}`,
      'RESOURCE_ALREADY_EXISTS',
      { name }
    );
    this.name = 'ResourceAlreadyExistsError';
  }
}

/**
 * 资源验证错误
 */
export class ResourceValidationError extends ResourceError {
  constructor(message: string, details?: any) {
    super(message, 'RESOURCE_VALIDATION_ERROR', details);
    this.name = 'ResourceValidationError';
  }
}

// ============================================================================
// 资源管理器主类
// ============================================================================

/**
 * 资源管理器
 *
 * 职责:
 * - 管理项目中所有资源的增删改查
 * - 验证资源的有效性
 * - 按条件查询和筛选资源
 * - 管理资源的生命周期
 */
export class ResourceManager {
  /** 资源存储 Map (id -> Resource) */
  private resources: Map<string, Resource> = new Map();

  /** 资源名称索引 (name -> id) 用于快速查找 */
  private nameIndex: Map<string, string> = new Map();

  /** 类型索引 (type -> Set<id>) 用于按类型查询 */
  private typeIndex: Map<ResourceType, Set<string>> = new Map();

  constructor() {
    // 初始化类型索引
    Object.values(ResourceType).forEach((type) => {
      this.typeIndex.set(type as ResourceType, new Set());
    });
  }

  // ==========================================================================
  // 资源增删改查
  // ==========================================================================

  /**
   * 添加资源
   *
   * @param options - 资源创建选项
   * @returns 创建的资源对象
   * @throws ResourceValidationError 如果资源验证失败
   * @throws ResourceAlreadyExistsError 如果资源名称已存在
   */
  addResource(options: ResourceCreateOptions): Resource {
    // 验证资源
    const validation = this.validateResourceOptions(options);
    if (!validation.valid) {
      throw new ResourceValidationError(
        '资源验证失败',
        { errors: validation.errors }
      );
    }

    // 检查名称是否已存在
    if (this.hasResourceByName(options.name)) {
      throw new ResourceAlreadyExistsError(options.name);
    }

    // 自动检测路径类型(如果未提供)
    const pathType = options.pathType || this.detectPathType(options.path);

    // 创建资源对象
    const resource: Resource = {
      id: uuid(),
      name: options.name,
      type: options.type,
      path: options.path,
      pathType,
      size: options.size,
      metadata: options.metadata || {},
      tags: options.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 存储资源
    this.resources.set(resource.id, resource);
    this.nameIndex.set(resource.name, resource.id);
    this.typeIndex.get(resource.type)?.add(resource.id);

    return resource;
  }

  /**
   * 移除资源
   *
   * @param resourceId - 资源ID
   * @throws ResourceNotFoundError 如果资源不存在
   */
  removeResource(resourceId: string): void {
    const resource = this.getResource(resourceId);

    // 从索引中移除
    this.nameIndex.delete(resource.name);
    this.typeIndex.get(resource.type)?.delete(resource.id);

    // 从存储中移除
    this.resources.delete(resourceId);
  }

  /**
   * 获取资源
   *
   * @param resourceId - 资源ID
   * @returns 资源对象
   * @throws ResourceNotFoundError 如果资源不存在
   */
  getResource(resourceId: string): Resource {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new ResourceNotFoundError(resourceId);
    }
    return resource;
  }

  /**
   * 按名称获取资源
   *
   * @param name - 资源名称
   * @returns 资源对象或 null
   */
  getResourceByName(name: string): Resource | null {
    const resourceId = this.nameIndex.get(name);
    if (!resourceId) {
      return null;
    }
    return this.resources.get(resourceId) || null;
  }

  /**
   * 检查资源是否存在
   *
   * @param resourceId - 资源ID
   * @returns 是否存在
   */
  hasResource(resourceId: string): boolean {
    return this.resources.has(resourceId);
  }

  /**
   * 检查资源名称是否存在
   *
   * @param name - 资源名称
   * @returns 是否存在
   */
  hasResourceByName(name: string): boolean {
    return this.nameIndex.has(name);
  }

  /**
   * 重命名资源
   *
   * @param resourceId - 资源ID
   * @param newName - 新名称
   * @throws ResourceNotFoundError 如果资源不存在
   * @throws ResourceAlreadyExistsError 如果新名称已存在
   * @throws ResourceValidationError 如果新名称验证失败
   */
  renameResource(resourceId: string, newName: string): void {
    const resource = this.getResource(resourceId);

    // 验证新名称
    if (!this.isValidResourceName(newName)) {
      throw new ResourceValidationError(
        `资源名称无效: ${newName}`,
        { name: newName }
      );
    }

    // 检查新名称是否已存在(排除当前资源)
    const existingId = this.nameIndex.get(newName);
    if (existingId && existingId !== resourceId) {
      throw new ResourceAlreadyExistsError(newName);
    }

    // 更新名称索引
    this.nameIndex.delete(resource.name);
    resource.name = newName;
    resource.updatedAt = new Date();
    this.nameIndex.set(newName, resourceId);
  }

  /**
   * 更新资源
   *
   * @param resourceId - 资源ID
   * @param updates - 更新选项
   * @returns 更新后的资源对象
   * @throws ResourceNotFoundError 如果资源不存在
   */
  updateResource(
    resourceId: string,
    updates: ResourceUpdateOptions
  ): Resource {
    const resource = this.getResource(resourceId);

    // 更新名称
    if (updates.name && updates.name !== resource.name) {
      this.renameResource(resourceId, updates.name);
    }

    // 更新路径
    if (updates.path) {
      resource.path = updates.path;
      resource.pathType = this.detectPathType(updates.path);
    }

    // 更新元数据
    if (updates.metadata) {
      resource.metadata = {
        ...resource.metadata,
        ...updates.metadata,
      };
    }

    // 更新标签
    if (updates.tags) {
      resource.tags = updates.tags;
    }

    resource.updatedAt = new Date();
    return resource;
  }

  /**
   * 列出所有资源
   *
   * @returns 资源数组
   */
  listResources(): Resource[] {
    return Array.from(this.resources.values());
  }

  /**
   * 按类型查找资源
   *
   * @param type - 资源类型
   * @returns 资源数组
   */
  findResourcesByType(type: ResourceType): Resource[] {
    const resourceIds = this.typeIndex.get(type);
    if (!resourceIds) {
      return [];
    }

    const resources: Resource[] = [];
    resourceIds.forEach((id) => {
      const resource = this.resources.get(id);
      if (resource) {
        resources.push(resource);
      }
    });

    return resources;
  }

  /**
   * 按条件查询资源
   *
   * @param query - 查询条件
   * @returns 资源数组
   */
  queryResources(query: ResourceQuery): Resource[] {
    let results = this.listResources();

    // 按类型筛选
    if (query.type) {
      results = results.filter((r) => r.type === query.type);
    }

    // 按标签筛选
    if (query.tags && query.tags.length > 0) {
      results = results.filter((r) =>
        query.tags!.some((tag) => r.tags?.includes(tag))
      );
    }

    // 按名称模糊匹配
    if (query.namePattern) {
      const pattern = query.namePattern.toLowerCase();
      results = results.filter((r) =>
        r.name.toLowerCase().includes(pattern)
      );
    }

    // 按大小筛选
    if (query.minSize !== undefined) {
      results = results.filter((r) => r.size >= query.minSize!);
    }

    if (query.maxSize !== undefined) {
      results = results.filter((r) => r.size <= query.maxSize!);
    }

    return results;
  }

  /**
   * 获取资源总数
   *
   * @returns 资源数量
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 按类型获取资源数量
   *
   * @param type - 资源类型
   * @returns 资源数量
   */
  getResourceCountByType(type: ResourceType): number {
    return this.typeIndex.get(type)?.size || 0;
  }

  /**
   * 清空所有资源
   */
  clear(): void {
    this.resources.clear();
    this.nameIndex.clear();
    this.typeIndex.forEach((set) => set.clear());
  }

  // ==========================================================================
  // 资源验证
  // ==========================================================================

  /**
   * 验证资源选项
   *
   * @param options - 资源创建选项
   * @returns 验证结果
   */
  validateResourceOptions(options: ResourceCreateOptions): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 验证名称
    if (!options.name || options.name.trim().length === 0) {
      errors.push({
        code: 'EMPTY_NAME',
        message: '资源名称不能为空',
        field: 'name',
      });
    } else if (options.name.length > MAX_RESOURCE_NAME_LENGTH) {
      errors.push({
        code: 'NAME_TOO_LONG',
        message: `资源名称长度不能超过 ${MAX_RESOURCE_NAME_LENGTH} 个字符`,
        field: 'name',
      });
    }

    // 验证路径
    if (!options.path || options.path.trim().length === 0) {
      errors.push({
        code: 'EMPTY_PATH',
        message: '资源路径不能为空',
        field: 'path',
      });
    }

    // 验证文件大小
    if (options.size <= 0) {
      errors.push({
        code: 'INVALID_SIZE',
        message: '文件大小必须大于 0',
        field: 'size',
      });
    } else {
      const sizeLimit = RESOURCE_SIZE_LIMITS[options.type];
      if (options.size > sizeLimit) {
        errors.push({
          code: 'SIZE_EXCEEDS_LIMIT',
          message: `文件大小超过限制 (${this.formatBytes(sizeLimit)})`,
          field: 'size',
          details: {
            size: options.size,
            limit: sizeLimit,
          },
        });
      } else if (options.size > sizeLimit * 0.8) {
        // 警告:文件大小接近限制
        warnings.push({
          code: 'SIZE_NEAR_LIMIT',
          message: `文件大小接近限制 (${this.formatBytes(sizeLimit)})`,
          field: 'size',
        });
      }
    }

    // 验证文件格式
    const format = this.getFileExtension(options.path);
    if (format) {
      const supportedFormats = SUPPORTED_FORMATS[options.type];
      if (!supportedFormats.includes(format)) {
        errors.push({
          code: 'UNSUPPORTED_FORMAT',
          message: `不支持的文件格式: ${format}`,
          field: 'path',
          details: {
            format,
            supportedFormats,
          },
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 验证资源
   *
   * @param resource - 资源对象
   * @returns 验证结果
   */
  validateResource(resource: Resource): ValidationResult {
    return this.validateResourceOptions({
      name: resource.name,
      type: resource.type,
      path: resource.path,
      size: resource.size,
      metadata: resource.metadata,
      tags: resource.tags,
    });
  }

  // ==========================================================================
  // 辅助方法
  // ==========================================================================

  /**
   * 检测路径类型
   *
   * @param path - 资源路径
   * @returns 路径类型
   */
  private detectPathType(path: string): ResourcePathType {
    if (path.startsWith('cloud://')) {
      return ResourcePathType.Cloud;
    } else if (path.startsWith('http://') || path.startsWith('https://')) {
      return ResourcePathType.Network;
    } else {
      return ResourcePathType.Local;
    }
  }

  /**
   * 获取文件扩展名
   *
   * @param path - 文件路径
   * @returns 扩展名(小写,不含点)
   */
  private getFileExtension(path: string): string {
    const match = path.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * 验证资源名称
   *
   * @param name - 资源名称
   * @returns 是否有效
   */
  private isValidResourceName(name: string): boolean {
    return (
      name &&
      name.trim().length > 0 &&
      name.length <= MAX_RESOURCE_NAME_LENGTH
    );
  }

  /**
   * 格式化字节数
   *
   * @param bytes - 字节数
   * @returns 格式化后的字符串
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 序列化为 JSON
   *
   * @returns JSON 字符串
   */
  toJSON(): string {
    const resources = this.listResources();
    return JSON.stringify(resources, null, 2);
  }

  /**
   * 从 JSON 反序列化
   *
   * @param json - JSON 字符串
   */
  fromJSON(json: string): void {
    try {
      const resources: Resource[] = JSON.parse(json);

      // 清空现有数据
      this.clear();

      // 重新添加资源
      resources.forEach((resource) => {
        // 转换日期字符串为 Date 对象
        resource.createdAt = new Date(resource.createdAt);
        resource.updatedAt = new Date(resource.updatedAt);

        // 直接存储(跳过验证,因为数据来自序列化)
        this.resources.set(resource.id, resource);
        this.nameIndex.set(resource.name, resource.id);
        this.typeIndex.get(resource.type)?.add(resource.id);
      });
    } catch (error) {
      throw new ResourceError(
        '反序列化失败',
        'DESERIALIZATION_ERROR',
        { error }
      );
    }
  }
}
