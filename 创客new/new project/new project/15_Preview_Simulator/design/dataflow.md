# 预览模拟器 - 数据流设计

## 概述

本文档详细描述预览模拟器模块中各种数据的流动路径、转换过程和交互方式。

## 核心数据流

### 1. 项目加载流程

```
┌──────────────┐
│ MiniProgram  │  项目数据
│   Project    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Simulator   │  加载项目
│   .load()    │
└──────┬───────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│Code Generator│                    │PreviewServer │
│  生成代码     │                    │  启动服务器   │
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       ├─── WXML ───┐                      │
       ├─── WXSS ───┼─────────────────────►│
       └─── JS   ───┘                      │
                                           ▼
                                    ┌──────────────┐
                                    │   Browser    │
                                    │   预览页面    │
                                    └──────────────┘
```

**数据类型:**
- 输入: `MiniProgramProject`
- 中间产物: `GeneratedCode { wxml, wxss, js }`
- 输出: HTTP响应 + WebSocket连接

### 2. 热重载数据流

```
┌──────────────┐
│  File Change │  文件系统事件
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  HotReload   │  检测变更类型
│ .onFileChange│
└──────┬───────┘
       │
       ├─── 获取变更的组件/页面信息
       │
       ▼
┌──────────────┐
│Code Generator│  增量生成
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   UpdateMsg  │  构建更新消息
│  { type,     │
│    code,     │
│    target }  │
└──────┬───────┘
       │
       ▼ WebSocket
┌──────────────┐
│   Browser    │  应用更新
│  .applyUpdate│
└──────┬───────┘
       │
       ├─── WXSS: 热替换
       ├─── WXML: 重新渲染
       └─── JS: 页面重载
```

**更新消息格式:**
```typescript
interface HotReloadMessage {
  type: 'update' | 'full-reload' | 'error';
  updateType: 'wxml' | 'wxss' | 'js' | 'config';
  target: string;  // 页面或组件路径
  code?: string;   // 新代码
  timestamp: number;
  error?: string;
}
```

### 3. 调试信息流

```
┌──────────────┐
│   Browser    │  执行代码
│              │
│  console.log │
│  console.error│
│  network req │
│  performance │
└──────┬───────┘
       │
       ▼ DebuggerBridge捕获
┌──────────────┐
│  DebugEvent  │  格式化
│  { type,     │
│    data,     │
│    timestamp}│
└──────┬───────┘
       │
       ▼ WebSocket
┌──────────────┐
│PreviewServer │  转发
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Debug Panel  │  展示
│  (开发者工具) │
└──────────────┘
```

**调试事件类型:**
```typescript
interface DebugEvent {
  type: 'console' | 'network' | 'error' | 'performance';
  level?: 'log' | 'warn' | 'error';
  timestamp: number;
  data: any;
  stack?: string;
}
```

### 4. 性能监控数据流

```
┌──────────────┐
│   Browser    │  运行时
│              │
│  Page.onLoad │─┐
│  setData     │ │
│  render      │ │  采集性能数据
│  network     │ │
└──────────────┘ │
                 │
                 ▼
┌──────────────────┐
│PerformanceMonitor│  收集
│  .collect()      │
└─────────┬────────┘
          │
          ▼ 定时聚合
┌──────────────────┐
│  PerformanceData │  分析
│  { metrics,      │
│    warnings,     │
│    suggestions } │
└─────────┬────────┘
          │
          ▼ WebSocket
┌──────────────────┐
│  Performance     │  展示
│     Panel        │
└──────────────────┘
```

**性能指标:**
```typescript
interface PerformanceMetrics {
  pageLoad: {
    duration: number;
    firstPaint: number;
    domReady: number;
  };
  setData: {
    count: number;
    avgDuration: number;
    maxDuration: number;
    dataSize: number[];
  };
  rendering: {
    fps: number;
    frameDrops: number;
  };
  memory: {
    used: number;
    limit: number;
  };
  network: {
    requestCount: number;
    totalSize: number;
    avgLatency: number;
  };
}
```

### 5. Mock API数据流

```
┌──────────────┐
│   Browser    │  调用API
│              │
│  wx.request  │
│  wx.showToast│
└──────┬───────┘
       │
       ▼ MockEnvironment拦截
┌──────────────┐
│  Mock API    │  处理
│  .intercept()│
└──────┬───────┘
       │
       ├─── 读取Mock配置
       │
       ▼
┌──────────────┐
│  Mock Data   │  返回模拟数据
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Browser    │  接收响应
│  .then()     │
└──────────────┘
```

**Mock配置格式:**
```typescript
interface MockConfig {
  api: string;  // API名称 如 'wx.request'
  response: any | ((params: any) => any);
  delay?: number;  // 模拟延迟
  error?: any;  // 模拟错误
}
```

## 设备模拟数据流

```
┌──────────────┐
│ Device Config│  设备配置
│ { width,     │
│   height,    │
│   dpr,       │
│   platform } │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│DeviceSimulator│  应用配置
│.applyConfig()│
└──────┬───────┘
       │
       ├─── 设置viewport
       ├─── 修改user-agent
       ├─── 注入systemInfo
       └─── 转换touch事件
       │
       ▼
┌──────────────┐
│   Browser    │  模拟环境生效
└──────────────┘
```

**设备配置:**
```typescript
interface DeviceConfig {
  name: string;
  platform: 'ios' | 'android';
  viewport: {
    width: number;
    height: number;
  };
  devicePixelRatio: number;
  systemInfo: {
    model: string;
    system: string;
    version: string;
    // ... 其他微信小程序systemInfo字段
  };
  networkType: '4g' | '3g' | 'wifi' | 'none';
  location?: {
    latitude: number;
    longitude: number;
  };
}
```

## WebSocket通信协议

### 消息格式

```typescript
interface WebSocketMessage {
  id: string;  // 消息ID
  type: MessageType;
  payload: any;
  timestamp: number;
}

type MessageType =
  | 'hot-reload'      // 热重载
  | 'debug-event'     // 调试事件
  | 'performance'     // 性能数据
  | 'command'         // 命令
  | 'response'        // 响应
  | 'error';          // 错误
```

### 通信流程

```
Client                          Server
  │                              │
  ├─────── connect ─────────────►│
  │                              │
  │◄──── connected (token) ──────┤
  │                              │
  ├─────── subscribe ───────────►│  订阅事件
  │         (events)              │
  │                              │
  │◄──── event stream ───────────┤  推送事件
  │         (continuous)          │
  │                              │
  ├─────── command ─────────────►│  发送命令
  │         (reload, etc)         │
  │                              │
  │◄──── response ───────────────┤
  │                              │
```

## 状态管理

### Simulator状态

```typescript
interface SimulatorState {
  status: 'idle' | 'starting' | 'running' | 'error' | 'stopped';
  project: MiniProgramProject | null;
  server: {
    host: string;
    port: number;
    url: string;
  } | null;
  clients: WebSocketClient[];  // 已连接的客户端
  lastUpdate: number;
  errors: SimulatorError[];
}
```

### 状态转换

```
idle ──[load project]──► starting
                           │
                           ├─[success]──► running
                           │
                           └─[error]────► error
                                         │
                                         └─[reset]──► idle

running ──[stop]──► stopped
        │
        └─[error]──► error
```

## 缓存策略

### 1. 代码缓存

```typescript
interface CodeCache {
  pages: Map<string, GeneratedPageCode>;
  components: Map<string, GeneratedComponentCode>;
  assets: Map<string, Buffer>;
  lastModified: Map<string, number>;
}
```

**缓存失效条件:**
- 源文件被修改
- 依赖文件被修改
- 缓存超过最大大小
- 手动清除缓存

### 2. 资源缓存

**HTTP缓存头:**
```
Cache-Control: public, max-age=3600
ETag: <file-hash>
Last-Modified: <timestamp>
```

## 错误处理流程

```
┌──────────────┐
│  Error       │  任意位置发生错误
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Error Handler│  捕获和分类
│  .catch()    │
└──────┬───────┘
       │
       ├─── 记录日志
       ├─── 构建错误信息
       │
       ▼
┌──────────────┐
│  ErrorMsg    │  格式化
│  { code,     │
│    message,  │
│    stack,    │
│    context } │
└──────┬───────┘
       │
       ├─── WebSocket推送到客户端
       │
       ▼
┌──────────────┐
│   Browser    │  显示错误
│  Error Panel │
└──────────────┘
```

**错误分类:**
```typescript
enum ErrorType {
  SYSTEM = 'system',        // 系统错误(端口占用等)
  GENERATION = 'generation', // 代码生成错误
  RUNTIME = 'runtime',       // 运行时错误
  NETWORK = 'network',       // 网络错误
  VALIDATION = 'validation', // 验证错误
}
```

## 数据持久化

### 会话数据

存储在内存中,服务器重启后清空:
- 当前加载的项目
- WebSocket连接
- 性能监控数据
- 调试日志

### 配置数据

存储在文件中,持久保存:
- 设备预设配置
- Mock API配置
- 服务器配置
- 用户偏好设置

**配置文件路径:**
```
.preview-simulator/
  ├── config.json          # 主配置
  ├── devices.json         # 设备配置
  ├── mocks.json          # Mock配置
  └── cache/              # 缓存目录
```

## 性能优化策略

### 1. 增量更新

只生成和传输变更的部分:
```typescript
interface IncrementalUpdate {
  type: 'partial';
  changes: {
    wxml?: { target: string; code: string }[];
    wxss?: { target: string; code: string }[];
    js?: { target: string; code: string }[];
  };
}
```

### 2. 批量更新

短时间内的多次变更合并为一次更新:
```typescript
const BATCH_DELAY = 300; // ms

// 收集变更
const changes: FileChange[] = [];
clearTimeout(batchTimer);
batchTimer = setTimeout(() => {
  // 批量处理
  processBatch(changes);
}, BATCH_DELAY);
```

### 3. 数据压缩

使用压缩算法减少传输大小:
```typescript
// 大于1KB的数据进行压缩
if (data.length > 1024) {
  data = compress(data);
  message.compressed = true;
}
```

## 安全数据流

### 1. WebSocket认证

```
Client                Server
  │                    │
  ├── connect ────────►│
  │                    │
  │◄─ challenge ───────┤  生成token
  │                    │
  ├── auth(token) ────►│  验证
  │                    │
  │◄─ accepted ────────┤
  │                    │
```

### 2. 文件访问控制

```typescript
// 只允许访问项目目录内的文件
function validatePath(requestPath: string): boolean {
  const resolved = path.resolve(projectRoot, requestPath);
  return resolved.startsWith(projectRoot);
}
```

## 扩展数据流

### 插件系统

```
┌──────────────┐
│   Plugin     │  插件注册
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Simulator   │  加载插件
│.registerPlugin│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Plugin Hooks │  插件生命周期
│  - onLoad    │
│  - onUpdate  │
│  - onDebug   │
└──────────────┘
```

**插件接口:**
```typescript
interface SimulatorPlugin {
  name: string;
  version: string;
  hooks: {
    onLoad?(project: MiniProgramProject): void;
    onUpdate?(update: HotReloadMessage): void;
    onDebug?(event: DebugEvent): void;
    onPerformance?(metrics: PerformanceMetrics): void;
  };
}
```
