/**
 * 微信小程序可视化开发平台 - 选择管理器
 *
 * 负责管理组件的选择状态,支持单选、多选、框选
 * 参考 GDevelop InstancesSelection
 */

import type { Component } from '../../../01_Core_ProjectStructure/implementation/types';
import type {
  Rectangle,
  SelectOptions,
  AlignmentGuide,
  AlignmentEdge,
  DEFAULT_ALIGNMENT_THRESHOLD,
} from './types';

// ============================================================================
// 选择管理器
// ============================================================================

/**
 * 选择管理器
 *
 * 职责:
 * - 管理组件选择状态 (单选/多选/框选)
 * - 提供选择查询接口
 * - 计算对齐辅助线
 * - 处理选择过滤 (锁定/隐藏)
 */
export class SelectionManager {
  /** 选中的组件 ID 集合 */
  private selectedIds: Set<string> = new Set();

  /**
   * 选择单个组件
   */
  selectComponent(id: string, options: SelectOptions = {}): void {
    const { multiSelect = false, toggle = false, ignoreLocked = false } = options;

    // 检查组件是否存在且可选择
    // (实际使用时需要传入组件实例进行验证)

    if (toggle) {
      // 切换模式: 如果已选中则取消,否则添加
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        if (!multiSelect) {
          this.selectedIds.clear();
        }
        this.selectedIds.add(id);
      }
    } else {
      // 普通模式
      if (multiSelect) {
        // 多选: 添加到选择集合
        this.selectedIds.add(id);
      } else {
        // 单选: 清空其他选择
        this.selectedIds.clear();
        this.selectedIds.add(id);
      }
    }
  }

  /**
   * 选择多个组件
   */
  selectComponents(ids: string[], options: SelectOptions = {}): void {
    const { multiSelect = false } = options;

    if (!multiSelect) {
      this.selectedIds.clear();
    }

    ids.forEach((id) => this.selectedIds.add(id));
  }

  /**
   * 框选区域内的组件
   */
  selectInRectangle(
    rect: Rectangle,
    allComponents: Component[],
    options: SelectOptions = {}
  ): void {
    const { multiSelect = false } = options;

    if (!multiSelect) {
      this.selectedIds.clear();
    }

    // 查找所有在矩形内的组件
    const idsInRect = this.findComponentsInRectangle(rect, allComponents);
    idsInRect.forEach((id) => this.selectedIds.add(id));
  }

  /**
   * 取消选择组件
   */
  unselectComponent(id: string): void {
    this.selectedIds.delete(id);
  }

  /**
   * 清空所有选择
   */
  clearSelection(): void {
    this.selectedIds.clear();
  }

  /**
   * 检查组件是否被选中
   */
  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  /**
   * 获取选中的组件 ID 列表
   */
  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  /**
   * 获取选中组件数量
   */
  getSelectionCount(): number {
    return this.selectedIds.size;
  }

  /**
   * 是否有选中的组件
   */
  hasSelection(): boolean {
    return this.selectedIds.size > 0;
  }

  /**
   * 获取选中的组件实例
   */
  getSelectedComponents(allComponents: Component[]): Component[] {
    const selected: Component[] = [];
    this.findComponentsById(allComponents, selected);
    return selected;
  }

  /**
   * 递归查找组件
   */
  private findComponentsById(
    components: Component[],
    result: Component[]
  ): void {
    for (const component of components) {
      if (this.selectedIds.has(component.id)) {
        result.push(component);
      }

      // 递归查找子组件
      if (component.children && component.children.length > 0) {
        this.findComponentsById(component.children, result);
      }
    }
  }

  /**
   * 查找矩形区域内的组件
   */
  private findComponentsInRectangle(
    rect: Rectangle,
    components: Component[]
  ): string[] {
    const ids: string[] = [];

    for (const component of components) {
      // 计算组件边界 (简化版,实际应该使用 CanvasRenderer.calculateBounds)
      const bounds = this.getComponentBounds(component);

      // 检查是否相交
      if (this.isRectangleIntersect(rect, bounds)) {
        ids.push(component.id);
      }

      // 递归查找子组件
      if (component.children && component.children.length > 0) {
        ids.push(...this.findComponentsInRectangle(rect, component.children));
      }
    }

    return ids;
  }

  /**
   * 获取组件边界 (简化版)
   */
  private getComponentBounds(component: Component): Rectangle {
    const { style } = component;
    return {
      left: parseFloat(style.left || '0'),
      top: parseFloat(style.top || '0'),
      width: parseFloat(style.width || '100'),
      height: parseFloat(style.height || '100'),
    };
  }

  /**
   * 判断两个矩形是否相交
   */
  private isRectangleIntersect(rect1: Rectangle, rect2: Rectangle): boolean {
    return !(
      rect1.left + rect1.width < rect2.left ||
      rect2.left + rect2.width < rect1.left ||
      rect1.top + rect1.height < rect2.top ||
      rect2.top + rect2.height < rect1.top
    );
  }

  /**
   * 查找对齐辅助线
   *
   * 检测移动组件与其他组件的边缘对齐情况
   */
  findAlignmentGuides(
    movingBounds: Rectangle,
    allComponents: Component[],
    threshold: number = 5
  ): AlignmentGuide[] {
    const guides: AlignmentGuide[] = [];
    const checkedPositions = new Set<string>(); // 避免重复

    for (const component of allComponents) {
      // 跳过选中的组件
      if (this.selectedIds.has(component.id)) {
        continue;
      }

      const bounds = this.getComponentBounds(component);

      // 检查垂直对齐
      this.checkVerticalAlignment(movingBounds, bounds, threshold, guides, checkedPositions);

      // 检查水平对齐
      this.checkHorizontalAlignment(movingBounds, bounds, threshold, guides, checkedPositions);

      // 递归检查子组件
      if (component.children && component.children.length > 0) {
        guides.push(
          ...this.findAlignmentGuides(movingBounds, component.children, threshold)
        );
      }
    }

    return guides;
  }

  /**
   * 检查垂直对齐 (左、右、中心)
   */
  private checkVerticalAlignment(
    movingBounds: Rectangle,
    targetBounds: Rectangle,
    threshold: number,
    guides: AlignmentGuide[],
    checkedPositions: Set<string>
  ): void {
    const movingLeft = movingBounds.left;
    const movingRight = movingBounds.left + movingBounds.width;
    const movingCenterX = movingBounds.left + movingBounds.width / 2;

    const targetLeft = targetBounds.left;
    const targetRight = targetBounds.left + targetBounds.width;
    const targetCenterX = targetBounds.left + targetBounds.width / 2;

    // 左边缘对齐
    if (Math.abs(movingLeft - targetLeft) < threshold) {
      const key = `v-left-${targetLeft}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'vertical', position: targetLeft, edge: 'left' });
        checkedPositions.add(key);
      }
    }

    // 右边缘对齐
    if (Math.abs(movingRight - targetRight) < threshold) {
      const key = `v-right-${targetRight}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'vertical', position: targetRight, edge: 'right' });
        checkedPositions.add(key);
      }
    }

    // 中心对齐
    if (Math.abs(movingCenterX - targetCenterX) < threshold) {
      const key = `v-center-${targetCenterX}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'vertical', position: targetCenterX, edge: 'centerX' });
        checkedPositions.add(key);
      }
    }

    // 左边缘对齐目标的右边缘 (对接)
    if (Math.abs(movingLeft - targetRight) < threshold) {
      const key = `v-left-target-right-${targetRight}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'vertical', position: targetRight, edge: 'left' });
        checkedPositions.add(key);
      }
    }

    // 右边缘对齐目标的左边缘 (对接)
    if (Math.abs(movingRight - targetLeft) < threshold) {
      const key = `v-right-target-left-${targetLeft}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'vertical', position: targetLeft, edge: 'right' });
        checkedPositions.add(key);
      }
    }
  }

  /**
   * 检查水平对齐 (上、下、中心)
   */
  private checkHorizontalAlignment(
    movingBounds: Rectangle,
    targetBounds: Rectangle,
    threshold: number,
    guides: AlignmentGuide[],
    checkedPositions: Set<string>
  ): void {
    const movingTop = movingBounds.top;
    const movingBottom = movingBounds.top + movingBounds.height;
    const movingCenterY = movingBounds.top + movingBounds.height / 2;

    const targetTop = targetBounds.top;
    const targetBottom = targetBounds.top + targetBounds.height;
    const targetCenterY = targetBounds.top + targetBounds.height / 2;

    // 上边缘对齐
    if (Math.abs(movingTop - targetTop) < threshold) {
      const key = `h-top-${targetTop}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'horizontal', position: targetTop, edge: 'top' });
        checkedPositions.add(key);
      }
    }

    // 下边缘对齐
    if (Math.abs(movingBottom - targetBottom) < threshold) {
      const key = `h-bottom-${targetBottom}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'horizontal', position: targetBottom, edge: 'bottom' });
        checkedPositions.add(key);
      }
    }

    // 中心对齐
    if (Math.abs(movingCenterY - targetCenterY) < threshold) {
      const key = `h-center-${targetCenterY}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'horizontal', position: targetCenterY, edge: 'centerY' });
        checkedPositions.add(key);
      }
    }

    // 上边缘对齐目标的下边缘 (对接)
    if (Math.abs(movingTop - targetBottom) < threshold) {
      const key = `h-top-target-bottom-${targetBottom}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'horizontal', position: targetBottom, edge: 'top' });
        checkedPositions.add(key);
      }
    }

    // 下边缘对齐目标的上边缘 (对接)
    if (Math.abs(movingBottom - targetTop) < threshold) {
      const key = `h-bottom-target-top-${targetTop}`;
      if (!checkedPositions.has(key)) {
        guides.push({ type: 'horizontal', position: targetTop, edge: 'bottom' });
        checkedPositions.add(key);
      }
    }
  }

  /**
   * 应用对齐吸附
   *
   * 根据对齐辅助线调整组件位置
   */
  applyAlignmentSnap(
    bounds: Rectangle,
    guides: AlignmentGuide[]
  ): Rectangle {
    const newBounds = { ...bounds };

    for (const guide of guides) {
      if (guide.type === 'vertical') {
        // 垂直辅助线,调整水平位置
        switch (guide.edge) {
          case 'left':
            newBounds.left = guide.position;
            break;
          case 'right':
            newBounds.left = guide.position - bounds.width;
            break;
          case 'centerX':
            newBounds.left = guide.position - bounds.width / 2;
            break;
        }
      } else {
        // 水平辅助线,调整垂直位置
        switch (guide.edge) {
          case 'top':
            newBounds.top = guide.position;
            break;
          case 'bottom':
            newBounds.top = guide.position - bounds.height;
            break;
          case 'centerY':
            newBounds.top = guide.position - bounds.height / 2;
            break;
        }
      }
    }

    return newBounds;
  }
}

// ============================================================================
// 导出
// ============================================================================

export default SelectionManager;
