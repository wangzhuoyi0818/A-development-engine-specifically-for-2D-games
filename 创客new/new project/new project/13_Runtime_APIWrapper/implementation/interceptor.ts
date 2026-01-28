/**
 * 微信小程序可视化开发平台 - 拦截器
 *
 * 提供请求拦截器和响应拦截器功能,支持链式处理
 */

import {
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorId,
  InterceptorManager,
  RequestOptions,
  RequestResult,
  APIError,
} from './types';

/**
 * 生成唯一ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 拦截器管理器实现
 */
class InterceptorManagerImpl<T> implements InterceptorManager<T> {
  private interceptors: Map<InterceptorId, T> = new Map();

  /**
   * 使用拦截器
   */
  use(interceptor: T): InterceptorId {
    const id = generateId();
    this.interceptors.set(id, interceptor);
    return id;
  }

  /**
   * 移除拦截器
   */
  eject(id: InterceptorId): void {
    this.interceptors.delete(id);
  }

  /**
   * 清空所有拦截器
   */
  clear(): void {
    this.interceptors.clear();
  }

  /**
   * 获取所有拦截器
   */
  getAll(): Array<{ id: InterceptorId; interceptor: T }> {
    return Array.from(this.interceptors.entries()).map(([id, interceptor]) => ({
      id,
      interceptor,
    }));
  }

  /**
   * 执行拦截器链
   */
  async execute<V>(initialValue: V, executor: (value: V, interceptor: T) => V | Promise<V>): Promise<V> {
    let value = initialValue;

    for (const { interceptor } of this.getAll()) {
      value = await executor(value, interceptor);
    }

    return value;
  }
}

/**
 * 请求拦截器管理器
 */
export class RequestInterceptorManager extends InterceptorManagerImpl<RequestInterceptor> {
  /**
   * 执行所有请求拦截器
   */
  async executeAll(options: RequestOptions): Promise<RequestOptions> {
    return this.execute(options, async (opts, interceptor) => {
      return await interceptor(opts);
    });
  }
}

/**
 * 响应拦截器管理器
 */
export class ResponseInterceptorManager extends InterceptorManagerImpl<ResponseInterceptor> {
  /**
   * 执行所有响应拦截器
   */
  async executeAll<T>(response: RequestResult<T>): Promise<any> {
    return this.execute(response, async (res, interceptor) => {
      return await interceptor(res);
    });
  }
}

/**
 * 错误拦截器管理器
 */
export class ErrorInterceptorManager extends InterceptorManagerImpl<ErrorInterceptor> {
  /**
   * 执行所有错误拦截器
   */
  async executeAll(error: APIError): Promise<APIError> {
    return this.execute(error, async (err, interceptor) => {
      return await interceptor(err);
    });
  }
}

/**
 * 拦截器集合
 */
export class InterceptorChain {
  readonly request: RequestInterceptorManager;
  readonly response: ResponseInterceptorManager;
  readonly error: ErrorInterceptorManager;

  constructor() {
    this.request = new RequestInterceptorManager();
    this.response = new ResponseInterceptorManager();
    this.error = new ErrorInterceptorManager();
  }

  /**
   * 清空所有拦截器
   */
  clearAll(): void {
    this.request.clear();
    this.response.clear();
    this.error.clear();
  }
}

// ============================================================================
// 内置拦截器
// ============================================================================

/**
 * 添加公共请求头拦截器
 */
export function createCommonHeaderInterceptor(
  headers: Record<string, string>
): RequestInterceptor {
  return (options: RequestOptions) => {
    return {
      ...options,
      header: {
        ...headers,
        ...options.header,
      },
    };
  };
}

/**
 * 添加Token拦截器
 */
export function createTokenInterceptor(
  getToken: () => string | null
): RequestInterceptor {
  return (options: RequestOptions) => {
    const token = getToken();

    if (!token) {
      return options;
    }

    return {
      ...options,
      header: {
        ...options.header,
        Authorization: `Bearer ${token}`,
      },
    };
  };
}

/**
 * 添加时间戳拦截器
 */
export function createTimestampInterceptor(): RequestInterceptor {
  return (options: RequestOptions) => {
    const timestamp = Date.now();

    // 添加到header
    const newOptions: RequestOptions = {
      ...options,
      header: {
        ...options.header,
        'X-Timestamp': timestamp.toString(),
      },
    };

    // 如果是GET请求,添加到URL参数
    if (!options.method || options.method === 'GET') {
      const url = new URL(options.url, 'http://dummy');
      url.searchParams.set('_t', timestamp.toString());
      newOptions.url = url.pathname + url.search;
    }

    return newOptions;
  };
}

/**
 * 添加请求ID拦截器
 */
export function createRequestIdInterceptor(): RequestInterceptor {
  return (options: RequestOptions) => {
    const requestId = generateId();

    return {
      ...options,
      header: {
        ...options.header,
        'X-Request-Id': requestId,
      },
    };
  };
}

/**
 * 添加BaseURL拦截器
 */
export function createBaseURLInterceptor(baseURL: string): RequestInterceptor {
  return (options: RequestOptions) => {
    // 如果URL已经是完整的,不处理
    if (options.url.startsWith('http://') || options.url.startsWith('https://')) {
      return options;
    }

    // 拼接baseURL
    const url = baseURL.endsWith('/') && options.url.startsWith('/')
      ? baseURL + options.url.slice(1)
      : baseURL + options.url;

    return {
      ...options,
      url,
    };
  };
}

/**
 * 添加超时拦截器
 */
export function createTimeoutInterceptor(defaultTimeout: number): RequestInterceptor {
  return (options: RequestOptions) => {
    return {
      ...options,
      timeout: options.timeout || defaultTimeout,
    };
  };
}

/**
 * 日志记录拦截器(请求)
 */
export function createRequestLogInterceptor(): RequestInterceptor {
  return (options: RequestOptions) => {
    console.log('[Request]', {
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      header: options.header,
    });

    return options;
  };
}

/**
 * 提取data字段响应拦截器
 * 很多API返回的数据格式为: { code: 0, data: {...}, message: '' }
 * 这个拦截器提取data字段
 */
export function createExtractDataInterceptor(): ResponseInterceptor {
  return <T>(response: RequestResult<any>): T => {
    // 如果响应数据有code和data字段,提取data
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data
    ) {
      return response.data.data as T;
    }

    // 否则返回原始data
    return response.data as T;
  };
}

/**
 * 业务错误检查响应拦截器
 * 检查响应中的业务错误码
 */
export function createBusinessErrorInterceptor(options: {
  codeField?: string;
  messageField?: string;
  successCode?: number;
}): ResponseInterceptor {
  const {
    codeField = 'code',
    messageField = 'message',
    successCode = 0,
  } = options;

  return (response: RequestResult<any>): RequestResult<any> => {
    const { data } = response;

    // 检查业务错误码
    if (
      data &&
      typeof data === 'object' &&
      codeField in data &&
      data[codeField] !== successCode
    ) {
      const message = data[messageField] || '业务错误';
      throw new Error(`[Business Error] ${data[codeField]}: ${message}`);
    }

    return response;
  };
}

/**
 * 日志记录拦截器(响应)
 */
export function createResponseLogInterceptor(): ResponseInterceptor {
  return (response: RequestResult<any>): RequestResult<any> => {
    console.log('[Response]', {
      statusCode: response.statusCode,
      data: response.data,
      header: response.header,
    });

    return response;
  };
}

/**
 * 日志记录拦截器(错误)
 */
export function createErrorLogInterceptor(): ErrorInterceptor {
  return (error: APIError): APIError => {
    console.error('[Error]', {
      type: error.type,
      code: error.code,
      message: error.message,
      requestId: error.requestId,
    });

    return error;
  };
}

/**
 * 错误上报拦截器
 */
export function createErrorReportInterceptor(
  reporter: (error: APIError) => void
): ErrorInterceptor {
  return (error: APIError): APIError => {
    // 上报错误
    try {
      reporter(error);
    } catch (e) {
      console.error('Failed to report error:', e);
    }

    return error;
  };
}

/**
 * 用户友好错误消息拦截器
 * 将技术性错误转换为用户友好的消息
 */
export function createUserFriendlyErrorInterceptor(
  messageMap?: Record<string, string>
): ErrorInterceptor {
  const defaultMessageMap: Record<string, string> = {
    NETWORK_ERROR: '网络连接失败,请检查网络设置',
    TIMEOUT: '请求超时,请稍后重试',
    PERMISSION_DENIED: '缺少必要权限,请在设置中开启',
    INVALID_PARAMS: '请求参数错误',
    UNKNOWN: '操作失败,请稍后重试',
    ...messageMap,
  };

  return (error: APIError): APIError => {
    // 如果有映射的友好消息,替换
    if (defaultMessageMap[error.code]) {
      error.message = defaultMessageMap[error.code];
    }

    return error;
  };
}

/**
 * 导出默认拦截器集合
 */
export function createDefaultInterceptors(options: {
  baseURL?: string;
  timeout?: number;
  getToken?: () => string | null;
  enableLogging?: boolean;
}): {
  request: RequestInterceptor[];
  response: ResponseInterceptor[];
  error: ErrorInterceptor[];
} {
  const requestInterceptors: RequestInterceptor[] = [];
  const responseInterceptors: ResponseInterceptor[] = [];
  const errorInterceptors: ErrorInterceptor[] = [];

  // 添加baseURL拦截器
  if (options.baseURL) {
    requestInterceptors.push(createBaseURLInterceptor(options.baseURL));
  }

  // 添加超时拦截器
  if (options.timeout) {
    requestInterceptors.push(createTimeoutInterceptor(options.timeout));
  }

  // 添加token拦截器
  if (options.getToken) {
    requestInterceptors.push(createTokenInterceptor(options.getToken));
  }

  // 添加请求ID拦截器
  requestInterceptors.push(createRequestIdInterceptor());

  // 添加时间戳拦截器
  requestInterceptors.push(createTimestampInterceptor());

  // 添加日志拦截器
  if (options.enableLogging) {
    requestInterceptors.push(createRequestLogInterceptor());
    responseInterceptors.push(createResponseLogInterceptor());
    errorInterceptors.push(createErrorLogInterceptor());
  }

  // 添加提取data拦截器
  responseInterceptors.push(createExtractDataInterceptor());

  // 添加用户友好错误消息拦截器
  errorInterceptors.push(createUserFriendlyErrorInterceptor());

  return {
    request: requestInterceptors,
    response: responseInterceptors,
    error: errorInterceptors,
  };
}
