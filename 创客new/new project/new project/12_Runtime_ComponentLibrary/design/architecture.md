# 组件库模块 - 架构设计文档

## 1. 模块概述

### 1.1 功能定位
本模块是微信小程序可视化开发平台的运行时组件库模块，负责管理所有可用的微信小程序组件定义，包括内置组件和自定义组件。提供组件的注册、查询、验证和模板化功能。

### 1.2 核心职责
- 定义和管理微信小程序的所有内置组件（30+）
- 提供组件注册表，支持组件的注册和查询
- 实现组件行为系统，支持可复用的行为定义
- 提供组件验证机制，验证组件属性和嵌套关系
- 支持组件模板，便于快速创建常用组件组合
- 生成组件文档，辅助开发者使用

### 1.3 与其他模块的关系
- **01_Core_ProjectStructure**: 使用其定义的 Component、ComponentProperty 等基础类型
- **06_Editor_ComponentEditor**: 为组件编辑器提供组件定义数据源
- **08_Editor_PropertyEditor**: 为属性编辑器提供属性定义和验证规则
- **09_CodeGenerator_WXMLGenerator**: 为 WXML 生成器提供组件元数据

## 2. 架构设计

### 2.1 整体架构

```
┌────────────────────────────────────────────────────────────────┐
│                     ComponentLibrary                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              ComponentRegistry                           │ │
│  │  - 组件注册表                                            │ │
│  │  - 组件索引（按ID、类型、分类）                          │ │
│  │  - 查询和过滤                                            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           BuiltinComponents                              │ │
│  │  - view-components      (视图容器)                       │ │
│  │  - content-components   (基础内容)                       │ │
│  │  - form-components      (表单组件)                       │ │
│  │  - media-components     (媒体组件)                       │ │
│  │  - map-canvas-components (地图画布)                     │ │
│  │  - navigator-components  (导航)                         │ │
│  │  - open-components       (开放能力)                     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              BehaviorSystem                              │ │
│  │  - 行为定义                                              │ │
│  │  - 行为组合                                              │ │
│  │  - 行为应用                                              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │           ComponentValidator                             │ │
│  │  - 属性验证                                              │ │
│  │  - 嵌套关系验证                                          │ │
│  │  - 必填属性验证                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │          ComponentTemplate                               │ │
│  │  - 模板定义                                              │ │
│  │  - 模板实例化                                            │ │
│  │  - 模板库管理                                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 类关系图

```
┌─────────────────────────┐
│  ComponentDefinition    │
├─────────────────────────┤
│  + id: string           │
│  + name: string         │
│  + category: Category   │
│  + properties: PropDef[]│◄────────┐
│  + events: EventDef[]   │◄──────┐ │
│  + behaviors: Behavior[]│◄────┐ │ │
│  + validationRules: []  │     │ │ │
│  + allowedChildren: []  │     │ │ │
│  + allowedParents: []   │     │ │ │
└─────────────────────────┘     │ │ │
                                │ │ │
┌─────────────────────────┐     │ │ │
│   PropertyDefinition    │─────┘ │ │
├─────────────────────────┤       │ │
│  + name: string         │       │ │
│  + type: PropertyType   │       │ │
│  + defaultValue: any    │       │ │
│  + required: boolean    │       │ │
│  + validators: []       │       │ │
└─────────────────────────┘       │ │
                                  │ │
┌─────────────────────────┐       │ │
│    EventDefinition      │───────┘ │
├─────────────────────────┤         │
│  + name: string         │         │
│  + params: EventParam[] │         │
│  + description: string  │         │
└─────────────────────────┘         │
                                    │
┌─────────────────────────┐         │
│   BehaviorDefinition    │─────────┘
├─────────────────────────┤
│  + name: string         │
│  + apply(): void        │
│  + config: object       │
└─────────────────────────┘

┌─────────────────────────┐
│  ComponentRegistry      │
├─────────────────────────┤
│  - components: Map      │
│  - categoryIndex: Map   │
│  - typeIndex: Map       │
├─────────────────────────┤
│  + register()           │
│  + getById()            │
│  + getByCategory()      │
│  + search()             │
│  + getAllComponents()   │
└─────────────────────────┘

┌─────────────────────────┐
│  ComponentValidator     │
├─────────────────────────┤
│  + validateProperties() │
│  + validateNesting()    │
│  + validateRequired()   │
│  + validateValue()      │
└─────────────────────────┘
```

### 2.3 设计模式

#### 2.3.1 Registry Pattern (注册表模式)
**ComponentRegistry** 使用注册表模式管理所有组件定义。

**优势**:
- 集中管理组件定义
- 支持动态注册和注销
- 提供统一的查询接口
- 支持多种索引方式（ID、类型、分类）

**实现要点**:
```typescript
class ComponentRegistry {
  private components: Map<string, ComponentDefinition>;
  private categoryIndex: Map<ComponentCategory, Set<string>>;
  private typeIndex: Map<string, ComponentDefinition>;

  register(definition: ComponentDefinition): void {
    // 注册到主索引
    this.components.set(definition.id, definition);
    // 注册到分类索引
    // 注册到类型索引
  }
}
```

#### 2.3.2 Strategy Pattern (策略模式)
**BehaviorSystem** 使用策略模式实现可复用的组件行为。

**优势**:
- 行为定义与组件定义分离
- 支持行为组合
- 便于扩展新行为
- 提高代码复用性

**实现要点**:
```typescript
interface Behavior {
  name: string;
  apply(component: Component): void;
}

class DraggableBehavior implements Behavior {
  apply(component: Component): void {
    // 添加拖拽相关属性和事件
  }
}
```

#### 2.3.3 Template Method Pattern (模板方法模式)
**ComponentValidator** 使用模板方法模式定义验证流程。

**优势**:
- 统一验证流程
- 支持自定义验证规则
- 便于扩展验证逻辑

**实现要点**:
```typescript
abstract class PropertyValidator {
  validate(value: any): ValidationResult {
    // 通用验证逻辑
    const typeValid = this.validateType(value);
    const rangeValid = this.validateRange(value);
    const customValid = this.validateCustom(value);
    // ...
  }

  abstract validateCustom(value: any): boolean;
}
```

#### 2.3.4 Prototype Pattern (原型模式)
**ComponentTemplate** 使用原型模式实现组件模板。

**优势**:
- 快速创建组件实例
- 支持深度克隆
- 便于创建预设组件组合

## 3. 核心类设计

### 3.1 ComponentRegistry

```typescript
/**
 * 组件注册表
 * 管理所有可用的组件定义
 */
class ComponentRegistry {
  private components: Map<string, ComponentDefinition>;
  private categoryIndex: Map<ComponentCategory, Set<string>>;
  private typeIndex: Map<string, ComponentDefinition>;

  /**
   * 注册组件
   */
  register(definition: ComponentDefinition): void;

  /**
   * 批量注册组件
   */
  registerBatch(definitions: ComponentDefinition[]): void;

  /**
   * 注销组件
   */
  unregister(id: string): boolean;

  /**
   * 根据 ID 获取组件定义
   */
  getById(id: string): ComponentDefinition | undefined;

  /**
   * 根据类型获取组件定义
   */
  getByType(type: string): ComponentDefinition | undefined;

  /**
   * 根据分类获取组件列表
   */
  getByCategory(category: ComponentCategory): ComponentDefinition[];

  /**
   * 搜索组件
   */
  search(query: ComponentSearchQuery): ComponentDefinition[];

  /**
   * 获取所有组件
   */
  getAllComponents(): ComponentDefinition[];

  /**
   * 获取所有分类
   */
  getCategories(): ComponentCategory[];

  /**
   * 检查组件是否存在
   */
  has(id: string): boolean;

  /**
   * 清空注册表
   */
  clear(): void;
}
```

### 3.2 BehaviorSystem

```typescript
/**
 * 行为接口
 */
interface Behavior {
  name: string;
  description?: string;

  /**
   * 应用行为到组件
   */
  apply(component: Component): void;

  /**
   * 移除行为
   */
  remove(component: Component): void;

  /**
   * 检查组件是否有此行为
   */
  has(component: Component): boolean;
}

/**
 * 行为管理器
 */
class BehaviorManager {
  private behaviors: Map<string, Behavior>;

  /**
   * 注册行为
   */
  register(behavior: Behavior): void;

  /**
   * 获取行为
   */
  get(name: string): Behavior | undefined;

  /**
   * 应用行为到组件
   */
  applyBehavior(component: Component, behaviorName: string): void;

  /**
   * 应用多个行为
   */
  applyBehaviors(component: Component, behaviorNames: string[]): void;

  /**
   * 移除行为
   */
  removeBehavior(component: Component, behaviorName: string): void;

  /**
   * 获取组件的所有行为
   */
  getComponentBehaviors(component: Component): string[];
}
```

### 3.3 ComponentValidator

```typescript
/**
 * 组件验证器
 */
class ComponentValidator {
  private registry: ComponentRegistry;

  /**
   * 验证组件完整性
   */
  validate(component: Component): ValidationResult;

  /**
   * 验证组件属性
   */
  validateProperties(
    component: Component,
    definition: ComponentDefinition
  ): ValidationResult;

  /**
   * 验证组件嵌套关系
   */
  validateNesting(
    parent: Component,
    child: Component
  ): ValidationResult;

  /**
   * 验证必填属性
   */
  validateRequired(
    component: Component,
    definition: ComponentDefinition
  ): ValidationResult;

  /**
   * 验证属性值
   */
  validatePropertyValue(
    property: ComponentProperty,
    definition: PropertyDefinition
  ): ValidationResult;

  /**
   * 验证组件树
   */
  validateComponentTree(components: Component[]): ValidationResult;
}
```

### 3.4 ComponentTemplate

```typescript
/**
 * 组件模板定义
 */
interface ComponentTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;

  /**
   * 模板组件树
   */
  components: Component[];

  /**
   * 模板参数
   */
  parameters?: TemplateParameter[];
}

/**
 * 模板管理器
 */
class TemplateManager {
  private templates: Map<string, ComponentTemplate>;

  /**
   * 注册模板
   */
  register(template: ComponentTemplate): void;

  /**
   * 获取模板
   */
  get(id: string): ComponentTemplate | undefined;

  /**
   * 实例化模板
   */
  instantiate(
    templateId: string,
    parameters?: Record<string, any>
  ): Component[];

  /**
   * 获取所有模板
   */
  getAllTemplates(): ComponentTemplate[];

  /**
   * 根据分类获取模板
   */
  getByCategory(category: string): ComponentTemplate[];
}
```

## 4. 数据结构设计

### 4.1 核心接口

#### ComponentDefinition
```typescript
/**
 * 组件定义
 */
interface ComponentDefinition {
  /** 组件ID（唯一标识） */
  id: string;

  /** 组件名称（如 'view'） */
  name: string;

  /** 组件显示名称 */
  label: string;

  /** 组件描述 */
  description?: string;

  /** 组件分类 */
  category: ComponentCategory;

  /** 组件图标 */
  icon?: string;

  /** 组件标签（用于搜索） */
  tags?: string[];

  /** 组件属性定义列表 */
  properties: PropertyDefinition[];

  /** 组件事件定义列表 */
  events: EventDefinition[];

  /** 是否允许有子组件 */
  canHaveChildren: boolean;

  /** 允许的父组件类型（空表示不限制） */
  allowedParents?: string[];

  /** 允许的子组件类型（空表示不限制） */
  allowedChildren?: string[];

  /** 默认样式 */
  defaultStyle?: Record<string, any>;

  /** 默认属性值 */
  defaultProperties?: Record<string, any>;

  /** 是否是容器组件 */
  isContainer: boolean;

  /** 是否是内联组件 */
  isInline: boolean;

  /** 组件行为 */
  behaviors?: string[];

  /** 组件使用示例 */
  example?: string;

  /** 官方文档链接 */
  docUrl?: string;
}
```

#### PropertyDefinition
```typescript
/**
 * 属性定义
 */
interface PropertyDefinition {
  /** 属性名称 */
  name: string;

  /** 属性标签 */
  label: string;

  /** 属性类型 */
  type: PropertyType;

  /** 默认值 */
  defaultValue?: any;

  /** 属性描述 */
  description?: string;

  /** 是否必填 */
  required?: boolean;

  /** 枚举选项 */
  options?: PropertyOption[];

  /** 数值范围 */
  min?: number;
  max?: number;
  step?: number;

  /** 字符串验证 */
  pattern?: string;
  minLength?: number;
  maxLength?: number;

  /** 属性分组 */
  group?: string;

  /** 是否支持数据绑定 */
  bindable?: boolean;

  /** 是否显示在编辑器中 */
  visible?: boolean;

  /** 条件显示 */
  visibleWhen?: PropertyCondition;

  /** 自定义验证器 */
  validator?: (value: any) => ValidationResult;
}
```

#### BehaviorDefinition
```typescript
/**
 * 行为定义
 */
interface BehaviorDefinition {
  /** 行为名称 */
  name: string;

  /** 行为描述 */
  description?: string;

  /** 行为添加的属性 */
  addedProperties?: PropertyDefinition[];

  /** 行为添加的事件 */
  addedEvents?: EventDefinition[];

  /** 行为配置 */
  config?: Record<string, any>;
}
```

### 4.2 数据约束

#### 组件定义约束
- `id`: 必须唯一，建议格式为 "wechat-{component-name}"
- `name`: 必须是有效的微信小程序组件名称
- `properties`: 属性名必须符合微信小程序规范
- `allowedChildren`: 必须是已注册的组件类型

#### 属性定义约束
- `name`: 不能为空
- `type`: 必须是有效的 PropertyType
- `defaultValue`: 类型必须与 type 匹配
- `options`: 当 type 为 Enum 时必填
- `min/max`: 当 type 为 Number 时有效

#### 行为定义约束
- `name`: 必须唯一
- `addedProperties`: 属性名不能与组件原有属性冲突

## 5. 内置组件设计

### 5.1 组件分类

#### 视图容器 (View Container)
- **view**: 视图容器
- **scroll-view**: 可滚动视图区域
- **swiper**: 滑块视图容器
- **swiper-item**: 滑块子项
- **movable-view**: 可移动视图
- **movable-area**: 可移动区域
- **cover-view**: 覆盖在原生组件上的视图
- **cover-image**: 覆盖在原生组件上的图片

#### 基础内容 (Basic Content)
- **text**: 文本
- **icon**: 图标
- **progress**: 进度条
- **rich-text**: 富文本

#### 表单组件 (Form)
- **button**: 按钮
- **checkbox**: 多选框
- **checkbox-group**: 多选框组
- **form**: 表单
- **input**: 输入框
- **label**: 标签
- **picker**: 选择器
- **picker-view**: 嵌入式选择器
- **picker-view-column**: 选择器列
- **radio**: 单选框
- **radio-group**: 单选框组
- **slider**: 滑动选择器
- **switch**: 开关选择器
- **textarea**: 多行输入框

#### 媒体组件 (Media)
- **image**: 图片
- **video**: 视频
- **audio**: 音频
- **camera**: 相机

#### 地图画布 (Map & Canvas)
- **map**: 地图
- **canvas**: 画布

#### 导航 (Navigation)
- **navigator**: 页面链接
- **functional-page-navigator**: 功能页导航

#### 开放能力 (Open Ability)
- **web-view**: 网页容器
- **ad**: 广告
- **official-account**: 公众号关注
- **open-data**: 开放数据

### 5.2 组件定义示例

以 `view` 组件为例：

```typescript
const viewComponent: ComponentDefinition = {
  id: 'wechat-view',
  name: 'view',
  label: '视图容器',
  description: '视图容器，类似 HTML 的 div',
  category: ComponentCategory.ViewContainer,
  icon: 'view',
  tags: ['容器', 'view', '布局'],

  properties: [
    {
      name: 'hover-class',
      label: '指定按下去的样式类',
      type: PropertyType.String,
      defaultValue: 'none',
      description: '指定按下去的样式类。当 hover-class="none" 时，没有点击态效果',
      group: '交互',
    },
    {
      name: 'hover-start-time',
      label: '按住后多久出现点击态',
      type: PropertyType.Number,
      defaultValue: 50,
      min: 0,
      description: '按住后多久出现点击态，单位毫秒',
      group: '交互',
    },
    {
      name: 'hover-stay-time',
      label: '手指松开后点击态保留时间',
      type: PropertyType.Number,
      defaultValue: 400,
      min: 0,
      description: '手指松开后点击态保留时间，单位毫秒',
      group: '交互',
    },
    {
      name: 'hover-stop-propagation',
      label: '阻止祖先节点出现点击态',
      type: PropertyType.Boolean,
      defaultValue: false,
      group: '交互',
    },
  ],

  events: [
    {
      name: 'tap',
      label: '点击',
      description: '手指触摸后马上离开',
    },
    {
      name: 'longpress',
      label: '长按',
      description: '手指触摸后，超过350ms再离开',
    },
    {
      name: 'touchstart',
      label: '触摸开始',
      description: '手指触摸动作开始',
    },
    {
      name: 'touchmove',
      label: '触摸移动',
      description: '手指触摸后移动',
    },
    {
      name: 'touchend',
      label: '触摸结束',
      description: '手指触摸动作结束',
    },
    {
      name: 'touchcancel',
      label: '触摸取消',
      description: '手指触摸动作被打断',
    },
  ],

  canHaveChildren: true,
  isContainer: true,
  isInline: false,

  defaultStyle: {
    display: 'block',
  },

  example: `<view class="container">
  <text>Hello World</text>
</view>`,

  docUrl: 'https://developers.weixin.qq.com/miniprogram/dev/component/view.html',
};
```

## 6. 验证机制

### 6.1 验证类型

#### 属性验证
- 类型验证：检查属性值类型是否匹配
- 范围验证：检查数值是否在有效范围内
- 格式验证：检查字符串格式是否正确
- 必填验证：检查必填属性是否提供

#### 嵌套验证
- 父子关系验证：检查子组件是否允许嵌套在父组件中
- 深度验证：检查嵌套深度是否超过限制
- 循环引用验证：检查是否存在循环引用

#### 完整性验证
- 组件定义完整性：检查组件定义是否完整
- 引用有效性：检查引用的组件是否存在

### 6.2 验证流程

```
验证开始
  ↓
验证组件定义存在
  ↓
验证必填属性
  ↓
验证属性类型和值
  ↓
验证嵌套关系
  ↓
验证子组件（递归）
  ↓
返回验证结果
```

## 7. 性能优化

### 7.1 索引优化
- 多级索引：ID 索引、类型索引、分类索引
- 延迟加载：组件定义按需加载
- 缓存机制：缓存查询结果

### 7.2 内存优化
- 共享定义：相同组件共享定义对象
- 弱引用：使用 WeakMap 存储临时数据
- 及时清理：定期清理未使用的缓存

### 7.3 查询优化
- 全文搜索索引：支持快速搜索
- 分页加载：大量组件时分页返回
- 过滤优化：多条件组合查询优化

## 8. 扩展性设计

### 8.1 自定义组件支持
```typescript
// 注册自定义组件
registry.register({
  id: 'custom-card',
  name: 'card',
  category: ComponentCategory.Custom,
  // ...
});
```

### 8.2 插件机制
```typescript
interface ComponentPlugin {
  name: string;
  onRegister?: (definition: ComponentDefinition) => void;
  onValidate?: (component: Component) => ValidationResult;
}
```

### 8.3 行为扩展
```typescript
// 注册自定义行为
behaviorManager.register({
  name: 'customBehavior',
  apply(component) {
    // 自定义逻辑
  },
});
```

## 9. 文档生成

### 9.1 自动文档生成
- 组件列表文档
- 属性说明文档
- 事件说明文档
- 使用示例文档

### 9.2 文档格式
- Markdown 格式
- 包含类型定义
- 包含使用示例
- 包含官方文档链接

## 10. 测试策略

### 10.1 单元测试覆盖
- ComponentRegistry 所有方法
- BehaviorSystem 所有方法
- ComponentValidator 所有方法
- 所有内置组件定义

### 10.2 测试用例设计
1. **注册和查询**: 组件的注册、查询、批量操作
2. **验证**: 属性验证、嵌套验证、必填验证
3. **行为**: 行为应用、行为移除、行为组合
4. **模板**: 模板注册、实例化、参数化
5. **边界条件**: 空值、无效值、边界值

目标: **测试覆盖率 > 90%**

## 11. 技术选型

- **语言**: TypeScript 4.9+
- **测试框架**: Vitest
- **文档生成**: TypeDoc
- **验证**: 自定义验证器

## 12. 未来优化方向

1. **组件市场**: 支持组件分享和下载
2. **智能推荐**: 根据使用场景推荐合适的组件
3. **版本管理**: 支持组件定义的版本控制
4. **国际化**: 支持多语言组件定义
5. **可视化编辑**: 组件定义的可视化编辑器

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
