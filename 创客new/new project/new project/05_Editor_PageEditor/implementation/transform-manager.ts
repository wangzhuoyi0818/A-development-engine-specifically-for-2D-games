/**
 * 微信小程序可视化开发平台 - 变换管理器
 *
 * 负责处理组件的拖拽、缩放、旋转等变换操作
 */

import type {
  Point,
  Rectangle,
  Direction,
  DragState,
  ResizeState,
  ResizeHandle,
  Transform,
  ConstraintOptions,
  KEYBOARD_MOVE_DISTANCE,
} from './types';

// ============================================================================
// 变换管理器
// ============================================================================

/**
 * 变换管理器
 *
 * 职责:
 * - 处理拖拽操作 (开始/更新/结束)
 * - 处理缩放操作 (开始/更新/结束)
 * - 网格吸附
 * - 键盘移动
 * - 边界约束
 */
export class TransformManager {
  /**
   * 开始拖拽
   */
  startDrag(
    componentIds: string[],
    startPosition: Point,
    originalBounds: Map<string, Rectangle>
  ): DragState {
    return {
      componentIds,
      startPosition,
      currentPosition: startPosition,
      originalBounds,
    };
  }

  /**
   * 更新拖拽
   */
  updateDrag(
    dragState: DragState,
    currentPosition: Point,
    options?: {
      gridSize?: number;
      snapToGrid?: boolean;
      constraints?: ConstraintOptions;
    }
  ): Map<string, Rectangle> {
    const { gridSize = 8, snapToGrid = false, constraints } = options || {};

    // 计算原始位移
    let deltaX = currentPosition.x - dragState.startPosition.x;
    let deltaY = currentPosition.y - dragState.startPosition.y;

    // 应用网格吸附
    if (snapToGrid) {
      deltaX = this.snapToGrid(deltaX, gridSize);
      deltaY = this.snapToGrid(deltaY, gridSize);
    }

    // 计算新边界
    const newBounds = new Map<string, Rectangle>();

    for (const [componentId, originalBounds] of dragState.originalBounds) {
      let newRect: Rectangle = {
        left: originalBounds.left + deltaX,
        top: originalBounds.top + deltaY,
        width: originalBounds.width,
        height: originalBounds.height,
      };

      // 应用约束
      if (constraints) {
        newRect = this.constrainToBounds(newRect, constraints);
      }

      newBounds.set(componentId, newRect);
    }

    return newBounds;
  }

  /**
   * 结束拖拽
   */
  endDrag(dragState: DragState): Transform {
    const deltaX = dragState.currentPosition.x - dragState.startPosition.x;
    const deltaY = dragState.currentPosition.y - dragState.startPosition.y;

    return {
      position: { x: deltaX, y: deltaY },
    };
  }

  /**
   * 开始缩放
   */
  startResize(
    componentId: string,
    handle: ResizeHandle,
    startPosition: Point,
    originalBounds: Rectangle,
    maintainAspectRatio: boolean = false
  ): ResizeState {
    return {
      componentId,
      handle,
      startPosition,
      currentPosition: startPosition,
      originalBounds,
      maintainAspectRatio,
    };
  }

  /**
   * 更新缩放
   */
  updateResize(
    resizeState: ResizeState,
    currentPosition: Point,
    options?: {
      gridSize?: number;
      snapToGrid?: boolean;
      minWidth?: number;
      minHeight?: number;
    }
  ): Rectangle {
    const {
      gridSize = 8,
      snapToGrid = false,
      minWidth = 10,
      minHeight = 10,
    } = options || {};

    const { handle, startPosition, originalBounds, maintainAspectRatio } = resizeState;

    // 计算位移
    let deltaX = currentPosition.x - startPosition.x;
    let deltaY = currentPosition.y - startPosition.y;

    // 应用网格吸附
    if (snapToGrid) {
      deltaX = this.snapToGrid(deltaX, gridSize);
      deltaY = this.snapToGrid(deltaY, gridSize);
    }

    // 根据手柄位置计算新边界
    let newBounds = this.calculateResizedBounds(
      originalBounds,
      handle,
      deltaX,
      deltaY,
      maintainAspectRatio
    );

    // 应用最小尺寸约束
    newBounds.width = Math.max(newBounds.width, minWidth);
    newBounds.height = Math.max(newBounds.height, minHeight);

    return newBounds;
  }

  /**
   * 结束缩放
   */
  endResize(resizeState: ResizeState, finalBounds: Rectangle): Transform {
    const { originalBounds } = resizeState;

    return {
      position: {
        x: finalBounds.left - originalBounds.left,
        y: finalBounds.top - originalBounds.top,
      },
      size: {
        width: finalBounds.width,
        height: finalBounds.height,
      },
    };
  }

  /**
   * 键盘移动
   */
  moveByKeyboard(
    direction: Direction,
    distance: number = 1,
    currentBounds: Rectangle,
    options?: {
      gridSize?: number;
      snapToGrid?: boolean;
      constraints?: ConstraintOptions;
    }
  ): Rectangle {
    const { gridSize = 8, snapToGrid = false, constraints } = options || {};

    let deltaX = 0;
    let deltaY = 0;

    switch (direction) {
      case 'up':
        deltaY = -distance;
        break;
      case 'down':
        deltaY = distance;
        break;
      case 'left':
        deltaX = -distance;
        break;
      case 'right':
        deltaX = distance;
        break;
    }

    // 应用网格吸附
    if (snapToGrid) {
      deltaX = this.snapToGrid(deltaX, gridSize);
      deltaY = this.snapToGrid(deltaY, gridSize);
    }

    let newBounds: Rectangle = {
      left: currentBounds.left + deltaX,
      top: currentBounds.top + deltaY,
      width: currentBounds.width,
      height: currentBounds.height,
    };

    // 应用约束
    if (constraints) {
      newBounds = this.constrainToBounds(newBounds, constraints);
    }

    return newBounds;
  }

  /**
   * 网格吸附
   */
  snapToGrid(value: number, gridSize: number): number {
    return Math.round(value / gridSize) * gridSize;
  }

  /**
   * 边界吸附到网格
   */
  snapBoundsToGrid(bounds: Rectangle, gridSize: number): Rectangle {
    return {
      left: this.snapToGrid(bounds.left, gridSize),
      top: this.snapToGrid(bounds.top, gridSize),
      width: this.snapToGrid(bounds.width, gridSize),
      height: this.snapToGrid(bounds.height, gridSize),
    };
  }

  /**
   * 计算缩放后的边界
   */
  private calculateResizedBounds(
    originalBounds: Rectangle,
    handle: ResizeHandle,
    deltaX: number,
    deltaY: number,
    maintainAspectRatio: boolean
  ): Rectangle {
    let newBounds = { ...originalBounds };

    // 根据缩放手柄位置更新边界
    switch (handle) {
      case 'nw': // 左上
        newBounds.left = originalBounds.left + deltaX;
        newBounds.top = originalBounds.top + deltaY;
        newBounds.width = originalBounds.width - deltaX;
        newBounds.height = originalBounds.height - deltaY;
        break;

      case 'n': // 上
        newBounds.top = originalBounds.top + deltaY;
        newBounds.height = originalBounds.height - deltaY;
        break;

      case 'ne': // 右上
        newBounds.top = originalBounds.top + deltaY;
        newBounds.width = originalBounds.width + deltaX;
        newBounds.height = originalBounds.height - deltaY;
        break;

      case 'e': // 右
        newBounds.width = originalBounds.width + deltaX;
        break;

      case 'se': // 右下
        newBounds.width = originalBounds.width + deltaX;
        newBounds.height = originalBounds.height + deltaY;
        break;

      case 's': // 下
        newBounds.height = originalBounds.height + deltaY;
        break;

      case 'sw': // 左下
        newBounds.left = originalBounds.left + deltaX;
        newBounds.width = originalBounds.width - deltaX;
        newBounds.height = originalBounds.height + deltaY;
        break;

      case 'w': // 左
        newBounds.left = originalBounds.left + deltaX;
        newBounds.width = originalBounds.width - deltaX;
        break;
    }

    // 保持宽高比
    if (maintainAspectRatio) {
      const aspectRatio = originalBounds.width / originalBounds.height;

      // 根据手柄位置决定基准
      if (['nw', 'ne', 'se', 'sw'].includes(handle)) {
        // 角落手柄: 以宽度为基准
        newBounds.height = newBounds.width / aspectRatio;

        // 调整位置 (如果是上方手柄)
        if (handle === 'nw' || handle === 'ne') {
          newBounds.top = originalBounds.top + originalBounds.height - newBounds.height;
        }
      }
    }

    return newBounds;
  }

  /**
   * 应用边界约束
   */
  private constrainToBounds(
    bounds: Rectangle,
    constraints: ConstraintOptions
  ): Rectangle {
    const newBounds = { ...bounds };

    // 最小/最大尺寸约束
    if (constraints.minWidth !== undefined) {
      newBounds.width = Math.max(newBounds.width, constraints.minWidth);
    }
    if (constraints.minHeight !== undefined) {
      newBounds.height = Math.max(newBounds.height, constraints.minHeight);
    }
    if (constraints.maxWidth !== undefined) {
      newBounds.width = Math.min(newBounds.width, constraints.maxWidth);
    }
    if (constraints.maxHeight !== undefined) {
      newBounds.height = Math.min(newBounds.height, constraints.maxHeight);
    }

    // 容器边界约束
    if (constraints.stayInContainer && constraints.containerBounds) {
      const container = constraints.containerBounds;

      // 左边界
      if (newBounds.left < container.left) {
        newBounds.left = container.left;
      }

      // 上边界
      if (newBounds.top < container.top) {
        newBounds.top = container.top;
      }

      // 右边界
      if (newBounds.left + newBounds.width > container.left + container.width) {
        newBounds.left = container.left + container.width - newBounds.width;
      }

      // 下边界
      if (newBounds.top + newBounds.height > container.top + container.height) {
        newBounds.top = container.top + container.height - newBounds.height;
      }
    }

    return newBounds;
  }
}

// ============================================================================
// 导出
// ============================================================================

export default TransformManager;
