/**
 * 微信小程序可视化开发平台 - 界面API封装
 *
 * 封装微信小程序的UI相关API
 */

import { APIWrapper } from '../api-wrapper';
import { ToastOptions, ModalOptions, ModalResult } from '../types';

/**
 * 界面API类
 * 封装所有界面相关的微信API
 */
export class UIAPI extends APIWrapper {
  /**
   * 显示消息提示框
   */
  async showToast(options: ToastOptions): Promise<void> {
    return this.promisify('showToast', {
      title: options.title,
      icon: options.icon || 'none',
      image: options.image,
      duration: options.duration || 1500,
      mask: options.mask || false,
    });
  }

  /**
   * 隐藏消息提示框
   */
  async hideToast(): Promise<void> {
    return this.promisify('hideToast', {});
  }

  /**
   * 显示loading提示框
   */
  async showLoading(options: {
    title: string;
    mask?: boolean;
  }): Promise<void> {
    return this.promisify('showLoading', options);
  }

  /**
   * 隐藏loading提示框
   */
  async hideLoading(): Promise<void> {
    return this.promisify('hideLoading', {});
  }

  /**
   * 显示模态对话框
   */
  async showModal(options: ModalOptions): Promise<ModalResult> {
    return this.promisify('showModal', {
      title: options.title,
      content: options.content,
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || '取消',
      cancelColor: options.cancelColor || '#000000',
      confirmText: options.confirmText || '确定',
      confirmColor: options.confirmColor || '#576B95',
    });
  }

  /**
   * 显示操作菜单
   */
  async showActionSheet(options: {
    itemList: string[];
    itemColor?: string;
  }): Promise<{ tapIndex: number }> {
    return this.promisify('showActionSheet', {
      itemList: options.itemList,
      itemColor: options.itemColor || '#000000',
    });
  }

  /**
   * 设置导航栏标题
   */
  async setNavigationBarTitle(title: string): Promise<void> {
    return this.promisify('setNavigationBarTitle', { title });
  }

  /**
   * 设置导航栏颜色
   */
  async setNavigationBarColor(options: {
    frontColor: '#ffffff' | '#000000';
    backgroundColor: string;
    animation?: {
      duration?: number;
      timingFunc?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
    };
  }): Promise<void> {
    return this.promisify('setNavigationBarColor', options);
  }

  /**
   * 显示导航栏加载动画
   */
  async showNavigationBarLoading(): Promise<void> {
    return this.promisify('showNavigationBarLoading', {});
  }

  /**
   * 隐藏导航栏加载动画
   */
  async hideNavigationBarLoading(): Promise<void> {
    return this.promisify('hideNavigationBarLoading', {});
  }

  /**
   * 设置TabBar某一项的内容
   */
  async setTabBarItem(options: {
    index: number;
    text?: string;
    iconPath?: string;
    selectedIconPath?: string;
  }): Promise<void> {
    return this.promisify('setTabBarItem', options);
  }

  /**
   * 设置TabBar的整体样式
   */
  async setTabBarStyle(options: {
    color?: string;
    selectedColor?: string;
    backgroundColor?: string;
    borderStyle?: 'black' | 'white';
  }): Promise<void> {
    return this.promisify('setTabBarStyle', options);
  }

  /**
   * 显示TabBar
   */
  async showTabBar(options?: {
    animation?: boolean;
  }): Promise<void> {
    return this.promisify('showTabBar', options || {});
  }

  /**
   * 隐藏TabBar
   */
  async hideTabBar(options?: {
    animation?: boolean;
  }): Promise<void> {
    return this.promisify('hideTabBar', options || {});
  }

  /**
   * 显示TabBar某一项的右上角红点
   */
  async showTabBarRedDot(index: number): Promise<void> {
    return this.promisify('showTabBarRedDot', { index });
  }

  /**
   * 隐藏TabBar某一项的右上角红点
   */
  async hideTabBarRedDot(index: number): Promise<void> {
    return this.promisify('hideTabBarRedDot', { index });
  }

  /**
   * 为TabBar某一项的右上角添加文本
   */
  async setTabBarBadge(index: number, text: string): Promise<void> {
    return this.promisify('setTabBarBadge', { index, text });
  }

  /**
   * 移除TabBar某一项右上角的文本
   */
  async removeTabBarBadge(index: number): Promise<void> {
    return this.promisify('removeTabBarBadge', { index });
  }

  /**
   * 开启下拉刷新
   */
  async startPullDownRefresh(): Promise<void> {
    return this.promisify('startPullDownRefresh', {});
  }

  /**
   * 停止下拉刷新
   */
  async stopPullDownRefresh(): Promise<void> {
    return this.promisify('stopPullDownRefresh', {});
  }

  /**
   * 设置窗口背景色
   */
  async setBackgroundColor(options: {
    backgroundColor?: string;
    backgroundColorTop?: string;
    backgroundColorBottom?: string;
  }): Promise<void> {
    return this.promisify('setBackgroundColor', options);
  }

  /**
   * 设置下拉背景字体、loading图样式
   */
  async setBackgroundTextStyle(style: 'dark' | 'light'): Promise<void> {
    return this.promisify('setBackgroundTextStyle', {
      textStyle: style,
    });
  }

  /**
   * 滚动到页面指定位置
   */
  async pageScrollTo(options: {
    scrollTop?: number;
    selector?: string;
    duration?: number;
  }): Promise<void> {
    return this.promisify('pageScrollTo', {
      scrollTop: options.scrollTop,
      selector: options.selector,
      duration: options.duration || 300,
    });
  }
}

/**
 * 创建UI API实例
 */
export function createUIAPI(): UIAPI {
  return new UIAPI();
}

/**
 * 默认UI API实例
 */
export const ui = createUIAPI();
