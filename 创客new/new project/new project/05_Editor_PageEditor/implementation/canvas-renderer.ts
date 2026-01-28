/**
 * 微信小程序可视化开发平台 - 画布渲染器
 *
 * 负责将组件树渲染到画布,处理布局计算和设备适配
 * 参考 GDevelop InstancesRenderer
 */

import type { Component, ComponentStyle } from '../../../01_Core_ProjectStructure/implementation/types';
import type {
  Point,
  Size,
  Rectangle,
  RenderContext,
  RenderedComponent,
  GridLines,
  Rulers,
  RulerTick,
  DeviceType,
  AlignmentGuide,
  CanvasState,
} from './types';

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 将 rpx 转换为 px
 */
function rpxToPixel(rpx: number, deviceWidth: number): number {
  // 微信小程序规定屏幕宽度为 750rpx
  return (rpx / 750) * deviceWidth;
}

/**
 * 将 px 转换为 rpx
 */
function pixelToRpx(px: number, deviceWidth: number): number {
  return (px / deviceWidth) * 750;
}

/**
 * 解析样式值,支持 rpx, px, %
 */
function parseStyleValue(value: string | undefined, parentSize: number, deviceWidth: number): number {
  if (!value) return 0;

  // rpx
  if (value.endsWith('rpx')) {
    const rpx = parseFloat(value);
    return rpxToPixel(rpx, deviceWidth);
  }

  // px
  if (value.endsWith('px')) {
    return parseFloat(value);
  }

  // %
  if (value.endsWith('%')) {
    const percent = parseFloat(value) / 100;
    return parentSize * percent;
  }

  // 纯数字,默认当作 px
  return parseFloat(value) || 0;
}

/**
 * 创建矩形
 */
function createRectangle(left: number, top: number, width: number, height: number): Rectangle {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

// ============================================================================
// 画布渲染器
// ============================================================================

/**
 * 画布渲染器
 *
 * 职责:
 * - 将组件树渲染为可视化表示
 * - 计算组件在画布上的精确位置和大小
 * - 处理 rpx 到 px 的转换
 * - 支持嵌套组件的递归渲染
 * - 生成网格、标尺、对齐辅助线
 */
export class CanvasRenderer {
  /**
   * 渲染组件列表
   */
  renderComponents(
    components: Component[],
    context: RenderContext
  ): RenderedComponent[] {
    const { canvasState, selectionState, parentBounds, depth } = context;

    return components.map((component) => {
      // 计算组件边界
      const bounds = this.calculateBounds(component, parentBounds, canvasState);

      // 检查是否被选中
      const isSelected = selectionState.selectedIds.includes(component.id);

      // 递归渲染子组件
      const children = component.children
        ? this.renderComponents(component.children, {
            ...context,
            parentBounds: bounds,
            depth: depth + 1,
          })
        : [];

      // 构建路径
      const path = parentBounds ? [] : [component.id];

      return {
        id: component.id,
        component,
        bounds,
        isSelected,
        children,
        path,
      };
    });
  }

  /**
   * 计算组件边界
   */
  calculateBounds(
    component: Component,
    parentBounds: Rectangle | undefined,
    canvasState: CanvasState
  ): Rectangle {
    const { style } = component;
    const { deviceWidth } = canvasState;

    // 父级尺寸 (用于计算百分比)
    const parentWidth = parentBounds?.width ?? deviceWidth;
    const parentHeight = parentBounds?.height ?? deviceWidth * 2; // 默认高度

    // 解析样式值
    const left = parseStyleValue(style.left, parentWidth, deviceWidth);
    const top = parseStyleValue(style.top, parentHeight, deviceWidth);
    const width = parseStyleValue(style.width, parentWidth, deviceWidth);
    const height = parseStyleValue(style.height, parentHeight, deviceWidth);

    // 如果有父级边界,需要加上父级的偏移
    const absoluteLeft = parentBounds ? parentBounds.left + left : left;
    const absoluteTop = parentBounds ? parentBounds.top + top : top;

    return createRectangle(absoluteLeft, absoluteTop, width, height);
  }

  /**
   * 将组件样式转换为 CSS 样式对象
   */
  transformStyleToCss(
    style: ComponentStyle,
    deviceWidth: number
  ): React.CSSProperties {
    const cssStyle: React.CSSProperties = {};

    // 位置和尺寸
    if (style.left) cssStyle.left = parseStyleValue(style.left, deviceWidth, deviceWidth);
    if (style.top) cssStyle.top = parseStyleValue(style.top, deviceWidth * 2, deviceWidth);
    if (style.width) cssStyle.width = parseStyleValue(style.width, deviceWidth, deviceWidth);
    if (style.height) cssStyle.height = parseStyleValue(style.height, deviceWidth * 2, deviceWidth);

    // 其他样式直接复制
    const styleKeys: (keyof ComponentStyle)[] = [
      'backgroundColor',
      'color',
      'fontSize',
      'padding',
      'margin',
      'border',
      'borderRadius',
      'textAlign',
      'display',
      'flexDirection',
      'justifyContent',
      'alignItems',
    ];

    styleKeys.forEach((key) => {
      if (style[key]) {
        cssStyle[key as any] = style[key];
      }
    });

    return cssStyle;
  }

  /**
   * 渲染网格
   */
  renderGrid(
    canvasWidth: number,
    canvasHeight: number,
    gridSize: number
  ): GridLines {
    const vertical: number[] = [];
    const horizontal: number[] = [];

    // 垂直网格线
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      vertical.push(x);
    }

    // 水平网格线
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      horizontal.push(y);
    }

    return { vertical, horizontal };
  }

  /**
   * 渲染标尺
   */
  renderRulers(
    canvasWidth: number,
    canvasHeight: number,
    zoom: number
  ): Rulers {
    const horizontal: RulerTick[] = [];
    const vertical: RulerTick[] = [];

    // 根据缩放级别调整刻度间隔
    const baseInterval = zoom >= 1 ? 50 : zoom >= 0.5 ? 100 : 200;

    // 水平标尺
    for (let x = 0; x <= canvasWidth; x += baseInterval) {
      horizontal.push({
        position: x,
        value: String(Math.round(x)),
        isMajor: x % (baseInterval * 2) === 0,
      });
    }

    // 垂直标尺
    for (let y = 0; y <= canvasHeight; y += baseInterval) {
      vertical.push({
        position: y,
        value: String(Math.round(y)),
        isMajor: y % (baseInterval * 2) === 0,
      });
    }

    return { horizontal, vertical };
  }

  /**
   * 查找组件在指定位置
   */
  findComponentAtPosition(
    position: Point,
    renderedComponents: RenderedComponent[]
  ): string | null {
    // 从后向前查找 (后面的组件在上层)
    for (let i = renderedComponents.length - 1; i >= 0; i--) {
      const rendered = renderedComponents[i];

      // 递归查找子组件
      if (rendered.children.length > 0) {
        const childId = this.findComponentAtPosition(position, rendered.children);
        if (childId) return childId;
      }

      // 检查当前组件
      if (this.isPointInRectangle(position, rendered.bounds)) {
        return rendered.id;
      }
    }

    return null;
  }

  /**
   * 查找矩形区域内的所有组件
   */
  findComponentsInRectangle(
    rect: Rectangle,
    renderedComponents: RenderedComponent[]
  ): string[] {
    const ids: string[] = [];

    for (const rendered of renderedComponents) {
      // 递归查找子组件
      if (rendered.children.length > 0) {
        ids.push(...this.findComponentsInRectangle(rect, rendered.children));
      }

      // 检查当前组件
      if (this.isRectangleIntersect(rect, rendered.bounds)) {
        ids.push(rendered.id);
      }
    }

    return ids;
  }

  /**
   * 判断点是否在矩形内
   */
  private isPointInRectangle(point: Point, rect: Rectangle): boolean {
    return (
      point.x >= rect.left &&
      point.x <= rect.left + rect.width &&
      point.y >= rect.top &&
      point.y <= rect.top + rect.height
    );
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
   * 获取设备宽度
   */
  getDeviceWidth(deviceType: DeviceType): number {
    return deviceType === 'mobile' ? 375 : 750;
  }

  /**
   * 获取设备高度
   */
  getDeviceHeight(deviceType: DeviceType): number {
    return deviceType === 'mobile' ? 667 : 1334;
  }

  /**
   * 计算缩放后的画布尺寸
   */
  getScaledCanvasSize(deviceType: DeviceType, zoom: number): Size {
    const width = this.getDeviceWidth(deviceType) * zoom;
    const height = this.getDeviceHeight(deviceType) * zoom;
    return { width, height };
  }
}

// ============================================================================
// 导出
// ============================================================================

export default CanvasRenderer;
