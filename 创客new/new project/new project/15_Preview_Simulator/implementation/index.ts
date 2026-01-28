/**
 * 预览模拟器 - 主入口文件
 *
 * 导出所有公共API
 */

// 主类
export { Simulator } from './simulator';
export { PreviewServer } from './preview-server';
export { HotReload } from './hot-reload';
export { DeviceSimulator } from './device-simulator';
export { DebuggerBridge } from './debugger-bridge';
export { PerformanceMonitor } from './performance-monitor';
export { MockEnvironment } from './mock-environment';

// 类型
export type {
  // 配置类型
  SimulatorConfig,
  HotReloadConfig,
  DeviceConfig,
  DebuggerConfig,
  PerformanceConfig,
  MockConfig,

  // 状态类型
  SimulatorState,
  SimulatorStatus,
  ServerInfo,
  WebSocketClient,
  SimulatorError,

  // 热重载类型
  FileChangeEvent,
  FileChangeType,
  HotReloadMessage,
  UpdateType,

  // 设备类型
  SystemInfo,
  NetworkType,
  Location,

  // 调试类型
  DebugEvent,
  DebugEventType,
  ConsoleEventData,
  NetworkEventData,

  // 性能类型
  PerformanceMetrics,
  PageLoadMetrics,
  SetDataMetrics,
  RenderingMetrics,
  MemoryMetrics,
  NetworkMetrics,
  PerformanceWarning,
  PerformanceThresholds,

  // Mock类型
  MockAPIConfig,
  MockRequest,
  MockResponse,

  // WebSocket类型
  WebSocketMessage,
  WebSocketMessageType,
  CommandMessage,
  CommandType,

  // 代码缓存类型
  CodeCache,
  GeneratedPageCode,
  GeneratedComponentCode,
} from './types';

// 常量
export { DEVICE_PRESETS } from './types';
