/**
 * 微信小程序可视化开发平台 - 响应式数据绑定实现
 *
 * 参考 Vue 的响应式系统,实现变量的监听和计算属性
 */

import { v4 as uuidv4 } from 'uuid';
import { VariableResolver } from './variable-resolver';
import { VariablesContainer } from './variables-container';
import {
  VariableValue,
  WatchCallback,
  WatchOptions,
  Watcher,
  ComputedGetter,
  ComputedProperty,
} from './types';

/**
 * 响应式管理器
 * 管理变量的监听和计算属性
 */
export class ReactiveManager {
  private resolver: VariableResolver;
  private watchers: Map<string, Watcher[]> = new Map(); // path -> watchers
  private computed: Map<string, ComputedProperty> = new Map(); // name -> computed property
  private batchUpdateQueue: Set<string> = new Set(); // 待更新的路径
  private batchUpdateTimer: any = null;

  /**
   * 构造函数
   * @param container 变量容器
   */
  constructor(container: VariablesContainer) {
    this.resolver = new VariableResolver(container);
  }

  /**
   * 设置变量容器
   */
  setContainer(container: VariablesContainer): void {
    this.resolver.setContainer(container);
  }

  /**
   * 获取解析器
   */
  getResolver(): VariableResolver {
    return this.resolver;
  }

  // ============================================================================
  // 变量监听 (Watch)
  // ============================================================================

  /**
   * 监听变量变化
   * @param path 变量路径
   * @param callback 回调函数
   * @param options 监听选项
   * @returns 监听器对象
   */
  watch(path: string, callback: WatchCallback, options?: WatchOptions): Watcher {
    const watcherId = uuidv4();
    const normalizedPath = this.resolver.normalizePath(path);
    const opts: WatchOptions = {
      immediate: false,
      deep: false,
      context: null,
      ...options,
    };

    const watcher: Watcher = {
      id: watcherId,
      path: normalizedPath,
      callback,
      options: opts,
      unwatch: () => this.unwatch(watcherId, normalizedPath),
    };

    // 添加到监听列表
    if (!this.watchers.has(normalizedPath)) {
      this.watchers.set(normalizedPath, []);
    }
    this.watchers.get(normalizedPath)!.push(watcher);

    // 如果设置了 immediate,立即执行一次回调
    if (opts.immediate) {
      const value = this.resolver.getValue(normalizedPath);
      callback.call(opts.context, value, undefined);
    }

    return watcher;
  }

  /**
   * 取消监听
   * @param watcherId 监听器ID
   * @param path 变量路径
   */
  private unwatch(watcherId: string, path: string): void {
    const watchers = this.watchers.get(path);
    if (!watchers) {
      return;
    }

    const index = watchers.findIndex((w) => w.id === watcherId);
    if (index !== -1) {
      watchers.splice(index, 1);
    }

    // 如果该路径没有监听器了,删除映射
    if (watchers.length === 0) {
      this.watchers.delete(path);
    }
  }

  /**
   * 取消所有监听
   */
  unwatchAll(): void {
    this.watchers.clear();
  }

  /**
   * 触发变量变化通知
   * @param path 变量路径
   * @param newValue 新值
   * @param oldValue 旧值
   */
  private notifyWatchers(path: string, newValue: VariableValue, oldValue: VariableValue): void {
    const watchers = this.watchers.get(path);
    if (!watchers) {
      return;
    }

    for (const watcher of watchers) {
      try {
        watcher.callback.call(watcher.options.context, newValue, oldValue);
      } catch (error) {
        console.error(`Error in watcher for path "${path}":`, error);
      }
    }

    // 触发父路径的深度监听
    this.notifyDeepWatchers(path, newValue, oldValue);
  }

  /**
   * 触发父路径的深度监听
   */
  private notifyDeepWatchers(
    path: string,
    newValue: VariableValue,
    oldValue: VariableValue
  ): void {
    // 找到所有父路径
    const parts = path.split('.');
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join('.');
      const parentWatchers = this.watchers.get(parentPath);

      if (parentWatchers) {
        for (const watcher of parentWatchers) {
          if (watcher.options.deep) {
            try {
              const parentNewValue = this.resolver.getValue(parentPath);
              watcher.callback.call(watcher.options.context, parentNewValue, parentNewValue);
            } catch (error) {
              console.error(`Error in deep watcher for path "${parentPath}":`, error);
            }
          }
        }
      }
    }
  }

  // ============================================================================
  // 计算属性 (Computed)
  // ============================================================================

  /**
   * 定义计算属性
   * @param name 计算属性名
   * @param getter 计算函数
   * @param dependencies 依赖的变量路径列表
   * @returns 计算属性对象
   */
  defineComputed(name: string, getter: ComputedGetter, dependencies: string[]): ComputedProperty {
    const computedProperty: ComputedProperty = {
      id: uuidv4(),
      name,
      getter,
      dependencies: dependencies.map((dep) => this.resolver.normalizePath(dep)),
      dirty: true,
    };

    this.computed.set(name, computedProperty);

    // 监听所有依赖的变量
    for (const dep of computedProperty.dependencies) {
      this.watch(
        dep,
        () => {
          // 标记为需要重新计算
          computedProperty.dirty = true;
          // 触发计算属性的监听器
          this.notifyComputedWatchers(name);
        },
        { deep: false }
      );
    }

    return computedProperty;
  }

  /**
   * 获取计算属性的值
   * @param name 计算属性名
   * @returns 计算结果
   */
  getComputed(name: string): VariableValue {
    const computedProperty = this.computed.get(name);
    if (!computedProperty) {
      throw new Error(`Computed property "${name}" not found`);
    }

    // 如果需要重新计算
    if (computedProperty.dirty) {
      try {
        computedProperty.cachedValue = computedProperty.getter();
        computedProperty.dirty = false;
      } catch (error) {
        console.error(`Error computing property "${name}":`, error);
        return null;
      }
    }

    return computedProperty.cachedValue;
  }

  /**
   * 删除计算属性
   */
  removeComputed(name: string): boolean {
    return this.computed.delete(name);
  }

  /**
   * 触发计算属性的监听器
   */
  private notifyComputedWatchers(computedName: string): void {
    const watchers = this.watchers.get(`computed:${computedName}`);
    if (!watchers) {
      return;
    }

    const newValue = this.getComputed(computedName);
    for (const watcher of watchers) {
      try {
        watcher.callback.call(watcher.options.context, newValue, undefined);
      } catch (error) {
        console.error(`Error in computed watcher for "${computedName}":`, error);
      }
    }
  }

  /**
   * 监听计算属性
   */
  watchComputed(name: string, callback: WatchCallback, options?: WatchOptions): Watcher {
    return this.watch(`computed:${name}`, callback, options);
  }

  // ============================================================================
  // 响应式赋值
  // ============================================================================

  /**
   * 设置变量值并触发监听
   * @param path 变量路径
   * @param value 新值
   */
  set(path: string, value: VariableValue): void {
    const normalizedPath = this.resolver.normalizePath(path);
    const oldValue = this.resolver.getValue(normalizedPath);

    // 设置新值
    const result = this.resolver.setValue(normalizedPath, value);
    if (!result.success) {
      throw new Error(result.error);
    }

    // 触发监听器
    this.notifyWatchers(normalizedPath, value, oldValue);
  }

  /**
   * 获取变量值
   */
  get(path: string, defaultValue?: VariableValue): VariableValue {
    return this.resolver.getValue(path, defaultValue);
  }

  /**
   * 批量设置变量值 (延迟触发监听,避免频繁更新)
   */
  batchSet(values: Record<string, VariableValue>): void {
    // 收集所有需要更新的路径
    for (const path of Object.keys(values)) {
      this.batchUpdateQueue.add(this.resolver.normalizePath(path));
    }

    // 先设置所有值
    this.resolver.setValues(values);

    // 延迟触发更新
    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
    }

    this.batchUpdateTimer = setTimeout(() => {
      this.flushBatchUpdates();
    }, 0);
  }

  /**
   * 刷新批量更新
   */
  private flushBatchUpdates(): void {
    for (const path of this.batchUpdateQueue) {
      const newValue = this.resolver.getValue(path);
      this.notifyWatchers(path, newValue, undefined);
    }

    this.batchUpdateQueue.clear();
    this.batchUpdateTimer = null;
  }

  // ============================================================================
  // 数据绑定
  // ============================================================================

  /**
   * 双向绑定
   * 将一个变量路径绑定到另一个变量路径
   * @param sourcePath 源路径
   * @param targetPath 目标路径
   * @param bidirectional 是否双向绑定 (默认 false)
   */
  bind(sourcePath: string, targetPath: string, bidirectional: boolean = false): Watcher[] {
    const watchers: Watcher[] = [];

    // 源 -> 目标
    const sourceWatcher = this.watch(sourcePath, (newValue) => {
      this.resolver.setValue(targetPath, newValue);
    });
    watchers.push(sourceWatcher);

    // 目标 -> 源 (双向绑定)
    if (bidirectional) {
      const targetWatcher = this.watch(targetPath, (newValue) => {
        this.resolver.setValue(sourcePath, newValue);
      });
      watchers.push(targetWatcher);
    }

    return watchers;
  }

  /**
   * 解除绑定
   */
  unbind(watchers: Watcher[]): void {
    for (const watcher of watchers) {
      watcher.unwatch();
    }
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  /**
   * 获取所有监听器数量
   */
  getWatcherCount(): number {
    let count = 0;
    for (const watchers of this.watchers.values()) {
      count += watchers.length;
    }
    return count;
  }

  /**
   * 获取所有计算属性数量
   */
  getComputedCount(): number {
    return this.computed.size;
  }

  /**
   * 获取指定路径的监听器列表
   */
  getWatchersForPath(path: string): Watcher[] {
    const normalizedPath = this.resolver.normalizePath(path);
    return this.watchers.get(normalizedPath) || [];
  }

  /**
   * 获取所有计算属性名
   */
  getComputedNames(): string[] {
    return Array.from(this.computed.keys());
  }

  /**
   * 清理所有监听和计算属性
   */
  dispose(): void {
    this.unwatchAll();
    this.computed.clear();
    this.batchUpdateQueue.clear();

    if (this.batchUpdateTimer) {
      clearTimeout(this.batchUpdateTimer);
      this.batchUpdateTimer = null;
    }
  }

  /**
   * 调试信息
   */
  debug(): string {
    const lines: string[] = [];
    lines.push('=== ReactiveManager Debug Info ===');
    lines.push(`Total Watchers: ${this.getWatcherCount()}`);
    lines.push(`Total Computed Properties: ${this.getComputedCount()}`);
    lines.push('');

    lines.push('Watchers:');
    for (const [path, watchers] of this.watchers) {
      lines.push(`  ${path}: ${watchers.length} watcher(s)`);
    }

    lines.push('');
    lines.push('Computed Properties:');
    for (const [name, computed] of this.computed) {
      lines.push(
        `  ${name}: ${computed.dependencies.length} dependencies, dirty=${computed.dirty}`
      );
    }

    return lines.join('\n');
  }
}

/**
 * 创建响应式容器
 * 便捷方法,返回一个响应式管理器
 */
export function createReactive(container: VariablesContainer): ReactiveManager {
  return new ReactiveManager(container);
}
