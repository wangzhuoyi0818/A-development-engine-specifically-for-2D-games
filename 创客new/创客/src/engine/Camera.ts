/**
 * 摄像机系统
 * 负责管理游戏视口、滚动、跟随等功能
 */

import type { GameObject } from '@/types/engine';

export type ScrollDirection = 'horizontal' | 'vertical' | 'free';
export type BoundaryMode = 'bounded' | 'infinite';

export interface CameraConfig {
  // 视口大小
  viewportWidth: number;
  viewportHeight: number;

  // 场景大小
  sceneWidth: number;
  sceneHeight: number;

  // 滚动方向
  scrollDirection: ScrollDirection;

  // 边界模式
  boundaryMode: BoundaryMode;

  // 是否允许手动拖拽
  enableDrag: boolean;
}

export class Camera {
  // 摄像机位置（世界坐标）
  public x: number = 0;
  public y: number = 0;

  // 配置
  private config: CameraConfig;

  // 跟随目标
  private followTarget: GameObject | null = null;

  // 跟随平滑系数 (0-1, 越大越快)
  private followSpeed: number = 0.1;

  // 是否启用跟随
  private followEnabled: boolean = false;

  // 手动拖拽状态
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private cameraStartX: number = 0;
  private cameraStartY: number = 0;

  constructor(config: CameraConfig) {
    this.config = config;
  }

  /**
   * 设置跟随目标
   */
  public setFollowTarget(target: GameObject | null, speed: number = 0.1): void {
    this.followTarget = target;
    this.followSpeed = Math.max(0, Math.min(1, speed));
    this.followEnabled = target !== null;
  }

  /**
   * 启用/禁用跟随
   */
  public setFollowEnabled(enabled: boolean): void {
    this.followEnabled = enabled;
  }

  /**
   * 直接设置摄像机位置
   */
  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.clampPosition();
  }

  /**
   * 更新摄像机（每帧调用）
   */
  public update(deltaTime: number): void {
    // 如果启用跟随且有目标
    if (this.followEnabled && this.followTarget && !this.isDragging) {
      this.updateFollow();
    }

    // 限制摄像机位置
    this.clampPosition();
  }

  /**
   * 更新跟随逻辑
   */
  private updateFollow(): void {
    if (!this.followTarget) return;

    const targetX = this.followTarget.position.x;
    const targetY = this.followTarget.position.y;

    // 根据滚动方向更新摄像机位置
    switch (this.config.scrollDirection) {
      case 'horizontal':
        // 只水平跟随
        this.x += (targetX - this.x) * this.followSpeed;
        // Y轴固定在场景中央
        this.y = this.config.sceneHeight / 2;
        break;

      case 'vertical':
        // 只垂直跟随
        this.y += (targetY - this.y) * this.followSpeed;
        // X轴固定在场景中央
        this.x = this.config.sceneWidth / 2;
        break;

      case 'free':
        // 自由跟随
        this.x += (targetX - this.x) * this.followSpeed;
        this.y += (targetY - this.y) * this.followSpeed;
        break;
    }
  }

  /**
   * 限制摄像机位置（根据边界模式）
   */
  private clampPosition(): void {
    if (this.config.boundaryMode === 'bounded') {
      // 有边界模式
      const halfViewWidth = this.config.viewportWidth / 2;
      const halfViewHeight = this.config.viewportHeight / 2;

      // 根据滚动方向限制
      switch (this.config.scrollDirection) {
        case 'horizontal':
          this.x = Math.max(halfViewWidth, Math.min(this.config.sceneWidth - halfViewWidth, this.x));
          this.y = this.config.sceneHeight / 2;
          break;

        case 'vertical':
          this.x = this.config.sceneWidth / 2;
          this.y = Math.max(halfViewHeight, Math.min(this.config.sceneHeight - halfViewHeight, this.y));
          break;

        case 'free':
          this.x = Math.max(halfViewWidth, Math.min(this.config.sceneWidth - halfViewWidth, this.x));
          this.y = Math.max(halfViewHeight, Math.min(this.config.sceneHeight - halfViewHeight, this.y));
          break;
      }
    } else {
      // 无限循环模式
      if (this.config.scrollDirection === 'horizontal' || this.config.scrollDirection === 'free') {
        if (this.x < 0) this.x += this.config.sceneWidth;
        if (this.x > this.config.sceneWidth) this.x -= this.config.sceneWidth;
      }
      if (this.config.scrollDirection === 'vertical' || this.config.scrollDirection === 'free') {
        if (this.y < 0) this.y += this.config.sceneHeight;
        if (this.y > this.config.sceneHeight) this.y -= this.config.sceneHeight;
      }
    }
  }

  /**
   * 世界坐标转屏幕坐标
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const screenX = worldX - this.x + this.config.viewportWidth / 2;
    const screenY = worldY - this.y + this.config.viewportHeight / 2;
    return { x: screenX, y: screenY };
  }

  /**
   * 屏幕坐标转世界坐标
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const worldX = screenX + this.x - this.config.viewportWidth / 2;
    const worldY = screenY + this.y - this.config.viewportHeight / 2;
    return { x: worldX, y: worldY };
  }

  /**
   * 开始拖拽
   */
  public startDrag(screenX: number, screenY: number): void {
    if (!this.config.enableDrag) return;

    this.isDragging = true;
    this.dragStartX = screenX;
    this.dragStartY = screenY;
    this.cameraStartX = this.x;
    this.cameraStartY = this.y;
  }

  /**
   * 拖拽中
   */
  public onDrag(screenX: number, screenY: number): void {
    if (!this.isDragging || !this.config.enableDrag) return;

    const deltaX = screenX - this.dragStartX;
    const deltaY = screenY - this.dragStartY;

    // 根据滚动方向更新摄像机
    switch (this.config.scrollDirection) {
      case 'horizontal':
        this.x = this.cameraStartX - deltaX;
        break;

      case 'vertical':
        this.y = this.cameraStartY - deltaY;
        break;

      case 'free':
        this.x = this.cameraStartX - deltaX;
        this.y = this.cameraStartY - deltaY;
        break;
    }

    this.clampPosition();
  }

  /**
   * 结束拖拽
   */
  public endDrag(): void {
    this.isDragging = false;
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...config };
    this.clampPosition();
  }

  /**
   * 获取配置
   */
  public getConfig(): CameraConfig {
    return { ...this.config };
  }

  /**
   * 获取视口边界（世界坐标）
   */
  public getViewBounds(): { left: number; right: number; top: number; bottom: number } {
    const halfWidth = this.config.viewportWidth / 2;
    const halfHeight = this.config.viewportHeight / 2;

    return {
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight,
    };
  }
}
