/**
 * 重试策略测试
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createDefaultRetryPolicy,
  createNetworkRetryPolicy,
  createNoRetryPolicy,
  RetryExecutor,
} from '../retry-policy';
import { ErrorType } from '../types';
import { APIErrorImpl } from '../error-handler';

describe('RetryPolicy', () => {
  describe('createDefaultRetryPolicy', () => {
    it('应该创建默认重试策略', () => {
      const policy = createDefaultRetryPolicy();

      expect(policy.maxRetries).toBe(3);
      expect(policy.initialDelay).toBe(1000);
      expect(policy.backoffMultiplier).toBe(2);
      expect(policy.maxDelay).toBe(10000);
    });

    it('应该计算正确的延迟时间(指数退避)', () => {
      const policy = createDefaultRetryPolicy();

      expect(policy.getDelay(0)).toBe(1000); // 1000 * 2^0
      expect(policy.getDelay(1)).toBe(2000); // 1000 * 2^1
      expect(policy.getDelay(2)).toBe(4000); // 1000 * 2^2
      expect(policy.getDelay(3)).toBe(8000); // 1000 * 2^3
      expect(policy.getDelay(4)).toBe(10000); // min(16000, 10000)
    });

    it('应该正确判断是否应该重试', () => {
      const policy = createDefaultRetryPolicy();

      const networkError = new APIErrorImpl(
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        '网络错误',
        undefined,
        true
      );

      const businessError = new APIErrorImpl(
        ErrorType.BUSINESS_ERROR,
        'BUSINESS_ERROR',
        '业务错误',
        undefined,
        false
      );

      expect(policy.shouldRetry(networkError, 0)).toBe(true);
      expect(policy.shouldRetry(networkError, 3)).toBe(false); // 超过maxRetries
      expect(policy.shouldRetry(businessError, 0)).toBe(false);
    });
  });

  describe('createNetworkRetryPolicy', () => {
    it('应该创建网络重试策略', () => {
      const policy = createNetworkRetryPolicy();

      expect(policy.maxRetries).toBe(3);

      const networkError = new APIErrorImpl(
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        '网络错误',
        undefined,
        true
      );

      expect(policy.shouldRetry(networkError, 0)).toBe(true);
    });
  });

  describe('createNoRetryPolicy', () => {
    it('应该创建无重试策略', () => {
      const policy = createNoRetryPolicy();

      expect(policy.maxRetries).toBe(0);

      const error = new APIErrorImpl(
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        '网络错误',
        undefined,
        true
      );

      expect(policy.shouldRetry(error, 0)).toBe(false);
    });
  });

  describe('RetryExecutor', () => {
    it('应该在成功时不重试', async () => {
      const executor = new RetryExecutor(createDefaultRetryPolicy());
      const fn = vi.fn().mockResolvedValue('success');

      const result = await executor.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('应该在失败时重试', async () => {
      const executor = new RetryExecutor(createDefaultRetryPolicy());

      let callCount = 0;
      const fn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new APIErrorImpl(
            ErrorType.NETWORK_ERROR,
            'NETWORK_ERROR',
            '网络错误',
            undefined,
            true
          );
        }
        return Promise.resolve('success');
      });

      const result = await executor.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('应该在超过最大重试次数后抛出错误', async () => {
      const executor = new RetryExecutor(createDefaultRetryPolicy());

      const fn = vi.fn().mockRejectedValue(
        new APIErrorImpl(
          ErrorType.NETWORK_ERROR,
          'NETWORK_ERROR',
          '网络错误',
          undefined,
          true
        )
      );

      await expect(executor.execute(fn)).rejects.toThrow();

      // maxRetries=3, 所以会尝试4次(初始+3次重试)
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('应该在不可重试的错误时立即抛出', async () => {
      const executor = new RetryExecutor(createDefaultRetryPolicy());

      const fn = vi.fn().mockRejectedValue(
        new APIErrorImpl(
          ErrorType.BUSINESS_ERROR,
          'BUSINESS_ERROR',
          '业务错误',
          undefined,
          false
        )
      );

      await expect(executor.execute(fn)).rejects.toThrow();

      // 不应该重试
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('应该能更新重试策略', () => {
      const executor = new RetryExecutor(createDefaultRetryPolicy());

      const newPolicy = createNoRetryPolicy();
      executor.setPolicy(newPolicy);

      expect(executor.getPolicy()).toBe(newPolicy);
    });
  });
});
