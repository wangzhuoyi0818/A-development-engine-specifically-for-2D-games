/**
 * 微信小程序可视化开发平台 - 数据缓存API封装
 *
 * 封装微信小程序的Storage相关API
 */

import { APIWrapper } from '../api-wrapper';
import { StorageOptions } from '../types';

/**
 * 存储API类
 * 封装所有数据缓存相关的微信API
 */
export class StorageAPI extends APIWrapper {
  /**
   * 异步存储数据
   */
  async setStorage(key: string, data: any): Promise<void> {
    return this.promisify('setStorage', { key, data });
  }

  /**
   * 同步存储数据
   */
  setStorageSync(key: string, data: any): void {
    if (typeof wx === 'undefined') {
      throw new Error('wx对象不存在');
    }
    wx.setStorageSync(key, data);
  }

  /**
   * 异步获取数据
   */
  async getStorage<T = any>(key: string): Promise<T> {
    const result = await this.promisify<{ data: T }>('getStorage', { key });
    return result.data;
  }

  /**
   * 同步获取数据
   */
  getStorageSync<T = any>(key: string): T {
    if (typeof wx === 'undefined') {
      throw new Error('wx对象不存在');
    }
    return wx.getStorageSync(key) as T;
  }

  /**
   * 异步获取存储信息
   */
  async getStorageInfo(): Promise<{
    keys: string[];
    currentSize: number;
    limitSize: number;
  }> {
    return this.promisify('getStorageInfo', {});
  }

  /**
   * 同步获取存储信息
   */
  getStorageInfoSync(): {
    keys: string[];
    currentSize: number;
    limitSize: number;
  } {
    if (typeof wx === 'undefined') {
      throw new Error('wx对象不存在');
    }
    return wx.getStorageInfoSync();
  }

  /**
   * 异步删除数据
   */
  async removeStorage(key: string): Promise<void> {
    return this.promisify('removeStorage', { key });
  }

  /**
   * 同步删除数据
   */
  removeStorageSync(key: string): void {
    if (typeof wx === 'undefined') {
      throw new Error('wx对象不存在');
    }
    wx.removeStorageSync(key);
  }

  /**
   * 异步清空所有数据
   */
  async clearStorage(): Promise<void> {
    return this.promisify('clearStorage', {});
  }

  /**
   * 同步清空所有数据
   */
  clearStorageSync(): void {
    if (typeof wx === 'undefined') {
      throw new Error('wx对象不存在');
    }
    wx.clearStorageSync();
  }
}

/**
 * 创建存储API实例
 */
export function createStorageAPI(): StorageAPI {
  return new StorageAPI();
}

/**
 * 默认存储API实例
 */
export const storage = createStorageAPI();
