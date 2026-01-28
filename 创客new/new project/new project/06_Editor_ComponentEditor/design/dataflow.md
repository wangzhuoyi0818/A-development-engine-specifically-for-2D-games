# 组件编辑器模块 - 数据流设计文档

## 1. 数据流概览

### 1.1 核心数据流
组件编辑器模块的数据流主要围绕组件的创建、编辑、验证和导出展开。

```
组件库 → 组件创建 → 组件编辑 → 组件验证 → 组件导出
  ↓         ↓          ↓          ↓          ↓
元数据    实例数据    变更数据    验证结果    序列化数据
```

## 2. 详细数据流

### 2.1 组件创建流程

```
用户选择组件类型
    ↓
ComponentEditorManager.createComponent(type)
    ↓
查询 WxComponentLibrary.getComponent(type)
    ↓
获取组件定义 (ComponentLibraryItem)
    ↓
初始化默认属性值
    ↓
创建 ComponentData 实例
    ↓
返回给调用者
```

**数据转换**:
```typescript
// 输入
type: 'button'

// 组件库查询
ComponentLibraryItem {
  id: 'button',
  properties: [
    { name: 'size', defaultValue: 'default' },
    { name: 'type', defaultValue: 'primary' }
  ]
}

// 输出
ComponentData {
  id: 'generated-id',
  type: 'button',
  properties: { size: 'default', type: 'primary' },
  styles: {},
  events: [],
  children: []
}
```

### 2.2 属性编辑流程

```
用户修改属性值
    ↓
PropertyEditor.updateProperty(property, value)
    ↓
查找属性定义 findProperty(property)
    ↓
验证属性值 validateProperty(propDef, value)
    ↓
验证通过?
    ├─ 是 → 更新属性值
    │         ↓
    │     记录变更历史
    │         ↓
    │     触发 onChange 回调
    │         ↓
    │     返回 PropertyChange
    │
    └─ 否 → 抛出 PropertyValidationError
```

**数据转换示例**:
```typescript
// 输入
property: 'size'
value: 'mini'

// 查找定义
PropertyDefinition {
  name: 'size',
  type: 'enum',
  options: [
    { value: 'default', label: '默认' },
    { value: 'mini', label: '小' }
  ]
}

// 验证通过,记录变更
PropertyChange {
  componentId: 'comp-123',
  property: 'size',
  oldValue: 'default',
  newValue: 'mini',
  timestamp: Date(...)
}
```

### 2.3 事件绑定流程

```
用户添加事件绑定
    ↓
ComponentEditor.addEventBinding(binding)
    ↓
验证事件是否存在
    ↓
生成事件绑定 ID
    ↓
添加到组件 events 数组
    ↓
返回 EventBinding
```

**数据转换**:
```typescript
// 输入
{
  eventName: 'bindtap',
  bindingType: 'function',
  handlerName: 'handleTap'
}

// 输出
EventBinding {
  id: 'binding-generated-id',
  componentId: 'comp-123',
  eventName: 'bindtap',
  bindingType: 'function',
  handlerName: 'handleTap'
}
```

### 2.4 组件验证流程

```
ComponentEditor.validate()
    ↓
验证必填属性
    ↓
验证子组件允许性
    ↓
验证父组件限制
    ↓
收集所有错误
    ↓
返回 ValidationResult
```

**数据转换**:
```typescript
// 组件数据
ComponentData {
  type: 'button',
  properties: { type: '' },  // 必填但为空
  children: [...]             // button 不允许子组件
}

// 验证结果
ValidationResult {
  valid: false,
  message: '属性 "按钮类型" 是必填的; 组件 "按钮" 不允许有子组件'
}
```

### 2.5 组件查询流程

```
用户搜索/筛选组件
    ↓
WxComponentLibrary.searchComponents(query)
    ↓
遍历所有组件
    ↓
匹配名称/标签/描述
    ↓
返回匹配结果
```

**数据转换**:
```typescript
// 输入
query: '表单'

// 搜索过程
forEach component in library:
  if (component.name.includes('表单') ||
      component.tags.includes('表单') ||
      component.description.includes('表单'))
    add to results

// 输出
[
  ComponentLibraryItem { id: 'button', tags: ['表单'] },
  ComponentLibraryItem { id: 'input', tags: ['表单'] },
  ComponentLibraryItem { id: 'checkbox', tags: ['表单'] }
]
```

## 3. 状态管理

### 3.1 组件状态

```typescript
// 组件状态
interface ComponentState {
  // 基础数据
  data: ComponentData;

  // 编辑状态
  editing: boolean;
  dirty: boolean;  // 是否有未保存的变更

  // 验证状态
  valid: boolean;
  errors: string[];

  // UI 状态
  selected: boolean;
  collapsed: boolean;
}
```

### 3.2 编辑器状态

```typescript
// 编辑器状态
interface EditorState {
  // 当前编辑的组件
  currentComponent: string | null;

  // 属性编辑器状态
  propertyEditorVisible: boolean;
  propertyEditorMode: 'basic' | 'advanced';

  // 变更历史
  changes: PropertyChange[];
  canUndo: boolean;
  canRedo: boolean;
}
```

## 4. 数据持久化

### 4.1 序列化流程

```
ComponentData → JSON.stringify() → 存储
```

**示例**:
```typescript
// 组件数据
const component: ComponentData = {
  id: 'comp-123',
  type: 'button',
  properties: { size: 'mini', type: 'primary' },
  styles: { color: 'red' },
  events: [],
  children: []
};

// 序列化
const json = JSON.stringify(component);
// '{"id":"comp-123","type":"button",...}'

// 持久化
localStorage.setItem('component-comp-123', json);
```

### 4.2 反序列化流程

```
存储 → JSON.parse() → ComponentData → 重建编辑器
```

**示例**:
```typescript
// 读取
const json = localStorage.getItem('component-comp-123');

// 反序列化
const component = JSON.parse(json) as ComponentData;

// 重建编辑器
const editor = new ComponentEditor(component);
```

## 5. 事件流

### 5.1 属性变更事件

```
用户输入
    ↓
PropertyEditor.updateProperty()
    ↓
onChange 回调
    ↓
ComponentEditor 更新
    ↓
UI 重新渲染
```

### 5.2 验证事件

```
属性值变更
    ↓
自动触发验证
    ↓
onValidate 回调
    ↓
显示错误信息
```

## 6. 数据约束

### 6.1 属性值约束

| 属性类型 | 约束 |
|---------|------|
| String | 长度限制、正则表达式 |
| Number | 最小值、最大值、步长 |
| Boolean | true/false |
| Color | 颜色格式验证 |
| Enum | 必须在选项列表中 |

### 6.2 组件约束

| 约束类型 | 说明 |
|---------|------|
| 必填属性 | 不能为空 |
| 子组件限制 | 某些组件不允许子组件 |
| 父组件限制 | 某些组件只能在特定父组件中 |
| 嵌套深度 | 最大嵌套层级限制 |

## 7. 性能优化

### 7.1 数据缓存

```typescript
// 组件库缓存
private componentCache = new Map<string, ComponentLibraryItem>();

// 查询缓存
private searchCache = new Map<string, ComponentLibraryItem[]>();

// 索引缓存
private categoryIndex = new Map<Category, Set<string>>();
private tagIndex = new Map<string, Set<string>>();
```

### 7.2 懒加载

```typescript
// 属性分组懒加载
getPropertiesByGroup(group: string) {
  // 仅加载需要的分组
  return this.properties.filter(p => p.group === group);
}
```

### 7.3 批量操作

```typescript
// 批量更新属性
updateProperties(values: Record<string, any>) {
  // 一次性更新多个属性,减少回调触发次数
  Object.entries(values).forEach(([key, value]) => {
    this.values[key] = value;
  });

  // 统一触发回调
  this.onChange?.(values);
}
```

## 8. 数据流示意图

### 8.1 完整编辑流程

```
┌──────────────┐
│  用户界面     │
└──────┬───────┘
       │ 1. 选择组件类型
       ▼
┌──────────────┐
│  组件库       │ ◄──────────── 查询组件定义
└──────┬───────┘
       │ 2. 返回组件定义
       ▼
┌──────────────┐
│ 组件管理器    │
│  - 创建组件   │ ──────────► 生成组件实例
└──────┬───────┘
       │ 3. 组件实例
       ▼
┌──────────────┐
│ 组件编辑器    │
│  - 属性       │ ◄──────────┐
│  - 样式       │             │ 4. 编辑操作
│  - 事件       │             │
└──────┬───────┘             │
       │                     │
       │ 5. 触发变更         │
       ▼                     │
┌──────────────┐             │
│ 属性编辑器    │             │
│  - 验证       │ ────────────┘
│  - 记录变更   │
└──────┬───────┘
       │ 6. 验证结果
       ▼
┌──────────────┐
│  UI 更新      │
└──────────────┘
```

### 8.2 数据绑定流程

```
┌──────────────┐
│   数据源      │
│  (变量系统)   │
└──────┬───────┘
       │ 数据变更
       ▼
┌──────────────┐
│  数据绑定     │
│  监听器       │
└──────┬───────┘
       │ 通知变更
       ▼
┌──────────────┐
│  组件属性     │
│  自动更新     │
└──────┬───────┘
       │ 触发重渲染
       ▼
┌──────────────┐
│  UI 更新      │
└──────────────┘
```

## 9. 错误处理流程

```
操作请求
    ↓
验证输入参数
    ↓
参数有效?
    ├─ 否 → 抛出 ValidationError
    │           ↓
    │       捕获错误
    │           ↓
    │       显示错误提示
    │           ↓
    │       记录日志
    │
    └─ 是 → 执行操作
                ↓
            操作成功?
                ├─ 否 → 抛出具体错误
                │           ↓
                │       错误恢复/回滚
                │
                └─ 是 → 返回结果
```

## 10. 与其他模块的数据交互

### 10.1 与项目结构模块

```
ComponentEditor → Component (from 01_Core_ProjectStructure)
    ↓
转换为标准 Component 类型
    ↓
添加到页面组件树
```

### 10.2 与事件系统模块

```
EventBinding → EventAction (from 02_Core_EventSystem)
    ↓
生成可执行的事件处理代码
```

### 10.3 与代码生成模块

```
ComponentData → WXML Generator
    ↓
生成 .wxml 文件

ComponentData → WXSS Generator
    ↓
生成 .wxss 文件
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
