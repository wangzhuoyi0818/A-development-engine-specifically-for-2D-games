# 小程序导出器 - 数据流设计

## 概述

本文档描述小程序导出器模块的数据流动、状态管理和数据转换过程。

## 主数据流

```
[可视化项目对象]
    ↓
[MiniProgramExporter.export()]
    ↓
[1. 验证输入数据]
    ↓ project: MiniProgramProject
[2. 创建输出目录]
    ↓ outputPath: string
[3. 生成目录结构]
    ↓ StructureGenerator
    ├── pages/
    ├── components/
    ├── utils/
    └── assets/
    ↓
[4. 页面代码生成] (并行)
    ├── Page 1 → WXMLGenerator → page1.wxml
    │         → WXSSGenerator → page1.wxss
    │         → JSGenerator   → page1.js
    │         → ConfigGenerator → page1.json
    ├── Page 2 → ...
    └── Page N → ...
    ↓ generatedFiles: Map<string, string>
[5. 组件代码生成] (并行)
    ├── Component 1 → generators → comp1.{wxml,wxss,js,json}
    └── Component N → ...
    ↓
[6. 全局配置生成]
    ├── ConfigGenerator.generateAppJson() → app.json
    ├── ConfigGenerator.generateProjectConfigJson() → project.config.json
    ├── ConfigGenerator.generateSitemapJson() → sitemap.json
    └── generateAppFiles() → app.{js,wxss}
    ↓
[7. 资源文件复制]
    └── StructureGenerator.copyResources() → assets/
    ↓
[8. 依赖管理]
    └── DependencyManager.generatePackageJson() → package.json
    ↓
[9. 代码优化] (可选)
    ├── Optimizer.optimizeWXML()
    ├── Optimizer.optimizeWXSS()
    ├── Optimizer.optimizeJS()
    └── Optimizer.optimizeImage()
    ↓ optimizedFiles: Map<string, string>
[10. 项目验证]
    └── Validator.validate() → ValidationResult
    ↓
[11. 打包] (可选)
    └── Packager.packToZip() → project.zip
    ↓
[导出结果]
    └── ExportResult
```

## 核心数据结构

### 输入数据

```typescript
// 主输入: 可视化项目对象
interface MiniProgramProject {
  id: string;
  name: string;
  version: string;
  appId?: string;
  config: ProjectConfig;
  pages: Page[];              // 所有页面
  globalComponents: ComponentDefinition[];  // 全局组件
  resources: Resource[];      // 资源文件
  globalVariables: Variable[]; // 全局变量
}

// 页面数据
interface Page {
  id: string;
  name: string;
  path: string;              // 页面路径 (如 'pages/index/index')
  config: PageConfig;        // 页面配置
  components: Component[];   // 页面组件树
  variables: Variable[];     // 页面变量
  lifecycleEvents: LifecycleEvent[]; // 生命周期
  customEvents: CustomEvent[]; // 自定义事件
}

// 资源数据
interface Resource {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'font';
  path: string;              // 原始路径
  url?: string;              // URL (如果是远程资源)
  size?: number;
}
```

### 中间数据

```typescript
// 生成的文件映射
interface GeneratedFiles {
  [filePath: string]: string; // 文件路径 → 文件内容
}

// 示例:
{
  'pages/index/index.wxml': '<view>...</view>',
  'pages/index/index.wxss': '.container { ... }',
  'pages/index/index.js': 'Page({ ... })',
  'pages/index/index.json': '{ ... }',
  'app.json': '{ "pages": [...] }',
  // ...
}

// 代码生成结果
interface CodeGenerationResult {
  wxml: string;
  wxss: string;
  js: string;
  json: string;
  errors: GenerationError[];
  warnings: GenerationWarning[];
}

// 依赖信息
interface Dependencies {
  npm: Record<string, string>;     // npm包依赖
  components: string[];            // 组件依赖
  apis: string[];                  // 使用的微信API
}
```

### 输出数据

```typescript
// 导出结果
interface ExportResult {
  success: boolean;
  outputPath: string;          // 输出目录路径
  files: GeneratedFiles;       // 所有生成的文件
  packagePath?: string;        // zip包路径 (如果打包)
  errors: ExportError[];
  warnings: ExportWarning[];
  stats: ExportStats;
}

// 导出统计
interface ExportStats {
  totalFiles: number;          // 总文件数
  totalSize: number;           // 总大小(字节)
  pageCount: number;           // 页面数
  componentCount: number;      // 组件数
  resourceCount: number;       // 资源数
  duration: number;            // 导出耗时(毫秒)
  compressionRatio?: number;   // 压缩比(如果优化)
}

// 验证结果
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  checks: {
    structure: boolean;        // 目录结构检查
    config: boolean;           // 配置文件检查
    code: boolean;             // 代码语法检查
    resources: boolean;        // 资源完整性检查
  };
}
```

## 数据转换流程

### 1. 页面数据转换

```
Page对象
  ↓
分解为:
  ├── components[] → WXMLGenerator → WXML代码
  ├── components[] → WXSSGenerator → WXSS代码
  ├── variables[] + events[] → JSGenerator → JS代码
  └── config → ConfigGenerator → JSON配置
  ↓
合并为:
  pages/[path]/[name].{wxml,wxss,js,json}
```

### 2. 配置文件生成流程

```
MiniProgramProject
  ↓
提取配置信息:
  ├── pages[] → 页面路径列表
  ├── config.window → 窗口配置
  ├── config.tabBar → 底部导航配置
  └── globalComponents[] → 全局组件配置
  ↓
生成JSON:
  ├── app.json: { pages, window, tabBar, usingComponents }
  ├── project.config.json: { appid, projectname, setting }
  └── sitemap.json: { rules }
```

### 3. 资源文件处理流程

```
Resource[]
  ↓
分类:
  ├── 本地资源 → 复制到assets/
  └── 远程资源 → 记录URL (不复制)
  ↓
路径映射:
  原始路径 → 小程序路径
  /uploads/image1.png → /assets/images/image1.png
  ↓
更新引用:
  在生成的代码中更新资源路径引用
```

### 4. 依赖分析流程

```
MiniProgramProject
  ↓
扫描:
  ├── 页面事件 → 提取使用的微信API
  ├── 组件 → 提取第三方组件
  └── 配置 → 提取插件依赖
  ↓
生成依赖列表:
  {
    "dependencies": {
      "miniprogram-api-promise": "^1.0.4",
      "vant-weapp": "^1.0.0"
    }
  }
  ↓
生成package.json
```

### 5. 优化处理流程

```
原始代码文件
  ↓
WXML优化:
  ├── 移除注释和空白
  ├── 压缩属性名
  └── 合并相邻文本节点
  ↓
WXSS优化:
  ├── CSS压缩 (csso)
  ├── 移除未使用的样式
  └── 合并相同选择器
  ↓
JavaScript优化:
  ├── 代码压缩 (terser)
  ├── Tree shaking
  └── 变量名混淆 (可选)
  ↓
图片优化:
  ├── 压缩PNG/JPEG
  ├── 转换为WebP (可选)
  └── 生成不同尺寸版本
  ↓
优化后的文件
```

## 状态管理

### 导出状态

```typescript
enum ExportState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  GENERATING_STRUCTURE = 'generating_structure',
  GENERATING_CODE = 'generating_code',
  COPYING_RESOURCES = 'copying_resources',
  OPTIMIZING = 'optimizing',
  VALIDATING_OUTPUT = 'validating_output',
  PACKAGING = 'packaging',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

interface ExportProgress {
  state: ExportState;
  progress: number;          // 0-100
  currentTask: string;       // 当前任务描述
  processedFiles: number;    // 已处理文件数
  totalFiles: number;        // 总文件数
}
```

### 错误恢复

```
错误发生
  ↓
记录错误上下文:
  ├── 当前状态
  ├── 失败的文件
  └── 错误信息
  ↓
尝试恢复:
  ├── 文件写入失败 → 重试3次
  ├── 资源复制失败 → 跳过该资源,记录警告
  └── 代码生成失败 → 终止导出,返回错误
  ↓
清理:
  如果导出失败,删除部分生成的文件
```

## 并行处理

### 页面并行生成

```
pages: [page1, page2, page3, page4, page5]
  ↓
分批处理 (concurrency = 3):

Batch 1:
  ├── page1 → [WXML, WXSS, JS, JSON]
  ├── page2 → [WXML, WXSS, JS, JSON]
  └── page3 → [WXML, WXSS, JS, JSON]
  ↓ 等待全部完成

Batch 2:
  ├── page4 → [WXML, WXSS, JS, JSON]
  └── page5 → [WXML, WXSS, JS, JSON]
  ↓ 等待全部完成

合并结果
```

### 资源并行复制

```
resources: [img1, img2, img3, ...]
  ↓
Promise.all([
  copyFile(img1),
  copyFile(img2),
  copyFile(img3),
  ...
])
  ↓
等待全部完成
```

## 缓存策略

### 增量导出

```
检查上次导出结果:
  ├── 页面未修改 → 复用缓存的代码
  ├── 页面已修改 → 重新生成
  └── 新增页面 → 生成新代码
  ↓
只写入变化的文件
```

### 代码生成缓存

```
生成代码时:
  1. 计算输入哈希: hash(page + options)
  2. 查找缓存: cache.get(hash)
  3. 如果命中 → 返回缓存代码
  4. 如果未命中 → 生成代码 → 存入缓存
```

## 数据验证

### 输入验证

```typescript
function validateProject(project: MiniProgramProject): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. 必填字段检查
  if (!project.name) {
    errors.push({ code: 'MISSING_NAME', message: '项目名称不能为空' });
  }

  // 2. 页面检查
  if (!project.pages || project.pages.length === 0) {
    errors.push({ code: 'NO_PAGES', message: '项目必须包含至少一个页面' });
  }

  // 3. 页面路径唯一性检查
  const paths = new Set();
  for (const page of project.pages) {
    if (paths.has(page.path)) {
      errors.push({
        code: 'DUPLICATE_PATH',
        message: `页面路径重复: ${page.path}`
      });
    }
    paths.add(page.path);
  }

  // 4. 资源检查
  for (const resource of project.resources) {
    if (!resource.path && !resource.url) {
      errors.push({
        code: 'INVALID_RESOURCE',
        message: `资源 ${resource.name} 缺少路径或URL`
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: []
  };
}
```

### 输出验证

```typescript
function validateOutput(outputPath: string): ValidationResult {
  const checks = {
    structure: checkDirectoryStructure(outputPath),
    config: checkConfigFiles(outputPath),
    code: checkCodeFiles(outputPath),
    resources: checkResourceFiles(outputPath)
  };

  return {
    valid: Object.values(checks).every(c => c),
    errors: collectErrors(checks),
    warnings: collectWarnings(checks),
    checks
  };
}
```

## 性能优化点

1. **并行生成** - 多个页面同时生成代码
2. **流式写入** - 大文件使用流式写入,避免占用内存
3. **增量导出** - 只重新生成修改的文件
4. **缓存复用** - 缓存生成结果,避免重复计算
5. **按需优化** - 根据配置决定是否执行优化
6. **Worker线程** - 图片压缩等CPU密集任务使用Worker
7. **资源懒加载** - 资源文件按需复制

## 错误处理矩阵

| 错误类型 | 处理策略 | 是否重试 | 是否终止 |
|---------|---------|---------|---------|
| 输入验证失败 | 返回错误信息 | 否 | 是 |
| 目录创建失败 | 检查权限,重试 | 是(3次) | 是 |
| 代码生成失败 | 记录错误,继续 | 否 | 否 |
| 文件写入失败 | 检查空间,重试 | 是(3次) | 是 |
| 资源复制失败 | 记录警告,跳过 | 是(1次) | 否 |
| 代码优化失败 | 使用原始代码 | 否 | 否 |
| 打包失败 | 返回错误信息 | 是(1次) | 是 |

## 监控和日志

### 导出日志

```typescript
interface ExportLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  stage: ExportState;
  message: string;
  details?: any;
}

// 示例日志:
[2026-01-23 10:30:00] INFO  [GENERATING_CODE] 开始生成页面代码
[2026-01-23 10:30:01] INFO  [GENERATING_CODE] 生成页面 pages/index/index
[2026-01-23 10:30:02] WARN  [COPYING_RESOURCES] 资源文件不存在: /uploads/img1.png
[2026-01-23 10:30:05] INFO  [COMPLETED] 导出完成,用时 5.2秒
```

### 性能监控

```typescript
interface PerformanceMetrics {
  totalDuration: number;
  stages: {
    [stage: string]: {
      duration: number;
      percentage: number;
    };
  };
  memoryUsage: {
    peak: number;
    average: number;
  };
  diskIO: {
    read: number;
    write: number;
  };
}
```

## 扩展点

1. **自定义生成器** - 支持注册自定义代码生成器
2. **自定义优化器** - 支持添加自定义优化规则
3. **导出钩子** - 在导出流程各阶段注入钩子函数
4. **自定义模板** - 支持使用自定义项目模板
5. **插件系统** - 支持第三方插件扩展功能
