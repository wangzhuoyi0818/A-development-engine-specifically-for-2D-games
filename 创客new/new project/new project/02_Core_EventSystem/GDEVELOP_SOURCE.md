# GDevelop 源代码参考 - 02_Core_EventSystem

## 📁 已复制的参考文件 (7 个)

### C++ Core 文件

**路径**: `reference/core/`

| 文件名 | 作用 | 关键类 |
|-------|------|--------|
| `Event.h` | 事件基类 | `gd::BaseEvent` |
| `Event.cpp` | 事件基类实现 | 事件序列化、克隆 |
| `Instruction.h` | 指令类 (条件/动作) | `gd::Instruction` |
| `Instruction.cpp` | 指令实现 | 参数处理 |
| `StandardEvent.h` | 标准事件 | `gd::StandardEvent` |
| `StandardEvent.cpp` | 标准事件实现 | 条件列表、动作列表 |

### IDE 代码

**路径**: `reference/ide/`

| 文件名 | 作用 |
|-------|------|
| `index.js` | 事件表 React 组件 |

---

## 🔍 核心代码解析

### 1. BaseEvent - 事件基类

```cpp
class GD_CORE_API BaseEvent {
public:
  // 事件类型
  virtual const gd::String& GetType() const = 0;

  // 执行条件
  virtual bool CanHaveSubEvents() const { return true; }

  // 子事件
  virtual const std::vector<std::unique_ptr<gd::BaseEvent>>& GetSubEvents() const;

  // 序列化
  virtual void SerializeTo(SerializerElement& element) const;
  virtual void UnserializeFrom(const SerializerElement& element);
};
```

**对应微信小程序**: `BaseEvent` 接口

### 2. StandardEvent - 标准事件 (条件+动作)

```cpp
class GD_CORE_API StandardEvent : public BaseEvent {
public:
  // 条件列表
  const std::vector<gd::Instruction>& GetConditions() const;
  std::vector<gd::Instruction>& GetConditions();

  // 动作列表
  const std::vector<gd::Instruction>& GetActions() const;
  std::vector<gd::Instruction>& GetActions();

  // 子事件
  const std::vector<std::unique_ptr<gd::BaseEvent>>& GetSubEvents() const;
};
```

**对应微信小程序**: `StandardEvent` 接口

### 3. Instruction - 指令 (条件或动作)

```cpp
class GD_CORE_API Instruction {
public:
  // 指令类型 (如 "MouseButtonPressed", "CreateObject" 等)
  const gd::String& GetType() const;
  void SetType(const gd::String& type);

  // 参数列表
  const std::vector<gd::Expression>& GetParameters() const;
  void SetParameter(std::size_t index, const gd::Expression& value);

  // 是否反转 (用于条件)
  bool IsInverted() const;
  void SetInverted(bool inverted);
};
```

**对应微信小程序**: `Action` 或 `Condition` 接口

---

## 🔄 映射关系

### GDevelop 事件类型 → 微信小程序事件

| GDevelop | 微信小程序 | 说明 |
|---------|-----------|------|
| `StandardEvent` | `StandardEvent` | 条件+动作 |
| `ForEachEvent` | `ListRenderingEvent` | 列表渲染 (wx:for) |
| `LinkEvent` | (移除) | 不需要 |
| `CommentEvent` | `CommentEvent` | 注释 |
| 游戏时间刻度 | (移除) | 微信小程序无 |
| 碰撞检测 | (移除) | 微信小程序无 |

### GDevelop 指令 → 微信小程序动作

| GDevelop 指令 | 微信动作 | 说明 |
|-------------|---------|------|
| `CreateObject` | (无直接对应) | 动态创建组件 |
| `SetVariable` | `setData` | 设置变量 |
| `MouseButtonPressed` | `bindtap` | 点击事件 |
| `KeyPressed` | `bindinput` | 输入事件 |

---

## 📖 开发指南

### TypeScript 类型定义示例

```typescript
// 参考 Event.h
export interface BaseEvent {
  id: string;
  type: string;
}

// 参考 StandardEvent.h
export interface StandardEvent extends BaseEvent {
  type: 'standard';
  conditions: Condition[];
  actions: Action[];
  subEvents: BaseEvent[];
}

// 参考 Instruction.h
export interface Instruction {
  type: string;        // 指令类型
  parameters: any[];   // 参数列表
  inverted?: boolean;  // 是否反转 (条件用)
}

export interface Condition extends Instruction {
  operator?: '===' | '!==' | '>' | '<';
  logicGate?: 'AND' | 'OR';
}

export interface Action extends Instruction {
  // 动作特有属性
}
```

### 实现示例

```typescript
// 参考 StandardEvent.cpp
export class EventManager {
  private events = new Map<string, StandardEvent>();

  createEvent(type: 'lifecycle' | 'interaction'): StandardEvent {
    return {
      id: generateId(),
      type: 'standard',
      conditions: [],
      actions: [],
      subEvents: []
    };
  }

  addCondition(eventId: string, condition: Condition): void {
    const event = this.events.get(eventId);
    if (event) {
      event.conditions.push(condition);
    }
  }

  addAction(eventId: string, action: Action): void {
    const event = this.events.get(eventId);
    if (event) {
      event.actions.push(action);
    }
  }
}
```

---

## ⚠️ 重要差异

### GDevelop 的游戏事件 (不需要)
- ❌ 碰撞检测事件
- ❌ 鼠标光标移动事件
- ❌ 游戏循环 tick 事件
- ❌ 物理引擎事件

### 微信小程序新增事件
- ✅ 生命周期: onLoad, onShow, onReady
- ✅ 表单事件: bindinput, bindchange, bindsubmit
- ✅ 触摸事件: bindtouchstart, bindtouchmove, bindtouchend
- ✅ 滚动事件: bindscroll

---

## 📚 参考资料

### GDevelop 文档
- Event API: https://docs.gdevelop.io/GDCore%20Documentation/classgd_1_1_base_event.html
- Instruction API: https://docs.gdevelop.io/GDCore%20Documentation/classgd_1_1_instruction.html

### 微信小程序文档
- 事件系统: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html
- 页面生命周期: https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/page-life-cycle.html

---

## 💡 实现建议

1. **保留条件-动作结构** - 这是可视化编程的核心
2. **简化事件类型** - 只实现微信需要的事件
3. **清晰的参数定义** - 每个动作的参数要类型化
4. **支持事件链** - 支持 if-then-else 逻辑

---

最后更新: 2026-01-23
