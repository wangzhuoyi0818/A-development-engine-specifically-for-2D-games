# GDevelop 源代码参考 - 01_Core_ProjectStructure

## 📁 已复制的参考文件

### C++ Core 文件 (核心数据结构)

**路径**: `reference/core/`

| 文件名 | 作用 | 关键类/函数 |
|-------|------|------------|
| `Project.h` | 项目根类定义 | `gd::Project` - 整个游戏项目 |
| `Project.cpp` | 项目根类实现 | 项目管理、场景管理、对象管理 |
| `Layout.h` | 场景类定义 | `gd::Layout` - 游戏场景 (对应小程序页面) |
| `Layout.cpp` | 场景类实现 | 场景实例管理、图层管理 |
| `Object.h` | 对象类定义 | `gd::Object` - 游戏对象 (对应小程序组件) |
| `Object.cpp` | 对象类实现 | 对象属性、行为附加 |

### JavaScript 绑定

**路径**: `reference/bindings/`

| 文件名 | 作用 |
|-------|------|
| `Bindings.idl` | C++ 到 JavaScript 的接口定义 (WebIDL) |

### IDE 代码

**路径**: `reference/ide/`

| 文件名 | 作用 |
|-------|------|
| `index.js` | 项目管理器 React 组件 |

---

## 🔍 重点关注的代码

### 1. Project.h - 项目结构

```cpp
class GD_CORE_API Project {
public:
  // 项目名称
  const gd::String& GetName() const;
  void SetName(const gd::String& name);

  // 场景管理
  bool HasLayoutNamed(const gd::String& name) const;
  gd::Layout& InsertNewLayout(const gd::String& name, std::size_t position);
  void RemoveLayout(const gd::String& name);

  // 对象管理
  bool HasObjectNamed(const gd::String& name) const;
  gd::Object& InsertNewObject(...);

  // 资源和变量
  gd::ResourcesManager& GetResourcesManager();
  gd::VariablesContainer& GetVariables();
};
```

**对应微信小程序**: `MiniProgramProject` 类

### 2. Layout.h - 场景/页面

```cpp
class GD_CORE_API Layout {
public:
  // 场景名称
  const gd::String& GetName() const;
  void SetName(const gd::String& name);

  // 实例管理 (场景中的对象)
  const std::vector<InitialInstance>& GetInitialInstances() const;

  // 图层
  const std::vector<std::unique_ptr<Layer>>& GetLayers() const;

  // 场景变量
  gd::VariablesContainer& GetVariables();
};
```

**对应微信小程序**: `Page` 类

### 3. Object.h - 对象/组件

```cpp
class GD_CORE_API Object {
public:
  // 对象类型
  const gd::String& GetType() const;
  void SetType(const gd::String& type);

  // 对象名称
  const gd::String& GetName() const;
  void SetName(const gd::String& name);

  // 行为
  const std::vector<std::unique_ptr<gd::Behavior>>& GetAllBehaviors() const;

  // 变量
  gd::VariablesContainer& GetVariables();
};
```

**对应微信小程序**: `Component` 类

---

## 📖 如何使用这些参考代码

### 步骤 1: 理解数据结构

阅读 `Project.h`, `Layout.h`, `Object.h` 的头文件，重点关注：
- 类的成员变量
- 公共方法 (get/set)
- 关联关系 (Project → Layout → Object)

### 步骤 2: 映射到微信小程序

```
GDevelop           →    微信小程序平台
─────────────────────────────────────
gd::Project        →    MiniProgramProject
gd::Layout         →    Page
gd::Object         →    Component
gd::InitialInstance →   ComponentInstance
gd::Layer          →    (移除，不需要)
gd::Behavior       →    ComponentBehavior (可选)
```

### 步骤 3: 实现 TypeScript 版本

在 `implementation/types.ts` 中定义对应的接口：

```typescript
// 参考 Project.h
export interface MiniProgramProject {
  id: string;
  name: string;
  pages: Page[];
  // ... 其他属性
}

// 参考 Layout.h
export interface Page {
  id: string;
  name: string;
  path: string;
  components: Component[];
  // ... 其他属性
}

// 参考 Object.h
export interface Component {
  id: string;
  type: string;
  name?: string;
  properties: ComponentProperty[];
  // ... 其他属性
}
```

### 步骤 4: 实现管理类

在 `implementation/core.ts` 中实现管理逻辑：

```typescript
// 参考 Project.cpp 的实现
export class ProjectManager {
  private projects = new Map<string, MiniProgramProject>();

  createProject(name: string): MiniProgramProject { /* ... */ }
  addPage(projectId: string, page: Page): void { /* ... */ }
  removePage(projectId: string, pageId: string): void { /* ... */ }
  // ... 其他方法
}
```

---

## ⚠️ 关键差异

### 不要复制的部分

| GDevelop 功能 | 是否需要 | 原因 |
|--------------|---------|------|
| `gd::Layer` | ❌ 否 | 微信小程序无图层概念 |
| `gd::ExternalLayout` | ❌ 否 | 暂不需要 |
| `gd::ExternalEvents` | ❌ 否 | 暂不需要 |
| FPS、缩放模式等游戏配置 | ❌ 否 | 游戏特有 |

### 需要新增的部分

| 微信小程序功能 | GDevelop 无 |
|--------------|------------|
| TabBar 配置 | ✅ 需要新增 |
| 权限配置 | ✅ 需要新增 |
| 网络超时配置 | ✅ 需要新增 |
| 分包配置 | ✅ 需要新增 |

---

## 📚 进一步阅读

### GDevelop 官方文档
- Project API: https://docs.gdevelop.io/GDCore%20Documentation/classgd_1_1_project.html
- Layout API: https://docs.gdevelop.io/GDCore%20Documentation/classgd_1_1_layout.html
- Object API: https://docs.gdevelop.io/GDCore%20Documentation/classgd_1_1_object.html

### 微信小程序文档
- 项目配置: https://developers.weixin.qq.com/miniprogram/dev/framework/config.html
- 页面配置: https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/page.html

---

## 💡 开发建议

1. **先看头文件 (.h)** - 理解类的结构和接口
2. **再看实现 (.cpp)** - 理解具体逻辑
3. **不要直接复制** - C++ 代码需要重写为 TypeScript
4. **保持简化** - 移除游戏特定功能
5. **遵循规范** - 符合微信小程序要求

---

最后更新: 2026-01-23
参考 GDevelop 版本: master
