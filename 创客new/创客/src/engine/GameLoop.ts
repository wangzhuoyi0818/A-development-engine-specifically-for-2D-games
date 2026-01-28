// 游戏循环 - 管理游戏帧更新

import { EventSystem, GameEvents } from './EventSystem';
import { GameStateManager } from './GameStateManager';
import type { EngineConfig } from '@/types/engine';

export class GameLoop {
  private eventSystem: EventSystem;
  private stateManager: GameStateManager;
  private config: EngineConfig;

  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameInterval: number;
  private accumulator: number = 0;

  // FPS 计算
  private fpsFrameCount: number = 0;
  private fpsLastTime: number = 0;
  private currentFPS: number = 0;

  // 物理更新
  private readonly FIXED_TIMESTEP: number = 1000 / 60; // 固定物理更新间隔 (60Hz)

  constructor(
    eventSystem: EventSystem,
    stateManager: GameStateManager,
    config: EngineConfig
  ) {
    this.eventSystem = eventSystem;
    this.stateManager = stateManager;
    this.config = config;
    this.frameInterval = 1000 / config.targetFPS;
  }

  /**
   * 启动游戏循环
   */
  start(): void {
    if (this.animationFrameId !== null) {
      console.warn('[GameLoop] Already running');
      return;
    }

    console.log('[GameLoop] Starting...');
    this.lastFrameTime = performance.now();
    this.fpsLastTime = this.lastFrameTime;
    this.accumulator = 0;
    this.fpsFrameCount = 0;

    this.stateManager.setStatus('running');
    this.loop(this.lastFrameTime);
  }

  /**
   * 停止游戏循环
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.stateManager.setStatus('stopped');
    console.log('[GameLoop] Stopped');
  }

  /**
   * 暂停游戏循环
   */
  pause(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.stateManager.setStatus('paused');
    console.log('[GameLoop] Paused');
  }

  /**
   * 恢复游戏循环
   */
  resume(): void {
    if (this.stateManager.getStatus() !== 'paused') {
      console.warn('[GameLoop] Not paused, cannot resume');
      return;
    }

    console.log('[GameLoop] Resuming...');
    this.lastFrameTime = performance.now();
    this.accumulator = 0;
    this.stateManager.setStatus('running');
    this.loop(this.lastFrameTime);
  }

  /**
   * 检查是否正在运行
   */
  isRunning(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * 获取当前 FPS
   */
  getFPS(): number {
    return this.currentFPS;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.frameInterval = 1000 / this.config.targetFPS;
  }

  /**
   * 主循环
   */
  private loop = (currentTime: number): void => {
    if (this.stateManager.getStatus() !== 'running') {
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);

    const deltaTime = currentTime - this.lastFrameTime;

    // 帧率限制
    if (deltaTime < this.frameInterval) {
      return;
    }

    this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);

    // 更新 FPS 计数
    this.updateFPS(currentTime);

    // 更新游戏时间
    this.stateManager.updateTime(deltaTime / 1000);
    this.stateManager.incrementFrameCount();

    // 累积时间用于固定物理更新
    this.accumulator += deltaTime;

    // 固定时间步物理更新（确保物理模拟的稳定性）
    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.fixedUpdate(this.FIXED_TIMESTEP / 1000);
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    // 变量时间步更新（用于渲染和非物理逻辑）
    this.update(deltaTime / 1000);

    // 后期更新（用于摄像机跟随等）
    this.lateUpdate(deltaTime / 1000);
  };

  /**
   * 更新 FPS 计数
   */
  private updateFPS(currentTime: number): void {
    this.fpsFrameCount++;

    const fpsElapsed = currentTime - this.fpsLastTime;
    if (fpsElapsed >= 1000) {
      this.currentFPS = Math.round((this.fpsFrameCount * 1000) / fpsElapsed);
      this.stateManager.updateFPS(this.currentFPS);
      this.fpsFrameCount = 0;
      this.fpsLastTime = currentTime;
    }
  }

  /**
   * 固定时间步更新（物理）
   */
  private fixedUpdate(deltaTime: number): void {
    const gameObjects = this.stateManager.getAllGameObjects();
    const gravity = this.config.gravity;

    // 更新所有游戏对象的物理状态
    for (const obj of gameObjects) {
      if (!obj.isActive) continue;

      // 应用重力
      obj.velocity.x += gravity.x * deltaTime;
      obj.velocity.y += gravity.y * deltaTime;

      // 应用加速度
      obj.velocity.x += obj.acceleration.x * deltaTime;
      obj.velocity.y += obj.acceleration.y * deltaTime;

      // 更新位置
      obj.position.x += obj.velocity.x * deltaTime;
      obj.position.y += obj.velocity.y * deltaTime;
    }

    // 碰撞检测
    this.checkCollisions(gameObjects);
  }

  /**
   * 变量时间步更新
   */
  private update(deltaTime: number): void {
    // 同步 GameObject 到 ComponentInstance
    this.syncGameObjectsToComponents();

    // 发送帧更新事件
    this.eventSystem.emit(GameEvents.FRAME_UPDATE, { deltaTime });
  }

  /**
   * 同步游戏对象状态到组件实例
   * 这是关键：让积木的修改能够反映到UI上
   */
  private syncGameObjectsToComponents(): void {
    const gameObjects = this.stateManager.getAllGameObjects();

    for (const obj of gameObjects) {
      if (!obj.componentInstance) continue;

      const comp = obj.componentInstance;

      // 同步位置
      comp.position.x = obj.position.x;
      comp.position.y = obj.position.y;

      // 同步大小
      comp.size.width = obj.size.width * obj.scale.x;
      comp.size.height = obj.size.height * obj.scale.y;

      // 同步可见性
      comp.visible = obj.isVisible;

      // 同步层级
      comp.zIndex = obj.layer;

      // 同步属性（如 rotation, costume, speechBubble 等）
      if (obj.rotation !== undefined) {
        comp.props = comp.props || {};
        comp.props.rotation = obj.rotation;
      }

      // 同步自定义属性到组件 props
      if (obj.properties) {
        comp.props = comp.props || {};

        // 同步外观相关
        if (obj.properties.costume !== undefined) {
          comp.props.src = obj.properties.costume;
        }
        if (obj.properties.opacity !== undefined) {
          comp.props.opacity = obj.properties.opacity;
        }
        if (obj.properties.volume !== undefined) {
          comp.props.volume = obj.properties.volume;
        }

        // 同步对话气泡
        if (obj.properties.speechBubble !== undefined) {
          comp.props.speechBubble = obj.properties.speechBubble;
          comp.props.speechBubbleTime = obj.properties.speechBubbleTime;
        }

        // 同步动画
        if (obj.properties.animation !== undefined) {
          comp.props.animation = obj.properties.animation;
          comp.props.animationLoop = obj.properties.animationLoop;
        }
      }
    }

    // 触发组件更新事件
    this.eventSystem.emit('components:updated', { gameObjects });
  }

  /**
   * 后期更新
   */
  private lateUpdate(deltaTime: number): void {
    // 发送后期更新事件
    this.eventSystem.emit(GameEvents.FRAME_LATE_UPDATE, { deltaTime });
  }

  /**
   * 碰撞检测
   */
  private checkCollisions(objects: import('@/types/engine').GameObject[]): void {
    const activeObjects = objects.filter((obj) => obj.isActive);
    const previousCollisions = new Set<string>();

    // 获取当前帧的碰撞对
    const currentCollisions = new Map<string, { a: string; b: string }>();

    for (let i = 0; i < activeObjects.length; i++) {
      for (let j = i + 1; j < activeObjects.length; j++) {
        const objA = activeObjects[i];
        const objB = activeObjects[j];

        if (this.checkAABBCollision(objA, objB)) {
          const collisionKey = this.getCollisionKey(objA.id, objB.id);
          currentCollisions.set(collisionKey, { a: objA.id, b: objB.id });

          const overlap = this.calculateOverlap(objA, objB);

          // 判断碰撞状态
          if (!previousCollisions.has(collisionKey)) {
            // 新碰撞 - 进入
            this.eventSystem.emit(GameEvents.COLLISION_ENTER, {
              objectA: objA,
              objectB: objB,
              overlap,
            });
          } else {
            // 持续碰撞 - 停留
            this.eventSystem.emit(GameEvents.COLLISION_STAY, {
              objectA: objA,
              objectB: objB,
              overlap,
            });
          }

          previousCollisions.add(collisionKey);
        }
      }
    }

    // 检测碰撞退出
    for (const key of previousCollisions) {
      if (!currentCollisions.has(key)) {
        const [idA, idB] = key.split('_');
        const objA = objects.find((o) => o.id === idA);
        const objB = objects.find((o) => o.id === idB);

        if (objA && objB) {
          this.eventSystem.emit(GameEvents.COLLISION_EXIT, {
            objectA: objA,
            objectB: objB,
          });
        }
      }
    }

    // 检测角色与隐形平台的碰撞
    this.checkInvisiblePlatformCollisions(activeObjects);
  }

  /**
   * 检测隐形平台碰撞
   */
  private checkInvisiblePlatformCollisions(objects: import('@/types/engine').GameObject[]): void {
    const gameState = this.stateManager.getState();
    if (!gameState || !(gameState as any).invisiblePlatforms) {
      return;
    }

    // 遍历所有活动对象
    for (const obj of objects) {
      // 计算对象的边界
      const objLeft = obj.position.x - obj.anchor.x * obj.size.width * obj.scale.x;
      const objRight = objLeft + obj.size.width * obj.scale.x;
      const objTop = obj.position.y - obj.anchor.y * obj.size.height * obj.scale.y;
      const objBottom = objTop + obj.size.height * obj.scale.y;

      // 检查每个隐形平台
      (gameState as any).invisiblePlatforms.forEach((platform: any) => {
        if (!platform.isActive) return;

        const bounds = platform.getBounds();

        // 简单的 AABB 碰撞检测
        const isColliding = !(
          objRight < bounds.left ||
          objLeft > bounds.right ||
          objBottom < bounds.top ||
          objTop > bounds.bottom
        );

        if (isColliding) {
          // 计算碰撞深度
          const overlapLeft = objRight - bounds.left;
          const overlapRight = bounds.right - objLeft;
          const overlapTop = objBottom - bounds.top;
          const overlapBottom = bounds.bottom - objTop;

          // 找到最小的重叠量
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

          // 根据最小重叠方向调整位置
          if (minOverlap === overlapTop && obj.velocity.y > 0) {
            // 从上方碰到平台 - 站在平台上
            obj.position.y = bounds.top - (objBottom - obj.position.y);
            obj.velocity.y = 0;

            // 标记对象在地面上
            if (!obj.properties) obj.properties = {};
            obj.properties['onGround'] = true;
          } else if (minOverlap === overlapBottom && obj.velocity.y < 0) {
            // 从下方碰到平台
            obj.position.y = bounds.bottom + (obj.position.y - objTop);
            obj.velocity.y = 0;
          } else if (minOverlap === overlapLeft) {
            // 从左侧碰到平台
            obj.position.x = bounds.left - (objRight - obj.position.x);
            obj.velocity.x = 0;
          } else if (minOverlap === overlapRight) {
            // 从右侧碰到平台
            obj.position.x = bounds.right + (obj.position.x - objLeft);
            obj.velocity.x = 0;
          }
        }
      });
    }
  }

  /**
   * AABB 碰撞检测
   */
  private checkAABBCollision(
    objA: import('@/types/engine').GameObject,
    objB: import('@/types/engine').GameObject
  ): boolean {
    const aLeft = objA.position.x - objA.anchor.x * objA.size.width * objA.scale.x;
    const aRight = aLeft + objA.size.width * objA.scale.x;
    const aTop = objA.position.y - objA.anchor.y * objA.size.height * objA.scale.y;
    const aBottom = aTop + objA.size.height * objA.scale.y;

    const bLeft = objB.position.x - objB.anchor.x * objB.size.width * objB.scale.x;
    const bRight = bLeft + objB.size.width * objB.scale.x;
    const bTop = objB.position.y - objB.anchor.y * objB.size.height * objB.scale.y;
    const bBottom = bTop + objB.size.height * objB.scale.y;

    return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
  }

  /**
   * 计算碰撞重叠
   */
  private calculateOverlap(
    objA: import('@/types/engine').GameObject,
    objB: import('@/types/engine').GameObject
  ): { x: number; y: number } {
    const aLeft = objA.position.x - objA.anchor.x * objA.size.width * objA.scale.x;
    const aRight = aLeft + objA.size.width * objA.scale.x;
    const aTop = objA.position.y - objA.anchor.y * objA.size.height * objA.scale.y;
    const aBottom = aTop + objA.size.height * objA.scale.y;

    const bLeft = objB.position.x - objB.anchor.x * objB.size.width * objB.scale.x;
    const bRight = bLeft + objB.size.width * objB.scale.x;
    const bTop = objB.position.y - objB.anchor.y * objB.size.height * objB.scale.y;
    const bBottom = bTop + objB.size.height * objB.scale.y;

    const overlapX = Math.min(aRight, bRight) - Math.max(aLeft, bLeft);
    const overlapY = Math.min(aBottom, bBottom) - Math.max(aTop, bTop);

    return { x: overlapX, y: overlapY };
  }

  /**
   * 生成碰撞对的唯一键
   */
  private getCollisionKey(idA: string, idB: string): string {
    return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
  }
}
