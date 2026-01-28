/**
 * 微信小程序可视化开发平台 - 变量系统类型定义
 *
 * 本文件定义了变量系统的所有 TypeScript 类型接口
 * 参考 GDevelop 的 Variable 和 VariablesContainer 结构
 */

// ============================================================================
// 变量类型枚举
// ============================================================================

/**
 * 变量类型枚举
 * 对应 GDevelop Variable::Type
 */
export enum VariableType {
  /** 未知类型 */
  Unknown = 'Unknown',

  /** 数字类型 */
  Number = 'Number',

  /** 字符串类型 */
  String = 'String',

  /** 布尔类型 */
  Boolean = 'Boolean',

  /** 结构体类型 (对象) */
  Structure = 'Structure',

  /** 数组类型 */
  Array = 'Array',
}

// ============================================================================
// 变量值类型
// ============================================================================

/**
 * 变量值联合类型
 * 表示变量可以存储的所有可能的值
 */
export type VariableValue =
  | number
  | string
  | boolean
  | { [key: string]: VariableValue }
  | VariableValue[]
  | null
  | undefined;

// ============================================================================
// 变量定义接口
// ============================================================================

/**
 * 变量定义接口
 * 用于定义变量的元数据
 */
export interface VariableDefinition {
  /** 变量ID (UUID v4) */
  id: string;

  /** 变量名 */
  name: string;

  /** 变量类型 */
  type: VariableType;

  /** 初始值 */
  initialValue: VariableValue;

  /** 变量描述 */
  description?: string;

  /** 是否是持久化变量 */
  persistent?: boolean;

  /** 是否折叠显示 (编辑器UI) */
  folded?: boolean;

  /** 持久化UUID (用于序列化识别) */
  persistentUuid?: string;
}

// ============================================================================
// 变量容器作用域
// ============================================================================

/**
 * 变量容器来源类型
 * 对应 GDevelop VariablesContainer::SourceType
 */
export enum VariableSourceType {
  /** 未知 */
  Unknown = 'Unknown',

  /** 全局变量 */
  Global = 'Global',

  /** 页面变量 (Scene) */
  Scene = 'Scene',

  /** 组件变量 (Object) */
  Object = 'Object',

  /** 本地变量 */
  Local = 'Local',

  /** 扩展全局变量 */
  ExtensionGlobal = 'ExtensionGlobal',

  /** 扩展页面变量 */
  ExtensionScene = 'ExtensionScene',

  /** 参数变量 */
  Parameters = 'Parameters',

  /** 属性变量 */
  Properties = 'Properties',
}

// ============================================================================
// 响应式相关类型
// ============================================================================

/**
 * 变量观察者回调函数
 */
export type WatchCallback = (newValue: VariableValue, oldValue: VariableValue) => void;

/**
 * 变量观察者选项
 */
export interface WatchOptions {
  /** 是否立即执行回调 */
  immediate?: boolean;

  /** 是否深度监听 */
  deep?: boolean;

  /** 回调执行的上下文 */
  context?: any;
}

/**
 * 变量观察者接口
 */
export interface Watcher {
  /** 观察者ID */
  id: string;

  /** 变量路径 */
  path: string;

  /** 回调函数 */
  callback: WatchCallback;

  /** 观察选项 */
  options: WatchOptions;

  /** 取消观察 */
  unwatch: () => void;
}

/**
 * 计算属性函数
 */
export type ComputedGetter = () => VariableValue;

/**
 * 计算属性接口
 */
export interface ComputedProperty {
  /** 计算属性ID */
  id: string;

  /** 属性名 */
  name: string;

  /** 计算函数 */
  getter: ComputedGetter;

  /** 依赖的变量路径列表 */
  dependencies: string[];

  /** 缓存的值 */
  cachedValue?: VariableValue;

  /** 是否需要重新计算 */
  dirty: boolean;
}

// ============================================================================
// 序列化相关类型
// ============================================================================

/**
 * 变量序列化数据
 */
export interface SerializedVariable {
  /** 变量类型 */
  type: VariableType;

  /** 变量值 */
  value?: number | string | boolean;

  /** 子变量 (结构体) */
  children?: { [key: string]: SerializedVariable };

  /** 子变量数组 (数组) */
  childrenArray?: SerializedVariable[];

  /** 持久化UUID */
  persistentUuid?: string;

  /** 是否折叠 */
  folded?: boolean;
}

/**
 * 变量容器序列化数据
 */
export interface SerializedVariablesContainer {
  /** 来源类型 */
  sourceType: VariableSourceType;

  /** 变量列表 */
  variables: Array<{
    name: string;
    variable: SerializedVariable;
  }>;

  /** 持久化UUID */
  persistentUuid?: string;
}

// ============================================================================
// 变量操作结果
// ============================================================================

/**
 * 变量操作结果
 */
export interface VariableOperationResult {
  /** 是否成功 */
  success: boolean;

  /** 错误消息 */
  error?: string;

  /** 结果数据 */
  data?: any;
}

// ============================================================================
// 变量路径解析
// ============================================================================

/**
 * 变量路径段类型
 */
export enum PathSegmentType {
  /** 属性访问 (.) */
  Property = 'Property',

  /** 数组索引 ([]) */
  Index = 'Index',
}

/**
 * 变量路径段
 */
export interface PathSegment {
  /** 段类型 */
  type: PathSegmentType;

  /** 属性名或数组索引 */
  value: string | number;
}

/**
 * 解析后的变量路径
 */
export interface ParsedPath {
  /** 根变量名 */
  root: string;

  /** 路径段列表 */
  segments: PathSegment[];

  /** 原始路径字符串 */
  raw: string;
}

// ============================================================================
// 导出所有类型
// ============================================================================

export type {
  VariableValue,
  VariableDefinition,
  WatchCallback,
  WatchOptions,
  Watcher,
  ComputedGetter,
  ComputedProperty,
  SerializedVariable,
  SerializedVariablesContainer,
  VariableOperationResult,
  PathSegment,
  ParsedPath,
};

export {
  VariableType,
  VariableSourceType,
  PathSegmentType,
};
