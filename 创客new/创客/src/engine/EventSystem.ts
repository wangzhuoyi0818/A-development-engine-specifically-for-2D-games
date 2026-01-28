// 事件系统 - 游戏内事件的发布与订阅

type EventCallback = (data?: any) => void;

export class EventSystem {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private onceListeners: Map<string, Set<EventCallback>> = new Map();

  /**
   * 注册事件监听器
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 注册一次性事件监听器
   */
  once(event: string, callback: EventCallback): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(callback);

    return () => {
      const listeners = this.onceListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * 移除事件监听器
   */
  off(event: string, callback?: EventCallback): void {
    if (callback) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
      const onceListeners = this.onceListeners.get(event);
      if (onceListeners) {
        onceListeners.delete(callback);
      }
    } else {
      // 移除该事件的所有监听器
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, data?: any): void {
    // 触发普通监听器
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventSystem] Error in event handler for "${event}":`, error);
        }
      });
    }

    // 触发一次性监听器
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      onceListeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventSystem] Error in once handler for "${event}":`, error);
        }
      });
      // 清空一次性监听器
      this.onceListeners.delete(event);
    }
  }

  /**
   * 检查是否有监听器
   */
  hasListeners(event: string): boolean {
    const listeners = this.listeners.get(event);
    const onceListeners = this.onceListeners.get(event);
    return (listeners?.size ?? 0) > 0 || (onceListeners?.size ?? 0) > 0;
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }

  /**
   * 获取所有事件名称
   */
  getEventNames(): string[] {
    const events = new Set<string>();
    this.listeners.forEach((_, key) => events.add(key));
    this.onceListeners.forEach((_, key) => events.add(key));
    return Array.from(events);
  }
}

// 预定义游戏事件
export const GameEvents = {
  // 生命周期事件
  GAME_INIT: 'game:init',
  GAME_START: 'game:start',
  GAME_PAUSE: 'game:pause',
  GAME_RESUME: 'game:resume',
  GAME_STOP: 'game:stop',
  GAME_OVER: 'game:over',

  // 帧更新事件
  FRAME_UPDATE: 'frame:update',
  FRAME_LATE_UPDATE: 'frame:lateUpdate',

  // 场景事件
  SCENE_LOAD: 'scene:load',
  SCENE_UNLOAD: 'scene:unload',
  SCENE_CHANGE: 'scene:change',

  // 对象事件
  OBJECT_CREATE: 'object:create',
  OBJECT_DESTROY: 'object:destroy',
  OBJECT_CLONE: 'object:clone',

  // 碰撞事件
  COLLISION_ENTER: 'collision:enter',
  COLLISION_STAY: 'collision:stay',
  COLLISION_EXIT: 'collision:exit',

  // 输入事件
  INPUT_TAP: 'input:tap',
  INPUT_LONG_PRESS: 'input:longPress',
  INPUT_KEY_DOWN: 'input:keyDown',
  INPUT_KEY_UP: 'input:keyUp',
  INPUT_TOUCH_START: 'input:touchStart',
  INPUT_TOUCH_MOVE: 'input:touchMove',
  INPUT_TOUCH_END: 'input:touchEnd',

  // 游戏数据事件
  SCORE_CHANGE: 'data:scoreChange',
  LIVES_CHANGE: 'data:livesChange',
  VARIABLE_CHANGE: 'data:variableChange',

  // 消息事件
  MESSAGE: 'message',
} as const;

export type GameEventType = typeof GameEvents[keyof typeof GameEvents];
