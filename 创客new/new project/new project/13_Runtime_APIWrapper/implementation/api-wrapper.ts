/**
 * 微信小程序可视化开发平台 - API包装器核心
 *
 * 提供统一的API调用接口,包括Promise化、拦截器、重试、缓存等功能
 */

import {
  RequestOptions,
  RequestResult,
  APIError,
  APIWrapperConfig,
  CacheManager,
  ConcurrencyController,
  MockManager,
  PerformanceMonitor,
} from './types';
import { ErrorHandler, APIErrorImpl } from './error-handler';
import {
  InterceptorChain,
  createDefaultInterceptors,
} from './interceptor';
import { RetryExecutor, createDefaultRetryPolicy } from './retry-policy';

/**
 * 简单的缓存管理器实现
 */
class SimpleCacheManager implements CacheManager {
  private cache = new Map<string, any>();

  get<T = any>(key: string): any {
    return this.cache.get(key) || null;
  }

  set<T = any>(key: string, data: T, ttl: number): void {
    const entry = {
      data,
      expireAt: Date.now() + ttl,
      createdAt: Date.now(),
      key,
    };
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // 检查是否过期
    if (Date.now() >= entry.expireAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * 简单的并发控制器实现
 */
class SimpleConcurrencyController implements ConcurrencyController {
  limit: number;
  active: number = 0;
  private queue: Array<() => void> = [];

  constructor(limit: number = 10) {
    this.limit = limit;
  }

  get queueSize(): number {
    return this.queue.length;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  reset(): void {
    this.active = 0;
    this.queue = [];
  }

  private async acquire(): Promise<void> {
    while (this.active >= this.limit) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
  }

  private release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

/**
 * API包装器基类
 * 提供Promise化、拦截器、重试、缓存等核心能力
 */
export class APIWrapper {
  protected config: APIWrapperConfig;
  protected interceptors: InterceptorChain;
  protected retryExecutor: RetryExecutor;
  protected cacheManager: CacheManager;
  protected concurrencyController: ConcurrencyController;
  protected mockManager?: MockManager;
  protected performanceMonitor?: PerformanceMonitor;

  constructor(config: APIWrapperConfig = {}) {
    this.config = {
      timeout: 60000,
      concurrencyLimit: 10,
      enableCache: true,
      defaultCacheTTL: 5 * 60 * 1000, // 5分钟
      enableLogging: false,
      enablePerformance: false,
      ...config,
    };

    // 初始化拦截器链
    this.interceptors = new InterceptorChain();

    // 添加默认拦截器
    const defaultInterceptors = createDefaultInterceptors({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      enableLogging: this.config.enableLogging,
    });

    defaultInterceptors.request.forEach((interceptor) => {
      this.interceptors.request.use(interceptor);
    });

    defaultInterceptors.response.forEach((interceptor) => {
      this.interceptors.response.use(interceptor);
    });

    defaultInterceptors.error.forEach((interceptor) => {
      this.interceptors.error.use(interceptor);
    });

    // 初始化重试执行器
    this.retryExecutor = new RetryExecutor(
      createDefaultRetryPolicy(this.config.retryPolicy)
    );

    // 初始化缓存管理器
    this.cacheManager = new SimpleCacheManager();

    // 初始化并发控制器
    this.concurrencyController = new SimpleConcurrencyController(
      this.config.concurrencyLimit || 10
    );
  }

  /**
   * Promise化微信API
   */
  protected promisify<T>(apiName: string, options: any): Promise<T> {
    return new Promise((resolve, reject) => {
      // 检查wx对象是否存在
      if (typeof wx === 'undefined') {
        reject(
          new APIErrorImpl(
            'SYSTEM_ERROR' as any,
            'WX_NOT_FOUND',
            'wx对象不存在,请在微信小程序环境中运行',
            undefined,
            false
          )
        );
        return;
      }

      // 检查API是否存在
      if (typeof (wx as any)[apiName] !== 'function') {
        reject(
          new APIErrorImpl(
            'SYSTEM_ERROR' as any,
            'API_NOT_FOUND',
            `微信API ${apiName} 不存在`,
            undefined,
            false
          )
        );
        return;
      }

      // 调用微信API
      (wx as any)[apiName]({
        ...options,
        success: (res: any) => {
          resolve(res as T);
        },
        fail: (err: any) => {
          const error = ErrorHandler.handleWxError(err, apiName);
          reject(error);
        },
      });
    });
  }

  /**
   * 执行HTTP请求
   */
  async request<T = any>(options: RequestOptions<any>): Promise<T> {
    const requestId = this.generateRequestId();

    try {
      // 记录性能开始
      if (this.performanceMonitor) {
        this.performanceMonitor.start(requestId, 'request', options.url);
      }

      // 应用请求拦截器
      let interceptedOptions = await this.interceptors.request.executeAll(
        options
      );

      // 检查缓存
      if (this.config.enableCache && interceptedOptions.enableCache !== false) {
        const cacheKey = this.getCacheKey(interceptedOptions);
        const cached = this.cacheManager.get(cacheKey);

        if (cached && Date.now() < cached.expireAt) {
          // 缓存命中
          if (this.performanceMonitor) {
            this.performanceMonitor.cacheHit(requestId);
            this.performanceMonitor.end(requestId, true);
          }

          return cached.data as T;
        }
      }

      // 执行请求(带重试和并发控制)
      const result = await this.retryExecutor.execute(async () => {
        return await this.concurrencyController.run(async () => {
          // 调用微信request API
          const response = await this.promisify<RequestResult<T>>(
            'request',
            {
              url: interceptedOptions.url,
              method: interceptedOptions.method || 'GET',
              data: interceptedOptions.data,
              header: interceptedOptions.header,
              timeout: interceptedOptions.timeout,
              dataType: interceptedOptions.dataType || 'json',
              responseType: interceptedOptions.responseType || 'text',
            }
          );

          // 检查HTTP状态码
          if (response.statusCode >= 400) {
            throw ErrorHandler.handleHttpError(
              response.statusCode,
              response.data
            );
          }

          // 应用响应拦截器
          const interceptedResponse = await this.interceptors.response.executeAll(
            response
          );

          return interceptedResponse;
        });
      });

      // 更新缓存
      if (this.config.enableCache && interceptedOptions.enableCache !== false) {
        const cacheKey = this.getCacheKey(interceptedOptions);
        const cacheTTL = interceptedOptions.cacheTTL || this.config.defaultCacheTTL || 0;

        if (cacheTTL > 0) {
          this.cacheManager.set(cacheKey, result, cacheTTL);
        }
      }

      // 记录性能结束
      if (this.performanceMonitor) {
        this.performanceMonitor.end(requestId, true);
      }

      return result as T;
    } catch (error: any) {
      // 应用错误拦截器
      const apiError =
        error instanceof APIErrorImpl
          ? error
          : ErrorHandler.handleError(error);

      const interceptedError = await this.interceptors.error.executeAll(
        apiError
      );

      // 记录性能结束
      if (this.performanceMonitor) {
        this.performanceMonitor.end(requestId, false, interceptedError.message);
      }

      throw interceptedError;
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(options: {
    url: string;
    filePath: string;
    name: string;
    header?: Record<string, string>;
    formData?: Record<string, any>;
    timeout?: number;
  }): Promise<{ data: string; statusCode: number }> {
    return this.promisify('uploadFile', options);
  }

  /**
   * 下载文件
   */
  async downloadFile(options: {
    url: string;
    header?: Record<string, string>;
    timeout?: number;
    filePath?: string;
  }): Promise<{ tempFilePath: string; statusCode: number }> {
    return this.promisify('downloadFile', options);
  }

  /**
   * 生成缓存键
   */
  protected getCacheKey(options: RequestOptions): string {
    const { url, method = 'GET', data } = options;
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  /**
   * 生成请求ID
   */
  protected generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟执行
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cacheManager.size();
  }

  /**
   * 获取配置
   */
  getConfig(): Readonly<APIWrapperConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<APIWrapperConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * 创建API包装器实例
 */
export function createAPIWrapper(config?: APIWrapperConfig): APIWrapper {
  return new APIWrapper(config);
}

/**
 * 默认API包装器实例
 */
export const defaultAPIWrapper = createAPIWrapper();
