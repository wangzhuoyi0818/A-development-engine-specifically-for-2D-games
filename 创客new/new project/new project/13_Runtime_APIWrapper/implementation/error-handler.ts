/**
 * 微信小程序可视化开发平台 - 错误处理器
 *
 * 提供统一的错误处理机制,包括错误分类、错误映射、错误转换等
 */

import { APIError, ErrorType } from './types';

// 重新导出ErrorType以便在error-handler中使用
export { ErrorType };

/**
 * API错误类
 * 扩展标准Error类,提供更丰富的错误信息
 */
export class APIErrorImpl extends Error implements APIError {
  type: ErrorType;
  code: string;
  message: string;
  originalError?: any;
  recoverable: boolean;
  timestamp: number;
  requestId?: string;
  extra?: Record<string, any>;

  constructor(
    type: ErrorType,
    code: string,
    message: string,
    originalError?: any,
    recoverable: boolean = false
  ) {
    super(message);
    this.name = 'APIError';
    this.type = type;
    this.code = code;
    this.message = message;
    this.originalError = originalError;
    this.recoverable = recoverable;
    this.timestamp = Date.now();

    // 保持原型链
    Object.setPrototypeOf(this, APIErrorImpl.prototype);
  }

  /**
   * 设置请求ID
   */
  setRequestId(requestId: string): this {
    this.requestId = requestId;
    return this;
  }

  /**
   * 设置额外信息
   */
  setExtra(extra: Record<string, any>): this {
    this.extra = { ...this.extra, ...extra };
    return this;
  }

  /**
   * 转换为JSON对象
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      requestId: this.requestId,
      extra: this.extra,
    };
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return `[${this.type}] ${this.code}: ${this.message}`;
  }
}

/**
 * 错误处理器
 * 负责将各种类型的错误转换为标准APIError
 */
export class ErrorHandler {
  /**
   * 处理微信API错误
   */
  static handleWxError(error: any, apiName?: string): APIError {
    const errMsg = error.errMsg || error.message || '';
    const errCode = error.errCode || error.errno || '';

    // 超时错误
    if (errMsg.includes('timeout') || errMsg.includes('超时')) {
      return new APIErrorImpl(
        ErrorType.TIMEOUT,
        'TIMEOUT',
        '请求超时',
        error,
        true // 超时可重试
      );
    }

    // 权限错误(必须在网络错误检查之前)
    if (
      errMsg.includes('permission') ||
      errMsg.includes('authorize') ||
      errMsg.includes('权限') ||
      errMsg.includes('授权')
    ) {
      return new APIErrorImpl(
        ErrorType.PERMISSION_DENIED,
        'PERMISSION_DENIED',
        '权限被拒绝',
        error,
        false
      );
    }

    // 网络错误
    if (
      errMsg.includes('fail') ||
      errMsg.includes('network') ||
      errMsg.includes('网络')
    ) {
      return new APIErrorImpl(
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        '网络连接失败',
        error,
        true // 网络错误可重试
      );
    }

    // 参数错误
    if (
      errMsg.includes('parameter') ||
      errMsg.includes('invalid') ||
      errMsg.includes('参数')
    ) {
      return new APIErrorImpl(
        ErrorType.INVALID_PARAMS,
        'INVALID_PARAMS',
        '参数错误',
        error,
        false
      );
    }

    // 默认为系统错误
    return new APIErrorImpl(
      ErrorType.SYSTEM_ERROR,
      errCode?.toString() || 'UNKNOWN',
      errMsg || '未知错误',
      error,
      false
    );
  }

  /**
   * 处理HTTP错误
   */
  static handleHttpError(statusCode: number, data?: any): APIError {
    // 4xx 客户端错误
    if (statusCode >= 400 && statusCode < 500) {
      const errorMap: Record<number, { code: string; message: string }> = {
        400: { code: 'BAD_REQUEST', message: '请求参数错误' },
        401: { code: 'UNAUTHORIZED', message: '未授权' },
        403: { code: 'FORBIDDEN', message: '禁止访问' },
        404: { code: 'NOT_FOUND', message: '资源不存在' },
        405: { code: 'METHOD_NOT_ALLOWED', message: '请求方法不允许' },
        408: { code: 'REQUEST_TIMEOUT', message: '请求超时' },
        429: { code: 'TOO_MANY_REQUESTS', message: '请求过于频繁' },
      };

      const error = errorMap[statusCode] || {
        code: `HTTP_${statusCode}`,
        message: `客户端错误: ${statusCode}`,
      };

      return new APIErrorImpl(
        ErrorType.BUSINESS_ERROR,
        error.code,
        data?.message || error.message,
        data,
        false
      );
    }

    // 5xx 服务器错误
    if (statusCode >= 500) {
      const errorMap: Record<number, { code: string; message: string }> = {
        500: { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
        502: { code: 'BAD_GATEWAY', message: '网关错误' },
        503: { code: 'SERVICE_UNAVAILABLE', message: '服务暂时不可用' },
        504: { code: 'GATEWAY_TIMEOUT', message: '网关超时' },
      };

      const error = errorMap[statusCode] || {
        code: `HTTP_${statusCode}`,
        message: `服务器错误: ${statusCode}`,
      };

      return new APIErrorImpl(
        ErrorType.SYSTEM_ERROR,
        error.code,
        data?.message || error.message,
        data,
        true // 5xx错误可重试
      );
    }

    // 其他状态码
    return new APIErrorImpl(
      ErrorType.UNKNOWN,
      `HTTP_${statusCode}`,
      `HTTP错误: ${statusCode}`,
      data,
      false
    );
  }

  /**
   * 处理业务错误
   * @param code 业务错误码
   * @param message 错误消息
   * @param data 错误数据
   */
  static handleBusinessError(
    code: string | number,
    message: string,
    data?: any
  ): APIError {
    return new APIErrorImpl(
      ErrorType.BUSINESS_ERROR,
      code.toString(),
      message,
      data,
      false
    );
  }

  /**
   * 处理通用错误
   */
  static handleError(error: any): APIError {
    // 已经是APIError
    if (error instanceof APIErrorImpl) {
      return error;
    }

    // 标准Error对象
    if (error instanceof Error) {
      return new APIErrorImpl(
        ErrorType.SYSTEM_ERROR,
        'RUNTIME_ERROR',
        error.message,
        error,
        false
      );
    }

    // 字符串错误
    if (typeof error === 'string') {
      return new APIErrorImpl(
        ErrorType.SYSTEM_ERROR,
        'UNKNOWN',
        error,
        undefined,
        false
      );
    }

    // 其他类型
    return new APIErrorImpl(
      ErrorType.UNKNOWN,
      'UNKNOWN',
      '未知错误',
      error,
      false
    );
  }
}

/**
 * 错误码映射表
 * 将微信API错误码映射到标准错误码
 */
export const WX_ERROR_CODE_MAP: Record<
  string,
  { type: ErrorType; code: string; message: string; recoverable: boolean }
> = {
  // 网络相关
  'request:fail': {
    type: ErrorType.NETWORK_ERROR,
    code: 'NETWORK_ERROR',
    message: '网络请求失败',
    recoverable: true,
  },
  'request:fail timeout': {
    type: ErrorType.TIMEOUT,
    code: 'TIMEOUT',
    message: '网络请求超时',
    recoverable: true,
  },
  'request:fail abort': {
    type: ErrorType.NETWORK_ERROR,
    code: 'REQUEST_ABORTED',
    message: '网络请求被中断',
    recoverable: false,
  },

  // Storage相关
  'setStorage:fail': {
    type: ErrorType.SYSTEM_ERROR,
    code: 'STORAGE_ERROR',
    message: '存储失败',
    recoverable: false,
  },
  'getStorage:fail': {
    type: ErrorType.SYSTEM_ERROR,
    code: 'STORAGE_ERROR',
    message: '读取存储失败',
    recoverable: false,
  },
  'removeStorage:fail': {
    type: ErrorType.SYSTEM_ERROR,
    code: 'STORAGE_ERROR',
    message: '删除存储失败',
    recoverable: false,
  },

  // 权限相关
  'authorize:fail': {
    type: ErrorType.PERMISSION_DENIED,
    code: 'PERMISSION_DENIED',
    message: '用户拒绝授权',
    recoverable: false,
  },
  'authorize:fail auth deny': {
    type: ErrorType.PERMISSION_DENIED,
    code: 'AUTH_DENIED',
    message: '用户拒绝授权',
    recoverable: false,
  },

  // 文件相关
  'uploadFile:fail': {
    type: ErrorType.NETWORK_ERROR,
    code: 'UPLOAD_ERROR',
    message: '文件上传失败',
    recoverable: true,
  },
  'downloadFile:fail': {
    type: ErrorType.NETWORK_ERROR,
    code: 'DOWNLOAD_ERROR',
    message: '文件下载失败',
    recoverable: true,
  },

  // 支付相关
  'requestPayment:fail': {
    type: ErrorType.BUSINESS_ERROR,
    code: 'PAYMENT_ERROR',
    message: '支付失败',
    recoverable: false,
  },
  'requestPayment:fail cancel': {
    type: ErrorType.BUSINESS_ERROR,
    code: 'PAYMENT_CANCELLED',
    message: '用户取消支付',
    recoverable: false,
  },

  // 位置相关
  'getLocation:fail': {
    type: ErrorType.PERMISSION_DENIED,
    code: 'LOCATION_ERROR',
    message: '获取位置失败',
    recoverable: false,
  },
  'getLocation:fail auth deny': {
    type: ErrorType.PERMISSION_DENIED,
    code: 'LOCATION_AUTH_DENIED',
    message: '用户拒绝位置授权',
    recoverable: false,
  },

  // 相机/相册相关
  'chooseImage:fail': {
    type: ErrorType.SYSTEM_ERROR,
    code: 'CHOOSE_IMAGE_ERROR',
    message: '选择图片失败',
    recoverable: false,
  },
  'chooseImage:fail cancel': {
    type: ErrorType.BUSINESS_ERROR,
    code: 'CHOOSE_IMAGE_CANCELLED',
    message: '用户取消选择图片',
    recoverable: false,
  },
};

/**
 * 根据错误消息获取错误映射
 */
export function getErrorMapping(errMsg: string): {
  type: ErrorType;
  code: string;
  message: string;
  recoverable: boolean;
} | null {
  // 精确匹配
  if (WX_ERROR_CODE_MAP[errMsg]) {
    return WX_ERROR_CODE_MAP[errMsg];
  }

  // 模糊匹配
  for (const [key, value] of Object.entries(WX_ERROR_CODE_MAP)) {
    if (errMsg.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: APIError): boolean {
  return error.recoverable;
}

/**
 * 判断错误是否是网络错误
 */
export function isNetworkError(error: APIError): boolean {
  return (
    error.type === ErrorType.NETWORK_ERROR || error.type === ErrorType.TIMEOUT
  );
}

/**
 * 判断错误是否是权限错误
 */
export function isPermissionError(error: APIError): boolean {
  return error.type === ErrorType.PERMISSION_DENIED;
}

/**
 * 判断错误是否是业务错误
 */
export function isBusinessError(error: APIError): boolean {
  return error.type === ErrorType.BUSINESS_ERROR;
}
