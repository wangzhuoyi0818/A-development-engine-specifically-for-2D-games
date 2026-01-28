/**
 * 微信小程序可视化开发平台 - 位置API封装
 */

import { APIWrapper } from '../api-wrapper';
import { LocationInfo } from '../types';

export class LocationAPI extends APIWrapper {
  async getLocation(options?: {
    type?: 'wgs84' | 'gcj02';
    altitude?: boolean;
    isHighAccuracy?: boolean;
  }): Promise<LocationInfo> {
    return this.promisify('getLocation', {
      type: options?.type || 'wgs84',
      altitude: options?.altitude || false,
      isHighAccuracy: options?.isHighAccuracy || false,
    });
  }

  async chooseLocation(options?: {
    latitude?: number;
    longitude?: number;
  }): Promise<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }> {
    return this.promisify('chooseLocation', options || {});
  }

  async openLocation(options: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    scale?: number;
  }): Promise<void> {
    return this.promisify('openLocation', {
      ...options,
      scale: options.scale || 18,
    });
  }
}

export const location = new LocationAPI();
