// 素材类型定义

// 素材分类
export type MaterialCategory =
  | 'character'    // 角色
  | 'scene'        // 场景
  | 'ui'           // UI
  | 'effect'       // 特效
  | 'sound'        // 音效
  | 'music'        // 音乐
  | 'animation'    // 动画
  | 'prop';        // 道具

// 素材类型
export type MaterialType =
  | 'image'
  | 'sprite'
  | 'spritesheet'
  | 'audio'
  | 'font'
  | 'video'
  | 'data';

// 素材格式
export type MaterialFormat =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'webp'
  | 'gif'
  | 'svg'
  | 'json'
  | 'mp3'
  | 'wav'
  | 'ogg'
  | 'ttf'
  | 'otf';

// 素材风格
export type MaterialStyle =
  | 'pixel'        // 像素风
  | 'cartoon'      // 卡通
  | 'realistic'    // 写实
  | 'minimalist'   // 简约
  | 'retro'        // 复古
  | 'flat'         // 扁平
  | 'handdrawn';   // 手绘

// 素材标签
export interface MaterialTag {
  id: string;
  name: string;
  color?: string;
}

// 素材项目
export interface MaterialItem {
  id: string;
  name: string;
  category: MaterialCategory;
  type: MaterialType;
  format: MaterialFormat;
  style?: MaterialStyle;
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number; // 音频/视频时长(秒)
  tags: MaterialTag[];
  size: number; // 文件大小(字节)
  author?: string; // 作者
  isOfficial: boolean; // 是否官方素材
  isPremium: boolean; // 是否付费
  usage?: number; // 使用次数
  rating?: number; // 评分
  createdAt: number;
  updatedAt: number;
}

// 素材包
export interface MaterialPack {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: MaterialCategory;
  style: MaterialStyle;
  materials: MaterialItem[];
  author: string;
  isOfficial: boolean;
  price?: number;
  downloadCount: number;
  rating: number;
  tags: MaterialTag[];
}

// 精灵表帧
export interface SpriteFrame {
  x: number;
  y: number;
  width: number;
  height: number;
  duration: number; // 毫秒
}

// 精灵表数据
export interface SpriteSheet {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  frames: SpriteFrame[];
  animations: {
    [key: string]: number[]; // 动画名 -> 帧索引数组
  };
}

// 音效数据
export interface SoundData {
  id: string;
  name: string;
  url: string;
  duration: number;
  format: 'mp3' | 'wav' | 'ogg';
  loop: boolean;
  volume: number;
}

// 动画序列
export interface AnimationSequence {
  id: string;
  name: string;
  fps: number;
  frames: string[]; // 帧图片URL数组
  loop: boolean;
}

// 素材分类配置
export const MATERIAL_CATEGORIES: { key: MaterialCategory; label: string; icon: string; color: string }[] = [
  { key: 'character', label: '角色', icon: '🎭', color: '#FF6B6B' },
  { key: 'scene', label: '场景', icon: '🏞️', color: '#4ECDC4' },
  { key: 'ui', label: 'UI', icon: '🖼️', color: '#45B7D1' },
  { key: 'effect', label: '特效', icon: '✨', color: '#FFA07A' },
  { key: 'sound', label: '音效', icon: '🔊', color: '#98D8C8' },
  { key: 'music', label: '音乐', icon: '🎵', color: '#F7DC6F' },
  { key: 'animation', label: '动画', icon: '🎬', color: '#BB8FCE' },
  { key: 'prop', label: '道具', icon: '💎', color: '#85C1E9' },
];

// 素材风格配置
export const MATERIAL_STYLES: { key: MaterialStyle; label: string; icon: string }[] = [
  { key: 'pixel', label: '像素风', icon: '👾' },
  { key: 'cartoon', label: '卡通', icon: '🎨' },
  { key: 'realistic', label: '写实', icon: '📷' },
  { key: 'minimalist', label: '简约', icon: '◻️' },
  { key: 'retro', label: '复古', icon: '🕹️' },
  { key: 'flat', label: '扁平', icon: '▢' },
  { key: 'handdrawn', label: '手绘', icon: '✏️' },
];

// 热门标签
export const POPULAR_TAGS: MaterialTag[] = [
  { id: 'platformer', name: '平台跳跃', color: '#FF6B6B' },
  { id: 'rpg', name: 'RPG', color: '#4ECDC4' },
  { id: 'shooter', name: '射击', color: '#45B7D1' },
  { id: 'casual', name: '休闲', color: '#FFA07A' },
  { id: 'puzzle', name: '益智', color: '#98D8C8' },
  { id: 'scifi', name: '科幻', color: '#BB8FCE' },
  { id: 'fantasy', name: '奇幻', color: '#F7DC6F' },
  { id: 'horror', name: '恐怖', color: '#85C1E9' },
  { id: 'sports', name: '体育', color: '#F8B739' },
  { id: 'racing', name: '竞速', color: '#E74C3C' },
];

// 官方示例素材数据
export const OFFICIAL_MATERIALS: MaterialItem[] = [
  // 角色
  {
    id: 'char_hero_001',
    name: '勇者-立姿',
    category: 'character',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/characters/hero_idle.png',
    thumbnail: '/materials/thumbnails/hero_idle.png',
    width: 32,
    height: 32,
    size: 1024,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[1]],
    isOfficial: true,
    isPremium: false,
    usage: 1520,
    rating: 4.8,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'char_enemy_001',
    name: '史莱姆',
    category: 'character',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/characters/slime.png',
    thumbnail: '/materials/thumbnails/slime.png',
    width: 24,
    height: 24,
    size: 768,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[1]],
    isOfficial: true,
    isPremium: false,
    usage: 2340,
    rating: 4.9,
    createdAt: Date.now() - 86400000 * 45,
    updatedAt: Date.now() - 86400000 * 5,
  },
  // 场景
  {
    id: 'scene_grass_001',
    name: '草地背景',
    category: 'scene',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/scenes/grass_bg.png',
    thumbnail: '/materials/thumbnails/grass_bg.png',
    width: 480,
    height: 320,
    size: 51200,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[4]],
    isOfficial: true,
    isPremium: false,
    usage: 3100,
    rating: 4.7,
    createdAt: Date.now() - 86400000 * 60,
    updatedAt: Date.now() - 86400000 * 15,
  },
  {
    id: 'scene_dungeon_001',
    name: '地牢背景',
    category: 'scene',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/scenes/dungeon_bg.png',
    thumbnail: '/materials/thumbnails/dungeon_bg.png',
    width: 480,
    height: 320,
    size: 64000,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[1]],
    isOfficial: true,
    isPremium: false,
    usage: 1890,
    rating: 4.6,
    createdAt: Date.now() - 86400000 * 50,
    updatedAt: Date.now() - 86400000 * 20,
  },
  // UI
  {
    id: 'ui_button_001',
    name: '通用按钮',
    category: 'ui',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/ui/button.png',
    thumbnail: '/materials/thumbnails/button.png',
    width: 120,
    height: 40,
    size: 2048,
    tags: [POPULAR_TAGS[4]],
    isOfficial: true,
    isPremium: false,
    usage: 4500,
    rating: 4.5,
    createdAt: Date.now() - 86400000 * 90,
    updatedAt: Date.now() - 86400000 * 30,
  },
  {
    id: 'ui_healthbar_001',
    name: '血条UI',
    category: 'ui',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/ui/healthbar.png',
    thumbnail: '/materials/thumbnails/healthbar.png',
    width: 200,
    height: 20,
    size: 1536,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[1]],
    isOfficial: true,
    isPremium: false,
    usage: 2800,
    rating: 4.7,
    createdAt: Date.now() - 86400000 * 75,
    updatedAt: Date.now() - 86400000 * 25,
  },
  // 特效
  {
    id: 'fx_explosion_001',
    name: '爆炸特效',
    category: 'effect',
    type: 'spritesheet',
    format: 'png',
    style: 'pixel',
    url: '/materials/effects/explosion.png',
    thumbnail: '/materials/thumbnails/explosion.png',
    width: 128,
    height: 128,
    size: 8192,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[2]],
    isOfficial: true,
    isPremium: false,
    usage: 1650,
    rating: 4.4,
    createdAt: Date.now() - 86400000 * 40,
    updatedAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'fx_particle_001',
    name: '粒子效果',
    category: 'effect',
    type: 'spritesheet',
    format: 'png',
    style: 'pixel',
    url: '/materials/effects/particle.png',
    thumbnail: '/materials/thumbnails/particle.png',
    width: 64,
    height: 64,
    size: 4096,
    tags: [POPULAR_TAGS[4]],
    isOfficial: true,
    isPremium: false,
    usage: 920,
    rating: 4.3,
    createdAt: Date.now() - 86400000 * 35,
    updatedAt: Date.now() - 86400000 * 8,
  },
  // 音效
  {
    id: 'sfx_jump_001',
    name: '跳跃音效',
    category: 'sound',
    type: 'audio',
    format: 'mp3',
    style: 'pixel',
    url: '/materials/sounds/jump.mp3',
    duration: 0.3,
    size: 8192,
    tags: [POPULAR_TAGS[0]],
    isOfficial: true,
    isPremium: false,
    usage: 5200,
    rating: 4.8,
    createdAt: Date.now() - 86400000 * 100,
    updatedAt: Date.now() - 86400000 * 50,
  },
  {
    id: 'sfx_coin_001',
    name: '金币音效',
    category: 'sound',
    type: 'audio',
    format: 'mp3',
    style: 'pixel',
    url: '/materials/sounds/coin.mp3',
    duration: 0.5,
    size: 10240,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[4]],
    isOfficial: true,
    isPremium: false,
    usage: 6100,
    rating: 4.9,
    createdAt: Date.now() - 86400000 * 110,
    updatedAt: Date.now() - 86400000 * 40,
  },
  // 道具
  {
    id: 'prop_coin_001',
    name: '金币',
    category: 'prop',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/props/coin.png',
    thumbnail: '/materials/thumbnails/coin.png',
    width: 16,
    height: 16,
    size: 512,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[4]],
    isOfficial: true,
    isPremium: false,
    usage: 7800,
    rating: 4.9,
    createdAt: Date.now() - 86400000 * 120,
    updatedAt: Date.now() - 86400000 * 60,
  },
  {
    id: 'prop_chest_001',
    name: '宝箱',
    category: 'prop',
    type: 'image',
    format: 'png',
    style: 'pixel',
    url: '/materials/props/chest.png',
    thumbnail: '/materials/thumbnails/chest.png',
    width: 32,
    height: 32,
    size: 2048,
    tags: [POPULAR_TAGS[0], POPULAR_TAGS[1]],
    isOfficial: true,
    isPremium: false,
    usage: 3400,
    rating: 4.7,
    createdAt: Date.now() - 86400000 * 80,
    updatedAt: Date.now() - 86400000 * 35,
  },
];

// 按分类获取素材
export function getMaterialsByCategory(category: MaterialCategory): MaterialItem[] {
  return OFFICIAL_MATERIALS.filter(m => m.category === category);
}

// 按标签获取素材
export function getMaterialsByTag(tagId: string): MaterialItem[] {
  return OFFICIAL_MATERIALS.filter(m => m.tags.some(t => t.id === tagId));
}

// 搜索素材
export function searchMaterials(query: string): MaterialItem[] {
  const lowerQuery = query.toLowerCase();
  return OFFICIAL_MATERIALS.filter(m =>
    m.name.toLowerCase().includes(lowerQuery) ||
    m.tags.some(t => t.name.toLowerCase().includes(lowerQuery))
  );
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 格式化时长
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(0);
  return `${mins}:${secs.padStart(2, '0')}`;
}
