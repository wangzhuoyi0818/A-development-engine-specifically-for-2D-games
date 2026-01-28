# 事件系统模块 - 数据流设计文档

## 1. 核心数据流

### 1.1 事件创建和管理流程

```
用户在编辑器中创建事件
        │
        ↓
┌─────────────────────┐
│ 验证事件参数         │
│ - ID唯一性          │
│ - 类型有效性        │
│ - 参数完整性        │
└─────────────────────┘
        │
        ↓
┌─────────────────────┐
│ EventManager        │
│ addEvent()          │
│ - 在事件树中定位     │
│ - 添加到父事件      │
│ - 更新索引          │
└─────────────────────┘
        │
        ↓
┌─────────────────────┐
│ 返回事件对象         │
│ 更新UI              │
└─────────────────────┘
```

### 1.2 条件执行流程

```
触发事件 (如用户点击按钮)
        │
        ↓
┌──────────────────────┐
│ 查找关联的事件        │
│ EventManager         │
│ findEvent(eventId)   │
└──────────────────────┘
        │
        ↓
┌──────────────────────┐
│ 构建执行上下文        │
│ EventContext         │
│ - 页面数据           │
│ - 变量值             │
│ - 当前组件信息       │
└──────────────────────┘
        │
        ↓
┌──────────────────────┐
│ 执行所有条件 (AND)    │
│ InstructionExecutor  │
│ executeCondition()   │
│ 对每个条件：         │
│ ├─ 解析参数表达式    │
│ ├─ 求值表达式值      │
│ ├─ 比较条件结果      │
│ └─ 处理反转标志      │
└──────────────────────┘
        │
        ├─ 条件为假
        │   └─> 事件不执行,返回
        │
        └─ 条件为真
            │
            ↓
┌──────────────────────┐
│ 执行所有动作 (顺序)   │
│ InstructionExecutor  │
│ executeAction()      │
│ 对每个动作：         │
│ ├─ 解析参数表达式    │
│ ├─ 获取动作处理器    │
│ ├─ 执行动作         │
│ └─ 处理返回结果      │
└──────────────────────┘
        │
        ├─ 异常处理
        │   └─> 记录错误,继续
        │
        └─ 执行完成
            │
            ↓
┌──────────────────────┐
│ 递归执行子事件       │
│ (如果存在)           │
└──────────────────────┘
            │
            ↓
┌──────────────────────┐
│ 返回执行结果         │
│ - 执行状态           │
│ - 修改的数据         │
│ - 错误信息           │
└──────────────────────┘
```

### 1.3 表达式求值流程

```
输入: Expression对象
     { value: "data.count + 1", type: "expression" }
        │
        ↓
┌──────────────────────┐
│ 识别表达式类型        │
│ - literal: "123"      │
│ - variable: "data.x"  │
│ - expression: "a + b" │
│ - function: "max(a,b)"│
└──────────────────────┘
        │
        ├─ Literal
        │   └─> 直接返回值
        │
        ├─ Variable
        │   └─> 从上下文获取
        │
        ├─ Expression
        │   └─> 解析和求值
        │       ├─ 扫描tokens
        │       ├─ 构建AST
        │       ├─ 递归求值
        │       └─ 返回结果
        │
        └─ Function
            └─> 调用函数
                ├─ 查找函数定义
                ├─ 求值参数
                ├─ 执行函数
                └─ 返回结果
```

### 1.4 事件编译流程

```
输入: BaseEvent[] 事件列表
        │
        ↓
┌──────────────────────┐
│ 验证事件树            │
│ - 检查循环引用        │
│ - 验证参数类型        │
│ - 检查变量定义        │
└──────────────────────┘
        │
        ↓
┌──────────────────────┐
│ 生成代码框架          │
│ - 导入语句           │
│ - 函数声明           │
│ - 初始化变量         │
└──────────────────────┘
        │
        ↓
┌──────────────────────┐
│ 编译事件序列          │
│ 对每个顶级事件:       │
├─────────────────────┐
│ 检查事件类型:         │
│                     │
├─ StandardEvent      │
│   ├─ 编译条件       │
│   │   (生成if语句)   │
│   ├─ 编译动作       │
│   │   (生成函数调用) │
│   └─ 编译子事件     │
│       (递归)        │
│                     │
├─ WhileEvent         │
│   ├─ 编译条件       │
│   │   (生成while)   │
│   ├─ 编译动作       │
│   └─ 编译子事件     │
│                     │
├─ ForEachEvent       │
│   ├─ 编译集合表达式 │
│   ├─ 生成for循环    │
│   ├─ 编译动作       │
│   └─ 编译子事件     │
│                     │
├─ CommentEvent       │
│   └─ 生成注释       │
│                     │
└─ GroupEvent         │
    └─ 编译子事件     │
└─────────────────────┘
        │
        ↓
┌──────────────────────┐
│ 代码优化              │
│ - 删除死代码         │
│ - 合并条件           │
│ - 内联函数           │
│ - 常量折叠           │
└──────────────────────┘
        │
        ↓
┌──────────────────────┐
│ 格式化代码            │
│ - 缩进                │
│ - 换行                │
│ - 注释                │
└──────────────────────┘
        │
        ↓
输出: JavaScript代码字符串
```

## 2. 详细操作流程

### 2.1 添加事件操作

```typescript
EventManager.addEvent(parentId, event, index)
│
├─ 参数验证
│  ├─ event.id 不能为空
│  ├─ event.type 必须有效
│  └─ index >= 0 (如果指定)
│
├─ 查找父事件
│  ├─ 如果 parentId 为 null
│  │   └─ 添加到顶级事件列表
│  └─ 否则
│      ├─ 查找父事件
│      ├─ 验证父事件支持子事件
│      └─ 添加到父事件的 subEvents
│
├─ 构建事件索引
│  ├─ 创建 eventId -> event 映射
│  └─ 创建 eventId -> parentPath 映射
│
└─ 返回修改后的事件对象
```

### 2.2 移除事件操作

```typescript
EventManager.removeEvent(eventId)
│
├─ 查找事件
│  ├─ 获取事件路径
│  └─ 验证事件存在
│
├─ 从树中移除
│  ├─ 如果是顶级事件
│  │   └─ 从顶级列表删除
│  └─ 否则
│      ├─ 查找父事件
│      └─ 从 subEvents 删除
│
├─ 更新索引
│  └─ 删除所有相关映射
│
└─ 递归删除子事件数据
   └─ 清理所有子事件的索引
```

### 2.3 移动事件操作

```typescript
EventManager.moveEvent(eventId, newParentId, index)
│
├─ 验证操作
│  ├─ 查找源事件
│  ├─ 查找目标父事件
│  └─ 检测循环移动
│
├─ 移除事件
│  └─ 从原位置删除
│
├─ 添加事件
│  └─ 添加到新位置
│
└─ 更新索引
```

### 2.4 条件执行流程详解

```typescript
InstructionExecutor.executeCondition(condition, context)
│
├─ 提取条件类型和参数
│  ├─ type: "comparison"
│  └─ parameters: [expr1, expr2, operator]
│
├─ 求值参数表达式
│  ├─ evaluateExpression(param1) -> value1
│  ├─ evaluateExpression(param2) -> value2
│  └─ 获取操作符
│
├─ 执行条件逻辑
│  ├─ "==" -> value1 == value2
│  ├─ ">" -> value1 > value2
│  ├─ "contains" -> value1.includes(value2)
│  └─ ... 其他比较
│
├─ 处理反转标志
│  ├─ 如果 condition.inverted
│  │   └─ result = !result
│  └─ 否则
│      └─ result = result
│
├─ 异常处理
│  ├─ 捕获求值异常
│  ├─ 记录错误
│  └─ 返回 false (默认安全)
│
└─ 返回布尔值结果
```

### 2.5 动作执行流程详解

```typescript
InstructionExecutor.executeAction(action, context)
│
├─ 提取动作类型和参数
│  ├─ type: "setData"
│  └─ parameters: [dataPath, newValue]
│
├─ 求值参数表达式
│  ├─ evaluateExpression(param1) -> path
│  ├─ evaluateExpression(param2) -> value
│  └─ 其他参数 ...
│
├─ 查找动作处理器
│  ├─ 如果是内置动作
│  │   └─ 获取对应的处理函数
│  └─ 否则
│      └─ 获取自定义动作处理器
│
├─ 执行动作
│  ├─ 调用处理器函数
│  ├─ 传递上下文和参数
│  └─ 获取返回值
│
├─ 异常处理
│  ├─ 捕获执行异常
│  ├─ 记录错误
│  ├─ 触发错误事件
│  └─ 继续执行 (非致命错误)
│
└─ 返回执行结果
```

## 3. 编译代码示例

### 3.1 输入事件

```typescript
{
  type: 'standard',
  conditions: [
    {
      type: 'comparison',
      parameters: [
        { value: 'data.count', type: 'variable' },
        { value: '0', type: 'literal' },
        { value: '>', type: 'literal' }
      ]
    }
  ],
  actions: [
    {
      type: 'setData',
      parameters: [
        { value: 'data.message', type: 'variable' },
        { value: 'Hello World', type: 'literal' }
      ]
    }
  ]
}
```

### 3.2 编译输出

```javascript
// 生成的事件处理函数
function handleStandardEvent_123() {
  // 条件检查
  if (this.data.count > 0) {
    // 执行动作
    this.setData({
      message: 'Hello World'
    });

    // 执行子事件 (如果存在)
    // ...
  }
}
```

### 3.3 复杂例子 - While 循环

```typescript
{
  type: 'while',
  condition: {
    type: 'comparison',
    parameters: [
      { value: 'index', type: 'variable' },
      { value: '10', type: 'literal' },
      { value: '<', type: 'literal' }
    ]
  },
  actions: [
    {
      type: 'incrementVariable',
      parameters: [
        { value: 'index', type: 'variable' }
      ]
    }
  ]
}
```

编译输出：

```javascript
function handleWhileEvent_456() {
  while (index < 10) {
    index = index + 1;
  }
}
```

## 4. 数据一致性保证

### 4.1 事务处理

事件系统提供事务支持，确保数据一致性：

```
beginTransaction()
├─ 创建事务对象
├─ 记录快照
└─ 开始记录操作

执行操作
├─ addEvent()
├─ updateEvent()
└─ removeEvent()
  (每个操作记录到事务中)

commitTransaction() / rollbackTransaction()
├─ commit: 保持更改
└─ rollback: 恢复快照
```

### 4.2 验证规则

1. **事件ID唯一性**: 树中每个ID必须唯一
2. **参数类型匹配**: 动作参数类型必须符合定义
3. **变量存在性**: 引用的变量必须先定义
4. **循环检测**: 防止事件自引用
5. **深度限制**: 嵌套深度不超过50层

## 5. 性能优化的数据流

### 5.1 缓存策略

```
编译缓存:
├─ 输入: EventTree + 版本号
├─ 缓存key: hash(eventTree)
└─ 输出: 生成的代码

表达式缓存:
├─ 输入: Expression字符串
├─ 缓存key: expr.value
└─ 输出: 编译的求值函数

函数查询缓存:
├─ 输入: 函数名
├─ 缓存key: functionName
└─ 输出: 函数引用
```

### 5.2 索引优化

```
事件索引:
├─ eventId -> Event 对象
├─ eventId -> 父事件路径
├─ eventType -> Event[] 列表
└─ 支持快速查找和遍历

变量索引:
├─ variableName -> Variable 对象
├─ variableName -> 作用域
└─ 支持快速变量查找
```

## 6. 数据流监控

### 6.1 调试信息

```
日志记录:
├─ 事件执行日志
├─ 条件求值过程
├─ 动作执行过程
├─ 异常和错误
└─ 性能指标

追踪信息:
├─ 事件执行堆栈
├─ 条件求值堆栈
├─ 变量修改历史
└─ 执行时间统计
```

## 7. 与其他模块的数据流

### 7.1 与 01_Core_ProjectStructure 的集成

```
Page
├─ lifecycleEvents: StandardEvent[]
│  └─> EventManager 管理
├─ customEvents: CustomEvent[]
│  └─> EventManager 管理
└─ components: Component[]
   └─> ComponentEvent[]
       └─> 每个事件关联 Action[]

数据流:
Page.lifecycleEvents
  ↓
EventManager
  ├─ 验证事件
  ├─ 管理事件树
  └─ 执行事件
```

### 7.2 与变量系统的集成

```
VariableSystem
  ├─ 提供变量值
  ├─ 监听变量变化
  └─ 支持数据绑定

EventSystem
  ├─ 读取变量值 (表达式求值)
  ├─ 修改变量值 (setData 动作)
  └─ 监听变量变化 (条件触发)
```

## 8. 错误处理的数据流

```
异常发生
├─ 捕获异常
├─ 记录错误信息
│  ├─ 错误类型
│  ├─ 错误消息
│  ├─ 堆栈跟踪
│  └─ 执行上下文
├─ 触发错误事件
│  └─ 调用错误处理器
├─ 决定是否继续
│  ├─ 致命错误: 停止执行
│  └─ 非致命错误: 继续执行
└─ 返回错误结果
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant

