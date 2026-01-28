# 小程序导出器 - 架构设计

## 概述

小程序导出器(MiniProgramExporter)负责将可视化编辑的项目导出为完整可运行的微信小程序项目,包括代码生成、文件组织、配置生成、代码优化和打包。

## 核心职责

1. **项目导出** - 生成完整的小程序项目结构
2. **代码生成** - 集成WXML/WXSS/JS生成器
3. **配置生成** - 生成app.json、project.config.json等配置文件
4. **资源管理** - 复制和组织图片、音频等资源
5. **代码优化** - 压缩和优化生成的代码
6. **项目打包** - 打包为zip文件供下载或部署
7. **项目验证** - 验证导出项目的完整性和正确性

## 模块架构

```
14_Export_MiniProgramExporter/
├── design/
│   ├── architecture.md          # 架构设计文档
│   └── dataflow.md              # 数据流设计文档
└── implementation/
    ├── types.ts                 # 类型定义
    ├── exporter.ts              # 导出器核心
    ├── structure-generator.ts   # 目录结构生成器
    ├── config-generator.ts      # 配置文件生成器
    ├── dependency-manager.ts    # 依赖管理器
    ├── optimizer.ts             # 代码优化器
    ├── packager.ts              # 打包器
    ├── validator.ts             # 验证器
    └── tests/
        ├── exporter.test.ts
        ├── structure-generator.test.ts
        ├── config-generator.test.ts
        └── optimizer.test.ts
```

## 核心类设计

### 1. MiniProgramExporter (主导出器)

**职责**:
- 协调整个导出流程
- 管理导出配置
- 调用各子模块完成导出

**接口**:
```typescript
class MiniProgramExporter {
  constructor(options?: ExporterOptions)

  // 导出项目到文件系统
  async export(project: MiniProgramProject, outputPath: string): Promise<ExportResult>

  // 导出为内存对象(用于预览)
  async exportToMemory(project: MiniProgramProject): Promise<ExportedFiles>

  // 导出并打包为zip
  async exportToZip(project: MiniProgramProject, outputPath: string): Promise<string>
}
```

### 2. StructureGenerator (目录结构生成器)

**职责**:
- 生成标准微信小程序目录结构
- 创建pages、components、utils等目录
- 复制资源文件到正确位置

**接口**:
```typescript
class StructureGenerator {
  // 生成项目目录结构
  async generateStructure(project: MiniProgramProject, outputPath: string): Promise<void>

  // 复制资源文件
  async copyResources(resources: Resource[], outputPath: string): Promise<void>
}
```

### 3. ConfigGenerator (配置文件生成器)

**职责**:
- 生成app.json全局配置
- 生成project.config.json开发工具配置
- 生成sitemap.json站点地图
- 生成各页面的json配置

**接口**:
```typescript
class ConfigGenerator {
  // 生成app.json
  generateAppJson(project: MiniProgramProject): string

  // 生成project.config.json
  generateProjectConfigJson(project: MiniProgramProject): string

  // 生成sitemap.json
  generateSitemapJson(): string

  // 生成页面配置
  generatePageJson(page: Page): string
}
```

### 4. DependencyManager (依赖管理器)

**职责**:
- 分析项目依赖的第三方库
- 生成package.json
- 管理npm依赖

**接口**:
```typescript
class DependencyManager {
  // 分析项目依赖
  analyzeDependencies(project: MiniProgramProject): Dependencies

  // 生成package.json
  generatePackageJson(project: MiniProgramProject, deps: Dependencies): string
}
```

### 5. Optimizer (代码优化器)

**职责**:
- 压缩WXML/WXSS/JS代码
- 压缩图片资源
- Tree shaking移除未使用代码
- 代码混淆(可选)

**接口**:
```typescript
class Optimizer {
  // 优化WXML
  async optimizeWXML(code: string): Promise<string>

  // 优化WXSS
  async optimizeWXSS(code: string): Promise<string>

  // 优化JavaScript
  async optimizeJS(code: string): Promise<string>

  // 优化图片
  async optimizeImage(imagePath: string): Promise<void>
}
```

### 6. Packager (打包器)

**职责**:
- 将项目打包为zip文件
- 生成上传包
- 支持CI/CD集成

**接口**:
```typescript
class Packager {
  // 打包为zip
  async packToZip(sourcePath: string, outputPath: string): Promise<string>

  // 生成上传包(去除开发文件)
  async packForUpload(sourcePath: string, outputPath: string): Promise<string>
}
```

### 7. Validator (验证器)

**职责**:
- 验证导出项目的完整性
- 检查文件结构
- 检查配置正确性
- 检查代码语法

**接口**:
```typescript
class Validator {
  // 验证项目结构
  async validateStructure(projectPath: string): Promise<ValidationResult>

  // 验证配置文件
  validateConfigs(projectPath: string): Promise<ValidationResult>

  // 验证代码
  async validateCode(projectPath: string): Promise<ValidationResult>
}
```

## 微信小程序标准目录结构

```
miniprogram/
├── app.js                    # 小程序逻辑
├── app.json                  # 小程序公共配置
├── app.wxss                  # 小程序公共样式
├── sitemap.json              # 站点地图
├── project.config.json       # 开发工具配置
├── pages/                    # 页面目录
│   ├── index/
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   ├── index.js
│   │   └── index.json
│   └── detail/
│       ├── detail.wxml
│       ├── detail.wxss
│       ├── detail.js
│       └── detail.json
├── components/               # 自定义组件
│   └── custom-button/
│       ├── custom-button.wxml
│       ├── custom-button.wxss
│       ├── custom-button.js
│       └── custom-button.json
├── utils/                    # 工具函数
│   └── util.js
├── assets/                   # 静态资源
│   ├── images/
│   ├── icons/
│   └── audio/
└── package.json             # npm依赖(可选)
```

## 导出流程

```
1. 验证输入项目
   ↓
2. 生成目录结构
   ↓
3. 生成代码文件
   │
   ├── 调用WXMLGenerator生成所有页面的WXML
   ├── 调用WXSSGenerator生成所有页面的WXSS
   └── 调用JSGenerator生成所有页面的JS
   ↓
4. 生成配置文件
   │
   ├── app.json
   ├── app.js
   ├── app.wxss
   ├── project.config.json
   ├── sitemap.json
   └── 各页面的json
   ↓
5. 复制资源文件
   ↓
6. 代码优化(可选)
   ↓
7. 生成依赖文件(package.json)
   ↓
8. 验证项目完整性
   ↓
9. 打包(可选)
   ↓
10. 返回导出结果
```

## 依赖关系

- **依赖**: 09_CodeGenerator_WXMLGenerator (WXML代码生成)
- **依赖**: 10_CodeGenerator_WXSSGenerator (WXSS代码生成)
- **依赖**: 11_CodeGenerator_JSGenerator (JS代码生成)
- **依赖**: 01_Core_ProjectStructure (项目结构类型)
- **依赖**: 04_Core_ResourceManagement (资源管理)

## 配置项

```typescript
interface ExporterOptions {
  // 是否优化代码
  optimize?: boolean;

  // 优化级别
  optimizationLevel?: 'none' | 'basic' | 'aggressive';

  // 是否压缩图片
  compressImages?: boolean;

  // 是否生成sourcemap
  generateSourceMap?: boolean;

  // 是否包含开发文件
  includeDevFiles?: boolean;

  // 自定义输出目录名
  outputDirName?: string;

  // 是否自动打包
  autoPackage?: boolean;

  // 并行处理数量
  concurrency?: number;
}
```

## 性能优化

1. **并行处理** - 同时生成多个页面的代码
2. **增量导出** - 只重新生成修改的文件
3. **缓存机制** - 缓存中间结果
4. **流式处理** - 大文件使用流式读写
5. **Worker线程** - 图片压缩等耗时操作使用Worker

## 错误处理

1. **验证阶段错误** - 项目结构不完整、缺少必要字段
2. **生成阶段错误** - 代码生成失败、文件写入失败
3. **资源阶段错误** - 资源文件不存在、复制失败
4. **优化阶段错误** - 压缩失败、优化工具异常
5. **打包阶段错误** - zip创建失败、磁盘空间不足

所有错误都应该:
- 提供清晰的错误信息
- 指出错误发生的具体位置(文件、行号)
- 提供修复建议
- 支持错误恢复和重试

## 扩展性

1. **插件系统** - 支持自定义导出插件
2. **模板系统** - 支持自定义项目模板
3. **钩子函数** - 在导出流程的关键节点提供钩子
4. **自定义优化器** - 支持注册自定义优化规则

## 安全考虑

由于项目规范要求安全优先级最低,导出器不进行以下安全检查:
- 代码注入检查
- XSS防护
- 敏感信息检查

## 测试策略

1. **单元测试** - 每个模块独立测试
2. **集成测试** - 测试完整导出流程
3. **快照测试** - 验证生成的配置文件格式
4. **性能测试** - 测试大型项目导出性能
5. **真实项目测试** - 导出的项目能在微信开发者工具中运行
