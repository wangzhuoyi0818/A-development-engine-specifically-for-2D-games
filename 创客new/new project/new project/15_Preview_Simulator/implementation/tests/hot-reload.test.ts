/**
 * 热重载测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HotReload } from '../hot-reload';
import type { MiniProgramProject, HotReloadConfig } from '../types';

// Mock项目
const mockProject: MiniProgramProject = {
  id: 'test-project',
  name: '测试项目',
  version: '1.0.0',
  appId: 'wx1234567890',
  config: { window: {} },
  pages: [
    {
      id: 'page-1',
      name: '首页',
      path: 'pages/index/index',
      config: {},
      components: [],
      data: {},
      variables: [],
      lifecycleEvents: [],
      customEvents: [],
    },
  ],
  globalComponents: [],
  resources: [],
  globalVariables: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('HotReload', () => {
  let hotReload: HotReload;
  let config: HotReloadConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      batchDelay: 100,
      showNotifications: false,
    };
    hotReload = new HotReload(config, mockProject);
  });

  afterEach(async () => {
    await hotReload.stop();
  });

  describe('构造函数', () => {
    it('应该使用配置创建实例', () => {
      expect(hotReload).toBeDefined();
    });

    it('应该合并默认配置', () => {
      const hr = new HotReload({}, mockProject);
      expect(hr).toBeDefined();
    });
  });

  describe('start', () => {
    it('应该能够启动文件监听', async () => {
      await hotReload.start();
      expect((hotReload as any).isWatching).toBe(true);
    });

    it('应该触发started事件', async () => {
      const started = vi.fn();
      hotReload.on('started', started);

      await hotReload.start();

      expect(started).toHaveBeenCalledOnce();
    });

    it('重复启动应该被忽略', async () => {
      await hotReload.start();
      await hotReload.start();

      expect((hotReload as any).isWatching).toBe(true);
    });

    it('禁用时不应该启动', async () => {
      const hr = new HotReload({ enabled: false }, mockProject);
      await hr.start();

      expect((hr as any).isWatching).toBe(false);
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      await hotReload.start();
    });

    it('应该能够停止文件监听', async () => {
      await hotReload.stop();
      expect((hotReload as any).isWatching).toBe(false);
    });

    it('应该触发stopped事件', async () => {
      const stopped = vi.fn();
      hotReload.on('stopped', stopped);

      await hotReload.stop();

      expect(stopped).toHaveBeenCalledOnce();
    });

    it('应该清除变更队列', async () => {
      (hotReload as any).changeQueue = ['file1.ts', 'file2.ts'];

      await hotReload.stop();

      expect((hotReload as any).changeQueue).toEqual([]);
    });

    it('未启动时停止应该被忽略', async () => {
      const hr = new HotReload(config, mockProject);

      await expect(hr.stop()).resolves.not.toThrow();
    });
  });

  describe('triggerUpdate', () => {
    beforeEach(async () => {
      await hotReload.start();
    });

    it('应该能够手动触发更新', () => {
      const updateHandler = vi.fn();
      hotReload.on('update', updateHandler);

      hotReload.triggerUpdate(['pages/index/index.ts']);

      // 由于是手动触发,应该立即处理
      expect(updateHandler).toHaveBeenCalled();
    });

    it('应该处理多个文件', () => {
      const updateHandler = vi.fn();
      hotReload.on('update', updateHandler);

      hotReload.triggerUpdate([
        'pages/index/index.ts',
        'pages/home/home.ts',
      ]);

      expect(updateHandler).toHaveBeenCalled();
    });
  });

  describe('更新类型判断', () => {
    it('应该正确识别WXML更新', () => {
      const type = (hotReload as any).determineUpdateType(
        'pages/index/index.wxml'
      );
      expect(type).toBe('wxml');
    });

    it('应该正确识别WXSS更新', () => {
      const type = (hotReload as any).determineUpdateType(
        'pages/index/index.wxss'
      );
      expect(type).toBe('wxss');
    });

    it('应该正确识别JS更新', () => {
      const type = (hotReload as any).determineUpdateType(
        'pages/index/index.js'
      );
      expect(type).toBe('js');
    });

    it('应该正确识别TS更新', () => {
      const type = (hotReload as any).determineUpdateType(
        'pages/index/index.ts'
      );
      expect(type).toBe('js');
    });

    it('应该正确识别配置更新', () => {
      const type = (hotReload as any).determineUpdateType(
        'pages/index/index.json'
      );
      expect(type).toBe('config');
    });
  });

  describe('目标查找', () => {
    it('应该能够找到匹配的页面', () => {
      const target = (hotReload as any).findTarget(
        'pages/index/index.ts'
      );
      expect(target).toBe('pages/index/index');
    });

    it('找不到匹配页面时应该返回null', () => {
      const target = (hotReload as any).findTarget(
        'unknown/path/file.ts'
      );
      expect(target).toBeNull();
    });
  });

  describe('批处理', () => {
    beforeEach(async () => {
      await hotReload.start();
    });

    it('应该批量处理短时间内的多次变更', (done) => {
      const updateHandler = vi.fn();
      hotReload.on('update', updateHandler);

      // 模拟快速连续的文件变更
      (hotReload as any).handleFileChange('change', 'file1.ts');
      (hotReload as any).handleFileChange('change', 'file2.ts');
      (hotReload as any).handleFileChange('change', 'file3.ts');

      // 等待批处理延迟
      setTimeout(() => {
        // 应该合并处理
        expect((hotReload as any).changeQueue.length).toBe(0);
        done();
      }, config.batchDelay! + 50);
    });

    it('应该遵守配置的批处理延迟', (done) => {
      const updateHandler = vi.fn();
      hotReload.on('update', updateHandler);

      (hotReload as any).handleFileChange('change', 'file.ts');

      // 在延迟之前不应该处理
      setTimeout(() => {
        expect(updateHandler).not.toHaveBeenCalled();
      }, config.batchDelay! - 50);

      // 在延迟之后应该处理
      setTimeout(() => {
        expect(updateHandler).toHaveBeenCalled();
        done();
      }, config.batchDelay! + 50);
    });
  });

  describe('更新消息生成', () => {
    it('应该生成正确的更新消息', () => {
      const message = (hotReload as any).generateUpdate(
        'js',
        'pages/index/index'
      );

      expect(message).toBeDefined();
      expect(message.type).toBe('update');
      expect(message.updateType).toBe('js');
      expect(message.target).toBe('pages/index/index');
      expect(message.timestamp).toBeDefined();
    });

    it('生成失败时应该返回错误消息', () => {
      const message = (hotReload as any).generateUpdate('js', null);

      expect(message).toBeDefined();
      expect(message.type).toBe('error');
      expect(message.error).toBeDefined();
    });
  });

  describe('事件监听', () => {
    it('应该能够添加事件监听器', () => {
      const listener = vi.fn();
      hotReload.on('update', listener);

      expect((hotReload as any).eventListeners.has('update')).toBe(true);
    });

    it('应该能够移除事件监听器', () => {
      const listener = vi.fn();
      hotReload.on('update', listener);
      hotReload.off('update', listener);

      hotReload.triggerUpdate(['test.ts']);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该捕获代码生成错误', () => {
      const updateHandler = vi.fn();
      hotReload.on('update', updateHandler);

      // 触发一个会导致错误的更新
      hotReload.triggerUpdate(['invalid/path/file.ts']);

      // 应该收到错误消息
      const calls = updateHandler.mock.calls;
      const errorMessage = calls.find(
        (call) => call[0]?.type === 'error'
      );
      expect(errorMessage).toBeDefined();
    });

    it('事件监听器错误不应该影响其他监听器', () => {
      const errorListener = vi.fn(() => {
        throw new Error('监听器错误');
      });
      const normalListener = vi.fn();

      hotReload.on('test', errorListener);
      hotReload.on('test', normalListener);

      (hotReload as any).emit('test');

      expect(normalListener).toHaveBeenCalled();
    });
  });
});
