/**
 * WXSS生成器 - 主生成器
 *
 * 协调整个WXSS生成流程，管理全局样式和组件样式
 */

import { v4 as uuid } from 'uuid';
import type { Component } from '../../01_Core_ProjectStructure/implementation/types';
import type {
  CSSRule,
  WXSSGenerateOptions,
  Theme,
  ValidationResult,
  ValidationError,
  WXSSPlugin,
  CacheEntry,
  CacheOptions,
  SourceMap,
} from './types';
import { WXSSGeneratorError } from './types';
import StyleCompiler from './style-compiler';
import CSSFormatter from './formatter';
import CSSValidator from './validator';
import ThemeManager from './theme-manager';

// ============================================================================
// WXSS生成器主类
// ============================================================================

/**
 * WXSS生成器
 *
 * 职责:
 * - 协调整个WXSS生成流程
 * - 管理全局样式和组件样式
 * - 输出格式化的WXSS代码
 */
export class WXSSGenerator {
  /** 样式编译器 */
  private compiler: StyleCompiler;

  /** 格式化器 */
  private formatter: CSSFormatter;

  /** 验证器 */
  private validator: CSSValidator;

  /** 主题管理器 */
  private themeManager: ThemeManager;

  /** 注册的插件 */
  private plugins: WXSSPlugin[] = [];

  /** 缓存 */
  private cache: Map<string, CacheEntry> = new Map();

  /** 缓存选项 */
  private cacheOptions: CacheOptions = {
    enabled: true,
    maxSize: 1000,
    ttl: 1000 * 60 * 60, // 1小时
  };

  constructor(options?: { cacheOptions?: CacheOptions }) {
    this.compiler = new StyleCompiler();
    this.formatter = new CSSFormatter();
    this.validator = new CSSValidator();
    this.themeManager = new ThemeManager();

    if (options?.cacheOptions) {
      this.cacheOptions = { ...this.cacheOptions, ...options.cacheOptions };
    }
  }

  /**
   * 生成WXSS代码
   * @param components 组件列表
   * @param options 生成选项
   * @returns WXSS代码
   */
  generateWXSS(components: Component[], options?: WXSSGenerateOptions): string {
    try {
      // 1. 验证输入
      this.validateInput(components);

      // 2. 编译样式
      const cssRules = this.compileComponents(components, options);

      // 3. 应用插件转换
      const transformedRules = this.applyPlugins(cssRules, options);

      // 4. 验证输出
      this.validator.validateRules(transformedRules);

      // 5. 格式化输出
      const wxss = this.formatter.format(transformedRules, options);

      return wxss;
    } catch (error) {
      if (error instanceof WXSSGeneratorError) {
        throw error;
      }
      throw new WXSSGeneratorError(
        `WXSS生成失败: ${(error as Error).message}`,
        'GENERATION_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * 生成单个组件的WXSS
   * @param component 组件
   * @param options 生成选项
   * @returns WXSS代码
   */
  generateComponentWXSS(component: Component, options?: WXSSGenerateOptions): string {
    try {
      // 检查缓存
      const cacheKey = this.generateCacheKey(component, options);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached.wxss;
      }

      // 编译组件
      const cssRules = this.compiler.compileComponentStyle(component, options);

      // 应用插件
      const transformedRules = this.applyPlugins(cssRules, options);

      // 格式化
      const wxss = this.formatter.format(transformedRules, options);

      // 缓存结果
      this.setCache(cacheKey, cssRules, wxss);

      return wxss;
    } catch (error) {
      throw new WXSSGeneratorError(
        `生成组件WXSS失败: ${(error as Error).message}`,
        'COMPONENT_GENERATION_ERROR',
        { componentId: component.id, originalError: error }
      );
    }
  }

  /**
   * 生成主题WXSS
   * @param theme 主题
   * @returns 主题WXSS代码
   */
  generateThemeWXSS(theme: Theme): string {
    try {
      // 定义主题
      this.themeManager.defineTheme(theme);

      // 生成CSS变量
      const rules = this.themeManager.generateThemeRules(theme);

      // 格式化
      return this.formatter.format(rules);
    } catch (error) {
      throw new WXSSGeneratorError(
        `生成主题WXSS失败: ${(error as Error).message}`,
        'THEME_GENERATION_ERROR',
        { themeName: theme.name, originalError: error }
      );
    }
  }

  /**
   * 注册主题
   * @param theme 主题
   */
  registerTheme(theme: Theme): void {
    this.themeManager.defineTheme(theme);
  }

  /**
   * 应用主题
   * @param themeName 主题名称
   * @returns 主题变量WXSS
   */
  applyTheme(themeName: string): string {
    return this.themeManager.applyTheme(themeName);
  }

  /**
   * 注册插件
   * @param plugin 插件
   */
  use(plugin: WXSSPlugin): void {
    if (!plugin || !plugin.name) {
      throw new WXSSGeneratorError('无效的插件', 'INVALID_PLUGIN');
    }

    // 初始化插件
    if (plugin.init) {
      plugin.init();
    }

    this.plugins.push(plugin);
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   * @returns 缓存统计信息
   */
  getCacheStats(): { size: number; entries: number; maxSize: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).length,
      maxSize: this.cacheOptions.maxSize || 1000,
    };
  }

  /**
   * 编译组件
   * @param components 组件列表
   * @param options 生成选项
   * @returns CSS规则
   */
  private compileComponents(components: Component[], options?: WXSSGenerateOptions): CSSRule[] {
    const allRules: CSSRule[] = [];

    // 添加主题变量
    if (options?.theme) {
      const themeRules = this.themeManager.generateThemeRules(
        this.themeManager.getTheme(options.theme)
      );
      allRules.push(...themeRules);
    }

    // 编译每个组件
    for (const component of components) {
      const rules = this.compiler.compileComponentStyle(component, options);
      allRules.push(...rules);
    }

    return allRules;
  }

  /**
   * 应用插件转换
   * @param rules CSS规则
   * @param options 生成选项
   * @returns 转换后的CSS规则
   */
  private applyPlugins(rules: CSSRule[], options?: any): CSSRule[] {
    let transformed = rules;

    for (const plugin of this.plugins) {
      try {
        transformed = plugin.transform(transformed, options);
      } catch (error) {
        console.warn(`插件 ${plugin.name} 执行失败:`, error);
      }
    }

    return transformed;
  }

  /**
   * 验证输入
   * @param components 组件列表
   */
  private validateInput(components: Component[]): void {
    if (!Array.isArray(components)) {
      throw new WXSSGeneratorError('输入必须是数组', 'INVALID_INPUT');
    }

    if (components.length === 0) {
      throw new WXSSGeneratorError('组件列表不能为空', 'EMPTY_INPUT');
    }

    for (const component of components) {
      if (!component.id || !component.type) {
        throw new WXSSGeneratorError('组件必须有id和type', 'INVALID_COMPONENT');
      }
    }
  }

  /**
   * 生成缓存键
   * @param component 组件
   * @param options 生成选项
   * @returns 缓存键
   */
  private generateCacheKey(component: Component, options?: WXSSGenerateOptions): string {
    const styleStr = JSON.stringify(component.style || {});
    const optionsStr = JSON.stringify(options || {});
    return `${component.id}-${this.simpleHash(styleStr)}-${this.simpleHash(optionsStr)}`;
  }

  /**
   * 简单哈希函数
   * @param str 字符串
   * @returns 哈希值
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0; // 32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 从缓存获取
   * @param key 缓存键
   * @returns 缓存条目
   */
  private getFromCache(key: string): CacheEntry | null {
    if (!this.cacheOptions.enabled) {
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // 检查过期时间
    if (this.cacheOptions.ttl && Date.now() - entry.timestamp > this.cacheOptions.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param rules CSS规则
   * @param wxss WXSS字符串
   */
  private setCache(key: string, rules: CSSRule[], wxss: string): void {
    if (!this.cacheOptions.enabled) {
      return;
    }

    // 检查缓存大小
    if (this.cacheOptions.maxSize && this.cache.size >= this.cacheOptions.maxSize) {
      // 移除最旧的条目
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const entry: CacheEntry = {
      key,
      cssRules: rules,
      wxss,
      timestamp: Date.now(),
      hash: this.simpleHash(wxss),
    };

    this.cache.set(key, entry);
  }
}

// ============================================================================
// 导出
// ============================================================================

export default WXSSGenerator;
