# 微信小程序可视化开发平台 - 模块集成指南

## 概述

本指南详细说明如何将各个模块集成到主应用中，包括集成点、通信方式和最佳实践。

## 集成架构

### 模块分类

#### 核心基础模块（Core Foundation）
- 01_Core_ProjectStructure
- 02_Core_EventSystem
- 03_Core_VariableSystem
- 04_Core_ResourceManagement

#### 编辑器模块（Editor Layer）
- 05_Editor_PageEditor
- 06_Editor_ComponentEditor
- 07_Editor_EventEditor
- 08_Editor_PropertyEditor

#### 代码生成模块（Code Generation Layer）
- 09_CodeGenerator_WXMLGenerator
- 10_CodeGenerator_WXSSGenerator
- 11_CodeGenerator_JSGenerator

#### 运行时模块（Runtime Layer）
- 12_Runtime_ComponentLibrary
- 13_Runtime_APIWrapper

#### 导出模块（Export Layer）
- 14_Export_MiniProgramExporter
- 15_Preview_Simulator

#### 扩展模块（Extension）
- 16_AI_GameGenerator

## 集成方式详解

### 1. 核心模块集成（类型和工具）

#### 01_Core_ProjectStructure

**集成点**：主要用于类型定义和数据结构

```typescript
// src/types/index.ts
export type {
  Project,
  Page,
  Component as LayoutComponent,
  Resource,
  ProjectConfig
} from '../../01_Core_ProjectStructure/implementation/types';

// src/utils/project-helpers.ts
import {
  createProject,
  createPage,
  createComponent
} from '../../01_Core_ProjectStructure/implementation/core';

export function createNewProject(name: string) {
  return createProject(name);
}
```

**Store 整合**

```typescript
// src/store/project-store.ts
import type { Project } from '../types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project) => void;
  createProject: (name: string) => void;
  // ...
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  // ...
}));
```

#### 02_Core_EventSystem

**集成方式**：事件总线模式

```typescript
// integration/event-bus.ts
import { EventEmitter } from '../../02_Core_EventSystem/implementation/core';

export const eventBus = new EventEmitter();

// 事件类型定义
export const APP_EVENTS = {
  COMPONENT_SELECTED: 'component:selected',
  COMPONENT_DELETED: 'component:deleted',
  PROJECT_SAVED: 'project:saved',
  // ...
} as const;
```

**在组件中使用**

```typescript
// src/pages/EditorPage.tsx
import { eventBus, APP_EVENTS } from '../integration/event-bus';

export function EditorPage() {
  const handleComponentSelect = (componentId: string) => {
    eventBus.emit(APP_EVENTS.COMPONENT_SELECTED, { componentId });
  };

  useEffect(() => {
    const unsubscribe = eventBus.on(
      APP_EVENTS.COMPONENT_SELECTED,
      (data) => console.log('Component selected:', data)
    );
    return unsubscribe;
  }, []);
}
```

#### 03_Core_VariableSystem

**集成点**：变量管理 Hook

```typescript
// src/hooks/useVariable.ts
import { VariableContainer } from '../../03_Core_VariableSystem/implementation/core';

export function useVariables(scope: 'global' | 'page' | 'component') {
  const [variables, setVariables] = useState<VariableContainer | null>(null);

  useEffect(() => {
    const container = new VariableContainer();
    setVariables(container);
  }, [scope]);

  return {
    variables,
    setVariable: (name: string, value: any) => {
      variables?.set(name, value);
    },
    getVariable: (name: string) => variables?.get(name),
  };
}
```

**在 Store 中使用**

```typescript
// src/store/editor-store.ts
import { useVariables } from '../hooks/useVariable';

export const useEditorStore = create((set) => ({
  currentScope: 'page' as const,

  updateVariable(name: string, value: any) {
    // 更新变量
    set((state) => ({
      // ...
    }));
  },
}));
```

#### 04_Core_ResourceManagement

**集成点**：资源管理服务

```typescript
// src/services/resource.ts
import { ResourceManager } from '../../04_Core_ResourceManagement/implementation/core';

export class ResourceService {
  private manager = new ResourceManager();

  async importResource(file: File) {
    // 处理资源导入
    return this.manager.addResource(file);
  }

  getResource(id: string) {
    return this.manager.getResource(id);
  }

  listResources() {
    return this.manager.listResources();
  }
}

// 在 Store 中注册
export const useResourceStore = create((set) => ({
  resourceService: new ResourceService(),
  // ...
}));
```

### 2. 编辑器模块集成

#### 05-08_Editor 模块

**集成点**：作为子页面/组件集成

```typescript
// src/pages/EditorPage.tsx
import { PageEditor } from '../../../05_Editor_PageEditor/implementation';
import { ComponentEditor } from '../../../06_Editor_ComponentEditor/implementation';
import { EventEditor } from '../../../07_Editor_EventEditor/implementation';
import { PropertyEditor } from '../../../08_Editor_PropertyEditor/implementation';

export function EditorPage() {
  const { currentPage } = useProjectStore();
  const { selectedComponent } = useEditorStore();

  return (
    <div className="editor-container">
      <PageEditor
        page={currentPage}
        onComponentSelect={(id) => {
          // 更新 store
        }}
      />

      <PropertyEditor
        component={selectedComponent}
        onChange={(props) => {
          // 更新组件属性
        }}
      />

      <EventEditor
        component={selectedComponent}
        onChange={(events) => {
          // 更新组件事件
        }}
      />
    </div>
  );
}
```

**Props 绑定模式**

```typescript
// 将 Store 状态作为 Props 传递给编辑器组件
const editorProps = {
  project: useProjectStore((state) => state.currentProject),
  page: useProjectStore((state) => state.currentPage),
  selectedComponent: useEditorStore((state) => state.selectedComponent),
  onComponentChange: useEditorStore((state) => state.updateComponent),
};
```

### 3. 代码生成模块集成

#### 09-11_CodeGenerator 模块

**集成方式**：服务层模式

```typescript
// src/services/codegen.ts
import {
  WXMLGenerator
} from '../../../09_CodeGenerator_WXMLGenerator/implementation';
import {
  WXSSGenerator
} from '../../../10_CodeGenerator_WXSSGenerator/implementation';
import {
  JSGenerator
} from '../../../11_CodeGenerator_JSGenerator/implementation';

export class CodeGenerationService {
  private wxmlGen = new WXMLGenerator();
  private wxssGen = new WXSSGenerator();
  private jsGen = new JSGenerator();

  async generateWXML(project: Project, page: Page): Promise<string> {
    return this.wxmlGen.generate(project, page);
  }

  async generateWXSS(project: Project, page: Page): Promise<string> {
    return this.wxssGen.generate(project, page);
  }

  async generateJS(project: Project, page: Page): Promise<string> {
    return this.jsGen.generate(project, page);
  }

  async generateAll(project: Project) {
    const pages = project.pages;
    const results: Record<string, any> = {};

    for (const page of pages) {
      results[page.name] = {
        wxml: await this.generateWXML(project, page),
        wxss: await this.generateWXSS(project, page),
        js: await this.generateJS(project, page),
      };
    }

    return results;
  }
}
```

**在编辑器中使用**

```typescript
// src/hooks/usePreview.ts
import { CodeGenerationService } from '../services/codegen';

export function usePreview() {
  const codegenService = new CodeGenerationService();
  const { currentProject, currentPage } = useProjectStore();

  const generatePreview = async () => {
    if (!currentProject || !currentPage) return;

    const generated = await codegenService.generateWXML(currentProject, currentPage);
    return generated;
  };

  return { generatePreview };
}
```

### 4. 运行时模块集成

#### 12-13_Runtime 模块

**集成方式**：预览容器中加载

```typescript
// src/components/PreviewContainer.tsx
import { ComponentLibrary } from '../../../12_Runtime_ComponentLibrary/implementation';
import { APIWrapper } from '../../../13_Runtime_APIWrapper/implementation';

export function PreviewContainer() {
  const componentLib = new ComponentLibrary();
  const apiWrapper = new APIWrapper();

  return (
    <div className="preview-container">
      {/* 预览内容会在这里渲染 */}
      {/* 使用 componentLib 和 apiWrapper 来渲染生成的代码 */}
    </div>
  );
}
```

### 5. 导出模块集成

#### 14-15_Export 模块

**集成方式**：服务和页面模式

```typescript
// src/services/export.ts
import {
  MiniProgramExporter
} from '../../../14_Export_MiniProgramExporter/implementation';

export class ExportService {
  private exporter = new MiniProgramExporter();

  async exportProject(project: Project): Promise<Blob> {
    // 生成所有文件
    const files = await this.exporter.export(project);

    // 打包为 zip
    return this.zipFiles(files);
  }

  private zipFiles(files: Record<string, string>): Blob {
    // 实现 zip 打包逻辑
    // ...
  }
}

// 在导出页面中使用
export function ExportPage() {
  const exportService = new ExportService();
  const { currentProject } = useProjectStore();

  const handleExport = async () => {
    const blob = await exportService.exportProject(currentProject!);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject!.name}.zip`;
    a.click();
  };

  return (
    <div>
      <button onClick={handleExport}>导出项目</button>
    </div>
  );
}
```

### 6. 预览模拟器集成

```typescript
// src/pages/PreviewPage.tsx
import { Simulator } from '../../../15_Preview_Simulator/implementation';

export function PreviewPage() {
  const { currentProject, currentPage } = useProjectStore();
  const simulatorRef = useRef<Simulator | null>(null);

  useEffect(() => {
    if (simulatorRef.current && currentPage) {
      simulatorRef.current.loadPage(currentPage);
    }
  }, [currentPage]);

  return (
    <div className="preview-page">
      <Simulator ref={simulatorRef} />
    </div>
  );
}
```

### 7. AI 游戏生成器集成（可选）

**集成方式**：插件模式

```typescript
// integration/plugins/ai-game-generator-plugin.ts
import { AIGameGenerator } from '../../../16_AI_GameGenerator/implementation';

export class AIGameGeneratorPlugin {
  private generator = new AIGameGenerator();

  register(pluginSystem: PluginSystem) {
    pluginSystem.register({
      name: 'ai-game-generator',
      version: '1.0.0',
      hooks: {
        onGenerateProject: async (prompt: string) => {
          return await this.generator.generateFromPrompt(prompt);
        },
      },
    });
  }
}
```

## 通信模式总结

| 模块类型 | 集成方式 | 通信方式 | 示例 |
|--------|--------|--------|------|
| 核心基础 | 导入 | Store/Hook | ProjectStore 中使用 Project 类型 |
| 编辑器 | 组件 | Props/Store | PageEditor 接收 page prop |
| 代码生成 | 服务 | 服务调用 | codegenService.generateWXML() |
| 运行时 | 容器 | 容器加载 | PreviewContainer 中加载运行时 |
| 导出 | 服务 | 服务调用 | exportService.exportProject() |
| 扩展 | 插件 | 事件/Hook | 通过 pluginSystem 注册 |

## 依赖注入模式

### ServiceContainer 实现

```typescript
// integration/dependency-injector.ts
class ServiceContainer {
  private services = new Map<string, any>();

  register(name: string, factory: () => any) {
    this.services.set(name, factory);
  }

  get(name: string) {
    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service ${name} not found`);
    }
    return factory();
  }
}

export const serviceContainer = new ServiceContainer();

// 注册服务
serviceContainer.register('CodeGenerator', () => new CodeGenerationService());
serviceContainer.register('Export', () => new ExportService());
serviceContainer.register('ResourceManager', () => new ResourceService());

// 使用服务
const codegen = serviceContainer.get('CodeGenerator');
```

## 最佳实践

### 1. 明确的模块边界

- 每个模块只暴露必要的接口
- 使用类型安全的接口定义
- 避免直接访问模块的内部状态

### 2. 统一的状态管理

```typescript
// 所有状态改变都通过 Store
const { updateComponent } = useEditorStore();
updateComponent(componentId, { x: 100 });
```

### 3. 事件驱动的高层通信

```typescript
// 模块间解耦通信
eventBus.emit(APP_EVENTS.COMPONENT_SELECTED, data);
```

### 4. 服务层的异步操作

```typescript
// 复杂操作通过服务层
const result = await codegenService.generateAll(project);
```

### 5. Hook 的二次包装

```typescript
// 为每个模块提供 Hook 包装
export function useCodeGenerator() {
  return new CodeGenerationService();
}
```

## 集成检查清单

在集成新模块时，确保完成以下检查：

- [ ] 模块的类型已导入到 `src/types/index.ts`
- [ ] 模块的初始化逻辑已添加到应用启动流程
- [ ] 模块的服务已在 ServiceContainer 中注册
- [ ] 模块的事件已在 APP_EVENTS 中定义
- [ ] 模块的 Hook 已在 `src/hooks/` 中实现
- [ ] 模块的测试已添加到 `implementation/tests/`
- [ ] 模块的文档已更新

## 常见问题

### Q: 如何处理模块间的循环依赖？

A: 使用依赖注入模式和服务容器，避免直接导入。通过接口和事件进行通信。

### Q: 如何更新模块版本？

A: 每个模块版本独立管理。在 `package.json` 中更新依赖版本，然后重新测试集成。

### Q: 如何添加新的编辑器模块？

A: 在 `src/pages/EditorPage.tsx` 中导入新模块，作为组件添加到编辑器布局中，并通过 Store 进行状态绑定。

---

最后更新：2026-01-24
版本：1.0.0
