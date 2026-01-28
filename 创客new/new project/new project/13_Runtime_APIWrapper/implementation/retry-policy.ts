/**
 * 微信小程序可视化开发平台 - 重试策略
 *
 * 提供可配置的重试机制,支持指数退避、最大重试次数等
 */

import { APIError, ErrorType, RetryPolicy, RetryPolicyOptions } from './types';
import { isRetryableError, isNetworkError } from './error-handler';

/**
 * 创建默认重试策略
 */
export function createDefaultRetryPolicy(
  options: RetryPolicyOptions = {}
): RetryPolicy {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 10000,
    retryableErrorTypes = [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT],
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
  } = options;

  return {
    maxRetries,
    initialDelay,
    backoffMultiplier,
    maxDelay,

    shouldRetry(error: APIError, attemptNumber: number): boolean {
      // 超过最大重试次数
      if (attemptNumber >= maxRetries) {
        return false;
      }

      // 检查错误类型是否可重试
      if (retryableErrorTypes.includes(error.type)) {
        return true;
      }

      // 检查是否是可重试的状态码
      if (error.originalError?.statusCode) {
        return retryableStatusCodes.includes(error.originalError.statusCode);
      }

      // 检查error.recoverable标志
      return isRetryableError(error);
    },

    getDelay(attemptNumber: number): number {
      // 指数退避: initialDelay * (backoffMultiplier ^ attemptNumber)
      const delay =
        initialDelay * Math.pow(backoffMultiplier, attemptNumber);

      // 限制最大延迟
      return Math.min(delay, maxDelay);
    },

    onRetry(error: APIError, attemptNumber: number): void {
      console.log(
        `[Retry] 第 ${attemptNumber + 1} 次重试,错误: ${error.message}`
      );
    },
  };
}

/**
 * 创建网络请求重试策略
 * 针对网络请求优化的重试策略
 */
export function createNetworkRetryPolicy(): RetryPolicy {
  return createDefaultRetryPolicy({
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 10000,
    retryableErrorTypes: [ErrorType.NETWORK_ERROR, ErrorType.TIMEOUT],
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  });
}

/**
 * 创建激进重试策略
 * 更多重试次数,更短的初始延迟
 */
export function createAggressiveRetryPolicy(): RetryPolicy {
  return createDefaultRetryPolicy({
    maxRetries: 5,
    initialDelay: 500,
    backoffMultiplier: 1.5,
    maxDelay: 5000,
  });
}

/**
 * 创建保守重试策略
 * 更少重试次数,更长的延迟
 */
export function createConservativeRetryPolicy(): RetryPolicy {
  return createDefaultRetryPolicy({
    maxRetries: 2,
    initialDelay: 2000,
    backoffMultiplier: 3,
    maxDelay: 30000,
  });
}

/**
 * 创建无重试策略
 */
export function createNoRetryPolicy(): RetryPolicy {
  return {
    maxRetries: 0,
    initialDelay: 0,
    backoffMultiplier: 1,
    maxDelay: 0,
    shouldRetry: () => false,
    getDelay: () => 0,
  };
}

/**
 * 创建自定义重试策略
 * 允许传入自定义的shouldRetry和getDelay函数
 */
export function createCustomRetryPolicy(options: {
  maxRetries: number;
  shouldRetry: (error: APIError, attemptNumber: number) => boolean;
  getDelay: (attemptNumber: number) => number;
  onRetry?: (error: APIError, attemptNumber: number) => void;
}): RetryPolicy {
  return {
    maxRetries: options.maxRetries,
    initialDelay: 0, // 由getDelay自定义
    backoffMultiplier: 1, // 由getDelay自定义
    maxDelay: Number.MAX_SAFE_INTEGER, // 由getDelay自定义
    shouldRetry: options.shouldRetry,
    getDelay: options.getDelay,
    onRetry: options.onRetry,
  };
}

/**
 * 重试执行器
 * 封装重试逻辑,简化使用
 */
export class RetryExecutor {
  private policy: RetryPolicy;

  constructor(policy: RetryPolicy = createDefaultRetryPolicy()) {
    this.policy = policy;
  }

  /**
   * 执行带重试的函数
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: APIError | null = null;
    let attemptNumber = 0;

    while (attemptNumber <= this.policy.maxRetries) {
      try {
        // 执行函数
        return await fn();
      } catch (error: any) {
        lastError = error as APIError;

        // 判断是否应该重试
        if (
          attemptNumber < this.policy.maxRetries &&
          this.policy.shouldRetry(lastError, attemptNumber)
        ) {
          // 调用onRetry回调
          this.policy.onRetry?.(lastError, attemptNumber);

          // 计算延迟时间
          const delay = this.policy.getDelay(attemptNumber);

          // 等待
          await this.sleep(delay);

          // 增加尝试次数
          attemptNumber++;
        } else {
          // 不应该重试,抛出错误
          throw lastError;
        }
      }
    }

    // 超过最大重试次数,抛出最后的错误
    throw lastError;
  }

  /**
   * 更新重试策略
   */
  setPolicy(policy: RetryPolicy): void {
    this.policy = policy;
  }

  /**
   * 获取当前重试策略
   */
  getPolicy(): RetryPolicy {
    return this.policy;
  }

  /**
   * 延迟执行
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 带抖动的重试策略
 * 在计算的延迟基础上添加随机抖动,避免"惊群效应"
 */
export function createJitteredRetryPolicy(
  basePolicy: RetryPolicy = createDefaultRetryPolicy(),
  jitterFactor: number = 0.1 // 抖动因子,0-1之间
): RetryPolicy {
  return {
    ...basePolicy,
    getDelay(attemptNumber: number): number {
      const baseDelay = basePolicy.getDelay(attemptNumber);

      // 计算抖动范围
      const jitter = baseDelay * jitterFactor;

      // 添加随机抖动: baseDelay +/- jitter
      const randomJitter = (Math.random() * 2 - 1) * jitter;

      return Math.max(0, baseDelay + randomJitter);
    },
  };
}

/**
 * 条件重试策略
 * 只对特定条件的错误进行重试
 */
export function createConditionalRetryPolicy(options: {
  maxRetries: number;
  condition: (error: APIError) => boolean;
  basePolicy?: RetryPolicy;
}): RetryPolicy {
  const basePolicy = options.basePolicy || createDefaultRetryPolicy();

  return {
    ...basePolicy,
    maxRetries: options.maxRetries,
    shouldRetry(error: APIError, attemptNumber: number): boolean {
      // 首先检查自定义条件
      if (!options.condition(error)) {
        return false;
      }

      // 然后检查基础策略
      return basePolicy.shouldRetry(error, attemptNumber);
    },
  };
}

/**
 * 只重试网络错误的策略
 */
export function createNetworkOnlyRetryPolicy(
  maxRetries: number = 3
): RetryPolicy {
  return createConditionalRetryPolicy({
    maxRetries,
    condition: isNetworkError,
  });
}

/**
 * 重试统计
 */
export interface RetryStats {
  /** 总尝试次数 */
  totalAttempts: number;

  /** 成功次数 */
  successCount: number;

  /** 失败次数 */
  failureCount: number;

  /** 重试次数 */
  retryCount: number;

  /** 平均重试次数 */
  averageRetries: number;

  /** 总延迟时间(毫秒) */
  totalDelay: number;
}

/**
 * 带统计的重试执行器
 */
export class RetryExecutorWithStats extends RetryExecutor {
  private stats: RetryStats = {
    totalAttempts: 0,
    successCount: 0,
    failureCount: 0,
    retryCount: 0,
    averageRetries: 0,
    totalDelay: 0,
  };

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const startAttempts = this.stats.totalAttempts;
    const startDelay = this.stats.totalDelay;

    try {
      const result = await super.execute(fn);

      // 记录成功
      this.stats.successCount++;

      return result;
    } catch (error) {
      // 记录失败
      this.stats.failureCount++;

      throw error;
    } finally {
      // 更新统计
      const attemptsDiff = this.stats.totalAttempts - startAttempts;
      const delayDiff = this.stats.totalDelay - startDelay;

      if (attemptsDiff > 1) {
        this.stats.retryCount += attemptsDiff - 1;
      }

      // 计算平均重试次数
      const totalExecutions = this.stats.successCount + this.stats.failureCount;
      this.stats.averageRetries = totalExecutions > 0
        ? this.stats.retryCount / totalExecutions
        : 0;
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): Readonly<RetryStats> {
    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successCount: 0,
      failureCount: 0,
      retryCount: 0,
      averageRetries: 0,
      totalDelay: 0,
    };
  }
}

/**
 * 导出默认重试策略
 */
export const defaultRetryPolicy = createDefaultRetryPolicy();
