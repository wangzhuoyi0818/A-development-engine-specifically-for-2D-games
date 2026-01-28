// 预置素材库 - 内置角色图片资源

import type { Resource, ResourceCategory } from './resource';

// 预置素材定义
export interface PresetAsset {
  name: string;
  originalName: string;
  path: string;
  category: ResourceCategory;
  tags: string[];
}

// 根据图片名称自动分类
function categorizeByName(name: string): { category: ResourceCategory; tags: string[] } {
  // 玩家/英雄类角色
  const playerKeywords = ['法师', '弓箭手', '战士', '忍者', '矿工', '精灵', '长老'];
  // 敌人/怪物类
  const enemyKeywords = ['蝙蝠', '哥布林', '僵尸', '骷髅', '小怪', '幽灵', '恐龙', '怪'];
  // NPC类
  const npcKeywords = ['村民', '商人', '老人', '机器人'];

  const lowerName = name.toLowerCase();

  for (const keyword of playerKeywords) {
    if (name.includes(keyword)) {
      return { category: 'player', tags: ['角色', '英雄', keyword] };
    }
  }

  for (const keyword of enemyKeywords) {
    if (name.includes(keyword)) {
      return { category: 'enemy', tags: ['敌人', '怪物', keyword] };
    }
  }

  for (const keyword of npcKeywords) {
    if (name.includes(keyword)) {
      return { category: 'npc', tags: ['NPC', keyword] };
    }
  }

  return { category: 'other', tags: [] };
}

// 预置素材列表 - 从 E:\创客new\图片 目录
export const PRESET_ASSETS: PresetAsset[] = [
  // 玩家/英雄类
  { name: '法师', originalName: '法师.png', path: '/assets/sprites/法师.png', ...categorizeByName('法师') },
  { name: '弓箭手', originalName: '弓箭手.png', path: '/assets/sprites/弓箭手.png', ...categorizeByName('弓箭手') },
  { name: '战士', originalName: '战士.png', path: '/assets/sprites/战士.png', ...categorizeByName('战士') },
  { name: '忍者', originalName: '忍者.png', path: '/assets/sprites/忍者.png', ...categorizeByName('忍者') },
  { name: '矿工', originalName: '矿工.png', path: '/assets/sprites/矿工.png', ...categorizeByName('矿工') },
  { name: '精灵弓箭手', originalName: '精灵弓箭手.png', path: '/assets/sprites/精灵弓箭手.png', ...categorizeByName('精灵弓箭手') },
  { name: '长老', originalName: '长老.png', path: '/assets/sprites/长老.png', ...categorizeByName('长老') },

  // 敌人/怪物类
  { name: '蝙蝠', originalName: '蝙蝠.png', path: '/assets/sprites/蝙蝠.png', ...categorizeByName('蝙蝠') },
  { name: '哥布林', originalName: '哥布林.png', path: '/assets/sprites/哥布林.png', ...categorizeByName('哥布林') },
  { name: '哥布林战士', originalName: '哥布林战士.png', path: '/assets/sprites/哥布林战士.png', ...categorizeByName('哥布林战士') },
  { name: '僵尸', originalName: '僵尸.png', path: '/assets/sprites/僵尸.png', ...categorizeByName('僵尸') },
  { name: '骷髅战士', originalName: '骷髅战士.png', path: '/assets/sprites/骷髅战士.png', ...categorizeByName('骷髅战士') },
  { name: '小怪', originalName: '小怪.png', path: '/assets/sprites/小怪.png', ...categorizeByName('小怪') },
  { name: '幽灵', originalName: '幽灵.png', path: '/assets/sprites/幽灵.png', ...categorizeByName('幽灵') },
  { name: '恐龙', originalName: '恐龙.png', path: '/assets/sprites/恐龙.png', ...categorizeByName('恐龙') },

  // NPC类
  { name: '机器人', originalName: '机器人.png', path: '/assets/sprites/机器人.png', category: 'npc', tags: ['NPC', '机器人'] },
];

// 分类配置
export const RESOURCE_CATEGORIES: { key: ResourceCategory; label: string; icon: string; color: string }[] = [
  { key: 'player', label: '玩家角色', icon: '🦸', color: '#52c41a' },
  { key: 'enemy', label: '敌人怪物', icon: '👾', color: '#ff4d4f' },
  { key: 'npc', label: 'NPC', icon: '👤', color: '#1890ff' },
  { key: 'item', label: '道具物品', icon: '💎', color: '#faad14' },
  { key: 'effect', label: '特效', icon: '✨', color: '#eb2f96' },
  { key: 'background', label: '背景', icon: '🏞️', color: '#722ed1' },
  { key: 'ui', label: 'UI元素', icon: '🖼️', color: '#2f54eb' },
  { key: 'tile', label: '地图块', icon: '🧱', color: '#8c8c8c' },
  { key: 'other', label: '其他', icon: '📁', color: '#595959' },
];

// 生成预置资源列表（用于导入到 resourceStore）
export function generatePresetResources(): Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>[] {
  return PRESET_ASSETS.map(asset => ({
    name: asset.name,
    type: 'image' as const,
    path: asset.path,
    originalName: asset.originalName,
    size: 0, // 实际大小需要从文件读取
    mimeType: 'image/png',
    category: asset.category,
    tags: asset.tags,
  }));
}

// 按分类获取预置素材
export function getPresetAssetsByCategory(category: ResourceCategory): PresetAsset[] {
  return PRESET_ASSETS.filter(a => a.category === category);
}
