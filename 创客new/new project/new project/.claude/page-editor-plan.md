# 页面编辑器实现计划

## 上下文总结

### 已确认的数据模型
从 01_Core_ProjectStructure 模块了解到:
- **Component 接口**: 包含 id, type, name, properties, style, events, children, dataBindings
- **ComponentStyle 接口**: 包含完整的样式属性(width, height, padding, margin, backgroundColor等)
- **Page 接口**: 包含 components 数组作为根组件

### 核心依赖
- **项目核心类型**: `01_Core_ProjectStructure/implementation/types.ts`
- **GDevelop 参考**: InstancesSelection, SceneEditor 等

## 实现架构

### 1. 核心类型定义 (types.ts)

```typescript
// 编辑器状态
interface EditorState {
  canvas: CanvasState
  selection: SelectionState
  transform: TransformState
  history: HistoryState
}

// 画布状态
interface CanvasState {
  zoom: number
  offset: { x: number; y: number }
  deviceType: 'mobile' | 'tablet'
  showGrid: boolean
  gridSize: number
  showRulers: boolean
}

// 选择状态
interface SelectionState {
  selectedIds: string[]
  isMultiSelect: boolean
  selectionBox?: Rectangle
}

// 变换状态
interface TransformState {
  isDragging: boolean
  isResizing: boolean
  dragStartPosition?: Point
  resizeStartBounds?: Rectangle
}

// 命令系统
interface Command {
  execute(): void
  undo(): void
}
```

### 2. 画布渲染器 (canvas-renderer.ts)

**职责:**
- 渲染所有组件到画布
- 支持嵌套组件渲染
- 响应式布局计算
- 设备预览(手机 375rpx, 平板 750rpx)

**关键方法:**
```typescript
class CanvasRenderer {
  renderComponents(components: Component[], parentBounds?: Rectangle): void
  calculateComponentBounds(component: Component): Rectangle
  transformStyleToPixels(style: ComponentStyle): CSSProperties
  applyDeviceScale(value: number): number
}
```

### 3. 选择管理器 (selection-manager.ts)

**职责:**
- 管理单选、多选、框选
- 选择状态维护
- 选择高亮渲染
- 辅助线和对齐计算

**关键方法:**
```typescript
class SelectionManager {
  selectComponent(id: string, multiSelect: boolean): void
  selectComponents(ids: string[]): void
  clearSelection(): void
  isSelected(id: string): boolean
  getSelectedComponents(): Component[]
  findAlignmentGuides(component: Component, allComponents: Component[]): AlignmentGuide[]
}
```

### 4. 变换管理器 (transform-manager.ts)

**职责:**
- 处理拖拽、缩放、旋转
- 网格吸附
- 键盘移动
- 边界约束

**关键方法:**
```typescript
class TransformManager {
  startDrag(componentId: string, startPosition: Point): void
  updateDrag(currentPosition: Point): void
  endDrag(): void

  startResize(componentId: string, handle: ResizeHandle, startPosition: Point): void
  updateResize(currentPosition: Point): void
  endResize(): void

  snapToGrid(value: number, gridSize: number): number
  constrainToBounds(bounds: Rectangle, containerBounds: Rectangle): Rectangle

  moveByKeyboard(direction: Direction, distance: number): void
}
```

### 5. 命令管理器 (editor-commands.ts)

**职责:**
- 实现命令模式
- 撤销/重做堆栈
- 命令记录和回放

**关键命令:**
```typescript
class MoveCommand implements Command {
  execute(): void
  undo(): void
}

class ResizeCommand implements Command { ... }
class DeleteCommand implements Command { ... }
class AddCommand implements Command { ... }

class CommandManager {
  undoStack: Command[]
  redoStack: Command[]

  execute(command: Command): void
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean
}
```

### 6. React 组件

#### SceneEditor.tsx (主编辑器)
- 集成所有子组件
- 状态管理
- 快捷键处理
- 拖放事件协调

#### Canvas.tsx (画布)
- 渲染网格、标尺
- 渲染所有组件
- 处理鼠标交互
- 缩放和平移

#### Toolbar.tsx (工具栏)
- 撤销/重做按钮
- 缩放控制
- 设备切换
- 辅助线开关

#### PropertyPanel.tsx (属性面板)
- 显示选中组件的属性
- 实时编辑样式
- 集成 08_Editor_PropertyEditor

#### LayerPanel.tsx (图层面板)
- 组件树视图
- 拖拽排序
- 显示/隐藏/锁定

## 实现顺序

### 阶段1: 类型和核心类 (1天)
1. ✅ 创建 types.ts
2. ✅ 实现 canvas-renderer.ts
3. ✅ 实现 selection-manager.ts

### 阶段2: 变换和命令 (1天)
4. ✅ 实现 transform-manager.ts
5. ✅ 实现 editor-commands.ts

### 阶段3: React 组件 (1-2天)
6. ✅ 实现 Canvas.tsx
7. ✅ 实现 SceneEditor.tsx
8. ✅ 实现 Toolbar.tsx
9. ✅ 实现 LayerPanel.tsx
10. ✅ 实现 PropertyPanel.tsx

### 阶段4: 测试 (1天)
11. ✅ 画布渲染测试
12. ✅ 选择操作测试
13. ✅ 变换操作测试
14. ✅ 命令撤销测试
15. ✅ React 组件测试

### 阶段5: 文档 (0.5天)
16. ✅ architecture.md
17. ✅ dataflow.md

## 测试策略

### 单元测试
- CanvasRenderer: 渲染逻辑、布局计算
- SelectionManager: 选择逻辑、对齐计算
- TransformManager: 变换计算、吸附逻辑
- CommandManager: 撤销/重做

### 组件测试
- Canvas: 鼠标交互、渲染
- SceneEditor: 集成测试
- Toolbar: 按钮交互
- LayerPanel: 树操作

### 覆盖率目标
- 整体覆盖率 > 90%
- 核心类覆盖率 > 95%

## 技术选型

### 拖拽方案
- **不使用** React DnD (过重)
- 使用原生鼠标事件 + 自定义逻辑

### 状态管理
- React Context + useReducer
- 避免引入 Redux/Zustand

### 性能优化
- React.memo 优化组件渲染
- useCallback 缓存事件处理器
- 虚拟化长列表(图层面板)

## 风险点

1. **复杂交互**: 拖拽+选择+变换的组合逻辑复杂
   - 缓解: 拆分职责,独立测试

2. **性能**: 大量组件时渲染性能
   - 缓解: React.memo + 虚拟化

3. **集成**: 与其他模块(PropertyEditor, EventSystem)的集成
   - 缓解: 定义清晰接口,延迟集成

## 成功标准

- ✅ 可以拖拽组件到画布
- ✅ 可以选择、移动、缩放组件
- ✅ 网格吸附工作正常
- ✅ 撤销/重做功能完整
- ✅ 多选和快捷键支持
- ✅ 测试覆盖率 > 90%
- ✅ 无 TypeScript 错误
- ✅ 设计文档完整
