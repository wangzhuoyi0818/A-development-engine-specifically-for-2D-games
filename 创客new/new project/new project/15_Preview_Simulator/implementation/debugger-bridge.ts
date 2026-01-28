/**
 * 调试器桥接 - 连接调试器和捕获调试信息
 *
 * 职责:
 * - 捕获console输出
 * - 捕获错误信息
 * - 捕获网络请求
 * - 转发调试信息
 */

import type {
  DebuggerConfig,
  DebugEvent,
  DebugEventType,
  ConsoleEventData,
  NetworkEventData,
} from './types';

/**
 * 调试器桥接类
 */
export class DebuggerBridge {
  private config: DebuggerConfig;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private networkRequests: Map<string, NetworkEventData> = new Map();
  private isCapturing = false;

  /**
   * 构造函数
   */
  constructor(config: DebuggerConfig) {
    this.config = {
      enabled: true,
      captureConsole: true,
      captureErrors: true,
      captureNetwork: true,
      capturePerformance: true,
      ...config,
    };
  }

  /**
   * 开始捕获
   */
  start(): void {
    if (!this.config.enabled || this.isCapturing) {
      return;
    }

    this.isCapturing = true;
    this.emit('started');
  }

  /**
   * 停止捕获
   */
  stop(): void {
    if (!this.isCapturing) {
      return;
    }

    this.isCapturing = false;
    this.networkRequests.clear();
    this.emit('stopped');
  }

  /**
   * 处理调试事件
   */
  handleEvent(event: DebugEvent): void {
    if (!this.isCapturing) {
      return;
    }

    switch (event.type) {
      case 'console':
        if (this.config.captureConsole) {
          this.handleConsoleEvent(event);
        }
        break;

      case 'error':
        if (this.config.captureErrors) {
          this.handleErrorEvent(event);
        }
        break;

      case 'network':
        if (this.config.captureNetwork) {
          this.handleNetworkEvent(event);
        }
        break;

      case 'performance':
        if (this.config.capturePerformance) {
          this.handlePerformanceEvent(event);
        }
        break;

      default:
        this.emit('event', event);
    }
  }

  /**
   * 记录console日志
   */
  log(level: 'log' | 'info' | 'warn' | 'error', ...args: any[]): void {
    const event: DebugEvent = {
      type: 'console',
      level,
      timestamp: Date.now(),
      data: { args } as ConsoleEventData,
    };

    this.handleEvent(event);
  }

  /**
   * 记录网络请求
   */
  logNetworkRequest(
    id: string,
    method: string,
    url: string,
    options?: any
  ): void {
    const request: NetworkEventData = {
      id,
      method,
      url,
      headers: options?.headers,
      data: options?.data,
      startTime: Date.now(),
    };

    this.networkRequests.set(id, request);

    const event: DebugEvent = {
      type: 'network',
      timestamp: Date.now(),
      data: request,
    };

    this.handleEvent(event);
  }

  /**
   * 记录网络响应
   */
  logNetworkResponse(
    id: string,
    statusCode: number,
    response: any,
    error?: string
  ): void {
    const request = this.networkRequests.get(id);
    if (request) {
      request.statusCode = statusCode;
      request.response = response;
      request.endTime = Date.now();
      request.error = error;

      const event: DebugEvent = {
        type: 'network',
        timestamp: Date.now(),
        data: request,
      };

      this.handleEvent(event);
      this.networkRequests.delete(id);
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
   * 处理console事件
   */
  private handleConsoleEvent(event: DebugEvent): void {
    // 格式化console输出
    const formatted = this.formatConsoleEvent(event);
    this.emit('console', formatted);
    this.emit('event', event);
  }

  /**
   * 处理错误事件
   */
  private handleErrorEvent(event: DebugEvent): void {
    // 解析错误堆栈
    const formatted = this.formatErrorEvent(event);
    this.emit('error', formatted);
    this.emit('event', event);
  }

  /**
   * 处理网络事件
   */
  private handleNetworkEvent(event: DebugEvent): void {
    const data = event.data as NetworkEventData;

    // 计算请求耗时
    if (data.endTime) {
      const duration = data.endTime - data.startTime;
      data.data = { ...data.data, duration };
    }

    this.emit('network', event);
    this.emit('event', event);
  }

  /**
   * 处理性能事件
   */
  private handlePerformanceEvent(event: DebugEvent): void {
    this.emit('performance', event);
    this.emit('event', event);
  }

  /**
   * 格式化console事件
   */
  private formatConsoleEvent(event: DebugEvent): DebugEvent {
    const data = event.data as ConsoleEventData;

    // 序列化参数
    const formattedArgs = data.args.map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    });

    return {
      ...event,
      data: {
        ...data,
        args: formattedArgs,
      },
    };
  }

  /**
   * 格式化错误事件
   */
  private formatErrorEvent(event: DebugEvent): DebugEvent {
    // 解析堆栈信息
    if (event.stack) {
      const stackLines = event.stack.split('\n');
      event.data = {
        ...event.data,
        stackLines,
      };
    }

    return event;
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
