/**
 * WXML 生成器 - 主入口文件
 *
 * 导出所有公共API
 */

export * from './types';
export { WXMLGenerator } from './wxml-generator';
export { AttributeGenerator } from './attribute-generator';
export { BindingGenerator } from './binding-generator';
export { Formatter } from './formatter';
export { Validator } from './validator';

// 重新导出核心类型
export type {
  Component,
  ComponentProperty,
  ComponentEvent,
  DataBinding,
  ListRenderingConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../../../01_Core_ProjectStructure/implementation/types';
