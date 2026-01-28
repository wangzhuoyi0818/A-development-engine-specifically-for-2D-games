# WXML 生成器架构设计

## 概述

WXML生成器负责将组件树结构转换为符合微信小程序规范的WXML模板代码。本模块采用模块化设计，将代码生成、属性处理、绑定转换、格式化和验证等功能分离到独立模块中。

## 核心模块

### 1. WXMLGenerator (主生成器)

**职责**：
- 协调各子模块完成WXML代码生成
- 遍历组件树并递归生成标签
- 处理组件层级关系
- 生成最终的WXML字符串

**核心方法**：
```typescript
class WXMLGenerator {
  // 从Page生成完整WXML
  generate(page: Page): string

  // 生成组件列表
  generateComponents(components: Component[], indent: number): string

  // 生成单个组件
  generateComponent(component: Component, indent: number): string

  // 生成开始标签
  generateOpenTag(component: Component): string

  // 生成结束标签
  generateCloseTag(component: Component): string
}
```

### 2. AttributeGenerator (属性生成器)

**职责**：
- 生成组件的所有属性字符串
- 处理特殊属性（id, class, style等）
- 处理属性值的引号和转义
- 区分静态属性和动态绑定

**核心方法**：
```typescript
class AttributeGenerator {
  // 生成所有属性
  generateAttributes(component: Component): string

  // 生成普通属性
  generateProperty(property: ComponentProperty): string

  // 生成特殊属性（data-*）
  generateDataAttribute(name: string, value: any): string

  // 转义属性值
  escapeAttributeValue(value: string): string
}
```

### 3. BindingGenerator (绑定生成器)

**职责**：
- 处理数据绑定语法 {{variable}}
- 处理双向绑定 model:value
- 处理计算表达式
- 处理事件绑定

**核心方法**：
```typescript
class BindingGenerator {
  // 生成数据绑定
  generateDataBinding(binding: DataBinding): string

  // 生成事件绑定
  generateEventBinding(event: ComponentEvent): string

  // 生成条件渲染属性
  generateConditionalAttributes(condition: string): string

  // 生成列表渲染属性
  generateListAttributes(config: ListRenderingConfig): string

  // 将变量路径转换为绑定表达式
  toBindingExpression(path: string): string
}
```

### 4. Formatter (代码格式化器)

**职责**：
- 生成正确的缩进
- 美化XML结构
- 添加换行符
- 处理自闭合标签

**核心方法**：
```typescript
class Formatter {
  // 生成缩进字符串
  indent(level: number): string

  // 格式化WXML代码
  format(wxml: string): string

  // 判断是否需要自闭合
  isSelfClosing(component: Component): boolean

  // 添加注释
  addComment(text: string): string
}
```

### 5. Validator (验证器)

**职责**：
- 验证生成的WXML有效性
- 检查必填属性
- 检查组件嵌套规则
- 检查属性值合法性

**核心方法**：
```typescript
class Validator {
  // 验证组件
  validateComponent(component: Component): ValidationResult

  // 验证属性
  validateProperty(component: Component, property: ComponentProperty): ValidationError[]

  // 验证嵌套规则
  validateNesting(parent: Component, child: Component): ValidationError[]

  // 验证WXML字符串
  validateWXML(wxml: string): ValidationResult
}
```

## 架构图

```
┌─────────────────────────────────────────────────┐
│                 WXMLGenerator                   │
│  ┌─────────────────────────────────────────┐   │
│  │ generate(page) → WXML String            │   │
│  └─────────────────────────────────────────┘   │
└──────────┬──────────────────────────────────────┘
           │
           ├─────────────┐
           │             │
           ▼             ▼
  ┌────────────────┐  ┌────────────────┐
  │ AttributeGen   │  │ BindingGen     │
  │ - 属性生成     │  │ - 数据绑定     │
  │ - 转义处理     │  │ - 事件绑定     │
  └────────────────┘  └────────────────┘
           │             │
           └──────┬──────┘
                  │
                  ▼
         ┌────────────────┐
         │   Formatter    │
         │ - 缩进格式化   │
         │ - 代码美化     │
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   Validator    │
         │ - 规则验证     │
         │ - 错误检查     │
         └────────────────┘
```

## 设计原则

### 1. 单一职责原则
每个模块只负责一个特定的功能：
- WXMLGenerator: 组件树遍历
- AttributeGenerator: 属性字符串生成
- BindingGenerator: 绑定语法转换
- Formatter: 代码格式化
- Validator: 验证检查

### 2. 开闭原则
- 支持扩展新的组件类型
- 支持自定义属性处理器
- 支持自定义格式化规则

### 3. 依赖倒置原则
- 高层模块不依赖低层模块
- 通过接口定义依赖关系

## 扩展性

### 自定义组件支持
```typescript
// 支持注册自定义组件处理器
WXMLGenerator.registerComponentHandler('custom-component', handler);
```

### 自定义属性处理
```typescript
// 支持注册自定义属性处理器
AttributeGenerator.registerPropertyHandler('custom-prop', handler);
```

### 插件机制
```typescript
// 支持插件扩展功能
WXMLGenerator.use(myPlugin);
```

## 性能考虑

1. **缓存机制**: 缓存重复使用的属性字符串
2. **惰性求值**: 只在需要时才生成代码
3. **字符串优化**: 使用数组join代替字符串拼接
4. **递归优化**: 避免深度递归导致栈溢出

## 错误处理

1. **验证前置**: 在生成前验证组件树
2. **友好错误信息**: 提供详细的错误位置和原因
3. **容错机制**: 遇到错误时尝试继续生成其他部分
4. **警告系统**: 对不规范但不致命的情况发出警告

## 测试策略

1. **单元测试**: 每个模块独立测试
2. **集成测试**: 测试模块协作
3. **快照测试**: 验证生成的WXML格式
4. **边界测试**: 测试极端情况（空组件、深层嵌套等）
5. **性能测试**: 测试大型组件树的生成性能
