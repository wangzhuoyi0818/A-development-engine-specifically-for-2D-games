/**
 * 组件编辑器模块 - 类型定义
 *
 * 定义组件库、属性编辑器、事件绑定等相关类型
 */

// ============================================================================
// 组件库相关类型
// ============================================================================

/**
 * 组件分类
 */
export enum ComponentCategory {
  /** 视图容器 */
  ViewContainer = 'view-container',
  /** 基础内容 */
  BasicContent = 'basic-content',
  /** 表单组件 */
  Form = 'form',
  /** 导航 */
  Navigation = 'navigation',
  /** 媒体组件 */
  Media = 'media',
  /** 地图 */
  Map = 'map',
  /** 画布 */
  Canvas = 'canvas',
  /** 开放能力 */
  OpenAbility = 'open-ability',
  /** 自定义组件 */
  Custom = 'custom',
}

/**
 * 属性类型
 */
export enum PropertyType {
  /** 字符串 */
  String = 'string',
  /** 数字 */
  Number = 'number',
  /** 布尔值 */
  Boolean = 'boolean',
  /** 颜色 */
  Color = 'color',
  /** 图片 */
  Image = 'image',
  /** 枚举(下拉选择) */
  Enum = 'enum',
  /** 对象 */
  Object = 'object',
  /** 数组 */
  Array = 'array',
  /** 事件 */
  Event = 'event',
  /** 表达式 */
  Expression = 'expression',
}

/**
 * 属性定义
 */
export interface PropertyDefinition {
  /** 属性名称 */
  name: string;

  /** 属性标签(显示名称) */
  label: string;

  /** 属性类型 */
  type: PropertyType;

  /** 默认值 */
  defaultValue?: any;

  /** 属性描述 */
  description?: string;

  /** 是否必填 */
  required?: boolean;

  /** 枚举选项(当 type 为 Enum 时) */
  options?: PropertyOption[];

  /** 最小值(当 type 为 Number 时) */
  min?: number;

  /** 最大值(当 type 为 Number 时) */
  max?: number;

  /** 步长(当 type 为 Number 时) */
  step?: number;

  /** 正则表达式验证(当 type 为 String 时) */
  pattern?: string;

  /** 允许的文件类型(当 type 为 Image 时) */
  accept?: string[];

  /** 属性分组 */
  group?: string;

  /** 是否支持数据绑定 */
  bindable?: boolean;

  /** 是否显示在编辑器中 */
  visible?: boolean;

  /** 条件显示(依赖其他属性) */
  visibleWhen?: PropertyCondition;
}

/**
 * 属性选项(用于枚举类型)
 */
export interface PropertyOption {
  /** 选项值 */
  value: any;

  /** 选项标签 */
  label: string;

  /** 选项图标 */
  icon?: string;
}

/**
 * 属性条件(条件显示)
 */
export interface PropertyCondition {
  /** 依赖的属性名 */
  property: string;

  /** 条件操作符 */
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains';

  /** 条件值 */
  value: any;
}

/**
 * 事件定义
 */
export interface EventDefinition {
  /** 事件名称 */
  name: string;

  /** 事件标签(显示名称) */
  label: string;

  /** 事件描述 */
  description?: string;

  /** 事件参数 */
  params?: EventParam[];

  /** 事件分组 */
  group?: string;
}

/**
 * 事件参数
 */
export interface EventParam {
  /** 参数名 */
  name: string;

  /** 参数类型 */
  type: string;

  /** 参数描述 */
  description?: string;
}

/**
 * 组件库条目
 */
export interface ComponentLibraryItem {
  /** 组件ID */
  id: string;

  /** 组件名称 */
  name: string;

  /** 组件标签(显示名称) */
  label: string;

  /** 组件描述 */
  description?: string;

  /** 组件分类 */
  category: ComponentCategory;

  /** 组件图标 */
  icon?: string;

  /** 组件标签(用于搜索和筛选) */
  tags?: string[];

  /** 组件属性定义 */
  properties: PropertyDefinition[];

  /** 组件事件定义 */
  events: EventDefinition[];

  /** 是否允许有子组件 */
  canHaveChildren: boolean;

  /** 允许的父组件类型(空表示不限制) */
  allowedParents?: string[];

  /** 允许的子组件类型(空表示不限制) */
  allowedChildren?: string[];

  /** 默认样式 */
  defaultStyle?: Record<string, any>;

  /** 是否是容器组件 */
  isContainer: boolean;

  /** 是否是内联组件 */
  isInline: boolean;

  /** 组件示例 */
  example?: string;

  /** 文档链接 */
  docUrl?: string;
}

// ============================================================================
// 属性编辑器相关类型
// ============================================================================

/**
 * 属性编辑器配置
 */
export interface PropertyEditorConfig {
  /** 组件ID */
  componentId: string;

  /** 组件类型 */
  componentType: string;

  /** 可编辑的属性 */
  properties: PropertyDefinition[];

  /** 属性值 */
  values: Record<string, any>;

  /** 属性分组 */
  groups?: PropertyGroup[];

  /** 是否显示高级选项 */
  showAdvanced?: boolean;

  /** 只读模式 */
  readOnly?: boolean;

  /** 变更回调 */
  onChange?: (property: string, value: any) => void;

  /** 验证回调 */
  onValidate?: (property: string, value: any) => ValidationResult;
}

/**
 * 属性分组
 */
export interface PropertyGroup {
  /** 分组ID */
  id: string;

  /** 分组标签 */
  label: string;

  /** 分组描述 */
  description?: string;

  /** 是否默认展开 */
  expanded?: boolean;

  /** 分组图标 */
  icon?: string;
}

/**
 * 属性值变更
 */
export interface PropertyChange {
  /** 组件ID */
  componentId: string;

  /** 属性名 */
  property: string;

  /** 旧值 */
  oldValue: any;

  /** 新值 */
  newValue: any;

  /** 变更时间 */
  timestamp: Date;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;

  /** 错误消息 */
  message?: string;

  /** 错误代码 */
  code?: string;
}

// ============================================================================
// 事件绑定相关类型
// ============================================================================

/**
 * 事件绑定
 */
export interface EventBinding {
  /** 绑定ID */
  id: string;

  /** 组件ID */
  componentId: string;

  /** 事件名称 */
  eventName: string;

  /** 绑定类型 */
  bindingType: EventBindingType;

  /** 处理函数名(当 bindingType 为 Function 时) */
  handlerName?: string;

  /** 动作列表(当 bindingType 为 Actions 时) */
  actions?: EventAction[];

  /** 代码(当 bindingType 为 Code 时) */
  code?: string;
}

/**
 * 事件绑定类型
 */
export enum EventBindingType {
  /** 函数 */
  Function = 'function',
  /** 动作列表 */
  Actions = 'actions',
  /** 自定义代码 */
  Code = 'code',
}

/**
 * 事件动作
 */
export interface EventAction {
  /** 动作ID */
  id: string;

  /** 动作类型 */
  type: EventActionType;

  /** 动作参数 */
  params: Record<string, any>;

  /** 动作描述 */
  description?: string;

  /** 条件(可选) */
  condition?: EventCondition;
}

/**
 * 事件动作类型
 */
export enum EventActionType {
  /** 页面跳转 */
  Navigate = 'navigate',
  /** 设置数据 */
  SetData = 'setData',
  /** 显示提示 */
  ShowToast = 'showToast',
  /** 显示模态框 */
  ShowModal = 'showModal',
  /** 显示加载中 */
  ShowLoading = 'showLoading',
  /** 隐藏加载中 */
  HideLoading = 'hideLoading',
  /** 发起请求 */
  Request = 'request',
  /** 调用API */
  CallAPI = 'callAPI',
  /** 触发自定义事件 */
  EmitEvent = 'emitEvent',
  /** 自定义 */
  Custom = 'custom',
}

/**
 * 事件条件
 */
export interface EventCondition {
  /** 条件类型 */
  type: 'expression' | 'variable' | 'custom';

  /** 条件表达式 */
  expression?: string;

  /** 变量名(当 type 为 variable 时) */
  variable?: string;

  /** 操作符 */
  operator?: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';

  /** 比较值 */
  value?: any;
}

// ============================================================================
// 样式编辑器相关类型
// ============================================================================

/**
 * 样式编辑器配置
 */
export interface StyleEditorConfig {
  /** 组件ID */
  componentId: string;

  /** 当前样式 */
  styles: Record<string, any>;

  /** 样式分组 */
  groups?: StyleGroup[];

  /** 变更回调 */
  onChange?: (property: string, value: any) => void;
}

/**
 * 样式分组
 */
export interface StyleGroup {
  /** 分组ID */
  id: string;

  /** 分组标签 */
  label: string;

  /** 样式属性 */
  properties: StyleProperty[];

  /** 是否默认展开 */
  expanded?: boolean;
}

/**
 * 样式属性
 */
export interface StyleProperty {
  /** 属性名 */
  name: string;

  /** 属性标签 */
  label: string;

  /** 属性类型 */
  type: 'color' | 'size' | 'number' | 'enum' | 'text';

  /** 默认值 */
  defaultValue?: any;

  /** 单位(当 type 为 size 时) */
  unit?: 'px' | 'rpx' | '%' | 'em' | 'rem' | 'vh' | 'vw';

  /** 枚举选项(当 type 为 enum 时) */
  options?: PropertyOption[];
}

// ============================================================================
// 组件预览相关类型
// ============================================================================

/**
 * 组件预览配置
 */
export interface ComponentPreviewConfig {
  /** 组件数据 */
  component: any;

  /** 预览模式 */
  mode: 'desktop' | 'mobile' | 'tablet';

  /** 是否显示边框 */
  showBorder?: boolean;

  /** 是否显示组件名称 */
  showLabel?: boolean;

  /** 缩放比例 */
  scale?: number;
}

// ============================================================================
// 导出
// ============================================================================

export type {
  PropertyDefinition as ComponentPropertyDefinition,
  EventDefinition as ComponentEventDefinition,
};
