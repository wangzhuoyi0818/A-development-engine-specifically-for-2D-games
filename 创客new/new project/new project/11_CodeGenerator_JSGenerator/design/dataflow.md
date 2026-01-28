# JavaScript生成器 - 数据流设计

## 1. 输入数据流

### 1.1 页面代码生成流程

```
Page Definition (from 01_Core_ProjectStructure)
  ├── id, name, path
  ├── config (PageConfig)
  ├── components (Component树)
  ├── variables (Variable[])
  ├── lifecycleEvents (LifecycleEvent[])
  └── customEvents (CustomEvent[])
        ↓
  JSGenerator.generatePageCode(page)
        ↓
  [提取与转换]
  ├─ ImportGenerator → 生成导入
  ├─ DataManagerGenerator → 生成data对象
  ├─ LifecycleGenerator → 生成生命周期
  ├─ EventHandlerGenerator → 生成事件处理
  ├─ MethodGenerator → 生成自定义方法
  └─ CodeFormatter → 格式化代码
        ↓
  Page({...})
```

### 1.2 组件代码生成流程

```
Component Definition (from 01_Core_ProjectStructure)
  ├── id, type, name
  ├── properties (ComponentProperty[])
  ├── events (ComponentEvent[])
  ├── children (Component树)
  └── ...
        ↓
  JSGenerator.generateComponentCode(component)
        ↓
  [提取与转换]
  ├─ ImportGenerator → 生成导入
  ├─ DataManagerGenerator → 生成properties和data
  ├─ LifecycleGenerator → 生成组件生命周期
  ├─ EventHandlerGenerator → 生成事件处理
  └─ CodeFormatter → 格式化代码
        ↓
  Component({...})
```

### 1.3 事件流处理

```
Event Definition (from 02_Core_EventSystem)
  ├── BaseEvent (standard/while/forEach)
  ├── Condition[] (条件列表)
  ├── Action[] (动作列表)
  └── subEvents (子事件)
        ↓
  EventHandlerGenerator.generateEventHandler()
        ↓
  [条件编译]
  └─ 生成if/while语句
        ↓
  [动作编译]
  ├─ setData → this.setData({...})
  ├─ navigateTo → wx.navigateTo({url: ...})
  ├─ showToast → wx.showToast({...})
  ├─ request → wx.request({...})
  └─ custom → 自定义函数调用
        ↓
  完整事件处理函数
```

### 1.4 变量处理流程

```
Variables (from 03_Core_VariableSystem)
  ├── global: Variable[]
  ├── page: Variable[]
  └── component: Variable[]
        ↓
  DataManagerGenerator.generateDataObject()
        ↓
  [变量转换]
  ├─ 类型检查
  ├─ 初始值设置
  └─ 计算属性生成
        ↓
  {
    varName1: initialValue1,
    varName2: initialValue2,
    ...
  }
```

## 2. 核心数据转换

### 2.1 变量到data对象的转换

```typescript
// 输入
variables: [
  { name: 'title', type: 'string', initialValue: '首页' },
  { name: 'count', type: 'number', initialValue: 0 },
  { name: 'items', type: 'array', initialValue: [] }
]

// 处理过程
1. 验证变量名有效性
2. 获取类型和初始值
3. 处理特殊类型(object, array)

// 输出
data: {
  title: '首页',
  count: 0,
  items: []
}
```

### 2.2 事件到处理函数的转换

```typescript
// 输入
event: {
  name: 'tap',
  handler: 'handleTap',
  actions: [
    { type: 'setData', params: { key: 'count', value: 'this.data.count + 1' } },
    { type: 'showToast', params: { title: '计数加1' } }
  ]
}

// 处理过程
1. 创建处理函数名
2. 解析action类型
3. 生成对应的代码
4. 合并多个setData调用

// 输出
handleTap(e) {
  this.setData({
    count: this.data.count + 1
  })
  wx.showToast({
    title: '计数加1',
    icon: 'none'
  })
}
```

### 2.3 生命周期到函数的转换

```typescript
// 输入
lifecycleEvent: {
  name: 'onLoad',
  actions: [
    { type: 'setData', params: { ... } },
    { type: 'request', params: { url: '/api/data' } }
  ]
}

// 处理过程
1. 识别生命周期类型
2. 生成函数签名(options参数等)
3. 生成函数体

// 输出
onLoad(options) {
  // 初始化代码
  this.setData({...})

  // 发送请求
  wx.request({
    url: '/api/data',
    success: (res) => {
      this.setData({ apiData: res.data })
    }
  })
}
```

## 3. 生成过程详解

### 3.1 页面代码生成步骤

```
Step 1: 初始化生成上下文
  ├─ pageId, pageName
  ├─ 收集所有变量
  ├─ 收集所有事件
  └─ 初始化缓存

Step 2: 生成导入语句
  ├─ 检查外部库使用
  ├─ 生成必要的import
  └─ 添加到输出

Step 3: 生成data对象
  ├─ 遍历所有变量
  ├─ 转换为JavaScript对象
  └─ 添加到Page对象

Step 4: 生成生命周期函数
  ├─ 遍历lifecycleEvents
  ├─ 为每个生命周期生成函数
  └─ 添加到Page对象

Step 5: 生成事件处理器
  ├─ 遍历customEvents
  ├─ 生成处理函数
  └─ 添加到methods

Step 6: 生成自定义方法
  ├─ 分析代码中的函数调用
  ├─ 生成辅助方法
  └─ 添加到methods

Step 7: 格式化和输出
  ├─ 调整缩进
  ├─ 美化代码
  └─ 返回最终JavaScript
```

### 3.2 事件处理函数生成步骤

```
Step 1: 解析事件定义
  ├─ 获取event.actions
  ├─ 获取event.conditions
  └─ 初始化函数体

Step 2: 生成条件判断
  └─ 如果有conditions
      └─ 生成 if (condition1 && condition2) { ... }

Step 3: 生成动作执行
  ├─ 遍历每个action
  └─ 根据type生成对应代码
      ├─ setData → this.setData(...)
      ├─ navigateTo → wx.navigateTo(...)
      ├─ request → this.request(...) 或 wx.request(...)
      └─ custom → this.customMethod(...)

Step 4: 处理异步操作
  ├─ 识别异步action
  ├─ 包装成async/await
  └─ 添加错误处理

Step 5: 生成函数定义
  └─ 完整函数: async handleEvent(e) { ... }
```

## 4. 代码流转图

### 4.1 完整流转示例

```
┌─────────────────────────────────────────────────────┐
│ 可视化编辑器定义                                     │
│                                                     │
│ Page: 首页                                          │
│ ├─ Variables: [title, count]                      │
│ ├─ Events: [onLoad, handleIncrement]              │
│ └─ Lifecycle: [onLoad]                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
        ┌────────────────────────┐
        │  JSGenerator           │
        │  .generatePageCode()   │
        └────────┬───────────────┘
                 │
    ┌────────────┼────────────┬─────────────┐
    │            │            │             │
    ↓            ↓            ↓             ↓
┌────────┐  ┌────────┐  ┌──────────┐  ┌─────────┐
│Import  │  │Data    │  │Lifecycle │  │Event    │
│Gen     │  │Manager │  │Generator │  │Handler  │
│        │  │Gen     │  │          │  │Gen      │
│"import"│  │{data:} │  │onLoad() {}   │handle..()│
└────────┘  └────────┘  └──────────┘  └─────────┘
    │            │            │             │
    └────────────┼────────────┴─────────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ CodeFormatter      │
        │ .format()          │
        └────────┬───────────┘
                 │
                 ↓
        ┌────────────────────┐
        │ 最终JavaScript代码  │
        │                    │
        │ Page({            │
        │   data: {...},    │
        │   onLoad() {},    │
        │   methods: {...}  │
        │ })                 │
        └────────────────────┘
```

## 5. 数据类型映射

### 5.1 TypeScript类型到JavaScript值的映射

```typescript
// 输入: Variable (from 03_VariableSystem)
interface Variable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  initialValue: any
}

// 转换规则
string → "value"
number → 123
boolean → true/false
object → { key: value, ... }
array → [item1, item2, ...]

// 输出: JavaScript value
"Hello"
42
true
{ x: 1, y: 2 }
[1, 2, 3]
```

### 5.2 事件动作到JavaScript的映射

```typescript
// Action type → JavaScript代码
{
  'setData': (params) => `this.setData(${JSON.stringify(params)})`,
  'navigateTo': (params) => `wx.navigateTo({url: '${params.url}'})`,
  'showToast': (params) => `wx.showToast({title: '${params.title}'})`,
  'request': (params) => `wx.request({url: '${params.url}', ...})`,
  'custom': (params) => `this.${params.methodName}(${params.args})`,
}
```

## 6. 缓存和性能优化

### 6.1 缓存策略

```
┌──────────────────────────────────┐
│ 代码生成缓存                      │
├──────────────────────────────────┤
│ 缓存key: md5(page定义)           │
│ 缓存value: 生成的JavaScript代码  │
├──────────────────────────────────┤
│ 失效条件:                        │
│ - 页面定义变更                   │
│ - 变量列表变更                   │
│ - 事件流变更                     │
└──────────────────────────────────┘
```

### 6.2 增量生成

```
变更检测:
  ├─ 新增变量 → 更新data对象
  ├─ 修改事件 → 重新生成事件处理函数
  ├─ 新增生命周期 → 添加新的生命周期函数
  └─ 删除事件 → 移除对应函数

只生成变更的部分,提高性能
```

## 7. 错误处理流程

### 7.1 代码生成时的错误

```
错误检测点:
  1. 变量名冲突检查
     → 变量名不能重复
     → 变量名不能是保留字

  2. 事件处理器检查
     → 处理器名称必须有效
     → 处理器不能重复

  3. 数据绑定检查
     → 绑定路径必须存在
     → 类型检查

  4. API调用检查
     → API名称有效性
     → 参数正确性

处理流程:
  ├─ 收集错误信息
  ├─ 生成警告
  ├─ 尝试修复
  └─ 返回错误报告或修复建议
```

### 7.2 运行时错误处理

```javascript
// 生成的代码包含错误处理
handleEvent(e) {
  try {
    // 用户业务逻辑
    this.setData({...})
  } catch (error) {
    console.error('[Generated Code Error]', error)

    // 用户友好的错误提示
    wx.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}
```

## 8. 输出到其他模块的数据流

### 8.1 到导出器的数据流

```
JSGenerator生成的JavaScript代码
  ├─ pages/index/index.js
  ├─ pages/list/list.js
  └─ components/card/card.js
        ↓
  14_MiniProgramExporter
        ↓
  项目结构:
  ├─ app.js
  ├─ pages/
  │  ├─ index/
  │  │  ├─ index.js (生成)
  │  │  ├─ index.wxml (从WXML生成器)
  │  │  ├─ index.wxss (从WXSS生成器)
  │  │  └─ index.json
  │  └─ ...
  └─ components/...
```

### 8.2 到预览模拟器的数据流

```
生成的JavaScript代码
  ├─ 提供给模拟器执行
  ├─ 绑定到虚拟DOM
  └─ 捕获事件和状态变化
        ↓
  15_Preview_Simulator
        ↓
  实时预览和调试
```

## 9. 总结

数据流设计确保了从可视化定义到最终JavaScript代码的清晰转换,同时保持了模块间的低耦合和高内聚。通过明确的数据转换规则和错误处理机制,生成的代码既满足功能需求,又保持高可维护性。
