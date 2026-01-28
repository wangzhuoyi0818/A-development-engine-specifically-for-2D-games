# 微信小程序可视化开发平台 - 主应用架构设计

## 概览

主应用（17_Integration_MainApp）是整个平台的核心入口，负责集成所有模块、管理全局状态、提供统一的用户界面和交互流程。

## 架构设计

### 整体结构

```
App Root
├── Layout Component
│   ├── Header (导航栏)
│   ├── Sidebar (侧边栏)
│   └── MainContent
│       ├── Page Router
│       │   ├── HomePage (首页)
│       │   ├── EditorPage (编辑器)
│       │   ├── PreviewPage (预览)
│       │   ├── TemplatePage (模板)
│       │   └── ExportPage (导出)
│       └── Toast & Modal (提示和弹窗)
├── Global Store (状态管理)
│   ├── ProjectStore (项目状态)
│   ├── EditorStore (编辑器状态)
│   └── UIStore (UI状态)
└── Module Integration Layer
    ├── Module Loader (模块加载)
    ├── Dependency Injector (依赖注入)
    └── Plugin System (插件系统)
```

### 核心层级

#### 1. 应用层（App Layer）

负责应用初始化、路由管理和全局布局。

```typescript
// 职责
- 初始化应用和全局设置
- 管理路由和页面切换
- 处理全局错误
- 管理应用生命周期
```

#### 2. 状态管理层（Store Layer）

使用 Zustand 实现轻量级、可扩展的状态管理。

```typescript
// 三大核心状态
- ProjectStore: 项目相关状态（项目列表、当前项目、项目配置等）
- EditorStore: 编辑器相关状态（选中组件、撤销栈、编辑器设置等）
- UIStore: UI相关状态（主题、模态框、侧边栏等）
```

#### 3. 页面层（Page Layer）

实现具体的功能页面。

```typescript
// 主要页面
- HomePage: 首页，显示项目列表、最近项目、模板
- EditorPage: 编辑器主页面，集成所有编辑功能
- PreviewPage: 实时预览页面
- TemplatePage: 模板库页面
- ExportPage: 导出页面
```

#### 4. 组件层（Component Layer）

可复用的UI组件。

```typescript
// 分类
- Layout Components: 布局相关（Header, Sidebar, Toolbar）
- Common Components: 通用组件（Modal, Toast, Button等）
- Business Components: 业务组件（集成各模块的特定组件）
```

#### 5. 集成层（Integration Layer）

管理模块集成和插件系统。

```typescript
// 主要职责
- 加载模块（从 01-16 各模块）
- 依赖注入（管理模块间依赖）
- 插件系统（允许扩展）
- 事件总线（模块间通信）
```

### 状态流转图

```
用户交互
    ↓
Page Component
    ↓
Custom Hook (useProject, useEditor, etc)
    ↓
Store Action
    ↓
Store State Update
    ↓
Component Re-render
    ↓
DOM Update
```

### 模块集成

#### 集成的模块

| 模块 | 集成方式 | 通信方式 |
|-----|--------|--------|
| 01_Core_ProjectStructure | 导入类型和工具函数 | Store 状态绑定 |
| 02_Core_EventSystem | 导入事件系统服务 | 事件总线、回调 |
| 03_Core_VariableSystem | 导入变量管理服务 | Store 绑定、Hook |
| 04_Core_ResourceManagement | 导入资源管理服务 | 服务调用 |
| 05-08_Editor层 | 作为页面组件导入 | Props 和 Store |
| 09-11_CodeGenerator层 | 作为服务层导入 | 服务调用、Promise |
| 12-13_Runtime层 | 预览时动态加载 | 预览容器集成 |
| 14-15_Export层 | 作为导出服务导入 | 服务调用 |
| 16_AI_GameGenerator | 可选插件加载 | 插件系统 |

### 通信模式

#### 1. 基于状态的通信

```typescript
// 页面读写共享状态
const { projects, currentProject, updateProject } = useProjectStore();
```

#### 2. 基于事件的通信

```typescript
// 使用事件总线进行模块间通信
eventBus.emit('component:selected', componentId);
eventBus.on('component:selected', handleComponentSelect);
```

#### 3. 基于服务的通信

```typescript
// 直接调用服务
const codegen = ServiceContainer.get('CodeGenerator');
const code = await codegen.generateWXML();
```

### 性能优化策略

#### 1. 代码分割

```typescript
// 按路由进行代码分割
const EditorPage = lazy(() => import('./pages/EditorPage'));
const PreviewPage = lazy(() => import('./pages/PreviewPage'));
```

#### 2. 虚拟化

```typescript
// 项目列表使用虚拟滚动
// 编辑器中的组件树使用虚拟化
```

#### 3. Memoization

```typescript
// 使用 useMemo 和 useCallback 避免不必要的重新渲染
const memoizedComponents = useMemo(() => tree.getComponents(), [tree]);
```

#### 4. 状态分片

```typescript
// 分离不同的状态片段，避免全局状态更新
const projectStore = create(...);
const editorStore = create(...);
const uiStore = create(...);
```

### 错误处理

#### 错误边界

```typescript
// 捕获渲染错误
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

#### 服务错误

```typescript
// 统一的错误处理
try {
  await service.doSomething();
} catch (error) {
  handleError(error);
  showToast(error.message);
}
```

### 数据持久化

```typescript
// 项目数据
- localStorage: UI 状态、用户偏好设置
- IndexedDB: 项目缓存、草稿数据
- 服务器: 最终的项目数据
```

## 文件结构详解

### src/app/

应用核心文件

- `App.tsx` - 根组件，负责初始化和全局布局
- `routes.tsx` - 路由配置
- `layout.tsx` - 主布局组件

### src/store/

状态管理

- `project-store.ts` - 项目状态（项目列表、当前项目等）
- `editor-store.ts` - 编辑器状态（选中组件、操作栈等）
- `ui-store.ts` - UI状态（主题、模态框等）
- `index.ts` - 导出所有store

### src/pages/

页面组件

- `HomePage.tsx` - 首页
- `EditorPage.tsx` - 编辑器
- `PreviewPage.tsx` - 预览
- `TemplatePage.tsx` - 模板
- `ExportPage.tsx` - 导出

### src/components/

可复用组件

- `Header.tsx` - 顶部导航栏
- `Sidebar.tsx` - 侧边栏
- `Toolbar.tsx` - 工具栏
- `Modal.tsx` - 模态框
- `Toast.tsx` - 提示框

### src/hooks/

自定义Hook

- `useProject.ts` - 项目管理
- `useEditor.ts` - 编辑器功能
- `usePreview.ts` - 预览功能

### src/services/

服务层

- `api.ts` - API 调用
- `storage.ts` - 存储管理
- `export.ts` - 导出服务

### src/utils/

工具函数

- `helpers.ts` - 辅助函数
- `validators.ts` - 验证函数
- `formatters.ts` - 格式化函数

### src/types/

TypeScript 类型定义

- `index.ts` - 所有类型定义

### integration/

模块集成

- `module-loader.ts` - 模块加载器
- `dependency-injector.ts` - 依赖注入容器
- `plugin-system.ts` - 插件系统

## 关键设计决策

### 1. 状态管理选择：Zustand

**原因**：
- 轻量级，学习曲线平缓
- 无需 Provider，简化组件层级
- 支持中间件和持久化
- TypeScript 支持好
- 相比 Redux，减少样板代码

### 2. 路由方案：React Router v6

**原因**：
- 社区支持度高
- 与 React 18 兼容性好
- 支持嵌套路由和lazy loading
- 类型支持完整

### 3. 模块加载方案：动态导入 + 服务容器

**原因**：
- 灵活性高，支持插件模式
- 可以按需加载模块
- 解耦模块依赖关系
- 支持模块的动态替换

### 4. 错误处理：分层处理

**原因**：
- 边界错误由 ErrorBoundary 处理
- 异步错误由 try-catch 处理
- 业务错误由 store action 处理
- 用户反馈通过 Toast 显示

## 集成流程

### 初始化流程

```
1. App 启动
2. 加载全局配置
3. 初始化 Store
4. 加载模块（通过 ModuleLoader）
5. 初始化服务容器
6. 注册插件
7. 挂载路由
8. 渲染 UI
```

### 编辑流程

```
1. 用户打开项目
2. EditorStore 加载项目数据
3. 各编辑模块（05-08）读取状态
4. 用户修改
5. EditorStore 更新状态
6. 编辑模块响应更新
7. 用户保存
8. 触发代码生成（09-11）
9. 显示预览或导出
```

## 国际化支持

支持多语言，默认简体中文。

```typescript
// 使用 i18n
import { useTranslation } from './i18n/hook';

export function Component() {
  const t = useTranslation();
  return <div>{t('common.save')}</div>;
}
```

## 性能指标目标

- 首屏加载时间：< 2s
- 编辑器交互响应：< 100ms
- 代码生成时间：< 500ms
- 内存占用：< 200MB

## 扩展性

### 添加新页面

1. 在 `src/pages/` 创建新页面组件
2. 在 `src/app/routes.tsx` 注册路由
3. 在 `src/components/Sidebar.tsx` 添加导航链接

### 添加新模块

1. 创建模块的 adapter/bridge
2. 在 `integration/module-loader.ts` 中注册
3. 通过依赖注入容器访问

### 添加新插件

1. 实现插件接口
2. 在应用启动时注册
3. 通过事件总线或服务容器与其他模块通信

---

最后更新：2026-01-24
版本：1.0.0
