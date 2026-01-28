/**
 * 微信小程序可视化开发平台 - 事件编辑器类型定义
 *
 * 本文件定义了事件编辑器模块的所有 TypeScript 类型接口
 */

import {
  BaseEvent,
  Condition,
  Action,
  Expression,
  Variable,
  ValidationError,
  ValidationWarning,
  ConditionType,
  ActionType,
  InstructionMetadata,
} from '../../02_Core_EventSystem/implementation/types';

// ============================================================================
// 编辑器状态类型
// ============================================================================

/**
 * 编辑器全局状态
 */
export interface EditorState {
  /** 事件树数据 */
  events: BaseEvent[];

  /** 当前选中的事件ID */
  selectedEventId: string | null;

  /** 展开的事件ID集合 */
  expandedEventIds: Set<string>;

  /** 正在编辑的条件ID */
  editingConditionId: string | null;

  /** 条件编辑草稿 */
  conditionDraft: Condition | null;

  /** 正在编辑的动作ID */
  editingActionId: string | null;

  /** 动作编辑草稿 */
  actionDraft: Action | null;

  /** 正在编辑的参数路径 (如 "condition.0.parameters.0") */
  editingParameterPath: string | null;

  /** 参数编辑草稿 */
  parameterDraft: Expression | null;

  /** 历史快照列表 */
  history: EditorSnapshot[];

  /** 当前历史索引 */
  historyIndex: number;

  /** 验证错误 (key: 事件ID/条件ID/动作ID) */
  validationErrors: Map<string, ValidationError[]>;

  /** 警告 */
  warnings: Map<string, ValidationWarning[]>;

  /** 是否显示预览面板 */
  showPreview: boolean;

  /** 选中的Tab */
  selectedTab: 'events' | 'conditions' | 'actions';

  /** 正在拖拽的事件ID */
  draggedEventId: string | null;

  /** 可用变量列表 */
  availableVariables: Variable[];

  /** 可用的内置函数 */
  availableFunctions: BuiltInFunction[];

  /** 可用的条件类型 */
  availableConditionTypes: ConditionType[];

  /** 可用的动作类型 */
  availableActionTypes: ActionType[];
}

/**
 * 编辑器历史快照
 */
export interface EditorSnapshot {
  /** 事件树的深拷贝 */
  events: BaseEvent[];

  /** 快照时间戳 */
  timestamp: number;

  /** 操作描述 */
  description: string;
}

// ============================================================================
// 参数编辑类型
// ============================================================================

/**
 * 参数值来源
 */
export type ParameterValueSource = 'constant' | 'variable' | 'expression';

/**
 * 参数编辑配置
 */
export interface ParameterEditConfig {
  /** 参数名称 */
  name: string;

  /** 参数类型 */
  type: 'string' | 'number' | 'boolean' | 'expression' | 'variable' | 'object';

  /** 参数描述 */
  description?: string;

  /** 默认值 */
  defaultValue?: any;

  /** 是否可选 */
  optional?: boolean;

  /** 可选值列表 (用于 Select) */
  enumValues?: Array<{ label: string; value: any }>;

  /** 最小值 (数值类型) */
  min?: number;

  /** 最大值 (数值类型) */
  max?: number;

  /** 正则表达式验证 (字符串类型) */
  pattern?: string;

  /** 允许的参数值来源 */
  allowedSources?: ParameterValueSource[];
}

/**
 * 参数字段Props
 */
export interface ParameterFieldProps {
  /** 参数值 */
  value: any;

  /** 参数配置 */
  config: ParameterEditConfig;

  /** 值改变回调 */
  onChange: (value: any) => void;

  /** 是否禁用 */
  disabled?: boolean;

  /** 是否显示错误 */
  error?: string;

  /** 可用变量 (用于变量选择器) */
  availableVariables?: Variable[];
}

// ============================================================================
// 自动补全类型
// ============================================================================

/**
 * 自动补全上下文
 */
export interface AutoCompleteContext {
  /** 当前输入的前缀 */
  prefix: string;

  /** 光标位置 */
  cursorPosition: number;

  /** 可用的变量 */
  variables: Variable[];

  /** 可用的函数 */
  builtInFunctions: BuiltInFunction[];

  /** 自定义函数 */
  customFunctions: CustomFunction[];

  /** 当前作用域 (表达式/变量路径等) */
  scope: 'expression' | 'variablePath' | 'functionCall';
}

/**
 * 自动补全建议
 */
export interface AutoCompleteSuggestion {
  /** 显示标签 */
  label: string;

  /** 补全类型 */
  type: 'variable' | 'function' | 'keyword' | 'constant' | 'property';

  /** 详细信息 (如变量类型) */
  detail?: string;

  /** 文档说明 */
  documentation?: string;

  /** 插入文本 (默认为 label) */
  insertText?: string;

  /** 相关性得分 (用于排序) */
  score: number;

  /** 图标 */
  icon?: string;
}

/**
 * 内置函数定义
 */
export interface BuiltInFunction {
  /** 函数名 */
  name: string;

  /** 函数分类 */
  category: 'Math' | 'String' | 'Array' | 'Object' | 'Date' | 'Other';

  /** 函数描述 */
  description: string;

  /** 参数列表 */
  parameters: FunctionParameter[];

  /** 返回类型 */
  returnType: string;

  /** 使用示例 */
  example?: string;
}

/**
 * 自定义函数定义
 */
export interface CustomFunction {
  /** 函数ID */
  id: string;

  /** 函数名 */
  name: string;

  /** 函数描述 */
  description?: string;

  /** 参数列表 */
  parameters: FunctionParameter[];

  /** 返回类型 */
  returnType: string;

  /** 函数实现 (可选) */
  implementation?: string;
}

/**
 * 函数参数定义
 */
export interface FunctionParameter {
  /** 参数名 */
  name: string;

  /** 参数类型 */
  type: string;

  /** 是否可选 */
  optional?: boolean;

  /** 默认值 */
  defaultValue?: any;

  /** 参数描述 */
  description?: string;
}

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
 * 表达式验证结果
 */
export interface ExpressionValidationResult extends ValidationResult {
  /** 推断的返回类型 */
  inferredType?: string;

  /** 引用的变量 */
  referencedVariables?: string[];

  /** 引用的函数 */
  referencedFunctions?: string[];
}

// ============================================================================
// 条件编辑器类型
// ============================================================================

/**
 * 条件编辑器配置
 */
export interface ConditionEditorConfig {
  /** 可用的条件类型 */
  availableConditionTypes: ConditionTypeMetadata[];

  /** 是否允许反转 */
  allowInvert?: boolean;

  /** 是否允许复合条件 (AND/OR) */
  allowComposite?: boolean;

  /** 最大嵌套深度 */
  maxNestingDepth?: number;
}

/**
 * 条件类型元数据
 */
export interface ConditionTypeMetadata {
  /** 条件类型 */
  type: ConditionType;

  /** 显示名称 */
  label: string;

  /** 描述 */
  description?: string;

  /** 图标 */
  icon?: string;

  /** 分类 */
  category: string;

  /** 参数配置 */
  parameters: ParameterEditConfig[];

  /** 示例 */
  example?: string;
}

// ============================================================================
// 动作编辑器类型
// ============================================================================

/**
 * 动作编辑器配置
 */
export interface ActionEditorConfig {
  /** 可用的动作类型 */
  availableActionTypes: ActionTypeMetadata[];

  /** 是否允许异步标记 */
  allowAsync?: boolean;

  /** 是否允许条件执行 */
  allowConditional?: boolean;
}

/**
 * 动作类型元数据
 */
export interface ActionTypeMetadata {
  /** 动作类型 */
  type: ActionType;

  /** 显示名称 */
  label: string;

  /** 描述 */
  description?: string;

  /** 图标 */
  icon?: string;

  /** 分类 */
  category: string;

  /** 参数配置 */
  parameters: ParameterEditConfig[];

  /** 是否异步 */
  async?: boolean;

  /** 示例 */
  example?: string;
}

// ============================================================================
// 事件树类型
// ============================================================================

/**
 * 事件树项
 */
export interface EventTreeItem {
  /** 事件 */
  event: BaseEvent;

  /** 父事件ID */
  parentId: string | null;

  /** 层级深度 */
  depth: number;

  /** 是否展开 */
  expanded: boolean;

  /** 子事件项 */
  children: EventTreeItem[];

  /** 索引路径 (如 [0, 1, 2]) */
  indexPath: number[];
}

/**
 * 拖拽信息
 */
export interface DragInfo {
  /** 拖拽的事件ID */
  eventId: string;

  /** 拖拽的事件 */
  event: BaseEvent;

  /** 原父事件ID */
  sourceParentId: string | null;

  /** 原索引 */
  sourceIndex: number;
}

/**
 * 拖放目标信息
 */
export interface DropTarget {
  /** 目标父事件ID */
  targetParentId: string | null;

  /** 目标索引 */
  targetIndex: number;

  /** 拖放位置 (before/after/inside) */
  position: 'before' | 'after' | 'inside';
}

// ============================================================================
// UI组件Props类型
// ============================================================================

/**
 * EventEditor 组件Props
 */
export interface EventEditorProps {
  /** 初始事件列表 */
  initialEvents?: BaseEvent[];

  /** 可用变量 */
  availableVariables?: Variable[];

  /** 可用的条件类型 */
  availableConditionTypes?: ConditionType[];

  /** 可用的动作类型 */
  availableActionTypes?: ActionType[];

  /** 事件变更回调 */
  onChange?: (events: BaseEvent[]) => void;

  /** 验证错误回调 */
  onValidationError?: (errors: ValidationError[]) => void;

  /** 是否只读 */
  readonly?: boolean;

  /** 高度 */
  height?: number | string;
}

/**
 * EventsTree 组件Props
 */
export interface EventsTreeProps {
  /** 事件列表 */
  events: BaseEvent[];

  /** 选中的事件ID */
  selectedEventId: string | null;

  /** 展开的事件ID集合 */
  expandedEventIds: Set<string>;

  /** 选择事件回调 */
  onSelectEvent: (eventId: string | null) => void;

  /** 切换展开回调 */
  onToggleExpand: (eventId: string) => void;

  /** 移动事件回调 */
  onMoveEvent: (eventId: string, newParentId: string | null, index: number) => void;

  /** 删除事件回调 */
  onDeleteEvent: (eventId: string) => void;

  /** 是否只读 */
  readonly?: boolean;
}

/**
 * ConditionEditor 组件Props
 */
export interface ConditionEditorProps {
  /** 事件ID */
  eventId: string;

  /** 条件列表 */
  conditions: Condition[];

  /** 可用的条件类型 */
  availableConditionTypes: ConditionTypeMetadata[];

  /** 可用变量 */
  availableVariables: Variable[];

  /** 条件变更回调 */
  onChange: (conditions: Condition[]) => void;

  /** 是否只读 */
  readonly?: boolean;
}

/**
 * ActionEditor 组件Props
 */
export interface ActionEditorProps {
  /** 事件ID */
  eventId: string;

  /** 动作列表 */
  actions: Action[];

  /** 可用的动作类型 */
  availableActionTypes: ActionTypeMetadata[];

  /** 可用变量 */
  availableVariables: Variable[];

  /** 动作变更回调 */
  onChange: (actions: Action[]) => void;

  /** 是否只读 */
  readonly?: boolean;
}

/**
 * ParameterEditor 组件Props
 */
export interface ParameterEditorProps {
  /** 参数值 */
  value: Expression;

  /** 参数配置 */
  config: ParameterEditConfig;

  /** 可用变量 */
  availableVariables: Variable[];

  /** 值改变回调 */
  onChange: (value: Expression) => void;

  /** 是否只读 */
  readonly?: boolean;

  /** 验证错误 */
  error?: string;
}

/**
 * AutoComplete 组件Props
 */
export interface AutoCompleteProps {
  /** 输入值 */
  value: string;

  /** 光标位置 */
  cursorPosition: number;

  /** 自动补全上下文 */
  context: AutoCompleteContext;

  /** 选择补全项回调 */
  onSelect: (suggestion: AutoCompleteSuggestion) => void;

  /** 关闭补全菜单回调 */
  onClose: () => void;

  /** 是否显示 */
  visible: boolean;
}

// ============================================================================
// 操作类型
// ============================================================================

/**
 * 编辑器动作类型
 */
export type EditorAction =
  | { type: 'ADD_EVENT'; payload: { parentId: string | null; event: BaseEvent } }
  | { type: 'REMOVE_EVENT'; payload: { eventId: string } }
  | { type: 'UPDATE_EVENT'; payload: { eventId: string; updates: Partial<BaseEvent> } }
  | { type: 'MOVE_EVENT'; payload: { eventId: string; newParentId: string | null; index: number } }
  | { type: 'SELECT_EVENT'; payload: { eventId: string | null } }
  | { type: 'TOGGLE_EVENT_EXPANDED'; payload: { eventId: string } }
  | { type: 'ADD_CONDITION'; payload: { eventId: string; condition: Condition } }
  | { type: 'REMOVE_CONDITION'; payload: { eventId: string; conditionId: string } }
  | { type: 'UPDATE_CONDITION'; payload: { eventId: string; conditionId: string; updates: Partial<Condition> } }
  | { type: 'ADD_ACTION'; payload: { eventId: string; action: Action } }
  | { type: 'REMOVE_ACTION'; payload: { eventId: string; actionId: string } }
  | { type: 'UPDATE_ACTION'; payload: { eventId: string; actionId: string; updates: Partial<Action> } }
  | { type: 'START_EDITING_PARAMETER'; payload: { path: string; value: Expression } }
  | { type: 'UPDATE_PARAMETER_DRAFT'; payload: { updates: Partial<Expression> } }
  | { type: 'SAVE_PARAMETER_DRAFT'; payload: {} }
  | { type: 'CANCEL_PARAMETER_EDIT'; payload: {} }
  | { type: 'UNDO'; payload: {} }
  | { type: 'REDO'; payload: {} }
  | { type: 'SET_VALIDATION_ERRORS'; payload: { id: string; errors: ValidationError[] } }
  | { type: 'CLEAR_VALIDATION_ERRORS'; payload: { id: string } };

// ============================================================================
// 工具类型
// ============================================================================

/**
 * 深度部分类型 (递归)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 只读递归类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 操作结果
 */
export interface OperationResult<T = void> {
  /** 是否成功 */
  success: boolean;

  /** 结果数据 */
  data?: T;

  /** 错误信息 */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
