/**
 * 微信小程序可视化开发平台 - 媒体API封装
 */

import { APIWrapper } from '../api-wrapper';
import { ChooseImageOptions, ChooseImageResult } from '../types';

export class MediaAPI extends APIWrapper {
  async chooseImage(options?: ChooseImageOptions): Promise<ChooseImageResult> {
    return this.promisify('chooseImage', {
      count: options?.count || 9,
      sizeType: options?.sizeType || ['original', 'compressed'],
      sourceType: options?.sourceType || ['album', 'camera'],
    });
  }

  async previewImage(options: {
    urls: string[];
    current?: string;
  }): Promise<void> {
    return this.promisify('previewImage', options);
  }

  async getImageInfo(src: string): Promise<{
    width: number;
    height: number;
    path: string;
    orientation: string;
    type: string;
  }> {
    return this.promisify('getImageInfo', { src });
  }

  async saveImageToPhotosAlbum(filePath: string): Promise<void> {
    return this.promisify('saveImageToPhotosAlbum', { filePath });
  }

  async chooseVideo(options?: {
    sourceType?: string[];
    compressed?: boolean;
    maxDuration?: number;
    camera?: 'back' | 'front';
  }): Promise<{
    tempFilePath: string;
    duration: number;
    size: number;
    height: number;
    width: number;
  }> {
    return this.promisify('chooseVideo', options || {});
  }

  async saveVideoToPhotosAlbum(filePath: string): Promise<void> {
    return this.promisify('saveVideoToPhotosAlbum', { filePath });
  }

  async getRecorderManager(): any {
    if (typeof wx === 'undefined') throw new Error('wx对象不存在');
    return wx.getRecorderManager();
  }

  async getBackgroundAudioManager(): any {
    if (typeof wx === 'undefined') throw new Error('wx对象不存在');
    return wx.getBackgroundAudioManager();
  }
}

export const media = new MediaAPI();
