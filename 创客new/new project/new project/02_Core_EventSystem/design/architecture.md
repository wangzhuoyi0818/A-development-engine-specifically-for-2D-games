# 事件系统模块 - 架构设计文档

## 1. 模块概述

### 1.1 功能定位
本模块是微信小程序可视化开发平台的事件系统核心，提供条件-动作编程模型的支持。类似于 GDevelop 的事件系统，但专门针对微信小程序的特性（页面导航、组件操作、数据绑定等）进行了设计。

### 1.2 核心职责
- 管理可视化事件的定义和存储
- 支持标准事件（条件-动作）编程模型
- 支持嵌套事件和循环事件（While, ForEach）
- 提供事件验证和编译功能
- 将事件编译为可执行的 JavaScript 代码
- 在运行时执行事件的条件判断和动作执行
- 提供完整的表达式求值系统

### 1.3 设计原则
- 遵循 GDevelop 的事件系统设计，但针对微信小程序简化
- 提供完整的类型安全（TypeScript）
- 支持可视化编辑（数据结构简洁清晰）
- 高度可测试（单元测试覆盖率 > 90%）
- 高效的编译和执行

## 2. 架构设计

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                     Event System                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Event System                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Event                                           │  │  │
│  │  │  - StandardEvent (条件-动作)                     │  │  │
│  │  │  - WhileEvent (循环)                             │  │  │
│  │  │  - ForEachEvent (遍历循环)                       │  │  │
│  │  │  - CommentEvent (注释)                           │  │  │
│  │  │  - GroupEvent (分组)                             │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Condition (条件)                                │  │  │
│  │  │  - type: string (条件类型)                       │  │  │
│  │  │  - parameters: Expression[] (参数)              │  │  │
│  │  │  - inverted: boolean (是否反转)                 │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  Action (动作)                                   │  │  │
│  │  │  - type: string (动作类型)                       │  │  │
│  │  │  - parameters: Expression[] (参数)              │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  EventManager (事件管理器)                             │  │
│  │  - addEvent(), removeEvent(), moveEvent()             │  │
│  │  - findEvent(), validateEvent()                       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  InstructionExecutor (指令执行器)                      │  │
│  │  - executeCondition(), executeAction()                │  │
│  │  - evaluateExpression(), callFunction()               │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  EventCompiler (事件编译器)                            │  │
│  │  - compile(), compileConditions(), compileActions()  │  │
│  │  - generateCode()                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 类关系图

```
┌──────────────────────┐
│ BaseEvent            │
├──────────────────────┤
│ + id: string         │
│ + type: string       │
│ + disabled: boolean  │
│ + folded: boolean    │
└──────────────────────┘
         △
         │ 继承
    ┌────┴────┬────────────┬──────────┬──────────┐
    │         │            │          │          │
    │         │            │          │          │
┌───┴───┐ ┌──┴──┐ ┌────────┴───┐ ┌────┴───┐ ┌───┴──┐
│Standar│ │While│ │ForEach     │ │Comment │ │Group │
│Event  │ │Event│ │Event       │ │Event   │ │Event │
└───────┘ └─────┘ └────────────┘ └────────┘ └──────┘
    │
    ├─> conditions: Condition[]
    ├─> actions: Action[]
    ├─> subEvents: BaseEvent[]
    └─> variables: Variable[]

┌──────────────────────┐
│ Condition            │
├──────────────────────┤
│ + type: string       │
│ + parameters: Expr[] │
│ + inverted: boolean  │
└──────────────────────┘

┌──────────────────────┐
│ Action               │
├──────────────────────┤
│ + type: string       │
│ + parameters: Expr[] │
└──────────────────────┘

┌──────────────────────┐
│ Expression           │
├──────────────────────┤
│ + value: string      │
│ + type: string       │ (literal/variable/expression/function)
└──────────────────────┘
```

### 2.3 核心类设计

#### 2.3.1 EventManager (事件管理器)

```typescript
class EventManager {
  // 事件树操作
  addEvent(parentId: string | null, event: BaseEvent, index?: number): void
  removeEvent(eventId: string): void
  moveEvent(eventId: string, newParentId: string | null, index?: number): void

  // 查询操作
  findEvent(eventId: string): BaseEvent | null
  getEventPath(eventId: string): string[] // 事件路径
  getEventsByType(type: string): BaseEvent[]

  // 验证操作
  validateEvent(event: BaseEvent): ValidationResult
  validateEventTree(events: BaseEvent[]): ValidationResult

  // 辅助
  private findEventRecursive(events: BaseEvent[], eventId: string): BaseEvent | null
  private removeEventRecursive(events: BaseEvent[], eventId: string): boolean
}
```

**职责**：
- 管理事件树的增删改查
- 提供事件查找和路径查询
- 验证事件的正确性

#### 2.3.2 InstructionExecutor (指令执行器)

```typescript
class InstructionExecutor {
  // 执行操作
  executeCondition(condition: Condition, context: EventContext): boolean
  executeAction(action: Action, context: EventContext): void
  executeEvent(event: BaseEvent, context: EventContext): Promise<void>

  // 表达式求值
  evaluateExpression(expr: Expression, context: EventContext): any
  evaluateExpression(exprStr: string, context: EventContext): any

  // 函数调用
  private callBuiltInFunction(name: string, args: any[], context: EventContext): any
  private callCustomFunction(name: string, args: any[], context: EventContext): any
}
```

**职责**：
- 执行条件判断
- 执行动作
- 表达式求值
- 函数调用

#### 2.3.3 EventCompiler (事件编译器)

```typescript
class EventCompiler {
  // 编译操作
  compile(events: BaseEvent[], context: CompileContext): string
  compileEvent(event: BaseEvent, context: CompileContext): string
  compileConditions(conditions: Condition[], context: CompileContext): string
  compileActions(actions: Action[], context: CompileContext): string

  // 代码生成
  generateCode(events: BaseEvent[]): string
  private transpileExpression(expr: Expression, context: CompileContext): string
  private generateFunctionBody(event: BaseEvent, context: CompileContext): string
}
```

**职责**：
- 编译事件为 JavaScript 代码
- 编译条件和动作
- 代码生成和优化

### 2.4 设计模式

#### 2.4.1 Composite Pattern (组合模式)
- **BaseEvent + StandardEvent/WhileEvent 等**：递归事件树结构
- 优势：自然表达嵌套事件，递归操作简单

#### 2.4.2 Visitor Pattern (访问者模式)
- **可选**：用于遍历和操作事件树
- 可使用 EventVisitor 接口进行类型化操作

#### 2.4.3 Command Pattern (命令模式)
- **Action**: 每个动作是一个命令
- 优势：动作可以被序列化、撤销、重做

#### 2.4.4 Strategy Pattern (策略模式)
- **InstructionExecutor**: 不同条件和动作的不同执行策略
- 优势：易于扩展新的条件和动作类型

## 3. 核心类型定义

### 3.1 事件类型

```typescript
// 基础事件接口
interface BaseEvent {
  id: string;
  type: EventType;
  disabled?: boolean;
  folded?: boolean;
  metadata?: InstructionMetadata;
}

// 事件类型
type EventType =
  | 'standard'
  | 'while'
  | 'forEach'
  | 'comment'
  | 'group';

// 标准事件 (条件-动作)
interface StandardEvent extends BaseEvent {
  type: 'standard';
  conditions: Condition[];
  actions: Action[];
  subEvents?: BaseEvent[];
  variables?: Variable[];
}

// While 循环事件
interface WhileEvent extends BaseEvent {
  type: 'while';
  condition: Condition;
  actions: Action[];
  subEvents?: BaseEvent[];
}

// ForEach 遍历循环
interface ForEachEvent extends BaseEvent {
  type: 'forEach';
  collection: Expression;
  itemVariable: string;
  indexVariable?: string;
  actions: Action[];
  subEvents?: BaseEvent[];
}

// 注释事件
interface CommentEvent extends BaseEvent {
  type: 'comment';
  text: string;
}

// 分组事件
interface GroupEvent extends BaseEvent {
  type: 'group';
  title: string;
  subEvents: BaseEvent[];
}
```

### 3.2 条件和动作类型

```typescript
// 条件
interface Condition {
  id: string;
  type: ConditionType;
  parameters: Expression[];
  inverted?: boolean;
  subConditions?: Condition[]; // 用于复合条件 (AND/OR)
}

// 动作
interface Action {
  id: string;
  type: ActionType;
  parameters: Expression[];
}

// 条件类型
type ConditionType =
  | 'comparison'          // 比较: a == b, a > b
  | 'logical'             // 逻辑: AND, OR
  | 'variable'            // 变量: 变量为真
  | 'object'              // 对象: 对象存在
  | 'expression'          // 表达式: 自定义表达式
  | 'timer'               // 计时器: 时间条件
  | string;               // 自定义条件类型

// 动作类型
type ActionType =
  | 'setData'             // 设置数据
  | 'navigate'            // 页面导航
  | 'showToast'           // 显示提示
  | 'showModal'           // 显示模态框
  | 'request'             // 发起请求
  | 'updateComponent'     // 更新组件属性
  | 'hideComponent'       // 隐藏组件
  | 'showComponent'       // 显示组件
  | 'animation'           // 动画
  | 'custom'              // 自定义动作
  | string;               // 其他动作类型
```

### 3.3 表达式类型

```typescript
// 表达式
interface Expression {
  value: string;
  type: ExpressionType;
  metadata?: {
    language?: string; // 'js', 'expression', 'literal'
    returnType?: string; // 返回类型
  };
}

// 表达式类型
type ExpressionType =
  | 'literal'             // 字面量: "hello", 123, true
  | 'variable'            // 变量: data.name, globalVar
  | 'expression'          // 表达式: data.count + 1
  | 'function'            // 函数调用: Math.max(a, b)
  | 'reference'           // 引用: this.data.name
  | 'conditional'         // 条件表达式: condition ? true : false
  | string;               // 其他表达式类型
```

### 3.4 执行上下文

```typescript
// 事件执行上下文
interface EventContext {
  // 数据
  pageData: Record<string, any>;      // 页面数据
  globalData: Record<string, any>;    // 全局数据
  componentData?: Record<string, any>;// 组件数据

  // 变量
  variables: VariableContainer;       // 页面变量
  globalVariables: VariableContainer; // 全局变量
  localVariables: VariableContainer;  // 局部变量 (事件内)

  // 运行时信息
  currentPage: string;                // 当前页面
  currentComponent?: string;          // 当前组件ID
  eventId: string;                    // 事件ID

  // 函数库
  builtInFunctions: Map<string, Function>;
  customFunctions: Map<string, Function>;

  // 工具方法
  getVariable(name: string): any;
  setVariable(name: string, value: any): void;
  getComponentProperty(componentId: string, property: string): any;
  setComponentProperty(componentId: string, property: string, value: any): void;
}

// 编译上下文
interface CompileContext {
  events: BaseEvent[];
  target: 'js' | 'typescript'; // 目标语言
  includeMetadata?: boolean;
  optimizeCode?: boolean;
  strict?: boolean;
}
```

### 3.5 指令元数据

```typescript
// 指令元数据 (预定义的条件和动作)
interface InstructionMetadata {
  id: string;
  name: string;
  type: 'condition' | 'action';
  description?: string;
  category: string;
  parameters: ParameterMetadata[];
  returnType?: string;
  async?: boolean;
  deprecated?: boolean;
}

interface ParameterMetadata {
  name: string;
  type: 'expression' | 'variable' | 'object' | 'layer' | 'string';
  description?: string;
  defaultValue?: any;
  optional?: boolean;
}
```

## 4. 条件和动作库

### 4.1 预定义条件

```
1. 比较条件
   - Equal: a == b
   - NotEqual: a != b
   - Greater: a > b
   - Less: a < b
   - GreaterOrEqual: a >= b
   - LessOrEqual: a <= b

2. 逻辑条件
   - And: 所有子条件都为真
   - Or: 任意子条件为真
   - Not: 反转条件结果

3. 变量条件
   - VariableExists: 变量是否存在
   - VariableIsTrue: 变量为真
   - VariableIsFalse: 变量为假

4. 字符串条件
   - StringContains: 字符串包含子串
   - StringStartsWith: 字符串以指定值开头
   - StringEndsWith: 字符串以指定值结尾
   - StringMatches: 字符串匹配正则

5. 数组条件
   - ArrayContains: 数组包含元素
   - ArrayLength: 数组长度条件

6. 对象条件
   - ObjectHasProperty: 对象具有属性
   - ObjectPropertyValue: 对象属性值条件
```

### 4.2 预定义动作

```
1. 数据动作
   - SetData: 设置页面数据
   - SetVariable: 设置变量
   - IncrementVariable: 增加变量值
   - DecrementVariable: 减少变量值
   - ArrayPush: 数组追加
   - ArrayRemove: 数组删除
   - ObjectSet: 对象设置属性

2. 页面导航
   - NavigateTo: 打开页面
   - NavigateBack: 返回上一页
   - Redirect: 重定向
   - ReLaunch: 重新启动

3. UI 交互
   - ShowToast: 显示提示
   - ShowModal: 显示模态框
   - ShowActionSheet: 显示操作表
   - UpdateComponentProperty: 更新组件属性
   - ShowComponent: 显示组件
   - HideComponent: 隐藏组件

4. 网络操作
   - Request: 发起HTTP请求
   - UploadFile: 上传文件
   - DownloadFile: 下载文件

5. 媒体操作
   - PlaySound: 播放声音
   - PlayVideo: 播放视频
   - ChooseImage: 选择图片

6. 系统操作
   - GetLocation: 获取位置
   - ScanCode: 扫描二维码
   - ShareAppMessage: 分享
```

## 5. 核心流程

### 5.1 事件执行流程

```
1. 加载事件树
   ├─ 验证事件结构
   └─ 构建执行计划

2. 执行事件序列
   ├─ 遍历事件列表
   └─ 对每个事件：
      ├─ 检查是否禁用
      ├─ 执行所有条件 (AND 逻辑)
      ├─ 如果条件满足：
      │  ├─ 执行所有动作
      │  └─ 递归执行子事件
      └─ 处理异常

3. 返回结果
   └─ 返回执行状态
```

### 5.2 事件编译流程

```
1. 解析事件树
   ├─ 验证事件结构
   └─ 收集元数据

2. 生成代码框架
   ├─ 生成函数声明
   ├─ 生成变量初始化
   └─ 生成导入语句

3. 编译事件
   ├─ 对每个事件：
   │  ├─ 编译条件为 if 语句
   │  ├─ 编译动作为函数调用
   │  └─ 递归编译子事件
   └─ 处理特殊事件 (While, ForEach)

4. 优化代码
   ├─ 删除死代码
   ├─ 合并条件
   └─ 内联函数

5. 输出代码
   └─ 生成 JavaScript 代码
```

## 6. 错误处理

### 6.1 异常类型

```typescript
class EventSystemError extends Error {
  code: string;
  details?: any;
}

class EventNotFoundError extends EventSystemError {}
class InvalidEventError extends EventSystemError {}
class ConditionExecutionError extends EventSystemError {}
class ActionExecutionError extends EventSystemError {}
class ExpressionEvaluationError extends EventSystemError {}
class CompilationError extends EventSystemError {}
```

### 6.2 验证规则

- 事件ID 必须唯一
- 条件/动作 的参数类型必须匹配
- 表达式 必须语法正确
- 循环事件 不能无限递归
- 变量 必须先定义才能使用

## 7. 与 01_Core_ProjectStructure 集成

### 7.1 数据关系

```
MiniProgramProject
  └─ Page
      ├─ Component
      │   ├─ ComponentEvent (引用事件)
      │   └─ EventAction[] (动作列表)
      │
      └─ LifecycleEvent (生命周期事件)
      └─ CustomEvent (自定义事件)
```

### 7.2 集成点

- **Page.lifecycleEvents**: StandardEvent[]
- **Page.customEvents**: CustomEvent[] (包含动作列表)
- **Component.events**: ComponentEvent[] (包含动作列表)

## 8. 性能考虑

### 8.1 优化策略

1. **事件编译缓存**: 缓存已编译的事件代码
2. **表达式预处理**: 提前检测变量引用
3. **代码生成优化**: 删除冗余条件检查
4. **事件索引**: 快速查找事件

### 8.2 性能指标

- 事件执行时间: < 10ms (简单事件)
- 编译时间: < 100ms (100个事件)
- 内存占用: < 1MB (1000个事件)

## 9. 扩展性设计

### 9.1 自定义条件和动作

允许注册自定义条件和动作类型：

```typescript
executor.registerCondition('myCondition', {
  name: '自定义条件',
  execute: (context, params) => boolean
});

executor.registerAction('myAction', {
  name: '自定义动作',
  execute: (context, params) => void
});
```

### 9.2 插件系统

支持通过插件扩展事件系统功能

## 10. 测试策略

### 10.1 单元测试覆盖

- EventManager 所有公共方法
- InstructionExecutor 所有执行方法
- EventCompiler 编译功能
- 表达式求值
- 特殊事件类型 (While, ForEach)

### 10.2 测试用例

- 正常流程: 创建、执行、编译事件
- 边界条件: 空事件、深嵌套事件、大量条件
- 异常情况: 无效条件、执行错误、无限循环
- 性能: 大量事件处理

**目标**: 测试覆盖率 > 90%

## 11. 技术选型

- **语言**: TypeScript 4.9+
- **测试**: Vitest
- **验证**: Zod
- **JSON处理**: 原生支持
- **代码生成**: 字符串模板或 AST

## 12. 与 GDevelop 的对应关系

| GDevelop | 本模块 | 说明 |
|----------|--------|------|
| gd::BaseEvent | BaseEvent | 事件基类 |
| gd::StandardEvent | StandardEvent | 标准事件 |
| gd::Instruction | Condition/Action | 条件/动作 |
| gd::InstructionsList | Condition[]/Action[] | 条件/动作列表 |
| gd::EventsCodeGenerator | EventCompiler | 代码生成 |
| gd::Expression | Expression | 表达式 |

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant

