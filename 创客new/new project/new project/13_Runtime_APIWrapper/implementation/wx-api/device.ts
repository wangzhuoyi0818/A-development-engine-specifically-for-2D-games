/**
 * 微信小程序可视化开发平台 - 设备API封装
 */

import { APIWrapper } from '../api-wrapper';
import { SystemInfo } from '../types';

export class DeviceAPI extends APIWrapper {
  async getSystemInfo(): Promise<SystemInfo> {
    return this.promisify('getSystemInfo', {});
  }

  getSystemInfoSync(): SystemInfo {
    if (typeof wx === 'undefined') throw new Error('wx对象不存在');
    return wx.getSystemInfoSync() as SystemInfo;
  }

  async getNetworkType(): Promise<{ networkType: string }> {
    return this.promisify('getNetworkType', {});
  }

  async getBatteryInfo(): Promise<{ level: number; isCharging: boolean }> {
    return this.promisify('getBatteryInfo', {});
  }

  async makePhoneCall(phoneNumber: string): Promise<void> {
    return this.promisify('makePhoneCall', { phoneNumber });
  }

  async scanCode(options?: {
    onlyFromCamera?: boolean;
    scanType?: string[];
  }): Promise<{ result: string; scanType: string; charSet: string; path: string }> {
    return this.promisify('scanCode', options || {});
  }

  async setClipboardData(data: string): Promise<void> {
    return this.promisify('setClipboardData', { data });
  }

  async getClipboardData(): Promise<{ data: string }> {
    return this.promisify('getClipboardData', {});
  }

  async setScreenBrightness(value: number): Promise<void> {
    return this.promisify('setScreenBrightness', { value });
  }

  async getScreenBrightness(): Promise<{ value: number }> {
    return this.promisify('getScreenBrightness', {});
  }

  async setKeepScreenOn(keepScreenOn: boolean): Promise<void> {
    return this.promisify('setKeepScreenOn', { keepScreenOn });
  }

  async vibrateShort(type?: 'heavy' | 'medium' | 'light'): Promise<void> {
    return this.promisify('vibrateShort', { type: type || 'medium' });
  }

  async vibrateLong(): Promise<void> {
    return this.promisify('vibrateLong', {});
  }
}

export const device = new DeviceAPI();
