# 页面编辑器 - 架构设计

## 概述

页面编辑器(PageEditor)是微信小程序可视化开发平台的核心编辑器组件,提供所见即所得的页面设计能力。

**参考来源**: GDevelop SceneEditor + InstancesEditor

**核心功能**:
- 可视化画布,支持组件拖拽、选择、编辑
- 组件变换(移动、缩放、旋转)
- 网格对齐和吸附
- 撤销/重做
- 多选和批量操作
- 组件树管理

---

## 整体架构

### 架构分层

```
┌─────────────────────────────────────────────────────┐
│               React 组件层 (UI)                        │
│  ┌──────────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ SceneEditor  │  │ Toolbar  │  │ PropertyPanel│   │
│  │              │  └──────────┘  └──────────────┘   │
│  │  ┌────────┐  │  ┌──────────────┐                 │
│  │  │ Canvas │  │  │ LayerPanel   │                 │
│  │  └────────┘  │  └──────────────┘                 │
│  └──────────────┘                                    │
└─────────────────────────────────────────────────────┘
                      ↓ 调用
┌─────────────────────────────────────────────────────┐
│              核心管理器层 (Logic)                       │
│  ┌─────────────────┐  ┌────────────────────┐         │
│  │ CanvasRenderer  │  │ SelectionManager   │         │
│  └─────────────────┘  └────────────────────┘         │
│  ┌─────────────────┐  ┌────────────────────┐         │
│  │TransformManager │  │ CommandManager     │         │
│  └─────────────────┘  └────────────────────┘         │
└─────────────────────────────────────────────────────┘
                      ↓ 操作
┌─────────────────────────────────────────────────────┐
│               数据模型层 (Data)                        │
│  Component, EditorState, CanvasState, etc.          │
│  (来自 01_Core_ProjectStructure)                     │
└─────────────────────────────────────────────────────┘
```

---

## 核心类设计

### 1. CanvasRenderer (画布渲染器)

**职责**:
- 将 Component 树渲染到画布
- 处理响应式布局计算(rpx → px)
- 支持多设备预览(手机、平板)
- 渲染辅助元素(网格、标尺、辅助线)

**核心方法**:
```typescript
class CanvasRenderer {
  // 渲染所有组件
  renderComponents(
    components: Component[],
    context: RenderContext
  ): RenderedComponent[]

  // 计算组件在画布上的边界
  calculateBounds(component: Component): Rectangle

  // 将 rpx 样式转换为 px
  transformStyle(style: ComponentStyle, deviceWidth: number): CSSProperties

  // 渲染网格
  renderGrid(gridSize: number, canvasSize: Size): GridLines

  // 渲染标尺
  renderRulers(canvasSize: Size, zoom: number): Rulers

  // 渲染对齐辅助线
  renderAlignmentGuides(guides: AlignmentGuide[]): void
}
```

**设计要点**:
- 纯函数式设计,便于测试
- 支持嵌套组件递归渲染
- 设备宽度适配: 手机(375px), 平板(750px)

---

### 2. SelectionManager (选择管理器)

**职责**:
- 管理组件选择状态
- 支持单选、多选、框选
- 计算对齐辅助线
- 提供选择查询接口

**核心方法**:
```typescript
class SelectionManager {
  private selectedIds: Set<string>

  // 选择单个组件
  selectComponent(id: string, options: SelectOptions): void

  // 选择多个组件
  selectComponents(ids: string[]): void

  // 框选区域内的组件
  selectInRect(rect: Rectangle, components: Component[]): void

  // 清空选择
  clearSelection(): void

  // 查询选择状态
  isSelected(id: string): boolean
  getSelectedIds(): string[]
  getSelectedComponents(components: Component[]): Component[]

  // 计算对齐辅助线
  findAlignmentGuides(
    movingComponent: Component,
    allComponents: Component[],
    threshold: number
  ): AlignmentGuide[]
}
```

**参考**: GDevelop InstancesSelection.js

**对齐算法**:
- 检测边缘对齐: left, right, top, bottom
- 检测中心对齐: centerX, centerY
- 阈值: 默认 5px

---

### 3. TransformManager (变换管理器)

**职责**:
- 处理拖拽操作
- 处理缩放操作
- 处理旋转操作(可选)
- 网格吸附
- 键盘移动

**核心方法**:
```typescript
class TransformManager {
  // 拖拽操作
  startDrag(componentId: string, startPos: Point): DragState
  updateDrag(dragState: DragState, currentPos: Point): Transform
  endDrag(dragState: DragState): void

  // 缩放操作
  startResize(
    componentId: string,
    handle: ResizeHandle,
    startPos: Point
  ): ResizeState
  updateResize(resizeState: ResizeState, currentPos: Point): Transform
  endResize(resizeState: ResizeState): void

  // 旋转操作 (可选,暂不实现)
  // startRotate(...): RotateState

  // 网格吸附
  snapToGrid(value: number, gridSize: number): number
  snapBoundsToGrid(bounds: Rectangle, gridSize: number): Rectangle

  // 键盘移动
  moveByKeyboard(
    componentId: string,
    direction: Direction,
    distance: number
  ): Transform

  // 约束检查
  constrainToBounds(
    bounds: Rectangle,
    containerBounds: Rectangle
  ): Rectangle
}
```

**网格吸附算法**:
```typescript
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}
```

**键盘移动**:
- 方向键: 移动 1px
- Shift + 方向键: 移动 10px

---

### 4. CommandManager (命令管理器)

**职责**:
- 实现命令模式
- 管理撤销/重做堆栈
- 支持批量命令(宏命令)

**核心接口**:
```typescript
interface Command {
  execute(): void
  undo(): void
  description: string
}

class CommandManager {
  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxStackSize: number = 50

  // 执行命令
  execute(command: Command): void {
    command.execute()
    this.undoStack.push(command)
    this.redoStack = [] // 清空重做栈
    this.trimStack()
  }

  // 撤销
  undo(): boolean {
    if (this.undoStack.length === 0) return false
    const command = this.undoStack.pop()!
    command.undo()
    this.redoStack.push(command)
    return true
  }

  // 重做
  redo(): boolean {
    if (this.redoStack.length === 0) return false
    const command = this.redoStack.pop()!
    command.execute()
    this.undoStack.push(command)
    return true
  }

  canUndo(): boolean
  canRedo(): boolean
  clear(): void
}
```

**内置命令类型**:
```typescript
// 移动命令
class MoveCommand implements Command {
  constructor(
    private componentId: string,
    private oldPosition: Point,
    private newPosition: Point,
    private updateFn: UpdateFunction
  ) {}

  execute(): void {
    this.updateFn(this.componentId, { position: this.newPosition })
  }

  undo(): void {
    this.updateFn(this.componentId, { position: this.oldPosition })
  }
}

// 类似: ResizeCommand, DeleteCommand, AddCommand, UpdatePropertiesCommand
```

---

## React 组件架构

### 组件树结构

```
<SceneEditor>
  ├── <Toolbar>
  │   ├── 撤销/重做按钮
  │   ├── 缩放控制
  │   ├── 设备切换
  │   └── 辅助线开关
  ├── <CanvasContainer>
  │   ├── <Rulers> (可选)
  │   └── <Canvas>
  │       ├── <Grid> (可选)
  │       ├── <AlignmentGuides>
  │       ├── <ComponentRenderer> (递归渲染)
  │       └── <SelectionBox>
  ├── <PropertyPanel>
  │   └── (集成 08_Editor_PropertyEditor)
  └── <LayerPanel>
      └── <ComponentTree>
```

---

### SceneEditor (主编辑器)

**职责**: 整合所有子组件,管理全局状态

**状态管理**:
```typescript
interface SceneEditorState {
  // 画布状态
  canvas: {
    zoom: number           // 缩放比例 (0.1 ~ 3.0)
    offset: Point          // 画布偏移
    deviceType: DeviceType // 'mobile' | 'tablet'
    showGrid: boolean
    gridSize: number       // 默认 8px
    showRulers: boolean
  }

  // 选择状态
  selection: {
    selectedIds: string[]
    isMultiSelect: boolean
    selectionBox?: Rectangle
  }

  // 变换状态
  transform: {
    isDragging: boolean
    isResizing: boolean
    currentOperation?: Operation
  }

  // 历史状态
  history: {
    canUndo: boolean
    canRedo: boolean
  }
}
```

**Props**:
```typescript
interface SceneEditorProps {
  // 数据
  page: Page
  onPageUpdate: (page: Page) => void

  // 选择回调
  selectedComponentId?: string
  onComponentSelect: (componentId: string | null) => void

  // 组件操作回调
  onComponentAdd: (component: Component, parentId?: string) => void
  onComponentUpdate: (componentId: string, updates: Partial<Component>) => void
  onComponentDelete: (componentId: string) => void
  onComponentMove: (componentId: string, newParentId: string, index: number) => void

  // 配置
  config?: EditorConfig
}
```

**快捷键支持**:
```
Ctrl/Cmd + Z    : 撤销
Ctrl/Cmd + Y    : 重做
Delete/Backspace: 删除选中组件
Ctrl/Cmd + C    : 复制
Ctrl/Cmd + V    : 粘贴
Ctrl/Cmd + D    : 复制并粘贴
方向键           : 移动 1px
Shift + 方向键   : 移动 10px
Ctrl/Cmd + A    : 全选
Escape          : 取消选择
```

---

### Canvas (画布组件)

**职责**: 渲染画布和组件,处理鼠标交互

**Props**:
```typescript
interface CanvasProps {
  components: Component[]
  canvasState: CanvasState
  selectionState: SelectionState

  // 事件回调
  onComponentClick: (id: string, event: MouseEvent) => void
  onCanvasClick: (event: MouseEvent) => void
  onDragStart: (id: string, position: Point) => void
  onDragMove: (position: Point) => void
  onDragEnd: () => void
  onResizeStart: (id: string, handle: ResizeHandle, position: Point) => void
  onResizeMove: (position: Point) => void
  onResizeEnd: () => void
}
```

**鼠标交互处理**:
```typescript
// 拖拽流程
onMouseDown -> 判断点击位置 ->
  - 点击组件 -> startDrag
  - 点击画布 -> 开始框选
  - 点击缩放手柄 -> startResize

onMouseMove ->
  - 拖拽中 -> updateDrag
  - 缩放中 -> updateResize
  - 框选中 -> 更新选择框

onMouseUp ->
  - endDrag / endResize / 完成框选
```

**性能优化**:
- 使用 `React.memo` 避免不必要的重渲染
- 使用 `requestAnimationFrame` 限制拖拽更新频率
- 大量组件时使用虚拟滚动

---

### Toolbar (工具栏)

**功能**:
- 撤销/重做按钮
- 缩放控制 (10% ~ 300%)
- 设备类型切换 (手机 / 平板)
- 网格开关
- 标尺开关

**UI 布局**:
```
┌────────────────────────────────────────────┐
│ [撤销] [重做] | [50%] [-] [+] | [手机 ▼] │
│               | [网格] [标尺]              │
└────────────────────────────────────────────┘
```

---

### PropertyPanel (属性面板)

**职责**: 显示和编辑选中组件的属性

**集成方式**:
- 使用 `08_Editor_PropertyEditor` 模块
- 传入选中的 Component
- 响应属性变更回调

**Props**:
```typescript
interface PropertyPanelProps {
  selectedComponent: Component | null
  onPropertyChange: (property: string, value: any) => void
  onStyleChange: (styleKey: string, value: string) => void
}
```

---

### LayerPanel (图层面板)

**职责**: 显示组件树,支持拖拽排序

**功能**:
- 树状显示组件层级
- 展开/折叠
- 显示/隐藏组件
- 锁定/解锁组件
- 拖拽排序

**UI 示例**:
```
图层
├─ 🔒 page (锁定)
│  ├─ 👁 header (可见)
│  │  ├─ logo
│  │  └─ nav
│  ├─ 👁‍🗨 content (隐藏)
│  └─ footer
```

---

## 数据流设计

### 单向数据流

```
User Action (鼠标/键盘)
  ↓
Event Handler (Canvas/Toolbar)
  ↓
Manager 处理 (TransformManager/SelectionManager)
  ↓
Command 执行 (CommandManager)
  ↓
State 更新 (SceneEditorState)
  ↓
Props 传递 (React)
  ↓
UI 重渲染 (Canvas/LayerPanel)
```

### 状态管理方案

**使用 React Context + useReducer**:

```typescript
// EditorContext.tsx
const EditorContext = createContext<EditorContextValue>(null!)

interface EditorContextValue {
  state: SceneEditorState
  dispatch: Dispatch<EditorAction>

  // Managers
  canvasRenderer: CanvasRenderer
  selectionManager: SelectionManager
  transformManager: TransformManager
  commandManager: CommandManager
}

// Actions
type EditorAction =
  | { type: 'SELECT_COMPONENT'; payload: { id: string; multiSelect: boolean } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_CANVAS'; payload: Partial<CanvasState> }
  | { type: 'START_DRAG'; payload: { id: string; position: Point } }
  | { type: 'UPDATE_DRAG'; payload: { position: Point } }
  | { type: 'END_DRAG' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  // ...
```

---

## 设备适配

### 微信小程序尺寸规范

**rpx (responsive pixel)**:
- 规定屏幕宽度为 750rpx
- iPhone 6 屏幕宽度 375px → 750rpx
- 1rpx = 0.5px (iPhone 6)

### 编辑器适配方案

**手机模式** (默认):
- 画布宽度: 375px (对应 750rpx)
- 比例: 1rpx = 0.5px

**平板模式**:
- 画布宽度: 750px (对应 750rpx)
- 比例: 1rpx = 1px

**转换函数**:
```typescript
function rpxToPixel(rpx: number, deviceType: DeviceType): number {
  const baseWidth = deviceType === 'mobile' ? 375 : 750
  return (rpx / 750) * baseWidth
}

function pixelToRpx(px: number, deviceType: DeviceType): number {
  const baseWidth = deviceType === 'mobile' ? 375 : 750
  return (px / baseWidth) * 750
}
```

---

## 性能优化策略

### 1. 渲染优化
- 使用 `React.memo` 包裹组件
- 使用 `useMemo` / `useCallback` 缓存计算和函数
- 避免内联样式对象,使用 CSS Modules

### 2. 拖拽优化
- 使用 `requestAnimationFrame` 节流
- 仅更新必要的状态
- 拖拽时禁用过渡动画

### 3. 大数据量优化
- 组件超过 100 个时启用虚拟滚动
- 图层面板使用 `react-window`
- 懒加载组件预览图

### 4. 内存优化
- 及时清理事件监听器
- 限制撤销栈大小(默认 50)
- 使用 WeakMap 缓存计算结果

---

## 扩展性设计

### 插件化架构

**预留扩展点**:
```typescript
interface EditorPlugin {
  name: string
  onInit: (editor: SceneEditor) => void
  onDestroy: () => void

  // 扩展工具栏
  toolbarItems?: ToolbarItem[]

  // 扩展右键菜单
  contextMenuItems?: MenuItem[]

  // 扩展快捷键
  shortcuts?: Shortcut[]

  // 自定义命令
  commands?: Command[]
}
```

**示例插件**:
- 对齐工具插件
- 组件模板插件
- AI 布局建议插件

---

## 可访问性 (Accessibility)

### 键盘导航
- Tab: 切换选择
- 方向键: 移动组件
- Enter: 编辑组件

### 屏幕阅读器
- 所有按钮添加 `aria-label`
- 组件树使用 `role="tree"` 和 `role="treeitem"`
- 画布添加 `aria-label="画布区域"`

---

## 测试策略

### 单元测试
- CanvasRenderer: 渲染逻辑、布局计算
- SelectionManager: 选择逻辑、多选、框选
- TransformManager: 拖拽、缩放、吸附
- CommandManager: 撤销/重做、堆栈管理

### 集成测试
- 拖拽 → 撤销 → 重做 流程
- 多选 → 批量移动 流程
- 组件树 → 拖拽排序 流程

### E2E 测试 (可选)
- 完整的用户操作流程
- 使用 Playwright

---

## 总结

页面编辑器采用**分层架构**:
- **UI 层** (React 组件): 负责渲染和交互
- **逻辑层** (Managers): 负责业务逻辑
- **数据层** (Models): 负责数据结构

**核心设计原则**:
1. **单一职责**: 每个类只做一件事
2. **依赖倒置**: 依赖抽象而非具体实现
3. **命令模式**: 所有操作都是命令,支持撤销
4. **纯函数**: 渲染和计算逻辑尽量纯函数化

**参考 GDevelop**:
- InstancesSelection → SelectionManager
- 命令模式 → CommandManager
- React 组件结构 → SceneEditor

**下一步**: 查看 `dataflow.md` 了解详细的数据流设计。
