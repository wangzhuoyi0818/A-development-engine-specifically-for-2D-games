/**
 * 微信小程序可视化开发平台 - JavaScript生成器类型定义
 *
 * 本文件定义了JavaScript代码生成器的所有类型接口
 */

// 从其他模块导入类型
import type {
  Page,
  Component,
  ComponentEvent,
  LifecycleEvent,
  CustomEvent,
  Variable,
  DataBinding,
} from '../../../01_Core_ProjectStructure/implementation/types';

import type {
  BaseEvent,
  Action,
  Condition,
  Expression,
} from '../../../02_Core_EventSystem/implementation/types';

// ============================================================================
// 代码生成配置类型
// ============================================================================

/**
 * JavaScript代码生成配置
 */
export interface JSGenerationConfig {
  /** 目标类型: page 或 component */
  target: 'page' | 'component';

  /** 是否生成TypeScript代码 */
  typescript?: boolean;

  /** 是否使用严格模式 */
  strictMode?: boolean;

  /** 是否生成注释 */
  includeComments?: boolean;

  /** 是否优化代码 */
  optimize?: boolean;

  /** 缩进大小(空格数) */
  indentSize?: number;

  /** 是否使用单引号 */
  useSingleQuotes?: boolean;

  /** 是否生成Source Map */
  sourceMap?: boolean;

  /** 代码风格: 'standard' | 'airbnb' | 'google' */
  codeStyle?: 'standard' | 'airbnb' | 'google';
}

/**
 * 代码生成上下文
 */
export interface GenerationContext {
  /** 生成类型 */
  type: 'page' | 'component';

  /** 目标名称 */
  name: string;

  /** 变量列表 */
  variables: Variable[];

  /** 导入列表 */
  imports: Set<string>;

  /** 方法映射表 (方法名 -> 方法代码) */
  methods: Map<string, string>;

  /** 辅助函数映射表 */
  helpers: Map<string, string>;

  /** 当前缩进级别 */
  indentLevel: number;

  /** 是否在异步上下文中 */
  inAsyncContext: boolean;

  /** 依赖的API列表 */
  requiredAPIs: Set<string>;

  /** 配置 */
  config: JSGenerationConfig;
}

// ============================================================================
// 代码片段类型
// ============================================================================

/**
 * 代码片段
 */
export interface CodeSnippet {
  /** 代码内容 */
  code: string;

  /** 是否需要async包装 */
  async?: boolean;

  /** 依赖的变量 */
  dependencies?: string[];

  /** 代码类型 */
  type: 'statement' | 'expression' | 'declaration' | 'block';
}

/**
 * 函数定义
 */
export interface FunctionDefinition {
  /** 函数名 */
  name: string;

  /** 函数参数 */
  parameters: FunctionParameter[];

  /** 函数体 */
  body: string;

  /** 是否异步函数 */
  async?: boolean;

  /** 是否箭头函数 */
  arrow?: boolean;

  /** JSDoc注释 */
  jsdoc?: string;
}

/**
 * 函数参数
 */
export interface FunctionParameter {
  /** 参数名 */
  name: string;

  /** 参数类型(TypeScript) */
  type?: string;

  /** 默认值 */
  defaultValue?: string;

  /** 是否可选 */
  optional?: boolean;

  /** 解构模式 */
  destructured?: boolean;
}

/**
 * 对象属性定义
 */
export interface ObjectPropertyDefinition {
  /** 属性名 */
  key: string;

  /** 属性值 */
  value: string | ObjectPropertyDefinition[];

  /** 是否简写 (ES6 shorthand) */
  shorthand?: boolean;

  /** 是否方法 */
  method?: boolean;

  /** 是否计算属性 */
  computed?: boolean;
}

// ============================================================================
// 生成器接口
// ============================================================================

/**
 * 代码生成器基础接口
 */
export interface CodeGenerator<T = any> {
  /** 生成代码 */
  generate(input: T, context: GenerationContext): string;

  /** 验证输入 */
  validate?(input: T): ValidationResult;
}

/**
 * 生命周期生成器接口
 */
export interface LifecycleGenerator extends CodeGenerator<LifecycleGeneratorInput> {
  /** 生成页面生命周期 */
  generatePageLifecycle(event: LifecycleEvent, context: GenerationContext): string;

  /** 生成组件生命周期 */
  generateComponentLifecycle(event: LifecycleEvent, context: GenerationContext): string;
}

/**
 * 生命周期生成器输入
 */
export interface LifecycleGeneratorInput {
  /** 生命周期事件列表 */
  events: LifecycleEvent[];

  /** 目标类型 */
  target: 'page' | 'component';
}

/**
 * 事件处理器生成器接口
 */
export interface EventHandlerGenerator extends CodeGenerator<EventHandlerGeneratorInput> {
  /** 生成单个事件处理器 */
  generateEventHandler(event: ComponentEvent | CustomEvent, context: GenerationContext): string;

  /** 生成事件绑定 */
  generateEventBinding(event: ComponentEvent, context: GenerationContext): string;
}

/**
 * 事件处理器生成器输入
 */
export interface EventHandlerGeneratorInput {
  /** 组件事件列表 */
  componentEvents?: ComponentEvent[];

  /** 自定义事件列表 */
  customEvents?: CustomEvent[];
}

/**
 * 数据管理生成器接口
 */
export interface DataManagerGenerator extends CodeGenerator<DataManagerGeneratorInput> {
  /** 生成data对象 */
  generateDataObject(variables: Variable[], context: GenerationContext): string;

  /** 生成setData调用 */
  generateSetDataCall(updates: Record<string, any>, context: GenerationContext): string;

  /** 生成properties定义(组件) */
  generateProperties(properties: any[], context: GenerationContext): string;
}

/**
 * 数据管理生成器输入
 */
export interface DataManagerGeneratorInput {
  /** 变量列表 */
  variables: Variable[];

  /** 数据绑定列表 */
  dataBindings?: DataBinding[];

  /** 属性定义(仅组件) */
  properties?: any[];
}

/**
 * 方法生成器接口
 */
export interface MethodGenerator extends CodeGenerator<MethodGeneratorInput> {
  /** 生成方法定义 */
  generateMethod(def: FunctionDefinition, context: GenerationContext): string;

  /** 生成API调用包装 */
  generateAPIWrapper(apiName: string, params: any, context: GenerationContext): string;
}

/**
 * 方法生成器输入
 */
export interface MethodGeneratorInput {
  /** 自定义方法列表 */
  customMethods?: FunctionDefinition[];

  /** API调用配置 */
  apiCalls?: APICallConfig[];
}

/**
 * API调用配置
 */
export interface APICallConfig {
  /** API名称 (如 'wx.request') */
  name: string;

  /** 参数 */
  params: Record<string, any>;

  /** 是否异步 */
  async?: boolean;

  /** 是否需要错误处理 */
  errorHandling?: boolean;
}

/**
 * 导入生成器接口
 */
export interface ImportGenerator extends CodeGenerator<ImportGeneratorInput> {
  /** 添加导入 */
  addImport(importPath: string, names?: string[]): void;

  /** 生成所有导入语句 */
  generateImports(context: GenerationContext): string;
}

/**
 * 导入生成器输入
 */
export interface ImportGeneratorInput {
  /** 外部库列表 */
  externalLibraries?: string[];

  /** 本地模块列表 */
  localModules?: string[];

  /** 组件依赖 */
  componentDependencies?: string[];
}

/**
 * 代码格式化器接口
 */
export interface CodeFormatter {
  /** 格式化代码 */
  format(code: string, options?: FormatterOptions): string;

  /** 添加缩进 */
  indent(code: string, level: number): string;

  /** 美化对象字面量 */
  beautifyObject(obj: any, options?: FormatterOptions): string;
}

/**
 * 格式化选项
 */
export interface FormatterOptions {
  /** 缩进大小 */
  indentSize?: number;

  /** 是否使用制表符 */
  useTabs?: boolean;

  /** 单引号还是双引号 */
  quotes?: 'single' | 'double';

  /** 是否添加尾随逗号 */
  trailingComma?: boolean;

  /** 是否添加分号 */
  semi?: boolean;

  /** 每行最大长度 */
  printWidth?: number;
}

// ============================================================================
// 动作生成类型
// ============================================================================

/**
 * 动作代码生成器
 */
export type ActionCodeGenerator = (
  action: Action,
  context: GenerationContext
) => CodeSnippet;

/**
 * 条件代码生成器
 */
export type ConditionCodeGenerator = (
  condition: Condition,
  context: GenerationContext
) => string;

/**
 * 表达式代码生成器
 */
export type ExpressionCodeGenerator = (
  expression: Expression,
  context: GenerationContext
) => string;

// ============================================================================
// 验证类型
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

  /** 错误位置 */
  location?: string;

  /** 建议修复 */
  suggestion?: string;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;

  /** 警告消息 */
  message: string;

  /** 警告位置 */
  location?: string;
}

// ============================================================================
// 生成结果类型
// ============================================================================

/**
 * JavaScript代码生成结果
 */
export interface JSGenerationResult {
  /** 是否成功 */
  success: boolean;

  /** 生成的代码 */
  code?: string;

  /** Source Map */
  sourceMap?: string;

  /** 错误列表 */
  errors: ValidationError[];

  /** 警告列表 */
  warnings: ValidationWarning[];

  /** 统计信息 */
  stats: GenerationStats;
}

/**
 * 生成统计信息
 */
export interface GenerationStats {
  /** 代码行数 */
  lines: number;

  /** 代码大小(字节) */
  size: number;

  /** 生成耗时(毫秒) */
  duration: number;

  /** 方法数量 */
  methodCount: number;

  /** 生命周期数量 */
  lifecycleCount: number;

  /** 事件处理器数量 */
  eventHandlerCount: number;
}

// ============================================================================
// 主生成器接口
// ============================================================================

/**
 * JavaScript主生成器接口
 */
export interface JSGenerator {
  /**
   * 生成页面代码
   */
  generatePageCode(page: Page, config?: JSGenerationConfig): JSGenerationResult;

  /**
   * 生成组件代码
   */
  generateComponentCode(component: Component, config?: JSGenerationConfig): JSGenerationResult;

  /**
   * 获取生成器配置
   */
  getConfig(): JSGenerationConfig;

  /**
   * 设置生成器配置
   */
  setConfig(config: Partial<JSGenerationConfig>): void;
}

// ============================================================================
// 常量和枚举
// ============================================================================

/**
 * 微信小程序保留字
 */
export const WX_RESERVED_WORDS = [
  'wx',
  'App',
  'Page',
  'Component',
  'Behavior',
  'getCurrentPages',
  'getApp',
  'requirePlugin',
];

/**
 * JavaScript保留字
 */
export const JS_RESERVED_WORDS = [
  'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'enum',
  'export', 'extends', 'false', 'finally', 'for', 'function',
  'if', 'import', 'in', 'instanceof', 'new', 'null',
  'return', 'super', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'var', 'void', 'while', 'with',
  'let', 'static', 'yield', 'await', 'async',
];

/**
 * 默认生成配置
 */
export const DEFAULT_GENERATION_CONFIG: JSGenerationConfig = {
  target: 'page',
  typescript: false,
  strictMode: true,
  includeComments: true,
  optimize: true,
  indentSize: 2,
  useSingleQuotes: true,
  sourceMap: false,
  codeStyle: 'standard',
};
