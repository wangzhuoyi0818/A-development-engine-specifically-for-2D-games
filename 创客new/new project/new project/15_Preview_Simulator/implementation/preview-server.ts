/**
 * 预览服务器 - HTTP服务器和WebSocket支持
 *
 * 职责:
 * - 提供HTTP服务
 * - 托管预览页面
 * - 处理WebSocket连接
 */

import type {
  MiniProgramProject,
  ServerInfo,
  WebSocketClient,
  WebSocketMessage,
  CodeCache,
} from './types';
import { WXMLGenerator } from '../../../09_CodeGenerator_WXMLGenerator/implementation/wxml-generator';
import { WXSSGenerator } from '../../../10_CodeGenerator_WXSSGenerator/implementation/wxss-generator';
import { JSGenerator } from '../../../11_CodeGenerator_JSGenerator/implementation/js-generator';

/**
 * 预览服务器配置
 */
export interface PreviewServerConfig {
  port: number;
  host: string;
}

/**
 * 预览服务器类
 */
export class PreviewServer {
  private config: PreviewServerConfig;
  private project: MiniProgramProject | null = null;
  private cache: CodeCache;
  private clients: Map<string, WebSocketClient> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();
  private server: any = null; // HTTP服务器实例
  private wss: any = null; // WebSocket服务器实例

  /**
   * 构造函数
   */
  constructor(config: PreviewServerConfig) {
    this.config = config;
    this.cache = {
      pages: new Map(),
      components: new Map(),
      assets: new Map(),
      lastModified: new Map(),
    };
  }

  /**
   * 启动服务器
   */
  async start(project: MiniProgramProject): Promise<ServerInfo> {
    this.project = project;

    // 生成初始代码
    await this.generateAllCode();

    // 启动HTTP服务器(模拟实现)
    const port = await this.findAvailablePort(this.config.port);
    const url = `http://${this.config.host}:${port}`;

    const serverInfo: ServerInfo = {
      host: this.config.host,
      port,
      url,
      startTime: Date.now(),
    };

    // 启动WebSocket服务器(模拟实现)
    this.startWebSocketServer();

    this.emit('started', serverInfo);
    return serverInfo;
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    // 关闭所有客户端连接
    this.clients.forEach((client) => {
      // 关闭WebSocket连接
      // client.socket.close();
    });
    this.clients.clear();

    // 关闭WebSocket服务器
    if (this.wss) {
      // this.wss.close();
      this.wss = null;
    }

    // 关闭HTTP服务器
    if (this.server) {
      // this.server.close();
      this.server = null;
    }

    this.emit('stopped');
  }

  /**
   * 发送消息到指定客户端
   */
  send(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      // 模拟发送
      // client.socket.send(JSON.stringify(message));
      this.emit('message-sent', client, message);
    }
  }

  /**
   * 广播消息到所有客户端
   */
  broadcast(message: WebSocketMessage): void {
    this.clients.forEach((client) => {
      this.send(client.id, message);
    });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.pages.clear();
    this.cache.components.clear();
    this.cache.assets.clear();
    this.cache.lastModified.clear();
    this.emit('cache-cleared');
  }

  /**
   * 获取页面代码
   */
  getPageCode(pagePath: string): any {
    return this.cache.pages.get(pagePath);
  }

  /**
   * 更新页面代码
   */
  async updatePageCode(pagePath: string): Promise<void> {
    if (!this.project) return;

    const page = this.project.pages.find((p) => p.path === pagePath);
    if (!page) {
      throw new Error(`页面不存在: ${pagePath}`);
    }

    // 生成新代码
    const wxml = WXMLGenerator.generate(page);
    const wxss = new WXSSGenerator().generate(page);
    const js = new JSGenerator().generatePageCode(page);

    const code = {
      path: pagePath,
      wxml: wxml.code,
      wxss: wxss.code || '',
      js: js.code || '',
      json: JSON.stringify(page.config, null, 2),
      timestamp: Date.now(),
    };

    this.cache.pages.set(pagePath, code);
    this.cache.lastModified.set(pagePath, Date.now());
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
   * 生成所有代码
   */
  private async generateAllCode(): Promise<void> {
    if (!this.project) return;

    // 生成所有页面代码
    for (const page of this.project.pages) {
      await this.updatePageCode(page.path);
    }
  }

  /**
   * 启动WebSocket服务器
   */
  private startWebSocketServer(): void {
    // 模拟WebSocket服务器
    this.wss = {
      on: (event: string, handler: Function) => {
        // 模拟连接事件
      },
    };
  }

  /**
   * 处理客户端连接
   */
  private handleClientConnection(socket: any): void {
    const client: WebSocketClient = {
      id: this.generateId(),
      socket,
      connectedAt: Date.now(),
      subscriptions: new Set(),
    };

    this.clients.set(client.id, client);
    this.emit('client-connected', client);

    // 监听消息
    socket.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        this.emit('message', client, message);
      } catch (error) {
        console.error('解析消息失败:', error);
      }
    });

    // 监听断开
    socket.on('close', () => {
      this.clients.delete(client.id);
      this.emit('client-disconnected', client.id);
    });
  }

  /**
   * 查找可用端口
   */
  private async findAvailablePort(startPort: number): Promise<number> {
    // 简单实现,实际应该检查端口是否被占用
    return startPort;
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
