// 行为预设系统 - 一键添加常用游戏行为

import { Block, BlockType, createBlock } from './block';

// 行为预设分类
export type BehaviorCategory =
  | 'movement'    // 移动控制
  | 'collision'   // 碰撞规则
  | 'spawn'       // 生成规则
  | 'game'        // 游戏规则
  | 'animation';  // 动画效果

// 行为预设定义
export interface BehaviorPreset {
  id: string;
  name: string;
  description: string;
  category: BehaviorCategory;
  icon: string;
  color: string;
  // 生成积木块的函数
  createBlocks: () => Block[];
  // 预览标签
  tags: string[];
}

// 行为分类配置
export const BEHAVIOR_CATEGORIES: { key: BehaviorCategory; label: string; icon: string; color: string }[] = [
  { key: 'movement', label: '移动控制', icon: '🎮', color: '#4C97FF' },
  { key: 'collision', label: '碰撞规则', icon: '💥', color: '#FF6680' },
  { key: 'spawn', label: '生成规则', icon: '✨', color: '#9966FF' },
  { key: 'game', label: '游戏规则', icon: '🎯', color: '#FFAB19' },
  { key: 'animation', label: '动画效果', icon: '🎬', color: '#5CB1D6' },
];

// 辅助函数：创建带值的积木
function createBlockWithValues(type: BlockType, values: Record<string, unknown>): Block | null {
  const block = createBlock(type);
  if (block) {
    block.values = { ...block.values, ...values };
  }
  return block;
}

// ============ 行为预设库 ============

export const BEHAVIOR_PRESETS: BehaviorPreset[] = [
  // ========== 移动控制类 ==========
  {
    id: 'keyboard_wasd',
    name: 'WASD键盘控制',
    description: '使用WASD或方向键控制角色上下左右移动',
    category: 'movement',
    icon: '⌨️',
    color: '#4C97FF',
    tags: ['玩家', '键盘', '移动'],
    createBlocks: () => {
      const blocks: Block[] = [];

      // 游戏开始事件
      const startBlock = createBlock('game_event_start');
      if (startBlock) blocks.push(startBlock);

      // 每帧检测按键
      const updateBlock = createBlock('game_event_update');
      if (updateBlock) blocks.push(updateBlock);

      // W/上 - 向上移动
      const keyW = createBlockWithValues('game_event_keydown', { key: 'KeyW' });
      const moveUp = createBlockWithValues('game_move', { x: 0, y: -5 });
      if (keyW) blocks.push(keyW);
      if (moveUp) blocks.push(moveUp);

      // S/下 - 向下移动
      const keyS = createBlockWithValues('game_event_keydown', { key: 'KeyS' });
      const moveDown = createBlockWithValues('game_move', { x: 0, y: 5 });
      if (keyS) blocks.push(keyS);
      if (moveDown) blocks.push(moveDown);

      // A/左 - 向左移动
      const keyA = createBlockWithValues('game_event_keydown', { key: 'KeyA' });
      const moveLeft = createBlockWithValues('game_move', { x: -5, y: 0 });
      if (keyA) blocks.push(keyA);
      if (moveLeft) blocks.push(moveLeft);

      // D/右 - 向右移动
      const keyD = createBlockWithValues('game_event_keydown', { key: 'KeyD' });
      const moveRight = createBlockWithValues('game_move', { x: 5, y: 0 });
      if (keyD) blocks.push(keyD);
      if (moveRight) blocks.push(moveRight);

      return blocks;
    },
  },
  {
    id: 'arrow_control',
    name: '方向键控制',
    description: '使用方向键控制角色移动',
    category: 'movement',
    icon: '↔️',
    color: '#4C97FF',
    tags: ['玩家', '方向键', '移动'],
    createBlocks: () => {
      const blocks: Block[] = [];

      // 上
      const keyUp = createBlockWithValues('game_event_keydown', { key: 'ArrowUp' });
      const moveUp = createBlockWithValues('game_move', { x: 0, y: -5 });
      if (keyUp) blocks.push(keyUp);
      if (moveUp) blocks.push(moveUp);

      // 下
      const keyDown = createBlockWithValues('game_event_keydown', { key: 'ArrowDown' });
      const moveDown = createBlockWithValues('game_move', { x: 0, y: 5 });
      if (keyDown) blocks.push(keyDown);
      if (moveDown) blocks.push(moveDown);

      // 左
      const keyLeft = createBlockWithValues('game_event_keydown', { key: 'ArrowLeft' });
      const moveLeft = createBlockWithValues('game_move', { x: -5, y: 0 });
      if (keyLeft) blocks.push(keyLeft);
      if (moveLeft) blocks.push(moveLeft);

      // 右
      const keyRight = createBlockWithValues('game_event_keydown', { key: 'ArrowRight' });
      const moveRight = createBlockWithValues('game_move', { x: 5, y: 0 });
      if (keyRight) blocks.push(keyRight);
      if (moveRight) blocks.push(moveRight);

      return blocks;
    },
  },
  {
    id: 'platform_jump',
    name: '平台跳跃',
    description: '左右移动 + 空格跳跃，适合平台游戏',
    category: 'movement',
    icon: '🦘',
    color: '#4C97FF',
    tags: ['玩家', '跳跃', '平台'],
    createBlocks: () => {
      const blocks: Block[] = [];

      // 启用物理
      const enablePhysics = createBlockWithValues('game_enablephysics', { enabled: true });
      if (enablePhysics) blocks.push(enablePhysics);

      // 设置重力
      const gravity = createBlockWithValues('game_setgravity', { gravity: 10 });
      if (gravity) blocks.push(gravity);

      // 左移
      const keyLeft = createBlockWithValues('game_event_keydown', { key: 'ArrowLeft' });
      const moveLeft = createBlockWithValues('game_move', { x: -5, y: 0 });
      if (keyLeft) blocks.push(keyLeft);
      if (moveLeft) blocks.push(moveLeft);

      // 右移
      const keyRight = createBlockWithValues('game_event_keydown', { key: 'ArrowRight' });
      const moveRight = createBlockWithValues('game_move', { x: 5, y: 0 });
      if (keyRight) blocks.push(keyRight);
      if (moveRight) blocks.push(moveRight);

      // 空格跳跃
      const keySpace = createBlockWithValues('game_event_keydown', { key: 'Space' });
      const jump = createBlockWithValues('game_applyforce', { fx: 0, fy: -200 });
      if (keySpace) blocks.push(keySpace);
      if (jump) blocks.push(jump);

      return blocks;
    },
  },
  {
    id: 'auto_patrol',
    name: '自动巡逻',
    description: '自动左右往返移动，碰到边缘反弹',
    category: 'movement',
    icon: '🔄',
    color: '#4C97FF',
    tags: ['敌人', 'NPC', '自动'],
    createBlocks: () => {
      const blocks: Block[] = [];

      // 游戏开始设置速度
      const start = createBlock('game_event_start');
      const setVelocity = createBlockWithValues('game_setvelocity', { vx: 3, vy: 0 });
      if (start) blocks.push(start);
      if (setVelocity) blocks.push(setVelocity);

      // 每帧检测并反弹
      const update = createBlock('game_event_update');
      const bounce = createBlock('game_bounce');
      if (update) blocks.push(update);
      if (bounce) blocks.push(bounce);

      return blocks;
    },
  },
  {
    id: 'follow_player',
    name: '追踪玩家',
    description: '自动向玩家位置移动',
    category: 'movement',
    icon: '🎯',
    color: '#4C97FF',
    tags: ['敌人', '追踪', 'AI'],
    createBlocks: () => {
      const blocks: Block[] = [];

      // 每帧执行追踪
      const update = createBlock('game_event_update');
      const pointTowards = createBlockWithValues('game_pointtowards', { x: 0, y: 0 });
      const move = createBlockWithValues('game_move', { x: 2, y: 0 });
      if (update) blocks.push(update);
      if (pointTowards) blocks.push(pointTowards);
      if (move) blocks.push(move);

      return blocks;
    },
  },
  {
    id: 'random_move',
    name: '随机移动',
    description: '随机方向移动，适合装饰物或小怪',
    category: 'movement',
    icon: '🎲',
    color: '#4C97FF',
    tags: ['敌人', '随机', 'NPC'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const update = createBlock('game_event_update');
      const rotate = createBlockWithValues('game_rotate', { angle: 5 });
      const move = createBlockWithValues('game_move', { x: 2, y: 0 });
      const bounce = createBlock('game_bounce');
      if (update) blocks.push(update);
      if (rotate) blocks.push(rotate);
      if (move) blocks.push(move);
      if (bounce) blocks.push(bounce);

      return blocks;
    },
  },

  // ========== 碰撞规则类 ==========
  {
    id: 'collision_score',
    name: '碰撞得分',
    description: '碰到指定物体时增加分数',
    category: 'collision',
    icon: '⭐',
    color: '#FF6680',
    tags: ['得分', '收集', '奖励'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const collision = createBlockWithValues('game_event_collision', { tag: '金币' });
      const addScore = createBlockWithValues('game_addscore', { amount: 10 });
      const playSound = createBlockWithValues('game_playsound', { sound: 'coin' });
      if (collision) blocks.push(collision);
      if (addScore) blocks.push(addScore);
      if (playSound) blocks.push(playSound);

      return blocks;
    },
  },
  {
    id: 'collision_damage',
    name: '碰撞扣血',
    description: '碰到敌人时减少生命值',
    category: 'collision',
    icon: '💔',
    color: '#FF6680',
    tags: ['伤害', '敌人', '生命'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const collision = createBlockWithValues('game_event_collision', { tag: '敌人' });
      const loseLife = createBlockWithValues('game_loselife', { amount: 1 });
      const shake = createBlockWithValues('game_shake', { intensity: 5, duration: 0.3 });
      const flash = createBlockWithValues('game_flash', { color: '#FF0000', duration: 0.2 });
      if (collision) blocks.push(collision);
      if (loseLife) blocks.push(loseLife);
      if (shake) blocks.push(shake);
      if (flash) blocks.push(flash);

      return blocks;
    },
  },
  {
    id: 'collision_destroy',
    name: '碰撞消失',
    description: '碰到后自己消失（用于子弹、收集物）',
    category: 'collision',
    icon: '💨',
    color: '#FF6680',
    tags: ['子弹', '消失', '销毁'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const collision = createBlockWithValues('game_event_collision', { tag: '' });
      const destroy = createBlock('game_destroy');
      if (collision) blocks.push(collision);
      if (destroy) blocks.push(destroy);

      return blocks;
    },
  },
  {
    id: 'collision_bounce',
    name: '碰撞反弹',
    description: '碰到边缘或物体时反弹',
    category: 'collision',
    icon: '🏓',
    color: '#FF6680',
    tags: ['反弹', '物理', '弹跳'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const update = createBlock('game_event_update');
      const bounce = createBlock('game_bounce');
      if (update) blocks.push(update);
      if (bounce) blocks.push(bounce);

      return blocks;
    },
  },

  // ========== 生成规则类 ==========
  {
    id: 'spawn_clone',
    name: '点击克隆',
    description: '点击时创建自己的克隆体',
    category: 'spawn',
    icon: '📋',
    color: '#9966FF',
    tags: ['克隆', '生成', '点击'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const tap = createBlock('event_tap');
      const clone = createBlock('game_clone');
      if (tap) blocks.push(tap);
      if (clone) blocks.push(clone);

      return blocks;
    },
  },
  {
    id: 'spawn_timer',
    name: '定时生成',
    description: '每隔一段时间自动生成克隆体',
    category: 'spawn',
    icon: '⏰',
    color: '#9966FF',
    tags: ['定时', '敌人', '生成'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const start = createBlock('game_event_start');
      const forever = createBlock('control_forever');
      const wait = createBlockWithValues('control_wait', { duration: 2 });
      const clone = createBlock('game_clone');
      if (start) blocks.push(start);
      if (forever) blocks.push(forever);
      if (wait) blocks.push(wait);
      if (clone) blocks.push(clone);

      return blocks;
    },
  },
  {
    id: 'clone_behavior',
    name: '克隆体行为',
    description: '克隆体出现后的默认行为',
    category: 'spawn',
    icon: '👶',
    color: '#9966FF',
    tags: ['克隆', '初始化'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const onClone = createBlock('game_event_clone');
      const show = createBlock('game_show');
      const moveRandom = createBlockWithValues('game_moveto', { x: 100, y: 100 });
      if (onClone) blocks.push(onClone);
      if (show) blocks.push(show);
      if (moveRandom) blocks.push(moveRandom);

      return blocks;
    },
  },

  // ========== 游戏规则类 ==========
  {
    id: 'game_init',
    name: '游戏初始化',
    description: '游戏开始时初始化分数和生命',
    category: 'game',
    icon: '🎮',
    color: '#FFAB19',
    tags: ['初始化', '开始', '设置'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const start = createBlock('game_event_start');
      const setScore = createBlockWithValues('game_setscore', { score: 0 });
      const setLives = createBlockWithValues('game_setlives', { lives: 3 });
      if (start) blocks.push(start);
      if (setScore) blocks.push(setScore);
      if (setLives) blocks.push(setLives);

      return blocks;
    },
  },
  {
    id: 'game_over_check',
    name: '游戏结束检测',
    description: '生命为0时游戏结束',
    category: 'game',
    icon: '🛑',
    color: '#FFAB19',
    tags: ['结束', '失败', '检测'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const update = createBlock('game_event_update');
      // 这里简化处理，实际需要条件判断
      const gameover = createBlock('game_gameover');
      if (update) blocks.push(update);
      if (gameover) blocks.push(gameover);

      return blocks;
    },
  },
  {
    id: 'countdown_timer',
    name: '倒计时',
    description: '设置游戏倒计时，时间到则结束',
    category: 'game',
    icon: '⏱️',
    color: '#FFAB19',
    tags: ['计时', '限时', '挑战'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const start = createBlock('game_event_start');
      const resetTimer = createBlock('game_resettimer');
      const timerEvent = createBlockWithValues('game_event_timer', { time: 60 });
      const gameover = createBlock('game_gameover');
      if (start) blocks.push(start);
      if (resetTimer) blocks.push(resetTimer);
      if (timerEvent) blocks.push(timerEvent);
      if (gameover) blocks.push(gameover);

      return blocks;
    },
  },
  {
    id: 'win_condition',
    name: '胜利条件',
    description: '达到指定分数时胜利',
    category: 'game',
    icon: '🏆',
    color: '#FFAB19',
    tags: ['胜利', '得分', '目标'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const update = createBlock('game_event_update');
      const toast = createBlockWithValues('action_toast', { title: '恭喜获胜！', icon: 'success' });
      if (update) blocks.push(update);
      if (toast) blocks.push(toast);

      return blocks;
    },
  },

  // ========== 动画效果类 ==========
  {
    id: 'spin_forever',
    name: '持续旋转',
    description: '不停地旋转',
    category: 'animation',
    icon: '🔄',
    color: '#5CB1D6',
    tags: ['旋转', '动画', '装饰'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const update = createBlock('game_event_update');
      const rotate = createBlockWithValues('game_rotate', { angle: 2 });
      if (update) blocks.push(update);
      if (rotate) blocks.push(rotate);

      return blocks;
    },
  },
  {
    id: 'pulse_effect',
    name: '脉冲缩放',
    description: '周期性放大缩小效果',
    category: 'animation',
    icon: '💓',
    color: '#5CB1D6',
    tags: ['缩放', '动画', '心跳'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const start = createBlock('game_event_start');
      const forever = createBlock('control_forever');
      const scaleUp = createBlockWithValues('game_setscale', { scale: 110 });
      const wait1 = createBlockWithValues('control_wait', { duration: 0.3 });
      const scaleDown = createBlockWithValues('game_setscale', { scale: 100 });
      const wait2 = createBlockWithValues('control_wait', { duration: 0.3 });
      if (start) blocks.push(start);
      if (forever) blocks.push(forever);
      if (scaleUp) blocks.push(scaleUp);
      if (wait1) blocks.push(wait1);
      if (scaleDown) blocks.push(scaleDown);
      if (wait2) blocks.push(wait2);

      return blocks;
    },
  },
  {
    id: 'fade_in_out',
    name: '淡入淡出',
    description: '透明度渐变动画',
    category: 'animation',
    icon: '🌓',
    color: '#5CB1D6',
    tags: ['透明', '动画', '渐变'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const start = createBlock('game_event_start');
      const fadeIn = createBlockWithValues('game_fadein', { duration: 1 });
      if (start) blocks.push(start);
      if (fadeIn) blocks.push(fadeIn);

      return blocks;
    },
  },
  {
    id: 'costume_animation',
    name: '造型动画',
    description: '自动切换造型形成动画',
    category: 'animation',
    icon: '🎭',
    color: '#5CB1D6',
    tags: ['造型', '动画', '帧动画'],
    createBlocks: () => {
      const blocks: Block[] = [];

      const update = createBlock('game_event_update');
      const nextCostume = createBlock('game_nextcostume');
      const wait = createBlockWithValues('control_wait', { duration: 0.1 });
      if (update) blocks.push(update);
      if (nextCostume) blocks.push(nextCostume);
      if (wait) blocks.push(wait);

      return blocks;
    },
  },
];

// 根据分类获取行为预设
export function getBehaviorsByCategory(category: BehaviorCategory): BehaviorPreset[] {
  return BEHAVIOR_PRESETS.filter(b => b.category === category);
}

// 根据ID获取行为预设
export function getBehaviorPreset(id: string): BehaviorPreset | undefined {
  return BEHAVIOR_PRESETS.find(b => b.id === id);
}

// 搜索行为预设
export function searchBehaviors(keyword: string): BehaviorPreset[] {
  const search = keyword.toLowerCase();
  return BEHAVIOR_PRESETS.filter(b =>
    b.name.toLowerCase().includes(search) ||
    b.description.toLowerCase().includes(search) ||
    b.tags.some(tag => tag.toLowerCase().includes(search))
  );
}
