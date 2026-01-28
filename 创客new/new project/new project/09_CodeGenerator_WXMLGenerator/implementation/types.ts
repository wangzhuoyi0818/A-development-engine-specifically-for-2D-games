/**
 * WXML 生成器 - 类型定义
 *
 * 定义WXML代码生成所需的所有TypeScript类型接口
 */

import type {
  Component,
  ComponentProperty,
  ComponentEvent,
  DataBinding,
  ListRenderingConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// 生成选项
// ============================================================================

/**
 * WXML生成选项
 */
export interface WXMLGeneratorOptions {
  /** 缩进字符（默认2个空格） */
  indent?: string;

  /** 是否添加注释 */
  addComments?: boolean;

  /** 是否格式化输出 */
  format?: boolean;

  /** 是否验证组件 */
  validate?: boolean;

  /** 自闭合标签列表 */
  selfClosingTags?: string[];

  /** 是否使用短属性语法 */
  useShortSyntax?: boolean;
}

/**
 * 默认生成选项
 */
export const DEFAULT_GENERATOR_OPTIONS: Required<WXMLGeneratorOptions> = {
  indent: '  ',
  addComments: true,
  format: true,
  validate: true,
  selfClosingTags: ['input', 'image', 'import', 'include'],
  useShortSyntax: false
};

// ============================================================================
// 生成结果
// ============================================================================

/**
 * WXML生成结果
 */
export interface WXMLGenerationResult {
  /** 生成的WXML代码 */
  code: string;

  /** 生成是否成功 */
  success: boolean;

  /** 错误列表 */
  errors: ValidationError[];

  /** 警告列表 */
  warnings: ValidationWarning[];

  /** 生成的组件数量 */
  componentCount: number;

  /** 生成耗时（毫秒） */
  duration: number;
}

// ============================================================================
// 属性生成
// ============================================================================

/**
 * 属性生成结果
 */
export interface AttributeGenerationResult {
  /** 属性字符串 */
  attributes: string;

  /** 是否有错误 */
  hasErrors: boolean;

  /** 错误列表 */
  errors: ValidationError[];
}

/**
 * 属性类型
 */
export enum AttributeType {
  /** 静态属性 */
  STATIC = 'static',

  /** 数据绑定属性 */
  BINDING = 'binding',

  /** 事件属性 */
  EVENT = 'event',

  /** 条件属性 */
  CONDITIONAL = 'conditional',

  /** 循环属性 */
  LIST = 'list',

  /** 特殊属性（data-*等） */
  SPECIAL = 'special'
}

// ============================================================================
// 绑定生成
// ============================================================================

/**
 * 绑定类型
 */
export enum BindingType {
  /** 单向绑定 */
  ONE_WAY = 'oneWay',

  /** 双向绑定 */
  TWO_WAY = 'twoWay',

  /** 事件绑定 */
  EVENT = 'event'
}

/**
 * 绑定表达式
 */
export interface BindingExpression {
  /** 原始路径 */
  path: string;

  /** 绑定类型 */
  type: BindingType;

  /** 生成的表达式 */
  expression: string;
}

// ============================================================================
// 验证规则
// ============================================================================

/**
 * 组件验证规则
 */
export interface ComponentValidationRule {
  /** 规则名称 */
  name: string;

  /** 验证函数 */
  validate: (component: Component) => ValidationError[];

  /** 规则描述 */
  description?: string;
}

/**
 * 嵌套验证规则
 */
export interface NestingRule {
  /** 父组件类型 */
  parent: string;

  /** 允许的子组件类型列表 */
  allowedChildren: string[];

  /** 禁止的子组件类型列表 */
  disallowedChildren?: string[];
}

// ============================================================================
// 格式化
// ============================================================================

/**
 * 格式化选项
 */
export interface FormatterOptions {
  /** 缩进字符串 */
  indent: string;

  /** 每行最大长度 */
  maxLineLength?: number;

  /** 是否在属性间换行 */
  breakAttributes?: boolean;

  /** 是否保留空白 */
  preserveWhitespace?: boolean;
}

/**
 * 标签信息
 */
export interface TagInfo {
  /** 标签名 */
  name: string;

  /** 是否自闭合 */
  selfClosing: boolean;

  /** 层级 */
  level: number;

  /** 是否有子元素 */
  hasChildren: boolean;
}

// ============================================================================
// 代码生成上下文
// ============================================================================

/**
 * 生成上下文
 * 用于在生成过程中传递状态
 */
export interface GenerationContext {
  /** 当前缩进级别 */
  indentLevel: number;

  /** 已生成的组件ID列表（用于检测重复） */
  generatedIds: Set<string>;

  /** 错误收集器 */
  errors: ValidationError[];

  /** 警告收集器 */
  warnings: ValidationWarning[];

  /** 生成选项 */
  options: Required<WXMLGeneratorOptions>;

  /** 父组件栈（用于验证嵌套） */
  parentStack: Component[];
}

// ============================================================================
// 辅助类型
// ============================================================================

/**
 * 标签对
 */
export interface TagPair {
  /** 开始标签 */
  open: string;

  /** 结束标签 */
  close: string;
}

/**
 * 代码片段
 */
export interface CodeSnippet {
  /** 代码内容 */
  code: string;

  /** 起始行号 */
  startLine: number;

  /** 结束行号 */
  endLine: number;
}

// ============================================================================
// 导出类型重用
// ============================================================================

export type {
  Component,
  ComponentProperty,
  ComponentEvent,
  DataBinding,
  ListRenderingConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning
};
