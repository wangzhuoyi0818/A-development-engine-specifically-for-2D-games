/**
 * 微信小程序可视化开发平台 - 转发分享API封装
 */

import { APIWrapper } from '../api-wrapper';

export class ShareAPI extends APIWrapper {
  async showShareMenu(options?: {
    withShareTicket?: boolean;
    menus?: string[];
  }): Promise<void> {
    return this.promisify('showShareMenu', options || {});
  }

  async hideShareMenu(): Promise<void> {
    return this.promisify('hideShareMenu', {});
  }

  async updateShareMenu(options: {
    withShareTicket?: boolean;
    isUpdatableMessage?: boolean;
    activityId?: string;
    templateInfo?: any;
  }): Promise<void> {
    return this.promisify('updateShareMenu', options);
  }

  async getShareInfo(options: {
    shareTicket: string;
    timeout?: number;
  }): Promise<{
    errMsg: string;
    encryptedData: string;
    iv: string;
    cloudID?: string;
  }> {
    return this.promisify('getShareInfo', options);
  }
}

export const share = new ShareAPI();
