/**
 * 验证器
 *
 * 负责验证导出项目的完整性和正确性
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  MiniProgramProject,
  Page,
} from '../../01_Core_ProjectStructure/implementation/types';
import type { ValidationResult, ValidationError, ValidationWarning } from './types';

/**
 * 验证器
 */
export class Validator {
  /**
   * 验证项目输入
   * @param project 项目对象
   * @returns 验证结果
   */
  validateProject(project: MiniProgramProject): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. 验证必填字段
    if (!project.name || project.name.trim() === '') {
      errors.push({
        code: 'MISSING_NAME',
        message: '项目名称不能为空',
      });
    }

    if (!project.id) {
      errors.push({
        code: 'MISSING_ID',
        message: '项目ID不能为空',
      });
    }

    // 2. 验证页面
    if (!project.pages || project.pages.length === 0) {
      errors.push({
        code: 'NO_PAGES',
        message: '项目必须包含至少一个页面',
      });
    } else {
      // 验证页面路径唯一性
      const paths = new Set<string>();
      for (const page of project.pages) {
        if (paths.has(page.path)) {
          errors.push({
            code: 'DUPLICATE_PATH',
            message: `页面路径重复: ${page.path}`,
            path: page.path,
          });
        }
        paths.add(page.path);

        // 验证页面名称
        if (!page.name) {
          errors.push({
            code: 'MISSING_PAGE_NAME',
            message: `页面缺少名称: ${page.path}`,
            path: page.path,
          });
        }
      }
    }

    // 3. 验证配置
    if (!project.config) {
      errors.push({
        code: 'MISSING_CONFIG',
        message: '项目配置不能为空',
      });
    } else {
      // 验证window配置
      if (!project.config.window) {
        warnings.push({
          code: 'MISSING_WINDOW_CONFIG',
          message: '缺少window配置,将使用默认值',
        });
      }
    }

    // 4. 验证资源
    if (project.resources) {
      for (const resource of project.resources) {
        if (!resource.path && !resource.url) {
          errors.push({
            code: 'INVALID_RESOURCE',
            message: `资源 ${resource.name} 缺少路径或URL`,
            path: resource.id,
          });
        }
      }
    }

    // 5. 验证AppID
    if (!project.appId) {
      warnings.push({
        code: 'MISSING_APPID',
        message: '缺少AppID,需要在微信开发者工具中配置',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks: {
        structure: true,
        config: project.config !== undefined,
        code: true,
        resources: true,
      },
    };
  }

  /**
   * 验证导出的项目结构
   * @param projectPath 项目路径
   * @returns 验证结果
   */
  async validateStructure(projectPath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. 验证根目录存在
    try {
      await fs.access(projectPath);
    } catch {
      errors.push({
        code: 'PROJECT_NOT_FOUND',
        message: `项目目录不存在: ${projectPath}`,
        path: projectPath,
      });
      return {
        valid: false,
        errors,
        warnings,
        checks: {
          structure: false,
          config: false,
          code: false,
          resources: false,
        },
      };
    }

    // 2. 验证必需文件
    const requiredFiles = ['app.json', 'app.js', 'app.wxss'];
    for (const file of requiredFiles) {
      const filePath = path.join(projectPath, file);
      try {
        await fs.access(filePath);
      } catch {
        errors.push({
          code: 'MISSING_FILE',
          message: `缺少必需文件: ${file}`,
          path: filePath,
        });
      }
    }

    // 3. 验证必需目录
    const requiredDirs = ['pages'];
    for (const dir of requiredDirs) {
      const dirPath = path.join(projectPath, dir);
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          errors.push({
            code: 'INVALID_DIRECTORY',
            message: `${dir} 不是目录`,
            path: dirPath,
          });
        }
      } catch {
        errors.push({
          code: 'MISSING_DIRECTORY',
          message: `缺少必需目录: ${dir}`,
          path: dirPath,
        });
      }
    }

    // 4. 验证pages目录是否为空
    const pagesDir = path.join(projectPath, 'pages');
    try {
      const entries = await fs.readdir(pagesDir);
      if (entries.length === 0) {
        errors.push({
          code: 'EMPTY_PAGES',
          message: 'pages目录为空',
          path: pagesDir,
        });
      }
    } catch {
      // 已在上面检查过
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks: {
        structure: errors.length === 0,
        config: false,
        code: false,
        resources: false,
      },
    };
  }

  /**
   * 验证配置文件
   * @param projectPath 项目路径
   * @returns 验证结果
   */
  async validateConfigs(projectPath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. 验证app.json
    const appJsonPath = path.join(projectPath, 'app.json');
    try {
      const content = await fs.readFile(appJsonPath, 'utf-8');
      const config = JSON.parse(content);

      // 验证pages字段
      if (!config.pages || !Array.isArray(config.pages)) {
        errors.push({
          code: 'INVALID_APP_JSON',
          message: 'app.json缺少pages字段或格式错误',
          path: appJsonPath,
        });
      } else if (config.pages.length === 0) {
        errors.push({
          code: 'EMPTY_PAGES',
          message: 'app.json的pages字段为空',
          path: appJsonPath,
        });
      }

      // 验证window字段
      if (!config.window) {
        warnings.push({
          code: 'MISSING_WINDOW',
          message: 'app.json缺少window配置',
          path: appJsonPath,
        });
      }
    } catch (error) {
      errors.push({
        code: 'INVALID_JSON',
        message: `app.json格式错误: ${(error as Error).message}`,
        path: appJsonPath,
      });
    }

    // 2. 验证project.config.json
    const projectConfigPath = path.join(projectPath, 'project.config.json');
    try {
      const content = await fs.readFile(projectConfigPath, 'utf-8');
      const config = JSON.parse(content);

      if (!config.appid) {
        warnings.push({
          code: 'MISSING_APPID',
          message: 'project.config.json缺少appid',
          path: projectConfigPath,
        });
      }

      if (!config.projectname) {
        warnings.push({
          code: 'MISSING_PROJECTNAME',
          message: 'project.config.json缺少projectname',
          path: projectConfigPath,
        });
      }
    } catch (error) {
      errors.push({
        code: 'INVALID_JSON',
        message: `project.config.json格式错误: ${(error as Error).message}`,
        path: projectConfigPath,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks: {
        structure: true,
        config: errors.length === 0,
        code: false,
        resources: false,
      },
    };
  }

  /**
   * 验证代码文件
   * @param projectPath 项目路径
   * @returns 验证结果
   */
  async validateCode(projectPath: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 读取app.json获取页面列表
    const appJsonPath = path.join(projectPath, 'app.json');
    let pages: string[] = [];

    try {
      const content = await fs.readFile(appJsonPath, 'utf-8');
      const config = JSON.parse(content);
      pages = config.pages || [];
    } catch {
      errors.push({
        code: 'CANNOT_READ_APP_JSON',
        message: '无法读取app.json',
        path: appJsonPath,
      });
      return {
        valid: false,
        errors,
        warnings,
        checks: {
          structure: true,
          config: true,
          code: false,
          resources: false,
        },
      };
    }

    // 验证每个页面的文件
    for (const pagePath of pages) {
      const pageDir = path.join(projectPath, pagePath);
      const baseName = path.basename(pagePath);

      // 验证四个必需文件
      const requiredFiles = [
        `${baseName}.wxml`,
        `${baseName}.wxss`,
        `${baseName}.js`,
        `${baseName}.json`,
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(path.dirname(pageDir), file);
        try {
          await fs.access(filePath);
        } catch {
          errors.push({
            code: 'MISSING_PAGE_FILE',
            message: `页面文件缺失: ${pagePath}/${file}`,
            path: filePath,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks: {
        structure: true,
        config: true,
        code: errors.length === 0,
        resources: false,
      },
    };
  }

  /**
   * 完整验证
   * @param projectPath 项目路径
   * @returns 验证结果
   */
  async validate(projectPath: string): Promise<ValidationResult> {
    const results = await Promise.all([
      this.validateStructure(projectPath),
      this.validateConfigs(projectPath),
      this.validateCode(projectPath),
    ]);

    // 合并所有结果
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const result of results) {
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      checks: {
        structure: results[0].checks.structure,
        config: results[1].checks.config,
        code: results[2].checks.code,
        resources: true,
      },
    };
  }
}
