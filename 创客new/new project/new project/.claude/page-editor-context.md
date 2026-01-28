# 页面编辑器模块 (05_Editor_PageEditor) - 上下文收集

## 当前理解

### 项目背景
- 微信小程序可视化开发平台
- 参考 GDevelop 的 SceneEditor 架构
- 迁移优先级：高，复用度约 50%

### 核心需求
1. 可视化页面设计编辑器
2. 组件拖拽、布局、编辑
3. 画布渲染（375rpx 宽度）
4. 选择、变换、对齐等编辑操作
5. 层级管理（组件树）
6. 撤销/重做支持

### 已确认的架构

**设计文件结构:**
```
05_Editor_PageEditor/
├── design/
│   ├── architecture.md        # React组件架构，画布设计
│   └── dataflow.md           # 编辑操作的数据流
├── implementation/
│   ├── types.ts              # 类型定义
│   ├── canvas-renderer.ts    # 画布渲染器
│   ├── selection-manager.ts  # 选择管理器
│   ├── transform-manager.ts  # 变换管理器
│   ├── editor-commands.ts    # 命令系统（撤销/重做）
│   ├── components/
│   │   ├── SceneEditor.tsx
│   │   ├── Canvas.tsx
│   │   ├── Toolbar.tsx
│   │   ├── PropertyPanel.tsx
│   │   └── LayerPanel.tsx
│   ├── tests/
│   └── package.json
└── reference/                # GDevelop 源码参考
```

### 关键依赖
- React 18
- TypeScript 4.5+
- Vitest (测试)
- React Testing Library
- UUID (ID生成)

### GDevelop 参考
- InstancesSelection: 选择管理
- SceneEditor: 场景编辑器主组件
- InstancesRenderer: 渲染器逻辑

## 待确认的关键问题

1. **数据模型**
   - Component 的数据结构如何定义？需要查看已有的类型定义
   - 与 01_Core_ProjectStructure 的 Page/Component 如何集成？

2. **变换模型**
   - 是否支持旋转、3D变换？还是只支持 2D 位置+大小？
   - 网格大小和吸附机制的设计？

3. **React 集成**
   - 是否使用 React DnD 进行拖拽？
   - 状态管理方案是什么？(Zustand/Context/Redux)
   - 是否已有共享的 UI 组件库？

4. **性能考虑**
   - 大量组件时的渲染性能优化？
   - 是否需要虚拟滚动？

5. **测试框架**
   - 现有项目的单元测试模式是什么？
   - 如何测试 React 组件和画布渲染？

## 下一步
- 查看已实现的类型定义（01 模块）
- 查看已有的 React 组件模式
- 确认数据模型和集成点
