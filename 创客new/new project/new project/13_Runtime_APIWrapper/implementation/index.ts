/**
 * 微信小程序可视化开发平台 - API包装器模块入口
 *
 * 统一导出所有API
 */

// 核心类型
export * from './types';

// 错误处理
export * from './error-handler';

// 重试策略
export * from './retry-policy';

// 拦截器
export * from './interceptor';

// API包装器核心
export * from './api-wrapper';

// Mock数据
export * from './mock-data';

// 微信API封装
export * from './wx-api/network';
export * from './wx-api/storage';
export * from './wx-api/ui';
export * from './wx-api/navigation';
export * from './wx-api/device';
export * from './wx-api/media';
export * from './wx-api/location';
export * from './wx-api/file';
export * from './wx-api/payment';
export * from './wx-api/share';

// 便捷导出
import { network } from './wx-api/network';
import { storage } from './wx-api/storage';
import { ui } from './wx-api/ui';
import { navigation } from './wx-api/navigation';
import { device } from './wx-api/device';
import { media } from './wx-api/media';
import { location } from './wx-api/location';
import { file } from './wx-api/file';
import { payment } from './wx-api/payment';
import { share } from './wx-api/share';

/**
 * 默认导出所有API实例
 */
export const wx = {
  // 网络
  network,

  // 存储
  storage,

  // 界面
  ui,

  // 导航
  navigation,

  // 设备
  device,

  // 媒体
  media,

  // 位置
  location,

  // 文件
  file,

  // 支付
  payment,

  // 分享
  share,
};

/**
 * 版本信息
 */
export const version = '1.0.0';
