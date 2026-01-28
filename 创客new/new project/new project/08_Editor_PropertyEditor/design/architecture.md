# 属性编辑器模块 - 架构设计文档

## 1. 模块概述

### 1.1 功能定位
本模块是微信小程序可视化开发平台的属性编辑器核心，提供统一的属性编辑、验证、格式化和管理功能。用户可以通过属性编辑器修改组件、页面和全局配置的属性，支持多种属性类型和丰富的编辑体验。

### 1.2 核心职责
- 管理和定义属性类型系统
- 提供通用的属性编辑面板
- 支持属性的验证、格式化和转换
- 实现属性字段的各种编辑组件
- 支持属性分组、搜索和过滤
- 支持批量编辑和撤销/重做
- 与变量系统和事件系统集成

### 1.3 设计原则
- 遵循设计系统的一致性原则
- 提供完整的类型安全（TypeScript）
- 支持可视化编辑（简洁易用的UI）
- 高度可测试（单元测试覆盖率 > 90%）
- 与其他模块充分解耦
- 支持扩展和自定义

## 2. 架构设计

### 2.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                     属性编辑器系统                             │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React 组件层                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  PropertyEditor                                  │  │  │
│  │  │  - PropertyGroup (属性分组)                      │  │  │
│  │  │  - PropertyItem (属性项)                        │  │  │
│  │  │  - PropertyInput (各种输入组件)                │  │  │
│  │  │  - ColorPicker, FontSelector 等                │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                          △                                    │
│                          │ 使用                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  业务逻辑层                                            │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  PropertyEditor (核心编辑器)                     │  │  │
│  │  │  - 属性管理                                       │  │  │
│  │  │  - 属性验证                                       │  │  │
│  │  │  - 编辑状态管理                                  │  │  │
│  │  │  - 批量编辑支持                                  │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  PropertyField (属性字段)                        │  │  │
│  │  │  - TextPropertyField                             │  │  │
│  │  │  - NumberPropertyField                           │  │  │
│  │  │  - ColorPropertyField                            │  │  │
│  │  │  - SelectPropertyField                           │  │  │
│  │  │  - CheckboxPropertyField                         │  │  │
│  │  │  - SliderPropertyField                           │  │  │
│  │  │  等等...                                         │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                          △                                    │
│                          │ 使用                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  工具层                                                 │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  PropertyFormatter                               │  │  │
│  │  │  - 格式化显示                                    │  │  │
│  │  │  - 值解析                                        │  │  │
│  │  │  - 值验证                                        │  │  │
│  │  │  - 类型转换                                      │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                          △                                    │
│                          │ 使用                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  类型系统层                                            │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │  类型定义 (types.ts)                             │  │  │
│  │  │  - PropertyType (属性类型枚举)                  │  │  │
│  │  │  - PropertyDefinition (属性定义)               │  │  │
│  │  │  - PropertyValue (属性值)                      │  │  │
│  │  │  - PropertyValidation (验证规则)              │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
用户编辑属性值
     │
     ▼
PropertyInput 组件捕获
     │
     ▼
PropertyFormatter.parse() 解析和验证
     │
     ├─ 有效 ──▶ PropertyEditor.updateProperty()
     │               │
     │               ▼
     │           验证规则检查
     │               │
     │               ├─ 通过 ──▶ 触发 onChange 回调
     │               │              │
     │               │              ▼
     │               │          外部系统更新
     │               │          (如组件属性)
     │               │
     │               └─ 失败 ──▶ 显示错误提示
     │
     └─ 无效 ──▶ PropertyFormatter.formatError()
                    │
                    ▼
                显示错误提示
```

### 2.3 核心类设计

#### 2.3.1 PropertyEditor (属性编辑器)

```typescript
class PropertyEditor {
  // 属性定义
  private definitions: Map<string, PropertyDefinition>;
  private groups: Map<string, PropertyGroup>;

  // 当前编辑状态
  private currentValues: Record<string, PropertyValue>;
  private originalValues: Record<string, PropertyValue>;
  private editingProperty?: string;

  // 批量编辑
  private batchMode: boolean;
  private batchValues: Partial<Record<string, PropertyValue>>;

  // 搜索和过滤
  private searchText: string;
  private visibleProperties: string[];

  // 核心方法
  register(definition: PropertyDefinition): void
  updateProperty(name: string, value: PropertyValue): ValidationResult
  getProperty(name: string): PropertyValue
  resetProperty(name: string): void
  resetAll(): void

  // 验证
  validateProperty(name: string, value: PropertyValue): ValidationResult
  validateAll(): ValidationResult

  // 批量编辑
  startBatchEdit(): void
  updateBatchProperty(name: string, value: PropertyValue): void
  commitBatchEdit(): void
  cancelBatchEdit(): void

  // 搜索和分组
  search(text: string): void
  getGroups(): PropertyGroup[]
  getGroupProperties(groupName: string): PropertyDefinition[]

  // 事件
  on(event: string, callback: Function): void
  off(event: string, callback: Function): void
}
```

**职责**：
- 管理属性定义和值
- 验证属性更新
- 处理编辑状态
- 提供搜索和分组功能

#### 2.3.2 PropertyField (属性字段)

```typescript
abstract class PropertyField {
  protected definition: PropertyDefinition;
  protected value: PropertyValue;
  protected error?: string;

  abstract parse(rawValue: string): PropertyValue
  abstract format(value: PropertyValue): string
  abstract validate(value: PropertyValue): ValidationError | null
  abstract render(): ReactElement
}

class TextPropertyField extends PropertyField { ... }
class NumberPropertyField extends PropertyField { ... }
class ColorPropertyField extends PropertyField { ... }
class SelectPropertyField extends PropertyField { ... }
class CheckboxPropertyField extends PropertyField { ... }
class SliderPropertyField extends PropertyField { ... }
// 等等...
```

**职责**：
- 定义单一属性类型的编辑逻辑
- 提供值的解析和格式化
- 实现值的验证
- 渲染相应的UI组件

#### 2.3.3 PropertyFormatter (属性格式化)

```typescript
class PropertyFormatter {
  // 格式化显示
  format(value: PropertyValue, type: PropertyType, options?: FormatOptions): string
  formatLabel(definition: PropertyDefinition): string
  formatError(error: ValidationError): string

  // 解析值
  parse(rawValue: string, type: PropertyType): PropertyValue
  parseNumber(text: string, options?: NumberFormatOptions): number
  parseColor(text: string): Color
  parseSelect(text: string, options: string[]): string

  // 验证
  validate(value: PropertyValue, rules: ValidationRule[]): ValidationError | null
  validateType(value: PropertyValue, type: PropertyType): boolean
  validateRequired(value: PropertyValue): boolean
  validateRange(value: number, min?: number, max?: number): boolean
  validateLength(value: string, min?: number, max?: number): boolean
  validatePattern(value: string, pattern: RegExp): boolean
  validateEnum(value: PropertyValue, options: PropertyValue[]): boolean

  // 类型转换
  coerce(value: PropertyValue, targetType: PropertyType): PropertyValue
}
```

**职责**：
- 格式化属性值用于显示
- 解析用户输入的字符串值
- 验证属性值是否符合规则
- 提供类型转换功能

## 3. 属性类型系统

### 3.1 支持的属性类型

```typescript
enum PropertyType {
  // 基本类型
  Text = 'text',           // 文本输入
  Number = 'number',       // 数字输入
  Color = 'color',         // 颜色选择
  Select = 'select',       // 下拉选择
  Checkbox = 'checkbox',   // 复选框
  Switch = 'switch',       // 开关
  Slider = 'slider',       // 滑块

  // 高级类型
  Date = 'date',           // 日期选择
  Time = 'time',           // 时间选择
  DateTime = 'dateTime',   // 日期时间
  File = 'file',           // 文件选择

  // 特殊类型
  Binding = 'binding',     // 变量绑定
  Expression = 'expression', // 表达式
  Json = 'json',           // JSON对象

  // 扩展类型
  FontSelector = 'fontSelector',   // 字体选择
  IconSelector = 'iconSelector',   // 图标选择
  Gradient = 'gradient',           // 渐变色
}
```

### 3.2 属性定义

```typescript
interface PropertyDefinition {
  // 基本信息
  name: string;
  label: string;
  type: PropertyType;
  defaultValue?: PropertyValue;
  description?: string;

  // 分组和可见性
  group?: string;
  order?: number;
  hidden?: boolean;
  readonly?: boolean;

  // 验证规则
  validation?: ValidationRule[];
  required?: boolean;

  // 类型特定选项
  options?: PropertyTypeOptions;

  // 样式和UI
  appearance?: AppearanceOptions;
}
```

### 3.3 验证规则

```typescript
interface ValidationRule {
  type: 'required' | 'type' | 'range' | 'length' | 'pattern' | 'custom';
  message?: string;
  // 类型特定参数
  params?: any;
}
```

## 4. React 组件

### 4.1 组件树

```
PropertyEditor
  ├─ PropertySearch (搜索组件)
  ├─ PropertyGroup (属性分组)
  │  └─ PropertyItem[] (属性项)
  │     └─ PropertyInput (属性输入)
  │        ├─ TextInput
  │        ├─ NumberInput
  │        ├─ ColorPicker
  │        ├─ Select
  │        ├─ Checkbox
  │        ├─ Slider
  │        └─ ... (其他输入组件)
  ├─ PropertyActions (编辑操作)
  └─ PropertyErrors (错误显示)
```

### 4.2 主要组件接口

#### PropertyEditor.tsx
- 属性编辑器主组件
- Props: definitions[], values, onChange, onError
- State: editingProperty, batchMode, errors

#### PropertyGroup.tsx
- 属性分组组件
- Props: group, properties, values, onChange
- 提供折叠/展开功能

#### PropertyItem.tsx
- 单个属性项组件
- Props: definition, value, onChange, error

#### PropertyInput.tsx
- 统一的属性输入组件
- Props: type, value, definition, onChange
- 根据属性类型路由到相应的输入组件

#### ColorPicker.tsx
- 颜色选择器
- 支持多种颜色格式 (hex, rgb, hsl)

#### FontSelector.tsx
- 字体选择器
- 显示预览，支持搜索

## 5. 与其他模块的集成

### 5.1 与 01_Core_ProjectStructure 的集成

```
PropertyEditor 用于编辑:
- Project.config (项目配置)
- Page.config (页面配置)
- Component.properties (组件属性)
- Component.style (组件样式)
```

### 5.2 与 03_Core_VariableSystem 的集成

```
PropertyEditor 支持:
- 变量绑定 (binding 类型)
- 变量选择器 (选择现有变量)
- 表达式编辑 (expression 类型)
```

### 5.3 与 02_Core_EventSystem 的集成

```
PropertyEditor 支持:
- 事件参数编辑
- 事件动作参数编辑
```

## 6. 错误处理

### 6.1 验证错误

```typescript
interface ValidationError {
  code: string;
  message: string;
  details?: any;
}

enum ValidationErrorCode {
  REQUIRED = 'REQUIRED',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  LENGTH_EXCEEDED = 'LENGTH_EXCEEDED',
  PATTERN_MISMATCH = 'PATTERN_MISMATCH',
  CUSTOM = 'CUSTOM',
}
```

### 6.2 错误处理策略

- 实时验证：用户输入时立即验证
- 错误显示：在输入框下方显示错误信息
- 错误恢复：允许用户修改或取消编辑
- 批量编辑错误：显示哪些属性验证失败

## 7. 扩展性设计

### 7.1 自定义属性类型

允许注册自定义属性类型：

```typescript
editor.registerField('customType', {
  parse: (value) => {...},
  format: (value) => {...},
  validate: (value) => {...},
  render: (props) => <Component {...props} />
});
```

### 7.2 自定义验证规则

支持自定义验证规则：

```typescript
editor.registerValidation('custom', (value, params) => {
  // 自定义验证逻辑
  return { valid: true };
});
```

## 8. 性能优化

### 8.1 优化策略

1. **虚拟滚动**：大量属性时使用虚拟滚动
2. **防抖验证**：输入时防抖验证
3. **记忆化**：使用 React.memo 避免不必要的重新渲染
4. **惰性加载**：属性编辑器组件延迟加载
5. **缓存**：缓存格式化结果

### 8.2 性能指标

- 初始化时间: < 100ms (100个属性)
- 输入响应时间: < 50ms
- 验证时间: < 20ms
- 内存占用: < 5MB

## 9. 测试策略

### 9.1 单元测试覆盖

- PropertyEditor 所有公共方法
- PropertyField 各种类型的解析、验证、格式化
- PropertyFormatter 格式化、解析、验证
- React 组件渲染和交互

### 9.2 测试用例

- 正常流程: 编辑、验证、保存
- 边界条件: 空值、特殊字符、极限值
- 异常情况: 无效输入、验证失败
- 集成: 与其他模块的交互

**目标**: 测试覆盖率 > 90%

## 10. 技术选型

- **语言**: TypeScript 4.9+
- **UI框架**: React 18+
- **测试**: Vitest + React Testing Library
- **验证**: Zod
- **状态管理**: React Hooks (useReducer/useState)
- **样式**: CSS Modules / Tailwind CSS

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
