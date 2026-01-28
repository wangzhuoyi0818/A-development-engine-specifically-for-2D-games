# 页面编辑器 - 数据流设计

## 概述

本文档详细描述页面编辑器中的数据流动、状态管理和事件处理机制。

---

## 数据流架构

### 整体数据流

```
┌─────────────────────────────────────────────────────┐
│                   用户操作                            │
│      (鼠标点击/拖拽, 键盘输入, 工具栏点击)               │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│                事件处理器                             │
│     (Canvas/Toolbar/LayerPanel 的事件回调)            │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│              Manager 业务逻辑                         │
│  SelectionManager / TransformManager / ...          │
│  (计算新状态, 验证操作, 创建命令)                       │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│               Command 执行                            │
│   CommandManager.execute(command)                   │
│   (封装可撤销操作, 更新数据)                            │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│              状态更新 (State)                         │
│   EditorState / Page / Component 数据更新             │
└──────────────────┬──────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────┐
│              React 重渲染                             │
│    Canvas / LayerPanel / PropertyPanel              │
└─────────────────────────────────────────────────────┘
```

---

## 核心数据结构

### 1. EditorState (编辑器状态)

```typescript
interface EditorState {
  // 画布状态
  canvas: CanvasState

  // 选择状态
  selection: SelectionState

  // 变换状态
  transform: TransformState

  // 历史状态
  history: HistoryState

  // 剪贴板状态
  clipboard: ClipboardState

  // UI 状态
  ui: UIState
}
```

#### CanvasState (画布状态)

```typescript
interface CanvasState {
  // 缩放级别 (0.1 ~ 3.0)
  zoom: number

  // 画布偏移 (用于平移)
  offset: Point

  // 设备类型
  deviceType: DeviceType  // 'mobile' | 'tablet'

  // 设备宽度 (px)
  deviceWidth: number  // mobile: 375, tablet: 750

  // 网格设置
  showGrid: boolean
  gridSize: number  // 默认 8px

  // 标尺设置
  showRulers: boolean

  // 辅助线设置
  showAlignmentGuides: boolean
  alignmentThreshold: number  // 默认 5px

  // 吸附设置
  snapToGrid: boolean
  snapToComponents: boolean
}
```

#### SelectionState (选择状态)

```typescript
interface SelectionState {
  // 选中的组件 ID 列表
  selectedIds: string[]

  // 是否正在多选
  isMultiSelect: boolean

  // 框选矩形 (拖拽框选时使用)
  selectionBox: Rectangle | null

  // 对齐辅助线
  alignmentGuides: AlignmentGuide[]
}
```

#### TransformState (变换状态)

```typescript
interface TransformState {
  // 当前操作类型
  operation: OperationType | null  // 'drag' | 'resize' | 'rotate' | null

  // 拖拽状态
  dragState: DragState | null

  // 缩放状态
  resizeState: ResizeState | null

  // 旋转状态 (暂不实现)
  rotateState: RotateState | null
}

interface DragState {
  componentIds: string[]
  startPosition: Point
  currentPosition: Point
  originalBounds: Map<string, Rectangle>
}

interface ResizeState {
  componentId: string
  handle: ResizeHandle  // 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  startPosition: Point
  currentPosition: Point
  originalBounds: Rectangle
  maintainAspectRatio: boolean  // Shift 键按下时为 true
}
```

#### HistoryState (历史状态)

```typescript
interface HistoryState {
  canUndo: boolean
  canRedo: boolean
  undoDescription: string | null
  redoDescription: string | null
}
```

---

## 事件处理流程

### 1. 组件选择流程

```typescript
// 用户点击画布上的组件
Canvas.onClick(event) →
  ↓
// 提取点击位置
const position = getMousePosition(event)
  ↓
// 查找被点击的组件
const componentId = findComponentAtPosition(position, components)
  ↓
// 检查是否按下 Ctrl/Cmd (多选)
const multiSelect = event.ctrlKey || event.metaKey
  ↓
// 调用选择管理器
selectionManager.selectComponent(componentId, { multiSelect })
  ↓
// 更新状态
dispatch({
  type: 'SELECT_COMPONENT',
  payload: { id: componentId, multiSelect }
})
  ↓
// 触发回调
onComponentSelect(componentId)
  ↓
// React 重渲染
<Canvas> 和 <PropertyPanel> 更新
```

**多选逻辑**:
```typescript
function selectComponent(id: string, options: SelectOptions) {
  const { multiSelect } = options

  if (multiSelect) {
    // 多选模式: 切换选中状态
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id)  // 已选中 → 取消选中
    } else {
      this.selectedIds.add(id)      // 未选中 → 添加选中
    }
  } else {
    // 单选模式: 清空其他选择
    this.selectedIds.clear()
    this.selectedIds.add(id)
  }
}
```

---

### 2. 组件拖拽流程

```typescript
// 阶段 1: 开始拖拽
Canvas.onMouseDown(event) →
  const componentId = findComponentAtPosition(event)
  const startPosition = getMousePosition(event)
  ↓
transformManager.startDrag(componentId, startPosition) →
  // 创建拖拽状态
  const dragState = {
    componentIds: [componentId],
    startPosition,
    currentPosition: startPosition,
    originalBounds: new Map([
      [componentId, getComponentBounds(component)]
    ])
  }
  ↓
dispatch({ type: 'START_DRAG', payload: dragState })

// ────────────────────────────────────────────────

// 阶段 2: 拖拽移动
Canvas.onMouseMove(event) →
  if (!transformState.dragState) return
  const currentPosition = getMousePosition(event)
  ↓
transformManager.updateDrag(dragState, currentPosition) →
  // 计算位移
  const delta = {
    x: currentPosition.x - dragState.startPosition.x,
    y: currentPosition.y - dragState.startPosition.y
  }

  // 应用网格吸附
  if (canvasState.snapToGrid) {
    delta.x = snapToGrid(delta.x, canvasState.gridSize)
    delta.y = snapToGrid(delta.y, canvasState.gridSize)
  }

  // 计算新位置
  const newBounds = applyDelta(dragState.originalBounds, delta)

  // 查找对齐辅助线
  const guides = selectionManager.findAlignmentGuides(
    newBounds,
    allComponents,
    canvasState.alignmentThreshold
  )

  // 应用对齐吸附
  if (guides.length > 0) {
    newBounds = applyAlignmentSnap(newBounds, guides)
  }
  ↓
dispatch({
  type: 'UPDATE_DRAG',
  payload: { currentPosition, newBounds, guides }
})

// ────────────────────────────────────────────────

// 阶段 3: 结束拖拽
Canvas.onMouseUp() →
transformManager.endDrag(dragState) →
  // 计算最终位移
  const delta = calculateFinalDelta(dragState)

  // 创建移动命令
  const command = new MoveCommand(
    dragState.componentIds,
    delta,
    updateComponentPosition
  )

  // 执行命令 (支持撤销)
  commandManager.execute(command)
  ↓
command.execute() →
  // 更新组件位置
  updateComponentPosition(componentId, newPosition)
  ↓
dispatch({ type: 'END_DRAG' })
  ↓
// 页面数据更新
onComponentUpdate(componentId, { style: { left, top } })
```

**网格吸附算法**:
```typescript
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}
```

**对齐吸附算法**:
```typescript
function findAlignmentGuides(
  movingBounds: Rectangle,
  allComponents: Component[],
  threshold: number
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = []

  for (const component of allComponents) {
    const bounds = getComponentBounds(component)

    // 检查左边缘对齐
    if (Math.abs(movingBounds.left - bounds.left) < threshold) {
      guides.push({ type: 'vertical', position: bounds.left, edge: 'left' })
    }

    // 检查右边缘对齐
    if (Math.abs(movingBounds.right - bounds.right) < threshold) {
      guides.push({ type: 'vertical', position: bounds.right, edge: 'right' })
    }

    // 检查中心对齐
    const movingCenterX = movingBounds.left + movingBounds.width / 2
    const centerX = bounds.left + bounds.width / 2
    if (Math.abs(movingCenterX - centerX) < threshold) {
      guides.push({ type: 'vertical', position: centerX, edge: 'center' })
    }

    // 类似逻辑处理水平对齐
  }

  return guides
}
```

---

### 3. 组件缩放流程

```typescript
// 阶段 1: 开始缩放
ResizeHandle.onMouseDown(event, handle) →
  const componentId = selectedIds[0]
  const startPosition = getMousePosition(event)
  ↓
transformManager.startResize(componentId, handle, startPosition) →
  const resizeState = {
    componentId,
    handle,  // 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
    startPosition,
    currentPosition: startPosition,
    originalBounds: getComponentBounds(component),
    maintainAspectRatio: event.shiftKey
  }
  ↓
dispatch({ type: 'START_RESIZE', payload: resizeState })

// ────────────────────────────────────────────────

// 阶段 2: 缩放移动
Canvas.onMouseMove(event) →
transformManager.updateResize(resizeState, currentPosition) →
  // 计算新的边界
  const newBounds = calculateResizedBounds(
    resizeState.originalBounds,
    resizeState.handle,
    resizeState.startPosition,
    currentPosition,
    resizeState.maintainAspectRatio
  )

  // 应用网格吸附
  if (canvasState.snapToGrid) {
    newBounds = snapBoundsToGrid(newBounds, canvasState.gridSize)
  }

  // 最小尺寸约束
  newBounds.width = Math.max(newBounds.width, MIN_COMPONENT_WIDTH)
  newBounds.height = Math.max(newBounds.height, MIN_COMPONENT_HEIGHT)
  ↓
dispatch({ type: 'UPDATE_RESIZE', payload: { newBounds } })

// ────────────────────────────────────────────────

// 阶段 3: 结束缩放
Canvas.onMouseUp() →
transformManager.endResize(resizeState) →
  // 创建缩放命令
  const command = new ResizeCommand(
    resizeState.componentId,
    resizeState.originalBounds,
    newBounds,
    updateComponentBounds
  )

  commandManager.execute(command)
  ↓
command.execute() →
  updateComponentBounds(componentId, newBounds)
  ↓
dispatch({ type: 'END_RESIZE' })
  ↓
onComponentUpdate(componentId, {
  style: {
    left: newBounds.left,
    top: newBounds.top,
    width: newBounds.width,
    height: newBounds.height
  }
})
```

**缩放计算算法**:
```typescript
function calculateResizedBounds(
  originalBounds: Rectangle,
  handle: ResizeHandle,
  startPos: Point,
  currentPos: Point,
  maintainAspectRatio: boolean
): Rectangle {
  const delta = {
    x: currentPos.x - startPos.x,
    y: currentPos.y - startPos.y
  }

  let newBounds = { ...originalBounds }

  // 根据缩放手柄位置更新边界
  switch (handle) {
    case 'se':  // 右下角
      newBounds.width = originalBounds.width + delta.x
      newBounds.height = originalBounds.height + delta.y
      break

    case 'nw':  // 左上角
      newBounds.left = originalBounds.left + delta.x
      newBounds.top = originalBounds.top + delta.y
      newBounds.width = originalBounds.width - delta.x
      newBounds.height = originalBounds.height - delta.y
      break

    case 'e':   // 右边
      newBounds.width = originalBounds.width + delta.x
      break

    case 'w':   // 左边
      newBounds.left = originalBounds.left + delta.x
      newBounds.width = originalBounds.width - delta.x
      break

    // ... 其他方向
  }

  // 保持宽高比
  if (maintainAspectRatio) {
    const aspectRatio = originalBounds.width / originalBounds.height
    newBounds.height = newBounds.width / aspectRatio
  }

  return newBounds
}
```

---

### 4. 键盘操作流程

```typescript
// 快捷键处理
SceneEditor.onKeyDown(event) →
  switch (event.key) {
    case 'Delete':
    case 'Backspace':
      // 删除选中组件
      deleteSelectedComponents()
      break

    case 'z':
      if (event.ctrlKey || event.metaKey) {
        // 撤销
        commandManager.undo()
      }
      break

    case 'y':
      if (event.ctrlKey || event.metaKey) {
        // 重做
        commandManager.redo()
      }
      break

    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      // 移动组件
      const distance = event.shiftKey ? 10 : 1
      const direction = getDirectionFromKey(event.key)
      moveSelectedComponents(direction, distance)
      event.preventDefault()
      break

    case 'a':
      if (event.ctrlKey || event.metaKey) {
        // 全选
        selectAllComponents()
        event.preventDefault()
      }
      break

    case 'Escape':
      // 取消选择
      clearSelection()
      break
  }
```

**键盘移动实现**:
```typescript
function moveSelectedComponents(direction: Direction, distance: number) {
  const delta = {
    up: { x: 0, y: -distance },
    down: { x: 0, y: distance },
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 }
  }[direction]

  const command = new MoveCommand(
    selectedIds,
    delta,
    updateComponentPosition
  )

  commandManager.execute(command)
}
```

---

### 5. 撤销/重做流程

```typescript
// 撤销操作
Toolbar.onUndoClick() →
commandManager.undo() →
  // 从撤销栈弹出命令
  const command = undoStack.pop()

  // 执行撤销
  command.undo()

  // 加入重做栈
  redoStack.push(command)
  ↓
// 更新历史状态
dispatch({
  type: 'UPDATE_HISTORY',
  payload: {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0
  }
})
  ↓
// 触发页面数据更新
onPageUpdate(updatedPage)

// ────────────────────────────────────────────────

// 重做操作
Toolbar.onRedoClick() →
commandManager.redo() →
  const command = redoStack.pop()
  command.execute()
  undoStack.push(command)
  ↓
dispatch({ type: 'UPDATE_HISTORY', payload: { ... } })
```

**命令示例**:
```typescript
class MoveCommand implements Command {
  description = '移动组件'

  constructor(
    private componentIds: string[],
    private delta: Point,
    private updateFn: UpdateFunction
  ) {}

  execute(): void {
    for (const id of this.componentIds) {
      const component = getComponent(id)
      const newPosition = {
        x: component.style.left + this.delta.x,
        y: component.style.top + this.delta.y
      }
      this.updateFn(id, { style: { left: newPosition.x, top: newPosition.y } })
    }
  }

  undo(): void {
    for (const id of this.componentIds) {
      const component = getComponent(id)
      const oldPosition = {
        x: component.style.left - this.delta.x,
        y: component.style.top - this.delta.y
      }
      this.updateFn(id, { style: { left: oldPosition.x, top: oldPosition.y } })
    }
  }
}
```

---

## 状态管理实现

### Context + Reducer 方案

```typescript
// EditorContext.tsx
interface EditorContextValue {
  state: EditorState
  dispatch: Dispatch<EditorAction>

  // Managers (单例)
  managers: {
    canvas: CanvasRenderer
    selection: SelectionManager
    transform: TransformManager
    command: CommandManager
  }
}

const EditorContext = createContext<EditorContextValue>(null!)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)

  // 创建 managers (只创建一次)
  const managers = useMemo(() => ({
    canvas: new CanvasRenderer(),
    selection: new SelectionManager(),
    transform: new TransformManager(),
    command: new CommandManager()
  }), [])

  const value = { state, dispatch, managers }

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  return useContext(EditorContext)
}
```

**Reducer 实现**:
```typescript
type EditorAction =
  | { type: 'SELECT_COMPONENT'; payload: { id: string; multiSelect: boolean } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'UPDATE_CANVAS'; payload: Partial<CanvasState> }
  | { type: 'START_DRAG'; payload: DragState }
  | { type: 'UPDATE_DRAG'; payload: { position: Point } }
  | { type: 'END_DRAG' }
  | { type: 'START_RESIZE'; payload: ResizeState }
  | { type: 'UPDATE_RESIZE'; payload: { bounds: Rectangle } }
  | { type: 'END_RESIZE' }
  | { type: 'UPDATE_HISTORY'; payload: Partial<HistoryState> }

function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case 'SELECT_COMPONENT': {
      const { id, multiSelect } = action.payload
      const selectedIds = multiSelect
        ? state.selection.selectedIds.includes(id)
          ? state.selection.selectedIds.filter(sid => sid !== id)
          : [...state.selection.selectedIds, id]
        : [id]

      return {
        ...state,
        selection: {
          ...state.selection,
          selectedIds,
          isMultiSelect: multiSelect
        }
      }
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedIds: [],
          isMultiSelect: false
        }
      }

    case 'UPDATE_CANVAS':
      return {
        ...state,
        canvas: {
          ...state.canvas,
          ...action.payload
        }
      }

    case 'START_DRAG':
      return {
        ...state,
        transform: {
          ...state.transform,
          operation: 'drag',
          dragState: action.payload
        }
      }

    case 'UPDATE_DRAG':
      if (!state.transform.dragState) return state
      return {
        ...state,
        transform: {
          ...state.transform,
          dragState: {
            ...state.transform.dragState,
            currentPosition: action.payload.position
          }
        }
      }

    case 'END_DRAG':
      return {
        ...state,
        transform: {
          ...state.transform,
          operation: null,
          dragState: null
        }
      }

    // 类似处理其他 actions...

    default:
      return state
  }
}
```

---

## 性能优化

### 1. 避免不必要的重渲染

```typescript
// 使用 React.memo
const Canvas = React.memo(function Canvas({ components, canvasState }: CanvasProps) {
  // ...
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return (
    prevProps.components === nextProps.components &&
    prevProps.canvasState.zoom === nextProps.canvasState.zoom &&
    prevProps.canvasState.offset === nextProps.canvasState.offset
  )
})

// 使用 useMemo 缓存计算
const renderedComponents = useMemo(() => {
  return canvasRenderer.renderComponents(components, canvasState)
}, [components, canvasState])

// 使用 useCallback 缓存回调
const handleComponentClick = useCallback((id: string) => {
  selectionManager.selectComponent(id, { multiSelect: false })
}, [selectionManager])
```

### 2. 节流拖拽更新

```typescript
function useDragThrottle() {
  const rafRef = useRef<number>()

  const throttledUpdateDrag = useCallback((position: Point) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    rafRef.current = requestAnimationFrame(() => {
      dispatch({ type: 'UPDATE_DRAG', payload: { position } })
    })
  }, [])

  return throttledUpdateDrag
}
```

### 3. 虚拟化长列表

```typescript
// LayerPanel.tsx
import { FixedSizeTree } from 'react-vtree'

function LayerPanel({ components }: LayerPanelProps) {
  return (
    <FixedSizeTree
      treeWalker={treeWalker}
      itemSize={32}
      height={600}
    >
      {Node}
    </FixedSizeTree>
  )
}
```

---

## 数据持久化

### 1. 自动保存

```typescript
// 每 5 秒自动保存一次
useEffect(() => {
  const timer = setInterval(() => {
    savePageToServer(page)
  }, 5000)

  return () => clearInterval(timer)
}, [page])
```

### 2. 本地缓存

```typescript
// 使用 IndexedDB 缓存编辑器状态
import { openDB } from 'idb'

async function saveEditorState(state: EditorState) {
  const db = await openDB('editor-cache', 1)
  await db.put('states', state, 'current')
}

async function loadEditorState(): Promise<EditorState | null> {
  const db = await openDB('editor-cache', 1)
  return await db.get('states', 'current')
}
```

---

## 错误处理

### 1. 操作验证

```typescript
class TransformManager {
  validateDrag(componentId: string): ValidationResult {
    const component = getComponent(componentId)

    if (!component) {
      return { valid: false, error: '组件不存在' }
    }

    if (component.locked) {
      return { valid: false, error: '组件已锁定' }
    }

    return { valid: true }
  }
}
```

### 2. 命令失败处理

```typescript
class CommandManager {
  execute(command: Command): boolean {
    try {
      command.execute()
      this.undoStack.push(command)
      this.redoStack = []
      return true
    } catch (error) {
      console.error('命令执行失败:', error)
      // 显示错误提示
      showToast({ type: 'error', message: '操作失败' })
      return false
    }
  }
}
```

---

## 总结

页面编辑器的数据流遵循**单向数据流**原则:

```
用户操作 → 事件处理 → Manager 处理 → Command 执行 → State 更新 → UI 重渲染
```

**核心特性**:
1. **命令模式**: 所有修改操作都封装为 Command,支持撤销/重做
2. **状态管理**: 使用 Context + Reducer 集中管理状态
3. **职责分离**: UI 组件只负责渲染和事件分发,业务逻辑在 Manager 中
4. **性能优化**: React.memo、useMemo、useCallback、虚拟化
5. **类型安全**: 完整的 TypeScript 类型定义

**下一步**: 查看 `implementation/` 目录中的具体实现代码。
