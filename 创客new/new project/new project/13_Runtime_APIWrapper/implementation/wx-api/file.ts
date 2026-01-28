/**
 * 微信小程序可视化开发平台 - 文件API封装
 */

import { APIWrapper } from '../api-wrapper';

export class FileAPI extends APIWrapper {
  async saveFile(tempFilePath: string): Promise<{ savedFilePath: string }> {
    return this.promisify('saveFile', { tempFilePath });
  }

  async getSavedFileList(): Promise<{ fileList: Array<{ filePath: string; size: number; createTime: number }> }> {
    return this.promisify('getSavedFileList', {});
  }

  async getSavedFileInfo(filePath: string): Promise<{ size: number; createTime: number }> {
    return this.promisify('getSavedFileInfo', { filePath });
  }

  async removeSavedFile(filePath: string): Promise<void> {
    return this.promisify('removeSavedFile', { filePath });
  }

  async openDocument(options: {
    filePath: string;
    fileType?: string;
    showMenu?: boolean;
  }): Promise<void> {
    return this.promisify('openDocument', options);
  }

  getFileSystemManager(): any {
    if (typeof wx === 'undefined') throw new Error('wx对象不存在');
    return wx.getFileSystemManager();
  }
}

export const file = new FileAPI();
