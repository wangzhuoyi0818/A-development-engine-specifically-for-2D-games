/**
 * 小程序导出器 - 核心导出器
 *
 * 协调整个导出流程,集成所有子模块
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  MiniProgramProject,
  Page,
  Component,
} from '../../01_Core_ProjectStructure/implementation/types';
import { WXMLGenerator } from '../../09_CodeGenerator_WXMLGenerator/implementation/wxml-generator';
import { WXSSGenerator } from '../../10_CodeGenerator_WXSSGenerator/implementation/wxss-generator';
import { JSGenerator } from '../../11_CodeGenerator_JSGenerator/implementation/js-generator';
import { ConfigGenerator } from './config-generator';
import { StructureGenerator } from './structure-generator';
import { DependencyManager } from './dependency-manager';
import { Optimizer } from './optimizer';
import { Packager } from './packager';
import { Validator } from './validator';
import type {
  ExporterOptions,
  ExportResult,
  ExportState,
  ExportProgress,
  GeneratedFiles,
  ExportError,
  ExportWarning,
  PageCodeResult,
  IExporter,
  ExportHooks,
} from './types';
import { DEFAULT_EXPORTER_OPTIONS } from './types';

/**
 * 小程序导出器
 */
export class MiniProgramExporter implements IExporter {
  private options: Required<ExporterOptions>;
  private configGenerator: ConfigGenerator;
  private structureGenerator: StructureGenerator;
  private dependencyManager: DependencyManager;
  private optimizer: Optimizer;
  private packager: Packager;
  private validator: Validator;
  private wxmlGenerator: typeof WXMLGenerator;
  private wxssGenerator: WXSSGenerator;
  private jsGenerator: JSGenerator;

  private currentState: ExportState = ExportState.IDLE;
  private currentProgress: ExportProgress = {
    state: ExportState.IDLE,
    progress: 0,
    currentTask: '',
    processedFiles: 0,
    totalFiles: 0,
  };
  private cancelled: boolean = false;
  private hooks?: ExportHooks;

  constructor(options: Partial<ExporterOptions> = {}, hooks?: ExportHooks) {
    this.options = { ...DEFAULT_EXPORTER_OPTIONS, ...options };
    this.hooks = hooks;

    // 初始化子模块
    this.configGenerator = new ConfigGenerator();
    this.structureGenerator = new StructureGenerator();
    this.dependencyManager = new DependencyManager();
    this.optimizer = new Optimizer();
    this.packager = new Packager();
    this.validator = new Validator();

    // 初始化代码生成器
    this.wxmlGenerator = WXMLGenerator;
    this.wxssGenerator = new WXSSGenerator();
    this.jsGenerator = new JSGenerator();
  }

  /**
   * 导出项目到文件系统
   * @param project 项目对象
   * @param outputPath 输出路径
   * @returns 导出结果
   */
  async export(
    project: MiniProgramProject,
    outputPath: string
  ): Promise<ExportResult> {
    const startTime = Date.now();
    const errors: ExportError[] = [];
    const warnings: ExportWarning[] = [];
    this.cancelled = false;

    try {
      // 触发beforeExport钩子
      if (this.hooks?.beforeExport) {
        await this.hooks.beforeExport(project);
      }

      // 1. 验证输入
      this.updateState(ExportState.VALIDATING, '验证项目数据');
      const validationResult = this.validator.validateProject(project);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      if (!validationResult.valid) {
        throw new Error('项目验证失败');
      }

      // 触发afterValidation钩子
      if (this.hooks?.afterValidation) {
        await this.hooks.afterValidation(validationResult);
      }

      // 2. 生成目录结构
      this.updateState(ExportState.GENERATING_STRUCTURE, '生成目录结构');
      const projectPath = path.join(outputPath, this.options.outputDirName);
      await this.structureGenerator.generateStructure(project, projectPath);
      await this.structureGenerator.generateUtilFiles(projectPath);

      // 3. 生成代码文件
      this.updateState(ExportState.GENERATING_CODE, '生成代码文件');
      const generatedFiles: GeneratedFiles = {};

      // 并行生成页面代码
      const pageResults = await this.generatePagesInParallel(project.pages);
      for (const result of pageResults) {
        if (this.cancelled) throw new Error('导出已取消');

        errors.push(...result.errors);
        warnings.push(...result.warnings);

        // 写入文件
        const pagePath = path.join(projectPath, result.path);
        await fs.writeFile(`${pagePath}.wxml`, result.wxml, 'utf-8');
        await fs.writeFile(`${pagePath}.wxss`, result.wxss, 'utf-8');
        await fs.writeFile(`${pagePath}.js`, result.js, 'utf-8');
        await fs.writeFile(`${pagePath}.json`, result.json, 'utf-8');

        generatedFiles[`${result.path}.wxml`] = result.wxml;
        generatedFiles[`${result.path}.wxss`] = result.wxss;
        generatedFiles[`${result.path}.js`] = result.js;
        generatedFiles[`${result.path}.json`] = result.json;
      }

      // 4. 生成配置文件
      this.updateProgress('生成配置文件');
      const appJson = this.configGenerator.generateAppJson(project);
      const projectConfigJson =
        this.configGenerator.generateProjectConfigJson(project);
      const sitemapJson = this.configGenerator.generateSitemapJson();
      const appJs = this.configGenerator.generateAppJs(project);
      const appWxss = this.configGenerator.generateAppWxss(project);

      await fs.writeFile(path.join(projectPath, 'app.json'), appJson, 'utf-8');
      await fs.writeFile(
        path.join(projectPath, 'project.config.json'),
        projectConfigJson,
        'utf-8'
      );
      await fs.writeFile(
        path.join(projectPath, 'sitemap.json'),
        sitemapJson,
        'utf-8'
      );
      await fs.writeFile(path.join(projectPath, 'app.js'), appJs, 'utf-8');
      await fs.writeFile(path.join(projectPath, 'app.wxss'), appWxss, 'utf-8');

      generatedFiles['app.json'] = appJson;
      generatedFiles['project.config.json'] = projectConfigJson;
      generatedFiles['sitemap.json'] = sitemapJson;
      generatedFiles['app.js'] = appJs;
      generatedFiles['app.wxss'] = appWxss;

      // 5. 复制资源文件
      this.updateState(ExportState.COPYING_RESOURCES, '复制资源文件');
      const resourceResult = await this.structureGenerator.copyResources(
        project.resources,
        process.cwd(),
        projectPath
      );

      if (resourceResult.failed.length > 0) {
        warnings.push({
          code: 'RESOURCE_COPY_FAILED',
          message: `${resourceResult.failed.length}个资源文件复制失败`,
        });
      }

      // 6. 生成package.json
      this.updateProgress('生成依赖配置');
      const dependencies = this.dependencyManager.analyzeDependencies(project);
      const packageJson = this.dependencyManager.generatePackageJson(
        project,
        dependencies
      );
      await fs.writeFile(
        path.join(projectPath, 'package.json'),
        packageJson,
        'utf-8'
      );
      generatedFiles['package.json'] = packageJson;

      // 7. 代码优化(可选)
      let optimizedFiles = generatedFiles;
      if (this.options.optimize) {
        this.updateState(ExportState.OPTIMIZING, '优化代码');

        if (this.hooks?.beforeOptimize) {
          await this.hooks.beforeOptimize(generatedFiles);
        }

        optimizedFiles = await this.optimizeGeneratedFiles(
          generatedFiles,
          projectPath
        );

        if (this.hooks?.afterOptimize) {
          await this.hooks.afterOptimize(optimizedFiles);
        }
      }

      // 8. 验证导出的项目
      this.updateState(ExportState.VALIDATING_OUTPUT, '验证导出结果');
      const outputValidation = await this.validator.validate(projectPath);
      if (!outputValidation.valid) {
        errors.push(...outputValidation.errors);
        warnings.push(...outputValidation.warnings);
      }

      // 9. 打包(可选)
      let packagePath: string | undefined;
      if (this.options.autoPackage) {
        this.updateState(ExportState.PACKAGING, '打包项目');
        packagePath = path.join(
          outputPath,
          `${project.name}-${project.version}.zip`
        );
        await this.packager.packToZip(projectPath, packagePath);
      }

      // 10. 完成
      this.updateState(ExportState.COMPLETED, '导出完成');

      // 计算统计信息
      const stats = await this.calculateStats(
        projectPath,
        project,
        generatedFiles,
        optimizedFiles,
        Date.now() - startTime
      );

      const result: ExportResult = {
        success: errors.length === 0,
        outputPath: projectPath,
        files: optimizedFiles,
        packagePath,
        errors,
        warnings,
        stats,
      };

      // 触发onComplete钩子
      if (this.hooks?.onComplete) {
        await this.hooks.onComplete(result);
      }

      return result;
    } catch (error) {
      this.updateState(ExportState.FAILED, '导出失败');

      const exportError: ExportError = {
        code: 'EXPORT_FAILED',
        message: (error as Error).message,
        details: error,
      };
      errors.push(exportError);

      // 触发onError钩子
      if (this.hooks?.onError) {
        await this.hooks.onError(exportError);
      }

      return {
        success: false,
        outputPath: path.join(outputPath, this.options.outputDirName),
        files: {},
        errors,
        warnings,
        stats: {
          totalFiles: 0,
          totalSize: 0,
          pageCount: 0,
          componentCount: 0,
          resourceCount: 0,
          duration: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 导出为内存对象
   * @param project 项目对象
   * @returns 生成的文件映射
   */
  async exportToMemory(project: MiniProgramProject): Promise<GeneratedFiles> {
    const files: GeneratedFiles = {};

    // 生成配置文件
    files['app.json'] = this.configGenerator.generateAppJson(project);
    files['project.config.json'] =
      this.configGenerator.generateProjectConfigJson(project);
    files['sitemap.json'] = this.configGenerator.generateSitemapJson();
    files['app.js'] = this.configGenerator.generateAppJs(project);
    files['app.wxss'] = this.configGenerator.generateAppWxss(project);

    // 生成页面代码
    for (const page of project.pages) {
      const result = await this.generatePageCode(page);
      files[`${page.path}.wxml`] = result.wxml;
      files[`${page.path}.wxss`] = result.wxss;
      files[`${page.path}.js`] = result.js;
      files[`${page.path}.json`] = result.json;
    }

    // 生成package.json
    const dependencies = this.dependencyManager.analyzeDependencies(project);
    files['package.json'] = this.dependencyManager.generatePackageJson(
      project,
      dependencies
    );

    return files;
  }

  /**
   * 导出并打包为zip
   * @param project 项目对象
   * @param outputPath 输出路径
   * @returns 导出结果
   */
  async exportToZip(
    project: MiniProgramProject,
    outputPath: string
  ): Promise<ExportResult> {
    // 先导出到临时目录
    const result = await this.export(project, outputPath);

    if (!result.success) {
      return result;
    }

    // 打包
    const zipPath = path.join(
      outputPath,
      `${project.name}-${project.version}.zip`
    );
    await this.packager.packToZip(result.outputPath, zipPath);

    result.packagePath = zipPath;
    return result;
  }

  /**
   * 获取导出进度
   * @returns 导出进度
   */
  getProgress(): ExportProgress {
    return { ...this.currentProgress };
  }

  /**
   * 取消导出
   */
  cancel(): void {
    this.cancelled = true;
  }

  /**
   * 并行生成页面代码
   * @param pages 页面列表
   * @returns 页面代码结果列表
   */
  private async generatePagesInParallel(
    pages: Page[]
  ): Promise<PageCodeResult[]> {
    const results: PageCodeResult[] = [];
    const concurrency = this.options.concurrency;

    for (let i = 0; i < pages.length; i += concurrency) {
      const batch = pages.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map((page) => this.generatePageCode(page))
      );
      results.push(...batchResults);

      this.updateProgress(
        `生成页面代码 (${Math.min(i + concurrency, pages.length)}/${pages.length})`
      );
    }

    return results;
  }

  /**
   * 生成单个页面的代码
   * @param page 页面对象
   * @returns 页面代码结果
   */
  private async generatePageCode(page: Page): Promise<PageCodeResult> {
    const errors: ExportError[] = [];
    const warnings: ExportWarning[] = [];

    try {
      // 触发beforeGenerate钩子
      if (this.hooks?.beforeGenerate) {
        await this.hooks.beforeGenerate(page);
      }

      // 生成WXML
      const wxmlResult = this.wxmlGenerator.generate(page);
      if (!wxmlResult.success) {
        errors.push(
          ...wxmlResult.errors.map((e) => ({
            code: e.code,
            message: e.message,
            filePath: `${page.path}.wxml`,
          }))
        );
      }

      // 生成WXSS
      const wxss = this.wxssGenerator.generateWXSS(page.components);

      // 生成JavaScript
      const jsResult = this.jsGenerator.generatePageCode(page);
      if (!jsResult.success) {
        errors.push(
          ...jsResult.errors.map((e) => ({
            code: e.code,
            message: e.message,
            filePath: `${page.path}.js`,
          }))
        );
      }

      // 生成JSON配置
      const json = this.configGenerator.generatePageJson(page);

      const result: PageCodeResult = {
        path: page.path,
        wxml: wxmlResult.code,
        wxss,
        js: jsResult.code || '',
        json,
        errors,
        warnings,
      };

      // 触发afterGenerate钩子
      if (this.hooks?.afterGenerate) {
        await this.hooks.afterGenerate(result);
      }

      return result;
    } catch (error) {
      errors.push({
        code: 'PAGE_GENERATION_ERROR',
        message: `生成页面失败: ${(error as Error).message}`,
        filePath: page.path,
      });

      return {
        path: page.path,
        wxml: '',
        wxss: '',
        js: '',
        json: '{}',
        errors,
        warnings,
      };
    }
  }

  /**
   * 优化生成的文件
   * @param files 文件映射
   * @param projectPath 项目路径
   * @returns 优化后的文件映射
   */
  private async optimizeGeneratedFiles(
    files: GeneratedFiles,
    projectPath: string
  ): Promise<GeneratedFiles> {
    const optimized: GeneratedFiles = {};

    for (const [filePath, content] of Object.entries(files)) {
      if (typeof content === 'string') {
        const ext = path.extname(filePath);

        switch (ext) {
          case '.wxml':
            optimized[filePath] = await this.optimizer.optimizeWXML(content);
            break;
          case '.wxss':
            optimized[filePath] = await this.optimizer.optimizeWXSS(content);
            break;
          case '.js':
            optimized[filePath] = await this.optimizer.optimizeJS(content);
            break;
          default:
            optimized[filePath] = content;
        }

        // 写入优化后的文件
        const fullPath = path.join(projectPath, filePath);
        await fs.writeFile(fullPath, optimized[filePath], 'utf-8');
      } else {
        optimized[filePath] = content;
      }
    }

    return optimized;
  }

  /**
   * 计算统计信息
   * @param projectPath 项目路径
   * @param project 项目对象
   * @param originalFiles 原始文件
   * @param optimizedFiles 优化后的文件
   * @param duration 耗时
   * @returns 统计信息
   */
  private async calculateStats(
    projectPath: string,
    project: MiniProgramProject,
    originalFiles: GeneratedFiles,
    optimizedFiles: GeneratedFiles,
    duration: number
  ) {
    const totalSize = await this.packager.calculateDirectorySize(projectPath);
    const fileCount = await this.packager.countFiles(projectPath);

    // 计算压缩比
    let compressionRatio: number | undefined;
    if (this.options.optimize) {
      const originalSize = this.calculateFilesSize(originalFiles);
      const optimizedSize = this.calculateFilesSize(optimizedFiles);
      compressionRatio = this.optimizer.calculateCompressionRatio(
        originalSize,
        optimizedSize
      );
    }

    return {
      totalFiles: fileCount,
      totalSize,
      pageCount: project.pages.length,
      componentCount: project.globalComponents.length,
      resourceCount: project.resources.length,
      duration,
      compressionRatio,
    };
  }

  /**
   * 计算文件总大小
   * @param files 文件映射
   * @returns 总大小(字节)
   */
  private calculateFilesSize(files: GeneratedFiles): number {
    let size = 0;
    for (const content of Object.values(files)) {
      if (typeof content === 'string') {
        size += Buffer.byteLength(content, 'utf-8');
      } else {
        size += content.length;
      }
    }
    return size;
  }

  /**
   * 更新导出状态
   * @param state 新状态
   * @param task 当前任务描述
   */
  private updateState(state: ExportState, task: string): void {
    this.currentState = state;
    this.currentProgress.state = state;
    this.currentProgress.currentTask = task;

    // 根据状态更新进度
    const progressMap: Record<ExportState, number> = {
      [ExportState.IDLE]: 0,
      [ExportState.VALIDATING]: 10,
      [ExportState.GENERATING_STRUCTURE]: 20,
      [ExportState.GENERATING_CODE]: 50,
      [ExportState.COPYING_RESOURCES]: 70,
      [ExportState.OPTIMIZING]: 80,
      [ExportState.VALIDATING_OUTPUT]: 90,
      [ExportState.PACKAGING]: 95,
      [ExportState.COMPLETED]: 100,
      [ExportState.FAILED]: 0,
    };

    this.currentProgress.progress = progressMap[state] || 0;

    // 触发onProgress钩子
    if (this.hooks?.onProgress) {
      this.hooks.onProgress(this.currentProgress);
    }
  }

  /**
   * 更新进度描述
   * @param task 任务描述
   */
  private updateProgress(task: string): void {
    this.currentProgress.currentTask = task;
    this.currentProgress.processedFiles++;

    // 触发onProgress钩子
    if (this.hooks?.onProgress) {
      this.hooks.onProgress(this.currentProgress);
    }
  }
}
