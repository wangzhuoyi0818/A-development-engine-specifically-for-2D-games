/**
 * API包装器核心功能测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIWrapper, createAPIWrapper } from '../api-wrapper';
import { ErrorType } from '../types';
import { APIErrorImpl } from '../error-handler';

// Mock wx对象
const mockWx = {
  request: vi.fn(),
  uploadFile: vi.fn(),
  downloadFile: vi.fn(),
};

global.wx = mockWx as any;

describe('APIWrapper', () => {
  let wrapper: APIWrapper;

  beforeEach(() => {
    wrapper = createAPIWrapper({
      timeout: 5000,
      enableCache: true,
      defaultCacheTTL: 1000,
      enableLogging: false,
    });

    // 重置所有mock
    vi.clearAllMocks();
  });

  describe('request', () => {
    it('应该成功发起GET请求', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { message: 'success' },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await wrapper.request({
        url: '/api/test',
        method: 'GET',
      });

      expect(result).toEqual({ message: 'success' });
      expect(mockWx.request).toHaveBeenCalledTimes(1);
    });

    it('应该成功发起POST请求', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { id: 1, name: 'test' },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await wrapper.request({
        url: '/api/create',
        method: 'POST',
        data: { name: 'test' },
      });

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('应该处理HTTP错误(404)', async () => {
      const mockResponse = {
        statusCode: 404,
        data: { message: 'Not Found' },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      await expect(
        wrapper.request({ url: '/api/notfound' })
      ).rejects.toThrow();
    });

    it('应该处理网络错误', async () => {
      mockWx.request.mockImplementation((options: any) => {
        options.fail({ errMsg: 'request:fail timeout' });
      });

      await expect(
        wrapper.request({ url: '/api/timeout' })
      ).rejects.toMatchObject({
        type: ErrorType.TIMEOUT,
      });
    });
  });

  describe('cache', () => {
    let cacheWrapper: APIWrapper;

    beforeEach(() => {
      // Create fresh mocks for cache tests
      mockWx.request.mockClear();
      mockWx.uploadFile.mockClear();
      mockWx.downloadFile.mockClear();

      cacheWrapper = createAPIWrapper({
        timeout: 5000,
        enableCache: true,
        defaultCacheTTL: 1000,
        enableLogging: false,
      });
    });

    it('应该缓存GET请求结果', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { cached: true },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      // 第一次请求
      await cacheWrapper.request({
        url: '/api/cache-test',
        enableCache: true,
        cacheTTL: 5000,
      });

      // 第二次请求(应该从缓存读取)
      await cacheWrapper.request({
        url: '/api/cache-test',
        enableCache: true,
        cacheTTL: 5000,
      });

      // 只应该调用一次wx.request
      expect(mockWx.request).toHaveBeenCalledTimes(1);
    });

    it('应该在缓存过期后重新请求', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { expired: true },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      // 第一次请求
      await cacheWrapper.request({
        url: '/api/expire-test',
        enableCache: true,
        cacheTTL: 10, // 10ms
      });

      // 等待缓存过期
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 第二次请求(缓存已过期)
      await cacheWrapper.request({
        url: '/api/expire-test',
        enableCache: true,
        cacheTTL: 10,
      });

      // 应该调用两次wx.request
      expect(mockWx.request).toHaveBeenCalledTimes(2);
    });

    it('应该能清空缓存', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { clear: true },
        header: {},
      };

      mockWx.request.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      // 第一次请求
      await cacheWrapper.request({
        url: '/api/clear-test',
        enableCache: true,
        cacheTTL: 5000,
      });

      // 清空缓存
      cacheWrapper.clearCache();

      // 第二次请求(缓存已清空)
      await cacheWrapper.request({
        url: '/api/clear-test',
        enableCache: true,
        cacheTTL: 5000,
      });

      // 应该调用两次wx.request
      expect(mockWx.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('uploadFile', () => {
    it('应该成功上传文件', async () => {
      const mockResponse = {
        statusCode: 200,
        data: 'success',
      };

      mockWx.uploadFile.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await wrapper.uploadFile({
        url: '/api/upload',
        filePath: '/tmp/test.jpg',
        name: 'file',
      });

      expect(result).toEqual(mockResponse);
      expect(mockWx.uploadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('downloadFile', () => {
    it('应该成功下载文件', async () => {
      const mockResponse = {
        statusCode: 200,
        tempFilePath: '/tmp/download.jpg',
      };

      mockWx.downloadFile.mockImplementation((options: any) => {
        options.success(mockResponse);
      });

      const result = await wrapper.downloadFile({
        url: '/api/download/file.jpg',
      });

      expect(result).toEqual(mockResponse);
      expect(mockWx.downloadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('config', () => {
    it('应该能获取配置', () => {
      const config = wrapper.getConfig();

      expect(config.timeout).toBe(5000);
      expect(config.enableCache).toBe(true);
    });

    it('应该能更新配置', () => {
      wrapper.updateConfig({ timeout: 10000 });

      const config = wrapper.getConfig();
      expect(config.timeout).toBe(10000);
    });
  });
});
