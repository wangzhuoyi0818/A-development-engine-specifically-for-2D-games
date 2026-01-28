/**
 * 热重载 - 文件监听和代码更新
 *
 * 职责:
 * - 监听文件变化
 * - 触发代码重新生成
 * - 推送更新到客户端
 */

import type {
  HotReloadConfig,
  HotReloadMessage,
  FileChangeEvent,
  FileChangeType,
  UpdateType,
  MiniProgramProject,
} from './types';

/**
 * 热重载类
 */
export class HotReload {
  private config: HotReloadConfig;
  private project: MiniProgramProject;
  private watcher: any = null; // chokidar watcher
  private changeQueue: FileChangeEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private isWatching = false;

  /**
   * 构造函数
   */
  constructor(config: HotReloadConfig, project: MiniProgramProject) {
    this.config = {
      enabled: true,
      watchExtensions: ['.ts', '.js', '.json'],
      ignored: ['node_modules/**', '.git/**'],
      batchDelay: 300,
      showNotifications: true,
      ...config,
    };
    this.project = project;
  }

  /**
   * 启动文件监听
   */
  async start(): Promise<void> {
    if (!this.config.enabled || this.isWatching) {
      return;
    }

    // 模拟文件监听启动
    this.isWatching = true;
    this.emit('started');
  }

  /**
   * 停止文件监听
   */
  async stop(): Promise<void> {
    if (!this.isWatching) {
      return;
    }

    // 停止监听器
    if (this.watcher) {
      // await this.watcher.close();
      this.watcher = null;
    }

    // 清除批处理定时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    this.isWatching = false;
    this.changeQueue = [];
    this.emit('stopped');
  }

  /**
   * 手动触发更新
   */
  triggerUpdate(files: string[]): void {
    const changes: FileChangeEvent[] = files.map((file) => ({
      type: 'change',
      path: file,
      timestamp: Date.now(),
    }));

    this.processChanges(changes);
  }

  /**
   * 添加事件监听器
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 处理文件变化
   */
  private handleFileChange(
    type: FileChangeType,
    path: string
  ): void {
    const change: FileChangeEvent = {
      type,
      path,
      timestamp: Date.now(),
    };

    // 添加到变更队列
    this.changeQueue.push(change);

    // 清除之前的定时器
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // 设置新的批处理定时器
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.batchDelay);
  }

  /**
   * 批处理变更
   */
  private processBatch(): void {
    if (this.changeQueue.length === 0) {
      return;
    }

    const changes = [...this.changeQueue];
    this.changeQueue = [];

    this.processChanges(changes);
  }

  /**
   * 处理变更列表
   */
  private processChanges(changes: FileChangeEvent[]): void {
    // 按文件类型分组
    const grouped = this.groupChangesByType(changes);

    // 生成更新消息
    for (const [updateType, files] of grouped.entries()) {
      for (const file of files) {
        const update = this.generateUpdate(updateType, file);
        if (update) {
          this.emit('update', update);
        }
      }
    }
  }

  /**
   * 按更新类型分组变更
   */
  private groupChangesByType(
    changes: FileChangeEvent[]
  ): Map<UpdateType, string[]> {
    const grouped = new Map<UpdateType, string[]>();

    for (const change of changes) {
      const updateType = this.determineUpdateType(change.path);
      if (!grouped.has(updateType)) {
        grouped.set(updateType, []);
      }
      grouped.get(updateType)!.push(change.path);
    }

    return grouped;
  }

  /**
   * 确定更新类型
   */
  private determineUpdateType(filePath: string): UpdateType {
    // 简化实现,根据文件扩展名判断
    if (filePath.endsWith('.wxml') || filePath.includes('component')) {
      return 'wxml';
    } else if (filePath.endsWith('.wxss') || filePath.includes('style')) {
      return 'wxss';
    } else if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
      return 'js';
    } else if (filePath.endsWith('.json')) {
      return 'config';
    }
    return 'full';
  }

  /**
   * 生成更新消息
   */
  private generateUpdate(
    updateType: UpdateType,
    filePath: string
  ): HotReloadMessage | null {
    try {
      // 根据文件路径找到对应的页面或组件
      const target = this.findTarget(filePath);
      if (!target) {
        return null;
      }

      // 生成新代码
      const code = this.generateCode(updateType, target);

      const message: HotReloadMessage = {
        type: 'update',
        updateType,
        target,
        code,
        timestamp: Date.now(),
      };

      return message;
    } catch (error) {
      const errorMessage: HotReloadMessage = {
        type: 'error',
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error),
      };
      return errorMessage;
    }
  }

  /**
   * 查找目标页面或组件
   */
  private findTarget(filePath: string): string | null {
    // 简化实现,从项目中查找匹配的页面
    for (const page of this.project.pages) {
      if (filePath.includes(page.path)) {
        return page.path;
      }
    }
    return null;
  }

  /**
   * 生成代码
   */
  private generateCode(updateType: UpdateType, target: string): string {
    // 这里应该调用相应的代码生成器
    // 简化实现,返回占位符
    return `// Generated code for ${target}`;
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`事件监听器错误 [${event}]:`, error);
        }
      });
    }
  }
}
