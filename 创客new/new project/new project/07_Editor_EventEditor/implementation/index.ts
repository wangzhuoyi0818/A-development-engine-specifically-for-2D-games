/**
 * 事件编辑器模块
 *
 * 导出所有公共API
 */

// 核心类
export { EventEditor } from './event-editor';
export { ConditionEditor, DEFAULT_CONDITION_TYPES } from './condition-editor';
export { ActionEditor, DEFAULT_ACTION_TYPES } from './action-editor';
export {
  ParameterFieldManager,
  VariablePicker,
  ExpressionEditorHelper,
} from './parameter-fields';

// 类型定义
export * from './types';

// 从事件系统重新导出常用类型
export type {
  BaseEvent,
  StandardEvent,
  WhileEvent,
  ForEachEvent,
  CommentEvent,
  GroupEvent,
  Condition,
  Action,
  Expression,
  Variable,
  ValidationError,
  ValidationWarning,
} from '../../02_Core_EventSystem/implementation/types';
