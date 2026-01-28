/**
 * 微信小程序可视化开发平台 - 事件系统类型定义
 *
 * 本文件定义了事件系统的所有 TypeScript 类型接口
 * 参考 GDevelop 的事件系统,专门针对微信小程序适配
 */

// ============================================================================
// 基础事件类型
// ============================================================================

/**
 * 事件类型枚举
 */
export type EventType =
  | 'standard'        // 标准事件 (条件-动作)
  | 'while'           // While 循环
  | 'forEach'         // ForEach 遍历
  | 'comment'         // 注释
  | 'group';          // 分组

/**
 * 基础事件接口
 * 所有事件类型的基类
 */
export interface BaseEvent {
  /** 事件唯一标识 (UUID) */
  id: string;

  /** 事件类型 */
  type: EventType;

  /** 是否禁用 */
  disabled?: boolean;

  /** 是否折叠 (编辑器UI) */
  folded?: boolean;

  /** 指令元数据 (可选,用于编译和执行) */
  metadata?: InstructionMetadata;
}

/**
 * 标准事件 - 条件-动作编程模型
 * 这是最常用的事件类型,包含条件、动作和子事件
 */
export interface StandardEvent extends BaseEvent {
  type: 'standard';

  /** 条件列表 (AND 逻辑) */
  conditions: Condition[];

  /** 动作列表 (顺序执行) */
  actions: Action[];

  /** 子事件 (条件满足时执行) */
  subEvents?: BaseEvent[];

  /** 局部变量 (事件内作用域) */
  variables?: Variable[];
}

/**
 * While 循环事件
 * 当条件为真时,重复执行动作
 */
export interface WhileEvent extends BaseEvent {
  type: 'while';

  /** 循环条件 */
  condition: Condition;

  /** 循环体动作 */
  actions: Action[];

  /** 子事件 */
  subEvents?: BaseEvent[];

  /** 最大迭代次数 (防止无限循环) */
  maxIterations?: number;
}

/**
 * ForEach 遍历事件
 * 遍历集合,对每个元素执行动作
 */
export interface ForEachEvent extends BaseEvent {
  type: 'forEach';

  /** 要遍历的集合表达式 */
  collection: Expression;

  /** 循环项变量名 (默认 "item") */
  itemVariable: string;

  /** 循环索引变量名 (可选,默认 "index") */
  indexVariable?: string;

  /** 循环体动作 */
  actions: Action[];

  /** 子事件 */
  subEvents?: BaseEvent[];
}

/**
 * 注释事件
 * 不执行任何操作,仅用于注释和文档
 */
export interface CommentEvent extends BaseEvent {
  type: 'comment';

  /** 注释文本 */
  text: string;
}

/**
 * 分组事件
 * 将多个事件组织在一起,便于管理和编辑
 */
export interface GroupEvent extends BaseEvent {
  type: 'group';

  /** 分组标题 */
  title: string;

  /** 分组内的子事件 */
  subEvents: BaseEvent[];
}

// ============================================================================
// 条件和动作类型
// ============================================================================

/**
 * 条件类型枚举
 */
export type ConditionType =
  | 'comparison'       // 比较: a == b, a > b, etc.
  | 'logical'          // 逻辑: AND, OR, NOT
  | 'variable'         // 变量: 变量为真/假
  | 'object'           // 对象: 对象存在
  | 'string'           // 字符串: 包含、匹配等
  | 'array'            // 数组: 长度、包含元素等
  | 'expression'       // 表达式: 自定义表达式
  | 'timer'            // 计时器: 时间条件
  | 'system'           // 系统: 系统事件条件
  | string;            // 自定义条件类型

/**
 * 条件接口
 * 条件用于判断是否执行动作
 */
export interface Condition {
  /** 条件唯一标识 */
  id: string;

  /** 条件类型 */
  type: ConditionType;

  /** 条件参数 (类型和数量取决于条件类型) */
  parameters: Expression[];

  /** 是否反转结果 (用于"不是"逻辑) */
  inverted?: boolean;

  /** 子条件 (用于复合条件: AND/OR) */
  subConditions?: Condition[];

  /** 逻辑操作符 ('AND' / 'OR',仅当有子条件时使用) */
  logicalOperator?: 'AND' | 'OR';
}

/**
 * 动作类型枚举
 */
export type ActionType =
  // 数据操作
  | 'setData'                // 设置页面数据
  | 'setVariable'            // 设置变量
  | 'incrementVariable'      // 增加变量
  | 'decrementVariable'      // 减少变量
  | 'arrayPush'              // 数组追加
  | 'arrayRemove'            // 数组移除
  | 'arrayInsert'            // 数组插入
  | 'objectSet'              // 对象设置属性
  | 'objectDelete'           // 对象删除属性

  // 页面导航
  | 'navigateTo'             // 打开页面
  | 'navigateBack'           // 返回上一页
  | 'redirectTo'             // 重定向
  | 'reLaunch'               // 重新启动

  // UI 交互
  | 'showToast'              // 显示提示
  | 'showModal'              // 显示模态框
  | 'showActionSheet'        // 显示操作表
  | 'hideToast'              // 隐藏提示
  | 'hideLoading'            // 隐藏加载

  // 组件操作
  | 'updateComponentProperty' // 更新组件属性
  | 'showComponent'          // 显示组件
  | 'hideComponent'          // 隐藏组件
  | 'removeComponent'        // 移除组件

  // 网络操作
  | 'request'                // 发起HTTP请求
  | 'uploadFile'             // 上传文件
  | 'downloadFile'           // 下载文件

  // 媒体操作
  | 'playSound'              // 播放声音
  | 'playVideo'              // 播放视频
  | 'chooseImage'            // 选择图片
  | 'chooseFile'             // 选择文件

  // 系统操作
  | 'getLocation'            // 获取位置
  | 'scanCode'               // 扫描二维码
  | 'shareAppMessage'        // 分享

  // 自定义和其他
  | 'custom'                 // 自定义动作
  | string;                  // 其他动作类型

/**
 * 动作接口
 * 动作是执行的具体操作
 */
export interface Action {
  /** 动作唯一标识 */
  id: string;

  /** 动作类型 */
  type: ActionType;

  /** 动作参数 (类型和数量取决于动作类型) */
  parameters: Expression[];

  /** 是否异步 (某些动作可能是异步的) */
  async?: boolean;

  /** 是否等待异步完成 */
  await?: boolean;
}

// ============================================================================
// 表达式类型
// ============================================================================

/**
 * 表达式类型枚举
 */
export type ExpressionType =
  | 'literal'          // 字面量: "hello", 123, true
  | 'variable'         // 变量: data.name, globalVar
  | 'expression'       // 表达式: data.count + 1
  | 'function'         // 函数调用: Math.max(a, b)
  | 'reference'        // 引用: this.data.name
  | 'conditional'      // 条件表达式: condition ? true : false
  | 'object'           // 对象字面量: { x: 1, y: 2 }
  | 'array'            // 数组字面量: [1, 2, 3]
  | string;            // 其他表达式类型

/**
 * 表达式接口
 * 表达式用于参数化条件和动作
 */
export interface Expression {
  /** 表达式值/代码 */
  value: string;

  /** 表达式类型 */
  type: ExpressionType;

  /** 表达式元数据 */
  metadata?: {
    /** 编程语言 ('js', 'expression', 'literal') */
    language?: string;

    /** 返回值类型 */
    returnType?: string;

    /** 表达式是否纯函数 */
    pure?: boolean;
  };
}

// ============================================================================
// 变量和作用域类型
// ============================================================================

/**
 * 变量类型枚举
 */
export type VariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'any';

/**
 * 变量接口
 */
export interface Variable {
  /** 变量ID */
  id: string;

  /** 变量名 */
  name: string;

  /** 变量类型 */
  type: VariableType;

  /** 初始值 */
  initialValue?: any;

  /** 变量描述 */
  description?: string;

  /** 是否持久化 (存储到本地) */
  persistent?: boolean;
}

// ============================================================================
// 执行上下文类型
// ============================================================================

/**
 * 事件执行上下文
 * 包含执行事件所需的所有数据和方法
 */
export interface EventContext {
  // ===== 数据 =====

  /** 页面数据 (对应 Page.data) */
  pageData: Record<string, any>;

  /** 全局数据 (对应全局变量) */
  globalData: Record<string, any>;

  /** 组件数据 (当前组件的数据,如果有) */
  componentData?: Record<string, any>;

  // ===== 变量 =====

  /** 页面变量容器 */
  variables: VariableContainer;

  /** 全局变量容器 */
  globalVariables: VariableContainer;

  /** 局部变量容器 (事件内作用域) */
  localVariables: VariableContainer;

  // ===== 运行时信息 =====

  /** 当前页面ID */
  currentPageId?: string;

  /** 当前页面名称 */
  currentPageName?: string;

  /** 当前组件ID (如果有) */
  currentComponentId?: string;

  /** 当前事件ID */
  currentEventId: string;

  /** 事件执行堆栈 (用于调试) */
  executionStack?: string[];

  // ===== 内置函数库 =====

  /** 内置函数 (Math, String 等) */
  builtInFunctions: Map<string, (...args: any[]) => any>;

  /** 自定义函数 */
  customFunctions: Map<string, (...args: any[]) => any>;

  /** API 函数 (wx.xxx) */
  apiFunctions: Map<string, (...args: any[]) => any>;

  // ===== 工具方法 =====

  /** 获取变量值 */
  getVariable(name: string): any;

  /** 设置变量值 */
  setVariable(name: string, value: any): void;

  /** 获取组件属性 */
  getComponentProperty(componentId: string, property: string): any;

  /** 设置组件属性 */
  setComponentProperty(componentId: string, property: string, value: any): void;

  /** 获取页面数据 */
  getPageData(key: string): any;

  /** 设置页面数据 */
  setPageData(key: string, value: any): void;

  /** 调用 API 函数 */
  callAPI(apiName: string, ...args: any[]): Promise<any> | any;

  /** 记录日志 (调试用) */
  log(message: string, level?: 'info' | 'warn' | 'error'): void;
}

/**
 * 编译上下文
 */
export interface CompileContext {
  /** 事件列表 */
  events: BaseEvent[];

  /** 目标编程语言 */
  target: 'javascript' | 'typescript';

  /** 是否包含元数据 */
  includeMetadata?: boolean;

  /** 是否优化代码 */
  optimizeCode?: boolean;

  /** 是否严格模式 */
  strict?: boolean;

  /** 是否生成源代码映射 */
  sourceMap?: boolean;

  /** 输出格式 */
  format?: 'esm' | 'cjs' | 'iife';
}

// ============================================================================
// 指令元数据类型
// ============================================================================

/**
 * 参数元数据
 */
export interface ParameterMetadata {
  /** 参数名 */
  name: string;

  /** 参数类型 */
  type: 'expression' | 'variable' | 'object' | 'string' | 'number' | 'boolean';

  /** 参数描述 */
  description?: string;

  /** 默认值 */
  defaultValue?: any;

  /** 是否可选 */
  optional?: boolean;

  /** 可选值列表 */
  enumValues?: any[];

  /** 最小值/最大值 (数值类型) */
  min?: number;
  max?: number;

  /** 正则表达式验证 (字符串类型) */
  pattern?: string;
}

/**
 * 指令元数据
 * 预定义的条件和动作的元数据
 */
export interface InstructionMetadata {
  /** 指令ID */
  id: string;

  /** 指令名称 */
  name: string;

  /** 指令类型 (条件或动作) */
  type: 'condition' | 'action';

  /** 指令描述 */
  description?: string;

  /** 指令分类 (便于分组) */
  category?: string;

  /** 参数列表 */
  parameters: ParameterMetadata[];

  /** 返回类型 (条件返回 boolean, 动作返回 void 或其他) */
  returnType?: string;

  /** 是否异步 */
  async?: boolean;

  /** 是否已弃用 */
  deprecated?: boolean;

  /** 弃用信息 */
  deprecationMessage?: string;

  /** 使用示例 */
  examples?: string[];

  /** 关键词 (用于搜索) */
  keywords?: string[];
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

  /** 错误路径 (如 "events[0].conditions[0]") */
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
}

// ============================================================================
// 变量容器类型 (与 03_Core_VariableSystem 集成)
// ============================================================================

/**
 * 变量容器接口
 * 管理变量集合,提供存储和检索功能
 */
export interface VariableContainer {
  // 基本操作
  addVariable(variable: Variable): void;
  removeVariable(variableId: string): void;
  updateVariable(variableId: string, updates: Partial<Variable>): void;
  hasVariable(name: string): boolean;
  getVariable(name: string): Variable | undefined;
  getVariableById(id: string): Variable | undefined;
  listVariables(): Variable[];

  // 值操作
  getValue(name: string): any;
  setValue(name: string, value: any): void;
  deleteValue(name: string): void;

  // 查询
  findVariables(predicate: (v: Variable) => boolean): Variable[];
  getAllVariableNames(): string[];
}

// ============================================================================
// 执行结果类型
// ============================================================================

/**
 * 事件执行结果
 */
export interface EventExecutionResult {
  /** 是否执行成功 */
  success: boolean;

  /** 执行状态 */
  status: 'pending' | 'executing' | 'success' | 'error' | 'skipped';

  /** 执行耗时 (毫秒) */
  duration: number;

  /** 修改的数据 */
  dataChanges: Record<string, any>;

  /** 执行的动作数量 */
  actionsExecuted: number;

  /** 错误信息 (如果失败) */
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  /** 执行的事件ID */
  eventId: string;

  /** 子事件执行结果 */
  subEventResults?: EventExecutionResult[];
}

// ============================================================================
// 编译结果类型
// ============================================================================

/**
 * 事件编译结果
 */
export interface CompilationResult {
  /** 是否编译成功 */
  success: boolean;

  /** 生成的代码 */
  code?: string;

  /** 源代码映射 (Source Map) */
  sourceMap?: string;

  /** 编译错误 */
  errors: CompilationError[];

  /** 编译警告 */
  warnings: CompilationWarning[];

  /** 编译统计 */
  stats: {
    /** 处理的事件数量 */
    eventCount: number;

    /** 编译耗时 (毫秒) */
    duration: number;

    /** 生成的代码行数 */
    codeLines: number;

    /** 生成的代码大小 (字节) */
    codeSize: number;
  };
}

/**
 * 编译错误
 */
export interface CompilationError {
  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误位置 */
  location?: {
    eventId: string;
    line?: number;
    column?: number;
  };

  /** 建议的修复 */
  suggestion?: string;
}

/**
 * 编译警告
 */
export interface CompilationWarning {
  /** 警告代码 */
  code: string;

  /** 警告消息 */
  message: string;

  /** 警告位置 */
  location?: {
    eventId: string;
  };
}

// ============================================================================
// 导出所有类型
// ============================================================================

export * from './instruction-metadata';

