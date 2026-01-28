# WXML 生成器数据流设计

## 概述

本文档描述WXML生成器的数据流转过程，从输入的组件树到最终输出的WXML字符串。

## 数据流概览

```
┌──────────────┐
│    Page      │  输入：页面对象
│  (包含组件树) │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Validator       │  验证：检查组件树有效性
│  - 检查必填属性   │
│  - 检查嵌套规则   │
└──────┬───────────┘
       │ ValidationResult
       ▼
┌──────────────────┐
│ WXMLGenerator    │  遍历：递归处理组件树
│  - 前序遍历       │
│  - 深度优先       │
└──────┬───────────┘
       │
       ├─────────────────────────────────┐
       │                                 │
       ▼                                 ▼
┌──────────────┐                 ┌──────────────┐
│ Component 1  │                 │ Component 2  │
└──────┬───────┘                 └──────┬───────┘
       │                                 │
       ▼                                 ▼
┌─────────────────────────────────────────────┐
│         AttributeGenerator                  │  属性处理
│  ┌─────────────┬─────────────┬───────────┐ │
│  │ 普通属性     │  数据绑定    │  事件绑定  │ │
│  └─────────────┴─────────────┴───────────┘ │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ BindingGenerator │  绑定转换
         │  - {{variable}}  │
         │  - wx:if/for     │
         └──────┬───────────┘
                │
                ▼
         ┌──────────────────┐
         │   Formatter      │  格式化
         │  - 缩进          │
         │  - 换行          │
         └──────┬───────────┘
                │
                ▼
         ┌──────────────────┐
         │  WXML String     │  输出
         └──────────────────┘
```

## 详细数据流

### 1. 输入阶段

**输入数据结构**：
```typescript
interface Page {
  id: string
  name: string
  path: string
  components: Component[]  // 组件树根节点
  // ...其他属性
}

interface Component {
  id: string
  type: string              // 'view', 'text', 'button' 等
  properties: ComponentProperty[]
  children: Component[]
  events: ComponentEvent[]
  dataBindings: DataBinding[]
  condition?: string        // 条件渲染
  listRendering?: ListRenderingConfig  // 列表渲染
  // ...
}
```

**示例输入**：
```typescript
{
  id: 'page1',
  name: '登录页',
  components: [
    {
      id: 'container',
      type: 'view',
      properties: [{ name: 'class', value: 'container' }],
      children: [
        {
          id: 'input1',
          type: 'input',
          properties: [
            { name: 'placeholder', value: '请输入用户名' }
          ],
          dataBindings: [
            { property: 'value', dataPath: 'username', mode: 'twoWay' }
          ],
          children: []
        }
      ]
    }
  ]
}
```

### 2. 验证阶段

**验证流程**：
```
Component Tree
      ↓
[检查1] 组件类型是否有效？
      ↓
[检查2] 必填属性是否存在？
      ↓
[检查3] 嵌套关系是否合法？
      ↓
[检查4] 属性值类型是否正确？
      ↓
ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}
```

**验证规则示例**：
```typescript
// 规则1: text组件不能有子组件
if (component.type === 'text' && component.children.length > 0) {
  errors.push({
    code: 'INVALID_NESTING',
    message: 'text组件不能包含子组件',
    path: component.id
  })
}

// 规则2: input组件必须有placeholder或value
if (component.type === 'input') {
  const hasPlaceholder = component.properties.some(p => p.name === 'placeholder')
  const hasValue = component.dataBindings.some(b => b.property === 'value')
  if (!hasPlaceholder && !hasValue) {
    warnings.push({
      code: 'MISSING_PROPERTY',
      message: 'input组件建议设置placeholder或value',
      path: component.id
    })
  }
}
```

### 3. 遍历生成阶段

**遍历策略**：深度优先，前序遍历

```
generateComponent(component) {
  1. 生成开始标签 <view
  2. 生成属性
  3. 生成 >
  4. 递归处理子组件
  5. 生成结束标签 </view>
}
```

**遍历示例**：
```
view#container
├─ 生成: <view id="container" class="container">
├─ 处理子组件:
│  ├─ input#input1
│  │  ├─ 生成: <input id="input1" placeholder="请输入用户名" model:value="{{username}}" />
│  │  └─ 无子组件
├─ 生成: </view>
```

### 4. 属性生成阶段

**属性处理流程**：
```
Component
    ↓
┌─────────────────────┐
│ 1. ID属性           │ → id="component_1"
├─────────────────────┤
│ 2. 普通属性         │ → class="container"
├─────────────────────┤
│ 3. 数据绑定属性     │ → value="{{username}}"
├─────────────────────┤
│ 4. 事件绑定         │ → bindtap="onButtonTap"
├─────────────────────┤
│ 5. 条件渲染         │ → wx:if="{{isVisible}}"
├─────────────────────┤
│ 6. 列表渲染         │ → wx:for="{{items}}" wx:key="id"
└─────────────────────┘
    ↓
  合并为属性字符串
```

**属性转换表**：

| 源数据 | 转换规则 | 输出 |
|--------|----------|------|
| `property: {name: 'class', value: 'btn'}` | 静态属性 | `class="btn"` |
| `dataBinding: {property: 'value', dataPath: 'username'}` | 单向绑定 | `value="{{username}}"` |
| `dataBinding: {property: 'value', mode: 'twoWay'}` | 双向绑定 | `model:value="{{username}}"` |
| `event: {name: 'tap', handler: 'onClick'}` | 事件绑定 | `bindtap="onClick"` |
| `condition: 'isVisible'` | 条件渲染 | `wx:if="{{isVisible}}"` |
| `listRendering: {dataSource: 'items', key: 'id'}` | 列表渲染 | `wx:for="{{items}}" wx:key="id"` |

### 5. 绑定转换阶段

**绑定语法转换**：

```typescript
// 数据绑定
dataPath: 'user.name'
    ↓
binding: '{{user.name}}'

// 表达式绑定
expression: 'count + 1'
    ↓
binding: '{{count + 1}}'

// 条件表达式
condition: 'isLogin ? "已登录" : "未登录"'
    ↓
binding: '{{isLogin ? "已登录" : "未登录"}}'

// 列表渲染
listRendering: {
  dataSource: 'items',
  itemName: 'item',
  indexName: 'idx',
  key: 'id'
}
    ↓
attributes:
  wx:for="{{items}}"
  wx:for-item="item"
  wx:for-index="idx"
  wx:key="id"
```

### 6. 格式化阶段

**格式化规则**：

```typescript
// 输入：未格式化的WXML
'<view id="container"><text>Hello</text></view>'

// 格式化处理
1. 识别标签层级
2. 添加缩进（2空格 × 层级）
3. 添加换行符
4. 处理自闭合标签

// 输出：格式化的WXML
<view id="container">
  <text>Hello</text>
</view>
```

**缩进计算**：
```
level 0: 无缩进
level 1: 2 空格
level 2: 4 空格
level 3: 6 空格
...
```

### 7. 输出阶段

**最终输出结构**：

```xml
<!-- pages/login/login.wxml -->
<!-- 由可视化开发平台自动生成 -->
<view id="container" class="container">
  <input
    id="input1"
    placeholder="请输入用户名"
    model:value="{{username}}"
    bindinput="onInput1Input"
  />
  <button
    id="btn1"
    type="primary"
    bindtap="onBtn1Tap"
  >
    <text>登录</text>
  </button>
</view>
```

## 特殊情况处理

### 条件渲染数据流

```
component.condition = 'isVisible'
    ↓
[检查] 是否有 elif/else 子句？
    ↓
[生成] <view wx:if="{{isVisible}}">...</view>
    或
[生成] <view wx:if="{{isVisible}}">...</view>
      <view wx:else>...</view>
```

### 列表渲染数据流

```
component.listRendering = {
  dataSource: 'items',
  itemName: 'item',
  key: 'id'
}
    ↓
[生成属性]
  wx:for="{{items}}"
  wx:for-item="item"
  wx:key="id"
    ↓
[生成标签]
<view wx:for="{{items}}" wx:for-item="item" wx:key="id">
  <!-- 使用 {{item}} 访问当前项 -->
</view>
```

### 自定义组件数据流

```
component.type = 'custom-component'
    ↓
[检查] 是否已注册？
    ↓
[生成] <custom-component prop="{{value}}" />
    或
[错误] 未找到组件定义
```

## 错误处理流程

```
生成过程中遇到错误
    ↓
[记录错误]
  - 错误类型
  - 错误位置
  - 组件ID
    ↓
[决策] 是否继续？
    ├─ 致命错误 → 终止生成，返回错误
    └─ 非致命错误 → 记录警告，继续生成
        ↓
[输出] 带有警告的生成结果
```

## 性能优化数据流

### 缓存机制

```
Component
    ↓
[检查] 属性字符串是否已缓存？
    ├─ 是 → 使用缓存
    └─ 否 → 生成并缓存
```

### 惰性求值

```
generateComponent()
    ↓
[检查] 组件是否可见（条件渲染为false）？
    ├─ 是 → 跳过生成
    └─ 否 → 继续生成
```

## 总结

整个WXML生成器的数据流遵循以下原则：

1. **单向流动**: 数据从输入到输出单向流动，不回溯
2. **分层处理**: 每个阶段专注于特定的转换任务
3. **错误前置**: 在生成前进行验证，减少错误传播
4. **可追溯**: 每个阶段保留足够的信息用于调试
5. **容错性**: 非致命错误不中断整体流程
