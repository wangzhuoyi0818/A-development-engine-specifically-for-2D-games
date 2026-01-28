/**
 * 微信小程序可视化开发平台 - 存储适配器
 *
 * 本文件实现了存储适配器接口和具体实现
 * 支持本地存储和云存储(微信云开发)
 */

import type {
  StorageAdapter,
  UploadOptions,
  FileInfo,
} from './types';

// ============================================================================
// 存储适配器错误
// ============================================================================

/**
 * 存储适配器错误
 */
export class StorageAdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StorageAdapterError';
  }
}

/**
 * 文件上传失败错误
 */
export class UploadFailedError extends StorageAdapterError {
  constructor(message: string, details?: any) {
    super(message, 'UPLOAD_FAILED', details);
    this.name = 'UploadFailedError';
  }
}

/**
 * 文件下载失败错误
 */
export class DownloadFailedError extends StorageAdapterError {
  constructor(message: string, details?: any) {
    super(message, 'DOWNLOAD_FAILED', details);
    this.name = 'DownloadFailedError';
  }
}

/**
 * 文件删除失败错误
 */
export class DeleteFailedError extends StorageAdapterError {
  constructor(message: string, details?: any) {
    super(message, 'DELETE_FAILED', details);
    this.name = 'DeleteFailedError';
  }
}

/**
 * 文件不存在错误
 */
export class FileNotFoundError extends StorageAdapterError {
  constructor(path: string) {
    super(`文件不存在: ${path}`, 'FILE_NOT_FOUND', { path });
    this.name = 'FileNotFoundError';
  }
}

// ============================================================================
// 本地存储适配器
// ============================================================================

/**
 * 本地存储适配器
 * 用于在小程序本地文件系统中存储资源
 *
 * 基于微信小程序的文件 API (wx.getFileSystemManager)
 */
export class LocalStorageAdapter implements StorageAdapter {
  readonly name = 'local';
  readonly type = 'local' as const;

  /** 本地文件系统基础路径 */
  private basePath: string;

  constructor(basePath: string = `${wx?.env?.USER_DATA_PATH || '/'}`) {
    this.basePath = basePath;
  }

  /**
   * 上传文件到本地存储
   *
   * @param filePath - 源文件路径
   * @param options - 上传选项
   * @returns 存储后的文件路径
   */
  async upload(
    filePath: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      const fs = this.getFileSystemManager();
      if (!fs) {
        throw new UploadFailedError('无法访问文件系统');
      }

      const targetDir = options?.targetDir || 'resources';
      const fileName = options?.fileName || this.getFileName(filePath);
      const targetPath = `${this.basePath}/${targetDir}/${fileName}`;

      // 确保目录存在
      await this.ensureDir(`${this.basePath}/${targetDir}`);

      // 读取源文件
      const fileData = fs.readFileSync(filePath);

      // 写入目标文件
      fs.writeFileSync(targetPath, fileData);

      return targetPath;
    } catch (error) {
      throw new UploadFailedError(
        `上传文件失败: ${error instanceof Error ? error.message : String(error)}`,
        { filePath, options, error }
      );
    }
  }

  /**
   * 从本地存储下载文件
   *
   * @param resourcePath - 资源路径
   * @param targetPath - 目标保存路径
   */
  async download(
    resourcePath: string,
    targetPath: string
  ): Promise<void> {
    try {
      const fs = this.getFileSystemManager();
      if (!fs) {
        throw new DownloadFailedError('无法访问文件系统');
      }

      // 检查源文件是否存在
      if (!fs.accessSync(resourcePath, {})) {
        throw new FileNotFoundError(resourcePath);
      }

      // 读取源文件
      const fileData = fs.readFileSync(resourcePath);

      // 确保目标目录存在
      const targetDir = this.getDirectoryPath(targetPath);
      await this.ensureDir(targetDir);

      // 写入目标文件
      fs.writeFileSync(targetPath, fileData);
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new DownloadFailedError(
        `下载文件失败: ${error instanceof Error ? error.message : String(error)}`,
        { resourcePath, targetPath, error }
      );
    }
  }

  /**
   * 删除本地存储中的文件
   *
   * @param resourcePath - 资源路径
   */
  async delete(resourcePath: string): Promise<void> {
    try {
      const fs = this.getFileSystemManager();
      if (!fs) {
        throw new DeleteFailedError('无法访问文件系统');
      }

      fs.unlinkSync(resourcePath);
    } catch (error) {
      throw new DeleteFailedError(
        `删除文件失败: ${error instanceof Error ? error.message : String(error)}`,
        { resourcePath, error }
      );
    }
  }

  /**
   * 获取文件信息
   *
   * @param resourcePath - 资源路径
   * @returns 文件信息
   */
  async getFileInfo(resourcePath: string): Promise<FileInfo> {
    try {
      const fs = this.getFileSystemManager();
      if (!fs) {
        throw new StorageAdapterError('无法访问文件系统', 'NO_FILE_SYSTEM');
      }

      // 检查文件是否存在
      if (!fs.accessSync(resourcePath, {})) {
        throw new FileNotFoundError(resourcePath);
      }

      // 获取文件状态
      const stats = fs.statSync(resourcePath);

      return {
        path: resourcePath,
        size: stats.size || 0,
        createTime: new Date(stats.mtimeMs || 0),
        modifyTime: new Date(stats.mtimeMs || 0),
      };
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new StorageAdapterError(
        `获取文件信息失败: ${error instanceof Error ? error.message : String(error)}`,
        'GET_FILE_INFO_FAILED',
        { resourcePath, error }
      );
    }
  }

  /**
   * 检查文件是否存在
   *
   * @param resourcePath - 资源路径
   * @returns 是否存在
   */
  async exists(resourcePath: string): Promise<boolean> {
    try {
      const fs = this.getFileSystemManager();
      if (!fs) {
        return false;
      }

      return fs.accessSync(resourcePath, {}) !== false;
    } catch {
      return false;
    }
  }

  // ========================================================================
  // 辅助方法
  // ========================================================================

  /**
   * 获取文件系统管理器
   * 在 Node.js 环境和小程序环境都能工作
   */
  private getFileSystemManager() {
    // 小程序环境
    if (typeof wx !== 'undefined' && wx.getFileSystemManager) {
      return wx.getFileSystemManager();
    }

    // Node.js 环境(用于测试)
    try {
      return require('fs');
    } catch {
      return null;
    }
  }

  /**
   * 确保目录存在
   *
   * @param dirPath - 目录路径
   */
  private async ensureDir(dirPath: string): Promise<void> {
    try {
      const fs = this.getFileSystemManager();
      if (!fs) {
        throw new StorageAdapterError('无法访问文件系统', 'NO_FILE_SYSTEM');
      }

      // 尝试创建目录(如果已存在则忽略)
      try {
        if (typeof fs.mkdirSync === 'function') {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      } catch {
        // 目录可能已存在,忽略
      }
    } catch (error) {
      console.warn('创建目录失败:', error);
    }
  }

  /**
   * 获取文件名
   *
   * @param path - 文件路径
   * @returns 文件名
   */
  private getFileName(path: string): string {
    return path.split(/[\\/]/).pop() || 'file';
  }

  /**
   * 获取目录路径
   *
   * @param path - 文件路径
   * @returns 目录路径
   */
  private getDirectoryPath(path: string): string {
    return path.split(/[\\/]/).slice(0, -1).join('/');
  }
}

// ============================================================================
// 云存储适配器
// ============================================================================

/**
 * 云存储适配器
 * 用于在微信云开发存储中存储资源
 *
 * 基于微信云开发 API (wx.cloud.uploadFile 等)
 */
export class CloudStorageAdapter implements StorageAdapter {
  readonly name = 'cloud';
  readonly type = 'cloud' as const;

  /** 云环境ID */
  private envId: string;

  /** 云存储路径前缀 */
  private pathPrefix: string;

  constructor(envId: string, pathPrefix: string = 'resources') {
    this.envId = envId;
    this.pathPrefix = pathPrefix;
  }

  /**
   * 上传文件到云存储
   *
   * @param filePath - 本地文件路径
   * @param options - 上传选项
   * @returns 云文件ID (cloud://...)
   */
  async upload(
    filePath: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      if (typeof wx === 'undefined' || !wx.cloud) {
        throw new UploadFailedError('无法访问微信云开发 API');
      }

      const fileName = options?.fileName || this.getFileName(filePath);
      const cloudPath = `${this.pathPrefix}/${Date.now()}-${fileName}`;

      const result = await (wx.cloud.uploadFile as any)({
        cloudPath,
        filePath,
      });

      if (!result.fileID) {
        throw new UploadFailedError('上传文件未返回文件ID');
      }

      return result.fileID;
    } catch (error) {
      throw new UploadFailedError(
        `上传文件到云存储失败: ${error instanceof Error ? error.message : String(error)}`,
        { filePath, options, error }
      );
    }
  }

  /**
   * 从云存储下载文件
   *
   * @param resourcePath - 云文件ID
   * @param targetPath - 本地目标路径
   */
  async download(
    resourcePath: string,
    targetPath: string
  ): Promise<void> {
    try {
      if (typeof wx === 'undefined' || !wx.cloud) {
        throw new DownloadFailedError('无法访问微信云开发 API');
      }

      // 检查是否是有效的云文件ID
      if (!resourcePath.startsWith('cloud://')) {
        throw new DownloadFailedError(
          `无效的云文件ID: ${resourcePath}`
        );
      }

      const result = await (wx.cloud.downloadFile as any)({
        fileID: resourcePath,
      });

      if (!result.tempFilePath) {
        throw new DownloadFailedError('下载文件未返回临时路径');
      }

      // 如果需要保存到指定路径,则复制文件
      if (targetPath !== result.tempFilePath) {
        const fs = this.getFileSystemManager();
        if (fs && typeof fs.copyFileSync === 'function') {
          fs.copyFileSync(result.tempFilePath, targetPath);
        }
      }
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new DownloadFailedError(
        `从云存储下载文件失败: ${error instanceof Error ? error.message : String(error)}`,
        { resourcePath, targetPath, error }
      );
    }
  }

  /**
   * 删除云存储中的文件
   *
   * @param resourcePath - 云文件ID
   */
  async delete(resourcePath: string): Promise<void> {
    try {
      if (typeof wx === 'undefined' || !wx.cloud) {
        throw new DeleteFailedError('无法访问微信云开发 API');
      }

      // 检查是否是有效的云文件ID
      if (!resourcePath.startsWith('cloud://')) {
        throw new DeleteFailedError(
          `无效的云文件ID: ${resourcePath}`
        );
      }

      await (wx.cloud.deleteFile as any)({
        fileList: [resourcePath],
      });
    } catch (error) {
      throw new DeleteFailedError(
        `删除云存储中的文件失败: ${error instanceof Error ? error.message : String(error)}`,
        { resourcePath, error }
      );
    }
  }

  /**
   * 获取云文件信息
   *
   * @param resourcePath - 云文件ID
   * @returns 文件信息
   */
  async getFileInfo(resourcePath: string): Promise<FileInfo> {
    try {
      if (typeof wx === 'undefined' || !wx.cloud) {
        throw new StorageAdapterError('无法访问微信云开发 API', 'NO_CLOUD_API');
      }

      // 检查是否是有效的云文件ID
      if (!resourcePath.startsWith('cloud://')) {
        throw new StorageAdapterError(
          `无效的云文件ID: ${resourcePath}`,
          'INVALID_CLOUD_ID'
        );
      }

      // 微信云开发暂不支持直接获取文件元数据
      // 这里返回基本信息
      return {
        path: resourcePath,
        size: 0, // 无法获取
        createTime: new Date(),
        modifyTime: new Date(),
      };
    } catch (error) {
      if (error instanceof StorageAdapterError) {
        throw error;
      }
      throw new StorageAdapterError(
        `获取云文件信息失败: ${error instanceof Error ? error.message : String(error)}`,
        'GET_FILE_INFO_FAILED',
        { resourcePath, error }
      );
    }
  }

  /**
   * 检查云文件是否存在
   *
   * @param resourcePath - 云文件ID
   * @returns 是否存在
   */
  async exists(resourcePath: string): Promise<boolean> {
    try {
      if (typeof wx === 'undefined' || !wx.cloud) {
        return false;
      }

      // 检查是否是有效的云文件ID
      if (!resourcePath.startsWith('cloud://')) {
        return false;
      }

      // 尝试获取文件信息来检查是否存在
      await this.getFileInfo(resourcePath);
      return true;
    } catch {
      return false;
    }
  }

  // ========================================================================
  // 辅助方法
  // ========================================================================

  /**
   * 获取文件系统管理器
   */
  private getFileSystemManager() {
    if (typeof wx !== 'undefined' && wx.getFileSystemManager) {
      return wx.getFileSystemManager();
    }
    return null;
  }

  /**
   * 获取文件名
   *
   * @param path - 文件路径
   * @returns 文件名
   */
  private getFileName(path: string): string {
    return path.split(/[\\/]/).pop() || 'file';
  }
}

// ============================================================================
// 混合存储适配器
// ============================================================================

/**
 * 混合存储适配器
 * 同时支持本地和云存储,提供自动选择和故障转移
 */
export class HybridStorageAdapter implements StorageAdapter {
  readonly name = 'hybrid';
  readonly type = 'local' as const;

  private localAdapter: LocalStorageAdapter;
  private cloudAdapter: CloudStorageAdapter;
  private preferCloud: boolean;

  constructor(cloudEnvId: string, preferCloud: boolean = false) {
    this.localAdapter = new LocalStorageAdapter();
    this.cloudAdapter = new CloudStorageAdapter(cloudEnvId);
    this.preferCloud = preferCloud;
  }

  /**
   * 上传文件
   * 优先使用首选存储,失败时自动转移到另一个
   */
  async upload(
    filePath: string,
    options?: UploadOptions
  ): Promise<string> {
    if (this.preferCloud) {
      try {
        return await this.cloudAdapter.upload(filePath, options);
      } catch (cloudError) {
        console.warn('云存储上传失败,尝试本地存储:', cloudError);
        return await this.localAdapter.upload(filePath, options);
      }
    } else {
      try {
        return await this.localAdapter.upload(filePath, options);
      } catch (localError) {
        console.warn('本地存储上传失败,尝试云存储:', localError);
        return await this.cloudAdapter.upload(filePath, options);
      }
    }
  }

  /**
   * 下载文件
   */
  async download(
    resourcePath: string,
    targetPath: string
  ): Promise<void> {
    const isCloudPath = resourcePath.startsWith('cloud://');

    if (isCloudPath) {
      return await this.cloudAdapter.download(resourcePath, targetPath);
    } else {
      return await this.localAdapter.download(resourcePath, targetPath);
    }
  }

  /**
   * 删除文件
   */
  async delete(resourcePath: string): Promise<void> {
    const isCloudPath = resourcePath.startsWith('cloud://');

    if (isCloudPath) {
      return await this.cloudAdapter.delete(resourcePath);
    } else {
      return await this.localAdapter.delete(resourcePath);
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(resourcePath: string): Promise<FileInfo> {
    const isCloudPath = resourcePath.startsWith('cloud://');

    if (isCloudPath) {
      return await this.cloudAdapter.getFileInfo(resourcePath);
    } else {
      return await this.localAdapter.getFileInfo(resourcePath);
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(resourcePath: string): Promise<boolean> {
    const isCloudPath = resourcePath.startsWith('cloud://');

    if (isCloudPath) {
      return await this.cloudAdapter.exists(resourcePath);
    } else {
      return await this.localAdapter.exists(resourcePath);
    }
  }
}
