# 小程序导出器模块 (14_Export_MiniProgramExporter)

## 概述

小程序导出器(MiniProgramExporter)负责将可视化编辑的项目导出为完整可运行的微信小程序项目。该模块集成了所有代码生成器，并提供了项目打包、优化和验证等完整功能。

## 核心功能

### 1. **项目导出** (MiniProgramExporter)
- 导出完整的小程序项目到文件系统
- 导出为内存对象(用于预览)
- 导出并打包为ZIP文件
- 支持进度跟踪
- 支持导出钩子(hooks)

### 2. **配置生成** (ConfigGenerator)
生成微信小程序所需的各种配置文件:
- `app.json` - 全局应用配置
- `project.config.json` - 开发工具配置
- `sitemap.json` - 站点地图
- 页面配置JSON文件
- `app.js` - 应用入口
- `app.wxss` - 全局样式

### 3. **目录结构生成** (StructureGenerator)
- 生成标准微信小程序目录结构
- 创建pages、components、utils、assets等目录
- 生成工具函数文件(util.js、request.js)
- 复制资源文件到相应位置

### 4. **代码优化** (Optimizer)
- WXML代码优化(移除注释、压缩空白)
- WXSS代码优化(CSS压缩、选择器合并)
- JavaScript代码优化(移除console、压缩空白)
- 图片优化(质量、尺寸调整)
- 计算压缩比

### 5. **项目打包** (Packager)
- 打包为ZIP文件
- 打包上传包(移除开发文件)
- 计算目录大小和文件数
- 获取ZIP包信息

### 6. **项目验证** (Validator)
验证项目的完整性和正确性:
- 验证项目输入(必填字段、页面等)
- 验证项目结构(目录、文件)
- 验证配置文件(app.json、project.config.json)
- 验证代码文件(WXML、JS、JSON)

### 7. **依赖管理** (DependencyManager)
- 分析项目依赖
- 生成package.json
- 智能添加常用依赖
- 规范化包名

## API 参考

### MiniProgramExporter

```typescript
// 创建导出器
const exporter = new MiniProgramExporter(options?, hooks?)

// 导出项目到文件系统
await exporter.export(project, outputPath): Promise<ExportResult>

// 导出为内存对象(用于预览)
await exporter.exportToMemory(project): Promise<GeneratedFiles>

// 导出并打包为ZIP
await exporter.exportToZip(project, outputPath): Promise<ExportResult>

// 获取导出进度
exporter.getProgress(): ExportProgress

// 取消导出
exporter.cancel(): void
```

### 导出器选项

```typescript
interface ExporterOptions {
  optimize?: boolean;                    // 是否优化代码
  optimizationLevel?: 'none' | 'basic' | 'aggressive';
  compressImages?: boolean;              // 是否压缩图片
  generateSourceMap?: boolean;           // 是否生成sourcemap
  includeDevFiles?: boolean;             // 是否包含开发文件
  outputDirName?: string;                // 输出目录名
  autoPackage?: boolean;                 // 是否自动打包
  concurrency?: number;                  // 并行处理数量
  enableCache?: boolean;                 // 是否启用缓存
  verbose?: boolean;                     // 是否详细日志
}
```

### 导出钩子

```typescript
interface ExportHooks {
  beforeExport?: (project) => void | Promise<void>;
  afterValidation?: (result) => void | Promise<void>;
  beforeGenerate?: (page) => void | Promise<void>;
  afterGenerate?: (result) => void | Promise<void>;
  beforeOptimize?: (files) => void | Promise<void>;
  afterOptimize?: (files) => void | Promise<void>;
  onComplete?: (result) => void | Promise<void>;
  onError?: (error) => void | Promise<void>;
  onProgress?: (progress) => void;
}
```

## 使用示例

### 基础导出

```typescript
import { MiniProgramExporter } from '@/export-mini-program';

const exporter = new MiniProgramExporter();
const result = await exporter.export(project, '/output/path');

if (result.success) {
  console.log('导出成功!');
  console.log('文件数:', result.stats.totalFiles);
  console.log('文件大小:', result.stats.totalSize);
} else {
  console.error('导出失败:', result.errors);
}
```

### 优化导出

```typescript
const exporter = new MiniProgramExporter({
  optimize: true,
  optimizationLevel: 'aggressive',
  compressImages: true,
  autoPackage: true,
});

const result = await exporter.export(project, '/output/path');
console.log('压缩比:', result.stats.compressionRatio, '%');
```

### 快速导出

```typescript
import { quickExport } from '@/export-mini-program';

const result = await quickExport(
  project,
  '/output/path',
  { optimize: true }
);
```

### 内存导出(用于预览)

```typescript
const files = await exporter.exportToMemory(project);

// 遍历生成的文件
for (const [path, content] of Object.entries(files)) {
  console.log(`${path}: ${content.substring(0, 100)}...`);
}
```

### 进度跟踪

```typescript
const exporter = new MiniProgramExporter(
  {},
  {
    onProgress: (progress) => {
      console.log(`进度: ${progress.progress}%`);
      console.log(`任务: ${progress.currentTask}`);
    },
  }
);

await exporter.export(project, '/output/path');
```

## 导出流程

```
1. beforeExport hook
   ↓
2. 验证项目数据
   ↓
3. 生成目录结构
   ↓
4. 并行生成页面代码 (WXML/WXSS/JS/JSON)
   ↓
5. 生成全局配置文件
   ↓
6. 复制资源文件
   ↓
7. 生成package.json
   ↓
8. 代码优化(可选)
   ↓
9. 验证导出结果
   ↓
10. 打包(可选)
    ↓
11. onComplete hook
```

## 生成的文件结构

```
output/miniprogram/
├── app.json                 # 全局配置
├── app.js                   # 应用入口
├── app.wxss                 # 全局样式
├── project.config.json      # 开发工具配置
├── sitemap.json            # 站点地图
├── package.json            # npm依赖配置
│
├── pages/
│   ├── index/
│   │   ├── index.wxml       # 页面模板
│   │   ├── index.js         # 页面逻辑
│   │   ├── index.wxss       # 页面样式
│   │   └── index.json       # 页面配置
│   └── ...
│
├── components/
│   ├── header/
│   │   ├── header.wxml
│   │   ├── header.js
│   │   ├── header.wxss
│   │   └── header.json
│   └── ...
│
├── utils/
│   ├── util.js              # 通用工具函数
│   └── request.js           # 网络请求封装
│
└── assets/
    ├── images/
    ├── icons/
    ├── audio/
    ├── video/
    └── fonts/
```

## 生成的util.js包含函数

- `formatTime(date, format)` - 格式化时间
- `debounce(fn, delay)` - 防抖函数
- `throttle(fn, delay)` - 节流函数
- `deepClone(obj)` - 深拷贝
- `showLoading(title)` - 显示加载提示
- `hideLoading()` - 隐藏加载提示
- `showSuccess(title)` - 显示成功提示
- `showError(title)` - 显示错误提示
- `confirm(options)` - 确认对话框

## 生成的request.js包含函数

- `request(options)` - 发起网络请求
- `get(url, data, options)` - GET请求
- `post(url, data, options)` - POST请求
- `put(url, data, options)` - PUT请求
- `del(url, data, options)` - DELETE请求
- `uploadFile(url, filePath, options)` - 上传文件
- `downloadFile(url, options)` - 下载文件

## 验证规则

### 项目验证

- 项目名称不能为空
- 项目必须有ID
- 项目必须至少包含一个页面
- 页面路径必须唯一
- 项目必须有配置对象

### 导出结果验证

- 检查目录结构完整性
- 检查必需文件存在
- 检查app.json格式和内容
- 检查所有页面文件完整
- 检查配置文件有效性

## 代码优化选项

### WXML优化

```typescript
{
  wxml: {
    removeComments: true,        // 移除注释
    removeWhitespace: true,      // 移除空白
    compressAttributes: false,   // 压缩属性
  }
}
```

### WXSS优化

```typescript
{
  wxss: {
    minify: true,                // CSS压缩
    removeUnused: false,         // 移除未使用的样式
    mergeSelectors: true,        // 合并选择器
  }
}
```

### JavaScript优化

```typescript
{
  js: {
    minify: true,                // 代码压缩
    treeShake: false,            // Tree shaking
    mangle: false,               // 变量名混淆
    removeConsole: true,         // 移除console
  }
}
```

### 图片优化

```typescript
{
  image: {
    quality: 80,                 // 压缩质量(0-100)
    convertToWebP: false,        // 转换为WebP
    maxWidth: 2000,              // 最大宽度
  }
}
```

## 测试覆盖

测试覆盖率 > 90%，包括:

- 类型定义验证
- 配置生成器测试
- 目录结构生成测试
- 依赖管理测试
- 代码优化测试
- 打包器测试
- 验证器测试
- 导出器集成测试
- 边界条件测试
- 性能测试
- 错误处理测试

## 性能指标

- 生成配置文件: < 1ms
- 验证项目: < 1ms
- WXML优化: < 10ms
- WXSS优化: < 10ms
- JS优化: < 50ms
- 并行导出(5个页面): < 500ms

## 扩展性

### 自定义优化器

```typescript
class CustomOptimizer extends Optimizer {
  async optimizeWXML(code: string): Promise<string> {
    // 自定义优化逻辑
    return code;
  }
}
```

### 自定义验证器

```typescript
class CustomValidator extends Validator {
  async validate(projectPath: string): Promise<ValidationResult> {
    // 自定义验证逻辑
    return result;
  }
}
```

## 错误处理

所有错误都会被捕获并返回在`ExportResult`的`errors`数组中:

```typescript
interface ExportError {
  code: string;              // 错误代码
  message: string;           // 错误消息
  filePath?: string;         // 出错文件
  details?: any;             // 详细信息
}
```

常见错误代码:
- `VALIDATION_ERROR` - 项目验证失败
- `GENERATION_ERROR` - 代码生成失败
- `FILE_WRITE_ERROR` - 文件写入失败
- `RESOURCE_COPY_ERROR` - 资源复制失败
- `EXPORT_FAILED` - 导出失败

## 依赖

- Node.js >= 14.0.0
- TypeScript >= 4.0.0
- archiver (打包)
- 其他核心模块依赖

## 许可

MIT License

## 更新日志

### v1.0.0 (2026-01-23)
- 初始版本发布
- 完整的项目导出功能
- 支持代码优化和打包
- 完整的测试覆盖
