/**
 * 性能监控器测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../performance-monitor';
import type { PerformanceConfig, PerformanceMetrics } from '../types';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let config: PerformanceConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      sampleRate: 1,
      collectInterval: 100,
      thresholds: {
        pageLoad: 3000,
        setDataDuration: 50,
        setDataSize: 1048576,
        fps: 30,
        memoryUsage: 0.8,
      },
    };
    monitor = new PerformanceMonitor(config);
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('构造函数', () => {
    it('应该使用配置创建实例', () => {
      expect(monitor).toBeDefined();
    });

    it('应该合并默认配置', () => {
      const pm = new PerformanceMonitor({});
      expect(pm).toBeDefined();
    });
  });

  describe('start', () => {
    it('应该能够开始监控', () => {
      monitor.start();
      expect((monitor as any).isMonitoring).toBe(true);
    });

    it('应该触发started事件', () => {
      const started = vi.fn();
      monitor.on('started', started);

      monitor.start();

      expect(started).toHaveBeenCalledOnce();
    });

    it('重复启动应该被忽略', () => {
      monitor.start();
      monitor.start();

      expect((monitor as any).isMonitoring).toBe(true);
    });

    it('禁用时不应该启动', () => {
      const pm = new PerformanceMonitor({ enabled: false });
      pm.start();

      expect((pm as any).isMonitoring).toBe(false);
    });

    it('启动后应该定时采集数据', (done) => {
      const metricsHandler = vi.fn();
      monitor.on('metrics', metricsHandler);

      monitor.start();

      setTimeout(() => {
        expect(metricsHandler).toHaveBeenCalled();
        done();
      }, config.collectInterval! + 50);
    });
  });

  describe('stop', () => {
    beforeEach(() => {
      monitor.start();
    });

    it('应该能够停止监控', () => {
      monitor.stop();
      expect((monitor as any).isMonitoring).toBe(false);
    });

    it('应该触发stopped事件', () => {
      const stopped = vi.fn();
      monitor.on('stopped', stopped);

      monitor.stop();

      expect(stopped).toHaveBeenCalledOnce();
    });

    it('应该清除定时器', () => {
      const timer = (monitor as any).collectTimer;
      expect(timer).not.toBeNull();

      monitor.stop();

      expect((monitor as any).collectTimer).toBeNull();
    });

    it('应该清除缓存数据', () => {
      monitor.recordSetData(10, 1000);
      monitor.stop();

      expect((monitor as any).setDataCalls).toEqual([]);
    });
  });

  describe('recordSetData', () => {
    it('应该能够记录setData调用', () => {
      monitor.recordSetData(10, 1000);

      expect((monitor as any).setDataCalls).toHaveLength(1);
      expect((monitor as any).setDataCalls[0]).toMatchObject({
        duration: 10,
        size: 1000,
      });
    });

    it('应该限制记录数量', () => {
      // 记录超过100次
      for (let i = 0; i < 150; i++) {
        monitor.recordSetData(10, 1000);
      }

      expect((monitor as any).setDataCalls.length).toBeLessThanOrEqual(100);
    });

    it('应该保留最近的记录', () => {
      for (let i = 0; i < 150; i++) {
        monitor.recordSetData(i, 1000);
      }

      const calls = (monitor as any).setDataCalls;
      // 最早的记录应该被移除
      expect(calls[0].duration).toBeGreaterThan(40);
    });
  });

  describe('recordFrame', () => {
    it('应该能够记录帧时间戳', () => {
      monitor.recordFrame(1000);

      expect((monitor as any).frameTimestamps).toContain(1000);
    });

    it('应该限制记录数量', () => {
      for (let i = 0; i < 100; i++) {
        monitor.recordFrame(i * 16.67);
      }

      expect((monitor as any).frameTimestamps.length).toBeLessThanOrEqual(60);
    });
  });

  describe('recordNetworkRequest', () => {
    it('应该能够记录网络请求', () => {
      monitor.recordNetworkRequest(1000, 1500, 5000);

      expect((monitor as any).networkRequests).toHaveLength(1);
      expect((monitor as any).networkRequests[0]).toMatchObject({
        startTime: 1000,
        endTime: 1500,
        size: 5000,
      });
    });

    it('应该限制记录数量', () => {
      for (let i = 0; i < 100; i++) {
        monitor.recordNetworkRequest(i, i + 100, 1000);
      }

      expect((monitor as any).networkRequests.length).toBeLessThanOrEqual(50);
    });
  });

  describe('collect', () => {
    beforeEach(() => {
      monitor.start();
    });

    it('应该能够采集性能指标', () => {
      const metricsHandler = vi.fn();
      monitor.on('metrics', metricsHandler);

      monitor.collect();

      expect(metricsHandler).toHaveBeenCalled();
      const metrics = metricsHandler.mock.calls[0][0] as PerformanceMetrics;
      expect(metrics.pageLoad).toBeDefined();
      expect(metrics.setData).toBeDefined();
      expect(metrics.rendering).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.network).toBeDefined();
    });

    it('应该遵守采样率', () => {
      const pm = new PerformanceMonitor({ ...config, sampleRate: 0 });
      pm.start();

      const metricsHandler = vi.fn();
      pm.on('metrics', metricsHandler);

      // 多次采集,采样率为0应该不触发
      for (let i = 0; i < 10; i++) {
        pm.collect();
      }

      expect(metricsHandler).not.toHaveBeenCalled();
    });

    it('应该能够处理外部提供的数据', () => {
      monitor.collect({
        type: 'setdata',
        duration: 20,
        size: 500,
      });

      expect((monitor as any).setDataCalls).toHaveLength(1);
    });
  });

  describe('setData指标采集', () => {
    beforeEach(() => {
      monitor.start();
    });

    it('无数据时应该返回默认指标', () => {
      const metrics = (monitor as any).collectSetDataMetrics();

      expect(metrics.count).toBe(0);
      expect(metrics.avgDuration).toBe(0);
      expect(metrics.maxDuration).toBe(0);
      expect(metrics.totalDataSize).toBe(0);
    });

    it('应该正确计算平均耗时', () => {
      monitor.recordSetData(10, 1000);
      monitor.recordSetData(20, 2000);
      monitor.recordSetData(30, 3000);

      const metrics = (monitor as any).collectSetDataMetrics();

      expect(metrics.count).toBe(3);
      expect(metrics.avgDuration).toBe(20);
    });

    it('应该正确计算最大耗时', () => {
      monitor.recordSetData(10, 1000);
      monitor.recordSetData(50, 2000);
      monitor.recordSetData(30, 3000);

      const metrics = (monitor as any).collectSetDataMetrics();

      expect(metrics.maxDuration).toBe(50);
    });

    it('应该正确计算总数据大小', () => {
      monitor.recordSetData(10, 1000);
      monitor.recordSetData(20, 2000);
      monitor.recordSetData(30, 3000);

      const metrics = (monitor as any).collectSetDataMetrics();

      expect(metrics.totalDataSize).toBe(6000);
    });
  });

  describe('渲染指标采集', () => {
    beforeEach(() => {
      monitor.start();
    });

    it('数据不足时应该返回默认指标', () => {
      const metrics = (monitor as any).collectRenderingMetrics();

      expect(metrics.fps).toBe(60);
      expect(metrics.frameDrops).toBe(0);
    });

    it('应该正确计算FPS', () => {
      // 模拟60fps
      for (let i = 0; i < 10; i++) {
        monitor.recordFrame(i * 16.67);
      }

      const metrics = (monitor as any).collectRenderingMetrics();

      expect(metrics.fps).toBeCloseTo(60, 0);
    });

    it('应该正确计算丢帧数', () => {
      // 正常帧
      monitor.recordFrame(0);
      monitor.recordFrame(16);
      // 丢帧(超过33ms)
      monitor.recordFrame(50);
      monitor.recordFrame(66);

      const metrics = (monitor as any).collectRenderingMetrics();

      expect(metrics.frameDrops).toBeGreaterThan(0);
    });
  });

  describe('网络指标采集', () => {
    beforeEach(() => {
      monitor.start();
    });

    it('无数据时应该返回默认指标', () => {
      const metrics = (monitor as any).collectNetworkMetrics();

      expect(metrics.requestCount).toBe(0);
      expect(metrics.totalSize).toBe(0);
      expect(metrics.avgLatency).toBe(0);
    });

    it('应该正确计算请求总数', () => {
      monitor.recordNetworkRequest(0, 100, 1000);
      monitor.recordNetworkRequest(100, 200, 2000);
      monitor.recordNetworkRequest(200, 300, 3000);

      const metrics = (monitor as any).collectNetworkMetrics();

      expect(metrics.requestCount).toBe(3);
    });

    it('应该正确计算平均延迟', () => {
      monitor.recordNetworkRequest(0, 100, 1000);
      monitor.recordNetworkRequest(0, 200, 2000);
      monitor.recordNetworkRequest(0, 300, 3000);

      const metrics = (monitor as any).collectNetworkMetrics();

      expect(metrics.avgLatency).toBe(200);
    });

    it('应该正确计算总传输大小', () => {
      monitor.recordNetworkRequest(0, 100, 1000);
      monitor.recordNetworkRequest(0, 100, 2000);
      monitor.recordNetworkRequest(0, 100, 3000);

      const metrics = (monitor as any).collectNetworkMetrics();

      expect(metrics.totalSize).toBe(6000);
    });
  });

  describe('阈值检查', () => {
    beforeEach(() => {
      monitor.start();
    });

    it('超过阈值应该生成警告', () => {
      const warningHandler = vi.fn();
      monitor.on('warning', warningHandler);

      // 记录超过阈值的setData调用
      monitor.recordSetData(100, 1000); // 超过50ms阈值

      monitor.collect();

      expect(warningHandler).toHaveBeenCalled();
    });

    it('警告应该包含完整信息', () => {
      const warningHandler = vi.fn();
      monitor.on('warning', warningHandler);

      monitor.recordSetData(100, 1000);
      monitor.collect();

      const warning = warningHandler.mock.calls[0][0];
      expect(warning.type).toBeDefined();
      expect(warning.message).toBeDefined();
      expect(warning.value).toBeDefined();
      expect(warning.threshold).toBeDefined();
      expect(warning.suggestion).toBeDefined();
    });

    it('未超过阈值不应该生成警告', () => {
      const warningHandler = vi.fn();
      monitor.on('warning', warningHandler);

      // 记录正常的setData调用
      monitor.recordSetData(10, 100);

      monitor.collect();

      // 可能有其他警告,但不应该有setData的警告
      const calls = warningHandler.mock.calls;
      const setDataWarning = calls.find(
        (call) => call[0]?.type === 'setdata-duration'
      );
      expect(setDataWarning).toBeUndefined();
    });
  });

  describe('事件监听', () => {
    it('应该能够添加事件监听器', () => {
      const listener = vi.fn();
      monitor.on('metrics', listener);

      monitor.start();
      monitor.collect();

      expect(listener).toHaveBeenCalled();
    });

    it('应该能够移除事件监听器', () => {
      const listener = vi.fn();
      monitor.on('metrics', listener);
      monitor.off('metrics', listener);

      monitor.start();
      monitor.collect();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('数据清理', () => {
    it('停止时应该清除所有缓存数据', () => {
      monitor.recordSetData(10, 1000);
      monitor.recordFrame(1000);
      monitor.recordNetworkRequest(0, 100, 1000);

      monitor.stop();

      expect((monitor as any).setDataCalls).toEqual([]);
      expect((monitor as any).frameTimestamps).toEqual([]);
      expect((monitor as any).networkRequests).toEqual([]);
    });
  });

  describe('采集间隔', () => {
    it('应该遵守配置的采集间隔', (done) => {
      const metricsHandler = vi.fn();
      monitor.on('metrics', metricsHandler);

      monitor.start();

      const interval = config.collectInterval!;

      setTimeout(() => {
        const callCount = metricsHandler.mock.calls.length;
        // 应该调用约2次
        expect(callCount).toBeGreaterThanOrEqual(1);
        expect(callCount).toBeLessThanOrEqual(3);
        done();
      }, interval * 2 + 50);
    });
  });
});
