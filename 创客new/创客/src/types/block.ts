// 积木块类型定义 - 全新10大模块架构

// 积木块基础类型
export interface Block {
  id: string;
  type: BlockType;
  category: BlockCategory;
  name: string;
  inputs: BlockInput[];
  outputs?: BlockOutput[];
  next?: string; // 下一个块的ID
  parent?: string; // 父块ID
  values: Record<string, unknown>;
}

// 积木类别 - 10大核心模块
export type BlockCategory =
  | 'state'         // 状态管理 - 粉红色
  | 'event'         // 事件系统 - 金黄色
  | 'motion'        // 运动控制 - 天蓝色
  | 'looks'         // 外观与声音 - 紫色
  | 'sensing'       // 侦测与物理 - 青蓝色
  | 'effects'       // 特效系统 - 紫红色
  | 'logic'         // 逻辑运算 - 靛蓝色
  | 'data'          // 运算与数据结构 - 橙色
  | 'storage'       // 数据存储 - 棕色
  | 'extension';    // 扩展功能 - 绿色

// 积木类型
export type BlockType =
  // ========== 状态管理模块 ==========
  | 'state_setscore'           // 设置得分
  | 'state_addscore'           // 增加得分
  | 'state_getscore'           // 获取得分
  | 'state_setlives'           // 设置生命值
  | 'state_addlives'           // 增加生命值
  | 'state_getlives'           // 获取生命值
  | 'state_gotoscene'          // 跳转场景
  | 'state_gotorandomscene'    // 随机跳转场景（排除当前场景）
  | 'state_sethighscore'       // 记录最高分
  | 'state_gethighscore'       // 获取最高分
  | 'state_resetstate'         // 重置所有状态
  | 'state_setcharstate'       // 设置角色状态
  | 'state_getcharstate'       // 获取角色状态
  | 'state_savestate'          // 保存状态到本地
  | 'state_loadstate'          // 从本地加载状态

  // ========== 事件系统模块 ==========
  | 'event_click'              // 当点击时
  | 'event_keypress'           // 当按键时
  | 'event_sceneinit'          // 场景初始化时
  | 'event_timer'              // 定时触发
  | 'event_collision'          // 碰撞触发
  | 'event_dragstart'          // 开始拖拽
  | 'event_dragend'            // 结束拖拽
  | 'event_message'            // 收到消息时

  // ========== 运动控制模块 ==========
  | 'motion_move'              // 定向移动
  | 'motion_rotate'            // 旋转
  | 'motion_moveto'            // 瞬移到坐标
  | 'motion_easeto'            // 缓动移动
  | 'motion_followpath'        // 沿路径运动
  | 'motion_setgravity'        // 设置重力
  | 'motion_setvelocity'       // 设置速度
  | 'motion_followtarget'      // 跟随目标

  // ========== 外观与声音模块 ==========
  | 'looks_showbubble'         // 显示对话气泡
  | 'looks_setcostume'         // 切换造型
  | 'looks_playsound'          // 播放音效
  | 'looks_playanimation'      // 播放动画序列
  | 'looks_setvolume'          // 设置音量
  | 'looks_emitparticles'      // 粒子特效
  | 'looks_speak'              // 文字转语音

  // ========== 侦测与物理模块 ==========
  | 'sensing_touching'         // 碰到角色
  | 'sensing_touchingcolor'    // 碰到颜色
  | 'sensing_distanceto'       // 距离计算
  | 'sensing_inzone'           // 在区域内
  | 'sensing_angleto'          // 相对角度
  | 'sensing_raycast'          // 光线检测
  | 'sensing_getvelocity'      // 获取速度
  | 'sensing_getacceleration'  // 获取加速度

  // ========== 特效系统模块 ==========
  | 'effects_setopacity'       // 设置透明度
  | 'effects_setcolor'         // 设置颜色色调
  | 'effects_setsize'          // 设置大小
  | 'effects_setblur'          // 设置模糊
  | 'effects_shake'            // 屏幕震动
  | 'effects_fadein'           // 淡入
  | 'effects_fadeout'          // 淡出

  // ========== 逻辑运算模块 ==========
  | 'logic_if'                 // 如果条件
  | 'logic_ifelse'             // 如果否则
  | 'logic_repeat'             // 重复循环
  | 'logic_forever'            // 永远循环
  | 'logic_compare'            // 比较运算
  | 'logic_and'                // 逻辑与
  | 'logic_or'                 // 逻辑或
  | 'logic_not'                // 逻辑非
  | 'logic_switch'             // 多条件分支
  | 'logic_parallel'           // 并行执行
  | 'logic_waituntil'          // 等待条件
  | 'logic_break'              // 中断执行

  // ========== 运算与数据结构模块 ==========
  | 'data_random'              // 随机数
  | 'data_arithmetic'          // 四则运算
  | 'data_createlist'          // 创建列表
  | 'data_addtolist'           // 添加到列表
  | 'data_getlistitem'         // 获取列表项
  | 'data_removefromlist'      // 从列表删除
  | 'data_stringjoin'          // 字符串拼接
  | 'data_stringsplit'         // 字符串分割
  | 'data_sortlist'            // 列表排序
  | 'data_filterlist'          // 列表筛选
  | 'data_currenttime'         // 当前时间
  | 'data_vector'              // 向量运算
  | 'data_angle'               // 角度运算

  // ========== 数据存储模块 ==========
  | 'storage_createvar'        // 创建变量
  | 'storage_setvar'           // 设置变量
  | 'storage_getvar'           // 获取变量
  | 'storage_deletevar'        // 删除变量
  | 'storage_createconstant'   // 创建常量
  | 'storage_createdict'       // 创建字典
  | 'storage_setdictkey'       // 设置字典键值
  | 'storage_getdictkey'       // 获取字典键值
  | 'storage_deletedictkey'    // 删除字典键
  | 'storage_jsonparse'        // 解析JSON
  | 'storage_jsonstringify'    // 生成JSON
  | 'storage_encrypt'          // 数据加密
  | 'storage_decrypt'          // 数据解密
  | 'storage_cloudsync'        // 云变量同步

  // ========== 扩展功能模块 ==========
  // 网络功能
  | 'ext_request'              // 网络请求
  | 'ext_websocket'            // WebSocket连接
  | 'ext_upload'               // 上传文件
  | 'ext_download'             // 下载文件
  // 设备交互
  | 'ext_camera'               // 调用摄像头
  | 'ext_microphone'           // 录音
  | 'ext_vibrate'              // 震动
  | 'ext_compass'              // 指南针
  | 'ext_accelerometer'        // 加速度计
  | 'ext_location'             // 获取位置
  // 文件操作
  | 'ext_readfile'             // 读取文件
  | 'ext_writefile'            // 写入文件
  | 'ext_deletefile'           // 删除文件
  | 'ext_listfiles'            // 列出文件
  // AI功能
  | 'ext_ai_chat'              // AI对话
  | 'ext_ai_image'             // AI图像识别
  | 'ext_ai_voice'             // AI语音识别
  | 'ext_ai_translate'         // AI翻译;
// 积木输入
export interface BlockInput {
  name: string;
  label: string;
  type: BlockInputType;
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[];
  placeholder?: string;
  required?: boolean;
  blockId?: string; // 如果是嵌套块
}

export type BlockInputType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'variable'
  | 'expression'
  | 'block'      // 可嵌套块
  | 'component'; // 组件引用

// 积木输出
export interface BlockOutput {
  name: string;
  type: 'value' | 'boolean' | 'any';
}

// 积木定义（用于积木库）
export interface BlockDefinition {
  type: BlockType;
  category: BlockCategory;
  name: string;
  description: string;
  icon?: string;
  color: string;
  inputs: Omit<BlockInput, 'blockId'>[];
  outputs?: BlockOutput[];
  canHaveNext: boolean; // 是否可以有下一个块
  canBeNested: boolean; // 是否可以被嵌套
  template: string; // 显示模板
}

// 积木连接
export interface BlockConnection {
  fromBlockId: string;
  fromOutput?: string;
  toBlockId: string;
  toInput: string;
}

// 事件逻辑组
export interface EventLogicGroup {
  id: string;
  componentId: string;
  trigger: string;
  blocks: Block[];
  connections: BlockConnection[];
  enabled: boolean;
}

// 积木编辑器状态
export interface BlockEditorState {
  selectedBlockId: string | null;
  draggingBlock: Block | null;
  clipboard: Block | null;
  zoom: number;
  panOffset: { x: number; y: number };
}

// 颜色配置 - 10大模块主题色
export const BLOCK_COLORS: Record<BlockCategory, string> = {
  state: '#FF6680',      // 粉红色 - 状态管理
  event: '#FFBF00',      // 金黄色 - 事件系统
  motion: '#4C97FF',     // 天蓝色 - 运动控制
  looks: '#9966FF',      // 紫色 - 外观与声音
  sensing: '#5CB1D6',    // 青蓝色 - 侦测与物理
  effects: '#9933FF',    // 紫红色 - 特效系统
  logic: '#5B80A5',      // 靛蓝色 - 逻辑运算
  data: '#FF8C1A',       // 橙色 - 运算与数据
  storage: '#8B4513',    // 棕色 - 数据存储
  extension: '#59C059',  // 绿色 - 扩展功能
};

// ========================================
// 积木库定义 - 10大核心模块
// ========================================
export const BLOCK_DEFINITIONS: BlockDefinition[] = [

  // ========================================
  // 1. 状态管理模块
  // ========================================
  {
    type: 'state_setscore',
    category: 'state',
    name: '设置得分',
    description: '设置当前得分为指定值',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'score', label: '得分', type: 'number', defaultValue: 0 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🎯 设置得分为 {score}'
  },
  {
    type: 'state_addscore',
    category: 'state',
    name: '增加得分',
    description: '增加指定分数',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'amount', label: '分数', type: 'number', defaultValue: 10 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '➕ 增加 {amount} 分'
  },
  {
    type: 'state_getscore',
    category: 'state',
    name: '当前得分',
    description: '获取当前得分',
    color: BLOCK_COLORS.state,
    inputs: [],
    outputs: [{ name: 'score', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 当前得分'
  },
  {
    type: 'state_setlives',
    category: 'state',
    name: '设置生命值',
    description: '设置生命值为指定值',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'lives', label: '生命', type: 'number', defaultValue: 3 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '❤️ 设置生命为 {lives}'
  },
  {
    type: 'state_addlives',
    category: 'state',
    name: '增减生命值',
    description: '增加或减少生命值',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'amount', label: '数量', type: 'number', defaultValue: 1 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '💝 生命值改变 {amount}'
  },
  {
    type: 'state_getlives',
    category: 'state',
    name: '当前生命值',
    description: '获取当前生命值',
    color: BLOCK_COLORS.state,
    inputs: [],
    outputs: [{ name: 'lives', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 当前生命'
  },
  {
    type: 'state_gotoscene',
    category: 'state',
    name: '跳转场景',
    description: '跳转到指定场景或关卡',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'sceneId', label: '场景ID', type: 'string', placeholder: '场景名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🎬 跳转到场景 {sceneId}'
  },
  {
    type: 'state_gotorandomscene',
    category: 'state',
    name: '随机跳转场景',
    description: '随机跳转到除当前场景外的其他场景',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'excludeCurrent', label: '排除当前场景', type: 'boolean', defaultValue: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🎲 随机跳转到{excludeCurrent ? "其他" : "任意"}场景'
  },
  {
    type: 'state_sethighscore',
    category: 'state',
    name: '记录最高分',
    description: '如果当前得分超过最高分则更新',
    color: BLOCK_COLORS.state,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '🏆 记录最高分'
  },
  {
    type: 'state_gethighscore',
    category: 'state',
    name: '最高分',
    description: '获取历史最高分',
    color: BLOCK_COLORS.state,
    inputs: [],
    outputs: [{ name: 'highscore', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 最高分'
  },
  {
    type: 'state_resetstate',
    category: 'state',
    name: '重置所有状态',
    description: '重置得分、生命等所有状态',
    color: BLOCK_COLORS.state,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '🔄 重置所有状态'
  },
  {
    type: 'state_setcharstate',
    category: 'state',
    name: '设置角色状态',
    description: '为指定角色设置自定义状态',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'charId', label: '角色ID', type: 'string', placeholder: '角色名称' },
      { name: 'key', label: '状态名', type: 'string', placeholder: '如: health' },
      { name: 'value', label: '值', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📝 设置 {charId} 的 {key} 为 {value}'
  },
  {
    type: 'state_getcharstate',
    category: 'state',
    name: '获取角色状态',
    description: '获取指定角色的状态值',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'charId', label: '角色ID', type: 'string', placeholder: '角色名称' },
      { name: 'key', label: '状态名', type: 'string', placeholder: '如: health' }
    ],
    outputs: [{ name: 'value', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ {charId} 的 {key}'
  },
  {
    type: 'state_savestate',
    category: 'state',
    name: '保存状态到本地',
    description: '保存当前状态到本地存储',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'slot', label: '存档槽', type: 'string', defaultValue: 'save1', placeholder: '存档名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '💾 保存状态到本地 {slot}'
  },
  {
    type: 'state_loadstate',
    category: 'state',
    name: '从本地加载状态',
    description: '从本地存储加载状态',
    color: BLOCK_COLORS.state,
    inputs: [
      { name: 'slot', label: '存档槽', type: 'string', defaultValue: 'save1', placeholder: '存档名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📂 从本地加载状态 {slot}'
  },

  // ========================================
  // 2. 事件系统模块
  // ========================================
  {
    type: 'event_click',
    category: 'event',
    name: '当点击时',
    description: '当点击此角色时触发',
    color: BLOCK_COLORS.event,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '🖱️ 当点击时'
  },
  {
    type: 'event_keypress',
    category: 'event',
    name: '当按键时',
    description: '当按下指定按键时触发',
    color: BLOCK_COLORS.event,
    inputs: [
      { name: 'key', label: '按键', type: 'select', defaultValue: 'Space', options: [
        { label: '空格', value: 'Space' },
        { label: '↑ 上', value: 'ArrowUp' },
        { label: '↓ 下', value: 'ArrowDown' },
        { label: '← 左', value: 'ArrowLeft' },
        { label: '→ 右', value: 'ArrowRight' },
        { label: 'W', value: 'KeyW' },
        { label: 'A', value: 'KeyA' },
        { label: 'S', value: 'KeyS' },
        { label: 'D', value: 'KeyD' }
      ]}
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '⌨️ 当按下 {key}'
  },
  {
    type: 'event_sceneinit',
    category: 'event',
    name: '场景初始化',
    description: '场景开始时触发',
    color: BLOCK_COLORS.event,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '🎬 当场景开始'
  },
  {
    type: 'event_timer',
    category: 'event',
    name: '定时触发',
    description: '每隔指定时间触发',
    color: BLOCK_COLORS.event,
    inputs: [
      { name: 'seconds', label: '秒数', type: 'number', defaultValue: 1 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '⏰ 每隔 {seconds} 秒'
  },
  {
    type: 'event_collision',
    category: 'event',
    name: '碰撞触发',
    description: '当碰到指定角色时触发',
    color: BLOCK_COLORS.event,
    inputs: [
      { name: 'target', label: '目标', type: 'string', placeholder: '角色名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '💥 当碰到 {target}'
  },
  {
    type: 'event_dragstart',
    category: 'event',
    name: '开始拖拽',
    description: '当开始拖拽时触发',
    color: BLOCK_COLORS.event,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '🤏 当开始拖拽'
  },
  {
    type: 'event_dragend',
    category: 'event',
    name: '结束拖拽',
    description: '当结束拖拽时触发',
    color: BLOCK_COLORS.event,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '✋ 当结束拖拽'
  },
  {
    type: 'event_message',
    category: 'event',
    name: '收到消息时',
    description: '当收到自定义消息时触发',
    color: BLOCK_COLORS.event,
    inputs: [
      { name: 'message', label: '消息', type: 'string', placeholder: '消息名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📨 当收到消息 {message}'
  },

  // ========================================
  // 3. 运动控制模块
  // ========================================
  {
    type: 'motion_move',
    category: 'motion',
    name: '定向移动',
    description: '向指定方向移动',
    color: BLOCK_COLORS.motion,
    inputs: [
      {
        name: 'direction',
        label: '方向',
        type: 'select',
        defaultValue: 'right',
        options: [
          { label: '上', value: 'up' },
          { label: '下', value: 'down' },
          { label: '左', value: 'left' },
          { label: '右', value: 'right' }
        ]
      },
      { name: 'distance', label: '距离', type: 'number', defaultValue: 10 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '➡️ 向{direction}移动 {distance} 步'
  },
  {
    type: 'motion_rotate',
    category: 'motion',
    name: '旋转',
    description: '旋转指定角度',
    color: BLOCK_COLORS.motion,
    inputs: [
      { name: 'angle', label: '角度', type: 'number', defaultValue: 15 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔄 旋转 {angle} 度'
  },
  {
    type: 'motion_moveto',
    category: 'motion',
    name: '移动到坐标',
    description: '直接移动到指定位置',
    color: BLOCK_COLORS.motion,
    inputs: [
      { name: 'x', label: 'X坐标', type: 'number', defaultValue: 0 },
      { name: 'y', label: 'Y坐标', type: 'number', defaultValue: 0 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📍 移动到 ({x}, {y})'
  },
  {
    type: 'motion_easeto',
    category: 'motion',
    name: '平滑移动到',
    description: '使用动画效果平滑移动到指定位置',
    color: BLOCK_COLORS.motion,
    inputs: [
      { name: 'x', label: 'X坐标', type: 'number', defaultValue: 0 },
      { name: 'y', label: 'Y坐标', type: 'number', defaultValue: 0 },
      { name: 'duration', label: '时长(秒)', type: 'number', defaultValue: 1 },
      { name: 'easing', label: '缓动', type: 'select', defaultValue: 'easeInOut', options: [
        { label: '缓入缓出', value: 'easeInOut' },
        { label: '缓入', value: 'easeIn' },
        { label: '缓出', value: 'easeOut' },
        { label: '弹性', value: 'elastic' }
      ]}
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🎯 平滑移动到 ({x}, {y}) {duration}秒 {easing}'
  },
  {
    type: 'motion_followpath',
    category: 'motion',
    name: '沿路径运动',
    description: '沿预设路径移动',
    color: BLOCK_COLORS.motion,
    inputs: [
      { name: 'pathId', label: '路径ID', type: 'string', placeholder: '路径名称' },
      { name: 'speed', label: '速度', type: 'number', defaultValue: 100 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🛤️ 沿路径 {pathId} 移动 速度{speed}'
  },
  {
    type: 'motion_setgravity',
    category: 'motion',
    name: '设置重力',
    description: '设置重力加速度',
    color: BLOCK_COLORS.motion,
    inputs: [
      { name: 'gravity', label: '重力', type: 'number', defaultValue: 10 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '⬇️ 设置重力 {gravity}'
  },
  {
    type: 'motion_setvelocity',
    category: 'motion',
    name: '设置速度',
    description: '设置移动速度向量',
    color: BLOCK_COLORS.motion,
    inputs: [
      { name: 'vx', label: 'X速度', type: 'number', defaultValue: 0 },
      { name: 'vy', label: 'Y速度', type: 'number', defaultValue: 0 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '💨 设置速度 ({vx}, {vy})'
  },
  {
    type: 'motion_followtarget',
    category: 'motion',
    name: '跟随目标',
    description: '自动跟随鼠标或其他目标',
    color: BLOCK_COLORS.motion,
    inputs: [
      { name: 'target', label: '目标', type: 'select', defaultValue: 'mouse', options: [
        { label: '鼠标', value: 'mouse' },
        { label: '指定角色', value: 'character' }
      ]},
      { name: 'targetId', label: '角色ID', type: 'string', placeholder: '(如果选择角色)' },
      { name: 'speed', label: '速度', type: 'number', defaultValue: 5 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '👣 跟随 {target} 速度{speed}'
  },

  // ========================================
  // 4. 外观与声音模块
  // ========================================
  {
    type: 'looks_showbubble',
    category: 'looks',
    name: '显示对话气泡',
    description: '显示对话气泡',
    color: BLOCK_COLORS.looks,
    inputs: [
      { name: 'text', label: '对话内容', type: 'string', required: true, placeholder: '说的话' },
      { name: 'duration', label: '时长(秒)', type: 'number', defaultValue: 2 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '💬 说 "{text}" {duration}秒'
  },
  {
    type: 'looks_setcostume',
    category: 'looks',
    name: '切换外观',
    description: '切换角色的外观样式',
    color: BLOCK_COLORS.looks,
    inputs: [
      { name: 'costume', label: '造型', type: 'string', placeholder: '造型名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🎭 切换外观 {costume}'
  },
  {
    type: 'looks_playsound',
    category: 'looks',
    name: '播放音效',
    description: '播放指定音效',
    color: BLOCK_COLORS.looks,
    inputs: [
      { name: 'sound', label: '音效', type: 'string', placeholder: '音效名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔊 播放音效 {sound}'
  },
  {
    type: 'looks_playanimation',
    category: 'looks',
    name: '播放动画序列',
    description: '播放多帧动画',
    color: BLOCK_COLORS.looks,
    inputs: [
      { name: 'animation', label: '动画', type: 'string', placeholder: '动画名称' },
      { name: 'loop', label: '循环', type: 'boolean', defaultValue: false }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🎬 播放动画 {animation} 循环:{loop}'
  },
  {
    type: 'looks_setvolume',
    category: 'looks',
    name: '设置音量',
    description: '调节音效音量',
    color: BLOCK_COLORS.looks,
    inputs: [
      { name: 'volume', label: '音量%', type: 'number', defaultValue: 100 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔉 设置音量 {volume}%'
  },
  {
    type: 'looks_emitparticles',
    category: 'looks',
    name: '发射粒子特效',
    description: '发射粒子特效(火花、烟雾、星星等)',
    color: BLOCK_COLORS.looks,
    inputs: [
      { name: 'particle', label: '粒子', type: 'select', defaultValue: 'spark', options: [
        { label: '火花', value: 'spark' },
        { label: '烟雾', value: 'smoke' },
        { label: '星星', value: 'star' }
      ]},
      { name: 'count', label: '数量', type: 'number', defaultValue: 10 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '✨ 发射 {count} 个 {particle}'
  },
  {
    type: 'looks_speak',
    category: 'looks',
    name: '文字转语音',
    description: '使用TTS朗读文本',
    color: BLOCK_COLORS.looks,
    inputs: [
      { name: 'text', label: '文本', type: 'string', required: true, placeholder: '朗读内容' },
      { name: 'voice', label: '声音', type: 'select', defaultValue: 'default', options: [
        { label: '默认', value: 'default' },
        { label: '男声', value: 'male' },
        { label: '女声', value: 'female' }
      ]}
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🗣️ 朗读 "{text}" 声音:{voice}'
  },

  // ========================================
  // 5. 侦测与物理模块
  // ========================================
  {
    type: 'sensing_touching',
    category: 'sensing',
    name: '碰到角色',
    description: '检测是否碰到指定角色',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'target', label: '目标', type: 'string', placeholder: '角色名称' }
    ],
    outputs: [{ name: 'result', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ 碰到 {target}?'
  },
  {
    type: 'sensing_touchingcolor',
    category: 'sensing',
    name: '碰到颜色',
    description: '检测是否碰到指定颜色',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'color', label: '颜色', type: 'string', defaultValue: '#FF0000' }
    ],
    outputs: [{ name: 'result', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ 碰到颜色 {color}?'
  },
  {
    type: 'sensing_distanceto',
    category: 'sensing',
    name: '距离计算',
    description: '计算到目标的距离',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'target', label: '目标', type: 'select', defaultValue: 'mouse', options: [
        { label: '鼠标', value: 'mouse' },
        { label: '指定角色', value: 'character' }
      ]},
      { name: 'targetId', label: '角色ID', type: 'string', placeholder: '(如果选择角色)' }
    ],
    outputs: [{ name: 'distance', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 到 {target} 的距离'
  },
  {
    type: 'sensing_inzone',
    category: 'sensing',
    name: '在区域内',
    description: '检测是否在指定区域内',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'zoneId', label: '区域ID', type: 'string', placeholder: '区域名称' }
    ],
    outputs: [{ name: 'result', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ 在区域 {zoneId} 内?'
  },
  {
    type: 'sensing_angleto',
    category: 'sensing',
    name: '计算角度',
    description: '计算到目标的角度',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'target', label: '目标', type: 'string', placeholder: '角色名称' }
    ],
    outputs: [{ name: 'angle', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 计算到 {target} 的角度'
  },
  {
    type: 'sensing_raycast',
    category: 'sensing',
    name: '射线检测',
    description: '在指定方向发射射线进行检测',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'angle', label: '角度', type: 'number', defaultValue: 0 },
      { name: 'distance', label: '距离', type: 'number', defaultValue: 100 }
    ],
    outputs: [{ name: 'hit', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ 射线检测 角度{angle} 距离{distance}'
  },
  {
    type: 'sensing_getvelocity',
    category: 'sensing',
    name: '获取速度',
    description: '获取当前速度',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'axis', label: '轴', type: 'select', defaultValue: 'magnitude', options: [
        { label: '速度大小', value: 'magnitude' },
        { label: 'X速度', value: 'x' },
        { label: 'Y速度', value: 'y' }
      ]}
    ],
    outputs: [{ name: 'velocity', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ {axis}'
  },
  {
    type: 'sensing_getacceleration',
    category: 'sensing',
    name: '获取加速度',
    description: '获取当前加速度',
    color: BLOCK_COLORS.sensing,
    inputs: [
      { name: 'axis', label: '轴', type: 'select', defaultValue: 'magnitude', options: [
        { label: '加速度大小', value: 'magnitude' },
        { label: 'X加速度', value: 'x' },
        { label: 'Y加速度', value: 'y' }
      ]}
    ],
    outputs: [{ name: 'acceleration', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ {axis}'
  },

  // ========================================
  // 6. 特效系统模块
  // ========================================
  {
    type: 'effects_setopacity',
    category: 'effects',
    name: '设置透明度',
    description: '调整角色透明度',
    color: BLOCK_COLORS.effects,
    inputs: [
      { name: 'opacity', label: '透明度%', type: 'number', defaultValue: 100 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '💧 透明度 {opacity}%'
  },
  {
    type: 'effects_setcolor',
    category: 'effects',
    name: '设置颜色色调',
    description: '改变颜色色调',
    color: BLOCK_COLORS.effects,
    inputs: [
      { name: 'hue', label: '色调', type: 'number', defaultValue: 0 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🎨 色调 {hue}'
  },
  {
    type: 'effects_setsize',
    category: 'effects',
    name: '设置大小',
    description: '设置角色大小',
    color: BLOCK_COLORS.effects,
    inputs: [
      { name: 'scale', label: '缩放%', type: 'number', defaultValue: 100 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📐 大小 {scale}%'
  },
  {
    type: 'effects_setblur',
    category: 'effects',
    name: '设置模糊效果',
    description: '设置图像模糊程度',
    color: BLOCK_COLORS.effects,
    inputs: [
      { name: 'amount', label: '模糊量', type: 'number', defaultValue: 0 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🌫️ 模糊效果 {amount}'
  },
  {
    type: 'effects_shake',
    category: 'effects',
    name: '屏幕震动',
    description: '震动屏幕',
    color: BLOCK_COLORS.effects,
    inputs: [
      { name: 'intensity', label: '强度', type: 'number', defaultValue: 5 },
      { name: 'duration', label: '时长(秒)', type: 'number', defaultValue: 0.5 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📳 震动 强度{intensity} {duration}秒'
  },
  {
    type: 'effects_fadein',
    category: 'effects',
    name: '淡入',
    description: '淡入效果',
    color: BLOCK_COLORS.effects,
    inputs: [
      { name: 'duration', label: '时长(秒)', type: 'number', defaultValue: 1 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🌅 淡入 {duration}秒'
  },
  {
    type: 'effects_fadeout',
    category: 'effects',
    name: '淡出',
    description: '淡出效果',
    color: BLOCK_COLORS.effects,
    inputs: [
      { name: 'duration', label: '时长(秒)', type: 'number', defaultValue: 1 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🌆 淡出 {duration}秒'
  },

  // ========================================
  // 7. 逻辑运算模块
  // ========================================
  {
    type: 'logic_if',
    category: 'logic',
    name: '如果条件',
    description: '如果条件满足则执行',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'condition', label: '条件', type: 'expression', required: true, placeholder: '条件表达式' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔀 如果 {condition} 那么'
  },
  {
    type: 'logic_ifelse',
    category: 'logic',
    name: '如果否则',
    description: '如果否则分支',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'condition', label: '条件', type: 'expression', required: true, placeholder: '条件表达式' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔀 如果 {condition} 那么...否则...'
  },
  {
    type: 'logic_repeat',
    category: 'logic',
    name: '重复循环',
    description: '重复执行指定次数',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'times', label: '次数', type: 'number', defaultValue: 10 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔁 重复 {times} 次'
  },
  {
    type: 'logic_forever',
    category: 'logic',
    name: '永远循环',
    description: '永远重复执行',
    color: BLOCK_COLORS.logic,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '♾️ 永远重复'
  },
  {
    type: 'logic_compare',
    category: 'logic',
    name: '比较运算',
    description: '比较两个值',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'left', label: '左值', type: 'expression', required: true, placeholder: '值1' },
      { name: 'operator', label: '运算符', type: 'select', defaultValue: '==', options: [
        { label: '=', value: '==' },
        { label: '≠', value: '!=' },
        { label: '>', value: '>' },
        { label: '<', value: '<' },
        { label: '≥', value: '>=' },
        { label: '≤', value: '<=' }
      ]},
      { name: 'right', label: '右值', type: 'expression', required: true, placeholder: '值2' }
    ],
    outputs: [{ name: 'result', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ {left} {operator} {right}'
  },
  {
    type: 'logic_and',
    category: 'logic',
    name: '逻辑与',
    description: '两个条件都满足',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'left', label: '条件1', type: 'expression', required: true },
      { name: 'right', label: '条件2', type: 'expression', required: true }
    ],
    outputs: [{ name: 'result', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ {left} 与 {right}'
  },
  {
    type: 'logic_or',
    category: 'logic',
    name: '逻辑或',
    description: '满足任一条件',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'left', label: '条件1', type: 'expression', required: true },
      { name: 'right', label: '条件2', type: 'expression', required: true }
    ],
    outputs: [{ name: 'result', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ {left} 或 {right}'
  },
  {
    type: 'logic_not',
    category: 'logic',
    name: '逻辑非',
    description: '条件取反',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'condition', label: '条件', type: 'expression', required: true }
    ],
    outputs: [{ name: 'result', type: 'boolean' }],
    canHaveNext: false,
    canBeNested: true,
    template: '◇ 不满足 {condition}'
  },
  {
    type: 'logic_switch',
    category: 'logic',
    name: '根据值选择',
    description: '根据不同的值执行不同的操作',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'value', label: '值', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔀 根据 {value} 选择分支'
  },
  {
    type: 'logic_parallel',
    category: 'logic',
    name: '同时执行',
    description: '同时执行多个操作',
    color: BLOCK_COLORS.logic,
    inputs: [],
    canHaveNext: true,
    canBeNested: false,
    template: '⚡ 同时执行多个任务'
  },
  {
    type: 'logic_waituntil',
    category: 'logic',
    name: '等待直到',
    description: '等待直到指定条件满足',
    color: BLOCK_COLORS.logic,
    inputs: [
      { name: 'condition', label: '条件', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '⏳ 等待直到 {condition} 满足'
  },
  {
    type: 'logic_break',
    category: 'logic',
    name: '中断执行',
    description: '跳出循环或中断执行',
    color: BLOCK_COLORS.logic,
    inputs: [],
    canHaveNext: false,
    canBeNested: false,
    template: '🚪 中断执行'
  },

  // ========================================
  // 8. 运算与数据结构模块
  // ========================================
  {
    type: 'data_random',
    category: 'data',
    name: '随机数',
    description: '生成随机数',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'min', label: '最小', type: 'number', defaultValue: 1 },
      { name: 'max', label: '最大', type: 'number', defaultValue: 10 }
    ],
    outputs: [{ name: 'result', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 随机数 {min} 到 {max}'
  },
  {
    type: 'data_arithmetic',
    category: 'data',
    name: '四则运算',
    description: '基本数学运算',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'left', label: '左值', type: 'expression', required: true },
      { name: 'operator', label: '运算', type: 'select', defaultValue: '+', options: [
        { label: '+', value: '+' },
        { label: '-', value: '-' },
        { label: '×', value: '*' },
        { label: '÷', value: '/' }
      ]},
      { name: 'right', label: '右值', type: 'expression', required: true }
    ],
    outputs: [{ name: 'result', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ {left} {operator} {right}'
  },
  {
    type: 'data_createlist',
    category: 'data',
    name: '创建列表',
    description: '创建新列表',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'name', label: '列表名', type: 'string', placeholder: '列表名称' }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📋 创建列表 {name}'
  },
  {
    type: 'data_addtolist',
    category: 'data',
    name: '添加到列表',
    description: '向列表添加项目',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'item', label: '项目', type: 'expression', required: true },
      { name: 'list', label: '列表', type: 'string', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '➕ 将 {item} 添加到 {list}'
  },
  {
    type: 'data_getlistitem',
    category: 'data',
    name: '获取列表项',
    description: '获取列表中的项目',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'index', label: '位置', type: 'number', defaultValue: 1 },
      { name: 'list', label: '列表', type: 'string', required: true }
    ],
    outputs: [{ name: 'item', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ {list} 的第 {index} 项'
  },
  {
    type: 'data_removefromlist',
    category: 'data',
    name: '从列表删除',
    description: '删除列表中的项目',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'index', label: '位置', type: 'number', defaultValue: 1 },
      { name: 'list', label: '列表', type: 'string', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '➖ 删除 {list} 的第 {index} 项'
  },
  {
    type: 'data_stringjoin',
    category: 'data',
    name: '字符串拼接',
    description: '拼接多个字符串',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'text1', label: '文本1', type: 'expression', required: true },
      { name: 'text2', label: '文本2', type: 'expression', required: true }
    ],
    outputs: [{ name: 'result', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 连接 {text1} 和 {text2}'
  },
  {
    type: 'data_stringsplit',
    category: 'data',
    name: '字符串分割',
    description: '按分隔符分割字符串',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'text', label: '文本', type: 'expression', required: true },
      { name: 'separator', label: '分隔符', type: 'string', defaultValue: ',' }
    ],
    outputs: [{ name: 'result', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 分割 {text} 用 "{separator}"'
  },
  {
    type: 'data_sortlist',
    category: 'data',
    name: '列表排序',
    description: '对列表排序',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'list', label: '列表', type: 'string', required: true },
      { name: 'order', label: '顺序', type: 'select', defaultValue: 'asc', options: [
        { label: '升序', value: 'asc' },
        { label: '降序', value: 'desc' }
      ]}
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔢 排序 {list} {order}'
  },
  {
    type: 'data_filterlist',
    category: 'data',
    name: '列表筛选',
    description: '筛选符合条件的项',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'list', label: '列表', type: 'string', required: true },
      { name: 'condition', label: '条件', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔍 筛选 {list} 条件:{condition}'
  },
  {
    type: 'data_currenttime',
    category: 'data',
    name: '当前时间',
    description: '获取时间或日期',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'format', label: '格式', type: 'select', defaultValue: 'timestamp', options: [
        { label: '时间戳', value: 'timestamp' },
        { label: '年', value: 'year' },
        { label: '月', value: 'month' },
        { label: '日', value: 'day' },
        { label: '时', value: 'hour' },
        { label: '分', value: 'minute' },
        { label: '秒', value: 'second' }
      ]}
    ],
    outputs: [{ name: 'time', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 当前{format}'
  },
  {
    type: 'data_vector',
    category: 'data',
    name: '向量运算',
    description: '向量/坐标运算',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'operation', label: '操作', type: 'select', defaultValue: 'magnitude', options: [
        { label: '长度', value: 'magnitude' },
        { label: '归一化', value: 'normalize' }
      ]},
      { name: 'x', label: 'X', type: 'number', defaultValue: 0 },
      { name: 'y', label: 'Y', type: 'number', defaultValue: 0 }
    ],
    outputs: [{ name: 'result', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 向量({x},{y}) {operation}'
  },
  {
    type: 'data_angle',
    category: 'data',
    name: '角度运算',
    description: '角度计算',
    color: BLOCK_COLORS.data,
    inputs: [
      { name: 'operation', label: '操作', type: 'select', defaultValue: 'sin', options: [
        { label: 'sin 正弦', value: 'sin' },
        { label: 'cos 余弦', value: 'cos' },
        { label: 'tan 正切', value: 'tan' }
      ]},
      { name: 'angle', label: '角度', type: 'number', defaultValue: 0 }
    ],
    outputs: [{ name: 'result', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ {operation} {angle}'
  },

  // ========================================
  // 9. 数据存储模块
  // ========================================
  {
    type: 'storage_createvar',
    category: 'storage',
    name: '创建变量',
    description: '创建新变量',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'name', label: '变量名', type: 'string', placeholder: '变量名称', required: true },
      { name: 'value', label: '初始值', type: 'expression', defaultValue: 0 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📦 创建变量 {name} = {value}'
  },
  {
    type: 'storage_setvar',
    category: 'storage',
    name: '设置变量',
    description: '修改变量的值',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'name', label: '变量名', type: 'string', placeholder: '变量名称', required: true },
      { name: 'value', label: '新值', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📝 设置 {name} = {value}'
  },
  {
    type: 'storage_getvar',
    category: 'storage',
    name: '获取变量',
    description: '读取变量的值',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'name', label: '变量名', type: 'string', placeholder: '变量名称', required: true }
    ],
    outputs: [{ name: 'value', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ 变量 {name}'
  },
  {
    type: 'storage_deletevar',
    category: 'storage',
    name: '删除变量',
    description: '删除指定变量',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'name', label: '变量名', type: 'string', placeholder: '变量名称', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🗑️ 删除变量 {name}'
  },
  {
    type: 'storage_createconstant',
    category: 'storage',
    name: '创建常量',
    description: '创建不可修改的常量',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'name', label: '常量名', type: 'string', placeholder: '常量名称', required: true },
      { name: 'value', label: '值', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔒 常量 {name} = {value}'
  },
  {
    type: 'storage_createdict',
    category: 'storage',
    name: '创建字典',
    description: '创建键值对字典对象',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'name', label: '字典名', type: 'string', placeholder: '字典名称', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📚 创建字典 {name}'
  },
  {
    type: 'storage_setdictkey',
    category: 'storage',
    name: '设置字典键值',
    description: '设置字典中的键值对',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'dict', label: '字典', type: 'string', required: true },
      { name: 'key', label: '键', type: 'string', required: true },
      { name: 'value', label: '值', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '🔑 {dict}[{key}] = {value}'
  },
  {
    type: 'storage_getdictkey',
    category: 'storage',
    name: '获取字典键值',
    description: '获取字典中的值',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'dict', label: '字典', type: 'string', required: true },
      { name: 'key', label: '键', type: 'string', required: true }
    ],
    outputs: [{ name: 'value', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    template: '○ {dict}[{key}]'
  },
  {
    type: 'storage_deletedictkey',
    category: 'storage',
    name: '删除字典键',
    description: '删除字典中的键值对',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'dict', label: '字典', type: 'string', required: true },
      { name: 'key', label: '键', type: 'string', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '❌ 删除 {dict}[{key}]'
  },
  {
    type: 'storage_jsonparse',
    category: 'storage',
    name: '解析JSON',
    description: '将JSON字符串解析为对象',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'json', label: 'JSON字符串', type: 'string', required: true }
    ],
    outputs: [{ name: 'object', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    template: '📥 解析JSON {json}'
  },
  {
    type: 'storage_jsonstringify',
    category: 'storage',
    name: '生成JSON',
    description: '将对象转换为JSON字符串',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'object', label: '对象', type: 'expression', required: true }
    ],
    outputs: [{ name: 'json', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '📤 生成JSON {object}'
  },
  {
    type: 'storage_encrypt',
    category: 'storage',
    name: '数据加密',
    description: '对数据进行加密',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'data', label: '数据', type: 'expression', required: true },
      { name: 'key', label: '密钥', type: 'string', placeholder: '加密密钥' }
    ],
    outputs: [{ name: 'encrypted', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '🔐 加密 {data}'
  },
  {
    type: 'storage_decrypt',
    category: 'storage',
    name: '数据解密',
    description: '对数据进行解密',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'encrypted', label: '加密数据', type: 'expression', required: true },
      { name: 'key', label: '密钥', type: 'string', placeholder: '解密密钥' }
    ],
    outputs: [{ name: 'data', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    template: '🔓 解密 {encrypted}'
  },
  {
    type: 'storage_cloudsync',
    category: 'storage',
    name: '云变量同步',
    description: '与云端同步变量',
    color: BLOCK_COLORS.storage,
    inputs: [
      { name: 'varname', label: '变量名', type: 'string', required: true },
      { name: 'action', label: '操作', type: 'select', defaultValue: 'pull', options: [
        { label: '从云端拉取', value: 'pull' },
        { label: '推送到云端', value: 'push' }
      ]}
    ],
    canHaveNext: true,
    canBeNested: false,
    async: true,
    template: '☁️ {action} {varname}'
  },

  // ========================================
  // 10. 扩展功能模块
  // ========================================

  // 网络功能
  {
    type: 'ext_request',
    category: 'extension',
    name: '网络请求',
    description: '发送HTTP请求',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'method', label: '方法', type: 'select', defaultValue: 'GET', options: [
        { label: 'GET', value: 'GET' },
        { label: 'POST', value: 'POST' },
        { label: 'PUT', value: 'PUT' },
        { label: 'DELETE', value: 'DELETE' }
      ]},
      { name: 'url', label: 'URL', type: 'string', required: true, placeholder: 'https://...' },
      { name: 'data', label: '数据', type: 'expression', placeholder: '请求数据(可选)' }
    ],
    outputs: [{ name: 'response', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '🌐 请求 {method} {url}'
  },
  {
    type: 'ext_websocket',
    category: 'extension',
    name: 'WebSocket连接',
    description: '建立WebSocket连接',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'url', label: 'URL', type: 'string', required: true, placeholder: 'ws://...' },
      { name: 'action', label: '操作', type: 'select', defaultValue: 'connect', options: [
        { label: '连接', value: 'connect' },
        { label: '发送', value: 'send' },
        { label: '关闭', value: 'close' }
      ]},
      { name: 'message', label: '消息', type: 'expression', placeholder: '要发送的消息' }
    ],
    canHaveNext: true,
    canBeNested: false,
    async: true,
    template: '🔌 WebSocket {action} {url}'
  },
  {
    type: 'ext_upload',
    category: 'extension',
    name: '上传文件',
    description: '上传文件到服务器',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'url', label: 'URL', type: 'string', required: true, placeholder: '上传地址' },
      { name: 'file', label: '文件', type: 'expression', required: true }
    ],
    outputs: [{ name: 'result', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '📤 上传到 {url}'
  },
  {
    type: 'ext_download',
    category: 'extension',
    name: '下载文件',
    description: '从URL下载文件',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'url', label: 'URL', type: 'string', required: true, placeholder: '文件地址' },
      { name: 'filename', label: '文件名', type: 'string', placeholder: '保存文件名' }
    ],
    canHaveNext: true,
    canBeNested: false,
    async: true,
    template: '📥 下载 {url}'
  },

  // 设备交互
  {
    type: 'ext_camera',
    category: 'extension',
    name: '调用摄像头',
    description: '打开摄像头拍照或录像',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'mode', label: '模式', type: 'select', defaultValue: 'photo', options: [
        { label: '拍照', value: 'photo' },
        { label: '录像', value: 'video' }
      ]}
    ],
    outputs: [{ name: 'media', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '📷 摄像头 {mode}'
  },
  {
    type: 'ext_microphone',
    category: 'extension',
    name: '录制音频',
    description: '使用麦克风录制音频',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'duration', label: '时长(秒)', type: 'number', defaultValue: 10 }
    ],
    outputs: [{ name: 'audio', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '🎤 录制音频 {duration}秒'
  },
  {
    type: 'ext_vibrate',
    category: 'extension',
    name: '设备震动',
    description: '让设备震动',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'duration', label: '时长(毫秒)', type: 'number', defaultValue: 200 }
    ],
    canHaveNext: true,
    canBeNested: false,
    template: '📳 设备震动 {duration}毫秒'
  },
  {
    type: 'ext_compass',
    category: 'extension',
    name: '获取方向',
    description: '获取设备朝向方向',
    color: BLOCK_COLORS.extension,
    inputs: [],
    outputs: [{ name: 'direction', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '🧭 获取方向'
  },
  {
    type: 'ext_accelerometer',
    category: 'extension',
    name: '获取加速度',
    description: '获取设备的加速度值',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'axis', label: '轴向', type: 'select', defaultValue: 'x', options: [
        { label: 'X轴', value: 'x' },
        { label: 'Y轴', value: 'y' },
        { label: 'Z轴', value: 'z' }
      ]}
    ],
    outputs: [{ name: 'acceleration', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    template: '📱 获取加速度 {axis}'
  },
  {
    type: 'ext_location',
    category: 'extension',
    name: '获取位置',
    description: '获取设备地理位置',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'type', label: '类型', type: 'select', defaultValue: 'both', options: [
        { label: '经纬度', value: 'both' },
        { label: '经度', value: 'longitude' },
        { label: '纬度', value: 'latitude' }
      ]}
    ],
    outputs: [{ name: 'location', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '📍 位置 {type}'
  },

  // 文件操作
  {
    type: 'ext_readfile',
    category: 'extension',
    name: '读取文件',
    description: '读取本地文件内容',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'path', label: '文件路径', type: 'string', required: true, placeholder: '文件路径' }
    ],
    outputs: [{ name: 'content', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '📖 读取 {path}'
  },
  {
    type: 'ext_writefile',
    category: 'extension',
    name: '写入文件',
    description: '写入内容到文件',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'path', label: '文件路径', type: 'string', required: true, placeholder: '文件路径' },
      { name: 'content', label: '内容', type: 'expression', required: true }
    ],
    canHaveNext: true,
    canBeNested: false,
    async: true,
    template: '✍️ 写入 {path}'
  },
  {
    type: 'ext_deletefile',
    category: 'extension',
    name: '删除文件',
    description: '删除指定文件',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'path', label: '文件路径', type: 'string', required: true, placeholder: '文件路径' }
    ],
    canHaveNext: true,
    canBeNested: false,
    async: true,
    template: '🗑️ 删除 {path}'
  },
  {
    type: 'ext_listfiles',
    category: 'extension',
    name: '列出文件',
    description: '列出目录下的所有文件',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'path', label: '目录路径', type: 'string', required: true, placeholder: '目录路径' }
    ],
    outputs: [{ name: 'files', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '📂 列出 {path}'
  },

  // AI功能
  {
    type: 'ext_ai_chat',
    category: 'extension',
    name: 'AI对话',
    description: '与AI进行对话',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'message', label: '消息', type: 'string', required: true, placeholder: '对话内容' },
      { name: 'model', label: '模型', type: 'select', defaultValue: 'gpt', options: [
        { label: 'GPT', value: 'gpt' },
        { label: 'Claude', value: 'claude' },
        { label: '文心一言', value: 'ernie' }
      ]}
    ],
    outputs: [{ name: 'response', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '🤖 AI对话 {model}: {message}'
  },
  {
    type: 'ext_ai_image',
    category: 'extension',
    name: 'AI图像识别',
    description: '使用AI识别图像内容',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'image', label: '图像', type: 'expression', required: true },
      { name: 'task', label: '任务', type: 'select', defaultValue: 'classify', options: [
        { label: '分类', value: 'classify' },
        { label: '检测物体', value: 'detect' },
        { label: '识别文字', value: 'ocr' }
      ]}
    ],
    outputs: [{ name: 'result', type: 'any' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '👁️ AI识别 {task}'
  },
  {
    type: 'ext_ai_voice',
    category: 'extension',
    name: 'AI语音识别',
    description: '将语音转换为文字',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'audio', label: '音频', type: 'expression', required: true },
      { name: 'language', label: '语言', type: 'select', defaultValue: 'zh', options: [
        { label: '中文', value: 'zh' },
        { label: '英文', value: 'en' }
      ]}
    ],
    outputs: [{ name: 'text', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '🎙️ 语音识别 {language}'
  },
  {
    type: 'ext_ai_translate',
    category: 'extension',
    name: 'AI翻译',
    description: '翻译文本到其他语言',
    color: BLOCK_COLORS.extension,
    inputs: [
      { name: 'text', label: '文本', type: 'string', required: true },
      { name: 'from', label: '源语言', type: 'select', defaultValue: 'auto', options: [
        { label: '自动检测', value: 'auto' },
        { label: '中文', value: 'zh' },
        { label: '英文', value: 'en' }
      ]},
      { name: 'to', label: '目标语言', type: 'select', defaultValue: 'en', options: [
        { label: '中文', value: 'zh' },
        { label: '英文', value: 'en' },
        { label: '日文', value: 'ja' },
        { label: '韩文', value: 'ko' }
      ]}
    ],
    outputs: [{ name: 'translated', type: 'value' }],
    canHaveNext: false,
    canBeNested: true,
    async: true,
    template: '🌏 翻译 {from}→{to}: {text}'
  }
];

// 根据类别获取积木
export function getBlocksByCategory(category: BlockCategory): BlockDefinition[] {
  return BLOCK_DEFINITIONS.filter(b => b.category === category);
}

// 根据类型获取积木定义
export function getBlockDefinition(type: BlockType): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find(b => b.type === type);
}

// 创建新积木实例
export function createBlock(type: BlockType): Block | null {
  const def = getBlockDefinition(type);
  if (!def) return null;

  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    category: def.category,
    name: def.name,
    inputs: def.inputs.map(input => ({
      ...input,
      blockId: undefined,
    })),
    outputs: def.outputs,
    values: def.inputs.reduce((acc, input) => {
      acc[input.name] = input.defaultValue;
      return acc;
    }, {} as Record<string, unknown>),
  };
}
