# API包装器模块 - 架构设计

## 1. 模块概述

### 1.1 设计目标
API包装器模块为微信小程序的原生API提供统一的封装层,解决以下问题:
- **Promise化**: 将回调式API转换为Promise,支持async/await
- **统一错误处理**: 提供一致的错误码和错误信息
- **自动重试**: 支持可配置的重试策略
- **请求拦截**: 统一添加token、签名等
- **响应拦截**: 统一处理响应格式
- **Mock支持**: 开发环境Mock数据
- **并发控制**: 限制同时请求数量
- **超时处理**: 统一的超时配置

### 1.2 核心职责
```
API包装器
├── 基础能力
│   ├── Promise化封装
│   ├── 错误处理
│   └── 类型定义
├── 增强能力
│   ├── 重试机制
│   ├── 超时控制
│   └── 并发控制
└── 扩展能力
    ├── 请求/响应拦截
    ├── Mock数据
    └── 数据缓存
```

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     业务代码                             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API Wrapper 门面                        │
│  - network.*    - storage.*    - ui.*                   │
│  - navigation.* - device.*     - media.*                │
│  - location.*   - file.*       - payment.*              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  APIWrapper 核心                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ 请求拦截器   │  │ 重试策略     │  │ 并发控制器     │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ 响应拦截器   │  │ 错误处理器   │  │ 缓存管理器     │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              微信原生API (wx.*)                          │
│  - wx.request   - wx.setStorage   - wx.showToast       │
│  - wx.navigateTo - wx.getLocation - wx.chooseImage     │
└─────────────────────────────────────────────────────────┘
```

### 2.2 分层设计

#### 第一层: API分类封装
```typescript
// 按微信API官方分类组织
wx-api/
├── network.ts      - 网络API
├── storage.ts      - 数据缓存
├── ui.ts           - 界面API
├── navigation.ts   - 路由导航
├── device.ts       - 设备信息
├── media.ts        - 媒体API
├── location.ts     - 位置API
├── file.ts         - 文件API
├── payment.ts      - 支付API
└── share.ts        - 转发分享
```

#### 第二层: 核心包装器
```typescript
// api-wrapper.ts
class APIWrapper {
  // Promise化
  promisify<T>(api: Function, options: any): Promise<T>

  // 拦截器
  useRequestInterceptor(interceptor: Interceptor)
  useResponseInterceptor(interceptor: Interceptor)

  // 重试
  withRetry<T>(fn: () => Promise<T>, policy: RetryPolicy): Promise<T>

  // 并发控制
  withConcurrencyLimit<T>(fn: () => Promise<T>): Promise<T>
}
```

#### 第三层: 辅助模块
```typescript
// error-handler.ts - 错误处理
// retry-policy.ts - 重试策略
// interceptor.ts - 拦截器
// mock-data.ts - Mock数据
```

## 3. 核心组件设计

### 3.1 APIWrapper基类

```typescript
/**
 * API包装器基类
 * 提供Promise化、拦截器、重试等核心能力
 */
class APIWrapper {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private retryPolicy: RetryPolicy;
  private concurrencyLimit: number = 10;
  private activeRequests: number = 0;

  /**
   * Promise化微信API
   */
  protected promisify<T>(
    apiName: string,
    options: any
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // 应用请求拦截器
      const interceptedOptions = this.applyRequestInterceptors(options);

      // 调用原生API
      wx[apiName]({
        ...interceptedOptions,
        success: (res) => {
          // 应用响应拦截器
          const interceptedRes = this.applyResponseInterceptors(res);
          resolve(interceptedRes);
        },
        fail: (err) => {
          // 应用错误处理器
          const handledError = this.applyErrorHandlers(err);
          reject(handledError);
        }
      });
    });
  }

  /**
   * 带重试的API调用
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    policy?: RetryPolicy
  ): Promise<T> {
    const actualPolicy = policy || this.retryPolicy;
    let lastError: any;

    for (let i = 0; i <= actualPolicy.maxRetries; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;

        // 判断是否应该重试
        if (i < actualPolicy.maxRetries && actualPolicy.shouldRetry(err)) {
          // 计算延迟时间(指数退避)
          const delay = actualPolicy.getDelay(i);
          await this.sleep(delay);
        } else {
          throw err;
        }
      }
    }

    throw lastError;
  }

  /**
   * 并发控制
   */
  protected async withConcurrencyLimit<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    // 等待直到有可用槽位
    while (this.activeRequests >= this.concurrencyLimit) {
      await this.sleep(10);
    }

    this.activeRequests++;
    try {
      return await fn();
    } finally {
      this.activeRequests--;
    }
  }
}
```

### 3.2 网络API封装示例

```typescript
/**
 * 网络API封装
 */
class NetworkAPI extends APIWrapper {
  /**
   * HTTP请求
   */
  async request<T = any>(options: RequestOptions): Promise<T> {
    return this.withRetry(
      () => this.withConcurrencyLimit(
        () => this.promisify<T>('request', options)
      )
    );
  }

  /**
   * 上传文件
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    return this.promisify<UploadFileResult>('uploadFile', options);
  }

  /**
   * 下载文件
   */
  async downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult> {
    return this.promisify<DownloadFileResult>('downloadFile', options);
  }
}
```

## 4. 拦截器设计

### 4.1 请求拦截器

```typescript
interface RequestInterceptor {
  (options: any): any | Promise<any>;
}

// 示例: 添加token
const tokenInterceptor: RequestInterceptor = (options) => {
  const token = getToken();
  return {
    ...options,
    header: {
      ...options.header,
      'Authorization': `Bearer ${token}`
    }
  };
};
```

### 4.2 响应拦截器

```typescript
interface ResponseInterceptor {
  (response: any): any | Promise<any>;
}

// 示例: 统一处理响应格式
const responseFormatInterceptor: ResponseInterceptor = (response) => {
  if (response.data && response.data.code === 0) {
    return response.data.data;
  }
  throw new APIError(response.data.code, response.data.message);
};
```

## 5. 错误处理设计

### 5.1 错误分类

```typescript
enum ErrorType {
  // 网络错误
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',

  // 业务错误
  BUSINESS_ERROR = 'BUSINESS_ERROR',

  // 系统错误
  SYSTEM_ERROR = 'SYSTEM_ERROR',

  // 权限错误
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

class APIError extends Error {
  type: ErrorType;
  code: string;
  原因: string;
  recoverable: boolean;  // 是否可恢复

  constructor(type: ErrorType, code: string, message: string) {
    super(message);
    this.type = type;
    this.code = code;
  }
}
```

### 5.2 错误处理策略

```typescript
class ErrorHandler {
  handle(error: any): APIError {
    // 网络错误
    if (error.errMsg?.includes('timeout')) {
      return new APIError(ErrorType.TIMEOUT, 'TIMEOUT', '请求超时');
    }

    // 业务错误
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return new APIError(ErrorType.BUSINESS_ERROR, `HTTP_${error.statusCode}`, error.errMsg);
    }

    // 系统错误
    return new APIError(ErrorType.SYSTEM_ERROR, 'UNKNOWN', error.errMsg || '未知错误');
  }
}
```

## 6. 重试策略设计

### 6.1 重试策略接口

```typescript
interface RetryPolicy {
  /** 最大重试次数 */
  maxRetries: number;

  /** 初始延迟(毫秒) */
  initialDelay: number;

  /** 延迟倍增因子 */
  backoffMultiplier: number;

  /** 最大延迟(毫秒) */
  maxDelay: number;

  /** 判断是否应该重试 */
  shouldRetry(error: any): boolean;

  /** 计算延迟时间 */
  getDelay(attemptNumber: number): number;
}
```

### 6.2 默认重试策略

```typescript
const defaultRetryPolicy: RetryPolicy = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,

  shouldRetry(error: any): boolean {
    // 网络错误重试
    if (error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.TIMEOUT) {
      return true;
    }

    // 5xx错误重试
    if (error.statusCode >= 500) {
      return true;
    }

    return false;
  },

  getDelay(attemptNumber: number): number {
    const delay = this.initialDelay * Math.pow(this.backoffMultiplier, attemptNumber);
    return Math.min(delay, this.maxDelay);
  }
};
```

## 7. Mock数据支持

### 7.1 Mock数据结构

```typescript
interface MockConfig {
  enabled: boolean;
  delay?: number;  // 模拟延迟
  errorRate?: number;  // 模拟错误率
}

interface MockData {
  [apiName: string]: {
    success: any;
    fail?: any;
  };
}
```

### 7.2 Mock实现

```typescript
class MockManager {
  private mockData: MockData = {};
  private config: MockConfig;

  async mock<T>(apiName: string, options: any): Promise<T> {
    // 模拟延迟
    if (this.config.delay) {
      await this.sleep(this.config.delay);
    }

    // 模拟错误
    if (Math.random() < (this.config.errorRate || 0)) {
      throw this.mockData[apiName]?.fail || new Error('Mock error');
    }

    // 返回Mock数据
    return this.mockData[apiName]?.success;
  }
}
```

## 8. 云开发API封装

### 8.1 云数据库

```typescript
class CloudDatabaseAPI {
  /**
   * 查询数据
   */
  async query(collection: string, where: any): Promise<any[]> {
    return this.promisify('cloud.database.collection', {
      name: collection
    }).where(where).get();
  }

  /**
   * 添加数据
   */
  async add(collection: string, data: any): Promise<string> {
    return this.promisify('cloud.database.collection', {
      name: collection
    }).add({ data });
  }
}
```

### 8.2 云存储

```typescript
class CloudStorageAPI {
  /**
   * 上传文件
   */
  async uploadFile(cloudPath: string, filePath: string): Promise<string> {
    return this.promisify('cloud.uploadFile', {
      cloudPath,
      filePath
    });
  }

  /**
   * 下载文件
   */
  async downloadFile(fileID: string): Promise<string> {
    return this.promisify('cloud.downloadFile', {
      fileID
    });
  }
}
```

## 9. 第三方服务集成

### 9.1 数据分析

```typescript
class AnalyticsAPI {
  /**
   * 上报事件
   */
  async reportEvent(event: string, data: any): Promise<void> {
    // 集成微信数据分析或第三方SDK
    await this.promisify('reportAnalytics', {
      event,
      data
    });
  }
}
```

## 10. 类型安全

### 10.1 完整的类型定义

```typescript
// 所有API都有完整的TypeScript类型定义
interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  timeout?: number;
}

interface RequestResult<T = any> {
  data: T;
  statusCode: number;
  header: Record<string, string>;
}
```

## 11. 性能优化

### 11.1 请求缓存

```typescript
class CacheManager {
  private cache = new Map<string, CacheEntry>();

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number): Promise<T> {
    const cached = this.cache.get(key);

    // 缓存命中且未过期
    if (cached && Date.now() < cached.expireAt) {
      return cached.data;
    }

    // 请求新数据
    const data = await fetcher();
    this.cache.set(key, {
      data,
      expireAt: Date.now() + ttl
    });

    return data;
  }
}
```

### 11.2 并发控制

```typescript
class ConcurrencyController {
  private limit: number = 10;
  private active: number = 0;
  private queue: Array<() => void> = [];

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  private async acquire(): Promise<void> {
    while (this.active >= this.limit) {
      await new Promise(resolve => this.queue.push(resolve));
    }
    this.active++;
  }

  private release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}
```

## 12. 使用示例

### 12.1 基本使用

```typescript
import { network, storage, ui } from './wx-api';

// HTTP请求
const data = await network.request({
  url: 'https://api.example.com/data',
  method: 'GET'
});

// 存储数据
await storage.setStorage('user', { name: 'Alice' });

// 显示提示
await ui.showToast({ title: '操作成功' });
```

### 12.2 高级使用

```typescript
// 自定义拦截器
network.useRequestInterceptor((options) => {
  options.header = {
    ...options.header,
    'X-Custom-Header': 'value'
  };
  return options;
});

// 自定义重试策略
const customRetryPolicy = {
  maxRetries: 5,
  initialDelay: 500,
  shouldRetry: (err) => err.statusCode >= 500
};

await network.request(options, { retryPolicy: customRetryPolicy });
```

## 13. 总结

API包装器模块通过以下设计实现了强大且易用的API封装:

1. **Promise化**: 所有API都返回Promise,支持async/await
2. **统一错误处理**: 清晰的错误分类和处理策略
3. **自动重试**: 可配置的重试策略,提高可靠性
4. **拦截器**: 灵活的请求/响应拦截机制
5. **Mock支持**: 完善的Mock数据支持,方便开发和测试
6. **类型安全**: 完整的TypeScript类型定义
7. **性能优化**: 缓存、并发控制等优化措施

这个架构既保持了灵活性,又提供了强大的功能,能够满足微信小程序开发的各种需求。
