# 微信小程序开发平台 - 架构总览

## 📋 项目简介

本项目是基于 GDevelop 核心架构改造的微信小程序可视化开发平台。
本文档提供从 GDevelop 迁移核心功能的完整指南。

---

## 🏗️ 核心架构设计

```
微信小程序开发平台
│
├── 核心层 (Core Layer)
│   ├── 项目结构管理 (Project Structure)
│   ├── 事件系统 (Event System)
│   ├── 变量系统 (Variable System)
│   └── 资源管理 (Resource Management)
│
├── 编辑器层 (Editor Layer)
│   ├── 页面编辑器 (Page Editor)
│   ├── 组件编辑器 (Component Editor)
│   ├── 事件编辑器 (Event Editor)
│   └── 属性编辑器 (Property Editor)
│
├── 代码生成层 (Code Generator Layer)
│   ├── WXML 生成器
│   ├── WXSS 生成器
│   └── JavaScript 生成器
│
├── 运行时层 (Runtime Layer)
│   ├── 组件库 (Component Library)
│   └── API 包装器 (API Wrapper)
│
└── 导出层 (Export Layer)
    ├── 小程序导出器
    └── 预览模拟器
```

---

## 📁 目录结构说明

每个目录代表一个核心功能模块，包含以下内容：

```
XX_ModuleName/
├── README.md                    # 模块说明文档
├── GDEVELOP_SOURCE.md          # GDevelop 源文件映射
├── INTERFACES.md               # 核心接口定义
├── MIGRATION_GUIDE.md          # 迁移指南
├── reference/                  # 参考代码（从 GDevelop 复制）
│   └── gdevelop_*.cpp/js/ts   # 原始 GDevelop 代码
├── design/                     # 设计文档
│   ├── architecture.md        # 架构设计
│   └── dataflow.md            # 数据流设计
└── implementation/             # 实现代码（新平台）
    ├── types.ts               # TypeScript 类型定义
    ├── core.ts                # 核心实现
    └── tests/                 # 单元测试
```

---

## 🎯 15 个核心功能模块

### 📦 核心层 (Core Layer)

#### 01. 项目结构管理 (Project Structure Management)
- **来源**: GDevelop Core - `gd::Project`, `gd::Layout`
- **作用**: 管理小程序项目、页面、组件的层级结构
- **迁移优先级**: 🔴 高 - 这是基础
- **复用度**: 70%

#### 02. 事件系统 (Event System)
- **来源**: GDevelop Core - `gd::BaseEvent`, `gd::Instruction`
- **作用**: 可视化编程的核心，条件-动作系统
- **迁移优先级**: 🔴 高 - 核心功能
- **复用度**: 60%

#### 03. 变量系统 (Variable System)
- **来源**: GDevelop Core - `gd::Variable`, `gd::VariablesContainer`
- **作用**: 全局/页面/组件级别的数据管理
- **迁移优先级**: 🟡 中 - 数据绑定必需
- **复用度**: 90%

#### 04. 资源管理系统 (Resource Management)
- **来源**: GDevelop Core - `gd::ResourcesManager`, `gd::Resource`
- **作用**: 图片、音频、字体等资源的导入和管理
- **迁移优先级**: 🟡 中 - 常用功能
- **复用度**: 80%

---

### 🖥️ 编辑器层 (Editor Layer)

#### 05. 页面编辑器 (Page Editor)
- **来源**: GDevelop IDE - `newIDE/app/src/SceneEditor/`
- **作用**: 可视化页面设计，组件拖拽布局
- **迁移优先级**: 🔴 高 - 核心 UI
- **复用度**: 50%

#### 06. 组件编辑器 (Component Editor)
- **来源**: GDevelop IDE - `newIDE/app/src/ObjectEditor/`
- **作用**: 编辑微信小程序组件属性和配置
- **迁移优先级**: 🔴 高 - 核心 UI
- **复用度**: 40%

#### 07. 事件编辑器 (Event Editor)
- **来源**: GDevelop IDE - `newIDE/app/src/EventsSheet/`
- **作用**: 可视化事件流编辑器
- **迁移优先级**: 🔴 高 - 核心功能
- **复用度**: 60%

#### 08. 属性编辑器 (Property Editor)
- **来源**: GDevelop IDE - `newIDE/app/src/PropertiesEditor/`
- **作用**: 组件属性、样式的可视化编辑
- **迁移优先级**: 🟡 中 - UI 辅助
- **复用度**: 85%

---

### 🔧 代码生成层 (Code Generator Layer)

#### 09. WXML 生成器 (WXML Generator)
- **来源**: GDevelop GDJS - `GDJS/GDJS/Events/CodeGeneration/`
- **作用**: 从组件树生成 .wxml 模板文件
- **迁移优先级**: 🔴 高 - 核心输出
- **复用度**: 20% (需重写)

#### 10. WXSS 生成器 (WXSS Generator)
- **来源**: GDevelop GDJS - 部分参考
- **作用**: 从样式配置生成 .wxss 文件
- **迁移优先级**: 🔴 高 - 核心输出
- **复用度**: 30% (需重写)

#### 11. JavaScript 生成器 (JS Generator)
- **来源**: GDevelop GDJS - `GDJS/GDJS/Events/CodeGeneration/`
- **作用**: 从事件流生成 .js 逻辑代码
- **迁移优先级**: 🔴 高 - 核心输出
- **复用度**: 40%

---

### ⚙️ 运行时层 (Runtime Layer)

#### 12. 组件库 (Component Library)
- **来源**: GDevelop Extensions - `Extensions/`
- **作用**: 微信小程序所有组件的定义和封装
- **迁移优先级**: 🔴 高 - 基础设施
- **复用度**: 10% (需重写)

#### 13. API 包装器 (API Wrapper)
- **来源**: GDevelop Extensions - `Extensions/` 中的 API 扩展
- **作用**: 微信 API (wx.*) 的可视化封装
- **迁移优先级**: 🟡 中 - 扩展功能
- **复用度**: 15% (需重写)

---

### 📤 导出层 (Export Layer)

#### 14. 小程序导出器 (MiniProgram Exporter)
- **来源**: GDevelop IDE - `newIDE/app/src/ExportAndShare/`
- **作用**: 导出完整的微信小程序项目
- **迁移优先级**: 🔴 高 - 最终输出
- **复用度**: 30%

#### 15. 预览模拟器 (Preview Simulator)
- **来源**: GDevelop IDE - `newIDE/app/src/Debugger/`, `GDJS/Runtime/debugger-client/`
- **作用**: 实时预览和调试
- **迁移优先级**: 🟡 中 - 开发辅助
- **复用度**: 40%

---

## 🔄 迁移工作流程

### 阶段 1: 基础架构 (第 1-2 周)
```
优先级: 🔴 高
模块: 01, 02, 03
目标: 搭建核心数据结构
```

### 阶段 2: 编辑器 UI (第 3-6 周)
```
优先级: 🔴 高
模块: 05, 06, 07, 08
目标: 可视化编辑器基础功能
```

### 阶段 3: 代码生成 (第 7-10 周)
```
优先级: 🔴 高
模块: 09, 10, 11, 14
目标: 生成完整的小程序代码
```

### 阶段 4: 组件和 API (第 11-14 周)
```
优先级: 🟡 中
模块: 12, 13
目标: 完整的组件库和 API 支持
```

### 阶段 5: 扩展功能 (第 15-16 周)
```
优先级: 🟢 低
模块: 04, 15
目标: 资源管理、预览、调试
```

---

## 📊 复用度统计

| 层级 | 平均复用度 | 工作量 |
|-----|----------|--------|
| 核心层 | 75% | 低 |
| 编辑器层 | 59% | 中 |
| 代码生成层 | 30% | 高 |
| 运行时层 | 13% | 高 |
| 导出层 | 35% | 中 |

**总体评估**: 约 50% 代码可复用，50% 需要重写

---

## 🛠️ 技术栈对比

| 层级 | GDevelop | 微信小程序平台 | 变化 |
|-----|---------|--------------|------|
| 核心 | C++ | TypeScript | 完全改写语言 |
| 编辑器 | React 16 | React 18 | 升级版本 |
| 状态管理 | Redux | Zustand/Jotai | 轻量化方案 |
| 构建工具 | Webpack | Vite | 更快的构建 |
| 运行时 | PixiJS/Three.js | 无（直接生成代码）| 架构差异 |

---

## 📝 使用说明

1. **阅读各模块 README.md** - 了解模块功能和作用
2. **查看 GDEVELOP_SOURCE.md** - 找到 GDevelop 源码位置
3. **研究 INTERFACES.md** - 理解核心接口定义
4. **按照 MIGRATION_GUIDE.md** - 执行迁移步骤
5. **参考 reference/ 目录** - 查看原始代码实现
6. **实现 implementation/ 目录** - 编写新平台代码

---

## ⚠️ 重要注意事项

### 不能直接复制的部分
```
❌ 游戏循环 (Game Loop)
❌ 物理引擎 (Physics Engine)
❌ 碰撞检测 (Collision Detection)
❌ 渲染管线 (Rendering Pipeline)
❌ 动画系统 (Animation System) - 游戏动画
```

### 需要完全重新设计的部分
```
⚠️ 对象系统 → 组件系统
⚠️ 游戏事件 → 小程序事件
⚠️ 导出系统 → 代码生成系统
⚠️ 预览系统 → 模拟器
```

### 可以直接复用的部分
```
✅ 项目管理 UI
✅ 拖拽系统
✅ 属性编辑器框架
✅ 资源管理器 UI
✅ 变量系统逻辑
✅ 事件编辑器 UI 框架
```

---

## 📚 推荐阅读顺序

1. 本文档 (`00_ARCHITECTURE_OVERVIEW.md`)
2. `01_Core_ProjectStructure/README.md`
3. `02_Core_EventSystem/README.md`
4. `05_Editor_PageEditor/README.md`
5. `09_CodeGenerator_WXMLGenerator/README.md`
6. 其他模块按需阅读

---

## 🔗 相关文档

- GDevelop 源码分析: `D:\claude\.claude\context-gdevelop-analysis.md`
- 改造方案: `D:\claude\.claude\miniprogram-platform-plan.md`
- 快速开始: `D:\claude\.claude\quickstart-guide.md`

---

## 🤝 贡献指南

每个模块的实现遵循以下规范：

1. **类型优先**: 使用 TypeScript 严格模式
2. **接口明确**: 定义清晰的接口和类型
3. **单一职责**: 每个类/函数只做一件事
4. **测试覆盖**: 核心功能必须有单元测试
5. **文档完善**: 复杂逻辑必须有注释

---

最后更新: 2026-01-23
版本: 1.0.0
