// 游戏引擎类型定义

import type { Block } from './block';
import type { ComponentInstance } from './miniprogram';

// 游戏状态
export type GameStatus = 'idle' | 'running' | 'paused' | 'stopped';

// 游戏对象
export interface GameObject {
  id: string;
  name: string;
  type: 'sprite' | 'text' | 'ui' | 'trigger' | 'component';

  // 变换属性
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  scale: { x: number; y: number };
  anchor: { x: number; y: number };

  // 物理属性
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };

  // 状态属性
  isActive: boolean;
  isVisible: boolean;
  layer: number;
  tags: string[];

  // 关联的组件实例
  componentInstance?: ComponentInstance;

  // 关联的积木脚本
  scripts: GameScript[];

  // 自定义属性
  properties: Record<string, any>;
}

// 游戏脚本（积木逻辑）
export interface GameScript {
  id: string;
  trigger: ScriptTrigger;
  blocks: Block[];
  enabled: boolean;
}

// 脚本触发器类型
export type ScriptTrigger =
  | 'onGameStart'      // 游戏开始时
  | 'onUpdate'         // 每帧执行
  | 'onTap'            // 点击时（旧版）
  | 'onClick'          // 点击时
  | 'onLongPress'      // 长按时
  | 'onKeyDown'        // 按键按下
  | 'onKeyUp'          // 按键松开
  | 'onCollision'      // 碰撞时
  | 'onMessage'        // 收到消息时
  | 'onClone'          // 被克隆时
  | 'onDestroy';       // 被销毁时

// 游戏全局状态
export interface GameState {
  status: GameStatus;
  currentSceneId: string | null;
  score: number;
  lives: number;
  time: number;
  fps: number;
  frameCount: number;
  variables: Record<string, any>;
}

// 游戏事件
export interface GameEvent {
  type: string;
  target?: GameObject;
  data?: any;
  timestamp: number;
}

// 碰撞信息
export interface CollisionInfo {
  objectA: GameObject;
  objectB: GameObject;
  overlap: { x: number; y: number };
}

// 输入状态
export interface InputState {
  keys: Set<string>;
  mouse: {
    x: number;
    y: number;
    isDown: boolean;
    button: number;
  };
  touches: Array<{
    id: number;
    x: number;
    y: number;
  }>;
}

// 引擎配置
export interface EngineConfig {
  targetFPS: number;
  gravity: { x: number; y: number };
  debug: boolean;
  showFPS: boolean;
  showColliders: boolean;
}

// 默认引擎配置
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  targetFPS: 60,
  gravity: { x: 0, y: 0 },
  debug: false,
  showFPS: true,
  showColliders: false,
};

// 积木执行上下文
export interface ExecutionContext {
  gameObject: GameObject;
  gameState: GameState;
  event?: GameEvent;
  localVariables: Record<string, any>;
}

// 积木执行结果
export interface ExecutionResult {
  success: boolean;
  value?: any;
  error?: string;
  shouldBreak?: boolean;
  shouldContinue?: boolean;
}
