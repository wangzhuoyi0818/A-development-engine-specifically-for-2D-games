/**
 * WXSS生成器 - 类型定义
 *
 * 本文件定义了WXSS生成器模块的所有TypeScript类型接口
 */

import type { Component, ComponentStyle } from '../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// CSS相关类型
// ============================================================================

/**
 * CSS规则
 */
export interface CSSRule {
  /** CSS选择器 */
  selector: string;

  /** CSS属性集合 */
  properties: Record<string, string>;

  /** 媒体查询条件 (可选) */
  media?: string;

  /** 嵌套规则 (可选) */
  nested?: CSSRule[];

  /** 伪类/伪元素 (可选) */
  pseudo?: string;

  /** 优先级 (用于排序) */
  priority?: number;

  /** 来源组件ID (用于源映射) */
  sourceId?: string;
}

/**
 * CSS单位类型
 */
export type CSSUnit = 'rpx' | 'px' | '%' | 'vw' | 'vh' | 'rem' | 'em' | 'auto';

/**
 * CSS属性值
 */
export interface CSSValue {
  /** 原始值 */
  raw: string;

  /** 数值部分 */
  value?: number;

  /** 单位部分 */
  unit?: CSSUnit;

  /** 是否是关键字 */
  isKeyword?: boolean;

  /** 是否是变量引用 */
  isVariable?: boolean;
}

// ============================================================================
// 主题相关类型
// ============================================================================

/**
 * 主题定义
 */
export interface Theme {
  /** 主题名称 */
  name: string;

  /** 主题描述 */
  description?: string;

  /** 颜色系统 */
  colors: ThemeColors;

  /** 间距系统 */
  spacing: ThemeSpacing;

  /** 字体系统 */
  typography: ThemeTypography;

  /** 圆角系统 */
  borderRadius: Record<string, string>;

  /** 阴影系统 */
  shadows: Record<string, string>;

  /** 自定义变量 */
  custom?: Record<string, string>;

  /** 父主题名称 (用于继承) */
  extends?: string;
}

/**
 * 主题颜色
 */
export interface ThemeColors {
  /** 主色 */
  primary: string;

  /** 辅助色 */
  secondary: string;

  /** 成功色 */
  success: string;

  /** 警告色 */
  warning: string;

  /** 错误色 */
  error: string;

  /** 信息色 */
  info: string;

  /** 文本色 */
  text: string;

  /** 文本次要色 */
  textSecondary: string;

  /** 背景色 */
  background: string;

  /** 背景次要色 */
  backgroundSecondary: string;

  /** 边框色 */
  border: string;

  /** 分割线色 */
  divider: string;
}

/**
 * 主题间距
 */
export interface ThemeSpacing {
  /** 超小间距 */
  xs: string;

  /** 小间距 */
  sm: string;

  /** 中等间距 */
  md: string;

  /** 大间距 */
  lg: string;

  /** 超大间距 */
  xl: string;

  /** 超超大间距 */
  xxl: string;
}

/**
 * 主题字体
 */
export interface ThemeTypography {
  /** 字体大小 */
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };

  /** 字重 */
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };

  /** 行高 */
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
    loose: string;
  };

  /** 字体族 */
  fontFamily?: {
    sans: string;
    serif: string;
    mono: string;
  };
}

// ============================================================================
// 响应式相关类型
// ============================================================================

/**
 * 断点定义
 */
export interface Breakpoint {
  /** 断点名称 */
  name: string;

  /** 最小宽度 */
  minWidth?: number;

  /** 最大宽度 */
  maxWidth?: number;

  /** 媒体查询字符串 */
  query: string;
}

/**
 * 响应式样式
 */
export interface ResponsiveStyle {
  /** 基础样式 */
  base: ComponentStyle;

  /** 断点样式 */
  breakpoints?: Record<string, Partial<ComponentStyle>>;
}

// ============================================================================
// 嵌套样式相关类型
// ============================================================================

/**
 * 嵌套样式定义
 */
export interface NestedStyles {
  /** 基础样式 */
  base: ComponentStyle;

  /** 嵌套选择器 */
  nested?: Record<string, ComponentStyle | NestedStyles>;
}

// ============================================================================
// 混合相关类型
// ============================================================================

/**
 * CSS混合
 */
export interface CSSMixin {
  /** 混合名称 */
  name: string;

  /** 混合样式 */
  styles: ComponentStyle;

  /** 参数定义 */
  params?: MixinParam[];
}

/**
 * 混合参数
 */
export interface MixinParam {
  /** 参数名 */
  name: string;

  /** 默认值 */
  defaultValue?: string;

  /** 参数类型 */
  type?: 'string' | 'number' | 'color';
}

// ============================================================================
// 生成选项相关类型
// ============================================================================

/**
 * WXSS生成选项
 */
export interface WXSSGenerateOptions {
  /** 是否压缩 */
  minify?: boolean;

  /** 是否美化 */
  beautify?: boolean;

  /** 缩进空格数 (美化模式) */
  indent?: number;

  /** 是否生成源映射 */
  sourceMap?: boolean;

  /** 是否添加注释 */
  comments?: boolean;

  /** 是否优化 */
  optimize?: boolean;

  /** 主题名称 */
  theme?: string;

  /** 是否转换px到rpx */
  pxToRpx?: boolean;

  /** px转rpx的比例 */
  pxToRpxRatio?: number;

  /** 是否启用autoprefixer */
  autoprefixer?: boolean;

  /** 排序属性 */
  sortProperties?: boolean;

  /** 自定义单位转换 */
  unitConverter?: UnitConverter;
}

/**
 * 格式化选项
 */
export interface FormatOptions {
  /** 是否压缩 */
  minify?: boolean;

  /** 缩进字符 */
  indent?: string;

  /** 是否使用制表符 */
  useTabs?: boolean;

  /** 行尾字符 */
  lineEnding?: '\n' | '\r\n';

  /** 是否保留注释 */
  preserveComments?: boolean;

  /** 是否排序属性 */
  sortProperties?: boolean;
}

/**
 * 美化选项
 */
export interface BeautifyOptions {
  /** 缩进空格数 */
  indent?: number;

  /** 是否使用制表符 */
  useTabs?: boolean;

  /** 行尾字符 */
  lineEnding?: '\n' | '\r\n';

  /** 选择器和花括号之间是否换行 */
  selectorBraceNewline?: boolean;

  /** 属性是否换行 */
  propertyNewline?: boolean;

  /** 是否排序属性 */
  sortProperties?: boolean;
}

// ============================================================================
// 单位转换相关类型
// ============================================================================

/**
 * 单位转换器
 */
export interface UnitConverter {
  /** 转换器名称 */
  name: string;

  /** 转换函数 */
  convert: (value: string, options?: ConvertOptions) => string;
}

/**
 * 转换选项
 */
export interface ConvertOptions {
  /** 源单位 */
  from?: CSSUnit;

  /** 目标单位 */
  to?: CSSUnit;

  /** 转换比例 */
  ratio?: number;

  /** CSS属性名 */
  property?: string;

  /** 是否强制转换 */
  force?: boolean;
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

  /** 错误路径 */
  path?: string;

  /** 错误详情 */
  details?: any;

  /** 行号 */
  line?: number;

  /** 列号 */
  column?: number;
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

  /** 行号 */
  line?: number;

  /** 列号 */
  column?: number;
}

/**
 * 兼容性报告
 */
export interface CompatibilityReport {
  /** 是否兼容 */
  compatible: boolean;

  /** 不兼容的特性 */
  incompatibilities: IncompatibilityIssue[];

  /** 建议 */
  suggestions: string[];
}

/**
 * 不兼容问题
 */
export interface IncompatibilityIssue {
  /** 问题类型 */
  type: 'selector' | 'property' | 'value' | 'unit';

  /** 问题描述 */
  message: string;

  /** 受影响的代码 */
  code: string;

  /** 位置 */
  location?: string;

  /** 修复建议 */
  fix?: string;
}

// ============================================================================
// 源映射相关类型
// ============================================================================

/**
 * 源映射
 */
export interface SourceMap {
  /** 版本 */
  version: number;

  /** 源文件列表 */
  sources: string[];

  /** 映射字符串 */
  mappings: string;

  /** 名称列表 */
  names?: string[];

  /** 源内容 */
  sourcesContent?: string[];
}

// ============================================================================
// 插件相关类型
// ============================================================================

/**
 * WXSS插件
 */
export interface WXSSPlugin {
  /** 插件名称 */
  name: string;

  /** 插件版本 */
  version?: string;

  /** 转换函数 */
  transform: (rules: CSSRule[], options?: any) => CSSRule[];

  /** 验证函数 */
  validate?: (css: string, options?: any) => ValidationResult;

  /** 初始化函数 */
  init?: (options?: any) => void;
}

// ============================================================================
// 缓存相关类型
// ============================================================================

/**
 * 缓存项
 */
export interface CacheEntry {
  /** 缓存键 */
  key: string;

  /** CSS规则 */
  cssRules: CSSRule[];

  /** WXSS字符串 */
  wxss: string;

  /** 时间戳 */
  timestamp: number;

  /** 哈希值 */
  hash: string;
}

/**
 * 缓存选项
 */
export interface CacheOptions {
  /** 是否启用缓存 */
  enabled?: boolean;

  /** 缓存最大数量 */
  maxSize?: number;

  /** 缓存过期时间 (毫秒) */
  ttl?: number;
}

// ============================================================================
// 错误类型
// ============================================================================

/**
 * WXSS生成器错误基类
 */
export class WXSSGeneratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'WXSSGeneratorError';
  }
}

/**
 * 选择器错误
 */
export class InvalidSelectorError extends WXSSGeneratorError {
  constructor(selector: string, reason?: string) {
    super(
      `无效的CSS选择器: ${selector}${reason ? ` (${reason})` : ''}`,
      'INVALID_SELECTOR',
      { selector, reason }
    );
    this.name = 'InvalidSelectorError';
  }
}

/**
 * 属性错误
 */
export class InvalidPropertyError extends WXSSGeneratorError {
  constructor(property: string, value: string, reason?: string) {
    super(
      `无效的CSS属性: ${property}: ${value}${reason ? ` (${reason})` : ''}`,
      'INVALID_PROPERTY',
      { property, value, reason }
    );
    this.name = 'InvalidPropertyError';
  }
}

/**
 * 单位转换错误
 */
export class UnitConversionError extends WXSSGeneratorError {
  constructor(value: string, from: string, to: string) {
    super(
      `单位转换失败: 无法将 ${value} 从 ${from} 转换为 ${to}`,
      'UNIT_CONVERSION_ERROR',
      { value, from, to }
    );
    this.name = 'UnitConversionError';
  }
}

/**
 * 主题未找到错误
 */
export class ThemeNotFoundError extends WXSSGeneratorError {
  constructor(themeName: string) {
    super(
      `主题未找到: ${themeName}`,
      'THEME_NOT_FOUND',
      { themeName }
    );
    this.name = 'ThemeNotFoundError';
  }
}

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 只读深度
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
