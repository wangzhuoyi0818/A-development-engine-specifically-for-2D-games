/**
 * 微信小程序可视化开发平台 - API包装器类型定义
 *
 * 本文件定义了API包装器模块的所有TypeScript类型接口
 * 包括请求、响应、错误处理、重试策略等核心类型
 */

// ============================================================================
// 基础类型
// ============================================================================

/**
 * HTTP方法
 */
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * 请求选项
 */
export interface RequestOptions<T = any> {
  /** 请求URL */
  url: string;

  /** HTTP方法 */
  method?: HTTPMethod;

  /** 请求数据 */
  data?: T;

  /** 请求头 */
  header?: Record<string, string>;

  /** 超时时间(毫秒) */
  timeout?: number;

  /** 数据类型 */
  dataType?: 'json' | 'text' | 'arraybuffer';

  /** 响应类型 */
  responseType?: 'text' | 'arraybuffer';

  /** 是否启用缓存 */
  enableCache?: boolean;

  /** 缓存时间(毫秒) */
  cacheTTL?: number;

  /** 重试策略 */
  retryPolicy?: RetryPolicy;
}

/**
 * 请求结果
 */
export interface RequestResult<T = any> {
  /** 响应数据 */
  data: T;

  /** HTTP状态码 */
  statusCode: number;

  /** 响应头 */
  header: Record<string, string>;

  /** cookies */
  cookies?: string[];

  /** profile信息 */
  profile?: any;
}

// ============================================================================
// 错误处理类型
// ============================================================================

/**
 * 错误类型枚举
 */
export enum ErrorType {
  /** 网络错误 */
  NETWORK_ERROR = 'NETWORK_ERROR',

  /** 超时错误 */
  TIMEOUT = 'TIMEOUT',

  /** 业务错误 */
  BUSINESS_ERROR = 'BUSINESS_ERROR',

  /** 系统错误 */
  SYSTEM_ERROR = 'SYSTEM_ERROR',

  /** 权限错误 */
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  /** 参数错误 */
  INVALID_PARAMS = 'INVALID_PARAMS',

  /** 未知错误 */
  UNKNOWN = 'UNKNOWN',
}

/**
 * API错误
 */
export interface APIError extends Error {
  /** 错误类型 */
  type: ErrorType;

  /** 错误码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 原始错误 */
  originalError?: any;

  /** 是否可恢复 */
  recoverable: boolean;

  /** 时间戳 */
  timestamp: number;

  /** 请求ID */
  requestId?: string;

  /** 额外信息 */
  extra?: Record<string, any>;
}

// ============================================================================
// 拦截器类型
// ============================================================================

/**
 * 请求拦截器
 */
export type RequestInterceptor = (
  options: RequestOptions
) => RequestOptions | Promise<RequestOptions>;

/**
 * 响应拦截器
 */
export type ResponseInterceptor<T = any> = (
  response: RequestResult<T>
) => RequestResult<T> | Promise<RequestResult<T>> | T | Promise<T>;

/**
 * 错误拦截器
 */
export type ErrorInterceptor = (
  error: APIError
) => APIError | Promise<APIError> | never;

/**
 * 拦截器ID
 */
export type InterceptorId = string;

/**
 * 拦截器管理器接口
 */
export interface InterceptorManager<T> {
  /** 使用拦截器 */
  use(interceptor: T): InterceptorId;

  /** 移除拦截器 */
  eject(id: InterceptorId): void;

  /** 清空所有拦截器 */
  clear(): void;

  /** 获取所有拦截器 */
  getAll(): Array<{ id: InterceptorId; interceptor: T }>;
}

// ============================================================================
// 重试策略类型
// ============================================================================

/**
 * 重试策略
 */
export interface RetryPolicy {
  /** 最大重试次数 */
  maxRetries: number;

  /** 初始延迟时间(毫秒) */
  initialDelay: number;

  /** 延迟倍增因子 */
  backoffMultiplier: number;

  /** 最大延迟时间(毫秒) */
  maxDelay: number;

  /** 判断是否应该重试 */
  shouldRetry: (error: APIError, attemptNumber: number) => boolean;

  /** 计算延迟时间 */
  getDelay: (attemptNumber: number) => number;

  /** 重试前的回调 */
  onRetry?: (error: APIError, attemptNumber: number) => void;
}

/**
 * 默认重试策略选项
 */
export interface RetryPolicyOptions {
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryableErrorTypes?: ErrorType[];
  retryableStatusCodes?: number[];
}

// ============================================================================
// 缓存类型
// ============================================================================

/**
 * 缓存条目
 */
export interface CacheEntry<T = any> {
  /** 缓存数据 */
  data: T;

  /** 过期时间(时间戳) */
  expireAt: number;

  /** 创建时间(时间戳) */
  createdAt: number;

  /** 缓存键 */
  key: string;
}

/**
 * 缓存管理器接口
 */
export interface CacheManager {
  /** 获取缓存 */
  get<T = any>(key: string): CacheEntry<T> | null;

  /** 设置缓存 */
  set<T = any>(key: string, data: T, ttl: number): void;

  /** 删除缓存 */
  delete(key: string): void;

  /** 清空所有缓存 */
  clear(): void;

  /** 检查缓存是否存在且未过期 */
  has(key: string): boolean;

  /** 获取缓存大小 */
  size(): number;
}

// ============================================================================
// 并发控制类型
// ============================================================================

/**
 * 并发控制器接口
 */
export interface ConcurrencyController {
  /** 限制并发数 */
  limit: number;

  /** 当前活跃请求数 */
  active: number;

  /** 等待队列长度 */
  queueSize: number;

  /** 执行带并发控制的函数 */
  run<T>(fn: () => Promise<T>): Promise<T>;

  /** 重置控制器 */
  reset(): void;
}

// ============================================================================
// Mock数据类型
// ============================================================================

/**
 * Mock配置
 */
export interface MockConfig {
  /** 是否启用Mock */
  enabled: boolean;

  /** 模拟延迟(毫秒) */
  delay?: number;

  /** 模拟错误率(0-1) */
  errorRate?: number;

  /** 是否记录日志 */
  logging?: boolean;
}

/**
 * Mock数据定义
 */
export interface MockDataDefinition<T = any> {
  /** 成功响应数据 */
  success: T;

  /** 失败响应 */
  fail?: {
    type: ErrorType;
    code: string;
    message: string;
  };

  /** 延迟时间(毫秒,覆盖全局配置) */
  delay?: number;

  /** 匹配条件 */
  matcher?: (options: RequestOptions) => boolean;
}

/**
 * Mock管理器接口
 */
export interface MockManager {
  /** 添加Mock数据 */
  add(pattern: string | RegExp, data: MockDataDefinition): void;

  /** 移除Mock数据 */
  remove(pattern: string | RegExp): void;

  /** 清空所有Mock数据 */
  clear(): void;

  /** 查找匹配的Mock数据 */
  find(options: RequestOptions): MockDataDefinition | null;

  /** 执行Mock */
  execute<T>(options: RequestOptions): Promise<RequestResult<T>>;
}

// ============================================================================
// 微信API特定类型
// ============================================================================

/**
 * 上传文件选项
 */
export interface UploadFileOptions {
  /** 上传URL */
  url: string;

  /** 文件路径 */
  filePath: string;

  /** 文件对应的key */
  name: string;

  /** HTTP请求头 */
  header?: Record<string, string>;

  /** 额外的表单数据 */
  formData?: Record<string, any>;

  /** 超时时间 */
  timeout?: number;
}

/**
 * 上传文件结果
 */
export interface UploadFileResult {
  /** 响应数据 */
  data: string;

  /** HTTP状态码 */
  statusCode: number;
}

/**
 * 下载文件选项
 */
export interface DownloadFileOptions {
  /** 下载URL */
  url: string;

  /** HTTP请求头 */
  header?: Record<string, string>;

  /** 超时时间 */
  timeout?: number;

  /** 指定文件下载后存储的路径 */
  filePath?: string;
}

/**
 * 下载文件结果
 */
export interface DownloadFileResult {
  /** 临时文件路径 */
  tempFilePath: string;

  /** HTTP状态码 */
  statusCode: number;

  /** 响应头 */
  header?: Record<string, string>;
}

/**
 * Storage选项
 */
export interface StorageOptions {
  /** 本地缓存中指定的key */
  key: string;

  /** 需要存储的内容 */
  data?: any;
}

/**
 * Toast选项
 */
export interface ToastOptions {
  /** 提示内容 */
  title: string;

  /** 图标 */
  icon?: 'success' | 'error' | 'loading' | 'none';

  /** 自定义图标路径 */
  image?: string;

  /** 提示持续时间(毫秒) */
  duration?: number;

  /** 是否显示透明蒙层,防止触摸穿透 */
  mask?: boolean;
}

/**
 * Modal选项
 */
export interface ModalOptions {
  /** 标题 */
  title?: string;

  /** 内容 */
  content: string;

  /** 是否显示取消按钮 */
  showCancel?: boolean;

  /** 取消按钮文字 */
  cancelText?: string;

  /** 取消按钮颜色 */
  cancelColor?: string;

  /** 确定按钮文字 */
  confirmText?: string;

  /** 确定按钮颜色 */
  confirmColor?: string;
}

/**
 * Modal结果
 */
export interface ModalResult {
  /** 是否点击确定 */
  confirm: boolean;

  /** 是否点击取消 */
  cancel: boolean;
}

/**
 * 导航选项
 */
export interface NavigateOptions {
  /** 跳转页面路径 */
  url: string;

  /** 页面间通信接口 */
  events?: Record<string, Function>;

  /** 页面参数 */
  success?: () => void;

  /** 接口调用失败的回调函数 */
  fail?: () => void;

  /** 接口调用结束的回调函数 */
  complete?: () => void;
}

/**
 * 系统信息
 */
export interface SystemInfo {
  /** 手机品牌 */
  brand: string;

  /** 手机型号 */
  model: string;

  /** 设备像素比 */
  pixelRatio: number;

  /** 屏幕宽度(单位px) */
  screenWidth: number;

  /** 屏幕高度(单位px) */
  screenHeight: number;

  /** 可使用窗口宽度(单位px) */
  windowWidth: number;

  /** 可使用窗口高度(单位px) */
  windowHeight: number;

  /** 状态栏高度(单位px) */
  statusBarHeight: number;

  /** 微信版本号 */
  version: string;

  /** 操作系统及版本 */
  system: string;

  /** 客户端平台 */
  platform: string;

  /** 用户字体大小(单位px) */
  fontSizeSetting: number;

  /** 客户端基础库版本 */
  SDKVersion: string;
}

/**
 * 位置信息
 */
export interface LocationInfo {
  /** 纬度 */
  latitude: number;

  /** 经度 */
  longitude: number;

  /** 速度(单位m/s) */
  speed: number;

  /** 位置精度 */
  accuracy: number;

  /** 高度(单位m) */
  altitude: number;

  /** 垂直精度(单位m) */
  verticalAccuracy: number;

  /** 水平精度(单位m) */
  horizontalAccuracy: number;
}

/**
 * 选择图片选项
 */
export interface ChooseImageOptions {
  /** 最多可以选择的图片张数 */
  count?: number;

  /** 所选的图片的尺寸 */
  sizeType?: Array<'original' | 'compressed'>;

  /** 选择图片的来源 */
  sourceType?: Array<'album' | 'camera'>;
}

/**
 * 选择图片结果
 */
export interface ChooseImageResult {
  /** 图片的本地临时文件路径列表 */
  tempFilePaths: string[];

  /** 图片的本地临时文件列表 */
  tempFiles: Array<{
    path: string;
    size: number;
  }>;
}

/**
 * 支付选项
 */
export interface PaymentOptions {
  /** 时间戳 */
  timeStamp: string;

  /** 随机字符串 */
  nonceStr: string;

  /** 统一下单接口返回的prepay_id参数值 */
  package: string;

  /** 签名类型 */
  signType?: 'MD5' | 'HMAC-SHA256';

  /** 签名 */
  paySign: string;
}

// ============================================================================
// API包装器配置类型
// ============================================================================

/**
 * API包装器配置
 */
export interface APIWrapperConfig {
  /** 基础URL */
  baseURL?: string;

  /** 默认超时时间(毫秒) */
  timeout?: number;

  /** 默认请求头 */
  headers?: Record<string, string>;

  /** 重试策略 */
  retryPolicy?: RetryPolicyOptions;

  /** 并发限制 */
  concurrencyLimit?: number;

  /** 是否启用缓存 */
  enableCache?: boolean;

  /** 默认缓存TTL(毫秒) */
  defaultCacheTTL?: number;

  /** Mock配置 */
  mock?: MockConfig;

  /** 是否启用日志 */
  enableLogging?: boolean;

  /** 是否启用性能监控 */
  enablePerformance?: boolean;
}

// ============================================================================
// 性能监控类型
// ============================================================================

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 请求ID */
  requestId: string;

  /** API名称 */
  apiName: string;

  /** 请求URL */
  url: string;

  /** 开始时间 */
  startTime: number;

  /** 结束时间 */
  endTime: number;

  /** 持续时间(毫秒) */
  duration: number;

  /** 重试次数 */
  retryCount: number;

  /** 是否缓存命中 */
  cacheHit: boolean;

  /** 是否成功 */
  success: boolean;

  /** 错误信息 */
  error?: string;

  /** 额外信息 */
  extra?: Record<string, any>;
}

/**
 * 性能监控器接口
 */
export interface PerformanceMonitor {
  /** 开始记录 */
  start(requestId: string, apiName: string, url: string): void;

  /** 结束记录 */
  end(requestId: string, success: boolean, error?: string): void;

  /** 记录重试 */
  retry(requestId: string): void;

  /** 记录缓存命中 */
  cacheHit(requestId: string): void;

  /** 获取指标 */
  getMetrics(requestId: string): PerformanceMetrics | null;

  /** 获取所有指标 */
  getAllMetrics(): PerformanceMetrics[];

  /** 清空指标 */
  clear(): void;
}

// ============================================================================
// 导出所有类型
// ============================================================================

export type {
  HTTPMethod,
  RequestOptions,
  RequestResult,
  APIError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorId,
  InterceptorManager,
  RetryPolicy,
  RetryPolicyOptions,
  CacheEntry,
  CacheManager,
  ConcurrencyController,
  MockConfig,
  MockDataDefinition,
  MockManager,
  UploadFileOptions,
  UploadFileResult,
  DownloadFileOptions,
  DownloadFileResult,
  StorageOptions,
  ToastOptions,
  ModalOptions,
  ModalResult,
  NavigateOptions,
  SystemInfo,
  LocationInfo,
  ChooseImageOptions,
  ChooseImageResult,
  PaymentOptions,
  APIWrapperConfig,
  PerformanceMetrics,
  PerformanceMonitor,
};
