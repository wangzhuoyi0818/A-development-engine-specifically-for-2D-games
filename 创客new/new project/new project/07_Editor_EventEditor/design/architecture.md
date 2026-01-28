# 事件编辑器 - UI 架构设计文档

## 1. 模块概述

### 1.1 功能定位
事件编辑器是微信小程序可视化开发平台的核心编辑功能模块,提供可视化的事件-条件-动作编程界面。允许开发者通过拖拽、点击等交互方式直观地定义页面和组件的行为逻辑,包括条件判断、数据处理、页面导航等。

### 1.2 设计目标
- **易用性**: 通过可视化界面隐藏复杂的代码逻辑
- **灵活性**: 支持复杂的条件组合和嵌套事件
- **可扩展**: 易于添加新的条件类型和动作类型
- **实时反馈**: 提供表达式预览、参数验证等实时反馈
- **高效编辑**: 支持拖拽排序、快速添加、批量操作等

## 2. 整体架构

### 2.1 组件层次结构

```
EventEditor (主编辑器)
├── EventsTree (事件树视图)
│   ├── EventItem (事件项)
│   │   ├── EventHeader (事件头)
│   │   └── EventContent (事件内容)
│   └── DragHandle (拖拽手柄)
│
├── ConditionEditor (条件编辑面板)
│   ├── ConditionTypeSelector (条件类型选择)
│   ├── ParameterEditor (参数编辑)
│   │   └── AutoComplete (自动补全)
│   └── ConditionCombiner (条件组合器)
│
├── ActionEditor (动作编辑面板)
│   ├── ActionTypeSelector (动作类型选择)
│   ├── ParameterEditor (参数编辑)
│   │   ├── TextInput (文本输入)
│   │   ├── NumberInput (数字输入)
│   │   ├── Select (选择框)
│   │   └── VariablePicker (变量选择器)
│   └── ValueSourceToggle (参数值来源切换)
│
├── PreviewPanel (预览面板)
│   ├── ExpressionPreview (表达式预览)
│   └── ErrorDisplay (错误显示)
│
└── Toolbar (工具栏)
    ├── AddEventButton (添加事件)
    ├── DeleteButton (删除事件)
    └── UndoRedoButtons (撤销/重做)
```

### 2.2 数据流向

```
用户交互
    ↓
EventEditor 组件
    ↓
状态管理 (Redux/Zustand)
    ↓
Event/Condition/Action 编辑器
    ↓
参数编辑器和表达式编辑器
    ↓
验证和错误处理
    ↓
UI 更新和预览
```

## 3. 核心组件设计

### 3.1 EventEditor (主编辑器)

**职责**:
- 管理事件编辑器的整体状态
- 处理事件的增删改查和拖拽排序
- 调用子组件进行条件和动作编辑
- 提供撤销/重做功能

**关键方法**:
```typescript
interface EventEditor {
  // 事件管理
  addEvent(parentId: string | null, event: Partial<BaseEvent>): void;
  removeEvent(eventId: string): void;
  moveEvent(eventId: string, newParentId: string | null, index: number): void;
  updateEvent(eventId: string, updates: Partial<BaseEvent>): void;

  // 编辑状态
  selectEvent(eventId: string): void;
  deselectEvent(): void;
  getSelectedEvent(): BaseEvent | null;

  // 撤销/重做
  undo(): void;
  redo(): void;
}
```

### 3.2 EventsTree (事件树视图)

**职责**:
- 以树形结构展示事件列表
- 支持展开/折叠事件
- 实现拖拽排序
- 处理事件的选择和编辑

**特点**:
- 虚拟滚动 (Virtual Scrolling) - 支持大量事件
- 拖拽排序 - 可视化的事件重新排序
- 快速操作菜单 - 右键菜单支持删除、复制、粘贴等
- 事件类型图标 - 直观的视觉识别

### 3.3 ConditionEditor (条件编辑器)

**职责**:
- 编辑条件的类型和参数
- 支持条件反转 (invert)
- 支持复合条件 (AND/OR)
- 实时验证条件表达式

**支持的条件类型**:
- 比较条件 (==, !=, >, <, >=, <=)
- 逻辑条件 (AND, OR, NOT)
- 变量条件 (变量为真/假)
- 字符串条件 (包含、匹配等)
- 数组条件 (长度、包含元素)
- 表达式条件 (自定义 JavaScript 表达式)

**关键特性**:
```typescript
interface ConditionEditorProps {
  condition: Condition;
  onChange: (condition: Condition) => void;
  variables: Variable[];
  availableConditionTypes: ConditionType[];
  onValidationError?: (error: ValidationError) => void;
}
```

### 3.4 ActionEditor (动作编辑器)

**职责**:
- 编辑动作的类型和参数
- 支持参数值来源切换 (常量/变量/表达式)
- 异步动作标记
- 实时参数验证

**支持的动作类型**:
- 数据操作 (setData, setVariable 等)
- 页面导航 (navigateTo, navigateBack 等)
- UI 交互 (showToast, showModal 等)
- 网络操作 (request, uploadFile 等)
- 媒体操作 (playSound, playVideo 等)
- 系统操作 (getLocation, scanCode 等)

### 3.5 ParameterEditor (参数编辑器)

**职责**:
- 提供多种参数输入方式
- 支持参数值来源选择
- 实现参数验证和自动补全

**参数输入类型**:
- 文本输入 (TextInput)
- 数字输入 (NumberInput)
- 选择框 (Select)
- 变量选择器 (VariablePicker)
- 表达式编辑器 (ExpressionEditor)
- 颜色选择 (ColorPicker)
- 日期选择 (DatePicker)

### 3.6 AutoComplete (自动补全)

**职责**:
- 实现参数值的自动补全
- 支持变量、函数、关键字的补全
- 显示补全建议和文档

**支持的补全源**:
- 变量列表
- 内置函数 (Math, String 等)
- 自定义函数
- 预定义常量
- 关键字

## 4. 状态管理设计

### 4.1 编辑器全局状态

```typescript
interface EditorState {
  // 事件树
  events: BaseEvent[];
  selectedEventId: string | null;
  expandedEventIds: Set<string>;

  // 条件编辑
  editingConditionId: string | null;
  conditionDraft: Condition | null;

  // 动作编辑
  editingActionId: string | null;
  actionDraft: Action | null;

  // 参数编辑
  editingParameterPath: string | null;
  parameterDraft: Expression | null;

  // 历史记录
  history: EditorSnapshot[];
  historyIndex: number;

  // 验证和错误
  validationErrors: ValidationError[];
  warnings: ValidationWarning[];

  // UI 状态
  showPreview: boolean;
  selectedTab: 'events' | 'conditions' | 'actions';
}
```

### 4.2 状态转换

```
初始状态: 空编辑器
    ↓
选择事件: selectedEventId 设置, 展示对应的条件和动作
    ↓
编辑条件: conditionDraft 创建, 参数编辑中
    ↓
保存条件: 验证后合并到事件, 清除 draft
    ↓
编辑动作: actionDraft 创建, 参数编辑中
    ↓
保存动作: 验证后合并到事件, 清除 draft
    ↓
...重复...
    ↓
保存事件: 整体验证, 提交到父组件
```

## 5. 交互设计

### 5.1 事件树交互

**添加事件**:
1. 点击"添加事件"按钮
2. 选择事件类型 (标准事件、While、ForEach 等)
3. 配置基本属性
4. 保存到树中

**编辑事件**:
1. 在树中选择事件
2. 面板中展示条件和动作
3. 编辑条件/动作
4. 实时预览
5. 保存更改

**删除事件**:
1. 在树中右键选择事件
2. 点击"删除"
3. 确认删除 (包括子事件)
4. 更新树视图

**拖拽排序**:
1. 按住事件项的拖拽手柄
2. 拖动到新位置
3. 释放鼠标
4. 更新事件顺序和层级

### 5.2 条件编辑交互

**添加条件**:
1. 在条件面板点击"添加条件"
2. 选择条件类型
3. 自动填充参数输入框
4. 输入参数值
5. 保存条件

**条件组合**:
1. 在条件列表中点击"添加逻辑条件"
2. 选择 AND/OR 操作符
3. 选择要组合的条件
4. 预览组合结果

**参数编辑**:
1. 点击参数输入框
2. 选择值来源 (常量/变量/表达式)
3. 输入相应的值
4. 自动补全提示
5. 实时验证

### 5.3 动作编辑交互

类似于条件编辑的交互模式,但额外支持:
- 异步标记
- 等待完成选项
- 条件执行 (某些动作可以设置执行条件)

## 6. 表达式编辑和预览

### 6.1 表达式编辑模式

三种参数值来源:

1. **常量**: 直接输入字面量
   - 文本: "hello"
   - 数字: 123
   - 布尔值: true/false

2. **变量**: 从变量列表选择
   - 页面变量: data.name
   - 全局变量: globalData.count
   - 局部变量: localVar

3. **表达式**: 编写 JavaScript 表达式
   - 算术: data.count + 1
   - 字符串: data.name + '123'
   - 函数调用: Math.max(a, b)
   - 条件: status === 'active' ? 1 : 0

### 6.2 实时预览

在编辑表达式时:
1. 自动计算表达式的可能值
2. 显示类型推断结果
3. 检测语法错误
4. 显示使用的变量列表

### 6.3 自动补全

```typescript
interface AutoCompleteContext {
  // 当前输入的部分文本
  prefix: string;

  // 光标位置
  cursorPosition: number;

  // 可用的变量
  variables: Variable[];

  // 可用的函数
  builtInFunctions: BuiltInFunction[];

  // 已定义的自定义函数
  customFunctions: CustomFunction[];

  // 推荐的补全项
  suggestions: AutoCompleteSuggestion[];
}
```

## 7. 验证和错误处理

### 7.1 验证规则

**事件验证**:
- 事件 ID 必须唯一
- 至少有一个条件或动作
- 标准事件必须有条件
- While 事件必须有循环条件

**条件验证**:
- 条件类型必须有效
- 参数数量和类型必须匹配
- 表达式必须语法正确

**动作验证**:
- 动作类型必须有效
- 参数数量和类型必须匹配
- 必要参数不能为空
- 动作参数引用的变量必须存在

**参数验证**:
- 参数类型检查
- 参数值范围检查
- 表达式语法检查

### 7.2 错误显示

```typescript
interface ValidationError {
  code: string;      // 'INVALID_EVENT_ID' | 'INVALID_CONDITION' | ...
  message: string;   // 用户友好的错误消息
  path?: string;     // 错误位置: "events[0].conditions[1].parameters[0]"
  suggestions?: string[]; // 修复建议
}
```

错误在以下位置显示:
1. 参数输入框下方 (红色提示)
2. 事件项右侧 (错误图标 + 工具提示)
3. 预览面板 (错误列表)
4. 全局错误面板 (关键错误)

## 8. 性能优化

### 8.1 优化策略

1. **虚拟滚动** - 大量事件时只渲染可见项
2. **记忆化** - 使用 React.memo 避免不必要的重渲染
3. **防抖** - 表达式输入时延迟验证
4. **异步验证** - 复杂的验证在后台进行
5. **增量更新** - 只更新改变的部分

### 8.2 性能指标

- 渲染时间: < 100ms (1000 个事件)
- 表达式验证: < 50ms
- 参数补全: < 30ms
- 内存占用: < 50MB

## 9. 与其他模块的集成

### 9.1 与 02_Core_EventSystem 的集成

- 使用 BaseEvent、Condition、Action 等类型
- 使用 ValidationResult 进行验证
- 提供编辑的事件数据给事件系统

### 9.2 与 03_Core_VariableSystem 的集成

- 从变量系统获取可用的变量列表
- 支持路径访问 (如 data.user.name)
- 变量变更时更新编辑器的自动补全

### 9.3 与 01_Core_ProjectStructure 的集成

- 获取当前编辑的页面/组件信息
- 提供编辑的事件给项目结构保存

## 10. 可扩展性设计

### 10.1 添加新的条件类型

```typescript
// 注册新的条件类型
editor.registerConditionType({
  type: 'custom',
  label: '自定义条件',
  description: '...',
  icon: 'icon-custom',
  parameters: [
    { name: 'param1', type: 'expression', label: '参数1' },
    { name: 'param2', type: 'variable', label: '参数2' }
  ],
  validate: (condition) => {...}
});
```

### 10.2 添加新的动作类型

```typescript
// 注册新的动作类型
editor.registerActionType({
  type: 'customAction',
  label: '自定义动作',
  description: '...',
  icon: 'icon-custom-action',
  parameters: [...],
  validate: (action) => {...}
});
```

### 10.3 自定义参数编辑器

```typescript
// 注册自定义参数编辑器
editor.registerParameterEditor({
  type: 'customType',
  component: CustomParameterEditor,
  validate: (value) => {...}
});
```

## 11. 技术选型

- **前端框架**: React 18+
- **状态管理**: Zustand (轻量级) 或 Redux
- **UI 组件库**: Ant Design / Material-UI
- **编辑器**: Monaco Editor (表达式编辑) 或 Ace Editor
- **测试**: Vitest + React Testing Library
- **类型检查**: TypeScript 4.9+
- **样式**: CSS Modules / Tailwind CSS

## 12. 核心文件结构

```
implementation/
├── types.ts                           # 类型定义
├── event-editor.ts                    # 事件编辑器核心
├── condition-editor.ts                # 条件编辑器
├── action-editor.ts                   # 动作编辑器
├── parameter-fields.ts                # 参数字段组件
├── event-store.ts                     # 状态管理 (Zustand)
├── expression-parser.ts               # 表达式解析和验证
├── components/
│   ├── EventEditor.tsx                # 主编辑器组件
│   ├── EventsTree.tsx                 # 事件树组件
│   ├── EventItem.tsx                  # 事件项组件
│   ├── ConditionEditor.tsx            # 条件编辑面板
│   ├── ActionEditor.tsx               # 动作编辑面板
│   ├── ParameterEditor.tsx            # 参数编辑器
│   ├── AutoComplete.tsx               # 自动补全组件
│   └── PreviewPanel.tsx               # 预览面板
├── hooks/
│   ├── useEventEditor.ts              # 事件编辑器 hook
│   ├── useValidation.ts               # 验证 hook
│   └── useAutoComplete.ts             # 自动补全 hook
├── utils/
│   ├── expression-evaluator.ts        # 表达式求值
│   ├── suggestion-generator.ts        # 补全建议生成
│   └── event-utils.ts                 # 事件工具函数
└── tests/
    ├── event-editor.test.ts
    ├── condition-editor.test.ts
    ├── action-editor.test.ts
    ├── parameter-fields.test.ts
    └── components/
        └── EventEditor.test.tsx
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
