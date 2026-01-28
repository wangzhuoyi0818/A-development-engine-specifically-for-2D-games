// 资源类型定义
export type ResourceType = 'image' | 'audio' | 'video' | 'font' | 'json' | 'file';

// 资源分类标签
export type ResourceCategory =
  | 'player'      // 玩家角色
  | 'enemy'       // 敌人/怪物
  | 'npc'         // NPC
  | 'item'        // 道具
  | 'effect'      // 特效
  | 'background'  // 背景
  | 'ui'          // UI元素
  | 'tile'        // 地图块
  | 'other';      // 其他

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  path: string;
  originalName: string;
  size: number;
  mimeType?: string;
  width?: number;  // 图片宽度
  height?: number; // 图片高度
  duration?: number; // 音视频时长
  thumbnail?: string;
  category?: ResourceCategory; // 资源分类
  tags?: string[]; // 标签
  createdAt: number;
  updatedAt: number;
}

export interface ResourceFolder {
  id: string;
  name: string;
  parentId: string | null;
  children: (Resource | ResourceFolder)[];
}

export interface ResourceManager {
  resources: Resource[];
  folders: ResourceFolder[];
  selectedResourceId: string | null;
}

// 资源上传配置
export interface UploadConfig {
  maxSize: number;       // 最大文件大小（字节）
  allowedTypes: string[]; // 允许的 MIME 类型
  autoCompress: boolean; // 是否自动压缩图片
  compressQuality: number; // 压缩质量 0-1
}

// 默认上传配置
export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
  autoCompress: true,
  compressQuality: 0.8,
};

// 资源分类图标映射
export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  image: 'PictureOutlined',
  audio: 'SoundOutlined',
  video: 'VideoCameraOutlined',
  font: 'FontSizeOutlined',
  json: 'FileTextOutlined',
  file: 'FileOutlined',
};
