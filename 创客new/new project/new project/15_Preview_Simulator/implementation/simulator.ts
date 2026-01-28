/**
 * 预览模拟器 - 核心模拟器类
 *
 * 职责:
 * - 管理模拟器生命周期
 * - 协调各子模块工作
 * - 提供统一的API接口
 */

import type {
  MiniProgramProject,
  SimulatorConfig,
  SimulatorState,
  SimulatorStatus,
  ServerInfo,
  WebSocketClient,
  SimulatorError,
  ErrorType,
} from './types';
import { PreviewServer } from './preview-server';
import { HotReload } from './hot-reload';
import { DeviceSimulator } from './device-simulator';
import { DebuggerBridge } from './debugger-bridge';
import { PerformanceMonitor } from './performance-monitor';
import { MockEnvironment } from './mock-environment';

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<SimulatorConfig> = {
  port: 8080,
  host: 'localhost',
  autoOpen: true,
  hotReload: {
    enabled: true,
    watchExtensions: ['.ts', '.js', '.json'],
    ignored: ['node_modules/**', '.git/**'],
    batchDelay: 300,
    showNotifications: true,
  },
  device: {
    name: 'iPhone 13 Pro',
    platform: 'ios',
    viewport: { width: 390, height: 844 },
    devicePixelRatio: 3,
    systemInfo: {
      model: 'iPhone 13 Pro',
      system: 'iOS 15.0',
      version: '8.0.0',
      platform: 'ios',
      screenWidth: 390,
      screenHeight: 844,
      windowWidth: 390,
      windowHeight: 844,
      pixelRatio: 3,
      statusBarHeight: 44,
      language: 'zh_CN',
      fontSizeSetting: 16,
      SDKVersion: '3.0.0',
    },
    networkType: 'wifi',
  },
  mock: {
    enabled: true,
    apis: [],
    data: {},
    globalDelay: 0,
  },
  performance: {
    enabled: true,
    sampleRate: 1,
    collectInterval: 1000,
    thresholds: {
      pageLoad: 3000,
      setDataDuration: 50,
      setDataSize: 1048576, // 1MB
      fps: 30,
      memoryUsage: 0.8,
    },
  },
  debugger: {
    enabled: true,
    captureConsole: true,
    captureErrors: true,
    captureNetwork: true,
    capturePerformance: true,
  },
};

/**
 * 预览模拟器主类
 */
export class Simulator {
  /** 配置 */
  private config: Required<SimulatorConfig>;

  /** 状态 */
  private state: SimulatorState;

  /** 预览服务器 */
  private server: PreviewServer | null = null;

  /** 热重载 */
  private hotReload: HotReload | null = null;

  /** 设备模拟器 */
  private deviceSimulator: DeviceSimulator | null = null;

  /** 调试器桥接 */
  private debuggerBridge: DebuggerBridge | null = null;

  /** 性能监控器 */
  private performanceMonitor: PerformanceMonitor | null = null;

  /** Mock环境 */
  private mockEnvironment: MockEnvironment | null = null;

  /** 事件监听器 */
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * 构造函数
   */
  constructor(config: SimulatorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      status: 'idle',
      project: null,
      server: null,
      clients: [],
      lastUpdate: Date.now(),
      errors: [],
    };
  }

  /**
   * 加载项目并启动模拟器
   */
  async load(project: MiniProgramProject): Promise<void> {
    try {
      this.updateStatus('starting');
      this.state.project = project;

      // 1. 创建预览服务器
      this.server = new PreviewServer({
        port: this.config.port,
        host: this.config.host,
      });

      // 2. 启动服务器
      const serverInfo = await this.server.start(project);
      this.state.server = serverInfo;

      // 3. 初始化热重载
      if (this.config.hotReload.enabled) {
        this.hotReload = new HotReload(this.config.hotReload, project);
        this.hotReload.on('update', (update) => {
          this.handleHotReload(update);
        });
        await this.hotReload.start();
      }

      // 4. 初始化设备模拟器
      this.deviceSimulator = new DeviceSimulator(this.config.device);

      // 5. 初始化调试器桥接
      if (this.config.debugger.enabled) {
        this.debuggerBridge = new DebuggerBridge(this.config.debugger);
        this.debuggerBridge.on('event', (event) => {
          this.emit('debug', event);
        });
      }

      // 6. 初始化性能监控
      if (this.config.performance.enabled) {
        this.performanceMonitor = new PerformanceMonitor(this.config.performance);
        this.performanceMonitor.on('metrics', (metrics) => {
          this.emit('performance', metrics);
        });
        this.performanceMonitor.on('warning', (warning) => {
          this.emit('performance-warning', warning);
        });
      }

      // 7. 初始化Mock环境
      if (this.config.mock.enabled) {
        this.mockEnvironment = new MockEnvironment(this.config.mock);
      }

      // 8. 连接WebSocket事件
      this.server.on('client-connected', (client) => {
        this.handleClientConnected(client);
      });

      this.server.on('client-disconnected', (clientId) => {
        this.handleClientDisconnected(clientId);
      });

      this.server.on('message', (client, message) => {
        this.handleClientMessage(client, message);
      });

      // 9. 自动打开浏览器
      if (this.config.autoOpen) {
        await this.openBrowser();
      }

      this.updateStatus('running');
      this.emit('started', serverInfo);
    } catch (error) {
      this.handleError(error, 'SYSTEM');
      this.updateStatus('error');
      throw error;
    }
  }

  /**
   * 停止模拟器
   */
  async stop(): Promise<void> {
    try {
      // 停止热重载
      if (this.hotReload) {
        await this.hotReload.stop();
        this.hotReload = null;
      }

      // 停止性能监控
      if (this.performanceMonitor) {
        this.performanceMonitor.stop();
        this.performanceMonitor = null;
      }

      // 停止服务器
      if (this.server) {
        await this.server.stop();
        this.server = null;
      }

      // 清理状态
      this.state.project = null;
      this.state.server = null;
      this.state.clients = [];

      this.updateStatus('stopped');
      this.emit('stopped');
    } catch (error) {
      this.handleError(error, 'SYSTEM');
      throw error;
    }
  }

  /**
   * 重新加载项目
   */
  async reload(): Promise<void> {
    if (!this.state.project) {
      throw new Error('未加载项目');
    }

    const project = this.state.project;
    await this.stop();
    await this.load(project);
  }

  /**
   * 刷新预览页面
   */
  refresh(): void {
    if (!this.server) {
      throw new Error('服务器未启动');
    }

    this.server.broadcast({
      id: this.generateId(),
      type: 'command',
      payload: { command: 'refresh' },
      timestamp: Date.now(),
    });
  }

  /**
   * 切换设备
   */
  setDevice(deviceConfig: any): void {
    if (!this.deviceSimulator) {
      throw new Error('设备模拟器未初始化');
    }

    this.deviceSimulator.setConfig(deviceConfig);
    this.config.device = deviceConfig;

    // 通知客户端
    if (this.server) {
      this.server.broadcast({
        id: this.generateId(),
        type: 'command',
        payload: {
          command: 'set-device',
          params: deviceConfig,
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 获取当前状态
   */
  getState(): SimulatorState {
    return { ...this.state };
  }

  /**
   * 获取服务器URL
   */
  getURL(): string | null {
    return this.state.server?.url || null;
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

  /**
   * 处理热重载
   */
  private handleHotReload(update: any): void {
    if (!this.server) return;

    this.state.lastUpdate = Date.now();

    // 广播更新消息
    this.server.broadcast({
      id: this.generateId(),
      type: 'hot-reload',
      payload: update,
      timestamp: Date.now(),
    });

    this.emit('hot-reload', update);
  }

  /**
   * 处理客户端连接
   */
  private handleClientConnected(client: WebSocketClient): void {
    this.state.clients.push(client);
    this.emit('client-connected', client);

    // 发送初始配置
    if (this.server) {
      this.server.send(client.id, {
        id: this.generateId(),
        type: 'command',
        payload: {
          command: 'init',
          params: {
            device: this.config.device,
            mock: this.mockEnvironment?.getConfig(),
          },
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 处理客户端断开
   */
  private handleClientDisconnected(clientId: string): void {
    this.state.clients = this.state.clients.filter(
      (c) => c.id !== clientId
    );
    this.emit('client-disconnected', clientId);
  }

  /**
   * 处理客户端消息
   */
  private handleClientMessage(client: WebSocketClient, message: any): void {
    switch (message.type) {
      case 'debug-event':
        if (this.debuggerBridge) {
          this.debuggerBridge.handleEvent(message.payload);
        }
        break;

      case 'performance':
        if (this.performanceMonitor) {
          this.performanceMonitor.collect(message.payload);
        }
        break;

      case 'command':
        this.handleCommand(client, message.payload);
        break;

      default:
        console.warn('未知消息类型:', message.type);
    }
  }

  /**
   * 处理命令
   */
  private handleCommand(client: WebSocketClient, command: any): void {
    switch (command.command) {
      case 'reload':
        this.reload();
        break;

      case 'refresh':
        this.refresh();
        break;

      case 'clear-cache':
        this.server?.clearCache();
        break;

      case 'set-device':
        this.setDevice(command.params);
        break;

      default:
        console.warn('未知命令:', command.command);
    }
  }

  /**
   * 打开浏览器
   */
  private async openBrowser(): Promise<void> {
    if (!this.state.server) return;

    try {
      const open = await import('open');
      await open.default(this.state.server.url);
    } catch (error) {
      console.warn('无法自动打开浏览器:', error);
      console.log(`请手动打开: ${this.state.server.url}`);
    }
  }

  /**
   * 更新状态
   */
  private updateStatus(status: SimulatorStatus): void {
    this.state.status = status;
    this.emit('status-change', status);
  }

  /**
   * 处理错误
   */
  private handleError(error: any, type: keyof typeof ErrorType): void {
    const simulatorError: SimulatorError = {
      type: ErrorType[type],
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || String(error),
      stack: error.stack,
      context: error.context,
      timestamp: Date.now(),
    };

    this.state.errors.push(simulatorError);
    this.emit('error', simulatorError);

    // 通知客户端
    if (this.server) {
      this.server.broadcast({
        id: this.generateId(),
        type: 'error',
        payload: simulatorError,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
