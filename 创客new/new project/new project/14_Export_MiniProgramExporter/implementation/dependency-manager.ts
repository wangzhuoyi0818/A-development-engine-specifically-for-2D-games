/**
 * 依赖管理器
 *
 * 负责分析项目依赖并生成package.json
 */

import type {
  MiniProgramProject,
  Page,
} from '../../01_Core_ProjectStructure/implementation/types';
import type { Dependencies, PackageConfig } from './types';

/**
 * 依赖管理器
 */
export class DependencyManager {
  /**
   * 分析项目依赖
   * @param project 项目对象
   * @returns 依赖信息
   */
  analyzeDependencies(project: MiniProgramProject): Dependencies {
    const dependencies: Dependencies = {
      npm: {},
      components: [],
      apis: [],
      plugins: {},
    };

    // 分析全局组件依赖
    for (const component of project.globalComponents) {
      if (component.external) {
        dependencies.components.push(component.name);
        // 如果是npm组件,添加npm依赖
        if (component.npmPackage) {
          dependencies.npm[component.npmPackage] = component.version || 'latest';
        }
      }
    }

    // 分析页面中使用的API
    for (const page of project.pages) {
      const apis = this.extractAPIsFromPage(page);
      dependencies.apis.push(...apis);
    }

    // 去重
    dependencies.apis = Array.from(new Set(dependencies.apis));
    dependencies.components = Array.from(new Set(dependencies.components));

    // 分析插件依赖
    if (project.config.plugins) {
      dependencies.plugins = project.config.plugins;
    }

    // 添加常用npm依赖
    this.addCommonDependencies(dependencies);

    return dependencies;
  }

  /**
   * 生成package.json
   * @param project 项目对象
   * @param deps 依赖信息
   * @returns package.json内容
   */
  generatePackageJson(
    project: MiniProgramProject,
    deps: Dependencies
  ): string {
    const config: PackageConfig = {
      name: this.sanitizePackageName(project.name),
      version: project.version || '1.0.0',
      description: project.description || `${project.name} - 微信小程序`,
      dependencies: deps.npm,
      devDependencies: {
        'miniprogram-api-typings': '^3.12.2',
      },
      scripts: {
        dev: 'npm run build:dev',
        build: 'npm run build:prod',
        'build:dev': 'echo "开发构建"',
        'build:prod': 'echo "生产构建"',
      },
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 从页面中提取使用的微信API
   * @param page 页面对象
   * @returns API列表
   */
  private extractAPIsFromPage(page: Page): string[] {
    const apis: string[] = [];

    // 从生命周期事件中提取
    if (page.lifecycleEvents) {
      for (const event of page.lifecycleEvents) {
        if (event.actions) {
          for (const action of event.actions) {
            // 检查action是否是微信API调用
            if (action.type === 'request' && action.params?.url) {
              apis.push('wx.request');
            }
          }
        }
      }
    }

    // 从自定义事件中提取
    if (page.customEvents) {
      for (const event of page.customEvents) {
        if (event.actions) {
          for (const action of event.actions) {
            if (action.type === 'request' && action.params?.url) {
              apis.push('wx.request');
            }
          }
        }
      }
    }

    return apis;
  }

  /**
   * 添加常用依赖
   * @param deps 依赖对象
   */
  private addCommonDependencies(deps: Dependencies): void {
    // 如果使用了网络请求API,添加promise封装
    const networkAPIs = [
      'wx.request',
      'wx.uploadFile',
      'wx.downloadFile',
      'wx.connectSocket',
    ];

    if (deps.apis.some((api) => networkAPIs.includes(api))) {
      deps.npm['miniprogram-api-promise'] = '^1.0.4';
    }

    // 如果使用了日期相关API,添加dayjs
    const dateAPIs = ['formatTime', 'parseTime'];
    if (deps.apis.some((api) => dateAPIs.includes(api))) {
      deps.npm['dayjs'] = '^1.11.0';
    }
  }

  /**
   * 规范化包名
   * @param name 原始名称
   * @returns 规范化的包名
   */
  private sanitizePackageName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
