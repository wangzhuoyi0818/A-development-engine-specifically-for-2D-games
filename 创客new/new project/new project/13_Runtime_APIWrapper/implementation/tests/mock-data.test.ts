/**
 * Mock数据管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockManagerImpl, loadDefaultMockData } from '../mock-data';
import { MockConfig, MockDataDefinition, RequestOptions } from '../types';

describe('MockManager', () => {
  let mockManager: MockManagerImpl;

  beforeEach(() => {
    mockManager = new MockManagerImpl({ enabled: true, logging: false });
  });

  describe('add & find', () => {
    it('应该能添加和查找Mock数据(字符串匹配)', () => {
      const mockData: MockDataDefinition = {
        success: { id: 1, name: 'test' },
      };

      mockManager.add('/api/test', mockData);

      const found = mockManager.find({ url: '/api/test' });

      expect(found).toEqual(mockData);
    });

    it('应该能使用正则表达式匹配', () => {
      const mockData: MockDataDefinition = {
        success: { data: 'matched' },
      };

      mockManager.add(/\/api\/user\/\d+/, mockData);

      const found = mockManager.find({ url: '/api/user/123' });

      expect(found).toEqual(mockData);
    });

    it('应该能使用自定义matcher', () => {
      const mockData: MockDataDefinition = {
        success: { data: 'custom' },
        matcher: (options: RequestOptions) => options.method === 'POST',
      };

      mockManager.add('/api/custom', mockData);

      const foundPost = mockManager.find({ url: '/api/custom', method: 'POST' });
      const foundGet = mockManager.find({ url: '/api/custom', method: 'GET' });

      expect(foundPost).toEqual(mockData);
      expect(foundGet).toBeNull();
    });

    it('当Mock未启用时应该返回null', () => {
      mockManager = new MockManagerImpl({ enabled: false });

      mockManager.add('/api/test', { success: {} });

      const found = mockManager.find({ url: '/api/test' });

      expect(found).toBeNull();
    });
  });

  describe('remove', () => {
    it('应该能移除Mock数据', () => {
      mockManager.add('/api/test', { success: {} });
      mockManager.remove('/api/test');

      const found = mockManager.find({ url: '/api/test' });

      expect(found).toBeNull();
    });
  });

  describe('clear', () => {
    it('应该能清空所有Mock数据', () => {
      mockManager.add('/api/test1', { success: {} });
      mockManager.add('/api/test2', { success: {} });

      mockManager.clear();

      expect(mockManager.find({ url: '/api/test1' })).toBeNull();
      expect(mockManager.find({ url: '/api/test2' })).toBeNull();
    });
  });

  describe('execute', () => {
    it('应该返回Mock数据', async () => {
      const mockData: MockDataDefinition = {
        success: { id: 1, name: 'test' },
      };

      mockManager.add('/api/test', mockData);

      const result = await mockManager.execute({ url: '/api/test' });

      expect(result.data).toEqual({ id: 1, name: 'test' });
      expect(result.statusCode).toBe(200);
    });

    it('应该模拟延迟', async () => {
      const mockData: MockDataDefinition = {
        success: { data: 'delayed' },
        delay: 100,
      };

      mockManager.add('/api/delay', mockData);

      const startTime = Date.now();
      await mockManager.execute({ url: '/api/delay' });
      const endTime = Date.now();

      // 允许5ms的误差范围
      expect(endTime - startTime).toBeGreaterThanOrEqual(95);
    });

    it('应该在找不到Mock数据时抛出错误', async () => {
      await expect(
        mockManager.execute({ url: '/api/notfound' })
      ).rejects.toThrow('未找到匹配的Mock数据');
    });
  });

  describe('config', () => {
    it('应该能更新配置', () => {
      mockManager.updateConfig({ delay: 500 });

      const config = mockManager.getConfig();

      expect(config.delay).toBe(500);
    });
  });

  describe('loadDefaultMockData', () => {
    it('应该能加载默认Mock数据', () => {
      loadDefaultMockData(mockManager);

      const userMock = mockManager.find({ url: '/api/user' });
      const productsMock = mockManager.find({ url: '/api/products' });

      expect(userMock).not.toBeNull();
      expect(productsMock).not.toBeNull();
    });
  });
});
