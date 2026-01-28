/**
 * 小程序导出器 - 类型定义
 *
 * 定义导出器模块的所有TypeScript类型
 */

import type {
  MiniProgramProject,
  Page,
  Component,
  Resource,
} from '../../01_Core_ProjectStructure/implementation/types';

// ============================================================================
// 导出选项
// ============================================================================

/**
 * 导出器选项
 */
export interface ExporterOptions {
  /** 是否优化代码 */
  optimize?: boolean;

  /** 优化级别 */
  optimizationLevel?: 'none' | 'basic' | 'aggressive';

  /** 是否压缩图片 */
  compressImages?: boolean;

  /** 是否生成sourcemap */
  generateSourceMap?: boolean;

  /** 是否包含开发文件 */
  includeDevFiles?: boolean;

  /** 自定义输出目录名 */
  outputDirName?: string;

  /** 是否自动打包 */
  autoPackage?: boolean;

  /** 并行处理数量 */
  concurrency?: number;

  /** 是否启用缓存 */
  enableCache?: boolean;

  /** 是否详细日志 */
  verbose?: boolean;
}

/**
 * 默认导出选项
 */
export const DEFAULT_EXPORTER_OPTIONS: Required<ExporterOptions> = {
  optimize: false,
  optimizationLevel: 'none',
  compressImages: false,
  generateSourceMap: false,
  includeDevFiles: false,
  outputDirName: 'miniprogram',
  autoPackage: false,
  concurrency: 5,
  enableCache: true,
  verbose: false,
};

// ============================================================================
// 导出结果
// ============================================================================

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean;

  /** 输出目录路径 */
  outputPath: string;

  /** 所有生成的文件 */
  files: GeneratedFiles;

  /** zip包路径 (如果打包) */
  packagePath?: string;

  /** 错误列表 */
  errors: ExportError[];

  /** 警告列表 */
  warnings: ExportWarning[];

  /** 导出统计 */
  stats: ExportStats;
}

/**
 * 生成的文件映射
 */
export interface GeneratedFiles {
  /** 文件路径 → 文件内容 */
  [filePath: string]: string | Buffer;
}

/**
 * 导出错误
 */
export interface ExportError {
  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误发生的文件路径 */
  filePath?: string;

  /** 错误详情 */
  details?: any;
}

/**
 * 导出警告
 */
export interface ExportWarning {
  /** 警告代码 */
  code: string;

  /** 警告消息 */
  message: string;

  /** 警告相关的文件路径 */
  filePath?: string;
}

/**
 * 导出统计
 */
export interface ExportStats {
  /** 总文件数 */
  totalFiles: number;

  /** 总大小(字节) */
  totalSize: number;

  /** 页面数 */
  pageCount: number;

  /** 组件数 */
  componentCount: number;

  /** 资源数 */
  resourceCount: number;

  /** 导出耗时(毫秒) */
  duration: number;

  /** 压缩比(如果优化) */
  compressionRatio?: number;
}

// ============================================================================
// 导出状态
// ============================================================================

/**
 * 导出状态
 */
export enum ExportState {
  IDLE = 'idle',
  VALIDATING = 'validating',
  GENERATING_STRUCTURE = 'generating_structure',
  GENERATING_CODE = 'generating_code',
  COPYING_RESOURCES = 'copying_resources',
  OPTIMIZING = 'optimizing',
  VALIDATING_OUTPUT = 'validating_output',
  PACKAGING = 'packaging',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 导出进度
 */
export interface ExportProgress {
  /** 当前状态 */
  state: ExportState;

  /** 进度百分比 (0-100) */
  progress: number;

  /** 当前任务描述 */
  currentTask: string;

  /** 已处理文件数 */
  processedFiles: number;

  /** 总文件数 */
  totalFiles: number;
}

// ============================================================================
// 代码生成结果
// ============================================================================

/**
 * 页面代码生成结果
 */
export interface PageCodeResult {
  /** 页面路径 */
  path: string;

  /** WXML代码 */
  wxml: string;

  /** WXSS代码 */
  wxss: string;

  /** JavaScript代码 */
  js: string;

  /** JSON配置 */
  json: string;

  /** 错误列表 */
  errors: ExportError[];

  /** 警告列表 */
  warnings: ExportWarning[];
}

/**
 * 组件代码生成结果
 */
export interface ComponentCodeResult {
  /** 组件名称 */
  name: string;

  /** WXML代码 */
  wxml: string;

  /** WXSS代码 */
  wxss: string;

  /** JavaScript代码 */
  js: string;

  /** JSON配置 */
  json: string;

  /** 错误列表 */
  errors: ExportError[];

  /** 警告列表 */
  warnings: ExportWarning[];
}

// ============================================================================
// 验证结果
// ============================================================================

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;

  /** 错误列表 */
  errors: ValidationError[];

  /** 警告列表 */
  warnings: ValidationWarning[];

  /** 检查项结果 */
  checks: {
    /** 目录结构检查 */
    structure: boolean;

    /** 配置文件检查 */
    config: boolean;

    /** 代码检查 */
    code: boolean;

    /** 资源检查 */
    resources: boolean;
  };
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;

  /** 错误消息 */
  message: string;

  /** 错误位置 */
  path?: string;

  /** 错误详情 */
  details?: any;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;

  /** 警告消息 */
  message: string;

  /** 警告位置 */
  path?: string;
}

// ============================================================================
// 依赖信息
// ============================================================================

/**
 * 项目依赖
 */
export interface Dependencies {
  /** npm包依赖 */
  npm: Record<string, string>;

  /** 组件依赖 */
  components: string[];

  /** 使用的微信API */
  apis: string[];

  /** 插件依赖 */
  plugins?: Record<string, string>;
}

/**
 * package.json配置
 */
export interface PackageConfig {
  /** 项目名称 */
  name: string;

  /** 项目版本 */
  version: string;

  /** 项目描述 */
  description?: string;

  /** 依赖 */
  dependencies?: Record<string, string>;

  /** 开发依赖 */
  devDependencies?: Record<string, string>;

  /** 脚本 */
  scripts?: Record<string, string>;
}

// ============================================================================
// 优化选项
// ============================================================================

/**
 * 代码优化选项
 */
export interface OptimizationOptions {
  /** WXML优化 */
  wxml?: {
    /** 移除注释 */
    removeComments?: boolean;

    /** 移除空白 */
    removeWhitespace?: boolean;

    /** 压缩属性 */
    compressAttributes?: boolean;
  };

  /** WXSS优化 */
  wxss?: {
    /** CSS压缩 */
    minify?: boolean;

    /** 移除未使用的样式 */
    removeUnused?: boolean;

    /** 合并选择器 */
    mergeSelectors?: boolean;
  };

  /** JavaScript优化 */
  js?: {
    /** 代码压缩 */
    minify?: boolean;

    /** Tree shaking */
    treeShake?: boolean;

    /** 变量名混淆 */
    mangle?: boolean;

    /** 移除console */
    removeConsole?: boolean;
  };

  /** 图片优化 */
  image?: {
    /** 压缩质量 (0-100) */
    quality?: number;

    /** 是否转换为WebP */
    convertToWebP?: boolean;

    /** 最大宽度 */
    maxWidth?: number;
  };
}

/**
 * 默认优化选项
 */
export const DEFAULT_OPTIMIZATION_OPTIONS: Required<OptimizationOptions> = {
  wxml: {
    removeComments: true,
    removeWhitespace: true,
    compressAttributes: false,
  },
  wxss: {
    minify: true,
    removeUnused: false,
    mergeSelectors: true,
  },
  js: {
    minify: true,
    treeShake: false,
    mangle: false,
    removeConsole: true,
  },
  image: {
    quality: 80,
    convertToWebP: false,
    maxWidth: 2000,
  },
};

// ============================================================================
// 配置文件类型
// ============================================================================

/**
 * app.json配置
 */
export interface AppJsonConfig {
  /** 页面路径列表 */
  pages: string[];

  /** 窗口配置 */
  window?: {
    navigationBarBackgroundColor?: string;
    navigationBarTextStyle?: 'white' | 'black';
    navigationBarTitleText?: string;
    backgroundColor?: string;
    backgroundTextStyle?: 'dark' | 'light';
    enablePullDownRefresh?: boolean;
  };

  /** 底部导航配置 */
  tabBar?: {
    color?: string;
    selectedColor?: string;
    backgroundColor?: string;
    list: Array<{
      pagePath: string;
      text: string;
      iconPath?: string;
      selectedIconPath?: string;
    }>;
  };

  /** 全局组件 */
  usingComponents?: Record<string, string>;

  /** 分包配置 */
  subPackages?: Array<{
    root: string;
    pages: string[];
  }>;

  /** 权限配置 */
  permission?: Record<string, any>;

  /** 网络超时 */
  networkTimeout?: {
    request?: number;
    connectSocket?: number;
    uploadFile?: number;
    downloadFile?: number;
  };

  /** 调试模式 */
  debug?: boolean;
}

/**
 * project.config.json配置
 */
export interface ProjectConfigJson {
  /** 项目描述 */
  description?: string;

  /** 打包配置 */
  packOptions?: {
    ignore?: Array<{ type: string; value: string }>;
  };

  /** 开发工具配置 */
  setting?: {
    urlCheck?: boolean;
    es6?: boolean;
    postcss?: boolean;
    minified?: boolean;
    newFeature?: boolean;
    coverView?: boolean;
    autoAudits?: boolean;
    checkInvalidKey?: boolean;
    checkSiteMap?: boolean;
    uploadWithSourceMap?: boolean;
    babelSetting?: {
      ignore?: string[];
      disablePlugins?: string[];
      outputPath?: string;
    };
  };

  /** 编译类型 */
  compileType?: 'miniprogram' | 'plugin';

  /** 小程序AppID */
  appid?: string;

  /** 项目名称 */
  projectname?: string;

  /** 模拟器类型 */
  simulatorType?: 'wechat';

  /** 模拟器插件类型 */
  simulatorPluginLibVersion?: Record<string, any>;

  /** 条件编译 */
  condition?: {
    plugin?: {
      list?: any[];
    };
    game?: {
      currentL: number;
      list?: any[];
    };
    miniprogram?: {
      current: number;
      list?: Array<{
        id: number;
        name: string;
        pathName: string;
        query?: string;
      }>;
    };
  };
}

/**
 * sitemap.json配置
 */
export interface SitemapJson {
  /** 索引规则 */
  rules: Array<{
    /** 匹配规则 */
    action: 'allow' | 'disallow';

    /** 页面路径 */
    page: string;
  }>;
}

// ============================================================================
// 目录结构
// ============================================================================

/**
 * 项目目录结构
 */
export interface ProjectStructure {
  /** 根目录 */
  root: string;

  /** 页面目录 */
  pages: string;

  /** 组件目录 */
  components: string;

  /** 工具目录 */
  utils: string;

  /** 资源目录 */
  assets: {
    root: string;
    images: string;
    icons: string;
    audio: string;
    video: string;
    fonts: string;
  };
}

/**
 * 默认项目结构
 */
export const DEFAULT_PROJECT_STRUCTURE: ProjectStructure = {
  root: '',
  pages: 'pages',
  components: 'components',
  utils: 'utils',
  assets: {
    root: 'assets',
    images: 'assets/images',
    icons: 'assets/icons',
    audio: 'assets/audio',
    video: 'assets/video',
    fonts: 'assets/fonts',
  },
};

// ============================================================================
// 日志
// ============================================================================

/**
 * 导出日志
 */
export interface ExportLog {
  /** 时间戳 */
  timestamp: Date;

  /** 日志级别 */
  level: 'info' | 'warn' | 'error';

  /** 导出阶段 */
  stage: ExportState;

  /** 日志消息 */
  message: string;

  /** 详细信息 */
  details?: any;
}

// ============================================================================
// 导出器类接口
// ============================================================================

/**
 * 导出器接口
 */
export interface IExporter {
  /**
   * 导出项目到文件系统
   * @param project 项目对象
   * @param outputPath 输出路径
   */
  export(project: MiniProgramProject, outputPath: string): Promise<ExportResult>;

  /**
   * 导出为内存对象(用于预览)
   * @param project 项目对象
   */
  exportToMemory(project: MiniProgramProject): Promise<GeneratedFiles>;

  /**
   * 导出并打包为zip
   * @param project 项目对象
   * @param outputPath 输出路径
   */
  exportToZip(
    project: MiniProgramProject,
    outputPath: string
  ): Promise<ExportResult>;

  /**
   * 获取导出进度
   */
  getProgress(): ExportProgress;

  /**
   * 取消导出
   */
  cancel(): void;
}

// ============================================================================
// 钩子函数
// ============================================================================

/**
 * 导出钩子
 */
export interface ExportHooks {
  /** 导出开始前 */
  beforeExport?: (project: MiniProgramProject) => void | Promise<void>;

  /** 验证后 */
  afterValidation?: (result: ValidationResult) => void | Promise<void>;

  /** 生成代码前 */
  beforeGenerate?: (page: Page) => void | Promise<void>;

  /** 生成代码后 */
  afterGenerate?: (result: PageCodeResult) => void | Promise<void>;

  /** 优化前 */
  beforeOptimize?: (files: GeneratedFiles) => void | Promise<void>;

  /** 优化后 */
  afterOptimize?: (files: GeneratedFiles) => void | Promise<void>;

  /** 导出完成 */
  onComplete?: (result: ExportResult) => void | Promise<void>;

  /** 导出出错 */
  onError?: (error: ExportError) => void | Promise<void>;

  /** 进度更新 */
  onProgress?: (progress: ExportProgress) => void;
}
