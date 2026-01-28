// 游戏状态管理器 - 管理游戏全局状态和变量

import type { GameState, GameStatus, GameObject } from '@/types/engine';
import { EventSystem, GameEvents } from './EventSystem';

export class GameStateManager {
  private state: GameState;
  private eventSystem: EventSystem;
  private gameObjects: Map<string, GameObject> = new Map();

  constructor(eventSystem: EventSystem) {
    this.eventSystem = eventSystem;
    this.state = this.createInitialState();
  }

  /**
   * 创建初始状态
   */
  private createInitialState(): GameState {
    return {
      status: 'idle',
      currentSceneId: null,
      score: 0,
      lives: 3,
      time: 0,
      fps: 0,
      frameCount: 0,
      variables: {},
    };
  }

  /**
   * 获取当前游戏状态
   */
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  /**
   * 获取游戏状态
   */
  getStatus(): GameStatus {
    return this.state.status;
  }

  /**
   * 设置游戏状态
   */
  setStatus(status: GameStatus): void {
    const prevStatus = this.state.status;
    this.state.status = status;

    // 发送状态变化事件
    switch (status) {
      case 'running':
        if (prevStatus === 'idle') {
          this.eventSystem.emit(GameEvents.GAME_START);
        } else if (prevStatus === 'paused') {
          this.eventSystem.emit(GameEvents.GAME_RESUME);
        }
        break;
      case 'paused':
        this.eventSystem.emit(GameEvents.GAME_PAUSE);
        break;
      case 'stopped':
        this.eventSystem.emit(GameEvents.GAME_STOP);
        break;
    }
  }

  /**
   * 获取当前场景ID
   */
  getCurrentSceneId(): string | null {
    return this.state.currentSceneId;
  }

  /**
   * 设置当前场景
   */
  setCurrentScene(sceneId: string): void {
    const prevSceneId = this.state.currentSceneId;

    if (prevSceneId) {
      this.eventSystem.emit(GameEvents.SCENE_UNLOAD, { sceneId: prevSceneId });
    }

    this.state.currentSceneId = sceneId;
    this.eventSystem.emit(GameEvents.SCENE_LOAD, { sceneId });
    this.eventSystem.emit(GameEvents.SCENE_CHANGE, {
      prevSceneId,
      newSceneId: sceneId
    });
  }

  // ========== 分数管理 ==========

  /**
   * 获取分数
   */
  getScore(): number {
    return this.state.score;
  }

  /**
   * 设置分数
   */
  setScore(score: number): void {
    const prevScore = this.state.score;
    this.state.score = score;
    this.eventSystem.emit(GameEvents.SCORE_CHANGE, { prevScore, newScore: score });
  }

  /**
   * 增加分数
   */
  addScore(amount: number): void {
    this.setScore(this.state.score + amount);
  }

  // ========== 生命值管理 ==========

  /**
   * 获取生命值
   */
  getLives(): number {
    return this.state.lives;
  }

  /**
   * 设置生命值
   */
  setLives(lives: number): void {
    const prevLives = this.state.lives;
    this.state.lives = Math.max(0, lives);
    this.eventSystem.emit(GameEvents.LIVES_CHANGE, { prevLives, newLives: this.state.lives });

    // 生命值为0时触发游戏结束
    if (this.state.lives === 0) {
      this.eventSystem.emit(GameEvents.GAME_OVER, { reason: 'no_lives' });
    }
  }

  /**
   * 减少生命值
   */
  loseLife(amount: number = 1): void {
    this.setLives(this.state.lives - amount);
  }

  /**
   * 增加生命值
   */
  addLife(amount: number = 1): void {
    this.setLives(this.state.lives + amount);
  }

  // ========== 时间管理 ==========

  /**
   * 获取游戏时间
   */
  getTime(): number {
    return this.state.time;
  }

  /**
   * 更新游戏时间
   */
  updateTime(deltaTime: number): void {
    this.state.time += deltaTime;
  }

  /**
   * 重置游戏时间
   */
  resetTime(): void {
    this.state.time = 0;
  }

  // ========== 帧数管理 ==========

  /**
   * 获取FPS
   */
  getFPS(): number {
    return this.state.fps;
  }

  /**
   * 更新FPS
   */
  updateFPS(fps: number): void {
    this.state.fps = fps;
  }

  /**
   * 获取帧计数
   */
  getFrameCount(): number {
    return this.state.frameCount;
  }

  /**
   * 增加帧计数
   */
  incrementFrameCount(): void {
    this.state.frameCount++;
  }

  // ========== 变量管理 ==========

  /**
   * 获取变量值
   */
  getVariable(name: string): any {
    return this.state.variables[name];
  }

  /**
   * 设置变量值
   */
  setVariable(name: string, value: any): void {
    const prevValue = this.state.variables[name];
    this.state.variables[name] = value;
    this.eventSystem.emit(GameEvents.VARIABLE_CHANGE, {
      name,
      prevValue,
      newValue: value,
    });
  }

  /**
   * 检查变量是否存在
   */
  hasVariable(name: string): boolean {
    return name in this.state.variables;
  }

  /**
   * 删除变量
   */
  deleteVariable(name: string): void {
    if (this.hasVariable(name)) {
      const prevValue = this.state.variables[name];
      delete this.state.variables[name];
      this.eventSystem.emit(GameEvents.VARIABLE_CHANGE, {
        name,
        prevValue,
        newValue: undefined,
      });
    }
  }

  /**
   * 获取所有变量
   */
  getAllVariables(): Record<string, any> {
    return { ...this.state.variables };
  }

  /**
   * 清空所有变量
   */
  clearVariables(): void {
    this.state.variables = {};
  }

  // ========== 游戏对象管理 ==========

  /**
   * 注册游戏对象
   */
  registerGameObject(obj: GameObject): void {
    this.gameObjects.set(obj.id, obj);
    this.eventSystem.emit(GameEvents.OBJECT_CREATE, { object: obj });
  }

  /**
   * 移除游戏对象
   */
  unregisterGameObject(id: string): void {
    const obj = this.gameObjects.get(id);
    if (obj) {
      this.gameObjects.delete(id);
      this.eventSystem.emit(GameEvents.OBJECT_DESTROY, { object: obj });
    }
  }

  /**
   * 获取游戏对象
   */
  getGameObject(id: string): GameObject | undefined {
    return this.gameObjects.get(id);
  }

  /**
   * 获取所有游戏对象
   */
  getAllGameObjects(): GameObject[] {
    return Array.from(this.gameObjects.values());
  }

  /**
   * 按名称查找游戏对象
   */
  findGameObjectByName(name: string): GameObject | undefined {
    return Array.from(this.gameObjects.values()).find((obj) => obj.name === name);
  }

  /**
   * 按标签查找游戏对象
   */
  findGameObjectsByTag(tag: string): GameObject[] {
    return Array.from(this.gameObjects.values()).filter((obj) => obj.tags.includes(tag));
  }

  /**
   * 按类型查找游戏对象
   */
  findGameObjectsByType(type: GameObject['type']): GameObject[] {
    return Array.from(this.gameObjects.values()).filter((obj) => obj.type === type);
  }

  /**
   * 克隆游戏对象
   */
  cloneGameObject(id: string): GameObject | null {
    const original = this.gameObjects.get(id);
    if (!original) return null;

    const cloned: GameObject = {
      ...JSON.parse(JSON.stringify(original)),
      id: `${original.id}_clone_${Date.now()}`,
      name: `${original.name}_clone`,
    };

    this.registerGameObject(cloned);
    this.eventSystem.emit(GameEvents.OBJECT_CLONE, {
      original,
      cloned
    });

    return cloned;
  }

  // ========== 状态重置 ==========

  /**
   * 重置游戏状态
   */
  reset(): void {
    this.state = this.createInitialState();
    this.gameObjects.clear();
  }

  /**
   * 保存当前状态快照
   */
  saveSnapshot(): string {
    return JSON.stringify({
      state: this.state,
      gameObjects: Array.from(this.gameObjects.entries()),
    });
  }

  /**
   * 从快照恢复状态
   */
  loadSnapshot(snapshot: string): void {
    try {
      const data = JSON.parse(snapshot);
      this.state = data.state;
      this.gameObjects = new Map(data.gameObjects);
    } catch (error) {
      console.error('[GameStateManager] Failed to load snapshot:', error);
    }
  }
}
