# 模块 02: 事件系统 (Event System)

## 📋 模块概述

**功能**: 可视化编程的核心，条件-动作事件系统，支持从组件事件触发一系列动作。

**来源**: GDevelop Core 中的 `gd::BaseEvent`, `gd::StandardEvent`, `gd::Instruction`

**迁移优先级**: 🔴 **高** - 核心功能，决定可视化编程的能力

**预估工作量**: 3-4 周

**复用度**: 60% (事件框架可复用，需要适配微信小程序事件)

---

## 🎯 核心功能

### 1. 事件类型
- **生命周期事件**: onLoad, onShow, onReady, onHide, onUnload
- **交互事件**: bindtap, bindinput, bindchange, bindsubmit
- **延时事件**: setTimeout, setInterval
- **自定义事件**: 开发者定义

### 2. 条件 (Conditions)
- 数据比较 (===, !==, >, <, etc.)
- 字符串匹配
- 逻辑运算 (AND, OR, NOT)
- 条件组

### 3. 动作 (Actions)
- 设置变量 (setData)
- 调用微信 API (wx.request, wx.showToast)
- 页面跳转 (navigateTo, redirectTo)
- 延时执行

### 4. 事件链
- 多条件判断
- 动作序列执行
- 条件分支

---

## 📂 GDevelop 源码位置

```
Core/GDCore/Events/
├── BaseEvent.h                  # 事件基类
├── StandardEvent.h              # 标准事件 (条件+动作)
├── Builtin/
│   ├── LinkEvent.h
│   ├── CommentEvent.h
│   ├── ForEachEvent.h
│   ├── ForEachEventJS.h
│   └── StandardEventJS.h
└── Instruction.h                # 指令 (条件或动作)

GDJS/GDJS/Events/
└── CodeGeneration/
    ├── CodeGenerator.h          # 代码生成器
    ├── CodeGenerator.cpp
    ├── EventCodeGenerator.h
    └── ...

newIDE/app/src/EventsSheet/      # 编辑器 UI
├── index.js
├── EventsTree.js
├── InstructionsList.js
└── ParameterFields/
```

---

## 🔧 核心接口定义

```typescript
// types.ts

// 事件基类
export interface BaseEvent {
  id: string;
  type: string;
}

// 标准事件 (条件 + 动作)
export interface StandardEvent extends BaseEvent {
  type: 'standard';

  // 事件触发条件
  trigger: EventTrigger;

  // 条件列表
  conditions: Condition[];

  // 动作列表
  actions: Action[];

  // 子事件
  subEvents: BaseEvent[];
}

// 事件触发器
export interface EventTrigger {
  type: 'lifecycle' | 'interaction' | 'timer' | 'custom';

  // 对于 interaction: 'bindtap', 'bindinput', etc.
  // 对于 lifecycle: 'onLoad', 'onShow', etc.
  // 对于 timer: 'timeout' or 'interval'
  eventType: string;

  // 触发对象 (组件 ID 或 page)
  targetId?: string;
}

// 条件
export interface Condition {
  id: string;
  type: string; // 'comparison', 'string', 'logic', etc.

  // 比较操作
  operator?: '===' | '!==' | '>' | '<' | '>=' | '<=';

  // 左值 (变量引用或常量)
  leftValue: ValueExpression;

  // 右值
  rightValue: ValueExpression;

  // 逻辑运算 (AND/OR)
  logicGate?: 'AND' | 'OR';

  // 是否反转 (NOT)
  inverted?: boolean;
}

// 值表达式
export interface ValueExpression {
  type: 'variable' | 'constant' | 'expression';

  // 对于 variable
  variableName?: string;
  variableScope?: 'global' | 'page' | 'component';

  // 对于 constant
  value?: any;

  // 对于 expression
  expression?: string; // JS 表达式
}

// 动作
export interface Action {
  id: string;
  type: string; // 'setData', 'wx.request', 'navigateTo', etc.

  // 参数
  params: Record<string, any>;
}

// 完整的事件定义 (生命周期)
export interface LifecycleEvent extends StandardEvent {
  lifecycleType: 'onLoad' | 'onShow' | 'onReady' | 'onHide' | 'onUnload';
}

// 完整的事件定义 (交互)
export interface InteractionEvent extends StandardEvent {
  componentId: string;
  eventType: string; // 'bindtap', 'bindinput', etc.
}
```

---

## 🔄 从 GDevelop 到微信小程序的映射

| GDevelop 概念 | 微信小程序概念 | 说明 |
|--------------|--------------|------|
| `gd::BaseEvent` | `BaseEvent` | 事件基类 |
| `gd::StandardEvent` | `StandardEvent` | 标准事件 (条件+动作) |
| `gd::Instruction` | `Condition` / `Action` | 指令 (条件或动作) |
| 游戏事件 | 小程序事件 | 不同的触发时机 |
| 碰撞事件 | (无) | 微信小程序中无需 |
| 键盘事件 | bindinput, bindconfirm | 输入框事件 |

---

## 📖 迁移指南

### 步骤 1: 理解 GDevelop 的 Event 类

```cpp
// 参考: Core/GDCore/Events/StandardEvent.h

class GD_CORE_API StandardEvent : public BaseEvent {
public:
  // 条件列表
  const std::vector<gd::Instruction>& GetConditions() const;
  void AddCondition(const gd::Instruction& condition);

  // 动作列表
  const std::vector<gd::Instruction>& GetActions() const;
  void AddAction(const gd::Instruction& action);

  // 子事件
  const std::vector<std::unique_ptr<gd::BaseEvent>>& GetSubEvents() const;
};

// 参考: Core/GDCore/Events/Instruction.h

class GD_CORE_API Instruction {
public:
  // 获取指令类型 (条件/动作的名称)
  const gd::String& GetType() const;

  // 获取参数
  const std::vector<gd::Expression>& GetParameters() const;
};
```

### 步骤 2: 实现微信事件管理器

```typescript
// implementation/event-manager.ts

export class EventManager {
  private events: Map<string, StandardEvent> = new Map();

  // 添加生命周期事件
  addLifecycleEvent(
    pageId: string,
    lifecycleType: 'onLoad' | 'onShow' | 'onReady',
    actions: Action[]
  ): LifecycleEvent {
    const event: LifecycleEvent = {
      id: generateId(),
      type: 'standard',
      trigger: {
        type: 'lifecycle',
        eventType: lifecycleType
      },
      conditions: [],
      actions,
      subEvents: [],
      lifecycleType
    };

    this.events.set(event.id, event);
    return event;
  }

  // 添加交互事件 (如点击按钮)
  addInteractionEvent(
    componentId: string,
    eventType: 'bindtap' | 'bindinput' | string,
    conditions: Condition[] = [],
    actions: Action[] = []
  ): InteractionEvent {
    const event: InteractionEvent = {
      id: generateId(),
      type: 'standard',
      trigger: {
        type: 'interaction',
        eventType,
        targetId: componentId
      },
      conditions,
      actions,
      subEvents: [],
      componentId,
      eventType
    };

    this.events.set(event.id, event);
    return event;
  }

  // 添加条件
  addCondition(
    eventId: string,
    condition: Condition
  ): void {
    const event = this.events.get(eventId);
    if (event) {
      event.conditions.push(condition);
    }
  }

  // 添加动作
  addAction(eventId: string, action: Action): void {
    const event = this.events.get(eventId);
    if (event) {
      event.actions.push(action);
    }
  }

  // 获取事件
  getEvent(eventId: string): StandardEvent | undefined {
    return this.events.get(eventId);
  }

  // 删除事件
  removeEvent(eventId: string): void {
    this.events.delete(eventId);
  }
}
```

### 步骤 3: 事件验证

```typescript
// implementation/event-validator.ts

export class EventValidator {
  // 验证条件是否有效
  validateCondition(condition: Condition): ValidationResult {
    if (!condition.leftValue) {
      return {
        valid: false,
        errors: ['Left value is required']
      };
    }

    if (condition.leftValue.type === 'variable' && !condition.leftValue.variableName) {
      return {
        valid: false,
        errors: ['Variable name is required']
      };
    }

    if (!condition.operator) {
      return {
        valid: false,
        errors: ['Operator is required']
      };
    }

    return { valid: true };
  }

  // 验证动作是否有效
  validateAction(action: Action): ValidationResult {
    if (!action.type) {
      return {
        valid: false,
        errors: ['Action type is required']
      };
    }

    // 根据动作类型验证参数
    switch (action.type) {
      case 'wx.request':
        if (!action.params.url) {
          return {
            valid: false,
            errors: ['URL is required for wx.request']
          };
        }
        break;

      case 'wx.showToast':
        if (!action.params.title) {
          return {
            valid: false,
            errors: ['Title is required for wx.showToast']
          };
        }
        break;

      case 'navigateTo':
        if (!action.params.url) {
          return {
            valid: false,
            errors: ['URL is required for navigateTo']
          };
        }
        break;
    }

    return { valid: true };
  }

  // 验证整个事件
  validateEvent(event: StandardEvent): ValidationResult {
    const errors: string[] = [];

    // 验证所有条件
    for (const condition of event.conditions) {
      const result = this.validateCondition(condition);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    // 验证所有动作
    for (const action of event.actions) {
      const result = this.validateAction(action);
      if (!result.valid) {
        errors.push(...result.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
```

---

## 🔍 关键设计决策

### 1. 简化事件系统
**为什么不完全复制 GDevelop？**
- 游戏事件类型 (碰撞、键盘等) 不适用
- 微信小程序的事件模型更简单
- 不需要复杂的事件分组和继承

### 2. 条件-动作模式保留
**为什么保留这个设计？**
- 这是无代码编程的核心
- 直观易懂
- 可组合性强
- GDevelop 已验证这个模式有效

### 3. 变量引用机制
**数据流设计**:
```
页面数据 (Page.data)
    ↓
  条件求值 (Condition evaluation)
    ↓
  动作执行 (Action execution)
    ↓
  数据更新 (setData)
```

---

## 📊 支持的事件类型

| 事件分类 | 事件类型 | 触发时机 | 用途 |
|--------|--------|--------|------|
| 生命周期 | onLoad | 页面加载时 | 初始化数据 |
| 生命周期 | onShow | 页面显示时 | 刷新数据 |
| 生命周期 | onReady | 页面渲染完成时 | 操作 DOM |
| 交互 | bindtap | 用户点击 | 按钮点击 |
| 交互 | bindinput | 用户输入 | 表单输入 |
| 交互 | bindchange | 值改变时 | 选择器改变 |
| 交互 | bindsubmit | 表单提交 | 表单提交 |
| 延时 | setTimeout | 延时后 | 延时操作 |
| 延时 | setInterval | 定时触发 | 定时刷新 |
| 自定义 | custom | 手动触发 | 自定义逻辑 |

---

## ⚠️ 与 GDevelop 的差异

### 不能完全复用
- ❌ 碰撞检测事件
- ❌ 键盘事件 (微信小程序用 bindinput 代替)
- ❌ 鼠标事件 (微信小程序用 bindtap 代替)
- ❌ 游戏时间刻度 (tick)

### 需要新增
- ✅ 微信小程序的标准事件
- ✅ 微信 API 调用
- ✅ 页面导航事件
- ✅ 支付事件

---

## 📦 依赖关系

**依赖模块**:
- 01_Core_ProjectStructure (项目结构)
- 03_Core_VariableSystem (变量系统)

**被依赖模块**:
- 07_Editor_EventEditor (事件编辑器)
- 11_CodeGenerator_JSGenerator (JS 代码生成)

---

## 🚀 下一步

1. 完成 `EventManager` 的完整实现
2. 实现 `EventValidator` 验证逻辑
3. 实现事件序列化/反序列化
4. 编写完整的单元测试
5. 与代码生成器集成

---

最后更新: 2026-01-23
