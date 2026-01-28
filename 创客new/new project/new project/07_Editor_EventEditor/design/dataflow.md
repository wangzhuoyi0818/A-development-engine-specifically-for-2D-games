# 事件编辑器 - 数据流设计文档

## 1. 概述

本文档描述事件编辑器模块的数据流设计,包括事件定义、条件、动作的数据流向和状态管理方式。

## 2. 数据模型

### 2.1 事件树数据结构

```typescript
// 事件树的数据结构 (引用自 02_Core_EventSystem)
type EventTree = BaseEvent[]

// BaseEvent 可以包含子事件,形成树形结构
interface StandardEvent extends BaseEvent {
  conditions: Condition[];
  actions: Action[];
  subEvents?: BaseEvent[];
  variables?: Variable[];
}
```

### 2.2 编辑器状态数据

```typescript
interface EditorState {
  // === 核心数据 ===
  events: BaseEvent[];                    // 事件树数据
  selectedEventId: string | null;         // 当前选中的事件ID
  expandedEventIds: Set<string>;          // 展开的事件ID集合

  // === 编辑中的草稿 ===
  editingConditionId: string | null;      // 正在编辑的条件ID
  conditionDraft: Condition | null;       // 条件草稿
  editingActionId: string | null;         // 正在编辑的动作ID
  actionDraft: Action | null;             // 动作草稿
  editingParameterPath: string | null;    // 正在编辑的参数路径
  parameterDraft: Expression | null;      // 参数草稿

  // === 历史记录 (撤销/重做) ===
  history: EditorSnapshot[];              // 历史快照
  historyIndex: number;                   // 当前历史索引

  // === 验证和错误 ===
  validationErrors: Map<string, ValidationError[]>;  // 验证错误 (key: 事件ID/条件ID/动作ID)
  warnings: Map<string, ValidationWarning[]>;        // 警告

  // === UI 状态 ===
  showPreview: boolean;                   // 是否显示预览面板
  selectedTab: 'events' | 'conditions' | 'actions'; // 选中的Tab
  draggedEventId: string | null;          // 正在拖拽的事件ID

  // === 自动补全 ===
  availableVariables: Variable[];         // 可用变量列表
  availableFunctions: BuiltInFunction[];  // 可用函数列表
}

// 历史快照
interface EditorSnapshot {
  events: BaseEvent[];
  timestamp: number;
  description: string; // "添加事件", "删除条件" 等
}
```

## 3. 数据流向图

### 3.1 整体数据流

```
┌──────────────────────────────────────────────────────────────────┐
│                          用户交互层                               │
│   (点击、拖拽、输入)                                              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      事件处理层 (React 组件)                      │
│   EventEditor, EventsTree, ConditionEditor, ActionEditor          │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                     状态管理层 (Zustand/Redux)                    │
│   dispatch actions (addEvent, updateCondition, etc.)              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      业务逻辑层 (核心编辑器)                      │
│   EventEditor, ConditionEditor, ActionEditor classes              │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                      数据验证层 (Validators)                      │
│   验证事件、条件、动作、表达式                                     │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                        数据持久化层                               │
│   保存到 ProjectManager, 生成代码                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 事件编辑流程数据流

```
用户点击"添加事件"
    ↓
创建空白事件对象
{
  id: uuid(),
  type: 'standard',
  conditions: [],
  actions: [],
  disabled: false,
  folded: false
}
    ↓
添加到 events 数组
dispatch(addEvent(newEvent))
    ↓
更新 UI (EventsTree 重新渲染)
    ↓
用户选择新创建的事件
dispatch(selectEvent(newEvent.id))
    ↓
展示条件和动作编辑面板
```

### 3.3 条件编辑流程数据流

```
用户点击"添加条件"
    ↓
创建条件草稿
{
  id: uuid(),
  type: 'comparison',
  parameters: [
    { value: '', type: 'expression' },
    { value: '', type: 'expression' }
  ],
  inverted: false
}
    ↓
设置为编辑状态
dispatch(startEditingCondition(conditionDraft))
    ↓
用户编辑参数 (类型、值)
dispatch(updateConditionParameter(index, newValue))
    ↓
实时验证
validate(conditionDraft)
    ↓
如果有错误,显示错误提示
setValidationErrors(errors)
    ↓
用户点击"保存"
dispatch(saveCondition(conditionDraft))
    ↓
将条件添加到事件的 conditions 数组
event.conditions.push(conditionDraft)
    ↓
清除编辑状态
dispatch(clearConditionDraft())
    ↓
更新 UI
```

### 3.4 参数编辑流程数据流

```
用户点击参数输入框
    ↓
设置编辑状态
dispatch(startEditingParameter(paramPath, currentValue))
    ↓
创建参数草稿
parameterDraft = { ...currentExpression }
    ↓
用户切换参数值来源 (常量/变量/表达式)
dispatch(setParameterValueSource('variable'))
    ↓
根据值来源显示不同的输入组件
- 常量: TextInput / NumberInput
- 变量: VariablePicker (下拉列表)
- 表达式: ExpressionEditor (Monaco)
    ↓
用户输入值
dispatch(updateParameterValue(newValue))
    ↓
实时自动补全
getSuggestions(prefix, context) → suggestions
    ↓
实时验证
validateExpression(parameterDraft.value)
    ↓
用户保存
dispatch(saveParameter(paramPath, parameterDraft))
    ↓
更新条件/动作的参数
condition.parameters[index] = parameterDraft
    ↓
清除编辑状态
dispatch(clearParameterDraft())
```

## 4. 状态管理详细设计

### 4.1 使用 Zustand 的状态管理方案

```typescript
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface EventEditorStore {
  // 状态
  state: EditorState;

  // 动作
  actions: {
    // === 事件操作 ===
    addEvent: (parentId: string | null, event: Partial<BaseEvent>) => void;
    removeEvent: (eventId: string) => void;
    updateEvent: (eventId: string, updates: Partial<BaseEvent>) => void;
    moveEvent: (eventId: string, newParentId: string | null, index: number) => void;
    selectEvent: (eventId: string | null) => void;
    toggleEventExpanded: (eventId: string) => void;

    // === 条件操作 ===
    addCondition: (eventId: string, condition: Partial<Condition>) => void;
    removeCondition: (eventId: string, conditionId: string) => void;
    updateCondition: (eventId: string, conditionId: string, updates: Partial<Condition>) => void;
    startEditingCondition: (eventId: string, conditionId: string) => void;
    saveConditionDraft: () => void;
    cancelConditionEdit: () => void;

    // === 动作操作 ===
    addAction: (eventId: string, action: Partial<Action>) => void;
    removeAction: (eventId: string, actionId: string) => void;
    updateAction: (eventId: string, actionId: string, updates: Partial<Action>) => void;
    startEditingAction: (eventId: string, actionId: string) => void;
    saveActionDraft: () => void;
    cancelActionEdit: () => void;

    // === 参数操作 ===
    startEditingParameter: (path: string, value: Expression) => void;
    updateParameterDraft: (updates: Partial<Expression>) => void;
    saveParameterDraft: () => void;
    cancelParameterEdit: () => void;

    // === 历史操作 ===
    undo: () => void;
    redo: () => void;
    createSnapshot: (description: string) => void;

    // === 验证 ===
    validateEvent: (eventId: string) => void;
    validateCondition: (conditionId: string) => void;
    validateAction: (actionId: string) => void;
    clearValidationErrors: (id: string) => void;
  };
}

const useEventEditorStore = create<EventEditorStore>()(
  immer((set, get) => ({
    state: {
      events: [],
      selectedEventId: null,
      expandedEventIds: new Set(),
      // ... 其他初始状态
    },

    actions: {
      addEvent: (parentId, event) => set((state) => {
        // 使用 immer 不可变更新
        const newEvent: StandardEvent = {
          id: uuid(),
          type: 'standard',
          conditions: [],
          actions: [],
          disabled: false,
          folded: false,
          ...event
        };

        if (parentId === null) {
          state.state.events.push(newEvent);
        } else {
          // 查找父事件并添加为子事件
          const parentEvent = findEvent(state.state.events, parentId);
          if (parentEvent) {
            if (!parentEvent.subEvents) {
              parentEvent.subEvents = [];
            }
            parentEvent.subEvents.push(newEvent);
          }
        }

        // 创建历史快照
        get().actions.createSnapshot('添加事件');
      }),

      removeEvent: (eventId) => set((state) => {
        // 递归删除事件
        state.state.events = removeEventRecursive(state.state.events, eventId);

        // 如果删除的是选中的事件,清除选中状态
        if (state.state.selectedEventId === eventId) {
          state.state.selectedEventId = null;
        }

        get().actions.createSnapshot('删除事件');
      }),

      // ... 其他动作实现
    }
  }))
);
```

### 4.2 不可变更新策略

使用 Immer 中间件进行不可变更新,避免直接修改状态:

```typescript
// ❌ 错误做法: 直接修改
state.events[0].conditions.push(newCondition);

// ✅ 正确做法: 使用 immer
set((state) => {
  const event = findEvent(state.state.events, eventId);
  if (event) {
    event.conditions.push(newCondition);
  }
});
```

## 5. 核心数据操作

### 5.1 事件查找

```typescript
/**
 * 递归查找事件
 */
function findEvent(events: BaseEvent[], eventId: string): BaseEvent | null {
  for (const event of events) {
    if (event.id === eventId) {
      return event;
    }
    if ('subEvents' in event && event.subEvents) {
      const found = findEvent(event.subEvents, eventId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 获取事件路径
 */
function getEventPath(events: BaseEvent[], eventId: string): string[] {
  const path: string[] = [];

  function search(evts: BaseEvent[], parentPath: string[]): boolean {
    for (const evt of evts) {
      const currentPath = [...parentPath, evt.id];
      if (evt.id === eventId) {
        path.push(...currentPath);
        return true;
      }
      if ('subEvents' in evt && evt.subEvents) {
        if (search(evt.subEvents, currentPath)) {
          return true;
        }
      }
    }
    return false;
  }

  search(events, []);
  return path;
}
```

### 5.2 事件移动

```typescript
/**
 * 移动事件到新位置
 */
function moveEvent(
  events: BaseEvent[],
  eventId: string,
  newParentId: string | null,
  index: number
): BaseEvent[] {
  // 1. 找到并移除原事件
  const event = findEvent(events, eventId);
  if (!event) return events;

  const newEvents = removeEventRecursive(events, eventId);

  // 2. 插入到新位置
  if (newParentId === null) {
    // 插入到根级别
    newEvents.splice(index, 0, event);
  } else {
    // 插入到父事件的子事件中
    const parentEvent = findEvent(newEvents, newParentId);
    if (parentEvent && 'subEvents' in parentEvent) {
      if (!parentEvent.subEvents) {
        parentEvent.subEvents = [];
      }
      parentEvent.subEvents.splice(index, 0, event);
    }
  }

  return newEvents;
}

/**
 * 递归删除事件
 */
function removeEventRecursive(events: BaseEvent[], eventId: string): BaseEvent[] {
  return events.filter((event) => {
    if (event.id === eventId) {
      return false; // 删除这个事件
    }
    if ('subEvents' in event && event.subEvents) {
      event.subEvents = removeEventRecursive(event.subEvents, eventId);
    }
    return true;
  });
}
```

### 5.3 条件和动作操作

```typescript
/**
 * 添加条件到事件
 */
function addCondition(events: BaseEvent[], eventId: string, condition: Condition): BaseEvent[] {
  const event = findEvent(events, eventId);
  if (event && 'conditions' in event) {
    event.conditions.push(condition);
  }
  return events;
}

/**
 * 更新条件
 */
function updateCondition(
  events: BaseEvent[],
  eventId: string,
  conditionId: string,
  updates: Partial<Condition>
): BaseEvent[] {
  const event = findEvent(events, eventId);
  if (event && 'conditions' in event) {
    const conditionIndex = event.conditions.findIndex(c => c.id === conditionId);
    if (conditionIndex !== -1) {
      event.conditions[conditionIndex] = {
        ...event.conditions[conditionIndex],
        ...updates
      };
    }
  }
  return events;
}
```

## 6. 验证数据流

### 6.1 验证时机

验证在以下时机触发:
1. 参数输入时 (防抖,延迟验证)
2. 保存条件/动作时 (立即验证)
3. 保存事件时 (整体验证)
4. 手动触发验证 (用户点击验证按钮)

### 6.2 验证流程

```
用户输入参数值
    ↓
触发验证 (防抖 300ms)
    ↓
调用验证器
validateParameter(expression, expectedType)
    ↓
返回验证结果
{
  valid: boolean,
  errors: ValidationError[],
  warnings: ValidationWarning[]
}
    ↓
更新状态
dispatch(setValidationErrors(parameterPath, errors))
    ↓
UI 显示错误提示
```

### 6.3 验证器实现

```typescript
class ParameterValidator {
  /**
   * 验证表达式参数
   */
  validateExpression(expr: Expression, expectedType?: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. 检查表达式是否为空
    if (!expr.value || expr.value.trim() === '') {
      errors.push({
        code: 'EMPTY_EXPRESSION',
        message: '表达式不能为空',
      });
      return { valid: false, errors, warnings };
    }

    // 2. 语法检查
    if (expr.type === 'expression') {
      try {
        // 尝试解析表达式
        parseExpression(expr.value);
      } catch (e) {
        errors.push({
          code: 'SYNTAX_ERROR',
          message: `语法错误: ${e.message}`,
        });
      }
    }

    // 3. 类型检查
    if (expectedType) {
      const actualType = inferExpressionType(expr.value);
      if (actualType !== expectedType && actualType !== 'any') {
        warnings.push({
          code: 'TYPE_MISMATCH',
          message: `类型不匹配: 期望 ${expectedType}, 实际 ${actualType}`,
        });
      }
    }

    // 4. 变量引用检查
    const referencedVariables = extractVariableReferences(expr.value);
    for (const varName of referencedVariables) {
      if (!this.isVariableAvailable(varName)) {
        errors.push({
          code: 'UNDEFINED_VARIABLE',
          message: `变量 "${varName}" 未定义`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

## 7. 自动补全数据流

### 7.1 补全流程

```
用户输入字符
    ↓
触发自动补全 (防抖 150ms)
    ↓
分析当前输入上下文
{
  prefix: 'data.',  // 输入的前缀
  cursorPosition: 5,
  scope: 'expression'
}
    ↓
生成补全建议
getSuggestions(context) → [
  { label: 'name', type: 'variable', detail: 'string' },
  { label: 'count', type: 'variable', detail: 'number' },
  ...
]
    ↓
显示补全菜单
    ↓
用户选择补全项
    ↓
插入补全文本到输入框
```

### 7.2 补全建议生成

```typescript
class AutoCompleteProvider {
  getSuggestions(context: AutoCompleteContext): AutoCompleteSuggestion[] {
    const { prefix, cursorPosition } = context;
    const suggestions: AutoCompleteSuggestion[] = [];

    // 1. 变量补全
    if (prefix.startsWith('data.') || prefix.startsWith('global.')) {
      suggestions.push(...this.getVariableSuggestions(prefix));
    }

    // 2. 函数补全
    if (/\w+\($/.test(prefix)) {
      suggestions.push(...this.getFunctionSuggestions(prefix));
    }

    // 3. 关键字补全
    suggestions.push(...this.getKeywordSuggestions(prefix));

    // 4. 根据相关性排序
    return suggestions.sort((a, b) => b.score - a.score);
  }

  private getVariableSuggestions(prefix: string): AutoCompleteSuggestion[] {
    const parts = prefix.split('.');
    const rootName = parts[0]; // 'data' or 'global'
    const path = parts.slice(1); // ['user', 'name']

    // 从变量容器获取可用变量
    const variables = this.getAvailableVariables(rootName);

    // 过滤和映射为补全建议
    return variables
      .filter(v => v.name.startsWith(path[path.length - 1] || ''))
      .map(v => ({
        label: v.name,
        type: 'variable',
        detail: v.type,
        documentation: v.description,
        score: this.calculateRelevance(v.name, prefix)
      }));
  }

  private calculateRelevance(label: string, prefix: string): number {
    // 计算相关性得分
    if (label === prefix) return 100;
    if (label.startsWith(prefix)) return 80;
    if (label.includes(prefix)) return 50;
    return 0;
  }
}
```

## 8. 历史记录 (撤销/重做)

### 8.1 快照策略

在以下操作后创建快照:
- 添加/删除事件
- 移动事件
- 添加/删除条件
- 添加/删除动作
- 批量修改

### 8.2 快照数据结构

```typescript
interface EditorSnapshot {
  events: BaseEvent[];            // 事件树的深拷贝
  timestamp: number;              // 时间戳
  description: string;            // 操作描述
}

interface HistoryManager {
  snapshots: EditorSnapshot[];    // 快照列表
  currentIndex: number;           // 当前快照索引
  maxSnapshots: number;           // 最大快照数量 (默认 50)
}
```

### 8.3 撤销/重做实现

```typescript
class HistoryManager {
  private snapshots: EditorSnapshot[] = [];
  private currentIndex = -1;
  private maxSnapshots = 50;

  /**
   * 创建快照
   */
  createSnapshot(events: BaseEvent[], description: string): void {
    // 如果当前不在最新位置,删除后面的快照
    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots.splice(this.currentIndex + 1);
    }

    // 添加新快照
    const snapshot: EditorSnapshot = {
      events: JSON.parse(JSON.stringify(events)), // 深拷贝
      timestamp: Date.now(),
      description
    };

    this.snapshots.push(snapshot);
    this.currentIndex = this.snapshots.length - 1;

    // 限制快照数量
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
      this.currentIndex--;
    }
  }

  /**
   * 撤销
   */
  undo(): BaseEvent[] | null {
    if (!this.canUndo()) return null;
    this.currentIndex--;
    return this.getCurrentSnapshot()?.events || null;
  }

  /**
   * 重做
   */
  redo(): BaseEvent[] | null {
    if (!this.canRedo()) return null;
    this.currentIndex++;
    return this.getCurrentSnapshot()?.events || null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.snapshots.length - 1;
  }

  getCurrentSnapshot(): EditorSnapshot | null {
    return this.snapshots[this.currentIndex] || null;
  }
}
```

## 9. 与外部模块的数据交互

### 9.1 与 02_Core_EventSystem 的数据交互

```typescript
// 从核心事件系统导入类型
import {
  BaseEvent,
  StandardEvent,
  Condition,
  Action,
  Expression
} from '@/02_Core_EventSystem/types';

// 使用核心事件系统的验证器
import { EventValidator } from '@/02_Core_EventSystem/validator';

// 编辑完成后,将事件数据传递给事件系统
const validator = new EventValidator();
const result = validator.validate(events);
if (result.valid) {
  eventManager.setEvents(events);
}
```

### 9.2 与 03_Core_VariableSystem 的数据交互

```typescript
// 从变量系统获取可用变量
import { VariablesContainer } from '@/03_Core_VariableSystem';

const variablesContainer = new VariablesContainer('Scene');
const availableVariables = variablesContainer.listVariables();

// 在自动补全中使用
autoCompleteProvider.setAvailableVariables(availableVariables);

// 验证变量引用
const referencedVars = extractVariableReferences(expression);
for (const varName of referencedVars) {
  if (!variablesContainer.has(varName)) {
    errors.push({ code: 'UNDEFINED_VARIABLE', message: `变量 ${varName} 不存在` });
  }
}
```

### 9.3 与 01_Core_ProjectStructure 的数据交互

```typescript
// 从项目结构获取页面信息
import { MiniProgramProject, Page } from '@/01_Core_ProjectStructure/types';

// 编辑器初始化时加载事件数据
function loadEventsFromPage(page: Page): BaseEvent[] {
  return [
    ...page.lifecycleEvents.map(convertToBaseEvent),
    ...page.customEvents.map(convertToBaseEvent)
  ];
}

// 保存事件数据到页面
function saveEventsToPage(page: Page, events: BaseEvent[]): void {
  const lifecycleEvents = events.filter(e => isLifecycleEvent(e));
  const customEvents = events.filter(e => !isLifecycleEvent(e));

  page.lifecycleEvents = lifecycleEvents.map(convertToLifecycleEvent);
  page.customEvents = customEvents.map(convertToCustomEvent);
}
```

## 10. 性能优化的数据流考虑

### 10.1 虚拟滚动数据流

```typescript
interface VirtualScrollState {
  scrollTop: number;              // 滚动位置
  containerHeight: number;        // 容器高度
  itemHeight: number;             // 每项高度
  visibleStartIndex: number;      // 可见起始索引
  visibleEndIndex: number;        // 可见结束索引
  visibleItems: BaseEvent[];      // 可见事件列表
}

// 根据滚动位置计算可见事件
function updateVisibleItems(state: VirtualScrollState, allEvents: BaseEvent[]): void {
  const startIndex = Math.floor(state.scrollTop / state.itemHeight);
  const endIndex = Math.ceil((state.scrollTop + state.containerHeight) / state.itemHeight);

  state.visibleStartIndex = Math.max(0, startIndex - 5); // 预加载前5项
  state.visibleEndIndex = Math.min(allEvents.length, endIndex + 5); // 预加载后5项
  state.visibleItems = allEvents.slice(state.visibleStartIndex, state.visibleEndIndex);
}
```

### 10.2 防抖和节流

```typescript
// 参数输入时的防抖验证
const debouncedValidate = debounce((expr: Expression) => {
  const result = validator.validateExpression(expr);
  dispatch(setValidationErrors(result.errors));
}, 300);

// 自动补全的防抖
const debouncedAutoComplete = debounce((context: AutoCompleteContext) => {
  const suggestions = autoCompleteProvider.getSuggestions(context);
  dispatch(setSuggestions(suggestions));
}, 150);

// 滚动的节流
const throttledScroll = throttle((scrollTop: number) => {
  dispatch(updateVisibleItems(scrollTop));
}, 100);
```

## 11. 总结

事件编辑器的数据流设计遵循以下原则:
1. **单向数据流**: 数据从状态流向UI,用户交互触发状态更新
2. **不可变更新**: 使用 Immer 确保状态更新不可变
3. **分层管理**: 数据流分为用户交互、事件处理、状态管理、业务逻辑、验证、持久化等层次
4. **实时反馈**: 通过防抖验证和自动补全提供实时反馈
5. **历史管理**: 通过快照机制实现撤销/重做
6. **性能优化**: 通过虚拟滚动、防抖节流等技术优化性能

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
