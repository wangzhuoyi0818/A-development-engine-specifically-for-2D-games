# 属性编辑器模块 - 数据流设计文档

## 1. 数据流概览

属性编辑器模块的数据流分为以下几个阶段：
1. **初始化** - 加载属性定义和初始值
2. **编辑** - 用户输入和解析
3. **验证** - 值验证和错误处理
4. **更新** - 属性值更新和通知
5. **同步** - 与其他模块同步

```
┌──────────────────┐
│  属性定义源       │
│  (Component,     │
│   Page, Config)  │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  注册属性定义     │
│  PropertyEditor  │
│  .register()     │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  渲染编辑器       │
│  PropertyEditor  │
│  Component       │
└─────────┬────────┘
          │
     用户编辑 ⟲
          │
          ▼
┌──────────────────┐
│  解析用户输入     │
│  PropertyField   │
│  .parse()        │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  验证值           │
│  PropertyEditor  │
│  .validateProperty│
└─────────┬────────┘
          │
      ┌───┴───┐
      │       │
    有效     无效
      │       │
      │       ▼
      │   ┌──────────────┐
      │   │  显示错误提示 │
      │   └──────────────┘
      │
      ▼
┌──────────────────┐
│  更新值           │
│  PropertyEditor  │
│  .updateProperty()│
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  触发onChange     │
│  回调             │
└─────────┬────────┘
          │
          ▼
┌──────────────────┐
│  外部系统更新     │
│  (Component,     │
│   Page, Config)  │
└──────────────────┘
```

## 2. 详细数据流

### 2.1 初始化阶段

```
外部调用 PropertyEditor.create()
          │
          ▼
    注册属性定义
          │
          ├─> PropertyDefinition 1 (name='text', type='text')
          ├─> PropertyDefinition 2 (name='color', type='color')
          ├─> PropertyDefinition 3 (name='size', type='number')
          └─> ...
          │
          ▼
    设置初始值 (values: Record<string, PropertyValue>)
          │
          ├─> text: "Hello"
          ├─> color: "#ff0000"
          ├─> size: 14
          └─> ...
          │
          ▼
    保存原始值 (用于重置)
          │
          ▼
    分组属性 (按 group 字段)
          │
          ├─> Group 1: ["text", "size"]
          ├─> Group 2: ["color", "backgroundColor"]
          └─> ...
          │
          ▼
    初始化完成 (ready)
```

### 2.2 属性编辑阶段

#### 单个属性编辑

```
用户在 PropertyInput 中输入
          │
          ▼
    捕获原始输入 (rawValue: string)
          │
          ▼
    PropertyField.parse(rawValue)
          │
          ├─> 解析成功 ──▶ parsedValue: PropertyValue
          │
          └─> 解析失败 ──▶ 显示错误提示
                            ↓
                        返回 null
          │
          ▼
    PropertyEditor.validateProperty(name, parsedValue)
          │
          ├─> 执行验证规则
          │   ├─ 类型验证
          │   ├─ 必填验证
          │   ├─ 范围验证
          │   ├─ 长度验证
          │   ├─ 模式验证
          │   └─ 自定义验证
          │
          ├─> 验证通过 ──▶ ValidationResult { valid: true }
          │
          └─> 验证失败 ──▶ ValidationResult { valid: false, errors: [...] }
                            ↓
                        显示错误提示
          │
          ▼
    PropertyEditor.updateProperty(name, parsedValue)
          │
          ├─> 更新 currentValues[name] = parsedValue
          │
          └─> 清除错误状态
          │
          ▼
    触发 onChange 事件
          │
          ├─> onChange(name, parsedValue, allValues)
          │
          └─> 外部系统接收更新
```

#### 批量编辑

```
用户启动批量编辑模式
          │
          ▼
    PropertyEditor.startBatchEdit()
          │
          ├─> 设置 batchMode = true
          ├─> 初始化 batchValues = {}
          └─> 保存 originalValues (用于取消)
          │
          ▼
    用户编辑多个属性
          │
          ├─> PropertyEditor.updateBatchProperty('prop1', value1)
          │   ├─> batchValues['prop1'] = value1
          │   └─> 不触发 onChange (仅缓存)
          │
          ├─> PropertyEditor.updateBatchProperty('prop2', value2)
          │   ├─> batchValues['prop2'] = value2
          │   └─> 不触发 onChange (仅缓存)
          │
          └─> ...
          │
      ┌───┴────┐
      │        │
    提交      取消
      │        │
      │        ▼
      │   PropertyEditor.cancelBatchEdit()
      │        │
      │        ├─> 恢复 currentValues = originalValues
      │        ├─> 清空 batchValues
      │        └─> batchMode = false
      │
      ▼
PropertyEditor.commitBatchEdit()
      │
      ├─> 验证所有批量值
      │   ├─> 遍历 batchValues
      │   ├─> 调用 validateProperty(name, value)
      │   └─> 收集错误
      │
  ┌───┴───┐
  │       │
验证通过  验证失败
  │       │
  │       ▼
  │   显示错误，要求修正
  │   保持 batchMode = true
  │
  ▼
 应用所有批量值
      │
      ├─> currentValues = { ...currentValues, ...batchValues }
      ├─> 清空 batchValues
      └─> batchMode = false
      │
      ▼
 触发 onChange 事件（批量）
      │
      ├─> onChange(null, null, allValues)
      └─> 外部系统接收批量更新
```

### 2.3 搜索和过滤阶段

```
用户输入搜索文本
          │
          ▼
    PropertyEditor.search(text)
          │
          ├─> 遍历所有 PropertyDefinition
          │   ├─> 检查 name 包含 text
          │   ├─> 检查 label 包含 text
          │   └─> 检查 description 包含 text
          │
          ▼
    更新 visibleProperties[]
          │
          ├─> visibleProperties = filtered results
          │
          ▼
    重新渲染 PropertyEditor UI
          │
          └─> 仅显示匹配的属性
```

### 2.4 验证流程

```
PropertyEditor.validateProperty(name, value)
          │
          ▼
    获取属性定义
          │
          ├─> definition = definitions.get(name)
          │
          └─> 未找到 ──▶ 返回 { valid: false, errors: ['未知属性'] }
          │
          ▼
    执行验证规则链
          │
          ├─> 规则 1: 必填验证
          │   ├─ definition.required && !value
          │   └─ 失败 ──▶ errors.push({ code: 'REQUIRED', message: '必填' })
          │
          ├─> 规则 2: 类型验证
          │   ├─ PropertyFormatter.validateType(value, definition.type)
          │   └─ 失败 ──▶ errors.push({ code: 'TYPE_MISMATCH', message: '类型不匹配' })
          │
          ├─> 规则 3: 自定义验证规则
          │   ├─ 遍历 definition.validation[]
          │   ├─ 调用 PropertyFormatter.validate(value, rule)
          │   └─ 失败 ──▶ errors.push(error)
          │
          └─> ...
          │
          ▼
    返回验证结果
          │
          ├─> errors.length === 0
          │   └─▶ { valid: true }
          │
          └─> errors.length > 0
              └─▶ { valid: false, errors: [...] }
```

### 2.5 格式化和解析流程

#### 格式化（值 → 字符串）

```
PropertyFormatter.format(value, type)
          │
          ▼
    根据类型路由
          │
          ├─> type === 'text'
          │   └─▶ String(value)
          │
          ├─> type === 'number'
          │   └─▶ formatNumber(value) → "14.5"
          │
          ├─> type === 'color'
          │   └─▶ formatColor(value) → "#FF0000"
          │
          ├─> type === 'date'
          │   └─▶ formatDate(value) → "2026-01-23"
          │
          └─> ...
          │
          ▼
    返回格式化字符串
```

#### 解析（字符串 → 值）

```
PropertyFormatter.parse(rawValue, type)
          │
          ▼
    根据类型路由
          │
          ├─> type === 'text'
          │   └─▶ rawValue (直接返回)
          │
          ├─> type === 'number'
          │   ├─▶ parseNumber(rawValue)
          │   ├─▶ Number(rawValue)
          │   └─▶ 失败 → throw Error
          │
          ├─> type === 'color'
          │   ├─▶ parseColor(rawValue)
          │   ├─▶ 验证 hex/rgb/hsl 格式
          │   └─▶ 失败 → throw Error
          │
          ├─> type === 'select'
          │   ├─▶ parseSelect(rawValue, options)
          │   ├─▶ 检查是否在选项中
          │   └─▶ 失败 → throw Error
          │
          └─> ...
          │
          ▼
    返回解析后的值
```

## 3. 与外部系统的数据交换

### 3.1 与 01_Core_ProjectStructure 的数据流

```
Component 创建/编辑
          │
          ▼
    获取 Component.properties 和 Component.style
          │
          ▼
    映射为 PropertyDefinition[]
          │
          ├─> 组件属性 → PropertyDefinition
          │   ├─ type 映射
          │   ├─ validation 规则
          │   └─ defaultValue
          │
          └─> 样式属性 → PropertyDefinition
              ├─ CSS 属性映射
              └─ 支持的值范围
          │
          ▼
    初始化 PropertyEditor
          │
          ├─> PropertyEditor.create(definitions, values)
          │
          └─> 渲染编辑器
          │
    用户编辑属性
          │
          ▼
    PropertyEditor.onChange(name, value, all)
          │
          ▼
    更新 Component
          │
          ├─> Component.properties.find(p => p.name === name).value = value
          │
          └─> Component.style[name] = value
```

### 3.2 与 03_Core_VariableSystem 的数据流

```
属性支持变量绑定
          │
          ▼
    PropertyDefinition.type = 'binding'
          │
          ▼
    PropertyInput 渲染变量选择器
          │
          ├─> 从 VariablesContainer 获取可用变量
          │
          └─> 显示变量列表供选择
          │
    用户选择变量
          │
          ├─> value = { type: 'binding', path: 'user.name' }
          │
          ▼
    保存绑定信息
          │
          ├─> Component.dataBindings.push({
          │       property: name,
          │       dataPath: 'user.name',
          │       mode: 'oneWay'
          │   })
          │
          └─> 运行时解析绑定
```

### 3.3 与 02_Core_EventSystem 的数据流

```
事件动作参数编辑
          │
          ▼
    获取 Action.type 的元数据
          │
          ├─> InstructionMetadata.parameters
          │
          └─> 映射为 PropertyDefinition[]
          │
          ▼
    初始化 PropertyEditor
          │
          ├─> PropertyEditor.create(paramDefinitions, paramValues)
          │
          └─> 渲染参数编辑器
          │
    用户编辑参数
          │
          ▼
    PropertyEditor.onChange(paramName, value)
          │
          ▼
    更新 Action.parameters
          │
          └─> Action.parameters[index].value = value
```

## 4. 状态管理

### 4.1 内部状态

```typescript
interface PropertyEditorState {
  // 属性定义
  definitions: Map<string, PropertyDefinition>;

  // 当前值
  currentValues: Record<string, PropertyValue>;

  // 原始值（用于重置）
  originalValues: Record<string, PropertyValue>;

  // 编辑状态
  editingProperty?: string;
  errors: Map<string, ValidationError[]>;

  // 批量编辑
  batchMode: boolean;
  batchValues: Partial<Record<string, PropertyValue>>;

  // 搜索和过滤
  searchText: string;
  visibleProperties: string[];

  // UI 状态
  expandedGroups: Set<string>;
}
```

### 4.2 状态转换

```
初始状态
   │
   ├─> register() ──▶ 添加 definitions
   ├─> search() ──▶ 更新 visibleProperties
   ├─> updateProperty() ──▶ 更新 currentValues 和 errors
   ├─> resetProperty() ──▶ 恢复 originalValues[name]
   ├─> startBatchEdit() ──▶ batchMode = true
   ├─> commitBatchEdit() ──▶ 应用 batchValues, batchMode = false
   └─> cancelBatchEdit() ──▶ 丢弃 batchValues, batchMode = false
```

## 5. 事件系统

### 5.1 事件类型

```typescript
interface PropertyEditorEvents {
  // 值变化事件
  onChange: (name: string, value: PropertyValue, allValues: Record<string, PropertyValue>) => void;

  // 验证事件
  onValidate: (name: string, result: ValidationResult) => void;

  // 批量编辑事件
  onBatchStart: () => void;
  onBatchCommit: (values: Record<string, PropertyValue>) => void;
  onBatchCancel: () => void;

  // 错误事件
  onError: (name: string, error: ValidationError) => void;

  // UI 事件
  onSearch: (text: string) => void;
  onGroupExpand: (groupName: string, expanded: boolean) => void;
}
```

### 5.2 事件触发时机

```
用户输入
   │
   ▼
onChange (每次输入)
   │
   ▼
onValidate (验证完成)
   │
   ├─> 验证失败 ──▶ onError
   │
   └─> 验证成功 ──▶ onChange (最终值)
```

## 6. 数据持久化

### 6.1 保存流程

```
用户点击保存
   │
   ▼
validateAll()
   │
   ├─> 验证失败 ──▶ 显示错误，阻止保存
   │
   └─> 验证成功 ──▶ 继续
   │
   ▼
序列化 currentValues
   │
   ├─> JSON.stringify(currentValues)
   │
   └─> 或映射回原始数据结构
   │
   ▼
调用外部保存接口
   │
   ├─> onSave(currentValues)
   │
   └─> 更新 originalValues = currentValues
```

### 6.2 加载流程

```
加载数据
   │
   ▼
解析数据
   │
   ├─> JSON.parse(data)
   │
   └─> 或从原始数据结构映射
   │
   ▼
设置初始值
   │
   ├─> currentValues = loadedValues
   ├─> originalValues = loadedValues
   │
   └─> 渲染 PropertyEditor
```

## 7. 错误处理流程

```
用户输入 → 解析失败
   │
   ▼
捕获错误
   │
   ├─> 错误类型: SyntaxError (解析错误)
   │
   └─> 错误类型: ValidationError (验证错误)
   │
   ▼
格式化错误信息
   │
   ├─> PropertyFormatter.formatError(error)
   │
   └─> 生成用户友好的提示
   │
   ▼
显示错误提示
   │
   ├─> UI: 在输入框下方显示红色文本
   │
   └─> 触发 onError 回调
   │
用户修正输入
   │
   ▼
清除错误状态
   │
   └─> 错误消失
```

## 8. 性能优化数据流

### 8.1 防抖输入

```
用户快速输入
   │
   ├─> 输入 "1"
   ├─> 输入 "12"
   ├─> 输入 "123"
   └─> 输入 "1234"
   │
   ▼
防抖处理 (300ms)
   │
   └─> 仅处理最后一次输入 "1234"
   │
   ▼
解析和验证
   │
   └─> 触发 onChange
```

### 8.2 批量更新

```
批量设置多个属性
   │
   ├─> setValue('prop1', value1)
   ├─> setValue('prop2', value2)
   └─> setValue('prop3', value3)
   │
   ▼
合并更新
   │
   └─> 仅触发一次 onChange
   │
   ▼
外部系统接收批量更新
```

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
