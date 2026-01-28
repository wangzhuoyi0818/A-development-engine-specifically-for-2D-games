/**
 * 微信小程序可视化开发平台 - 页面编辑器类型定义
 *
 * 本文件定义了页面编辑器的所有 TypeScript 类型接口
 * 参考 GDevelop 的 InstancesEditor 和 SceneEditor 结构
 */

import type { Component, Page } from '../../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// 基础几何类型
// ============================================================================

/**
 * 2D 点坐标
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 尺寸
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 矩形边界
 */
export interface Rectangle {
  left: number;
  top: number;
  width: number;
  height: number;
  right?: number;   // 计算属性: left + width
  bottom?: number;  // 计算属性: top + height
}

/**
 * 方向枚举
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

// ============================================================================
// 编辑器状态
// ============================================================================

/**
 * 编辑器完整状态
 */
export interface EditorState {
  /** 画布状态 */
  canvas: CanvasState;

  /** 选择状态 */
  selection: SelectionState;

  /** 变换状态 */
  transform: TransformState;

  /** 历史状态 */
  history: HistoryState;

  /** 剪贴板状态 */
  clipboard: ClipboardState;

  /** UI 状态 */
  ui: UIState;
}

/**
 * 画布状态
 */
export interface CanvasState {
  /** 缩放级别 (0.1 ~ 3.0) */
  zoom: number;

  /** 画布偏移 (用于平移) */
  offset: Point;

  /** 设备类型 */
  deviceType: DeviceType;

  /** 设备宽度 (px) */
  deviceWidth: number;

  /** 是否显示网格 */
  showGrid: boolean;

  /** 网格大小 (px) */
  gridSize: number;

  /** 是否显示标尺 */
  showRulers: boolean;

  /** 是否显示对齐辅助线 */
  showAlignmentGuides: boolean;

  /** 对齐检测阈值 (px) */
  alignmentThreshold: number;

  /** 是否启用网格吸附 */
  snapToGrid: boolean;

  /** 是否启用组件吸附 */
  snapToComponents: boolean;
}

/**
 * 设备类型
 */
export type DeviceType = 'mobile' | 'tablet';

/**
 * 设备配置
 */
export interface DeviceConfig {
  type: DeviceType;
  name: string;
  width: number;   // px
  height: number;  // px
  scale: number;   // rpx to px 比例
}

/**
 * 选择状态
 */
export interface SelectionState {
  /** 选中的组件 ID 列表 */
  selectedIds: string[];

  /** 是否正在多选 */
  isMultiSelect: boolean;

  /** 框选矩形 (拖拽框选时使用) */
  selectionBox: Rectangle | null;

  /** 对齐辅助线 */
  alignmentGuides: AlignmentGuide[];
}

/**
 * 对齐辅助线
 */
export interface AlignmentGuide {
  /** 辅助线类型 */
  type: 'horizontal' | 'vertical';

  /** 辅助线位置 (px) */
  position: number;

  /** 对齐边缘类型 */
  edge: AlignmentEdge;
}

/**
 * 对齐边缘类型
 */
export type AlignmentEdge =
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'centerX'
  | 'centerY';

/**
 * 变换状态
 */
export interface TransformState {
  /** 当前操作类型 */
  operation: OperationType | null;

  /** 拖拽状态 */
  dragState: DragState | null;

  /** 缩放状态 */
  resizeState: ResizeState | null;

  /** 旋转状态 (暂不实现) */
  rotateState: RotateState | null;
}

/**
 * 操作类型
 */
export type OperationType = 'drag' | 'resize' | 'rotate' | 'boxSelect';

/**
 * 拖拽状态
 */
export interface DragState {
  /** 被拖拽的组件 ID 列表 */
  componentIds: string[];

  /** 拖拽开始位置 */
  startPosition: Point;

  /** 当前鼠标位置 */
  currentPosition: Point;

  /** 原始边界 (组件ID -> 边界) */
  originalBounds: Map<string, Rectangle>;
}

/**
 * 缩放状态
 */
export interface ResizeState {
  /** 被缩放的组件 ID */
  componentId: string;

  /** 缩放手柄 */
  handle: ResizeHandle;

  /** 缩放开始位置 */
  startPosition: Point;

  /** 当前鼠标位置 */
  currentPosition: Point;

  /** 原始边界 */
  originalBounds: Rectangle;

  /** 是否保持宽高比 (Shift 键) */
  maintainAspectRatio: boolean;
}

/**
 * 缩放手柄位置
 */
export type ResizeHandle =
  | 'nw'  // 左上
  | 'n'   // 上
  | 'ne'  // 右上
  | 'e'   // 右
  | 'se'  // 右下
  | 's'   // 下
  | 'sw'  // 左下
  | 'w';  // 左

/**
 * 旋转状态 (暂不实现)
 */
export interface RotateState {
  componentId: string;
  startAngle: number;
  currentAngle: number;
  centerPoint: Point;
}

/**
 * 历史状态
 */
export interface HistoryState {
  /** 是否可以撤销 */
  canUndo: boolean;

  /** 是否可以重做 */
  canRedo: boolean;

  /** 撤销操作描述 */
  undoDescription: string | null;

  /** 重做操作描述 */
  redoDescription: string | null;
}

/**
 * 剪贴板状态
 */
export interface ClipboardState {
  /** 剪贴板中的组件 */
  components: Component[];

  /** 剪贴板类型 */
  type: 'copy' | 'cut' | null;
}

/**
 * UI 状态
 */
export interface UIState {
  /** 是否显示图层面板 */
  showLayerPanel: boolean;

  /** 是否显示属性面板 */
  showPropertyPanel: boolean;

  /** 是否显示工具栏 */
  showToolbar: boolean;

  /** 面板宽度 */
  layerPanelWidth: number;
  propertyPanelWidth: number;
}

// ============================================================================
// 命令系统
// ============================================================================

/**
 * 命令接口
 */
export interface Command {
  /** 执行命令 */
  execute(): void;

  /** 撤销命令 */
  undo(): void;

  /** 命令描述 (用于显示) */
  description: string;
}

/**
 * 批量命令 (宏命令)
 */
export interface BatchCommand extends Command {
  /** 子命令列表 */
  commands: Command[];
}

// ============================================================================
// 渲染相关
// ============================================================================

/**
 * 渲染上下文
 */
export interface RenderContext {
  /** 画布状态 */
  canvasState: CanvasState;

  /** 选择状态 */
  selectionState: SelectionState;

  /** 父级边界 (用于相对定位) */
  parentBounds?: Rectangle;

  /** 层级深度 (用于嵌套渲染) */
  depth: number;
}

/**
 * 渲染后的组件
 */
export interface RenderedComponent {
  /** 组件 ID */
  id: string;

  /** 组件实例 */
  component: Component;

  /** 计算后的边界 */
  bounds: Rectangle;

  /** 是否被选中 */
  isSelected: boolean;

  /** 子组件 */
  children: RenderedComponent[];

  /** 层级路径 (用于快速查找) */
  path: string[];
}

/**
 * 网格线
 */
export interface GridLines {
  /** 垂直线 */
  vertical: number[];

  /** 水平线 */
  horizontal: number[];
}

/**
 * 标尺
 */
export interface Rulers {
  /** 水平标尺刻度 */
  horizontal: RulerTick[];

  /** 垂直标尺刻度 */
  vertical: RulerTick[];
}

/**
 * 标尺刻度
 */
export interface RulerTick {
  /** 刻度位置 (px) */
  position: number;

  /** 刻度值 (显示文本) */
  value: string;

  /** 是否是主刻度 */
  isMajor: boolean;
}

// ============================================================================
// 选择选项
// ============================================================================

/**
 * 选择选项
 */
export interface SelectOptions {
  /** 是否多选 */
  multiSelect?: boolean;

  /** 是否切换选择状态 (已选中 → 取消选中) */
  toggle?: boolean;

  /** 是否忽略锁定 */
  ignoreLocked?: boolean;
}

// ============================================================================
// 变换选项
// ============================================================================

/**
 * 变换结果
 */
export interface Transform {
  /** 位置变化 */
  position?: Point;

  /** 大小变化 */
  size?: Size;

  /** 旋转角度变化 */
  rotation?: number;
}

/**
 * 约束选项
 */
export interface ConstraintOptions {
  /** 最小宽度 */
  minWidth?: number;

  /** 最小高度 */
  minHeight?: number;

  /** 最大宽度 */
  maxWidth?: number;

  /** 最大高度 */
  maxHeight?: number;

  /** 容器边界 */
  containerBounds?: Rectangle;

  /** 是否保持在容器内 */
  stayInContainer?: boolean;
}

// ============================================================================
// 编辑器配置
// ============================================================================

/**
 * 编辑器配置
 */
export interface EditorConfig {
  /** 默认设备类型 */
  defaultDeviceType?: DeviceType;

  /** 默认网格大小 */
  defaultGridSize?: number;

  /** 对齐阈值 */
  alignmentThreshold?: number;

  /** 最小组件尺寸 */
  minComponentWidth?: number;
  minComponentHeight?: number;

  /** 最大撤销栈大小 */
  maxUndoStackSize?: number;

  /** 是否启用自动保存 */
  autoSave?: boolean;

  /** 自动保存间隔 (毫秒) */
  autoSaveInterval?: number;

  /** 快捷键配置 */
  shortcuts?: ShortcutConfig;
}

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
  /** 撤销 */
  undo?: string;

  /** 重做 */
  redo?: string;

  /** 删除 */
  delete?: string;

  /** 复制 */
  copy?: string;

  /** 粘贴 */
  paste?: string;

  /** 全选 */
  selectAll?: string;

  /** 取消选择 */
  deselect?: string;
}

// ============================================================================
// 验证结果
// ============================================================================

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;

  /** 错误信息 */
  error?: string;

  /** 警告信息 */
  warnings?: string[];
}

// ============================================================================
// 事件回调
// ============================================================================

/**
 * 组件更新函数
 */
export type UpdateComponentFunction = (
  componentId: string,
  updates: Partial<Component>
) => void;

/**
 * 页面更新函数
 */
export type UpdatePageFunction = (page: Page) => void;

// ============================================================================
// 常量
// ============================================================================

/**
 * 默认配置
 */
export const DEFAULT_EDITOR_CONFIG: Required<EditorConfig> = {
  defaultDeviceType: 'mobile',
  defaultGridSize: 8,
  alignmentThreshold: 5,
  minComponentWidth: 10,
  minComponentHeight: 10,
  maxUndoStackSize: 50,
  autoSave: true,
  autoSaveInterval: 5000,
  shortcuts: {
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    delete: 'Delete',
    copy: 'Ctrl+C',
    paste: 'Ctrl+V',
    selectAll: 'Ctrl+A',
    deselect: 'Escape',
  },
};

/**
 * 设备预设
 */
export const DEVICE_PRESETS: DeviceConfig[] = [
  {
    type: 'mobile',
    name: 'iPhone',
    width: 375,
    height: 667,
    scale: 0.5, // 750rpx = 375px
  },
  {
    type: 'tablet',
    name: 'iPad',
    width: 750,
    height: 1334,
    scale: 1.0, // 750rpx = 750px
  },
];

/**
 * 最小组件尺寸
 */
export const MIN_COMPONENT_SIZE = 10;

/**
 * 默认网格大小
 */
export const DEFAULT_GRID_SIZE = 8;

/**
 * 默认对齐阈值
 */
export const DEFAULT_ALIGNMENT_THRESHOLD = 5;

/**
 * 键盘移动距离
 */
export const KEYBOARD_MOVE_DISTANCE = {
  normal: 1,
  large: 10,
};
