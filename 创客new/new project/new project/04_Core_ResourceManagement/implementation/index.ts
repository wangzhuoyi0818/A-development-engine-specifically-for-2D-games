/**
 * 微信小程序可视化开发平台 - 资源管理模块
 *
 * 主导出文件
 */

// 导出类型
export * from './types';

// 导出资源管理器
export {
  ResourceManager,
  ResourceError,
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceValidationError,
} from './resource-manager';

// 导出资源加载器
export {
  ResourceLoader,
  ResourceLoadError,
  LoadTimeoutError,
} from './resource-loader';

// 导出存储适配器
export {
  LocalStorageAdapter,
  CloudStorageAdapter,
  HybridStorageAdapter,
  StorageAdapterError,
  UploadFailedError,
  DownloadFailedError,
  DeleteFailedError,
  FileNotFoundError,
} from './storage-adapter';

// 导出图片处理器
export {
  ImageProcessor,
  ImageProcessError,
  UnsupportedImageFormatError,
} from './image-processor';
