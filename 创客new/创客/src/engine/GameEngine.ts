// 游戏引擎主类 - 整合所有子系统

import type {
  EngineConfig,
  GameObject,
  GameScript,
  GameState,
  ExecutionContext,
  ScriptTrigger,
} from '@/types/engine';
import type { Page, ComponentInstance } from '@/types/miniprogram';
import { DEFAULT_ENGINE_CONFIG } from '@/types/engine';
import { EventSystem, GameEvents } from './EventSystem';
import { GameStateManager } from './GameStateManager';
import { BlockExecutor } from './BlockExecutor';
import { GameLoop } from './GameLoop';

export class GameEngine {
  // 子系统
  private eventSystem: EventSystem;
  private stateManager: GameStateManager;
  private blockExecutor: BlockExecutor;
  private gameLoop: GameLoop;

  // 配置
  private config: EngineConfig;

  // 场景数据
  private scenes: Map<string, Page> = new Map();
  private currentScene: Page | null = null;

  // 输入状态
  private inputState = {
    keys: new Set<string>(),
    mouse: { x: 0, y: 0, isDown: false, button: 0 },
    touches: [] as Array<{ id: number; x: number; y: number }>,
  };

  // 脚本映射
  private scriptCallbacks: Map<string, Map<ScriptTrigger, () => void>> = new Map();

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };

    // 初始化子系统
    this.eventSystem = new EventSystem();
    this.stateManager = new GameStateManager(this.eventSystem);
    this.blockExecutor = new BlockExecutor(this.eventSystem, this.stateManager);
    this.gameLoop = new GameLoop(this.eventSystem, this.stateManager, this.config);

    // 注册内置事件处理
    this.registerEventHandlers();

    console.log('[GameEngine] Initialized');
  }

  /**
   * 注册内置事件处理器
   */
  private registerEventHandlers(): void {
    // 游戏开始时执行所有 onGameStart 脚本
    this.eventSystem.on(GameEvents.GAME_START, () => {
      this.executeScriptsWithTrigger('onGameStart');
    });

    // 每帧更新时执行所有 onUpdate 脚本
    this.eventSystem.on(GameEvents.FRAME_UPDATE, ({ deltaTime }) => {
      // 🔍 调试日志：检查是否每帧触发
      const frameCount = this.stateManager.getState().frameCount;
      if (frameCount % 60 === 0) {  // 每60帧打印一次（约1秒）
        console.log(`[GameEngine] 🔄 FRAME_UPDATE 事件触发，第 ${frameCount} 帧`);
      }

      this.executeScriptsWithTrigger('onUpdate', { deltaTime });
    });

    // 碰撞事件
    this.eventSystem.on(GameEvents.COLLISION_ENTER, ({ objectA, objectB, overlap }) => {
      this.executeScriptsWithTrigger('onCollision', { other: objectB, overlap }, objectA);
      this.executeScriptsWithTrigger('onCollision', { other: objectA, overlap }, objectB);
    });

    // 消息事件
    this.eventSystem.on(GameEvents.MESSAGE, ({ message, sender }) => {
      this.executeScriptsWithTrigger('onMessage', { message, sender });
    });

    // 对象销毁事件
    this.eventSystem.on(GameEvents.OBJECT_DESTROY, ({ object }) => {
      this.executeScriptsWithTrigger('onDestroy', {}, object);
    });

    // 对象克隆事件
    this.eventSystem.on(GameEvents.OBJECT_CLONE, ({ cloned }) => {
      this.executeScriptsWithTrigger('onClone', {}, cloned);
    });
  }

  // ========== 生命周期方法 ==========

  /**
   * 初始化引擎
   */
  async init(): Promise<void> {
    this.eventSystem.emit(GameEvents.GAME_INIT);
    console.log('[GameEngine] Engine initialized');
  }

  /**
   * 加载场景
   */
  loadScene(page: Page): void {
    this.scenes.set(page.id, page);

    // 如果是第一个场景，自动设置为当前场景
    if (!this.currentScene) {
      this.setCurrentScene(page.id);
    }
  }

  /**
   * 设置当前场景
   */
  setCurrentScene(sceneId: string): void {
    const scene = this.scenes.get(sceneId);
    if (!scene) {
      console.error(`[GameEngine] Scene not found: ${sceneId}`);
      return;
    }

    // 清理旧场景的游戏对象
    if (this.currentScene) {
      const oldObjects = this.stateManager.getAllGameObjects();
      oldObjects.forEach((obj) => this.stateManager.unregisterGameObject(obj.id));
    }

    this.currentScene = scene;
    this.stateManager.setCurrentScene(sceneId);

    // 创建新场景的游戏对象
    scene.components.forEach((component) => {
      const gameObject = this.createGameObjectFromComponent(component);
      this.stateManager.registerGameObject(gameObject);
    });

    console.log(`[GameEngine] Scene loaded: ${sceneId}`);
  }

  /**
   * 从组件创建游戏对象
   */
  private createGameObjectFromComponent(component: ComponentInstance): GameObject {
    const gameObject: GameObject = {
      id: component.id,
      name: component.name,
      type: this.mapComponentTypeToGameObjectType(component.type),
      position: { ...component.position },
      size: { ...component.size },
      rotation: 0,
      scale: { x: 1, y: 1 },
      anchor: { x: 0, y: 0 },
      velocity: { x: 0, y: 0 },
      acceleration: { x: 0, y: 0 },
      isActive: true,
      isVisible: component.visible,
      layer: component.zIndex,
      tags: [],
      componentInstance: component,
      scripts: this.extractScriptsFromComponent(component),
      properties: { ...component.props },
    };

    return gameObject;
  }

  /**
   * 映射组件类型到游戏对象类型
   */
  private mapComponentTypeToGameObjectType(
    componentType: string
  ): GameObject['type'] {
    switch (componentType) {
      case 'image':
        return 'sprite';
      case 'text':
        return 'text';
      case 'button':
      case 'input':
        return 'ui';
      case 'view':
        return 'component';
      default:
        return 'sprite';
    }
  }

  /**
   * 从组件提取脚本
   */
  private extractScriptsFromComponent(component: ComponentInstance): GameScript[] {
    const scripts: GameScript[] = [];

    // 优先从 component.scripts 提取积木块脚本
    if (component.scripts) {
      Object.entries(component.scripts).forEach(([trigger, blocks], index) => {
        if (blocks && blocks.length > 0) {
          const mappedTrigger = this.mapTriggerKeyToScriptTrigger(trigger);

          scripts.push({
            id: `${component.id}_script_${trigger}_${index}`,
            trigger: mappedTrigger,
            blocks: blocks as import('@/types/block').Block[],
            enabled: true,
          });

          console.log(`[GameEngine] 📝 加载脚本: ${component.name} -> ${trigger} (映射为: ${mappedTrigger}), ${blocks.length} 个积木`);
        }
      });
    }

    // 同时也从 events 提取（兼容旧数据）
    component.events.forEach((event, index) => {
      const convertedBlocks = this.convertActionsToBlocks(event.actions);
      if (convertedBlocks.length > 0) {
        scripts.push({
          id: `${component.id}_event_${index}`,
          trigger: this.mapEventToTrigger(event.trigger),
          blocks: convertedBlocks,
          enabled: true,
        });
      }
    });

    return scripts;
  }

  /**
   * 映射触发器键名到脚本触发器类型
   */
  private mapTriggerKeyToScriptTrigger(key: string): ScriptTrigger {
    const mapping: Record<string, ScriptTrigger> = {
      // 旧格式（向后兼容）
      'game_start': 'onGameStart',
      'game_update': 'onUpdate',
      'tap': 'onClick',
      'click': 'onClick',
      'keydown': 'onKeyDown',
      'keyup': 'onKeyUp',
      'collision': 'onCollision',
      'message': 'onMessage',
      'clone': 'onClone',
      'destroy': 'onDestroy',

      // 新格式（驼峰命名 - 直接映射）✅
      'onGameStart': 'onGameStart',
      'onUpdate': 'onUpdate',
      'onClick': 'onClick',
      'onKeyDown': 'onKeyDown',
      'onKeyUp': 'onKeyUp',
      'onCollision': 'onCollision',
      'onMessage': 'onMessage',
      'onClone': 'onClone',
      'onDestroy': 'onDestroy',
    };

    const mapped = mapping[key];
    if (!mapped) {
      console.warn(`[GameEngine] ⚠️ 未知的触发器键名: "${key}", 默认使用 onGameStart`);
    }
    return mapped || 'onGameStart';
  }

  /**
   * 将动作数组转换为积木块
   */
  private convertActionsToBlocks(actions: import('@/types/miniprogram').Action[]): import('@/types/block').Block[] {
    // 将 Action 转换为 Block 格式
    // 简化实现：每个 action 转换为对应的 block
    return actions.map((action, index) => ({
      id: `action_${index}_${Date.now()}`,
      type: this.mapActionTypeToBlockType(action.type),
      category: 'action' as const,
      name: action.type,
      inputs: [],
      values: action.params || {},
    }));
  }

  /**
   * 映射动作类型到积木类型
   */
  private mapActionTypeToBlockType(actionType: string): import('@/types/block').BlockType {
    const mapping: Record<string, import('@/types/block').BlockType> = {
      setData: 'action_setdata',
      navigateTo: 'action_navigate',
      request: 'action_request',
      showToast: 'action_toast',
      showModal: 'action_modal',
      showLoading: 'action_loading',
      setStorage: 'action_storage',
      playAudio: 'action_playaudio',
      vibrate: 'action_vibrate',
    };
    return mapping[actionType] || 'action_setdata';
  }

  /**
   * 映射事件类型到脚本触发器
   */
  private mapEventToTrigger(eventType: string): ScriptTrigger {
    const mapping: Record<string, ScriptTrigger> = {
      tap: 'onTap',
      longpress: 'onLongPress',
      input: 'onKeyDown',
      change: 'onUpdate',
      load: 'onGameStart',
      show: 'onGameStart',
      collision: 'onCollision',
      message: 'onMessage',
      clone: 'onClone',
      destroy: 'onDestroy',
    };

    return mapping[eventType] || 'onGameStart';
  }

  /**
   * 启动游戏
   */
  start(): void {
    if (!this.currentScene) {
      console.error('[GameEngine] No scene loaded');
      return;
    }

    this.stateManager.reset();
    this.stateManager.setCurrentScene(this.currentScene.id);

    // 重新创建游戏对象
    this.currentScene.components.forEach((component) => {
      const gameObject = this.createGameObjectFromComponent(component);
      this.stateManager.registerGameObject(gameObject);
    });

    this.gameLoop.start();
    console.log('[GameEngine] Game started');
  }

  /**
   * 暂停游戏
   */
  pause(): void {
    this.gameLoop.pause();
    console.log('[GameEngine] Game paused');
  }

  /**
   * 恢复游戏
   */
  resume(): void {
    this.gameLoop.resume();
    console.log('[GameEngine] Game resumed');
  }

  /**
   * 停止游戏
   */
  stop(): void {
    this.gameLoop.stop();
    this.blockExecutor.stop();
    console.log('[GameEngine] Game stopped');
  }

  /**
   * 重置游戏
   */
  reset(): void {
    this.stop();
    this.stateManager.reset();

    if (this.currentScene) {
      this.setCurrentScene(this.currentScene.id);
    }

    console.log('[GameEngine] Game reset');
  }

  // ========== 脚本执行 ==========

  /**
   * 执行特定触发器的所有脚本
   */
  private async executeScriptsWithTrigger(
    trigger: ScriptTrigger,
    eventData?: any,
    specificObject?: GameObject
  ): Promise<void> {
    const objects = specificObject
      ? [specificObject]
      : this.stateManager.getAllGameObjects();

    // 🔍 调试日志：统计有多少对象有该触发器的脚本
    const objectsWithScripts = objects.filter(obj => {
      if (!obj.isActive) return false;
      const scripts = obj.scripts.filter(s => s.enabled && s.trigger === trigger);
      return scripts.length > 0;
    });

    if (trigger === 'onUpdate' && objectsWithScripts.length > 0) {
      const frameCount = this.stateManager.getState().frameCount;
      if (frameCount % 60 === 0) {  // 每60帧打印一次
        console.log(`[GameEngine] 🎯 执行 ${trigger} 脚本: ${objectsWithScripts.length} 个对象有脚本`);
      }
    }

    for (const obj of objects) {
      if (!obj.isActive) continue;

      const scripts = obj.scripts.filter(
        (s) => s.enabled && s.trigger === trigger
      );

      if (scripts.length > 0 && trigger === 'onUpdate') {
        const frameCount = this.stateManager.getState().frameCount;
        if (frameCount % 60 === 0) {
          console.log(`[GameEngine] 📍 执行脚本: ${obj.name}, 触发器: ${trigger}, ${scripts.length} 个脚本`);
        }
      }

      for (const script of scripts) {
        const context: ExecutionContext = {
          gameObject: obj,
          gameState: this.stateManager.getState(),
          event: eventData
            ? { type: trigger, target: obj, data: eventData, timestamp: Date.now() }
            : undefined,
          localVariables: {},
        };

        await this.blockExecutor.executeBlocks(script.blocks, context);
      }
    }
  }

  // ========== 输入处理 ==========

  /**
   * 处理键盘按下
   */
  handleKeyDown(key: string): void {
    if (this.inputState.keys.has(key)) return;

    this.inputState.keys.add(key);
    this.eventSystem.emit(GameEvents.INPUT_KEY_DOWN, { key });

    // 触发 onKeyDown 脚本
    this.stateManager.getAllGameObjects().forEach((obj) => {
      obj.scripts
        .filter((s) => s.enabled && s.trigger === 'onKeyDown')
        .forEach((script) => {
          const context: ExecutionContext = {
            gameObject: obj,
            gameState: this.stateManager.getState(),
            event: {
              type: 'keyDown',
              data: { key },
              timestamp: Date.now(),
            },
            localVariables: { key },
          };
          this.blockExecutor.executeBlocks(script.blocks, context);
        });
    });
  }

  /**
   * 处理键盘松开
   */
  handleKeyUp(key: string): void {
    this.inputState.keys.delete(key);
    this.eventSystem.emit(GameEvents.INPUT_KEY_UP, { key });

    // 触发 onKeyUp 脚本
    this.stateManager.getAllGameObjects().forEach((obj) => {
      obj.scripts
        .filter((s) => s.enabled && s.trigger === 'onKeyUp')
        .forEach((script) => {
          const context: ExecutionContext = {
            gameObject: obj,
            gameState: this.stateManager.getState(),
            event: {
              type: 'keyUp',
              data: { key },
              timestamp: Date.now(),
            },
            localVariables: { key },
          };
          this.blockExecutor.executeBlocks(script.blocks, context);
        });
    });
  }

  /**
   * 处理点击事件
   */
  handleClick(objectId: string): void {
    console.log('[GameEngine] handleClick called for:', objectId);

    // 触发点击事件
    this.eventSystem.emit(GameEvents.INPUT_CLICK, { objectId });

    // 找到被点击的游戏对象
    const clickedObject = this.stateManager.getAllGameObjects().find(obj => obj.id === objectId);

    if (clickedObject) {
      console.log('[GameEngine] Found clicked object:', clickedObject.name, '- scripts:', clickedObject.scripts.length);

      // 触发 onClick 脚本
      clickedObject.scripts
        .filter((s) => {
          console.log('[GameEngine] Checking script:', s.trigger, 'enabled:', s.enabled);
          return s.enabled && s.trigger === 'onClick';
        })
        .forEach((script) => {
          console.log('[GameEngine] Executing onClick script with', script.blocks.length, 'blocks');

          const context: ExecutionContext = {
            gameObject: clickedObject,
            gameState: this.stateManager.getState(),
            event: {
              type: 'click',
              data: { objectId },
              timestamp: Date.now(),
            },
            localVariables: {},
          };
          this.blockExecutor.executeBlocks(script.blocks, context);
        });
    } else {
      console.warn('[GameEngine] Clicked object not found:', objectId);
    }
  }

  /**
   * 处理点击
   */
  handleTap(x: number, y: number): void {
    this.eventSystem.emit(GameEvents.INPUT_TAP, { x, y });

    // 检测点击到的对象
    const hitObjects = this.getObjectsAtPoint(x, y);

    hitObjects.forEach((obj) => {
      obj.scripts
        .filter((s) => s.enabled && s.trigger === 'onTap')
        .forEach((script) => {
          const context: ExecutionContext = {
            gameObject: obj,
            gameState: this.stateManager.getState(),
            event: {
              type: 'tap',
              target: obj,
              data: { x, y },
              timestamp: Date.now(),
            },
            localVariables: { tapX: x, tapY: y },
          };
          this.blockExecutor.executeBlocks(script.blocks, context);
        });
    });
  }

  /**
   * 处理长按
   */
  handleLongPress(x: number, y: number): void {
    this.eventSystem.emit(GameEvents.INPUT_LONG_PRESS, { x, y });

    const hitObjects = this.getObjectsAtPoint(x, y);

    hitObjects.forEach((obj) => {
      obj.scripts
        .filter((s) => s.enabled && s.trigger === 'onLongPress')
        .forEach((script) => {
          const context: ExecutionContext = {
            gameObject: obj,
            gameState: this.stateManager.getState(),
            event: {
              type: 'longPress',
              target: obj,
              data: { x, y },
              timestamp: Date.now(),
            },
            localVariables: { pressX: x, pressY: y },
          };
          this.blockExecutor.executeBlocks(script.blocks, context);
        });
    });
  }

  /**
   * 获取指定点的对象
   */
  private getObjectsAtPoint(x: number, y: number): GameObject[] {
    const objects = this.stateManager.getAllGameObjects();

    return objects
      .filter((obj) => {
        if (!obj.isActive || !obj.isVisible) return false;

        const left = obj.position.x - obj.anchor.x * obj.size.width;
        const right = left + obj.size.width;
        const top = obj.position.y - obj.anchor.y * obj.size.height;
        const bottom = top + obj.size.height;

        return x >= left && x <= right && y >= top && y <= bottom;
      })
      .sort((a, b) => b.layer - a.layer);
  }

  // ========== 公共 API ==========

  /**
   * 获取事件系统
   */
  getEventSystem(): EventSystem {
    return this.eventSystem;
  }

  /**
   * 获取状态管理器
   */
  getStateManager(): GameStateManager {
    return this.stateManager;
  }

  /**
   * 获取积木执行器
   */
  getBlockExecutor(): BlockExecutor {
    return this.blockExecutor;
  }

  /**
   * 获取游戏状态
   */
  getGameState(): Readonly<GameState> {
    return this.stateManager.getState();
  }

  /**
   * 获取所有游戏对象
   */
  getGameObjects(): GameObject[] {
    return this.stateManager.getAllGameObjects();
  }

  /**
   * 获取当前 FPS
   */
  getFPS(): number {
    return this.gameLoop.getFPS();
  }

  /**
   * 检查游戏是否运行中
   */
  isRunning(): boolean {
    return this.gameLoop.isRunning();
  }

  /**
   * 检查按键是否按下
   */
  isKeyPressed(key: string): boolean {
    return this.inputState.keys.has(key);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.gameLoop.updateConfig(config);
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.stop();
    this.eventSystem.clear();
    this.scenes.clear();
    this.scriptCallbacks.clear();
    console.log('[GameEngine] Destroyed');
  }
}

// 导出所有模块
export { EventSystem, GameEvents } from './EventSystem';
export { GameStateManager } from './GameStateManager';
export { BlockExecutor } from './BlockExecutor';
export { GameLoop } from './GameLoop';
