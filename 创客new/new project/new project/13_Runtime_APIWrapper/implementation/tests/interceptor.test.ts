/**
 * 拦截器测试
 */

import { describe, it, expect, vi } from 'vitest';
import {
  InterceptorChain,
  createCommonHeaderInterceptor,
  createTokenInterceptor,
  createTimestampInterceptor,
  createExtractDataInterceptor,
  createUserFriendlyErrorInterceptor,
} from '../interceptor';
import { RequestOptions, RequestResult } from '../types';
import { APIErrorImpl, ErrorType } from '../error-handler';

describe('Interceptor', () => {
  describe('InterceptorChain', () => {
    it('应该能添加请求拦截器', async () => {
      const chain = new InterceptorChain();

      const interceptor = vi.fn((options: RequestOptions) => {
        return { ...options, modified: true } as any;
      });

      chain.request.use(interceptor);

      const result = await chain.request.executeAll({ url: '/test' });

      expect(result).toHaveProperty('modified', true);
      expect(interceptor).toHaveBeenCalled();
    });

    it('应该能添加响应拦截器', async () => {
      const chain = new InterceptorChain();

      const interceptor = vi.fn((response: RequestResult) => {
        return { ...response, modified: true } as any;
      });

      chain.response.use(interceptor);

      const result = await chain.response.executeAll({
        data: {},
        statusCode: 200,
        header: {},
      });

      expect(result).toHaveProperty('modified', true);
      expect(interceptor).toHaveBeenCalled();
    });

    it('应该能移除拦截器', async () => {
      const chain = new InterceptorChain();

      const interceptor = vi.fn((options: RequestOptions) => options);

      const id = chain.request.use(interceptor);
      chain.request.eject(id);

      await chain.request.executeAll({ url: '/test' });

      expect(interceptor).not.toHaveBeenCalled();
    });

    it('应该能清空所有拦截器', () => {
      const chain = new InterceptorChain();

      chain.request.use((options) => options);
      chain.response.use((response) => response);

      chain.clearAll();

      expect(chain.request.getAll()).toHaveLength(0);
      expect(chain.response.getAll()).toHaveLength(0);
    });
  });

  describe('createCommonHeaderInterceptor', () => {
    it('应该添加公共请求头', () => {
      const interceptor = createCommonHeaderInterceptor({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });

      const result = interceptor({ url: '/test' });

      expect(result.header).toEqual({
        'Content-Type': 'application/json',
        'X-Custom': 'value',
      });
    });

    it('应该合并已有的请求头', () => {
      const interceptor = createCommonHeaderInterceptor({
        'Content-Type': 'application/json',
      });

      const result = interceptor({
        url: '/test',
        header: { 'X-Existing': 'value' },
      });

      expect(result.header).toEqual({
        'Content-Type': 'application/json',
        'X-Existing': 'value',
      });
    });
  });

  describe('createTokenInterceptor', () => {
    it('应该添加Authorization头', () => {
      const getToken = vi.fn(() => 'test-token');
      const interceptor = createTokenInterceptor(getToken);

      const result = interceptor({ url: '/test' });

      expect(result.header).toHaveProperty('Authorization', 'Bearer test-token');
      expect(getToken).toHaveBeenCalled();
    });

    it('当token为null时不添加Authorization头', () => {
      const getToken = vi.fn(() => null);
      const interceptor = createTokenInterceptor(getToken);

      const result = interceptor({ url: '/test' });

      expect(result.header).toBeUndefined();
    });
  });

  describe('createTimestampInterceptor', () => {
    it('应该添加时间戳到header', () => {
      const interceptor = createTimestampInterceptor();

      const result = interceptor({ url: '/test' });

      expect(result.header).toHaveProperty('X-Timestamp');
      expect(Number(result.header!['X-Timestamp'])).toBeGreaterThan(0);
    });
  });

  describe('createExtractDataInterceptor', () => {
    it('应该提取data字段', () => {
      const interceptor = createExtractDataInterceptor();

      const response: RequestResult = {
        statusCode: 200,
        header: {},
        data: {
          code: 0,
          data: { id: 1, name: 'test' },
          message: 'success',
        },
      };

      const result = interceptor(response);

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('当没有data字段时返回原始数据', () => {
      const interceptor = createExtractDataInterceptor();

      const response: RequestResult = {
        statusCode: 200,
        header: {},
        data: { id: 1, name: 'test' },
      };

      const result = interceptor(response);

      expect(result).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('createUserFriendlyErrorInterceptor', () => {
    it('应该转换错误消息为用户友好的消息', () => {
      const interceptor = createUserFriendlyErrorInterceptor();

      const error = new APIErrorImpl(
        ErrorType.NETWORK_ERROR,
        'NETWORK_ERROR',
        'Network failed',
        undefined,
        true
      );

      const result = interceptor(error);

      expect(result.message).toBe('网络连接失败,请检查网络设置');
    });

    it('应该使用自定义消息映射', () => {
      const interceptor = createUserFriendlyErrorInterceptor({
        CUSTOM_ERROR: '自定义错误消息',
      });

      const error = new APIErrorImpl(
        ErrorType.SYSTEM_ERROR,
        'CUSTOM_ERROR',
        'Custom error',
        undefined,
        false
      );

      const result = interceptor(error);

      expect(result.message).toBe('自定义错误消息');
    });
  });
});
