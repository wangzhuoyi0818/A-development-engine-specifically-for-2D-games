// 游戏角色属性模板系统

// 角色类型
export type GameRoleType =
  | 'player'      // 玩家角色
  | 'enemy'       // 敌人
  | 'npc'         // NPC
  | 'item'        // 道具/收集物
  | 'projectile'  // 子弹/投射物
  | 'obstacle'    // 障碍物
  | 'platform'    // 平台
  | 'trigger'     // 触发区域
  | 'decoration'  // 装饰物
  | 'ui';         // UI元素

// 角色属性定义
export interface GameRoleProperty {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select' | 'color';
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: unknown }[];
  group: string;  // 属性分组
  description?: string;
}

// 角色模板
export interface GameRoleTemplate {
  type: GameRoleType;
  name: string;
  icon: string;
  color: string;
  description: string;
  properties: GameRoleProperty[];
}

// 角色属性值
export interface GameRoleAttributes {
  roleType: GameRoleType;
  properties: Record<string, unknown>;
}

// ============ 角色模板定义 ============

export const GAME_ROLE_TEMPLATES: GameRoleTemplate[] = [
  // ========== 玩家角色 ==========
  {
    type: 'player',
    name: '玩家',
    icon: '🦸',
    color: '#52c41a',
    description: '玩家控制的主角',
    properties: [
      // 基础属性
      { key: 'hp', label: '生命值', type: 'number', defaultValue: 100, min: 1, max: 9999, group: '基础属性' },
      { key: 'maxHp', label: '最大生命', type: 'number', defaultValue: 100, min: 1, max: 9999, group: '基础属性' },
      { key: 'lives', label: '生命数', type: 'number', defaultValue: 3, min: 0, max: 99, group: '基础属性' },
      // 战斗属性
      { key: 'attack', label: '攻击力', type: 'number', defaultValue: 10, min: 0, max: 9999, group: '战斗属性' },
      { key: 'defense', label: '防御力', type: 'number', defaultValue: 5, min: 0, max: 9999, group: '战斗属性' },
      { key: 'attackSpeed', label: '攻击速度', type: 'number', defaultValue: 1, min: 0.1, max: 10, step: 0.1, group: '战斗属性' },
      { key: 'critRate', label: '暴击率%', type: 'number', defaultValue: 10, min: 0, max: 100, group: '战斗属性' },
      // 移动属性
      { key: 'moveSpeed', label: '移动速度', type: 'number', defaultValue: 5, min: 0, max: 50, group: '移动属性' },
      { key: 'jumpForce', label: '跳跃力', type: 'number', defaultValue: 10, min: 0, max: 50, group: '移动属性' },
      { key: 'canFly', label: '可飞行', type: 'boolean', defaultValue: false, group: '移动属性' },
      // 控制方式
      { key: 'controlType', label: '控制方式', type: 'select', defaultValue: 'keyboard', group: '控制设置', options: [
        { label: 'WASD键盘', value: 'keyboard' },
        { label: '方向键', value: 'arrows' },
        { label: '触摸滑动', value: 'touch' },
        { label: '点击移动', value: 'click' },
        { label: '自动', value: 'auto' },
      ]},
      // 碰撞设置
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'player', group: '碰撞设置' },
      { key: 'invincibleTime', label: '无敌时间(秒)', type: 'number', defaultValue: 1, min: 0, max: 10, step: 0.1, group: '碰撞设置' },
    ],
  },

  // ========== 敌人 ==========
  {
    type: 'enemy',
    name: '敌人',
    icon: '👾',
    color: '#ff4d4f',
    description: '对玩家造成伤害的敌对单位',
    properties: [
      // 基础属性
      { key: 'hp', label: '生命值', type: 'number', defaultValue: 30, min: 1, max: 9999, group: '基础属性' },
      { key: 'maxHp', label: '最大生命', type: 'number', defaultValue: 30, min: 1, max: 9999, group: '基础属性' },
      { key: 'showHpBar', label: '显示血条', type: 'boolean', defaultValue: true, group: '基础属性' },
      // 战斗属性
      { key: 'attack', label: '攻击力', type: 'number', defaultValue: 10, min: 0, max: 9999, group: '战斗属性' },
      { key: 'defense', label: '防御力', type: 'number', defaultValue: 2, min: 0, max: 9999, group: '战斗属性' },
      { key: 'attackRange', label: '攻击范围', type: 'number', defaultValue: 50, min: 0, max: 500, group: '战斗属性' },
      { key: 'attackCooldown', label: '攻击间隔(秒)', type: 'number', defaultValue: 1, min: 0.1, max: 10, step: 0.1, group: '战斗属性' },
      // 追踪设置
      { key: 'chasePlayer', label: '追踪玩家', type: 'boolean', defaultValue: false, group: '追踪设置', description: '是否在攻击范围内自动追踪玩家' },
      { key: 'chaseSpeed', label: '追踪速度', type: 'number', defaultValue: 1.5, min: 0, max: 10, step: 0.1, group: '追踪设置', description: '追踪玩家时的移动速度' },
      // 行为模式
      { key: 'aiType', label: 'AI类型', type: 'select', defaultValue: 'patrol', group: '行为模式', options: [
        { label: '巡逻', value: 'patrol' },
        { label: '原地守卫', value: 'guard' },
        { label: '随机移动', value: 'random' },
        { label: '静止', value: 'idle' },
      ]},
      { key: 'moveSpeed', label: '移动速度', type: 'number', defaultValue: 3, min: 0, max: 20, group: '行为模式' },
      // 掉落设置
      { key: 'dropScore', label: '掉落分数', type: 'number', defaultValue: 100, min: 0, max: 99999, group: '掉落设置' },
      { key: 'dropItem', label: '掉落道具', type: 'string', defaultValue: '', group: '掉落设置' },
      { key: 'dropRate', label: '掉落几率%', type: 'number', defaultValue: 50, min: 0, max: 100, group: '掉落设置' },
      // 碰撞设置
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'enemy', group: '碰撞设置' },
      { key: 'contactDamage', label: '接触伤害', type: 'number', defaultValue: 10, min: 0, max: 9999, group: '碰撞设置' },
    ],
  },

  // ========== NPC ==========
  {
    type: 'npc',
    name: 'NPC',
    icon: '👤',
    color: '#1890ff',
    description: '可交互的非玩家角色',
    properties: [
      { key: 'npcName', label: 'NPC名称', type: 'string', defaultValue: '村民', group: '基础信息' },
      { key: 'dialogue', label: '对话内容', type: 'string', defaultValue: '你好，冒险者！', group: '基础信息' },
      { key: 'canInteract', label: '可交互', type: 'boolean', defaultValue: true, group: '交互设置' },
      { key: 'interactRange', label: '交互范围', type: 'number', defaultValue: 50, min: 10, max: 200, group: '交互设置' },
      { key: 'showIndicator', label: '显示提示', type: 'boolean', defaultValue: true, group: '交互设置' },
      { key: 'movePattern', label: '移动模式', type: 'select', defaultValue: 'idle', group: '行为模式', options: [
        { label: '静止', value: 'idle' },
        { label: '闲逛', value: 'wander' },
        { label: '固定路线', value: 'path' },
      ]},
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'npc', group: '碰撞设置' },
    ],
  },

  // ========== 道具 ==========
  {
    type: 'item',
    name: '道具',
    icon: '💎',
    color: '#faad14',
    description: '可收集的物品',
    properties: [
      { key: 'itemType', label: '道具类型', type: 'select', defaultValue: 'coin', group: '基础设置', options: [
        { label: '金币', value: 'coin' },
        { label: '宝石', value: 'gem' },
        { label: '血瓶', value: 'health' },
        { label: '能量', value: 'energy' },
        { label: '钥匙', value: 'key' },
        { label: '装备', value: 'equipment' },
        { label: '道具', value: 'powerup' },
      ]},
      { key: 'value', label: '数值', type: 'number', defaultValue: 10, min: 0, max: 99999, group: '效果设置', description: '金币=分数，血瓶=回血量' },
      { key: 'effect', label: '特殊效果', type: 'select', defaultValue: 'none', group: '效果设置', options: [
        { label: '无', value: 'none' },
        { label: '加速', value: 'speed' },
        { label: '无敌', value: 'invincible' },
        { label: '双倍分数', value: 'double' },
        { label: '磁铁', value: 'magnet' },
      ]},
      { key: 'effectDuration', label: '效果持续(秒)', type: 'number', defaultValue: 5, min: 0, max: 60, group: '效果设置' },
      { key: 'autoCollect', label: '自动拾取', type: 'boolean', defaultValue: false, group: '收集设置' },
      { key: 'collectRange', label: '拾取范围', type: 'number', defaultValue: 30, min: 10, max: 200, group: '收集设置' },
      { key: 'respawn', label: '重生', type: 'boolean', defaultValue: false, group: '收集设置' },
      { key: 'respawnTime', label: '重生时间(秒)', type: 'number', defaultValue: 10, min: 1, max: 300, group: '收集设置' },
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'item', group: '碰撞设置' },
      { key: 'collectSound', label: '收集音效', type: 'string', defaultValue: 'coin', group: '音效设置' },
    ],
  },

  // ========== 子弹/投射物 ==========
  {
    type: 'projectile',
    name: '子弹',
    icon: '🔫',
    color: '#eb2f96',
    description: '可发射的投射物',
    properties: [
      { key: 'damage', label: '伤害', type: 'number', defaultValue: 10, min: 0, max: 9999, group: '基础属性' },
      { key: 'speed', label: '飞行速度', type: 'number', defaultValue: 10, min: 1, max: 50, group: '基础属性' },
      { key: 'lifetime', label: '存活时间(秒)', type: 'number', defaultValue: 3, min: 0.1, max: 30, step: 0.1, group: '基础属性' },
      { key: 'pierce', label: '穿透数量', type: 'number', defaultValue: 1, min: 1, max: 99, group: '战斗属性', description: '可穿透多少个敌人' },
      { key: 'knockback', label: '击退力', type: 'number', defaultValue: 5, min: 0, max: 50, group: '战斗属性' },
      { key: 'homing', label: '追踪', type: 'boolean', defaultValue: false, group: '行为设置' },
      { key: 'homingStrength', label: '追踪强度', type: 'number', defaultValue: 5, min: 1, max: 20, group: '行为设置' },
      { key: 'destroyOnHit', label: '命中后销毁', type: 'boolean', defaultValue: true, group: '行为设置' },
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'projectile', group: '碰撞设置' },
      { key: 'targetTag', label: '目标标签', type: 'string', defaultValue: 'enemy', group: '碰撞设置' },
    ],
  },

  // ========== 障碍物 ==========
  {
    type: 'obstacle',
    name: '障碍物',
    icon: '🧱',
    color: '#8c8c8c',
    description: '阻挡移动或造成伤害的物体',
    properties: [
      { key: 'obstacleType', label: '障碍类型', type: 'select', defaultValue: 'solid', group: '基础设置', options: [
        { label: '实体墙', value: 'solid' },
        { label: '尖刺', value: 'spike' },
        { label: '火焰', value: 'fire' },
        { label: '毒气', value: 'poison' },
        { label: '冰块', value: 'ice' },
      ]},
      { key: 'damage', label: '伤害', type: 'number', defaultValue: 10, min: 0, max: 9999, group: '伤害设置' },
      { key: 'damageInterval', label: '伤害间隔(秒)', type: 'number', defaultValue: 1, min: 0.1, max: 10, step: 0.1, group: '伤害设置' },
      { key: 'instantKill', label: '秒杀', type: 'boolean', defaultValue: false, group: '伤害设置' },
      { key: 'destructible', label: '可破坏', type: 'boolean', defaultValue: false, group: '物理设置' },
      { key: 'hp', label: '耐久度', type: 'number', defaultValue: 50, min: 1, max: 9999, group: '物理设置' },
      { key: 'pushable', label: '可推动', type: 'boolean', defaultValue: false, group: '物理设置' },
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'obstacle', group: '碰撞设置' },
    ],
  },

  // ========== 平台 ==========
  {
    type: 'platform',
    name: '平台',
    icon: '➖',
    color: '#722ed1',
    description: '可站立的平台',
    properties: [
      { key: 'platformType', label: '平台类型', type: 'select', defaultValue: 'solid', group: '基础设置', options: [
        { label: '实体平台', value: 'solid' },
        { label: '单向平台', value: 'oneway' },
        { label: '移动平台', value: 'moving' },
        { label: '消失平台', value: 'falling' },
        { label: '弹跳平台', value: 'bouncy' },
        { label: '传送带', value: 'conveyor' },
      ]},
      // 移动设置
      { key: 'moveDistance', label: '移动距离', type: 'number', defaultValue: 100, min: 0, max: 500, group: '移动设置' },
      { key: 'moveSpeed', label: '移动速度', type: 'number', defaultValue: 2, min: 0.1, max: 20, step: 0.1, group: '移动设置' },
      { key: 'moveDirection', label: '移动方向', type: 'select', defaultValue: 'horizontal', group: '移动设置', options: [
        { label: '水平', value: 'horizontal' },
        { label: '垂直', value: 'vertical' },
        { label: '圆形', value: 'circular' },
      ]},
      // 特殊效果
      { key: 'bounceForce', label: '弹跳力', type: 'number', defaultValue: 15, min: 0, max: 50, group: '特殊效果' },
      { key: 'conveyorSpeed', label: '传送速度', type: 'number', defaultValue: 3, min: -10, max: 10, group: '特殊效果' },
      { key: 'fallDelay', label: '下落延迟(秒)', type: 'number', defaultValue: 0.5, min: 0, max: 5, step: 0.1, group: '特殊效果' },
      { key: 'respawnTime', label: '重生时间(秒)', type: 'number', defaultValue: 3, min: 0, max: 30, group: '特殊效果' },
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'platform', group: '碰撞设置' },
    ],
  },

  // ========== 触发区域 ==========
  {
    type: 'trigger',
    name: '触发区域',
    icon: '🔲',
    color: '#13c2c2',
    description: '进入时触发事件的区域',
    properties: [
      { key: 'triggerType', label: '触发类型', type: 'select', defaultValue: 'enter', group: '基础设置', options: [
        { label: '进入触发', value: 'enter' },
        { label: '离开触发', value: 'exit' },
        { label: '停留触发', value: 'stay' },
      ]},
      { key: 'triggerOnce', label: '仅触发一次', type: 'boolean', defaultValue: false, group: '触发设置' },
      { key: 'triggerDelay', label: '触发延迟(秒)', type: 'number', defaultValue: 0, min: 0, max: 10, step: 0.1, group: '触发设置' },
      { key: 'triggerCooldown', label: '触发冷却(秒)', type: 'number', defaultValue: 0, min: 0, max: 60, group: '触发设置' },
      { key: 'triggerAction', label: '触发动作', type: 'select', defaultValue: 'message', group: '触发动作', options: [
        { label: '发送消息', value: 'message' },
        { label: '切换场景', value: 'scene' },
        { label: '显示对话', value: 'dialogue' },
        { label: '播放音效', value: 'sound' },
        { label: '添加分数', value: 'score' },
        { label: '游戏结束', value: 'gameover' },
        { label: '游戏胜利', value: 'win' },
      ]},
      { key: 'actionValue', label: '动作参数', type: 'string', defaultValue: '', group: '触发动作' },
      { key: 'visible', label: '可见', type: 'boolean', defaultValue: false, group: '显示设置' },
      { key: 'collisionTag', label: '碰撞标签', type: 'string', defaultValue: 'trigger', group: '碰撞设置' },
      { key: 'targetTag', label: '触发目标', type: 'string', defaultValue: 'player', group: '碰撞设置' },
    ],
  },

  // ========== 装饰物 ==========
  {
    type: 'decoration',
    name: '装饰',
    icon: '🌸',
    color: '#a0d911',
    description: '纯装饰性物体，无碰撞',
    properties: [
      { key: 'layer', label: '图层', type: 'select', defaultValue: 'background', group: '显示设置', options: [
        { label: '背景层', value: 'background' },
        { label: '前景层', value: 'foreground' },
      ]},
      { key: 'parallax', label: '视差效果', type: 'boolean', defaultValue: false, group: '显示设置' },
      { key: 'parallaxSpeed', label: '视差速度', type: 'number', defaultValue: 0.5, min: 0, max: 2, step: 0.1, group: '显示设置' },
      { key: 'animate', label: '动画', type: 'boolean', defaultValue: false, group: '动画设置' },
      { key: 'animationType', label: '动画类型', type: 'select', defaultValue: 'float', group: '动画设置', options: [
        { label: '漂浮', value: 'float' },
        { label: '旋转', value: 'rotate' },
        { label: '闪烁', value: 'blink' },
        { label: '缩放', value: 'pulse' },
      ]},
      { key: 'animationSpeed', label: '动画速度', type: 'number', defaultValue: 1, min: 0.1, max: 5, step: 0.1, group: '动画设置' },
    ],
  },

  // ========== UI元素 ==========
  {
    type: 'ui',
    name: 'UI元素',
    icon: '🖼️',
    color: '#2f54eb',
    description: '界面元素，如按钮、血条',
    properties: [
      { key: 'uiType', label: 'UI类型', type: 'select', defaultValue: 'button', group: '基础设置', options: [
        { label: '按钮', value: 'button' },
        { label: '血条', value: 'healthbar' },
        { label: '分数', value: 'score' },
        { label: '文本', value: 'text' },
        { label: '计时器', value: 'timer' },
        { label: '生命数', value: 'lives' },
        { label: '虚拟摇杆', value: 'joystick' },
      ]},
      { key: 'bindVariable', label: '绑定变量', type: 'string', defaultValue: '', group: '数据绑定' },
      { key: 'fixedPosition', label: '固定位置', type: 'boolean', defaultValue: true, group: '显示设置' },
      { key: 'anchor', label: '锚点', type: 'select', defaultValue: 'top-left', group: '显示设置', options: [
        { label: '左上', value: 'top-left' },
        { label: '顶部居中', value: 'top-center' },
        { label: '右上', value: 'top-right' },
        { label: '左侧居中', value: 'center-left' },
        { label: '居中', value: 'center' },
        { label: '右侧居中', value: 'center-right' },
        { label: '左下', value: 'bottom-left' },
        { label: '底部居中', value: 'bottom-center' },
        { label: '右下', value: 'bottom-right' },
      ]},
      { key: 'textContent', label: '文本内容', type: 'string', defaultValue: '', group: '内容设置' },
      { key: 'fontSize', label: '字体大小', type: 'number', defaultValue: 16, min: 8, max: 72, group: '样式设置' },
      { key: 'textColor', label: '文字颜色', type: 'color', defaultValue: '#ffffff', group: '样式设置' },
    ],
  },
];

// 获取角色模板
export function getRoleTemplate(type: GameRoleType): GameRoleTemplate | undefined {
  return GAME_ROLE_TEMPLATES.find(t => t.type === type);
}

// 创建默认角色属性
export function createDefaultRoleAttributes(type: GameRoleType): GameRoleAttributes {
  const template = getRoleTemplate(type);
  if (!template) {
    return { roleType: type, properties: {} };
  }

  const properties: Record<string, unknown> = {};
  template.properties.forEach(prop => {
    properties[prop.key] = prop.defaultValue;
  });

  return { roleType: type, properties };
}

// 按分组获取属性
export function getPropertiesByGroup(template: GameRoleTemplate): Record<string, GameRoleProperty[]> {
  const groups: Record<string, GameRoleProperty[]> = {};
  template.properties.forEach(prop => {
    if (!groups[prop.group]) {
      groups[prop.group] = [];
    }
    groups[prop.group].push(prop);
  });
  return groups;
}
