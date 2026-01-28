# GDevelop 游戏平台改造项目

基于 GDevelop 开源游戏引擎的游戏开发平台改造方案。

## 项目简介

本项目对 GDevelop 进行了界面和功能的改造，重点在于：

1. **项目为中心的界面布局** - 三栏式设计，更符合游戏开发工作流
2. **多维度项目分类管理** - 支持按游戏类型、分类、标签等多种方式组织项目
3. **增强的资源管理** - 更强大的资源分类、筛选和分析功能

## 目录结构

```
E:\创客\
├── 改造方案.md                    # 详细的改造方案文档
├── README.md                      # 本文件
├── 快速开始.md                    # 快速开始指南
├── 集成指南.md                    # 集成到 GDevelop 的指南
└── src/                          # 源代码
    ├── GameProjectManager/       # 游戏项目管理器
    │   ├── types.js             # 类型定义
    │   ├── constants.js         # 常量配置
    │   ├── ProjectNavigator/    # 项目导航面板
    │   │   └── ProjectNavigator.js
    │   ├── CategoryManager/     # 分类管理器
    │   ├── ResourceClassifier/  # 资源分类器
    │   └── ProjectMetadata/     # 项目元数据
    │       └── MetadataStorage.js
    ├── NewLayout/               # 新布局组件
    │   ├── ThreeColumnLayout.js # 三栏布局
    │   └── ResourcePanel.js     # 右侧素材面板
    └── Utils/                   # 工具类
        ├── ProjectClassifier.js # 项目分类工具
        └── ResourceAnalyzer.js  # 资源分析工具
```

## 核心功能

### 1. 三栏布局

- **左侧面板**：项目导航，包含项目树、分类、收藏等
- **中间面板**：主编辑区域，支持多标签页
- **右侧面板**：素材面板，包含资源库、对象列表、图层管理、属性面板

### 2. 项目分类管理

- 按游戏类型分类（动作、益智、休闲等）
- 自定义分类文件夹
- 标签系统
- 收藏功能
- 最近打开记录

### 3. 资源管理

- 按资源类型筛选（图片、音频、3D模型等）
- 资源使用分析
- 未使用资源检测
- 重复资源检测
- 资源优化建议

## 技术栈

- **React 16.14.0** - UI 框架
- **Material-UI 4.11.0** - UI 组件库
- **Flow** - 类型检查
- **LocalStorage** - 数据持久化

## 快速开始

### 1. 查看改造方案

阅读 `改造方案.md` 了解详细的改造方案和设计思路���

### 2. 集成到 GDevelop

参考 `集成指南.md` 将这些组件集成到现有的 GDevelop 项目中。

### 3. 使用示例

```javascript
import ThreeColumnLayout from './NewLayout/ThreeColumnLayout';
import ProjectNavigator from './GameProjectManager/ProjectNavigator/ProjectNavigator';
import ResourcePanel from './NewLayout/ResourcePanel';
import MetadataStorage from './GameProjectManager/ProjectMetadata/MetadataStorage';

// 在 MainFrame 中使用
<ThreeColumnLayout
  leftPanel={
    <ProjectNavigator
      projects={MetadataStorage.getAllProjects()}
      categories={MetadataStorage.getAllCategories()}
      onProjectSelect={handleProjectSelect}
      onProjectFavorite={handleProjectFavorite}
      onCategoryAdd={handleCategoryAdd}
      onCategoryEdit={handleCategoryEdit}
    />
  }
  centerPanel={
    <EditorTabsPane {...editorProps} />
  }
  rightPanel={
    <ResourcePanel
      resourcesTab={<ResourcesList />}
      objectsTab={<ObjectsList />}
      layersTab={<LayersList />}
      propertiesTab={<PropertiesPanel />}
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      filterOptions={filterOptions}
      onFilterChange={setFilterOptions}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
    />
  }
  leftPanelOpen={leftPanelOpen}
  rightPanelOpen={rightPanelOpen}
  onLeftPanelToggle={() => setLeftPanelOpen(!leftPanelOpen)}
  onRightPanelToggle={() => setRightPanelOpen(!rightPanelOpen)}
/>
```

## 数据存储

项目元数据存储在浏览器的 LocalStorage 中：

- `gameProjects_metadata` - 项目元数据
- `gameProjects_categories` - 分类信息
- `gameProjects_tags` - 标签信息

可以通过 `MetadataStorage` 类进行数据的导入导出。

## 游戏类型

支持以下游戏类型：

- ⚔️ 动作游戏
- 🧩 益智游戏
- 🎮 休闲游戏
- 🗺️ 冒险游戏
- ♟️ 策略游戏
- 🎭 角色扮演
- 🏗️ 模拟游戏
- ⚽ 体育游戏
- 📦 其他

## 资源类型

支持以下资源类型：

- 🖼️ 图片（.png, .jpg, .jpeg, .webp, .gif, .bmp）
- 🔊 音频（.mp3, .wav, .ogg, .aac, .m4a）
- 🎲 3D模型（.glb, .gltf）
- 🎬 视频（.mp4, .webm, .ogv）
- 🔤 字体（.ttf, .otf, .woff, .woff2）
- 📄 数据（.json）
- 🗺️ 瓦片地图（.json, .ldtk, .tmj, .tsj）

## 工具类

### ProjectClassifier

项目分类工具，提供：
- 项目筛选
- 项目排序
- 项目分组
- 项目搜索
- 标签建议

### ResourceAnalyzer

资源分析工具，提供：
- 资源统计
- 未使用资源检测
- 重复资源检测
- 资源使用报告
- 优化建议

## 兼容性

- 保持与 GDevelop 原有项目格式的兼容性
- 元数据存储在独立文件中，不影响原有项目
- 可以随时导入导出数据

## 后续开发

### 短期计划
- [ ] 完善分类管理对话框
- [ ] 实现标签管理器
- [ ] 添加项目模板功能
- [ ] 优化资源预览

### 长期计划
- [ ] 云同步功能
- [ ] AI 辅助标签建议
- [ ] 项目分享功能
- [ ] 资源市场集成

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

本项目基于 GDevelop 的 MIT 许可证。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址：E:\创客
- 基于：GDevelop (https://gdevelop.io)

---

**注意**：本项目是对 GDevelop 的改造方案，需要集成到现有的 GDevelop 项目中使用。
