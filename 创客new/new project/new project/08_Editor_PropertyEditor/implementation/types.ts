/**
 * 微信小程序可视化开发平台 - 属性编辑器类型定义
 *
 * 本文件定义了属性编辑器模块的所有 TypeScript 类型接口
 */

// ============================================================================
// 属性类型枚举
// ============================================================================

/**
 * 属性类型枚举
 * 定义了属性编辑器支持的所有属性类型
 */
export enum PropertyType {
  // 基本类型
  Text = 'text',           // 文本输入
  Number = 'number',       // 数字输入
  Color = 'color',         // 颜色选择
  Select = 'select',       // 下拉选择
  Checkbox = 'checkbox',   // 复选框
  Switch = 'switch',       // 开关
  Slider = 'slider',       // 滑块
  Rating = 'rating',       // 评分

  // 高级类型
  Date = 'date',           // 日期选择
  Time = 'time',           // 时间选择
  DateTime = 'dateTime',   // 日期时间
  File = 'file',           // 文件选择
  Image = 'image',         // 图片选择
  Textarea = 'textarea',   // 多行文本

  // 特殊类型
  Binding = 'binding',     // 变量绑定
  Expression = 'expression', // 表达式
  Json = 'json',           // JSON对象
  Code = 'code',           // 代码编辑

  // 扩展类型
  FontSelector = 'fontSelector',   // 字体选择
  IconSelector = 'iconSelector',   // 图标选择
  Gradient = 'gradient',           // 渐变色
  Shadow = 'shadow',               // 阴影
  Border = 'border',               // 边框
}

// ============================================================================
// 属性值类型
// ============================================================================

/**
 * 属性值联合类型
 * 表示属性可以存储的所有可能的值
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | Date
  | { [key: string]: PropertyValue }
  | PropertyValue[]
  | null
  | undefined;

/**
 * 颜色值类型
 */
export interface ColorValue {
  /** 颜色格式 */
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

  /** 颜色值 */
  value: string;

  /** 不透明度 (0-1) */
  alpha?: number;
}

/**
 * 渐变值类型
 */
export interface GradientValue {
  /** 渐变类型 */
  type: 'linear' | 'radial';

  /** 渐变色标 */
  stops: Array<{
    color: string;
    position: number; // 0-1
  }>;

  /** 渐变角度 (仅线性渐变) */
  angle?: number;
}

/**
 * 阴影值类型
 */
export interface ShadowValue {
  /** X偏移 */
  offsetX: number;

  /** Y偏移 */
  offsetY: number;

  /** 模糊半径 */
  blur: number;

  /** 扩散半径 */
  spread?: number;

  /** 颜色 */
  color: string;

  /** 是否内阴影 */
  inset?: boolean;
}

/**
 * 边框值类型
 */
export interface BorderValue {
  /** 边框宽度 */
  width: number;

  /** 边框样式 */
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';

  /** 边框颜色 */
  color: string;

  /** 圆角 */
  radius?: number;
}

/**
 * 变量绑定值类型
 */
export interface BindingValue {
  /** 绑定类型 */
  type: 'variable' | 'expression';

  /** 变量路径或表达式 */
  path: string;

  /** 转换函数 */
  transform?: string;
}

// ============================================================================
// 属性定义
// ============================================================================

/**
 * 属性定义
 * 描述一个可编辑属性的元数据
 */
export interface PropertyDefinition {
  /** 属性名称 (唯一标识) */
  name: string;

  /** 属性显示标签 */
  label: string;

  /** 属性类型 */
  type: PropertyType;

  /** 默认值 */
  defaultValue?: PropertyValue;

  /** 属性描述 */
  description?: string;

  /** 分组名称 */
  group?: string;

  /** 排序顺序 */
  order?: number;

  /** 是否隐藏 */
  hidden?: boolean;

  /** 是否只读 */
  readonly?: boolean;

  /** 验证规则 */
  validation?: ValidationRule[];

  /** 是否必填 */
  required?: boolean;

  /** 类型特定选项 */
  options?: PropertyTypeOptions;

  /** 外观选项 */
  appearance?: AppearanceOptions;

  /** 依赖条件 (当其他属性满足条件时才显示) */
  dependencies?: PropertyDependency[];
}

/**
 * 属性类型选项
 * 每种属性类型特有的配置
 */
export interface PropertyTypeOptions {
  /** Select 类型选项 */
  selectOptions?: Array<{
    label: string;
    value: PropertyValue;
  }>;

  /** Number 类型选项 */
  numberOptions?: {
    min?: number;
    max?: number;
    step?: number;
    precision?: number; // 小数位数
    unit?: string; // 单位 (如 px, %, em)
  };

  /** Slider 类型选项 */
  sliderOptions?: {
    min: number;
    max: number;
    step?: number;
    showValue?: boolean;
  };

  /** Text 类型选项 */
  textOptions?: {
    minLength?: number;
    maxLength?: number;
    placeholder?: string;
    pattern?: RegExp;
  };

  /** Textarea 类型选项 */
  textareaOptions?: {
    rows?: number;
    maxLength?: number;
    placeholder?: string;
  };

  /** File 类型选项 */
  fileOptions?: {
    accept?: string[]; // 接受的文件类型
    maxSize?: number; // 最大文件大小 (字节)
    multiple?: boolean; // 是否多选
  };

  /** Code 类型选项 */
  codeOptions?: {
    language?: string; // 代码语言
    theme?: string;
  };

  /** 其他自定义选项 */
  [key: string]: any;
}

/**
 * 外观选项
 * 控制属性在编辑器中的显示样式
 */
export interface AppearanceOptions {
  /** 宽度 */
  width?: 'full' | 'half' | 'third' | number;

  /** 显示图标 */
  icon?: string;

  /** 提示信息 */
  tooltip?: string;

  /** 占位符 */
  placeholder?: string;
}

/**
 * 属性依赖
 * 定义属性之间的依赖关系
 */
export interface PropertyDependency {
  /** 依赖的属性名 */
  property: string;

  /** 依赖条件 */
  condition: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';

  /** 比较值 */
  value: PropertyValue;
}

// ============================================================================
// 属性分组
// ============================================================================

/**
 * 属性分组
 * 将相关属性组织在一起
 */
export interface PropertyGroup {
  /** 分组名称 */
  name: string;

  /** 分组显示标签 */
  label: string;

  /** 分组描述 */
  description?: string;

  /** 排序顺序 */
  order?: number;

  /** 是否默认折叠 */
  collapsed?: boolean;

  /** 分组中的属性列表 */
  properties: string[];
}

// ============================================================================
// 验证规则
// ============================================================================

/**
 * 验证规则
 * 定义属性值的验证逻辑
 */
export interface ValidationRule {
  /** 验证规则类型 */
  type: ValidationRuleType;

  /** 错误消息 */
  message?: string;

  /** 规则参数 */
  params?: any;

  /** 自定义验证函数 */
  validator?: (value: PropertyValue, allValues?: Record<string, PropertyValue>) => boolean;
}

/**
 * 验证规则类型
 */
export type ValidationRuleType =
  | 'required'        // 必填
  | 'type'            // 类型验证
  | 'range'           // 范围验证
  | 'length'          // 长度验证
  | 'pattern'         // 模式验证 (正则)
  | 'enum'            // 枚举验证
  | 'custom';         // 自定义验证

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;

  /** 错误列表 */
  errors: ValidationError[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: ValidationErrorCode;

  /** 错误消息 */
  message: string;

  /** 属性名称 */
  propertyName?: string;

  /** 错误详情 */
  details?: any;
}

/**
 * 验证错误代码
 */
export enum ValidationErrorCode {
  REQUIRED = 'REQUIRED',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  LENGTH_EXCEEDED = 'LENGTH_EXCEEDED',
  LENGTH_TOO_SHORT = 'LENGTH_TOO_SHORT',
  PATTERN_MISMATCH = 'PATTERN_MISMATCH',
  INVALID_ENUM = 'INVALID_ENUM',
  CUSTOM = 'CUSTOM',
}

// ============================================================================
// 属性编辑器配置
// ============================================================================

/**
 * 属性编辑器配置
 */
export interface PropertyEditorConfig {
  /** 属性定义列表 */
  definitions: PropertyDefinition[];

  /** 初始值 */
  initialValues?: Record<string, PropertyValue>;

  /** 是否启用搜索 */
  enableSearch?: boolean;

  /** 是否启用批量编辑 */
  enableBatchEdit?: boolean;

  /** 是否显示重置按钮 */
  showReset?: boolean;

  /** 是否显示分组 */
  showGroups?: boolean;

  /** 自定义验证函数 */
  customValidators?: Record<string, (value: PropertyValue) => ValidationError | null>;
}

// ============================================================================
// 属性编辑器事件
// ============================================================================

/**
 * 属性变更事件
 */
export interface PropertyChangeEvent {
  /** 属性名称 */
  propertyName: string;

  /** 新值 */
  newValue: PropertyValue;

  /** 旧值 */
  oldValue: PropertyValue;

  /** 所有属性值 */
  allValues: Record<string, PropertyValue>;
}

/**
 * 属性编辑器事件处理器
 */
export interface PropertyEditorEventHandlers {
  /** 属性值变化 */
  onChange?: (event: PropertyChangeEvent) => void;

  /** 验证事件 */
  onValidate?: (propertyName: string, result: ValidationResult) => void;

  /** 批量编辑开始 */
  onBatchStart?: () => void;

  /** 批量编辑提交 */
  onBatchCommit?: (values: Record<string, PropertyValue>) => void;

  /** 批量编辑取消 */
  onBatchCancel?: () => void;

  /** 错误事件 */
  onError?: (propertyName: string, error: ValidationError) => void;

  /** 搜索事件 */
  onSearch?: (searchText: string) => void;

  /** 分组展开/折叠 */
  onGroupToggle?: (groupName: string, collapsed: boolean) => void;
}

// ============================================================================
// 格式化选项
// ============================================================================

/**
 * 格式化选项
 */
export interface FormatOptions {
  /** 显示格式 */
  format?: string;

  /** 本地化 */
  locale?: string;

  /** 日期格式 */
  dateFormat?: string;

  /** 时间格式 */
  timeFormat?: string;

  /** 数字格式 */
  numberFormat?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  };
}

/**
 * 数字格式化选项
 */
export interface NumberFormatOptions {
  /** 最小值 */
  min?: number;

  /** 最大值 */
  max?: number;

  /** 步进值 */
  step?: number;

  /** 小数位数 */
  precision?: number;

  /** 单位 */
  unit?: string;

  /** 千位分隔符 */
  useGrouping?: boolean;
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 属性编辑器状态
 */
export interface PropertyEditorState {
  /** 当前值 */
  currentValues: Record<string, PropertyValue>;

  /** 原始值 (用于重置) */
  originalValues: Record<string, PropertyValue>;

  /** 正在编辑的属性 */
  editingProperty?: string;

  /** 错误状态 */
  errors: Map<string, ValidationError[]>;

  /** 批量编辑模式 */
  batchMode: boolean;

  /** 批量编辑值 */
  batchValues: Partial<Record<string, PropertyValue>>;

  /** 搜索文本 */
  searchText: string;

  /** 可见属性 */
  visibleProperties: string[];

  /** 展开的分组 */
  expandedGroups: Set<string>;
}

/**
 * 属性操作结果
 */
export interface PropertyOperationResult {
  /** 是否成功 */
  success: boolean;

  /** 错误信息 */
  error?: ValidationError;

  /** 结果数据 */
  data?: any;
}

/**
 * 属性字段注册项
 */
export interface PropertyFieldRegistration {
  /** 属性类型 */
  type: PropertyType;

  /** 解析函数 */
  parse: (rawValue: string, options?: PropertyTypeOptions) => PropertyValue;

  /** 格式化函数 */
  format: (value: PropertyValue, options?: PropertyTypeOptions) => string;

  /** 验证函数 */
  validate: (value: PropertyValue, options?: PropertyTypeOptions) => ValidationError | null;

  /** 渲染组件 */
  component?: any; // React Component
}
