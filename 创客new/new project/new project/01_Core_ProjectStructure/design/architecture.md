# 项目结构管理模块 - 架构设计文档

## 1. 模块概述

### 1.1 功能定位
本模块是微信小程序可视化开发平台的核心基础模块,负责管理整个小程序项目的结构、配置、页面和组件树。类似于 GDevelop 的 `gd::Project` 和 `gd::Layout`,但专门针对微信小程序的特性进行了设计。

### 1.2 核心职责
- 管理小程序项目的元数据(名称、版本、描述、appId等)
- 管理项目配置(app.json 对应的配置信息)
- 管理页面列表及页面配置
- 管理组件树结构(页面内的组件层级关系)
- 提供项目序列化和反序列化功能
- 管理全局变量和资源

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    MiniProgramProject                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  项目元数据: id, name, version, appId, description   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ProjectConfig (app.json)                            │  │
│  │    - WindowConfig                                     │  │
│  │    - TabBarConfig                                     │  │
│  │    - NetworkTimeout                                   │  │
│  │    - Permission                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages[]                                             │  │
│  │    ┌──────────────────────────────────────────┐     │  │
│  │    │  Page                                    │     │  │
│  │    │    - PageConfig                          │     │  │
│  │    │    - Component[] (组件树)                │     │  │
│  │    │    - Variables                           │     │  │
│  │    │    - LifecycleEvents                     │     │  │
│  │    └──────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GlobalComponents[], Resources[], Variables          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           MiniProgramProjectManager                         │
│  - createProject()     创建新项目                           │
│  - getProject()        获取项目                             │
│  - addPage()           添加页面                             │
│  - removePage()        删除页面                             │
│  - updatePage()        更新页面                             │
│  - serializeProject()  序列化项目                           │
│  - deserializeProject() 反序列化项目                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           ComponentTreeManager                              │
│  - addComponent()      添加组件到页面                       │
│  - removeComponent()   从页面删除组件                       │
│  - moveComponent()     移动组件位置                         │
│  - findComponent()     查找组件                             │
│  - getComponentPath()  获取组件路径                         │
│  - updateComponent()   更新组件属性                         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 类关系图

```
┌──────────────────────┐
│ MiniProgramProject   │
├──────────────────────┤
│ + id: string         │
│ + name: string       │
│ + version: string    │
│ + config: Config     │◄──────┐
│ + pages: Page[]      │◄────┐ │
└──────────────────────┘     │ │
                             │ │
┌──────────────────────┐     │ │
│ ProjectConfig        │─────┘ │
├──────────────────────┤       │
│ + window: Window     │       │
│ + tabBar?: TabBar    │       │
└──────────────────────┘       │
                               │
┌──────────────────────┐       │
│ Page                 │───────┘
├──────────────────────┤
│ + id: string         │
│ + name: string       │
│ + path: string       │
│ + components: Comp[] │◄──────┐
│ + config: PageConfig │       │
└──────────────────────┘       │
                               │
┌──────────────────────┐       │
│ Component            │───────┘
├──────────────────────┤
│ + id: string         │
│ + type: string       │
│ + properties: Prop[] │
│ + children: Comp[]   │◄─── 递归引用(树形结构)
│ + events: Event[]    │
└──────────────────────┘
```

### 2.3 设计模式

#### 2.3.1 Manager Pattern (管理器模式)
- **MiniProgramProjectManager**: 管理所有项目实例,提供统一的项目操作接口
- **ComponentTreeManager**: 管理组件树的操作,封装树形结构的增删改查逻辑

**优势**:
- 集中管理复杂逻辑
- 隔离数据结构和操作逻辑
- 便于单元测试和模拟

#### 2.3.2 Composite Pattern (组合模式)
- **Component**: 组件包含 children 数组,形成树形结构
- 统一处理单个组件和组件树

**优势**:
- 自然表达层级关系
- 递归操作简单直观
- 符合微信小程序的组件嵌套特性

#### 2.3.3 Builder Pattern (构建器模式)
- 通过 Manager 类的方法链式调用构建复杂的项目结构
- 提供合理的默认值

**优势**:
- 简化复杂对象的创建过程
- 提供清晰的 API
- 确保对象的一致性

#### 2.3.4 Serialization Pattern (序列化模式)
- 提供 JSON 序列化和反序列化
- 支持项目的保存和加载

**优势**:
- 与微信小程序配置格式一致
- 便于版本控制和云端存储
- 易于调试和人工编辑

## 3. 核心类设计

### 3.1 MiniProgramProjectManager

```typescript
class MiniProgramProjectManager {
  private projects: Map<string, MiniProgramProject>;

  // 项目生命周期管理
  createProject(name: string, options?: ProjectOptions): MiniProgramProject
  deleteProject(projectId: string): void
  getProject(projectId: string): MiniProgramProject
  hasProject(projectId: string): boolean
  listProjects(): MiniProgramProject[]

  // 页面管理
  addPage(projectId: string, page: Partial<Page>): Page
  removePage(projectId: string, pageId: string): void
  updatePage(projectId: string, pageId: string, updates: Partial<Page>): Page
  getPage(projectId: string, pageId: string): Page
  reorderPages(projectId: string, pageIds: string[]): void

  // 序列化
  serializeProject(projectId: string): string
  deserializeProject(json: string): MiniProgramProject

  // 配置管理
  updateProjectConfig(projectId: string, config: Partial<ProjectConfig>): void
  updateWindowConfig(projectId: string, config: Partial<WindowConfig>): void
  updateTabBarConfig(projectId: string, config: Partial<TabBarConfig>): void

  // 事务支持
  beginTransaction(projectId: string): Transaction
  commitTransaction(transaction: Transaction): void
  rollbackTransaction(transaction: Transaction): void
}
```

**职责**:
- 管理项目的创建、删除、获取
- 管理页面的增删改查
- 提供序列化和反序列化功能
- 提供事务支持确保数据一致性

### 3.2 ComponentTreeManager

```typescript
class ComponentTreeManager {
  // 组件树操作
  addComponent(page: Page, component: Component, parentId?: string, index?: number): void
  removeComponent(page: Page, componentId: string): boolean
  moveComponent(page: Page, componentId: string, newParentId?: string, index?: number): void
  updateComponent(page: Page, componentId: string, updates: Partial<Component>): Component

  // 查询操作
  findComponent(components: Component[], componentId: string): Component | null
  findComponentsByType(components: Component[], type: string): Component[]
  getComponentPath(components: Component[], componentId: string): string[]
  getComponentParent(page: Page, componentId: string): Component | null

  // 树形遍历
  traverseComponents(components: Component[], visitor: (component: Component) => void): void
  validateComponentTree(components: Component[]): ValidationResult

  // 辅助方法
  private removeComponentRecursive(components: Component[], componentId: string): boolean
  private cloneComponent(component: Component): Component
}
```

**职责**:
- 管理组件树的增删改查
- 提供组件查找和路径查询
- 支持组件的移动和复制
- 验证组件树的有效性

## 4. 数据结构设计

### 4.1 核心接口

#### MiniProgramProject
```typescript
interface MiniProgramProject {
  id: string;                    // 项目唯一标识
  name: string;                  // 项目名称
  version: string;               // 版本号 (语义化版本)
  description?: string;          // 项目描述
  appId?: string;                // 微信小程序 AppID

  config: ProjectConfig;         // 项目配置
  pages: Page[];                 // 页面列表
  globalComponents: Component[]; // 全局组件
  resources: Resource[];         // 资源列表
  globalVariables: Variable[];   // 全局变量

  createdAt: Date;               // 创建时间
  updatedAt: Date;               // 更新时间
}
```

#### ProjectConfig
```typescript
interface ProjectConfig {
  window: WindowConfig;              // 全局窗口配置
  tabBar?: TabBarConfig;             // 底部标签栏配置
  networkTimeout?: NetworkTimeout;   // 网络超时配置
  permission?: Permission;           // 权限配置
  debug?: boolean;                   // 是否开启调试模式
  subPackages?: SubPackage[];        // 分包配置
}
```

#### Page
```typescript
interface Page {
  id: string;                    // 页面唯一标识
  name: string;                  // 页面名称
  path: string;                  // 页面路径 (如 "pages/index/index")

  config: PageConfig;            // 页面配置
  components: Component[];       // 组件树根节点列表
  data: Record<string, any>;     // 页面数据
  variables: Variable[];         // 页面变量

  lifecycleEvents: Event[];      // 生命周期事件
  customEvents: Event[];         // 自定义事件
}
```

#### Component
```typescript
interface Component {
  id: string;                    // 组件唯一标识
  type: string;                  // 组件类型 ('view', 'text', 'button' 等)
  name?: string;                 // 组件名称(可选)

  properties: ComponentProperty[]; // 组件属性列表
  style: ComponentStyle;           // 组件样式
  events: ComponentEvent[];        // 组件事件
  children: Component[];           // 子组件列表
  dataBindings: DataBinding[];     // 数据绑定
}
```

### 4.2 数据约束

#### 项目级别约束
- `id`: 必须唯一,使用 UUID v4
- `name`: 非空,长度 1-50 字符
- `version`: 必须符合语义化版本规范 (如 "1.0.0")
- `pages`: 至少包含一个页面

#### 页面级别约束
- `path`: 必须符合微信小程序路径规范 (如 "pages/index/index")
- `path`: 在同一项目内必须唯一
- 首页必须是 pages 数组的第一个元素

#### 组件级别约束
- `type`: 必须是有效的微信小程序组件类型
- `children`: 某些组件不允许有子组件 (如 input, image)
- 组件嵌套深度建议不超过 10 层

## 5. 事务管理

### 5.1 事务设计

```typescript
interface Transaction {
  id: string;
  projectId: string;
  operations: Operation[];
  createdAt: Date;
}

interface Operation {
  type: 'add' | 'remove' | 'update';
  target: 'project' | 'page' | 'component';
  data: any;
  rollbackData?: any;
}
```

### 5.2 事务流程

```
1. beginTransaction()
   └─> 创建事务对象
   └─> 记录当前状态快照

2. 执行操作
   └─> 每个操作记录到 operations 数组
   └─> 记录回滚所需数据

3. commitTransaction() / rollbackTransaction()
   └─> commit: 清理事务对象
   └─> rollback: 逆序执行回滚操作
```

## 6. 异常处理

### 6.1 异常类型

```typescript
class ProjectError extends Error {
  code: string;
  details?: any;
}

// 具体错误类型
class ProjectNotFoundError extends ProjectError {}
class PageNotFoundError extends ProjectError {}
class ComponentNotFoundError extends ProjectError {}
class ValidationError extends ProjectError {}
class SerializationError extends ProjectError {}
```

### 6.2 异常处理策略

1. **参数验证**: 所有公共方法必须验证输入参数
2. **错误传播**: 使用明确的错误类型,不吞噬异常
3. **事务回滚**: 发生错误时自动回滚事务
4. **日志记录**: 记录所有错误和警告
5. **用户提示**: 提供清晰的错误消息

## 7. 性能优化

### 7.1 优化策略

1. **延迟加载**: 大型项目的页面和组件按需加载
2. **缓存机制**: 缓存常用的查询结果
3. **索引优化**: 为常用查询建立索引 (如 componentId -> component)
4. **增量序列化**: 只序列化变更的部分
5. **批量操作**: 支持批量添加/删除组件

### 7.2 内存管理

1. **弱引用**: 对于临时对象使用 WeakMap
2. **及时清理**: 删除项目时释放所有关联资源
3. **循环引用检测**: 检测并防止组件树中的循环引用

## 8. 扩展性设计

### 8.1 插件机制

```typescript
interface ProjectPlugin {
  name: string;
  version: string;
  onProjectCreated?(project: MiniProgramProject): void;
  onPageAdded?(page: Page): void;
  onComponentAdded?(component: Component): void;
}
```

### 8.2 事件系统

```typescript
interface EventEmitter {
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
  emit(event: string, data: any): void;
}

// 使用示例
manager.on('project:created', (project) => {
  console.log('项目创建:', project.name);
});
```

## 9. 测试策略

### 9.1 单元测试覆盖

- 项目管理器所有公共方法
- 组件树管理器所有公共方法
- 序列化和反序列化
- 异常处理
- 边界条件

### 9.2 测试用例设计

1. **正常流程**: 创建、读取、更新、删除
2. **边界条件**: 空项目、单页面、深层嵌套
3. **异常情况**: 无效参数、不存在的ID、循环引用
4. **并发操作**: 多个事务同时修改
5. **序列化**: 大型项目的序列化性能

目标: **测试覆盖率 > 90%**

## 10. 与 GDevelop 的对比

| GDevelop | 本模块 | 说明 |
|----------|--------|------|
| gd::Project | MiniProgramProject | 项目根对象 |
| gd::Layout | Page | 场景 → 页面 |
| gd::Object | Component | 对象 → 组件 |
| gd::Layer | (移除) | 微信小程序无图层概念 |
| gd::ResourcesManager | Resource[] | 简化为数组 |
| gd::VariablesContainer | Variable[] | 简化为数组 |

## 11. 技术选型

- **语言**: TypeScript 4.9+
- **测试框架**: Vitest
- **验证库**: Zod (用于数据验证)
- **UUID生成**: uuid
- **深拷贝**: structuredClone (原生支持)

## 12. 未来优化方向

1. **版本控制**: 支持项目的版本历史和回滚
2. **协作编辑**: 支持多人协作编辑
3. **模板系统**: 提供项目和页面模板
4. **自动布局**: 智能组件布局建议
5. **性能分析**: 项目性能分析工具

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-23
**维护者**: AI Assistant
