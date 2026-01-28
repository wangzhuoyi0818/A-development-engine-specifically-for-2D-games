/**
 * 微信小程序可视化开发平台 - 导入语句生成器
 *
 * 负责生成JavaScript代码的导入语句
 */

import type {
  ImportGenerator as IImportGenerator,
  ImportGeneratorInput,
  GenerationContext,
  ValidationResult,
} from './types';

/**
 * 导入项
 */
interface ImportItem {
  /** 导入路径 */
  path: string;

  /** 导入的名称列表 */
  names: string[];

  /** 导入类型: default, named, namespace */
  type: 'default' | 'named' | 'namespace';

  /** 别名 */
  alias?: string;
}

/**
 * 导入语句生成器实现
 */
export class ImportGenerator implements IImportGenerator {
  private imports: Map<string, ImportItem> = new Map();

  /**
   * 添加导入
   */
  addImport(importPath: string, names?: string[]): void {
    if (this.imports.has(importPath)) {
      // 合并导入
      const existing = this.imports.get(importPath)!;

      if (names && names.length > 0) {
        existing.names = Array.from(new Set([...existing.names, ...names]));
      }
    } else {
      // 新增导入
      this.imports.set(importPath, {
        path: importPath,
        names: names || [],
        type: this.detectImportType(names),
      });
    }
  }

  /**
   * 添加默认导入
   */
  addDefaultImport(importPath: string, name: string): void {
    this.imports.set(importPath, {
      path: importPath,
      names: [name],
      type: 'default',
    });
  }

  /**
   * 添加命名空间导入
   */
  addNamespaceImport(importPath: string, alias: string): void {
    this.imports.set(importPath, {
      path: importPath,
      names: [],
      type: 'namespace',
      alias,
    });
  }

  /**
   * 生成所有导入语句
   */
  generateImports(context: GenerationContext): string {
    if (this.imports.size === 0) {
      return '';
    }

    const importStatements = Array.from(this.imports.values())
      .map((item) => this.generateImportStatement(item, context))
      .filter((stmt) => stmt.length > 0);

    return importStatements.join('\n') + '\n\n';
  }

  /**
   * 生成代码
   */
  generate(input: ImportGeneratorInput, context: GenerationContext): string {
    // 处理输入
    if (input.externalLibraries) {
      input.externalLibraries.forEach((lib) => this.addImport(lib));
    }

    if (input.localModules) {
      input.localModules.forEach((module) => this.addImport(module));
    }

    if (input.componentDependencies) {
      input.componentDependencies.forEach((comp) => {
        this.addImport(comp);
      });
    }

    return this.generateImports(context);
  }

  /**
   * 验证输入
   */
  validate(input: ImportGeneratorInput): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // 验证外部库
    if (input.externalLibraries) {
      input.externalLibraries.forEach((lib) => {
        if (!this.isValidImportPath(lib)) {
          errors.push({
            code: 'INVALID_IMPORT_PATH',
            message: `无效的导入路径: ${lib}`,
          });
        }
      });
    }

    // 验证本地模块
    if (input.localModules) {
      input.localModules.forEach((module) => {
        if (!this.isValidImportPath(module)) {
          errors.push({
            code: 'INVALID_IMPORT_PATH',
            message: `无效的导入路径: ${module}`,
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 清空所有导入
   */
  clear(): void {
    this.imports.clear();
  }

  /**
   * 检测导入类型
   */
  private detectImportType(names?: string[]): 'default' | 'named' | 'namespace' {
    if (!names || names.length === 0) {
      return 'default';
    }

    if (names.length === 1 && !names[0].includes('{')) {
      return 'default';
    }

    return 'named';
  }

  /**
   * 生成单个导入语句
   */
  private generateImportStatement(item: ImportItem, context: GenerationContext): string {
    const { path, names, type, alias } = item;

    // 微信小程序不支持ES6 import,使用require
    switch (type) {
      case 'default':
        if (names.length > 0) {
          return `const ${names[0]} = require('${path}')`;
        }
        return `require('${path}')`;

      case 'named':
        if (names.length === 0) {
          return '';
        }
        // 解构赋值
        return `const { ${names.join(', ')} } = require('${path}')`;

      case 'namespace':
        if (alias) {
          return `const ${alias} = require('${path}')`;
        }
        return `const imported = require('${path}')`;

      default:
        return '';
    }
  }

  /**
   * 验证导入路径
   */
  private isValidImportPath(path: string): boolean {
    if (!path || path.trim().length === 0) {
      return false;
    }

    // 允许的路径格式:
    // - 相对路径: ./xxx, ../xxx
    // - 绝对路径: /xxx
    // - npm包: package-name
    const validPatterns = [
      /^\.{1,2}\//,     // 相对路径
      /^\//,            // 绝对路径
      /^[a-zA-Z]/,      // npm包
    ];

    return validPatterns.some((pattern) => pattern.test(path));
  }

  /**
   * 添加微信API导入(如果需要)
   */
  addWxAPIImport(apiName: string): void {
    // 微信API不需要导入,全局可用
    // 但可以记录使用的API
    context.requiredAPIs?.add(apiName);
  }

  /**
   * 获取所有导入路径
   */
  getImportPaths(): string[] {
    return Array.from(this.imports.keys());
  }

  /**
   * 获取导入项
   */
  getImportItem(path: string): ImportItem | undefined {
    return this.imports.get(path);
  }

  /**
   * 判断是否有导入
   */
  hasImports(): boolean {
    return this.imports.size > 0;
  }
}

/**
 * 创建导入生成器
 */
export function createImportGenerator(): ImportGenerator {
  return new ImportGenerator();
}

/**
 * 从代码中提取导入
 */
export function extractImportsFromCode(code: string): string[] {
  const imports: string[] = [];

  // 匹配require语句
  const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match;

  while ((match = requirePattern.exec(code)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * 合并导入语句
 */
export function mergeImports(imports1: string, imports2: string): string {
  const generator = new ImportGenerator();

  // 提取第一组导入
  const paths1 = extractImportsFromCode(imports1);
  paths1.forEach((path) => generator.addImport(path));

  // 提取第二组导入
  const paths2 = extractImportsFromCode(imports2);
  paths2.forEach((path) => generator.addImport(path));

  // 生成合并后的导入
  return generator.generateImports({
    type: 'page',
    name: '',
    variables: [],
    imports: new Set(),
    methods: new Map(),
    helpers: new Map(),
    indentLevel: 0,
    inAsyncContext: false,
    requiredAPIs: new Set(),
    config: {
      target: 'page',
    },
  });
}
