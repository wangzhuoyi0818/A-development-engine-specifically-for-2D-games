/**
 * 组件库模块 - 类型定义
 *
 * 定义组件库相关的所有 TypeScript 类型接口
 */

// ============================================================================
// 枚举类型
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

// ============================================================================
// 组件定义相关类型
// ============================================================================

/**
 * 组件定义
 * 定义一个微信小程序组件的所有元数据
 */
export interface ComponentDefinition {
  /** 组件ID（唯一标识，建议格式: wechat-{component-name}） */
  id: string;

  /** 组件名称（微信小程序组件标签名，如 'view'） */
  name: string;

  /** 组件显示名称（在编辑器中显示） */
  label: string;

  /** 组件描述 */
  description?: string;

  /** 组件分类 */
  category: ComponentCategory;

  /** 组件图标（图标名称或URL） */
  icon?: string;

  /** 组件标签（用于搜索和筛选） */
  tags?: string[];

  /** 组件属性定义列表 */
  properties: PropertyDefinition[];

  /** 组件事件定义列表 */
  events: EventDefinition[];

  /** 是否允许有子组件 */
  canHaveChildren: boolean;

  /** 允许的父组件类型（空表示不限制，数组为允许的父组件name列表） */
  allowedParents?: string[];

  /** 允许的子组件类型（空表示不限制，数组为允许的子组件name列表） */
  allowedChildren?: string[];

  /** 默认样式 */
  defaultStyle?: Record<string, any>;

  /** 默认属性值 */
  defaultProperties?: Record<string, any>;

  /** 是否是容器组件 */
  isContainer: boolean;

  /** 是否是内联组件 */
  isInline: boolean;

  /** 组件行为列表（行为名称数组） */
  behaviors?: string[];

  /** 组件使用示例（WXML代码） */
  example?: string;

  /** 官方文档链接 */
  docUrl?: string;

  /** 组件版本 */
  version?: string;

  /** 是否已废弃 */
  deprecated?: boolean;

  /** 废弃说明 */
  deprecationMessage?: string;
}

// ============================================================================
// 属性定义相关类型
// ============================================================================

/**
 * 属性定义
 */
export interface PropertyDefinition {
  /** 属性名称（微信小程序中的属性名） */
  name: string;

  /** 属性标签（在编辑器中显示的名称） */
  label: string;

  /** 属性类型 */
  type: PropertyType;

  /** 默认值 */
  defaultValue?: any;

  /** 属性描述 */
  description?: string;

  /** 是否必填 */
  required?: boolean;

  /** 枚举选项（当 type 为 Enum 时必填） */
  options?: PropertyOption[];

  /** 最小值（当 type 为 Number 时） */
  min?: number;

  /** 最大值（当 type 为 Number 时） */
  max?: number;

  /** 步长（当 type 为 Number 时） */
  step?: number;

  /** 正则表达式验证（当 type 为 String 时） */
  pattern?: string;

  /** 最小长度（当 type 为 String 时） */
  minLength?: number;

  /** 最大长度（当 type 为 String 时） */
  maxLength?: number;

  /** 允许的文件类型（当 type 为 Image 时） */
  accept?: string[];

  /** 属性分组 */
  group?: string;

  /** 是否支持数据绑定 */
  bindable?: boolean;

  /** 是否显示在编辑器中 */
  visible?: boolean;

  /** 条件显示（依赖其他属性） */
  visibleWhen?: PropertyCondition;

  /** 自定义验证器 */
  validator?: (value: any) => ValidationResult;

  /** 属性单位（如 'px', 'rpx', '%' 等） */
  unit?: string;

  /** 是否只读 */
  readOnly?: boolean;

  /** 占位符文本 */
  placeholder?: string;
}

/**
 * 属性选项（用于枚举类型）
 */
export interface PropertyOption {
  /** 选项值 */
  value: any;

  /** 选项标签（显示文本） */
  label: string;

  /** 选项图标 */
  icon?: string;

  /** 选项描述 */
  description?: string;
}

/**
 * 属性条件（条件显示）
 */
export interface PropertyCondition {
  /** 依赖的属性名 */
  property: string;

  /** 条件操作符 */
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan';

  /** 条件值 */
  value: any;
}

// ============================================================================
// 事件定义相关类型
// ============================================================================

/**
 * 事件定义
 */
export interface EventDefinition {
  /** 事件名称（微信小程序中的事件名，如 'tap'） */
  name: string;

  /** 事件标签（在编辑器中显示的名称） */
  label: string;

  /** 事件描述 */
  description?: string;

  /** 事件参数定义 */
  params?: EventParam[];

  /** 事件分组 */
  group?: string;

  /** 是否是冒泡事件 */
  bubbles?: boolean;

  /** 事件示例 */
  example?: string;
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

  /** 是否必填 */
  required?: boolean;
}

// ============================================================================
// 行为定义相关类型
// ============================================================================

/**
 * 行为定义
 */
export interface BehaviorDefinition {
  /** 行为名称（唯一标识） */
  name: string;

  /** 行为显示名称 */
  label: string;

  /** 行为描述 */
  description?: string;

  /** 行为添加的属性 */
  addedProperties?: PropertyDefinition[];

  /** 行为添加的事件 */
  addedEvents?: EventDefinition[];

  /** 行为配置 */
  config?: Record<string, any>;

  /** 行为应用函数 */
  apply?: (component: any) => void;

  /** 行为移除函数 */
  remove?: (component: any) => void;

  /** 行为检查函数 */
  has?: (component: any) => boolean;
}

// ============================================================================
// 模板相关类型
// ============================================================================

/**
 * 组件模板定义
 */
export interface ComponentTemplate {
  /** 模板ID */
  id: string;

  /** 模板名称 */
  name: string;

  /** 模板显示名称 */
  label: string;

  /** 模板描述 */
  description?: string;

  /** 模板分类 */
  category: string;

  /** 模板图标 */
  icon?: string;

  /** 模板标签 */
  tags?: string[];

  /** 模板组件树（使用 any 避免循环依赖） */
  components: any[];

  /** 模板参数定义 */
  parameters?: TemplateParameter[];

  /** 模板预览图 */
  preview?: string;

  /** 模板作者 */
  author?: string;

  /** 模板版本 */
  version?: string;
}

/**
 * 模板参数
 */
export interface TemplateParameter {
  /** 参数名 */
  name: string;

  /** 参数标签 */
  label: string;

  /** 参数类型 */
  type: PropertyType;

  /** 默认值 */
  defaultValue?: any;

  /** 参数描述 */
  description?: string;

  /** 是否必填 */
  required?: boolean;

  /** 枚举选项 */
  options?: PropertyOption[];
}

// ============================================================================
// 验证相关类型
// ============================================================================

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;

  /** 错误列表 */
  errors: ValidationError[];

  /** 警告列表 */
  warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误路径（如 'properties.width'） */
  path?: string;

  /** 错误详情 */
  details?: any;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;

  /** 警告消息 */
  message: string;

  /** 警告路径 */
  path?: string;

  /** 警告详情 */
  details?: any;
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则名称 */
  name: string;

  /** 规则描述 */
  description?: string;

  /** 验证函数 */
  validate: (value: any, context?: any) => ValidationResult;

  /** 错误消息模板 */
  errorMessage?: string;
}

// ============================================================================
// 查询相关类型
// ============================================================================

/**
 * 组件搜索查询
 */
export interface ComponentSearchQuery {
  /** 关键词（搜索 name、label、tags） */
  keyword?: string;

  /** 组件分类 */
  category?: ComponentCategory;

  /** 标签列表 */
  tags?: string[];

  /** 是否是容器组件 */
  isContainer?: boolean;

  /** 是否是内联组件 */
  isInline?: boolean;

  /** 是否允许有子组件 */
  canHaveChildren?: boolean;

  /** 排序方式 */
  sortBy?: 'name' | 'label' | 'category' | 'relevance';

  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';

  /** 分页：每页数量 */
  pageSize?: number;

  /** 分页：页码（从0开始） */
  page?: number;
}

/**
 * 组件搜索结果
 */
export interface ComponentSearchResult {
  /** 搜索结果 */
  items: ComponentDefinition[];

  /** 总数 */
  total: number;

  /** 当前页 */
  page: number;

  /** 每页数量 */
  pageSize: number;

  /** 总页数 */
  totalPages: number;
}

// ============================================================================
// 文档生成相关类型
// ============================================================================

/**
 * 组件文档
 */
export interface ComponentDocumentation {
  /** 组件定义 */
  component: ComponentDefinition;

  /** 生成的 Markdown 文档 */
  markdown: string;

  /** 生成时间 */
  generatedAt: Date;
}

/**
 * 文档生成选项
 */
export interface DocumentationOptions {
  /** 是否包含示例代码 */
  includeExamples?: boolean;

  /** 是否包含属性表格 */
  includeProperties?: boolean;

  /** 是否包含事件列表 */
  includeEvents?: boolean;

  /** 是否包含官方文档链接 */
  includeDocUrl?: boolean;

  /** 文档语言 */
  language?: 'zh-CN' | 'en-US';

  /** 自定义模板 */
  template?: string;
}

// ============================================================================
// 组件注册表相关类型
// ============================================================================

/**
 * 组件注册选项
 */
export interface ComponentRegistrationOptions {
  /** 是否覆盖已存在的组件 */
  override?: boolean;

  /** 是否验证组件定义 */
  validate?: boolean;

  /** 注册回调 */
  onRegistered?: (definition: ComponentDefinition) => void;
}

/**
 * 批量注册结果
 */
export interface BatchRegistrationResult {
  /** 成功注册的组件数量 */
  successCount: number;

  /** 失败的组件数量 */
  failureCount: number;

  /** 失败的组件列表 */
  failures: Array<{
    definition: ComponentDefinition;
    error: Error;
  }>;
}

// ============================================================================
// 错误类型
// ============================================================================

/**
 * 组件库错误基类
 */
export class ComponentLibraryError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ComponentLibraryError';
  }
}

/**
 * 组件未找到错误
 */
export class ComponentNotFoundError extends ComponentLibraryError {
  constructor(id: string) {
    super(`Component not found: ${id}`, 'COMPONENT_NOT_FOUND', { id });
    this.name = 'ComponentNotFoundError';
  }
}

/**
 * 组件重复注册错误
 */
export class DuplicateComponentError extends ComponentLibraryError {
  constructor(id: string) {
    super(`Component already registered: ${id}`, 'DUPLICATE_COMPONENT', { id });
    this.name = 'DuplicateComponentError';
  }
}

/**
 * 组件验证错误
 */
export class ComponentValidationError extends ComponentLibraryError {
  constructor(message: string, public validationResult: ValidationResult) {
    super(message, 'VALIDATION_ERROR', validationResult);
    this.name = 'ComponentValidationError';
  }
}

/**
 * 无效输入错误
 */
export class InvalidInputError extends ComponentLibraryError {
  constructor(message: string, details?: any) {
    super(message, 'INVALID_INPUT', details);
    this.name = 'InvalidInputError';
  }
}

/**
 * 行为未找到错误
 */
export class BehaviorNotFoundError extends ComponentLibraryError {
  constructor(name: string) {
    super(`Behavior not found: ${name}`, 'BEHAVIOR_NOT_FOUND', { name });
    this.name = 'BehaviorNotFoundError';
  }
}

/**
 * 模板未找到错误
 */
export class TemplateNotFoundError extends ComponentLibraryError {
  constructor(id: string) {
    super(`Template not found: ${id}`, 'TEMPLATE_NOT_FOUND', { id });
    this.name = 'TemplateNotFoundError';
  }
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 提取属性类型对应的值类型
 */
export type PropertyValueType<T extends PropertyType> = T extends PropertyType.String
  ? string
  : T extends PropertyType.Number
  ? number
  : T extends PropertyType.Boolean
  ? boolean
  : T extends PropertyType.Array
  ? any[]
  : T extends PropertyType.Object
  ? Record<string, any>
  : any;
