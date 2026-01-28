/**
 * 微信小程序可视化开发平台 - Mock数据管理
 *
 * 提供开发环境的Mock数据支持
 */

import {
  MockConfig,
  MockDataDefinition,
  MockManager,
  RequestOptions,
  RequestResult,
} from './types';

/**
 * Mock管理器实现
 */
export class MockManagerImpl implements MockManager {
  private mockData: Map<string | RegExp, MockDataDefinition> = new Map();
  private config: MockConfig;

  constructor(config: MockConfig = { enabled: false }) {
    this.config = config;
  }

  /**
   * 添加Mock数据
   */
  add(pattern: string | RegExp, data: MockDataDefinition): void {
    this.mockData.set(pattern, data);

    if (this.config.logging) {
      console.log(`[Mock] 添加Mock数据: ${pattern}`);
    }
  }

  /**
   * 移除Mock数据
   */
  remove(pattern: string | RegExp): void {
    this.mockData.delete(pattern);

    if (this.config.logging) {
      console.log(`[Mock] 移除Mock数据: ${pattern}`);
    }
  }

  /**
   * 清空所有Mock数据
   */
  clear(): void {
    this.mockData.clear();

    if (this.config.logging) {
      console.log('[Mock] 清空所有Mock数据');
    }
  }

  /**
   * 查找匹配的Mock数据
   */
  find(options: RequestOptions): MockDataDefinition | null {
    if (!this.config.enabled) {
      return null;
    }

    const url = options.url;

    for (const [pattern, data] of this.mockData.entries()) {
      let matched = false;

      if (typeof pattern === 'string') {
        // 字符串精确匹配或包含匹配
        matched = url === pattern || url.includes(pattern);
      } else {
        // 正则表达式匹配
        matched = pattern.test(url);
      }

      if (matched) {
        // 如果有自定义matcher,再次验证
        if (data.matcher && !data.matcher(options)) {
          continue;
        }

        if (this.config.logging) {
          console.log(`[Mock] 匹配到Mock数据: ${pattern}`);
        }

        return data;
      }
    }

    return null;
  }

  /**
   * 执行Mock
   */
  async execute<T>(options: RequestOptions): Promise<RequestResult<T>> {
    const mockData = this.find(options);

    if (!mockData) {
      throw new Error(`未找到匹配的Mock数据: ${options.url}`);
    }

    // 计算延迟时间
    const delay =
      mockData.delay !== undefined
        ? mockData.delay
        : this.config.delay || 0;

    // 模拟延迟
    if (delay > 0) {
      await this.sleep(delay);
    }

    // 模拟错误
    const errorRate = this.config.errorRate || 0;
    if (Math.random() < errorRate) {
      if (mockData.fail) {
        throw new Error(
          `[Mock Error] ${mockData.fail.type}: ${mockData.fail.message}`
        );
      } else {
        throw new Error('[Mock Error] 模拟错误');
      }
    }

    // 返回成功数据
    const result: RequestResult<T> = {
      data: mockData.success as T,
      statusCode: 200,
      header: {
        'content-type': 'application/json',
      },
    };

    if (this.config.logging) {
      console.log('[Mock] 返回Mock数据:', result);
    }

    return result;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MockConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): Readonly<MockConfig> {
    return { ...this.config };
  }

  /**
   * 延迟执行
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 创建Mock管理器
 */
export function createMockManager(config?: MockConfig): MockManager {
  return new MockManagerImpl(config);
}

/**
 * 默认Mock数据
 */
export const defaultMockData: Record<string, MockDataDefinition> = {
  '/api/user': {
    success: {
      id: 1,
      name: '张三',
      avatar: 'https://example.com/avatar.jpg',
      email: 'zhangsan@example.com',
    },
  },
  '/api/products': {
    success: {
      list: [
        { id: 1, name: '商品1', price: 99.99 },
        { id: 2, name: '商品2', price: 199.99 },
        { id: 3, name: '商品3', price: 299.99 },
      ],
      total: 3,
    },
  },
  '/api/config': {
    success: {
      theme: 'light',
      language: 'zh-CN',
      version: '1.0.0',
    },
  },
};

/**
 * 加载默认Mock数据
 */
export function loadDefaultMockData(manager: MockManager): void {
  Object.entries(defaultMockData).forEach(([pattern, data]) => {
    manager.add(pattern, data);
  });
}
