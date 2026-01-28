/**
 * 预览模拟器 - 类型定义
 *
 * 定义预览模拟器所需的所有TypeScript类型接口
 */

import type {
  MiniProgramProject,
  Page,
  Component,
} from '../../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// 模拟器核心类型
// ============================================================================

/**
 * 模拟器配置
 */
export interface SimulatorConfig {
  /** 服务器端口(默认8080) */
  port?: number;

  /** 服务器主机(默认localhost) */
  host?: string;

  /** 是否自动打开浏览器 */
  autoOpen?: boolean;

  /** 热重载配置 */
  hotReload?: HotReloadConfig;

  /** 设备配置 */
  device?: DeviceConfig;

  /** Mock配置 */
  mock?: MockConfig;

  /** 性能监控配置 */
  performance?: PerformanceConfig;

  /** 调试器配置 */
  debugger?: DebuggerConfig;
}

/**
 * 模拟器状态
 */
export type SimulatorStatus =
  | 'idle'      // 空闲
  | 'starting'  // 启动中
  | 'running'   // 运行中
  | 'error'     // 错误
  | 'stopped';  // 已停止

/**
 * 模拟器状态信息
 */
export interface SimulatorState {
  /** 当前状态 */
  status: SimulatorStatus;

  /** 加载的项目 */
  project: MiniProgramProject | null;

  /** 服务器信息 */
  server: ServerInfo | null;

  /** 已连接的客户端 */
  clients: WebSocketClient[];

  /** 最后更新时间 */
  lastUpdate: number;

  /** 错误列表 */
  errors: SimulatorError[];
}

/**
 * 服务器信息
 */
export interface ServerInfo {
  /** 主机地址 */
  host: string;

  /** 端口号 */
  port: number;

  /** 完整URL */
  url: string;

  /** 启动时间 */
  startTime: number;
}

/**
 * WebSocket客户端
 */
export interface WebSocketClient {
  /** 客户端ID */
  id: string;

  /** WebSocket连接 */
  socket: any; // WebSocket实例

  /** 连接时间 */
  connectedAt: number;

  /** 订阅的事件 */
  subscriptions: Set<string>;
}

/**
 * 模拟器错误
 */
export interface SimulatorError {
  /** 错误类型 */
  type: ErrorType;

  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误堆栈 */
  stack?: string;

  /** 错误上下文 */
  context?: any;

  /** 发生时间 */
  timestamp: number;
}

/**
 * 错误类型
 */
export enum ErrorType {
  SYSTEM = 'system',
  GENERATION = 'generation',
  RUNTIME = 'runtime',
  NETWORK = 'network',
  VALIDATION = 'validation',
}

// ============================================================================
// 热重载类型
// ============================================================================

/**
 * 热重载配置
 */
export interface HotReloadConfig {
  /** 是否启用热重载(默认true) */
  enabled?: boolean;

  /** 监听的文件扩展名 */
  watchExtensions?: string[];

  /** 忽略的路径模式 */
  ignored?: string[];

  /** 批量更新延迟(毫秒,默认300) */
  batchDelay?: number;

  /** 是否显示通知 */
  showNotifications?: boolean;
}

/**
 * 文件变更类型
 */
export type FileChangeType = 'add' | 'change' | 'unlink';

/**
 * 文件变更事件
 */
export interface FileChangeEvent {
  /** 变更类型 */
  type: FileChangeType;

  /** 文件路径 */
  path: string;

  /** 变更时间 */
  timestamp: number;
}

/**
 * 更新类型
 */
export type UpdateType = 'wxml' | 'wxss' | 'js' | 'config' | 'full';

/**
 * 热重载消息
 */
export interface HotReloadMessage {
  /** 消息类型 */
  type: 'update' | 'full-reload' | 'error';

  /** 更新类型 */
  updateType?: UpdateType;

  /** 目标(页面或组件路径) */
  target?: string;

  /** 新代码 */
  code?: string;

  /** 时间戳 */
  timestamp: number;

  /** 错误信息 */
  error?: string;
}

// ============================================================================
// 设备模拟类型
// ============================================================================

/**
 * 设备配置
 */
export interface DeviceConfig {
  /** 设备名称 */
  name: string;

  /** 平台 */
  platform: 'ios' | 'android' | 'devtools';

  /** 视口尺寸 */
  viewport: {
    width: number;
    height: number;
  };

  /** 设备像素比 */
  devicePixelRatio: number;

  /** 系统信息 */
  systemInfo: SystemInfo;

  /** 网络类型 */
  networkType?: NetworkType;

  /** 定位信息 */
  location?: Location;

  /** 用户代理 */
  userAgent?: string;
}

/**
 * 系统信息(微信小程序格式)
 */
export interface SystemInfo {
  /** 设备型号 */
  model: string;

  /** 操作系统及版本 */
  system: string;

  /** 微信版本号 */
  version: string;

  /** 客户端平台 */
  platform: string;

  /** 屏幕宽度(px) */
  screenWidth: number;

  /** 屏幕高度(px) */
  screenHeight: number;

  /** 窗口宽度(px) */
  windowWidth: number;

  /** 窗口高度(px) */
  windowHeight: number;

  /** 设备像素比 */
  pixelRatio: number;

  /** 状态栏高度(px) */
  statusBarHeight: number;

  /** 语言 */
  language: string;

  /** 字体大小设置 */
  fontSizeSetting: number;

  /** 客户端基础库版本 */
  SDKVersion: string;
}

/**
 * 网络类型
 */
export type NetworkType = 'wifi' | '4g' | '3g' | '2g' | 'none' | 'unknown';

/**
 * 定位信息
 */
export interface Location {
  /** 纬度 */
  latitude: number;

  /** 经度 */
  longitude: number;

  /** 精度 */
  accuracy?: number;

  /** 高度 */
  altitude?: number;
}

/**
 * 设备预设
 */
export const DEVICE_PRESETS: Record<string, DeviceConfig> = {
  'iphone-13-pro': {
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
  'iphone-se': {
    name: 'iPhone SE',
    platform: 'ios',
    viewport: { width: 375, height: 667 },
    devicePixelRatio: 2,
    systemInfo: {
      model: 'iPhone SE',
      system: 'iOS 15.0',
      version: '8.0.0',
      platform: 'ios',
      screenWidth: 375,
      screenHeight: 667,
      windowWidth: 375,
      windowHeight: 667,
      pixelRatio: 2,
      statusBarHeight: 20,
      language: 'zh_CN',
      fontSizeSetting: 16,
      SDKVersion: '3.0.0',
    },
    networkType: 'wifi',
  },
  'ipad-air': {
    name: 'iPad Air',
    platform: 'ios',
    viewport: { width: 820, height: 1180 },
    devicePixelRatio: 2,
    systemInfo: {
      model: 'iPad Air',
      system: 'iOS 15.0',
      version: '8.0.0',
      platform: 'ios',
      screenWidth: 820,
      screenHeight: 1180,
      windowWidth: 820,
      windowHeight: 1180,
      pixelRatio: 2,
      statusBarHeight: 20,
      language: 'zh_CN',
      fontSizeSetting: 16,
      SDKVersion: '3.0.0',
    },
    networkType: 'wifi',
  },
  'android-phone': {
    name: 'Android Phone',
    platform: 'android',
    viewport: { width: 393, height: 851 },
    devicePixelRatio: 2.75,
    systemInfo: {
      model: 'Android Phone',
      system: 'Android 12',
      version: '8.0.0',
      platform: 'android',
      screenWidth: 393,
      screenHeight: 851,
      windowWidth: 393,
      windowHeight: 851,
      pixelRatio: 2.75,
      statusBarHeight: 25,
      language: 'zh_CN',
      fontSizeSetting: 16,
      SDKVersion: '3.0.0',
    },
    networkType: 'wifi',
  },
};

// ============================================================================
// 调试器类型
// ============================================================================

/**
 * 调试器配置
 */
export interface DebuggerConfig {
  /** 是否启用调试器(默认true) */
  enabled?: boolean;

  /** 是否捕获console(默认true) */
  captureConsole?: boolean;

  /** 是否捕获错误(默认true) */
  captureErrors?: boolean;

  /** 是否捕获网络请求(默认true) */
  captureNetwork?: boolean;

  /** 是否捕获性能数据(默认true) */
  capturePerformance?: boolean;
}

/**
 * 调试事件类型
 */
export type DebugEventType =
  | 'console'
  | 'error'
  | 'network'
  | 'performance'
  | 'lifecycle'
  | 'setdata';

/**
 * 调试事件
 */
export interface DebugEvent {
  /** 事件类型 */
  type: DebugEventType;

  /** 日志级别(console事件) */
  level?: 'log' | 'info' | 'warn' | 'error' | 'debug';

  /** 时间戳 */
  timestamp: number;

  /** 数据 */
  data: any;

  /** 堆栈信息(错误事件) */
  stack?: string;

  /** 来源页面/组件 */
  source?: string;
}

/**
 * Console事件数据
 */
export interface ConsoleEventData {
  /** 参数列表 */
  args: any[];

  /** 调用位置 */
  location?: string;
}

/**
 * 网络请求事件数据
 */
export interface NetworkEventData {
  /** 请求ID */
  id: string;

  /** 请求方法 */
  method: string;

  /** 请求URL */
  url: string;

  /** 请求头 */
  headers?: Record<string, string>;

  /** 请求体 */
  data?: any;

  /** 响应状态码 */
  statusCode?: number;

  /** 响应数据 */
  response?: any;

  /** 请求开始时间 */
  startTime: number;

  /** 请求结束时间 */
  endTime?: number;

  /** 错误信息 */
  error?: string;
}

// ============================================================================
// 性能监控类型
// ============================================================================

/**
 * 性能监控配置
 */
export interface PerformanceConfig {
  /** 是否启用(默认true) */
  enabled?: boolean;

  /** 采样率(0-1,默认1) */
  sampleRate?: number;

  /** 采集间隔(毫秒,默认1000) */
  collectInterval?: number;

  /** 警告阈值 */
  thresholds?: PerformanceThresholds;
}

/**
 * 性能阈值
 */
export interface PerformanceThresholds {
  /** 页面加载时间(毫秒) */
  pageLoad?: number;

  /** setData调用耗时(毫秒) */
  setDataDuration?: number;

  /** setData数据大小(字节) */
  setDataSize?: number;

  /** 帧率(FPS) */
  fps?: number;

  /** 内存使用率(0-1) */
  memoryUsage?: number;
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  /** 页面加载性能 */
  pageLoad: PageLoadMetrics;

  /** setData性能 */
  setData: SetDataMetrics;

  /** 渲染性能 */
  rendering: RenderingMetrics;

  /** 内存使用 */
  memory: MemoryMetrics;

  /** 网络性能 */
  network: NetworkMetrics;

  /** 采集时间 */
  timestamp: number;
}

/**
 * 页面加载指标
 */
export interface PageLoadMetrics {
  /** 总加载时间 */
  duration: number;

  /** 首次渲染时间 */
  firstPaint: number;

  /** DOM就绪时间 */
  domReady: number;

  /** 资源加载时间 */
  resourceLoad: number;
}

/**
 * setData指标
 */
export interface SetDataMetrics {
  /** 调用次数 */
  count: number;

  /** 平均耗时 */
  avgDuration: number;

  /** 最大耗时 */
  maxDuration: number;

  /** 数据大小列表 */
  dataSizes: number[];

  /** 总数据大小 */
  totalDataSize: number;
}

/**
 * 渲染指标
 */
export interface RenderingMetrics {
  /** 当前帧率 */
  fps: number;

  /** 丢帧数 */
  frameDrops: number;

  /** 平均帧时间 */
  avgFrameTime: number;
}

/**
 * 内存指标
 */
export interface MemoryMetrics {
  /** 已使用内存(字节) */
  used: number;

  /** 内存限制(字节) */
  limit: number;

  /** 使用率(0-1) */
  usage: number;
}

/**
 * 网络指标
 */
export interface NetworkMetrics {
  /** 请求总数 */
  requestCount: number;

  /** 总传输大小(字节) */
  totalSize: number;

  /** 平均延迟(毫秒) */
  avgLatency: number;

  /** 失败请求数 */
  failedRequests: number;
}

/**
 * 性能警告
 */
export interface PerformanceWarning {
  /** 警告类型 */
  type: string;

  /** 警告消息 */
  message: string;

  /** 实际值 */
  value: number;

  /** 阈值 */
  threshold: number;

  /** 建议 */
  suggestion?: string;
}

// ============================================================================
// Mock环境类型
// ============================================================================

/**
 * Mock配置
 */
export interface MockConfig {
  /** 是否启用Mock(默认true) */
  enabled?: boolean;

  /** Mock API配置 */
  apis?: MockAPIConfig[];

  /** Mock数据 */
  data?: Record<string, any>;

  /** 全局延迟(毫秒) */
  globalDelay?: number;
}

/**
 * Mock API配置
 */
export interface MockAPIConfig {
  /** API名称(如'wx.request') */
  api: string;

  /** 响应数据或函数 */
  response: any | ((params: any) => any);

  /** 延迟(毫秒) */
  delay?: number;

  /** 错误模拟 */
  error?: any;

  /** 成功率(0-1) */
  successRate?: number;
}

/**
 * Mock请求
 */
export interface MockRequest {
  /** 请求ID */
  id: string;

  /** API名称 */
  api: string;

  /** 请求参数 */
  params: any;

  /** 请求时间 */
  timestamp: number;
}

/**
 * Mock响应
 */
export interface MockResponse {
  /** 请求ID */
  id: string;

  /** 响应数据 */
  data: any;

  /** 是否成功 */
  success: boolean;

  /** 错误信息 */
  error?: any;

  /** 响应时间 */
  timestamp: number;
}

// ============================================================================
// WebSocket通信类型
// ============================================================================

/**
 * WebSocket消息类型
 */
export type WebSocketMessageType =
  | 'hot-reload'   // 热重载
  | 'debug-event'  // 调试事件
  | 'performance'  // 性能数据
  | 'command'      // 命令
  | 'response'     // 响应
  | 'error'        // 错误
  | 'ping'         // 心跳
  | 'pong';        // 心跳响应

/**
 * WebSocket消息
 */
export interface WebSocketMessage {
  /** 消息ID */
  id: string;

  /** 消息类型 */
  type: WebSocketMessageType;

  /** 消息载荷 */
  payload: any;

  /** 时间戳 */
  timestamp: number;
}

/**
 * 命令类型
 */
export type CommandType =
  | 'reload'        // 重新加载
  | 'refresh'       // 刷新
  | 'clear-cache'   // 清除缓存
  | 'set-device'    // 设置设备
  | 'toggle-network' // 切换网络
  | 'set-location'; // 设置定位

/**
 * 命令消息
 */
export interface CommandMessage {
  /** 命令类型 */
  command: CommandType;

  /** 命令参数 */
  params?: any;
}

// ============================================================================
// 代码缓存类型
// ============================================================================

/**
 * 代码缓存
 */
export interface CodeCache {
  /** 页面代码缓存 */
  pages: Map<string, GeneratedPageCode>;

  /** 组件代码缓存 */
  components: Map<string, GeneratedComponentCode>;

  /** 资源缓存 */
  assets: Map<string, Buffer>;

  /** 最后修改时间 */
  lastModified: Map<string, number>;
}

/**
 * 生成的页面代码
 */
export interface GeneratedPageCode {
  /** 页面路径 */
  path: string;

  /** WXML代码 */
  wxml: string;

  /** WXSS代码 */
  wxss: string;

  /** JS代码 */
  js: string;

  /** JSON配置 */
  json: string;

  /** 生成时间 */
  timestamp: number;
}

/**
 * 生成的组件代码
 */
export interface GeneratedComponentCode {
  /** 组件路径 */
  path: string;

  /** WXML代码 */
  wxml: string;

  /** WXSS代码 */
  wxss: string;

  /** JS代码 */
  js: string;

  /** JSON配置 */
  json: string;

  /** 生成时间 */
  timestamp: number;
}

// ============================================================================
// 导出类型重用
// ============================================================================

export type {
  MiniProgramProject,
  Page,
  Component,
};
