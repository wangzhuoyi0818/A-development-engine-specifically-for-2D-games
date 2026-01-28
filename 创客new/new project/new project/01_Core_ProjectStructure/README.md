# 模块 01: 项目结构管理 (Project Structure Management)

## 📋 模块概述

**功能**: 管理微信小程序项目的整体结构，包括项目配置、页面管理、组件管理等。

**来源**: GDevelop Core 中的 `gd::Project` 和 `gd::Layout` 类

**迁移优先级**: 🔴 **高** - 这是整个平台的基础架构

**预估工作量**: 2-3 周

**复用度**: 70% (概念和结构可复用，需要适配微信小程序)

---

## 🎯 核心功能

### 1. 项目管理 (Project Management)
- 创建新项目
- 加载/保存项目
- 项目配置管理 (app.json)
- 项目元数据 (名称、版本、描述等)

### 2. 页面管理 (Page Management)
- 添加/删除页面
- 页面排序
- 页面路由配置
- 页面生命周期配置

### 3. 组件管理 (Component Management)
- 页面内组件树
- 自定义组件定义
- 组件复用和引用

### 4. 配置管理 (Configuration Management)
- 全局配置 (window)
- TabBar 配置
- 权限配置 (permission)
- 网络超时配置

---

## 📂 GDevelop 源码位置

详见: [GDEVELOP_SOURCE.md](./GDEVELOP_SOURCE.md)

### 核心文件

**C++ Core**:
```
Core/GDCore/Project/
├── Project.h                    # 项目主类
├── Project.cpp
├── Layout.h                     # 场景/页面类
├── Layout.cpp
├── Object.h                     # 对象/组件类
├── Object.cpp
├── ObjectGroup.h                # 对象组
└── ProjectResourcesAdder.h      # 资源添加器
```

**JavaScript 绑定**:
```
GDevelop.js/Bindings/
└── Bindings.idl                 # C++ 到 JS 的接口定义
    - interface Project
    - interface Layout
    - interface Object
```

**IDE 使用示例**:
```
newIDE/app/src/
├── ProjectManager/              # 项目管理器 UI
│   ├── index.js                # 项目树视图
│   └── SceneTreeViewItemContent.js
└── MainFrame/                   # 主框架
    └── handlers/
        └── ProjectOpening.js    # 项目打开逻辑
```

---

## 🔧 核心接口定义

详见: [INTERFACES.md](./INTERFACES.md)

### TypeScript 类型定义

```typescript
// types.ts
export interface MiniProgramProject {
  id: string;
  name: string;
  version: string;
  description?: string;
  appId?: string;

  // 项目配置
  config: ProjectConfig;

  // 页面列表
  pages: Page[];

  // 全局组件
  globalComponents: ComponentDefinition[];

  // 资源
  resources: Resource[];

  // 变量
  globalVariables: VariableContainer;

  // 创建时间
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectConfig {
  // app.json 的内容
  window: WindowConfig;
  tabBar?: TabBarConfig;
  networkTimeout?: NetworkTimeout;
  permission?: Permission;
  debug?: boolean;
}

export interface WindowConfig {
  navigationBarBackgroundColor?: string;
  navigationBarTextStyle?: 'white' | 'black';
  navigationBarTitleText?: string;
  backgroundColor?: string;
  backgroundTextStyle?: 'dark' | 'light';
  enablePullDownRefresh?: boolean;
  onReachBottomDistance?: number;
}

export interface TabBarConfig {
  color: string;
  selectedColor: string;
  backgroundColor: string;
  borderStyle?: 'black' | 'white';
  list: TabBarItem[];
  position?: 'bottom' | 'top';
}

export interface TabBarItem {
  pagePath: string;
  text: string;
  iconPath?: string;
  selectedIconPath?: string;
}

export interface Page {
  id: string;
  name: string;
  path: string;

  // 页面配置
  config: PageConfig;

  // 组件树
  components: Component[];

  // 页面数据
  data: Record<string, any>;

  // 页面变量
  variables: VariableContainer;

  // 生命周期事件
  lifecycleEvents: LifecycleEvent[];

  // 自定义事件
  customEvents: CustomEvent[];
}

export interface PageConfig {
  navigationBarTitleText?: string;
  navigationBarBackgroundColor?: string;
  navigationBarTextStyle?: 'white' | 'black';
  backgroundColor?: string;
  enablePullDownRefresh?: boolean;
  usingComponents?: Record<string, string>;
}

export interface Component {
  id: string;
  type: string; // 'view', 'text', 'button', etc.
  name?: string;

  // 属性
  properties: ComponentProperty[];

  // 样式
  style: ComponentStyle;

  // 事件
  events: ComponentEvent[];

  // 子组件
  children: Component[];

  // 数据绑定
  dataBindings: DataBinding[];
}
```

---

## 🔄 从 GDevelop 到微信小程序的映射

| GDevelop 概念 | 微信小程序概念 | 说明 |
|--------------|--------------|------|
| `gd::Project` | `MiniProgramProject` | 项目根对象 |
| `gd::Layout` | `Page` | 场景 → 页面 |
| `gd::Object` | `Component` | 游戏对象 → 小程序组件 |
| `gd::ObjectGroup` | `ComponentGroup` | 对象组 → 组件组 |
| `gd::InitialInstance` | `ComponentInstance` | 场景中的对象实例 → 页面中的组件实例 |
| `gd::Layer` | (移除) | 图层概念不适用 |
| `gd::Behavior` | `ComponentBehavior` | 行为系统可保留 |

---

## 📖 迁移指南

详见: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### 步骤 1: 理解 GDevelop 的 Project 类

```cpp
// 参考: Core/GDCore/Project/Project.h

class GD_CORE_API Project {
public:
  // 项目名称
  const gd::String& GetName() const;
  void SetName(const gd::String& name);

  // 场景(页面)管理
  bool HasLayoutNamed(const gd::String& name) const;
  gd::Layout& InsertNewLayout(const gd::String& name, std::size_t position);
  void RemoveLayout(const gd::String& name);
  const std::vector<std::unique_ptr<gd::Layout>>& GetLayouts() const;

  // 对象管理
  bool HasObjectNamed(const gd::String& name) const;
  gd::Object& InsertNewObject(...);
  void RemoveObject(const gd::String& name);

  // 资源管理
  gd::ResourcesManager& GetResourcesManager();

  // 变量管理
  gd::VariablesContainer& GetVariables();
};
```

### 步骤 2: 创建 TypeScript 等价类

```typescript
// implementation/core.ts

export class MiniProgramProjectManager {
  private projects: Map<string, MiniProgramProject> = new Map();

  // 创建新项目
  createProject(name: string, appId?: string): MiniProgramProject {
    const project: MiniProgramProject = {
      id: generateId(),
      name,
      version: '1.0.0',
      appId,
      config: this.getDefaultConfig(),
      pages: [],
      globalComponents: [],
      resources: [],
      globalVariables: new VariableContainer(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(project.id, project);
    return project;
  }

  // 添加页面
  addPage(projectId: string, pageName: string, pagePath: string): Page {
    const project = this.getProject(projectId);

    const page: Page = {
      id: generateId(),
      name: pageName,
      path: pagePath,
      config: {},
      components: [],
      data: {},
      variables: new VariableContainer(),
      lifecycleEvents: [],
      customEvents: []
    };

    project.pages.push(page);
    project.updatedAt = new Date();

    return page;
  }

  // 移除页面
  removePage(projectId: string, pageId: string): void {
    const project = this.getProject(projectId);
    project.pages = project.pages.filter(p => p.id !== pageId);
    project.updatedAt = new Date();
  }

  // 获取项目
  getProject(projectId: string): MiniProgramProject {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    return project;
  }

  // 保存项目到 JSON
  serializeProject(projectId: string): string {
    const project = this.getProject(projectId);
    return JSON.stringify(project, null, 2);
  }

  // 从 JSON 加载项目
  deserializeProject(json: string): MiniProgramProject {
    const project = JSON.parse(json) as MiniProgramProject;
    this.projects.set(project.id, project);
    return project;
  }

  private getDefaultConfig(): ProjectConfig {
    return {
      window: {
        navigationBarBackgroundColor: '#ffffff',
        navigationBarTextStyle: 'black',
        navigationBarTitleText: '小程序',
        backgroundColor: '#eeeeee',
        backgroundTextStyle: 'light',
        enablePullDownRefresh: false
      }
    };
  }
}
```

### 步骤 3: 实现组件树管理

```typescript
// implementation/component-tree.ts

export class ComponentTreeManager {
  // 添加组件到页面
  addComponent(page: Page, component: Component, parentId?: string): void {
    if (!parentId) {
      // 添加到根级别
      page.components.push(component);
    } else {
      // 添加到指定父组件
      const parent = this.findComponent(page.components, parentId);
      if (parent) {
        parent.children.push(component);
      }
    }
  }

  // 移除组件
  removeComponent(page: Page, componentId: string): boolean {
    return this.removeComponentRecursive(page.components, componentId);
  }

  // 移动组件
  moveComponent(page: Page, componentId: string, newParentId?: string, index?: number): void {
    // 1. 先移除
    const component = this.findComponent(page.components, componentId);
    if (!component) return;

    this.removeComponent(page, componentId);

    // 2. 再添加到新位置
    if (!newParentId) {
      if (index !== undefined) {
        page.components.splice(index, 0, component);
      } else {
        page.components.push(component);
      }
    } else {
      const newParent = this.findComponent(page.components, newParentId);
      if (newParent) {
        if (index !== undefined) {
          newParent.children.splice(index, 0, component);
        } else {
          newParent.children.push(component);
        }
      }
    }
  }

  // 查找组件
  findComponent(components: Component[], componentId: string): Component | null {
    for (const component of components) {
      if (component.id === componentId) {
        return component;
      }

      const found = this.findComponent(component.children, componentId);
      if (found) return found;
    }
    return null;
  }

  // 递归移除组件
  private removeComponentRecursive(components: Component[], componentId: string): boolean {
    for (let i = 0; i < components.length; i++) {
      if (components[i].id === componentId) {
        components.splice(i, 1);
        return true;
      }

      if (this.removeComponentRecursive(components[i].children, componentId)) {
        return true;
      }
    }
    return false;
  }

  // 获取组件路径
  getComponentPath(components: Component[], componentId: string, path: string[] = []): string[] | null {
    for (const component of components) {
      if (component.id === componentId) {
        return [...path, component.id];
      }

      const found = this.getComponentPath(
        component.children,
        componentId,
        [...path, component.id]
      );
      if (found) return found;
    }
    return null;
  }
}
```

### 步骤 4: 测试

```typescript
// implementation/tests/project-manager.test.ts

import { describe, it, expect } from 'vitest';
import { MiniProgramProjectManager } from '../core';

describe('MiniProgramProjectManager', () => {
  it('should create a new project', () => {
    const manager = new MiniProgramProjectManager();
    const project = manager.createProject('测试项目', 'wx1234567890');

    expect(project.name).toBe('测试项目');
    expect(project.appId).toBe('wx1234567890');
    expect(project.pages).toHaveLength(0);
  });

  it('should add a page to project', () => {
    const manager = new MiniProgramProjectManager();
    const project = manager.createProject('测试项目');
    const page = manager.addPage(project.id, '首页', 'pages/index/index');

    expect(project.pages).toHaveLength(1);
    expect(page.name).toBe('首页');
    expect(page.path).toBe('pages/index/index');
  });

  it('should remove a page from project', () => {
    const manager = new MiniProgramProjectManager();
    const project = manager.createProject('测试项目');
    const page = manager.addPage(project.id, '首页', 'pages/index/index');

    manager.removePage(project.id, page.id);

    expect(project.pages).toHaveLength(0);
  });

  it('should serialize and deserialize project', () => {
    const manager = new MiniProgramProjectManager();
    const project = manager.createProject('测试项目');
    manager.addPage(project.id, '首页', 'pages/index/index');

    const json = manager.serializeProject(project.id);
    const newManager = new MiniProgramProjectManager();
    const loadedProject = newManager.deserializeProject(json);

    expect(loadedProject.name).toBe('测试项目');
    expect(loadedProject.pages).toHaveLength(1);
  });
});
```

---

## 🔍 关键设计决策

### 1. 使用 TypeScript 而非 C++
**原因**:
- Web 端开发效率高
- 易于维护和调试
- 与 React 编辑器无缝集成
- 不需要游戏级别的性能

### 2. JSON 序列化格式
**原因**:
- 易于阅读和调试
- 与微信小程序配置格式一致
- 便于云端存储和协作
- 支持版本控制

### 3. 扁平化页面结构
**原因**:
- 微信小程序的页面是扁平的
- 不需要 GDevelop 的 External Layout 概念
- 简化项目管理逻辑

---

## 📦 依赖模块

### 上游依赖 (需要先实现)
- 无 (这是基础模块)

### 下游依赖 (依赖本模块)
- 所有其他模块

### 外部依赖
```json
{
  "uuid": "^9.0.0",           // 生成唯一 ID
  "lodash": "^4.17.21",       // 工具函数
  "zod": "^3.22.0"            // 数据校验
}
```

---

## ⚠️ 注意事项

### 不要复制的部分
- ❌ `gd::Layer` - 微信小程序没有图层概念
- ❌ `gd::ExternalEvents` - 暂不需要外部事件
- ❌ `gd::ExternalLayout` - 暂不需要外部布局
- ❌ 游戏相关配置 (FPS、缩放模式等)

### 需要添加的部分
- ✅ TabBar 配置
- ✅ 权限配置
- ✅ 网络超时配置
- ✅ 分包配置 (subPackages)
- ✅ 云开发配置

### 兼容性考虑
- 确保生成的 app.json 符合微信小程序规范
- 页面路径必须符合微信规范 (pages/xxx/xxx)
- 组件命名避免与微信内置组件冲突

---

## 📚 参考资料

### GDevelop 文档
- [GDevelop Architecture Overview](../../../C:/Users/wzy16/Desktop/GDevelop-master/Core/GDevelop-Architecture-Overview.md)
- [Core Project API Docs](https://docs.gdevelop.io/GDCore%20Documentation/classgd_1_1_project.html)

### 微信小程序文档
- [配置小程序](https://developers.weixin.qq.com/miniprogram/dev/framework/config.html)
- [app.json 配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)
- [页面配置](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html)

---

## 🚀 快速开始

```bash
# 1. 进入实现目录
cd implementation

# 2. 安装依赖
npm install

# 3. 运行测试
npm test

# 4. 构建
npm run build
```

---

最后更新: 2026-01-23
