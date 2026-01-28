/**
 * 微信小程序可视化开发平台 - 网络API封装
 *
 * 封装微信小程序的网络相关API
 */

import { APIWrapper } from '../api-wrapper';
import {
  RequestOptions,
  UploadFileOptions,
  UploadFileResult,
  DownloadFileOptions,
  DownloadFileResult,
} from '../types';

/**
 * 网络API类
 * 封装所有网络相关的微信API
 */
export class NetworkAPI extends APIWrapper {
  /**
   * 发起HTTP请求
   * @param options 请求选项
   * @returns Promise<T> 返回响应数据
   */
  async request<T = any>(options: RequestOptions<any>): Promise<T> {
    return super.request<T>(options);
  }

  /**
   * GET请求的便捷方法
   */
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    config?: Partial<RequestOptions>
  ): Promise<T> {
    // 将params拼接到URL
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      url = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }

    return this.request<T>({
      url,
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST请求的便捷方法
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestOptions>
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...config,
    });
  }

  /**
   * PUT请求的便捷方法
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: Partial<RequestOptions>
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...config,
    });
  }

  /**
   * DELETE请求的便捷方法
   */
  async delete<T = any>(
    url: string,
    config?: Partial<RequestOptions>
  ): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...config,
    });
  }

  /**
   * 上传文件
   * @param options 上传选项
   * @returns Promise<UploadFileResult>
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadFileResult> {
    return super.uploadFile(options);
  }

  /**
   * 下载文件
   * @param options 下载选项
   * @returns Promise<DownloadFileResult>
   */
  async downloadFile(options: DownloadFileOptions): Promise<DownloadFileResult> {
    return super.downloadFile(options);
  }

  /**
   * 创建WebSocket连接
   * 注意: WebSocket不能直接Promise化,返回任务对象
   */
  connectSocket(options: {
    url: string;
    header?: Record<string, string>;
    protocols?: string[];
    tcpNoDelay?: boolean;
    perMessageDeflate?: boolean;
    timeout?: number;
  }): WechatMiniprogram.SocketTask {
    if (typeof wx === 'undefined') {
      throw new Error('wx对象不存在');
    }

    return wx.connectSocket(options);
  }

  /**
   * 关闭WebSocket连接
   */
  async closeSocket(options?: {
    code?: number;
    reason?: string;
  }): Promise<void> {
    return this.promisify('closeSocket', options || {});
  }

  /**
   * 发送WebSocket消息
   */
  async sendSocketMessage(options: {
    data: string | ArrayBuffer;
  }): Promise<void> {
    return this.promisify('sendSocketMessage', options);
  }
}

/**
 * 创建网络API实例
 */
export function createNetworkAPI(): NetworkAPI {
  return new NetworkAPI();
}

/**
 * 默认网络API实例
 */
export const network = createNetworkAPI();
