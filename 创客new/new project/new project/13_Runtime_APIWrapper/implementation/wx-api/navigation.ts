/**
 * 微信小程序可视化开发平台 - 路由导航API封装
 *
 * 封装微信小程序的导航相关API
 */

import { APIWrapper } from '../api-wrapper';
import { NavigateOptions } from '../types';

/**
 * 导航API类
 * 封装所有路由导航相关的微信API
 */
export class NavigationAPI extends APIWrapper {
  /**
   * 保留当前页面,跳转到应用内的某个页面
   * 使用 wx.navigateBack 可以返回到原页面
   */
  async navigateTo(options: {
    url: string;
    events?: Record<string, Function>;
    routeType?: string;
  }): Promise<void> {
    return this.promisify('navigateTo', {
      url: options.url,
      events: options.events,
      routeType: options.routeType,
    });
  }

  /**
   * 关闭当前页面,跳转到应用内的某个页面
   */
  async redirectTo(url: string): Promise<void> {
    return this.promisify('redirectTo', { url });
  }

  /**
   * 跳转到tabBar页面,并关闭其他所有非tabBar页面
   */
  async switchTab(url: string): Promise<void> {
    return this.promisify('switchTab', { url });
  }

  /**
   * 关闭所有页面,打开到应用内的某个页面
   */
  async reLaunch(url: string): Promise<void> {
    return this.promisify('reLaunch', { url });
  }

  /**
   * 关闭当前页面,返回上一页面或多级页面
   */
  async navigateBack(delta: number = 1): Promise<void> {
    return this.promisify('navigateBack', { delta });
  }

  /**
   * 获取当前页面栈
   */
  getCurrentPages(): any[] {
    if (typeof getCurrentPages !== 'undefined') {
      return getCurrentPages();
    }
    return [];
  }

  /**
   * 获取当前页面路由
   */
  getCurrentRoute(): string {
    const pages = this.getCurrentPages();
    if (pages.length === 0) {
      return '';
    }

    const currentPage = pages[pages.length - 1];
    return currentPage.route || '';
  }

  /**
   * 带参数跳转
   * 自动处理URL参数拼接
   */
  async navigateToWithParams(options: {
    url: string;
    params?: Record<string, any>;
    events?: Record<string, Function>;
  }): Promise<void> {
    let url = options.url;

    // 拼接参数
    if (options.params && Object.keys(options.params).length > 0) {
      const queryString = Object.entries(options.params)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      url = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }

    return this.navigateTo({
      url,
      events: options.events,
    });
  }

  /**
   * 带参数重定向
   */
  async redirectToWithParams(options: {
    url: string;
    params?: Record<string, any>;
  }): Promise<void> {
    let url = options.url;

    if (options.params && Object.keys(options.params).length > 0) {
      const queryString = Object.entries(options.params)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      url = url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    }

    return this.redirectTo(url);
  }
}

/**
 * 创建导航API实例
 */
export function createNavigationAPI(): NavigationAPI {
  return new NavigationAPI();
}

/**
 * 默认导航API实例
 */
export const navigation = createNavigationAPI();
