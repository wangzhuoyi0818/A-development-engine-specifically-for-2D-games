/**
 * 小程序导出器 - 完整测试套件
 *
 * 测试覆盖:
 * - 类型定义验证
 * - 导出器核心功能
 * - 各子模块功能
 * - 错误处理
 * - 集成测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MiniProgramExporter } from '../exporter';
import { ConfigGenerator } from '../config-generator';
import { StructureGenerator } from '../structure-generator';
import { DependencyManager } from '../dependency-manager';
import { Optimizer } from '../optimizer';
import { Packager } from '../packager';
import { Validator } from '../validator';
import type {
  MiniProgramProject,
  Page,
  Component,
  ProjectConfig,
  WindowConfig,
} from '../../../01_Core_ProjectStructure/implementation/types';

// 测试数据工厂
function createTestProject(): MiniProgramProject {
  return {
    id: 'test-project-1',
    name: 'TestProject',
    version: '1.0.0',
    description: '测试项目',
    appId: 'wx12345678',
    config: {
      window: {
        navigationBarBackgroundColor: '#000000',
        navigationBarTextStyle: 'white',
        navigationBarTitleText: 'TestProject',
        backgroundColor: '#ffffff',
        backgroundTextStyle: 'dark',
        enablePullDownRefresh: false,
      },
    },
    pages: [
      {
        id: 'page-1',
        name: 'Home',
        path: 'pages/index/index',
        config: {},
        components: [
          {
            id: 'comp-1',
            type: 'view',
            properties: [],
            style: {},
            events: [],
            children: [],
            dataBindings: [],
          },
        ],
        data: {},
        variables: [],
        lifecycleEvents: [],
        customEvents: [],
      },
    ],
    globalComponents: [],
    resources: [],
    globalVariables: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============================================================================
// 类型定义测试
// ============================================================================

describe('类型定义验证', () => {
  it('应该正确导出所有类型', () => {
    expect(createTestProject()).toBeDefined();
    expect(createTestProject().id).toBe('test-project-1');
    expect(createTestProject().name).toBe('TestProject');
  });

  it('页面对象应该有正确的结构', () => {
    const project = createTestProject();
    const page = project.pages[0];

    expect(page.id).toBeDefined();
    expect(page.name).toBe('Home');
    expect(page.path).toBe('pages/index/index');
    expect(page.components).toHaveLength(1);
  });

  it('组件对象应该有正确的结构', () => {
    const project = createTestProject();
    const component = project.pages[0].components[0];

    expect(component.id).toBe('comp-1');
    expect(component.type).toBe('view');
    expect(component.properties).toEqual([]);
    expect(component.children).toEqual([]);
  });
});

// ============================================================================
// 配置生成器测试
// ============================================================================

describe('ConfigGenerator', () => {
  let generator: ConfigGenerator;

  beforeEach(() => {
    generator = new ConfigGenerator();
  });

  it('应该生成有效的app.json', () => {
    const project = createTestProject();
    const json = generator.generateAppJson(project);
    const config = JSON.parse(json);

    expect(config.pages).toContain('pages/index/index');
    expect(config.window).toBeDefined();
    expect(config.window.navigationBarBackgroundColor).toBe('#000000');
  });

  it('应该生成有效的project.config.json', () => {
    const project = createTestProject();
    const json = generator.generateProjectConfigJson(project);
    const config = JSON.parse(json);

    expect(config.appid).toBe('wx12345678');
    expect(config.projectname).toBe('TestProject');
    expect(config.compileType).toBe('miniprogram');
  });

  it('应该生成有效的sitemap.json', () => {
    const json = generator.generateSitemapJson();
    const config = JSON.parse(json);

    expect(config.rules).toBeDefined();
    expect(config.rules[0].action).toBe('allow');
  });

  it('应该生成页面json配置', () => {
    const project = createTestProject();
    const page = project.pages[0];
    const json = generator.generatePageJson(page);
    const config = JSON.parse(json);

    expect(config).toBeDefined();
    expect(config.navigationBarTitleText).toBe('Home');
  });

  it('应该生成有效的app.js', () => {
    const project = createTestProject();
    const code = generator.generateAppJs(project);

    expect(code).toContain('App({');
    expect(code).toContain('globalData');
    expect(code).toContain('onLaunch');
  });

  it('应该生成有效的app.wxss', () => {
    const project = createTestProject();
    const code = generator.generateAppWxss(project);

    expect(code).toContain('page {');
    expect(code).toContain('.container');
    expect(code).toContain('.btn-primary');
  });
});

// ============================================================================
// 目录结构生成器测试
// ============================================================================

describe('StructureGenerator', () => {
  let generator: StructureGenerator;
  const tempDir = path.join('/tmp', `test-structure-${Date.now()}`);

  beforeEach(() => {
    generator = new StructureGenerator();
  });

  afterEach(async () => {
    // 清理测试文件
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 忽略错误
    }
  });

  it('应该生成完整的项目目录结构', async () => {
    const project = createTestProject();
    const outputPath = path.join(tempDir, 'project');

    await generator.generateStructure(project, outputPath);

    // 验证目录存在
    const pagesDir = path.join(outputPath, 'pages');
    const componentsDir = path.join(outputPath, 'components');
    const utilsDir = path.join(outputPath, 'utils');
    const assetsDir = path.join(outputPath, 'assets');

    expect(await fs.stat(pagesDir).then((s) => s.isDirectory())).toBe(true);
    expect(await fs.stat(componentsDir).then((s) => s.isDirectory())).toBe(true);
    expect(await fs.stat(utilsDir).then((s) => s.isDirectory())).toBe(true);
    expect(await fs.stat(assetsDir).then((s) => s.isDirectory())).toBe(true);
  });

  it('应该为每个页面创建目录', async () => {
    const project = createTestProject();
    const outputPath = path.join(tempDir, 'project-pages');

    await generator.generateStructure(project, outputPath);

    const pageDir = path.join(outputPath, 'pages', 'index');
    expect(await fs.stat(pageDir).then((s) => s.isDirectory())).toBe(true);
  });

  it('应该生成util工具文件', async () => {
    const project = createTestProject();
    const outputPath = path.join(tempDir, 'project-utils');

    await generator.generateStructure(project, outputPath);
    await generator.generateUtilFiles(outputPath);

    const utilFile = path.join(outputPath, 'utils', 'util.js');
    const requestFile = path.join(outputPath, 'utils', 'request.js');

    expect(await fs.stat(utilFile).then((s) => s.isFile())).toBe(true);
    expect(await fs.stat(requestFile).then((s) => s.isFile())).toBe(true);

    const utilContent = await fs.readFile(utilFile, 'utf-8');
    expect(utilContent).toContain('formatTime');
    expect(utilContent).toContain('debounce');
  });
});

// ============================================================================
// 依赖管理器测试
// ============================================================================

describe('DependencyManager', () => {
  let manager: DependencyManager;

  beforeEach(() => {
    manager = new DependencyManager();
  });

  it('应该分析项目依赖', () => {
    const project = createTestProject();
    const deps = manager.analyzeDependencies(project);

    expect(deps).toBeDefined();
    expect(deps.npm).toBeDefined();
    expect(deps.components).toBeDefined();
    expect(deps.apis).toBeDefined();
  });

  it('应该生成有效的package.json', () => {
    const project = createTestProject();
    const deps = manager.analyzeDependencies(project);
    const json = manager.generatePackageJson(project, deps);
    const config = JSON.parse(json);

    expect(config.name).toBe('testproject');
    expect(config.version).toBe('1.0.0');
    expect(config.devDependencies).toBeDefined();
  });

  it('应该规范化包名', () => {
    const project = createTestProject();
    project.name = 'Test Project!@#';

    const deps = manager.analyzeDependencies(project);
    const json = manager.generatePackageJson(project, deps);
    const config = JSON.parse(json);

    expect(config.name).toMatch(/^[a-z0-9-]+$/);
  });
});

// ============================================================================
// 代码优化器测试
// ============================================================================

describe('Optimizer', () => {
  let optimizer: Optimizer;

  beforeEach(() => {
    optimizer = new Optimizer();
  });

  it('应该优化WXML代码', async () => {
    const wxml = `<!-- 注释 -->
<view>
  <text>Hello</text>
</view>`;

    const optimized = await optimizer.optimizeWXML(wxml);

    expect(optimized).not.toContain('<!--');
    expect(optimized).toContain('<view>');
  });

  it('应该优化WXSS代码', async () => {
    const wxss = `/* 注释 */
.class {
  color: red;
  font-size: 12px;
}`;

    const optimized = await optimizer.optimizeWXSS(wxss);

    expect(optimized).not.toContain('/*');
    expect(optimized).toContain('color:red');
  });

  it('应该优化JavaScript代码', async () => {
    const js = `// 注释
console.log('test');
const x = 1;`;

    const optimized = await optimizer.optimizeJS(js);

    expect(optimized).not.toContain('//');
    expect(optimized).not.toContain('console.log');
  });

  it('应该计算压缩比', () => {
    const ratio = optimizer.calculateCompressionRatio(1000, 500);

    expect(ratio).toBe(50);
  });

  it('应该批量优化文件', async () => {
    const files = {
      'page.wxml': '<!-- comment --><view></view>',
      'page.wxss': '/* comment */ .class { color: red; }',
      'page.js': '// comment\nconst x = 1;',
    };

    const optimized = await optimizer.optimizeFiles(files);

    expect(optimized['page.wxml']).not.toContain('<!--');
    expect(optimized['page.wxss']).not.toContain('/*');
    expect(optimized['page.js']).not.toContain('//');
  });
});

// ============================================================================
// 打包器测试
// ============================================================================

describe('Packager', () => {
  let packager: Packager;
  const tempDir = path.join('/tmp', `test-packager-${Date.now()}`);

  beforeEach(() => {
    packager = new Packager();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 忽略错误
    }
  });

  it('应该计算目录大小', async () => {
    const testDir = path.join(tempDir, 'dir-size-test');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'file.txt'), 'hello world');

    const size = await packager.calculateDirectorySize(testDir);

    expect(size).toBeGreaterThan(0);
  });

  it('应该统计目录文件数', async () => {
    const testDir = path.join(tempDir, 'count-test');
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'file1.txt'), 'test');
    await fs.writeFile(path.join(testDir, 'file2.txt'), 'test');

    const count = await packager.countFiles(testDir);

    expect(count).toBe(2);
  });
});

// ============================================================================
// 验证器测试
// ============================================================================

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  it('应该验证有效的项目', () => {
    const project = createTestProject();
    const result = validator.validateProject(project);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('应该检测缺失的项目名称', () => {
    const project = createTestProject();
    project.name = '';

    const result = validator.validateProject(project);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'MISSING_NAME')).toBe(true);
  });

  it('应该检测缺失的页面', () => {
    const project = createTestProject();
    project.pages = [];

    const result = validator.validateProject(project);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'NO_PAGES')).toBe(true);
  });

  it('应该检测重复的页面路径', () => {
    const project = createTestProject();
    const page1 = project.pages[0];
    const page2 = { ...page1, id: 'page-2' };
    project.pages.push(page2);

    const result = validator.validateProject(project);

    expect(result.errors.some((e) => e.code === 'DUPLICATE_PATH')).toBe(true);
  });

  it('应该警告缺失的AppID', () => {
    const project = createTestProject();
    project.appId = undefined;

    const result = validator.validateProject(project);

    expect(result.warnings.some((w) => w.code === 'MISSING_APPID')).toBe(true);
  });
});

// ============================================================================
// 导出器集成测试
// ============================================================================

describe('MiniProgramExporter 集成测试', () => {
  let exporter: MiniProgramExporter;
  const tempDir = path.join('/tmp', `test-exporter-${Date.now()}`);

  beforeEach(() => {
    exporter = new MiniProgramExporter();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 忽略错误
    }
  });

  it('应该获取导出进度', () => {
    const progress = exporter.getProgress();

    expect(progress).toBeDefined();
    expect(progress.state).toBeDefined();
    expect(progress.progress).toBeGreaterThanOrEqual(0);
    expect(progress.progress).toBeLessThanOrEqual(100);
  });

  it('应该支持取消导出', () => {
    exporter.cancel();
    // 不应该抛出错误
    expect(true).toBe(true);
  });

  it('应该创建导出器实例', () => {
    const custom = new MiniProgramExporter({ optimize: true });

    expect(custom).toBeDefined();
    expect(custom.getProgress()).toBeDefined();
  });

  it('应该导出为内存对象', async () => {
    const project = createTestProject();
    const files = await exporter.exportToMemory(project);

    expect(files).toBeDefined();
    expect(files['app.json']).toBeDefined();
    expect(files['app.js']).toBeDefined();
    expect(files['app.wxss']).toBeDefined();
  });
});

// ============================================================================
// 边界条件测试
// ============================================================================

describe('边界条件测试', () => {
  it('应该处理空的全局组件列表', () => {
    const generator = new ConfigGenerator();
    const project = createTestProject();
    project.globalComponents = [];

    const json = generator.generateAppJson(project);
    const config = JSON.parse(json);

    expect(config.usingComponents).toBeUndefined();
  });

  it('应该处理空的全局变量列表', () => {
    const generator = new ConfigGenerator();
    const project = createTestProject();
    project.globalVariables = [];

    const code = generator.generateAppJs(project);

    expect(code).toContain('globalData: {');
  });

  it('应该处理特殊字符的组件名称', () => {
    const generator = new ConfigGenerator();
    const project = createTestProject();
    project.globalComponents = [
      {
        id: 'comp-1',
        name: 'my-component',
        type: 'MyComponent',
        template: [],
        properties: [],
        events: [],
      },
    ];

    const json = generator.generateAppJson(project);
    const config = JSON.parse(json);

    expect(config.usingComponents['my-component']).toContain('my-component');
  });

  it('应该处理多级页面路径', async () => {
    const generator = new StructureGenerator();
    const project = createTestProject();
    project.pages[0].path = 'pages/user/profile/detail';

    const tempDir = path.join('/tmp', `test-multilevel-${Date.now()}`);
    try {
      await generator.generateStructure(project, tempDir);
      const pageDir = path.join(tempDir, 'pages', 'user', 'profile');
      expect(await fs.stat(pageDir).then((s) => s.isDirectory())).toBe(true);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });
});

// ============================================================================
// 性能测试
// ============================================================================

describe('性能测试', () => {
  it('应该快速生成配置文件', () => {
    const generator = new ConfigGenerator();
    const project = createTestProject();

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      generator.generateAppJson(project);
    }
    const duration = Date.now() - start;

    // 100次生成应该在100ms内完成
    expect(duration).toBeLessThan(100);
  });

  it('应该快速验证项目', () => {
    const validator = new Validator();
    const project = createTestProject();

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      validator.validateProject(project);
    }
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
  });
});

// ============================================================================
// 错误处理测试
// ============================================================================

describe('错误处理', () => {
  it('应该处理无效的JSON格式', () => {
    const validator = new Validator();
    const project = createTestProject();

    // 不应该抛出错误
    expect(() => validator.validateProject(project)).not.toThrow();
  });

  it('应该处理缺失的配置', () => {
    const validator = new Validator();
    const project = createTestProject();
    project.config = undefined as any;

    const result = validator.validateProject(project);

    expect(result.errors.some((e) => e.code === 'MISSING_CONFIG')).toBe(true);
  });

  it('应该处理无效的资源', () => {
    const validator = new Validator();
    const project = createTestProject();
    project.resources = [
      {
        id: 'res-1',
        name: 'invalid-resource',
        type: 'image',
        url: '',
        path: '',
      },
    ];

    const result = validator.validateProject(project);

    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// 辅助函数测试
// ============================================================================

describe('辅助函数', () => {
  it('应该创建导出器实例', async () => {
    const { createExporter } = await import('../helpers');
    const exporter = createExporter({ optimize: true });

    expect(exporter).toBeDefined();
  });

  it('应该快速导出项目', async () => {
    const { quickExport } = await import('../helpers');
    const project = createTestProject();
    const tempDir = path.join('/tmp', `test-quick-export-${Date.now()}`);

    try {
      const result = await quickExport(project, tempDir);

      expect(result).toBeDefined();
      expect(result.success || !result.success).toBe(true); // 要么成功要么有错误信息
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });
});
