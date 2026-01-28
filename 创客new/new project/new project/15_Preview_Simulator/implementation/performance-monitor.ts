/**
 * 性能监控器 - 收集和分析性能数据
 *
 * 职责:
 * - 收集性能指标
 * - 分析性能瓶颈
 * - 生成性能警告
 */

import type {
  PerformanceConfig,
  PerformanceMetrics,
  PageLoadMetrics,
  SetDataMetrics,
  RenderingMetrics,
  MemoryMetrics,
  NetworkMetrics,
  PerformanceWarning,
  PerformanceThresholds,
} from './types';

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private collectTimer: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  // 性能数据缓存
  private setDataCalls: Array<{ timestamp: number; duration: number; size: number }> = [];
  private frameTimestamps: number[] = [];
  private networkRequests: Array<{ startTime: number; endTime: number; size: number }> = [];

  /**
   * 构造函数
   */
  constructor(config: PerformanceConfig) {
    this.config = {
      enabled: true,
      sampleRate: 1,
      collectInterval: 1000,
      thresholds: {
        pageLoad: 3000,
        setDataDuration: 50,
        setDataSize: 1048576,
        fps: 30,
        memoryUsage: 0.8,
      },
      ...config,
    };
  }

  /**
   * 开始监控
   */
  start(): void {
    if (!this.config.enabled || this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // 定时采集性能数据
    this.collectTimer = setInterval(() => {
      this.collect();
    }, this.config.collectInterval);

    this.emit('started');
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = null;
    }

    this.isMonitoring = false;
    this.clearData();
    this.emit('stopped');
  }

  /**
   * 采集性能数据
   */
  collect(data?: any): void {
    if (!this.isMonitoring) {
      return;
    }

    // 采样判断
    if (Math.random() > (this.config.sampleRate || 1)) {
      return;
    }

    // 如果提供了数据,直接处理
    if (data) {
      this.processCollectedData(data);
      return;
    }

    // 收集各项指标
    const metrics: PerformanceMetrics = {
      pageLoad: this.collectPageLoadMetrics(),
      setData: this.collectSetDataMetrics(),
      rendering: this.collectRenderingMetrics(),
      memory: this.collectMemoryMetrics(),
      network: this.collectNetworkMetrics(),
      timestamp: Date.now(),
    };

    // 检查阈值并生成警告
    const warnings = this.checkThresholds(metrics);
    warnings.forEach((warning) => {
      this.emit('warning', warning);
    });

    // 触发metrics事件
    this.emit('metrics', metrics);
  }

  /**
   * 记录setData调用
   */
  recordSetData(duration: number, dataSize: number): void {
    this.setDataCalls.push({
      timestamp: Date.now(),
      duration,
      size: dataSize,
    });

    // 只保留最近100次调用
    if (this.setDataCalls.length > 100) {
      this.setDataCalls.shift();
    }
  }

  /**
   * 记录帧渲染
   */
  recordFrame(timestamp: number): void {
    this.frameTimestamps.push(timestamp);

    // 只保留最近60帧
    if (this.frameTimestamps.length > 60) {
      this.frameTimestamps.shift();
    }
  }

  /**
   * 记录网络请求
   */
  recordNetworkRequest(startTime: number, endTime: number, size: number): void {
    this.networkRequests.push({ startTime, endTime, size });

    // 只保留最近50次请求
    if (this.networkRequests.length > 50) {
      this.networkRequests.shift();
    }
  }

  /**
   * 添加事件监听器
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 收集页面加载指标
   */
  private collectPageLoadMetrics(): PageLoadMetrics {
    // 模拟实现,实际应该从performance API获取
    return {
      duration: 1500,
      firstPaint: 500,
      domReady: 1000,
      resourceLoad: 1200,
    };
  }

  /**
   * 收集setData指标
   */
  private collectSetDataMetrics(): SetDataMetrics {
    if (this.setDataCalls.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        maxDuration: 0,
        dataSizes: [],
        totalDataSize: 0,
      };
    }

    const durations = this.setDataCalls.map((call) => call.duration);
    const sizes = this.setDataCalls.map((call) => call.size);

    return {
      count: this.setDataCalls.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      dataSizes: sizes,
      totalDataSize: sizes.reduce((a, b) => a + b, 0),
    };
  }

  /**
   * 收集渲染指标
   */
  private collectRenderingMetrics(): RenderingMetrics {
    if (this.frameTimestamps.length < 2) {
      return {
        fps: 60,
        frameDrops: 0,
        avgFrameTime: 16.67,
      };
    }

    // 计算FPS
    const frameTimes: number[] = [];
    for (let i = 1; i < this.frameTimestamps.length; i++) {
      frameTimes.push(this.frameTimestamps[i] - this.frameTimestamps[i - 1]);
    }

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    const fps = 1000 / avgFrameTime;

    // 计算丢帧数(超过33ms视为丢帧)
    const frameDrops = frameTimes.filter((t) => t > 33).length;

    return {
      fps: Math.round(fps),
      frameDrops,
      avgFrameTime: Math.round(avgFrameTime * 100) / 100,
    };
  }

  /**
   * 收集内存指标
   */
  private collectMemoryMetrics(): MemoryMetrics {
    // 模拟实现,实际应该从performance.memory获取
    const used = 50 * 1024 * 1024; // 50MB
    const limit = 200 * 1024 * 1024; // 200MB

    return {
      used,
      limit,
      usage: used / limit,
    };
  }

  /**
   * 收集网络指标
   */
  private collectNetworkMetrics(): NetworkMetrics {
    if (this.networkRequests.length === 0) {
      return {
        requestCount: 0,
        totalSize: 0,
        avgLatency: 0,
        failedRequests: 0,
      };
    }

    const latencies = this.networkRequests.map(
      (req) => req.endTime - req.startTime
    );
    const sizes = this.networkRequests.map((req) => req.size);

    return {
      requestCount: this.networkRequests.length,
      totalSize: sizes.reduce((a, b) => a + b, 0),
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      failedRequests: 0, // 需要从实际数据统计
    };
  }

  /**
   * 检查阈值
   */
  private checkThresholds(metrics: PerformanceMetrics): PerformanceWarning[] {
    const warnings: PerformanceWarning[] = [];
    const thresholds = this.config.thresholds || {};

    // 检查页面加载时间
    if (
      thresholds.pageLoad &&
      metrics.pageLoad.duration > thresholds.pageLoad
    ) {
      warnings.push({
        type: 'page-load',
        message: '页面加载时间过长',
        value: metrics.pageLoad.duration,
        threshold: thresholds.pageLoad,
        suggestion: '优化资源加载,减少首屏渲染时间',
      });
    }

    // 检查setData性能
    if (
      thresholds.setDataDuration &&
      metrics.setData.maxDuration > thresholds.setDataDuration
    ) {
      warnings.push({
        type: 'setdata-duration',
        message: 'setData调用耗时过长',
        value: metrics.setData.maxDuration,
        threshold: thresholds.setDataDuration,
        suggestion: '减少setData数据量,避免频繁调用',
      });
    }

    // 检查setData数据大小
    if (
      thresholds.setDataSize &&
      metrics.setData.totalDataSize > thresholds.setDataSize
    ) {
      warnings.push({
        type: 'setdata-size',
        message: 'setData数据量过大',
        value: metrics.setData.totalDataSize,
        threshold: thresholds.setDataSize,
        suggestion: '分批更新数据,避免一次性传输过多数据',
      });
    }

    // 检查帧率
    if (thresholds.fps && metrics.rendering.fps < thresholds.fps) {
      warnings.push({
        type: 'fps',
        message: '渲染帧率过低',
        value: metrics.rendering.fps,
        threshold: thresholds.fps,
        suggestion: '优化渲染性能,减少复杂计算',
      });
    }

    // 检查内存使用
    if (
      thresholds.memoryUsage &&
      metrics.memory.usage > thresholds.memoryUsage
    ) {
      warnings.push({
        type: 'memory',
        message: '内存使用率过高',
        value: metrics.memory.usage,
        threshold: thresholds.memoryUsage,
        suggestion: '检查内存泄漏,及时释放不用的资源',
      });
    }

    return warnings;
  }

  /**
   * 处理收集的数据
   */
  private processCollectedData(data: any): void {
    // 根据数据类型进行处理
    if (data.type === 'setdata') {
      this.recordSetData(data.duration, data.size);
    } else if (data.type === 'frame') {
      this.recordFrame(data.timestamp);
    } else if (data.type === 'network') {
      this.recordNetworkRequest(data.startTime, data.endTime, data.size);
    }
  }

  /**
   * 清除数据
   */
  private clearData(): void {
    this.setDataCalls = [];
    this.frameTimestamps = [];
    this.networkRequests = [];
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`事件监听器错误 [${event}]:`, error);
        }
      });
    }
  }
}
