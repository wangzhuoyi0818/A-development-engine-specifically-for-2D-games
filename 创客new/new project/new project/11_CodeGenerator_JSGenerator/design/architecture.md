# JavaScript生成器 - 架构设计

## 1. 概述

JavaScript生成器负责将可视化编辑的页面和组件定义转换为微信小程序的JavaScript代码,支持Page和Component两种格式。

## 2. 核心架构

### 2.1 模块划分

```
JSGenerator (主生成器)
├── LifecycleGenerator (生命周期生成器)
├── EventHandlerGenerator (事件处理器生成器)
├── DataManagerGenerator (数据管理生成器)
├── MethodGenerator (方法生成器)
├── ImportGenerator (导入生成器)
└── CodeFormatter (代码格式化器)
```

### 2.2 类图

```
┌─────────────────────────────────────┐
│         JSGenerator                 │
├─────────────────────────────────────┤
│ - lifecycleGen: LifecycleGenerator  │
│ - eventHandlerGen: EventHandlerGen  │
│ - dataManagerGen: DataManagerGen    │
│ - methodGen: MethodGenerator        │
│ - importGen: ImportGenerator        │
│ - formatter: CodeFormatter          │
├─────────────────────────────────────┤
│ + generatePageCode(page): string    │
│ + generateComponentCode(comp): str  │
│ - buildPageStructure(): object      │
│ - buildComponentStructure(): object │
└─────────────────────────────────────┘
```

## 3. 代码生成策略

### 3.1 Page格式

```javascript
Page({
  // 页面初始数据
  data: {
    // 由 DataManagerGenerator 生成
  },

  // 生命周期函数
  onLoad(options) {
    // 由 LifecycleGenerator 生成
  },
  onShow() { },
  onReady() { },
  onHide() { },
  onUnload() { },

  // 页面事件处理函数
  onPullDownRefresh() { },
  onReachBottom() { },
  onShareAppMessage() { },

  // 自定义事件处理器
  handleTap(e) {
    // 由 EventHandlerGenerator 生成
  },

  // 自定义方法
  customMethod() {
    // 由 MethodGenerator 生成
  }
})
```

### 3.2 Component格式

```javascript
Component({
  // 组件属性定义
  properties: {
    // 由 DataManagerGenerator 生成
  },

  // 组件数据
  data: {
    // 内部数据
  },

  // 组件生命周期
  lifetimes: {
    attached() {
      // 由 LifecycleGenerator 生成
    },
    detached() { },
    ready() { }
  },

  // 组件所在页面的生命周期
  pageLifetimes: {
    show() { },
    hide() { }
  },

  // 组件方法
  methods: {
    handleEvent(e) {
      // 由 EventHandlerGenerator 生成
    }
  }
})
```

## 4. 子生成器职责

### 4.1 LifecycleGenerator (生命周期生成器)

**职责**:
- 生成页面生命周期函数(onLoad, onShow, onReady等)
- 生成组件生命周期函数(attached, detached, ready等)
- 处理生命周期内的事件动作

**输入**:
- `LifecycleEvent[]` - 生命周期事件列表

**输出**:
- 生命周期函数的JavaScript代码字符串

### 4.2 EventHandlerGenerator (事件处理器生成器)

**职责**:
- 生成组件事件绑定的处理函数
- 处理事件参数传递
- 绑定正确的this上下文
- 生成事件动作的执行代码

**输入**:
- `ComponentEvent[]` - 组件事件列表

**输出**:
- 事件处理函数的JavaScript代码

### 4.3 DataManagerGenerator (数据管理生成器)

**职责**:
- 生成页面/组件的初始data对象
- 生成setData调用代码
- 处理数据绑定表达式
- 生成计算属性

**输入**:
- `Variable[]` - 变量列表
- `DataBinding[]` - 数据绑定配置

**输出**:
- data对象定义和setData调用代码

### 4.4 MethodGenerator (方法生成器)

**职责**:
- 生成自定义方法
- 生成辅助函数
- 封装API调用
- 生成工具方法

**输入**:
- `CustomEvent[]` - 自定义事件
- API调用配置

**输出**:
- 方法函数的JavaScript代码

### 4.5 ImportGenerator (导入生成器)

**职责**:
- 生成必要的导入语句
- 处理外部库引用
- 生成本地模块引用
- 管理依赖关系

**输入**:
- 使用的外部库列表
- 组件依赖关系

**输出**:
- import/require语句

### 4.6 CodeFormatter (代码格式化器)

**职责**:
- 格式化生成的JavaScript代码
- 控制缩进和换行
- 美化代码结构
- 添加必要注释

**输入**:
- 原始代码字符串或AST

**输出**:
- 格式化后的代码字符串

## 5. 关键技术点

### 5.1 代码生成方式

采用**字符串拼接 + AST构建**混合方式:
- 简单结构使用字符串模板
- 复杂逻辑使用AST构建后序列化

### 5.2 上下文管理

维护代码生成上下文:
```typescript
interface GenerationContext {
  type: 'page' | 'component';
  variables: Variable[];
  imports: Set<string>;
  methods: Map<string, string>;
  indentLevel: number;
}
```

### 5.3 this绑定

确保事件处理器正确绑定this:
```javascript
// 方式1: 箭头函数
handleTap: (e) => {
  this.setData({ ... })
}

// 方式2: 显式bind
handleTap: function(e) {
  this.setData({ ... })
}.bind(this)

// 方式3: 在构造函数中绑定(推荐)
onLoad() {
  this.handleTap = this.handleTap.bind(this)
}
```

### 5.4 异步处理

生成async/await代码:
```javascript
async onLoad() {
  try {
    const data = await wx.request({ url: '...' })
    this.setData({ data })
  } catch (error) {
    console.error(error)
  }
}
```

## 6. 代码优化策略

### 6.1 避免重复代码

提取公共方法:
```javascript
// 提取前
handleTapA() {
  wx.showToast({ title: 'A' })
}
handleTapB() {
  wx.showToast({ title: 'B' })
}

// 提取后
showToast(title) {
  wx.showToast({ title })
}
handleTapA() {
  this.showToast('A')
}
```

### 6.2 合并setData调用

```javascript
// 优化前
this.setData({ a: 1 })
this.setData({ b: 2 })
this.setData({ c: 3 })

// 优化后
this.setData({
  a: 1,
  b: 2,
  c: 3
})
```

### 6.3 条件渲染优化

使用计算属性替代复杂表达式:
```javascript
// data中
computed_showContent() {
  return this.data.userLevel > 5 && this.data.isVip
}

// WXML中
<view wx:if="{{computed_showContent}}">...</view>
```

## 7. 错误处理

### 7.1 代码生成时验证

- 检查变量名冲突
- 验证事件处理器存在
- 检查API调用合法性
- 验证数据绑定路径

### 7.2 运行时错误处理

生成try-catch包装:
```javascript
handleRequest() {
  try {
    // 用户代码
  } catch (error) {
    console.error('[Generated Code Error]', error)
    wx.showToast({ title: '操作失败', icon: 'none' })
  }
}
```

## 8. 扩展性设计

### 8.1 插件机制

支持自定义代码生成器:
```typescript
interface CodeGeneratorPlugin {
  name: string
  generate(context: GenerationContext): string
}
```

### 8.2 模板系统

支持自定义代码模板:
```typescript
const templates = {
  pageTemplate: '...',
  componentTemplate: '...',
  methodTemplate: '...'
}
```

## 9. 性能考虑

### 9.1 缓存机制

- 缓存常用代码片段
- 缓存编译结果
- 增量生成

### 9.2 并行生成

- 独立模块可并行生成
- 使用Worker进行大规模生成

## 10. 测试策略

### 10.1 单元测试

- 测试每个子生成器独立功能
- 测试边界条件和错误情况

### 10.2 集成测试

- 测试完整的Page代码生成
- 测试完整的Component代码生成
- 验证生成代码可执行性

### 10.3 快照测试

- 保存生成代码的快照
- 检测意外的代码变更

## 11. 与其他模块的集成

```
01_ProjectStructure → 提供Page/Component定义
02_EventSystem → 提供事件和动作定义
03_VariableSystem → 提供变量管理
            ↓
    11_JSGenerator (本模块)
            ↓
14_MiniProgramExporter → 导出完整项目
```

## 12. 输出示例

### 12.1 简单Page示例

```javascript
Page({
  data: {
    title: '首页',
    count: 0
  },

  onLoad(options) {
    console.log('Page loaded', options)
  },

  handleIncrement(e) {
    const newCount = this.data.count + 1
    this.setData({
      count: newCount
    })
  }
})
```

### 12.2 复杂Component示例

```javascript
Component({
  properties: {
    title: {
      type: String,
      value: ''
    },
    count: {
      type: Number,
      value: 0
    }
  },

  data: {
    internalState: null
  },

  lifetimes: {
    attached() {
      this.setData({
        internalState: 'ready'
      })
    }
  },

  methods: {
    handleTap(e) {
      const { count } = this.properties
      this.triggerEvent('countChange', { count: count + 1 })
    }
  }
})
```

## 13. 总结

JavaScript生成器是代码生成层的核心模块之一,负责将可视化定义转换为可执行的JavaScript代码。通过模块化设计和清晰的职责划分,确保生成的代码质量高、可维护性强。
