/**
 * 微信小程序可视化开发平台 - 资源管理类型定义
 *
 * 本文件定义了资源管理模块的所有 TypeScript 类型接口
 * 参考 GDevelop 的 ResourcesManager,适配微信小程序特性
 */

// ============================================================================
// 资源类型枚举
// ============================================================================

/**
 * 资源类型枚举
 * 对应微信小程序支持的各种资源类型
 */
export enum ResourceType {
  /** 图片资源 (jpg, png, gif, svg) */
  Image = 'image',

  /** 音频资源 (mp3, wav, aac, m4a) */
  Audio = 'audio',

  /** 视频资源 (mp4) */
  Video = 'video',

  /** 字体资源 (ttf, otf, woff) */
  Font = 'font',

  /** 数据资源 (json) */
  Data = 'data',
}

/**
 * 资源路径类型
 */
export enum ResourcePathType {
  /** 本地临时文件路径 */
  Local = 'local',

  /** 云存储文件ID */
  Cloud = 'cloud',

  /** 网络URL */
  Network = 'network',
}

// ============================================================================
// 资源接口定义
// ============================================================================

/**
 * 资源元数据接口
 * 存储资源的额外信息
 */
export interface ResourceMetadata {
  /** 文件格式/扩展名 */
  format?: string;

  /** 图片宽度 (像素) */
  width?: number;

  /** 图片高度 (像素) */
  height?: number;

  /** 音频/视频时长 (秒) */
  duration?: number;

  /** 比特率 (kbps) */
  bitrate?: number;

  /** 采样率 (Hz) */
  sampleRate?: number;

  /** 是否已压缩 */
  compressed?: boolean;

  /** 压缩质量 (0-100) */
  quality?: number;

  /** 额外自定义数据 */
  [key: string]: any;
}

/**
 * 资源接口
 * 表示项目中的一个资源
 */
export interface Resource {
  /** 资源唯一标识 (UUID) */
  id: string;

  /** 资源名称 (用户可见) */
  name: string;

  /** 资源类型 */
  type: ResourceType;

  /** 资源路径 */
  path: string;

  /** 路径类型 */
  pathType: ResourcePathType;

  /** 文件大小 (字节) */
  size: number;

  /** 资源元数据 */
  metadata: ResourceMetadata;

  /** 资源标签 (用于分类) */
  tags?: string[];

  /** 创建时间 */
  createdAt: Date;

  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 资源创建选项
 */
export interface ResourceCreateOptions {
  /** 资源名称 */
  name: string;

  /** 资源类型 */
  type: ResourceType;

  /** 资源路径 */
  path: string;

  /** 路径类型 (可选,会自动检测) */
  pathType?: ResourcePathType;

  /** 文件大小 */
  size: number;

  /** 元数据 (可选) */
  metadata?: ResourceMetadata;

  /** 标签 (可选) */
  tags?: string[];
}

/**
 * 资源更新选项
 */
export interface ResourceUpdateOptions {
  /** 新名称 */
  name?: string;

  /** 新路径 */
  path?: string;

  /** 新元数据 */
  metadata?: Partial<ResourceMetadata>;

  /** 新标签 */
  tags?: string[];
}

/**
 * 资源查询条件
 */
export interface ResourceQuery {
  /** 按类型筛选 */
  type?: ResourceType;

  /** 按标签筛选 */
  tags?: string[];

  /** 按名称搜索 (模糊匹配) */
  namePattern?: string;

  /** 最小文件大小 */
  minSize?: number;

  /** 最大文件大小 */
  maxSize?: number;
}

// ============================================================================
// 存储适配器接口
// ============================================================================

/**
 * 存储适配器接口
 * 定义存储操作的标准接口
 */
export interface StorageAdapter {
  /** 适配器名称 */
  readonly name: string;

  /** 适配器类型 */
  readonly type: 'local' | 'cloud';

  /**
   * 上传文件
   * @param filePath 本地文件路径
   * @param options 上传选项
   * @returns 上传后的资源路径
   */
  upload(filePath: string, options?: UploadOptions): Promise<string>;

  /**
   * 下载文件
   * @param resourcePath 资源路径
   * @param targetPath 目标保存路径
   */
  download(resourcePath: string, targetPath: string): Promise<void>;

  /**
   * 删除文件
   * @param resourcePath 资源路径
   */
  delete(resourcePath: string): Promise<void>;

  /**
   * 获取文件信息
   * @param resourcePath 资源路径
   */
  getFileInfo(resourcePath: string): Promise<FileInfo>;

  /**
   * 检查文件是否存在
   * @param resourcePath 资源路径
   */
  exists(resourcePath: string): Promise<boolean>;
}

/**
 * 上传选项
 */
export interface UploadOptions {
  /** 目标目录 */
  targetDir?: string;

  /** 文件名 (不指定则使用原文件名) */
  fileName?: string;

  /** 是否覆盖已存在文件 */
  overwrite?: boolean;

  /** 上传进度回调 */
  onProgress?: (progress: number) => void;
}

/**
 * 文件信息
 */
export interface FileInfo {
  /** 文件路径 */
  path: string;

  /** 文件大小 (字节) */
  size: number;

  /** 创建时间 */
  createTime: Date;

  /** 修改时间 */
  modifyTime: Date;
}

// ============================================================================
// 图片处理接口
// ============================================================================

/**
 * 图片处理选项
 */
export interface ImageProcessOptions {
  /** 目标宽度 */
  width?: number;

  /** 目标高度 */
  height?: number;

  /** 压缩质量 (0-100) */
  quality?: number;

  /** 输出格式 */
  format?: 'jpg' | 'png';
}

/**
 * 图片裁剪选项
 */
export interface ImageCropOptions {
  /** 裁剪起始 X 坐标 */
  x: number;

  /** 裁剪起始 Y 坐标 */
  y: number;

  /** 裁剪宽度 */
  width: number;

  /** 裁剪高度 */
  height: number;
}

/**
 * 图片信息
 */
export interface ImageInfo {
  /** 宽度 */
  width: number;

  /** 高度 */
  height: number;

  /** 格式 */
  format: string;

  /** 文件大小 */
  size: number;

  /** 方向 (1-8, EXIF orientation) */
  orientation?: number;
}

// ============================================================================
// 资源验证接口
// ============================================================================

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;

  /** 错误列表 */
  errors: ValidationError[];

  /** 警告列表 */
  warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误字段 */
  field?: string;

  /** 额外信息 */
  details?: any;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;

  /** 警告消息 */
  message: string;

  /** 警告字段 */
  field?: string;
}

// ============================================================================
// 资源加载接口
// ============================================================================

/**
 * 资源加载选项
 */
export interface ResourceLoadOptions {
  /** 是否使用缓存 */
  useCache?: boolean;

  /** 超时时间 (毫秒) */
  timeout?: number;

  /** 加载进度回调 */
  onProgress?: (progress: number) => void;
}

/**
 * 预加载选项
 */
export interface PreloadOptions {
  /** 最大并发数 */
  concurrency?: number;

  /** 预加载优先级 */
  priority?: 'high' | 'normal' | 'low';

  /** 预加载完成回调 */
  onComplete?: (results: PreloadResult[]) => void;
}

/**
 * 预加载结果
 */
export interface PreloadResult {
  /** 资源ID */
  resourceId: string;

  /** 是否成功 */
  success: boolean;

  /** 错误信息 (如果失败) */
  error?: string;

  /** 加载耗时 (毫秒) */
  duration: number;
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * 资源大小限制 (字节)
 */
export const RESOURCE_SIZE_LIMITS = {
  [ResourceType.Image]: 10 * 1024 * 1024, // 10MB
  [ResourceType.Audio]: 10 * 1024 * 1024, // 10MB
  [ResourceType.Video]: 50 * 1024 * 1024, // 50MB
  [ResourceType.Font]: 5 * 1024 * 1024,   // 5MB
  [ResourceType.Data]: 5 * 1024 * 1024,   // 5MB
} as const;

/**
 * 支持的文件格式
 */
export const SUPPORTED_FORMATS = {
  [ResourceType.Image]: ['jpg', 'jpeg', 'png', 'gif', 'svg'],
  [ResourceType.Audio]: ['mp3', 'wav', 'aac', 'm4a'],
  [ResourceType.Video]: ['mp4'],
  [ResourceType.Font]: ['ttf', 'otf', 'woff', 'woff2'],
  [ResourceType.Data]: ['json'],
} as const;

/**
 * 默认压缩质量
 */
export const DEFAULT_COMPRESSION_QUALITY = 80;

/**
 * 最大资源名称长度
 */
export const MAX_RESOURCE_NAME_LENGTH = 100;
