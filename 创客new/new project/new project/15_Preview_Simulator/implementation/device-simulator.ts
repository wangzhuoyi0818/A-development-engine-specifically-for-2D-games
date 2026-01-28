/**
 * 设备模拟器 - 模拟不同设备特性
 *
 * 职责:
 * - 提供设备预设配置
 * - 模拟设备环境
 * - 处理设备相关API
 */

import type {
  DeviceConfig,
  SystemInfo,
  NetworkType,
  Location,
} from './types';
import { DEVICE_PRESETS } from './types';

/**
 * 设备模拟器类
 */
export class DeviceSimulator {
  private config: DeviceConfig;
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * 构造函数
   */
  constructor(config: DeviceConfig) {
    this.config = config;
  }

  /**
   * 获取当前设备配置
   */
  getConfig(): DeviceConfig {
    return { ...this.config };
  }

  /**
   * 设置设备配置
   */
  setConfig(config: DeviceConfig): void {
    this.config = config;
    this.emit('config-changed', config);
  }

  /**
   * 从预设加载设备配置
   */
  loadPreset(presetName: string): void {
    const preset = DEVICE_PRESETS[presetName];
    if (!preset) {
      throw new Error(`未知的设备预设: ${presetName}`);
    }
    this.setConfig(preset);
  }

  /**
   * 获取所有设备预设
   */
  static getPresets(): Record<string, DeviceConfig> {
    return { ...DEVICE_PRESETS };
  }

  /**
   * 获取系统信息(模拟wx.getSystemInfo)
   */
  getSystemInfo(): SystemInfo {
    return { ...this.config.systemInfo };
  }

  /**
   * 获取网络类型(模拟wx.getNetworkType)
   */
  getNetworkType(): NetworkType {
    return this.config.networkType || 'wifi';
  }

  /**
   * 设置网络类型
   */
  setNetworkType(type: NetworkType): void {
    this.config.networkType = type;
    this.emit('network-changed', type);
  }

  /**
   * 获取定位信息(模拟wx.getLocation)
   */
  getLocation(): Location | undefined {
    return this.config.location ? { ...this.config.location } : undefined;
  }

  /**
   * 设置定位信息
   */
  setLocation(location: Location): void {
    this.config.location = location;
    this.emit('location-changed', location);
  }

  /**
   * 生成设备User-Agent
   */
  getUserAgent(): string {
    if (this.config.userAgent) {
      return this.config.userAgent;
    }

    const { platform, systemInfo } = this.config;
    if (platform === 'ios') {
      return `Mozilla/5.0 (iPhone; CPU iPhone OS ${systemInfo.system.replace(
        'iOS ',
        ''
      ).replace('.', '_')} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/${systemInfo.version}`;
    } else {
      return `Mozilla/5.0 (Linux; Android ${systemInfo.system.replace(
        'Android ',
        ''
      )}) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MobileSafari/537.36 MicroMessenger/${systemInfo.version}`;
    }
  }

  /**
   * 应用设备配置到DOM
   */
  applyToDOM(): void {
    // 模拟应用设备配置
    // 实际实现中会修改viewport和user-agent
    this.emit('applied');
  }

  /**
   * 转换触摸事件
   * 将鼠标事件转换为触摸事件
   */
  convertMouseToTouch(mouseEvent: any): any {
    return {
      type: this.mapMouseEventType(mouseEvent.type),
      touches: [
        {
          identifier: 0,
          clientX: mouseEvent.clientX,
          clientY: mouseEvent.clientY,
          pageX: mouseEvent.pageX,
          pageY: mouseEvent.pageY,
        },
      ],
      timeStamp: mouseEvent.timeStamp,
    };
  }

  /**
   * 映射鼠标事件类型到触摸事件类型
   */
  private mapMouseEventType(type: string): string {
    const mapping: Record<string, string> = {
      mousedown: 'touchstart',
      mousemove: 'touchmove',
      mouseup: 'touchend',
    };
    return mapping[type] || type;
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
}
