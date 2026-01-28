/**
 * Mock环境 - 模拟微信API
 *
 * 职责:
 * - 模拟微信小程序API
 * - 提供测试数据
 * - 处理API调用
 */

import type {
  MockConfig,
  MockAPIConfig,
  MockRequest,
  MockResponse,
} from './types';

/**
 * Mock环境类
 */
export class MockEnvironment {
  private config: MockConfig;
  private apiConfigs: Map<string, MockAPIConfig> = new Map();
  private requestQueue: MockRequest[] = [];
  private eventListeners: Map<string, Set<Function>> = new Map();

  /**
   * 构造函数
   */
  constructor(config: MockConfig) {
    this.config = {
      enabled: true,
      apis: [],
      data: {},
      globalDelay: 0,
      ...config,
    };

    // 注册API配置
    if (this.config.apis) {
      this.config.apis.forEach((api) => {
        this.registerAPI(api);
      });
    }

    // 注册默认API
    this.registerDefaultAPIs();
  }

  /**
   * 获取配置
   */
  getConfig(): MockConfig {
    return { ...this.config };
  }

  /**
   * 注册Mock API
   */
  registerAPI(config: MockAPIConfig): void {
    this.apiConfigs.set(config.api, config);
  }

  /**
   * 注销Mock API
   */
  unregisterAPI(apiName: string): void {
    this.apiConfigs.delete(apiName);
  }

  /**
   * 调用Mock API
   */
  async call(apiName: string, params: any): Promise<MockResponse> {
    if (!this.config.enabled) {
      throw new Error('Mock环境未启用');
    }

    const config = this.apiConfigs.get(apiName);
    if (!config) {
      throw new Error(`未找到Mock API配置: ${apiName}`);
    }

    // 创建请求
    const request: MockRequest = {
      id: this.generateId(),
      api: apiName,
      params,
      timestamp: Date.now(),
    };

    this.requestQueue.push(request);
    this.emit('request', request);

    // 模拟延迟
    const delay = config.delay ?? this.config.globalDelay ?? 0;
    if (delay > 0) {
      await this.sleep(delay);
    }

    // 判断成功率
    const successRate = config.successRate ?? 1;
    const isSuccess = Math.random() < successRate;

    let response: MockResponse;

    if (isSuccess) {
      // 生成响应数据
      const data =
        typeof config.response === 'function'
          ? config.response(params)
          : config.response;

      response = {
        id: request.id,
        data,
        success: true,
        timestamp: Date.now(),
      };
    } else {
      // 返回错误
      response = {
        id: request.id,
        data: null,
        success: false,
        error: config.error || { errMsg: 'Mock API调用失败' },
        timestamp: Date.now(),
      };
    }

    this.emit('response', response);
    return response;
  }

  /**
   * 获取Mock数据
   */
  getData(key: string): any {
    return this.config.data?.[key];
  }

  /**
   * 设置Mock数据
   */
  setData(key: string, value: any): void {
    if (!this.config.data) {
      this.config.data = {};
    }
    this.config.data[key] = value;
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
   * 注册默认API
   */
  private registerDefaultAPIs(): void {
    // wx.request
    this.registerAPI({
      api: 'wx.request',
      response: (params: any) => ({
        data: { message: 'Mock response', params },
        statusCode: 200,
        header: {},
      }),
      delay: 500,
    });

    // wx.showToast
    this.registerAPI({
      api: 'wx.showToast',
      response: (params: any) => ({
        errMsg: 'showToast:ok',
      }),
      delay: 0,
    });

    // wx.showModal
    this.registerAPI({
      api: 'wx.showModal',
      response: (params: any) => ({
        confirm: true,
        cancel: false,
      }),
      delay: 100,
    });

    // wx.showLoading
    this.registerAPI({
      api: 'wx.showLoading',
      response: () => ({
        errMsg: 'showLoading:ok',
      }),
      delay: 0,
    });

    // wx.hideLoading
    this.registerAPI({
      api: 'wx.hideLoading',
      response: () => ({
        errMsg: 'hideLoading:ok',
      }),
      delay: 0,
    });

    // wx.navigateTo
    this.registerAPI({
      api: 'wx.navigateTo',
      response: (params: any) => ({
        errMsg: 'navigateTo:ok',
      }),
      delay: 50,
    });

    // wx.redirectTo
    this.registerAPI({
      api: 'wx.redirectTo',
      response: (params: any) => ({
        errMsg: 'redirectTo:ok',
      }),
      delay: 50,
    });

    // wx.navigateBack
    this.registerAPI({
      api: 'wx.navigateBack',
      response: () => ({
        errMsg: 'navigateBack:ok',
      }),
      delay: 50,
    });

    // wx.setStorage
    this.registerAPI({
      api: 'wx.setStorage',
      response: (params: any) => {
        // 保存到Mock数据
        this.setData(`storage:${params.key}`, params.data);
        return { errMsg: 'setStorage:ok' };
      },
      delay: 10,
    });

    // wx.getStorage
    this.registerAPI({
      api: 'wx.getStorage',
      response: (params: any) => {
        const data = this.getData(`storage:${params.key}`);
        return {
          data,
          errMsg: 'getStorage:ok',
        };
      },
      delay: 10,
    });

    // wx.removeStorage
    this.registerAPI({
      api: 'wx.removeStorage',
      response: (params: any) => {
        this.setData(`storage:${params.key}`, undefined);
        return { errMsg: 'removeStorage:ok' };
      },
      delay: 10,
    });

    // wx.getSystemInfo
    this.registerAPI({
      api: 'wx.getSystemInfo',
      response: () => ({
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
      }),
      delay: 10,
    });

    // wx.getLocation
    this.registerAPI({
      api: 'wx.getLocation',
      response: () => ({
        latitude: 39.9042,
        longitude: 116.4074,
        accuracy: 65,
        errMsg: 'getLocation:ok',
      }),
      delay: 500,
    });

    // wx.chooseImage
    this.registerAPI({
      api: 'wx.chooseImage',
      response: (params: any) => ({
        tempFilePaths: ['/mock/image1.jpg'],
        tempFiles: [
          {
            path: '/mock/image1.jpg',
            size: 102400,
          },
        ],
      }),
      delay: 1000,
    });

    // wx.uploadFile
    this.registerAPI({
      api: 'wx.uploadFile',
      response: (params: any) => ({
        data: JSON.stringify({ url: 'https://mock.com/image1.jpg' }),
        statusCode: 200,
      }),
      delay: 2000,
    });

    // wx.downloadFile
    this.registerAPI({
      api: 'wx.downloadFile',
      response: (params: any) => ({
        tempFilePath: '/mock/download.file',
        statusCode: 200,
      }),
      delay: 1500,
    });
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
