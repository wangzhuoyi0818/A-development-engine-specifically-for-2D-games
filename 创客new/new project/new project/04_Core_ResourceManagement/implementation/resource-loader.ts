/**
 * 微信小程序可视化开发平台 - 资源加载器
 *
 * 本文件实现了 ResourceLoader 类
 * 负责加载图片、音频等资源,支持预加载和缓存
 */

import type {
  Resource,
  ResourceType,
  ResourceLoadOptions,
  PreloadOptions,
  PreloadResult,
} from './types';

// ============================================================================
// 资源加载器错误
// ============================================================================

/**
 * 资源加载错误
 */
export class ResourceLoadError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ResourceLoadError';
  }
}

/**
 * 加载超时错误
 */
export class LoadTimeoutError extends ResourceLoadError {
  constructor(resourceId: string, timeout: number) {
    super(
      `资源加载超时: ${resourceId} (${timeout}ms)`,
      'LOAD_TIMEOUT',
      { resourceId, timeout }
    );
    this.name = 'LoadTimeoutError';
  }
}

// ============================================================================
// 资源加载器主类
// ============================================================================

/**
 * 资源加载器
 *
 * 职责:
 * - 加载图片、音频、视频等资源
 * - 管理资源缓存
 * - 提供预加载功能
 * - 获取资源URL
 */
export class ResourceLoader {
  /** 加载缓存 Map (resourceId -> loaded data) */
  private cache: Map<string, any> = new Map();

  /** 加载中的资源 Set */
  private loading: Set<string> = new Set();

  /** 默认超时时间 (毫秒) */
  private defaultTimeout: number = 30000;

  /**
   * 创建资源加载器
   *
   * @param defaultTimeout - 默认超时时间(可选)
   */
  constructor(defaultTimeout?: number) {
    if (defaultTimeout) {
      this.defaultTimeout = defaultTimeout;
    }
  }

  // ==========================================================================
  // 资源加载
  // ==========================================================================

  /**
   * 加载图片
   *
   * @param resource - 资源对象
   * @param options - 加载选项
   * @returns 图片对象或图片信息
   */
  async loadImage(
    resource: Resource,
    options?: ResourceLoadOptions
  ): Promise<any> {
    if (resource.type !== ResourceType.Image) {
      throw new ResourceLoadError(
        '资源类型不是图片',
        'INVALID_RESOURCE_TYPE',
        { resourceId: resource.id, type: resource.type }
      );
    }

    // 检查缓存
    if (options?.useCache !== false) {
      const cached = this.cache.get(resource.id);
      if (cached) {
        return cached;
      }
    }

    // 检查是否正在加载
    if (this.loading.has(resource.id)) {
      // 等待加载完成
      return this.waitForLoad(resource.id, options?.timeout);
    }

    // 开始加载
    this.loading.add(resource.id);

    try {
      const imageInfo = await this.loadImageInternal(
        resource.path,
        options
      );

      // 缓存结果
      this.cache.set(resource.id, imageInfo);

      return imageInfo;
    } finally {
      this.loading.delete(resource.id);
    }
  }

  /**
   * 加载音频
   *
   * @param resource - 资源对象
   * @param options - 加载选项
   * @returns 音频对象或音频上下文
   */
  async loadAudio(
    resource: Resource,
    options?: ResourceLoadOptions
  ): Promise<any> {
    if (resource.type !== ResourceType.Audio) {
      throw new ResourceLoadError(
        '资源类型不是音频',
        'INVALID_RESOURCE_TYPE',
        { resourceId: resource.id, type: resource.type }
      );
    }

    // 检查缓存
    if (options?.useCache !== false) {
      const cached = this.cache.get(resource.id);
      if (cached) {
        return cached;
      }
    }

    // 检查是否正在加载
    if (this.loading.has(resource.id)) {
      return this.waitForLoad(resource.id, options?.timeout);
    }

    // 开始加载
    this.loading.add(resource.id);

    try {
      const audioContext = await this.loadAudioInternal(
        resource.path,
        options
      );

      // 缓存结果
      this.cache.set(resource.id, audioContext);

      return audioContext;
    } finally {
      this.loading.delete(resource.id);
    }
  }

  /**
   * 加载视频
   *
   * @param resource - 资源对象
   * @param options - 加载选项
   * @returns 视频对象
   */
  async loadVideo(
    resource: Resource,
    options?: ResourceLoadOptions
  ): Promise<any> {
    if (resource.type !== ResourceType.Video) {
      throw new ResourceLoadError(
        '资源类型不是视频',
        'INVALID_RESOURCE_TYPE',
        { resourceId: resource.id, type: resource.type }
      );
    }

    // 视频通常不需要预加载,直接返回路径
    return {
      path: resource.path,
      resource,
    };
  }

  /**
   * 预加载资源列表
   *
   * @param resources - 资源列表
   * @param options - 预加载选项
   * @returns 预加载结果列表
   */
  async preloadResources(
    resources: Resource[],
    options?: PreloadOptions
  ): Promise<PreloadResult[]> {
    const concurrency = options?.concurrency || 5;
    const results: PreloadResult[] = [];

    // 按类型分组(图片优先)
    const imageResources = resources.filter(
      (r) => r.type === ResourceType.Image
    );
    const audioResources = resources.filter(
      (r) => r.type === ResourceType.Audio
    );
    const otherResources = resources.filter(
      (r) => r.type !== ResourceType.Image && r.type !== ResourceType.Audio
    );

    const sortedResources = [
      ...imageResources,
      ...audioResources,
      ...otherResources,
    ];

    // 分批并发加载
    for (let i = 0; i < sortedResources.length; i += concurrency) {
      const batch = sortedResources.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map((resource) => this.preloadResource(resource))
      );

      batchResults.forEach((result, index) => {
        const resource = batch[index];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            resourceId: resource.id,
            success: false,
            error: result.reason?.message || '加载失败',
            duration: 0,
          });
        }
      });
    }

    // 调用完成回调
    if (options?.onComplete) {
      options.onComplete(results);
    }

    return results;
  }

  /**
   * 获取资源URL
   *
   * @param resource - 资源对象
   * @returns 资源URL
   */
  getResourceUrl(resource: Resource): string {
    // 对于不同路径类型,返回对应的URL
    switch (resource.pathType) {
      case 'network':
        return resource.path;

      case 'cloud':
        // 云文件ID可以直接使用
        return resource.path;

      case 'local':
      default:
        // 本地路径可能需要转换
        return resource.path;
    }
  }

  // ==========================================================================
  // 缓存管理
  // ==========================================================================

  /**
   * 清除缓存
   *
   * @param resourceId - 资源ID(可选,不传则清除所有)
   */
  clearCache(resourceId?: string): void {
    if (resourceId) {
      this.cache.delete(resourceId);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取缓存大小
   *
   * @returns 缓存的资源数量
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 检查资源是否已缓存
   *
   * @param resourceId - 资源ID
   * @returns 是否已缓存
   */
  isCached(resourceId: string): boolean {
    return this.cache.has(resourceId);
  }

  /**
   * 检查资源是否正在加载
   *
   * @param resourceId - 资源ID
   * @returns 是否正在加载
   */
  isLoading(resourceId: string): boolean {
    return this.loading.has(resourceId);
  }

  // ==========================================================================
  // 内部实现
  // ==========================================================================

  /**
   * 内部图片加载实现
   */
  private async loadImageInternal(
    path: string,
    options?: ResourceLoadOptions
  ): Promise<any> {
    const timeout = options?.timeout || this.defaultTimeout;

    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined' || !wx.getImageInfo) {
        // 在非小程序环境,返回基本信息
        resolve({ path });
        return;
      }

      const timer = setTimeout(() => {
        reject(new LoadTimeoutError('image', timeout));
      }, timeout);

      wx.getImageInfo({
        src: path,
        success: (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        fail: (error) => {
          clearTimeout(timer);
          reject(
            new ResourceLoadError(
              `加载图片失败: ${error.errMsg || '未知错误'}`,
              'LOAD_IMAGE_FAILED',
              { path, error }
            )
          );
        },
      });
    });
  }

  /**
   * 内部音频加载实现
   */
  private async loadAudioInternal(
    path: string,
    options?: ResourceLoadOptions
  ): Promise<any> {
    if (typeof wx === 'undefined' || !wx.createInnerAudioContext) {
      // 在非小程序环境,返回基本信息
      return { path };
    }

    const audioContext = wx.createInnerAudioContext();
    audioContext.src = path;

    return new Promise((resolve, reject) => {
      const timeout = options?.timeout || this.defaultTimeout;

      const timer = setTimeout(() => {
        reject(new LoadTimeoutError('audio', timeout));
      }, timeout);

      audioContext.onCanplay(() => {
        clearTimeout(timer);
        resolve(audioContext);
      });

      audioContext.onError((error) => {
        clearTimeout(timer);
        reject(
          new ResourceLoadError(
            `加载音频失败: ${error.errMsg || '未知错误'}`,
            'LOAD_AUDIO_FAILED',
            { path, error }
          )
        );
      });
    });
  }

  /**
   * 预加载单个资源
   */
  private async preloadResource(
    resource: Resource
  ): Promise<PreloadResult> {
    const startTime = Date.now();

    try {
      switch (resource.type) {
        case ResourceType.Image:
          await this.loadImage(resource);
          break;

        case ResourceType.Audio:
          await this.loadAudio(resource);
          break;

        case ResourceType.Video:
          await this.loadVideo(resource);
          break;

        default:
          // 其他类型暂不处理
          break;
      }

      return {
        resourceId: resource.id,
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        resourceId: resource.id,
        success: false,
        error: error instanceof Error ? error.message : '加载失败',
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 等待资源加载完成
   */
  private async waitForLoad(
    resourceId: string,
    timeout?: number
  ): Promise<any> {
    const maxWaitTime = timeout || this.defaultTimeout;
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        // 检查是否加载完成
        if (!this.loading.has(resourceId)) {
          clearInterval(checkInterval);
          const cached = this.cache.get(resourceId);
          if (cached) {
            resolve(cached);
          } else {
            reject(
              new ResourceLoadError(
                '资源加载失败',
                'LOAD_FAILED',
                { resourceId }
              )
            );
          }
          return;
        }

        // 检查是否超时
        if (Date.now() - startTime > maxWaitTime) {
          clearInterval(checkInterval);
          reject(new LoadTimeoutError(resourceId, maxWaitTime));
        }
      }, 100);
    });
  }
}
