# 模块 05: 页面编辑器 (Page Editor)

## 📋 模块概述

**功能**: 可视化页面设计，支持拖拽组件、布局编辑、所见即所得。

**来源**: GDevelop IDE - `newIDE/app/src/SceneEditor/`, `InstancesEditor/`

**迁移优先级**: 🔴 **高** - 核心 UI 功能

**预估工作量**: 4-5 周

**复用度**: 50% (UI 框架可复用，渲染逻辑需重写)

---

## 🎯 核心功能

### 1. 画布管理
- 375rpx 宽度的手机画布
- 网格辅助线
- 标尺和参考线
- 缩放和平移

### 2. 组件拖拽
- 从组件面板拖拽到画布
- 画布内移动组件
- 调整组件大小
- 多选和组操作

### 3. 层级管理
- 组件树视图
- 前置/后置
- 分组/解组
- 锁定/解锁

### 4. 辅助功能
- 对齐辅助线
- 吸附网格
- 快捷键
- 撤销/重做

---

## 📂 GDevelop 源码

```
newIDE/app/src/
├── SceneEditor/               # 场景编辑器主组件
│   ├── index.js
│   ├── ScenePropertiesDialog.js
│   └── UseSceneEditorCommands.js
├── InstancesEditor/           # 实例(对象)编辑器
│   ├── index.js
│   ├── InstancesRenderer.js   # PixiJS 渲染器
│   ├── InstancesSelection.js  # 选择管理
│   └── SelectedInstances.js
└── ObjectsList/               # 对象列表
    ├── index.js
    └── ObjectRow.js

关键技术:
- PixiJS: 游戏对象渲染
- React DnD: 拖拽功能
- React Mosaic: 面板布局
```

---

## 🔧 核心接口

```typescript
// 页面编辑器组件
export interface PageEditorProps {
  page: Page;
  onComponentAdd: (component: Component, parentId?: string) => void;
  onComponentUpdate: (componentId: string, updates: Partial<Component>) => void;
  onComponentDelete: (componentId: string) => void;
  onComponentSelect: (componentId: string | null) => void;
  selectedComponentId: string | null;
}

// 画布渲染器
export interface CanvasRendererProps {
  components: Component[];
  scale: number;
  gridSize: number;
  showGrid: boolean;
  onComponentClick: (componentId: string) => void;
}

// 拖拽系统
export interface DragItem {
  type: 'NEW_COMPONENT' | 'EXISTING_COMPONENT';
  componentType?: string; // for NEW_COMPONENT
  componentId?: string;   // for EXISTING_COMPONENT
}
```

---

## 🔄 从 GDevelop 迁移

### ✅ 可复用部分
```javascript
// 拖拽系统 - React DnD
import { useDrag, useDrop } from 'react-dnd';

// 选择管理逻辑
class SelectionManager {
  selectComponent(id) { /* ... */ }
  deselectAll() { /* ... */ }
  isSelected(id) { /* ... */ }
}

// 撤销/重做栈
class UndoRedoManager {
  undo() { /* ... */ }
  redo() { /* ... */ }
}

// 对齐和吸附算法
function snapToGrid(x, y, gridSize) { /* ... */ }
function findAlignmentGuides(component, allComponents) { /* ... */ }
```

### ⚠️ 需要重写部分
```javascript
// GDevelop 使用 PixiJS 渲染游戏对象
// 需要改为渲染微信小程序组件

// 原 GDevelop (PixiJS):
class InstancesRenderer {
  renderSprite(sprite) {
    const pixiSprite = new PIXI.Sprite(texture);
    // ...
  }
}

// 改为微信组件 (React):
function ComponentRenderer({ component }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: component.style.left,
        top: component.style.top,
        width: component.style.width,
        height: component.style.height,
        backgroundColor: component.style.backgroundColor
      }}
    >
      {component.type === 'text' && component.properties.content}
      {component.type === 'button' && <button>按钮</button>}
      {/* ... 其他组件类型 */}
    </div>
  );
}
```

---

## 🎨 UI 结构

```
PageEditor (主容器)
├── Toolbar (工具栏)
│   ├── 撤销/重做
│   ├── 缩放控制
│   └── 辅助线开关
├── Canvas (画布区域)
│   ├── Grid (网格)
│   ├── Rulers (标尺)
│   ├── AlignmentGuides (对齐线)
│   └── ComponentsRenderer (组件渲染器)
│       └── ComponentItem (单个组件)
├── ComponentPalette (组件面板)
│   └── DraggableComponent (可拖拽组件)
└── LayerPanel (层级面板)
    └── ComponentTreeView (组件树)
```

---

## 📊 技术对比

| 功能 | GDevelop (游戏) | 微信小程序平台 |
|-----|---------------|--------------|
| 渲染 | PixiJS (WebGL) | React + DOM |
| 拖拽 | React DnD | React DnD (相同) |
| 选择 | 自定义选择框 | 自定义选择框 (相同) |
| 编辑 | 2D/3D 变换 | 盒模型布局 |
| 对齐 | 像素对齐 | rpx 对齐 |

---

## ⚠️ 重要差异

### GDevelop 的游戏场景
```
- 无限画布
- 自由坐标系 (x, y, z)
- 图层系统
- 相机视角
- 物理引擎
```

### 微信小程序页面
```
- 固定宽度 (750rpx)
- Flex 布局
- 扁平结构 (无图层)
- 固定视口
- 无物理引擎
```

---

## 🚀 实现步骤

### 第 1 周: 基础画布
- [ ] 创建画布组件
- [ ] 实现网格和标尺
- [ ] 实现缩放和平移

### 第 2 周: 拖拽系统
- [ ] 从组件面板拖拽到画布
- [ ] 画布内移动组件
- [ ] 调整组件大小

### 第 3 周: 选择和编辑
- [ ] 单选/多选
- [ ] 选择框样式
- [ ] 快捷键支持

### 第 4-5 周: 高级功能
- [ ] 对齐辅助线
- [ ] 撤销/重做
- [ ] 层级管理
- [ ] 组件树视图

---

## 📦 依赖

```json
{
  "react-dnd": "^16.0.0",
  "react-dnd-html5-backend": "^16.0.0",
  "@dnd-kit/core": "^6.0.0",      // 可选替代方案
  "react-measure": "^2.5.2",       // 测量组件尺寸
  "react-mosaic-component": "^6.0.0" // 面板布局
}
```

---

## 📚 参考资源

- GDevelop SceneEditor: `C:\Users\wzy16\Desktop\GDevelop-master\newIDE\app\src\SceneEditor\`
- React DnD: https://react-dnd.github.io/react-dnd/
- 微信小程序 rpx: https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxss.html

---

最后更新: 2026-01-23
