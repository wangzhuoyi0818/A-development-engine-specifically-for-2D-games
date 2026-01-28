/**
 * 微信小程序可视化开发平台 - 项目管理器核心实现
 *
 * 本文件实现了 MiniProgramProjectManager 类
 * 负责项目的创建、管理、序列化等核心功能
 */

import { v4 as uuid } from 'uuid';
import type {
  MiniProgramProject,
  ProjectConfig,
  ProjectOptions,
  UpdateProjectOptions,
  Page,
  PageConfig,
  WindowConfig,
  TabBarConfig,
  Transaction,
  Operation,
  ValidationResult,
  ValidationError,
  Variable,
  Resource,
} from './types';

// ============================================================================
// 错误类定义
// ============================================================================

/**
 * 项目错误基类
 */
export class ProjectError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProjectError';
  }
}

/**
 * 项目未找到错误
 */
export class ProjectNotFoundError extends ProjectError {
  constructor(projectId: string) {
    super(
      `项目未找到: ${projectId}`,
      'PROJECT_NOT_FOUND',
      { projectId }
    );
    this.name = 'ProjectNotFoundError';
  }
}

/**
 * 页面未找到错误
 */
export class PageNotFoundError extends ProjectError {
  constructor(pageId: string) {
    super(
      `页面未找到: ${pageId}`,
      'PAGE_NOT_FOUND',
      { pageId }
    );
    this.name = 'PageNotFoundError';
  }
}

/**
 * 验证错误
 */
export class ValidationError extends ProjectError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * 序列化错误
 */
export class SerializationError extends ProjectError {
  constructor(message: string, details?: any) {
    super(message, 'SERIALIZATION_ERROR', details);
    this.name = 'SerializationError';
  }
}

// ============================================================================
// 项目管理器主类
// ============================================================================

/**
 * 微信小程序项目管理器
 *
 * 职责:
 * - 管理项目的创建、删除、获取
 * - 管理页面的增删改查
 * - 提供序列化和反序列化功能
 * - 提供事务支持确保数据一致性
 */
export class MiniProgramProjectManager {
  /** 项目存储 Map */
  private projects: Map<string, MiniProgramProject> = new Map();

  /** 事务存储 Map */
  private transactions: Map<string, Transaction> = new Map();

  // ==========================================================================
  // 项目生命周期管理
  // ==========================================================================

  /**
   * 创建新项目
   *
   * @param options - 项目选项
   * @returns 创建的项目对象
   * @throws ValidationError 如果参数验证失败
   */
  createProject(options: ProjectOptions): MiniProgramProject {
    // 验证项目名称
    if (!options.name || options.name.trim().length === 0) {
      throw new ValidationError('项目名称不能为空');
    }

    if (options.name.length > 50) {
      throw new ValidationError('项目名称长度不能超过 50 个字符');
    }

    // 验证版本号格式(语义化版本)
    const version = options.version || '1.0.0';
    if (!this.isValidVersion(version)) {
      throw new ValidationError(
        `版本号格式无效: ${version}, 应符合语义化版本规范 (如 1.0.0)`
      );
    }

    // 验证 AppID 格式(如果提供)
    if (options.appId && !this.isValidAppId(options.appId)) {
      throw new ValidationError(
        `AppID 格式无效: ${options.appId}, 应以 wx 开头后跟16位字符`
      );
    }

    try {
      // 创建项目对象
      const project: MiniProgramProject = {
        id: uuid(),
        name: options.name.trim(),
        version,
        description: options.description,
        appId: options.appId,
        config: this.getDefaultProjectConfig(options.config),
        pages: [],
        globalComponents: [],
        resources: [],
        globalVariables: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 存储项目
      this.projects.set(project.id, project);

      return project;
    } catch (error) {
      throw new ProjectError(
        `创建项目失败: ${(error as Error).message}`,
        'CREATE_PROJECT_FAILED',
        { error }
      );
    }
  }

  /**
   * 删除项目
   *
   * @param projectId - 项目ID
   * @throws ProjectNotFoundError 如果项目不存在
   */
  deleteProject(projectId: string): void {
    if (!this.hasProject(projectId)) {
      throw new ProjectNotFoundError(projectId);
    }

    this.projects.delete(projectId);
  }

  /**
   * 获取项目
   *
   * @param projectId - 项目ID
   * @returns 项目对象
   * @throws ProjectNotFoundError 如果项目不存在
   */
  getProject(projectId: string): MiniProgramProject {
    const project = this.projects.get(projectId);

    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }

    return project;
  }

  /**
   * 检查项目是否存在
   *
   * @param projectId - 项目ID
   * @returns 是否存在
   */
  hasProject(projectId: string): boolean {
    return this.projects.has(projectId);
  }

  /**
   * 列出所有项目
   *
   * @returns 项目列表
   */
  listProjects(): MiniProgramProject[] {
    return Array.from(this.projects.values());
  }

  /**
   * 更新项目信息
   *
   * @param projectId - 项目ID
   * @param updates - 更新内容
   * @returns 更新后的项目对象
   * @throws ProjectNotFoundError 如果项目不存在
   * @throws ValidationError 如果更新内容验证失败
   */
  updateProject(
    projectId: string,
    updates: UpdateProjectOptions
  ): MiniProgramProject {
    const project = this.getProject(projectId);

    // 验证更新内容
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new ValidationError('项目名称不能为空');
      }
      if (updates.name.length > 50) {
        throw new ValidationError('项目名称长度不能超过 50 个字符');
      }
      project.name = updates.name.trim();
    }

    if (updates.version !== undefined) {
      if (!this.isValidVersion(updates.version)) {
        throw new ValidationError(
          `版本号格式无效: ${updates.version}`
        );
      }
      project.version = updates.version;
    }

    if (updates.description !== undefined) {
      project.description = updates.description;
    }

    if (updates.appId !== undefined) {
      if (updates.appId && !this.isValidAppId(updates.appId)) {
        throw new ValidationError(
          `AppID 格式无效: ${updates.appId}`
        );
      }
      project.appId = updates.appId;
    }

    // 更新时间戳
    project.updatedAt = new Date();

    return project;
  }

  // ==========================================================================
  // 页面管理
  // ==========================================================================

  /**
   * 添加页面到项目
   *
   * @param projectId - 项目ID
   * @param pageOptions - 页面选项
   * @returns 创建的页面对象
   * @throws ProjectNotFoundError 如果项目不存在
   * @throws ValidationError 如果页面验证失败
   */
  addPage(
    projectId: string,
    pageOptions: Partial<Page> & { name: string; path: string }
  ): Page {
    const project = this.getProject(projectId);

    // 验证页面路径格式
    if (!this.isValidPagePath(pageOptions.path)) {
      throw new ValidationError(
        `页面路径格式无效: ${pageOptions.path}, 应符合 pages/xxx/xxx 格式`
      );
    }

    // 检查路径唯一性
    if (project.pages.some((p) => p.path === pageOptions.path)) {
      throw new ValidationError(
        `页面路径已存在: ${pageOptions.path}`
      );
    }

    // 创建页面对象
    const page: Page = {
      id: pageOptions.id || uuid(),
      name: pageOptions.name,
      path: pageOptions.path,
      config: pageOptions.config || {},
      components: pageOptions.components || [],
      data: pageOptions.data || {},
      variables: pageOptions.variables || [],
      lifecycleEvents: pageOptions.lifecycleEvents || [],
      customEvents: pageOptions.customEvents || [],
    };

    // 添加到项目
    project.pages.push(page);
    project.updatedAt = new Date();

    return page;
  }

  /**
   * 移除页面
   *
   * @param projectId - 项目ID
   * @param pageId - 页面ID
   * @throws ProjectNotFoundError 如果项目不存在
   * @throws PageNotFoundError 如果页面不存在
   * @throws ValidationError 如果尝试删除最后一个页面
   */
  removePage(projectId: string, pageId: string): void {
    const project = this.getProject(projectId);

    // 检查是否是最后一个页面
    if (project.pages.length === 1) {
      throw new ValidationError('不能删除最后一个页面');
    }

    const pageIndex = project.pages.findIndex((p) => p.id === pageId);

    if (pageIndex === -1) {
      throw new PageNotFoundError(pageId);
    }

    project.pages.splice(pageIndex, 1);
    project.updatedAt = new Date();
  }

  /**
   * 更新页面
   *
   * @param projectId - 项目ID
   * @param pageId - 页面ID
   * @param updates - 更新内容
   * @returns 更新后的页面对象
   * @throws ProjectNotFoundError 如果项目不存在
   * @throws PageNotFoundError 如果页面不存在
   */
  updatePage(
    projectId: string,
    pageId: string,
    updates: Partial<Page>
  ): Page {
    const project = this.getProject(projectId);
    const page = this.getPage(projectId, pageId);

    // 应用更新
    if (updates.name !== undefined) {
      page.name = updates.name;
    }

    if (updates.path !== undefined) {
      // 验证新路径
      if (!this.isValidPagePath(updates.path)) {
        throw new ValidationError(
          `页面路径格式无效: ${updates.path}`
        );
      }

      // 检查路径唯一性(排除当前页面)
      if (
        project.pages.some(
          (p) => p.id !== pageId && p.path === updates.path
        )
      ) {
        throw new ValidationError(
          `页面路径已存在: ${updates.path}`
        );
      }

      page.path = updates.path;
    }

    if (updates.config !== undefined) {
      page.config = { ...page.config, ...updates.config };
    }

    if (updates.data !== undefined) {
      page.data = updates.data;
    }

    project.updatedAt = new Date();

    return page;
  }

  /**
   * 获取页面
   *
   * @param projectId - 项目ID
   * @param pageId - 页面ID
   * @returns 页面对象
   * @throws ProjectNotFoundError 如果项目不存在
   * @throws PageNotFoundError 如果页面不存在
   */
  getPage(projectId: string, pageId: string): Page {
    const project = this.getProject(projectId);
    const page = project.pages.find((p) => p.id === pageId);

    if (!page) {
      throw new PageNotFoundError(pageId);
    }

    return page;
  }

  /**
   * 重新排序页面
   *
   * @param projectId - 项目ID
   * @param pageIds - 新的页面ID顺序
   * @throws ProjectNotFoundError 如果项目不存在
   * @throws ValidationError 如果页面ID列表无效
   */
  reorderPages(projectId: string, pageIds: string[]): void {
    const project = this.getProject(projectId);

    // 验证页面ID列表
    if (pageIds.length !== project.pages.length) {
      throw new ValidationError(
        '页面ID列表长度与项目页面数量不匹配'
      );
    }

    // 验证所有ID都存在
    const pageMap = new Map(project.pages.map((p) => [p.id, p]));
    for (const id of pageIds) {
      if (!pageMap.has(id)) {
        throw new ValidationError(`页面ID不存在: ${id}`);
      }
    }

    // 重新排序
    project.pages = pageIds.map((id) => pageMap.get(id)!);
    project.updatedAt = new Date();
  }

  // ==========================================================================
  // 序列化和反序列化
  // ==========================================================================

  /**
   * 序列化项目为 JSON 字符串
   *
   * @param projectId - 项目ID
   * @returns JSON 字符串
   * @throws ProjectNotFoundError 如果项目不存在
   * @throws SerializationError 如果序列化失败
   */
  serializeProject(projectId: string): string {
    try {
      const project = this.getProject(projectId);

      // 转换 Date 对象为 ISO 字符串
      const serializable = this.toSerializable(project);

      return JSON.stringify(serializable, null, 2);
    } catch (error) {
      if (error instanceof ProjectNotFoundError) {
        throw error;
      }

      throw new SerializationError(
        `序列化项目失败: ${(error as Error).message}`,
        { error }
      );
    }
  }

  /**
   * 从 JSON 字符串反序列化项目
   *
   * @param json - JSON 字符串
   * @returns 项目对象
   * @throws SerializationError 如果反序列化失败
   * @throws ValidationError 如果数据验证失败
   */
  deserializeProject(json: string): MiniProgramProject {
    try {
      // 解析 JSON
      const data = JSON.parse(json);

      // 验证数据结构
      this.validateProjectData(data);

      // 转换数据类型
      const project: MiniProgramProject = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      // 存储项目
      this.projects.set(project.id, project);

      return project;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new SerializationError(
        `反序列化项目失败: ${(error as Error).message}`,
        { error }
      );
    }
  }

  // ==========================================================================
  // 配置管理
  // ==========================================================================

  /**
   * 更新项目配置
   *
   * @param projectId - 项目ID
   * @param config - 配置更新
   * @throws ProjectNotFoundError 如果项目不存在
   */
  updateProjectConfig(
    projectId: string,
    config: Partial<ProjectConfig>
  ): void {
    const project = this.getProject(projectId);
    project.config = { ...project.config, ...config };
    project.updatedAt = new Date();
  }

  /**
   * 更新窗口配置
   *
   * @param projectId - 项目ID
   * @param config - 窗口配置更新
   * @throws ProjectNotFoundError 如果项目不存在
   */
  updateWindowConfig(
    projectId: string,
    config: Partial<WindowConfig>
  ): void {
    const project = this.getProject(projectId);
    project.config.window = { ...project.config.window, ...config };
    project.updatedAt = new Date();
  }

  /**
   * 更新 TabBar 配置
   *
   * @param projectId - 项目ID
   * @param config - TabBar 配置
   * @throws ProjectNotFoundError 如果项目不存在
   */
  updateTabBarConfig(
    projectId: string,
    config: TabBarConfig
  ): void {
    const project = this.getProject(projectId);
    project.config.tabBar = config;
    project.updatedAt = new Date();
  }

  // ==========================================================================
  // 事务支持
  // ==========================================================================

  /**
   * 开始事务
   *
   * @param projectId - 项目ID
   * @returns 事务对象
   * @throws ProjectNotFoundError 如果项目不存在
   */
  beginTransaction(projectId: string): Transaction {
    const project = this.getProject(projectId);

    // 创建项目快照(深拷贝)
    const snapshot = structuredClone(project);

    const transaction: Transaction = {
      id: uuid(),
      projectId,
      operations: [],
      snapshot,
      createdAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);

    return transaction;
  }

  /**
   * 提交事务
   *
   * @param transaction - 事务对象
   */
  commitTransaction(transaction: Transaction): void {
    // 清理事务
    this.transactions.delete(transaction.id);
  }

  /**
   * 回滚事务
   *
   * @param transaction - 事务对象
   * @throws ProjectNotFoundError 如果项目不存在
   */
  rollbackTransaction(transaction: Transaction): void {
    // 恢复项目快照
    this.projects.set(transaction.projectId, transaction.snapshot);

    // 清理事务
    this.transactions.delete(transaction.id);
  }

  // ==========================================================================
  // 私有辅助方法
  // ==========================================================================

  /**
   * 获取默认项目配置
   */
  private getDefaultProjectConfig(
    customConfig?: Partial<ProjectConfig>
  ): ProjectConfig {
    const defaultConfig: ProjectConfig = {
      window: {
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black',
        navigationBarTitleText: '小程序',
        backgroundColor: '#eeeeee',
        backgroundTextStyle: 'light',
        enablePullDownRefresh: false,
      },
    };

    return customConfig
      ? { ...defaultConfig, ...customConfig }
      : defaultConfig;
  }

  /**
   * 验证版本号格式 (语义化版本)
   */
  private isValidVersion(version: string): boolean {
    const regex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
    return regex.test(version);
  }

  /**
   * 验证 AppID 格式
   */
  private isValidAppId(appId: string): boolean {
    const regex = /^wx[a-zA-Z0-9]{16}$/;
    return regex.test(appId);
  }

  /**
   * 验证页面路径格式
   */
  private isValidPagePath(path: string): boolean {
    const regex = /^pages\/[\w-]+\/[\w-]+$/;
    return regex.test(path);
  }

  /**
   * 将对象转换为可序列化格式
   */
  private toSerializable(obj: any): any {
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.toSerializable(item));
    }

    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        result[key] = this.toSerializable(obj[key]);
      }
      return result;
    }

    return obj;
  }

  /**
   * 验证项目数据结构
   */
  private validateProjectData(data: any): void {
    // 验证必需字段
    const requiredFields = ['id', 'name', 'version', 'config', 'pages'];

    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new ValidationError(
          `缺少必需字段: ${field}`
        );
      }
    }

    // 验证字段类型
    if (typeof data.id !== 'string') {
      throw new ValidationError('id 必须是字符串');
    }

    if (typeof data.name !== 'string') {
      throw new ValidationError('name 必须是字符串');
    }

    if (!Array.isArray(data.pages)) {
      throw new ValidationError('pages 必须是数组');
    }

    // 验证版本号
    if (!this.isValidVersion(data.version)) {
      throw new ValidationError(
        `版本号格式无效: ${data.version}`
      );
    }
  }
}
