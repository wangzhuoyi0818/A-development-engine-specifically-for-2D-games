# 组件编辑器模块 - 架构设计文档

## 1. 模块概述

### 1.1 功能定位
本模块是微信小程序可视化开发平台的编辑器层核心模块,负责微信小程序组件的可视化编辑管理。参考 GDevelop 的 ObjectEditor,针对微信小程序组件特性进行专门设计。

### 1.2 核心职责
- 管理微信小程序所有内置组件的定义和元数据
- 提供组件属性的可视化编辑界面
- 支持组件样式编辑
- 管理组件事件绑定
- 提供组件验证和预览功能
- 支持自定义组件扩展

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                   Component Editor Module                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Component Library (组件库)                 │  │
│  │  - 微信小程序所有内置组件定义                          │  │
│  │  - 组件属性、事件、样式定义                            │  │
│  │  - 组件分类和搜索                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ▲                                   │
│                           │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │          Component Editor Manager (编辑器管理器)       │  │
│  │  - 创建和管理组件实例                                  │  │
│  │  - 管理组件编辑器生命周期                              │  │
│  │  - 批量操作支持                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ▲                                   │
│                           │                                   │
│  ┌───────────────────────┴───────────────────────────────┐  │
│  │            Component Editor (组件编辑器)               │  │
│  │  - 单个组件的编辑管理                                  │  │
│  │  - 属性、样式、事件管理                                │  │
│  │  - 组件验证                                            │  │
│  └─────────┬──────────────────────────────┬──────────────┘  │
│            │                               │                  │
│  ┌─────────▼──────────────┐   ┌──────────▼──────────────┐   │
│  │   Property Editor      │   │   Event Binding          │   │
│  │   (属性编辑器)         │   │   (事件绑定)             │   │
│  │  - 属性值编辑          │   │  - 事件处理函数绑定      │   │
│  │  - 属性验证            │   │  - 可视化动作编辑        │   │
│  │  - 数据绑定            │   │  - 事件参数管理          │   │
│  │  - 变更追踪            │   │                          │   │
│  └────────────────────────┘   └──────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 类关系图

```
┌──────────────────────────┐
│  ComponentLibraryItem    │
├──────────────────────────┤
│ + id: string             │
│ + name: string           │
│ + category: Category     │
│ + properties: PropDef[]  │
│ + events: EventDef[]     │
│ + canHaveChildren: bool  │
└──────────────────────────┘
           │
           │ 包含
           ▼
┌──────────────────────────┐
│  WxComponentLibrary      │
├──────────────────────────┤
│ - components: Map        │
│ - categoryIndex: Map     │
│ - tagIndex: Map          │
├──────────────────────────┤
│ + getComponent()         │
│ + searchComponents()     │
│ + getByCategory()        │
└──────────────────────────┘
           │
           │ 使用
           ▼
┌──────────────────────────┐
│ ComponentEditorManager   │
├──────────────────────────┤
│ - editors: Map           │
├──────────────────────────┤
│ + createComponent()      │
│ + createEditor()         │
│ + getEditor()            │
└──────────────────────────┘
           │
           │ 管理
           ▼
┌──────────────────────────┐
│   ComponentEditor        │
├──────────────────────────┤
│ - component: Data        │
│ - definition: LibItem    │
│ - propertyEditor: Editor │
├──────────────────────────┤
│ + updateProperty()       │
│ + updateStyle()          │
│ + addEventBinding()      │
│ + validate()             │
└──────────────────────────┘
           │
           │ 使用
           ▼
┌──────────────────────────┐
│    PropertyEditor        │
├──────────────────────────┤
│ - config: EditorConfig   │
│ - changes: Change[]      │
├──────────────────────────┤
│ + updateProperty()       │
│ + validateProperty()     │
│ + getChanges()           │
│ + resetProperty()        │
└──────────────────────────┘
```

### 2.3 设计模式

#### 2.3.1 Library Pattern (库模式)
- **WxComponentLibrary**: 集中管理所有组件定义
- **优势**: 统一的组件元数据管理,易于查找和扩展

#### 2.3.2 Manager Pattern (管理器模式)
- **ComponentEditorManager**: 管理组件实例和编辑器
- **优势**: 集中式管理,便于生命周期控制

#### 2.3.3 Editor Pattern (编辑器模式)
- **ComponentEditor / PropertyEditor**: 封装编辑逻辑
- **优势**: 关注点分离,易于测试和维护

#### 2.3.4 Factory Pattern (工厂模式)
- **PropertyEditorFactory**: 根据组件类型创建编辑器
- **优势**: 简化创建逻辑,统一接口

## 3. 核心类设计

### 3.1 WxComponentLibrary (组件库)

```typescript
class WxComponentLibrary {
  private components: Map<string, ComponentLibraryItem>;
  private categoryIndex: Map<ComponentCategory, Set<string>>;
  private tagIndex: Map<string, Set<string>>;

  // 查询操作
  getComponent(id: string): ComponentLibraryItem | undefined
  getAllComponents(): ComponentLibraryItem[]
  getComponentsByCategory(category: ComponentCategory): ComponentLibraryItem[]
  getComponentsByTag(tag: string): ComponentLibraryItem[]
  searchComponents(query: string): ComponentLibraryItem[]

  // 元数据
  getCategories(): ComponentCategory[]
  getTags(): string[]
}
```

**职责**:
- 存储所有微信小程序组件的定义
- 提供快速查询和搜索
- 按分类和标签组织组件

### 3.2 ComponentEditorManager (编辑器管理器)

```typescript
class ComponentEditorManager {
  private editors: Map<string, ComponentEditor>;

  // 组件创建
  createComponent(type: string, properties?: Record<string, any>): ComponentData
  createComponents(types: string[]): ComponentData[]

  // 编辑器管理
  createEditor(component: ComponentData): ComponentEditor
  getEditor(componentId: string): ComponentEditor | undefined
  removeEditor(componentId: string): boolean
  clearEditors(): void
}
```

**职责**:
- 创建组件实例
- 管理组件编辑器的生命周期
- 提供批量操作支持

### 3.3 ComponentEditor (组件编辑器)

```typescript
class ComponentEditor {
  private component: ComponentData;
  private definition: ComponentLibraryItem;
  private propertyEditor: PropertyEditor;

  // 属性操作
  updateProperty(property: string, value: any): void
  updateProperties(properties: Record<string, any>): void
  getPropertyValue(property: string): any

  // 样式操作
  updateStyle(property: string, value: any): void
  updateStyles(styles: Record<string, any>): void
  getStyleValue(property: string): any

  // 事件绑定
  addEventBinding(binding: EventBinding): EventBinding
  updateEventBinding(id: string, updates: Partial<EventBinding>): EventBinding
  removeEventBinding(id: string): boolean
  getEventBindings(): EventBinding[]

  // 验证
  validate(): ValidationResult
}
```

**职责**:
- 管理单个组件的编辑
- 协调属性、样式、事件的编辑
- 提供验证功能

### 3.4 PropertyEditor (属性编辑器)

```typescript
class PropertyEditor {
  private config: PropertyEditorConfig;
  private changes: PropertyChange[];
  private originalValues: Record<string, any>;

  // 属性操作
  updateProperty(property: string, value: any): PropertyChange
  updateProperties(values: Record<string, any>): PropertyChange[]
  getPropertyValue(property: string): any
  getAllValues(): Record<string, any>

  // 重置
  resetProperty(property: string): PropertyChange
  resetAll(): PropertyChange[]

  // 变更追踪
  getChanges(): PropertyChange[]
  clearChanges(): void

  // 验证
  validateProperty(propDef: PropertyDefinition, value: any): ValidationResult

  // 分组
  getPropertyGroups(): string[]
  getPropertiesByGroup(group: string): PropertyDefinition[]
}
```

**职责**:
- 管理属性值的编辑
- 提供属性验证
- 追踪属性变更历史
- 支持属性分组

## 4. 数据结构设计

### 4.1 组件库条目 (ComponentLibraryItem)

```typescript
interface ComponentLibraryItem {
  id: string;                        // 组件ID
  name: string;                      // 组件名称
  label: string;                     // 显示名称
  category: ComponentCategory;       // 分类
  properties: PropertyDefinition[];  // 属性定义
  events: EventDefinition[];         // 事件定义
  canHaveChildren: boolean;          // 是否允许子组件
  isContainer: boolean;              // 是否是容器
  tags?: string[];                   // 标签
}
```

### 4.2 属性定义 (PropertyDefinition)

```typescript
interface PropertyDefinition {
  name: string;           // 属性名
  label: string;          // 显示标签
  type: PropertyType;     // 属性类型
  defaultValue?: any;     // 默认值
  required?: boolean;     // 是否必填
  options?: Option[];     // 枚举选项
  min?: number;           // 最小值
  max?: number;           // 最大值
  group?: string;         // 分组
  bindable?: boolean;     // 是否支持数据绑定
}
```

### 4.3 组件数据 (ComponentData)

```typescript
interface ComponentData {
  id: string;                       // 组件ID
  type: string;                     // 组件类型
  name?: string;                    // 组件名称
  properties: Record<string, any>;  // 属性值
  styles: Record<string, any>;      // 样式
  events: EventBinding[];           // 事件绑定
  children: ComponentData[];        // 子组件
}
```

## 5. 微信小程序组件支持

### 5.1 视图容器
- `view`: 视图容器
- `scroll-view`: 可滚动视图区域
- `swiper`: 滑块视图容器
- `swiper-item`: 滑块

### 5.2 基础内容
- `text`: 文本
- `icon`: 图标
- `progress`: 进度条
- `rich-text`: 富文本

### 5.3 表单组件
- `button`: 按钮
- `input`: 输入框
- `textarea`: 多行输入框
- `checkbox`: 多选框
- `radio`: 单选框
- `switch`: 开关选择器
- `slider`: 滑动选择器
- `picker`: 滚动选择器

### 5.4 媒体组件
- `image`: 图片
- `video`: 视频
- `audio`: 音频
- `camera`: 相机

### 5.5 其他组件
- `map`: 地图
- `canvas`: 画布
- `web-view`: 网页容器

## 6. 属性类型支持

### 6.1 基础类型
- **String**: 文本输入框
- **Number**: 数字输入框(支持 min/max/step)
- **Boolean**: 开关按钮
- **Color**: 颜色选择器
- **Image**: 图片选择器

### 6.2 复杂类型
- **Enum**: 下拉选择框
- **Object**: 对象编辑器
- **Array**: 数组编辑器
- **Expression**: 表达式编辑器

## 7. 事件绑定

### 7.1 绑定类型
- **Function**: 绑定到处理函数
- **Actions**: 可视化动作列表
- **Code**: 自定义代码

### 7.2 动作类型
- **Navigate**: 页面跳转
- **SetData**: 设置数据
- **ShowToast**: 显示提示
- **ShowModal**: 显示模态框
- **Request**: 发起网络请求
- **CallAPI**: 调用API

## 8. 验证规则

### 8.1 属性验证
- 必填验证
- 类型验证
- 范围验证(min/max)
- 格式验证(pattern)
- 枚举验证

### 8.2 组件验证
- 子组件允许性验证
- 父组件限制验证
- 必填属性验证

## 9. 性能优化

### 9.1 索引优化
- 分类索引: 快速按分类查询
- 标签索引: 快速按标签查询
- ID 索引: O(1) 组件查找

### 9.2 变更追踪
- 仅记录实际变更
- 支持批量操作
- 清除历史记录

## 10. 与 GDevelop 的对比

| GDevelop | 本模块 | 说明 |
|----------|--------|------|
| ObjectEditor | ComponentEditor | 对象编辑器 → 组件编辑器 |
| ObjectsList | ComponentLibrary | 对象列表 → 组件库 |
| PropertiesEditor | PropertyEditor | 属性编辑器(类似) |
| EventsSheet | EventBinding | 事件表 → 事件绑定 |

**主要改进**:
1. 针对微信小程序组件特性设计
2. 支持更丰富的属性类型
3. 内置组件库和验证规则
4. 更好的类型安全(TypeScript)

## 11. 测试策略

### 11.1 单元测试覆盖
- 组件库所有操作
- 属性编辑器所有功能
- 组件编辑器所有功能
- 事件绑定管理
- 验证逻辑

### 11.2 测试用例
- 正常流程
- 边界条件
- 异常处理
- 性能测试

**目标: 测试覆盖率 > 90%**

## 12. 技术选型

- **语言**: TypeScript 5.0+ (strict 模式)
- **测试框架**: Vitest
- **运行环境**: 浏览器 + Node.js(测试)

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
