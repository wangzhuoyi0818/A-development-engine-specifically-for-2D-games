# 变量系统架构设计

## 1. 概述

本文档描述微信小程序可视化开发平台的变量系统架构设计。该系统基于 GDevelop 的变量管理机制,并扩展了响应式数据绑定和路径解析功能。

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    应用层                                  │
│  (页面编辑器、组件编辑器、事件编辑器)                         │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                响应式管理层                                │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ ReactiveManager  │  │ Data Binding     │              │
│  │  - Watch         │  │  - One-way       │              │
│  │  - Computed      │  │  - Two-way       │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                变量解析层                                  │
│  ┌──────────────────────────────────────────────┐        │
│  │         VariableResolver                     │        │
│  │  - Path Parsing                              │        │
│  │  - Value Access (get/set)                    │        │
│  │  - Path Operations (copy/move/delete)        │        │
│  └──────────────────────────────────────────────┘        │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                变量管理层                                  │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ Variables        │  │ Variable         │              │
│  │ Container        │  │  - Number        │              │
│  │  - Insert        │  │  - String        │              │
│  │  - Remove        │  │  - Boolean       │              │
│  │  - Rename        │  │  - Structure     │              │
│  │  - Serialize     │  │  - Array         │              │
│  └──────────────────┘  └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

#### 2.2.1 Variable 类
- 表示单个变量,支持多种数据类型
- 管理变量的值和类型
- 支持结构体和数组的嵌套操作
- 提供序列化和克隆功能

#### 2.2.2 VariablesContainer 类
- 管理一组变量的容器
- 支持变量的增删改查
- 区分不同作用域 (Global, Scene, Object)
- 提供批量操作和遍历功能

#### 2.2.3 VariableResolver 类
- 解析变量路径 (如 "player.health", "items[0]")
- 提供便捷的值访问接口
- 支持路径操作 (复制、移动、删除)
- 处理路径不存在的情况

#### 2.2.4 ReactiveManager 类
- 实现响应式数据绑定
- 支持变量监听 (watch)
- 支持计算属性 (computed)
- 管理依赖关系和更新通知

## 3. 类设计

### 3.1 Variable 类

```typescript
class Variable {
  // 类型
  private type: VariableType;

  // 值存储
  private numberValue: number;
  private stringValue: string;
  private boolValue: boolean;
  private children: Map<string, Variable>;  // 结构体子变量
  private childrenArray: Variable[];         // 数组子变量

  // 元数据
  private folded: boolean;
  private persistentUuid: string;

  // 构造和类型转换
  constructor(initialValue?: VariableValue)
  getType(): VariableType
  castTo(newType: VariableType): void

  // 基本类型操作
  getValue(): number
  setValue(value: number): void
  getString(): string
  setString(value: string): void
  getBool(): boolean
  setBool(value: boolean): void

  // 结构体操作
  hasChild(name: string): boolean
  getChild(name: string): Variable
  removeChild(name: string): boolean
  renameChild(oldName: string, newName: string): boolean

  // 数组操作
  getAtIndex(index: number): Variable
  pushNew(): Variable
  removeAtIndex(index: number): boolean
  insertAtIndex(variable: Variable, index: number): boolean

  // 工具方法
  clone(): Variable
  equals(other: Variable): boolean
  toJSON(): SerializedVariable
  static fromJSON(json: SerializedVariable): Variable
}
```

### 3.2 VariablesContainer 类

```typescript
class VariablesContainer {
  private sourceType: VariableSourceType;
  private variables: Array<{name: string, variable: Variable}>;
  private persistentUuid: string;

  // 基本操作
  has(name: string): boolean
  get(name: string): Variable
  insertNew(name: string, position?: number): Variable
  insert(name: string, variable: Variable, position?: number): Variable
  remove(name: string): boolean
  rename(oldName: string, newName: string): boolean
  clear(): void

  // 位置操作
  getAt(index: number): Variable | null
  getNameAt(index: number): string | null
  getPosition(name: string): number
  swap(firstIndex: number, secondIndex: number): boolean
  move(oldIndex: number, newIndex: number): boolean

  // 遍历
  forEach(callback: (name: string, variable: Variable, index: number) => void): void
  filter(predicate: (name: string, variable: Variable) => boolean): Array<{...}>

  // 序列化
  toJSON(): SerializedVariablesContainer
  static fromJSON(json: SerializedVariablesContainer): VariablesContainer
}
```

### 3.3 VariableResolver 类

```typescript
class VariableResolver {
  private container: VariablesContainer;

  // 路径解析
  parsePath(path: string): ParsedPath
  resolve(path: string, createIfNotExist?: boolean): Variable | null

  // 值访问
  getValue(path: string, defaultValue?: VariableValue): VariableValue
  setValue(path: string, value: VariableValue, createIfNotExist?: boolean): VariableOperationResult
  exists(path: string): boolean
  delete(path: string): VariableOperationResult

  // 路径工具
  normalizePath(path: string): string
  splitPath(path: string): {parent: string, child: string | number} | null
  validatePath(path: string): VariableOperationResult
  listChildren(path: string): string[]

  // 批量操作
  getValues(paths: string[]): Record<string, VariableValue>
  setValues(values: Record<string, VariableValue>): VariableOperationResult

  // 高级操作
  copy(sourcePath: string, targetPath: string): VariableOperationResult
  move(sourcePath: string, targetPath: string): VariableOperationResult
}
```

### 3.4 ReactiveManager 类

```typescript
class ReactiveManager {
  private resolver: VariableResolver;
  private watchers: Map<string, Watcher[]>;
  private computed: Map<string, ComputedProperty>;

  // Watch
  watch(path: string, callback: WatchCallback, options?: WatchOptions): Watcher
  unwatch(watcherId: string, path: string): void
  unwatchAll(): void

  // Computed
  defineComputed(name: string, getter: ComputedGetter, dependencies: string[]): ComputedProperty
  getComputed(name: string): VariableValue
  removeComputed(name: string): boolean
  watchComputed(name: string, callback: WatchCallback, options?: WatchOptions): Watcher

  // Reactive Set/Get
  set(path: string, value: VariableValue): void
  get(path: string, defaultValue?: VariableValue): VariableValue
  batchSet(values: Record<string, VariableValue>): void

  // Data Binding
  bind(sourcePath: string, targetPath: string, bidirectional?: boolean): Watcher[]
  unbind(watchers: Watcher[]): void

  // Utilities
  dispose(): void
  debug(): string
}
```

## 4. 数据类型设计

### 4.1 VariableType 枚举

```typescript
enum VariableType {
  Unknown = 'Unknown',
  Number = 'Number',
  String = 'String',
  Boolean = 'Boolean',
  Structure = 'Structure',  // 对象
  Array = 'Array',
}
```

### 4.2 VariableValue 联合类型

```typescript
type VariableValue =
  | number
  | string
  | boolean
  | { [key: string]: VariableValue }
  | VariableValue[]
  | null
  | undefined;
```

### 4.3 变量路径解析

支持的路径格式:
- `variableName` - 简单变量
- `object.property` - 对象属性访问
- `array[0]` - 数组索引访问
- `obj["key"]` - 方括号字符串键访问
- `player.inventory.items[0].name` - 复杂嵌套路径

路径段类型:
```typescript
enum PathSegmentType {
  Property = 'Property',  // .property
  Index = 'Index',        // [index]
}

interface PathSegment {
  type: PathSegmentType;
  value: string | number;
}

interface ParsedPath {
  root: string;
  segments: PathSegment[];
  raw: string;
}
```

## 5. 变量作用域

### 5.1 作用域类型

```typescript
enum VariableSourceType {
  Unknown = 'Unknown',
  Global = 'Global',           // 全局变量
  Scene = 'Scene',             // 页面变量
  Object = 'Object',           // 组件变量
  Local = 'Local',             // 局部变量 (事件中)
  ExtensionGlobal = 'ExtensionGlobal',
  ExtensionScene = 'ExtensionScene',
  Parameters = 'Parameters',   // 参数变量
  Properties = 'Properties',   // 属性变量
}
```

### 5.2 作用域优先级

查找变量时的优先级顺序:
1. Local (局部变量)
2. Object (组件变量)
3. Scene (页面变量)
4. Global (全局变量)

## 6. 响应式系统设计

### 6.1 监听机制

```typescript
interface Watcher {
  id: string;
  path: string;
  callback: WatchCallback;
  options: WatchOptions;
  unwatch: () => void;
}

interface WatchOptions {
  immediate?: boolean;  // 立即执行回调
  deep?: boolean;       // 深度监听
  context?: any;        // 回调上下文
}

type WatchCallback = (newValue: VariableValue, oldValue: VariableValue) => void;
```

#### 监听流程:
1. 注册监听器 `watch(path, callback, options)`
2. 变量值改变时触发 `notifyWatchers(path, newValue, oldValue)`
3. 执行所有该路径的回调函数
4. 如果启用 deep,触发父路径的深度监听

### 6.2 计算属性

```typescript
interface ComputedProperty {
  id: string;
  name: string;
  getter: ComputedGetter;
  dependencies: string[];
  cachedValue?: VariableValue;
  dirty: boolean;  // 是否需要重新计算
}

type ComputedGetter = () => VariableValue;
```

#### 计算流程:
1. 定义计算属性 `defineComputed(name, getter, dependencies)`
2. 自动监听所有依赖的变量
3. 依赖变化时标记为 dirty
4. 获取值时检查 dirty,如需要则重新计算并缓存
5. 返回缓存值

### 6.3 批量更新优化

```typescript
private batchUpdateQueue: Set<string>;
private batchUpdateTimer: any;

batchSet(values: Record<string, VariableValue>): void {
  // 1. 收集所有更新路径
  for (const path of Object.keys(values)) {
    this.batchUpdateQueue.add(path);
  }

  // 2. 立即设置所有值
  this.resolver.setValues(values);

  // 3. 延迟触发监听器 (避免频繁触发)
  clearTimeout(this.batchUpdateTimer);
  this.batchUpdateTimer = setTimeout(() => {
    this.flushBatchUpdates();
  }, 0);
}
```

## 7. 序列化设计

### 7.1 Variable 序列化

```typescript
interface SerializedVariable {
  type: VariableType;
  value?: number | string | boolean;
  children?: { [key: string]: SerializedVariable };
  childrenArray?: SerializedVariable[];
  persistentUuid?: string;
  folded?: boolean;
}
```

### 7.2 VariablesContainer 序列化

```typescript
interface SerializedVariablesContainer {
  sourceType: VariableSourceType;
  variables: Array<{
    name: string;
    variable: SerializedVariable;
  }>;
  persistentUuid?: string;
}
```

### 7.3 序列化用途

- **项目保存**: 将变量系统状态保存到文件
- **网络传输**: 在编辑器和预览器之间同步数据
- **版本控制**: 跟踪变量结构的变更
- **撤销/重做**: 保存历史状态快照

## 8. 性能优化

### 8.1 优化策略

1. **值缓存**: 计算属性缓存结果,避免重复计算
2. **批量更新**: 合并多次赋值,减少监听器触发次数
3. **路径规范化**: 缓存解析后的路径,避免重复解析
4. **浅拷贝优化**: 对于不可变操作使用浅拷贝
5. **惰性创建**: 变量路径不存在时才自动创建

### 8.2 内存管理

- 使用 `unwatch()` 及时移除不需要的监听器
- 使用 `dispose()` 清理响应式管理器
- 避免循环引用导致的内存泄漏

## 9. 扩展性设计

### 9.1 自定义类型支持

可以通过继承 Variable 类来支持自定义类型:

```typescript
class CustomVariable extends Variable {
  // 实现自定义类型逻辑
}
```

### 9.2 插件系统

可以通过插件扩展变量系统功能:

```typescript
interface VariablePlugin {
  name: string;
  beforeSet?(path: string, value: VariableValue): void;
  afterSet?(path: string, value: VariableValue): void;
  beforeGet?(path: string): void;
  afterGet?(path: string, value: VariableValue): VariableValue;
}
```

## 10. 总结

变量系统是整个平台的核心数据管理模块,具有以下特点:

- **完整性**: 支持多种数据类型和复杂嵌套结构
- **灵活性**: 支持路径访问和动态创建
- **响应式**: 提供 watch 和 computed 机制
- **可序列化**: 完整的序列化和反序列化支持
- **高性能**: 采用多种优化策略减少开销
- **可扩展**: 预留插件和扩展接口

该设计为后续的事件系统、组件编辑器、代码生成器等模块提供了强大的数据管理基础。
