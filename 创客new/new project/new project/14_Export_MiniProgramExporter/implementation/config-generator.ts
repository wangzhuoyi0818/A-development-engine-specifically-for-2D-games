/**
 * 配置文件生成器
 *
 * 负责生成微信小程序的各种配置文件:
 * - app.json
 * - project.config.json
 * - sitemap.json
 * - 页面配置json
 */

import type {
  MiniProgramProject,
  Page,
  Component,
} from '../../01_Core_ProjectStructure/implementation/types';
import type {
  AppJsonConfig,
  ProjectConfigJson,
  SitemapJson,
} from './types';

/**
 * 配置文件生成器
 */
export class ConfigGenerator {
  /**
   * 生成app.json配置文件
   * @param project 项目对象
   * @returns JSON字符串
   */
  generateAppJson(project: MiniProgramProject): string {
    const config: AppJsonConfig = {
      // 页面路径列表
      pages: project.pages.map((page) => page.path),

      // 窗口配置
      window: {
        navigationBarBackgroundColor:
          project.config.window.navigationBarBackgroundColor || '#000000',
        navigationBarTextStyle:
          project.config.window.navigationBarTextStyle || 'white',
        navigationBarTitleText:
          project.config.window.navigationBarTitleText || project.name,
        backgroundColor: project.config.window.backgroundColor || '#ffffff',
        backgroundTextStyle: project.config.window.backgroundTextStyle || 'dark',
        enablePullDownRefresh:
          project.config.window.enablePullDownRefresh || false,
      },

      // 底部导航配置(如果有)
      tabBar: project.config.tabBar
        ? {
            color: project.config.tabBar.color || '#000000',
            selectedColor: project.config.tabBar.selectedColor || '#07c160',
            backgroundColor:
              project.config.tabBar.backgroundColor || '#ffffff',
            list: project.config.tabBar.list.map((item) => ({
              pagePath: item.pagePath,
              text: item.text,
              iconPath: item.iconPath,
              selectedIconPath: item.selectedIconPath,
            })),
          }
        : undefined,

      // 全局自定义组件
      usingComponents:
        project.globalComponents.length > 0
          ? Object.fromEntries(
              project.globalComponents.map((comp) => [
                comp.name,
                `/components/${comp.name}/${comp.name}`,
              ])
            )
          : undefined,

      // 分包配置
      subPackages: project.config.subPackages?.map((subPkg) => ({
        root: subPkg.root,
        pages: subPkg.pages,
      })),

      // 权限配置
      permission: project.config.permission,

      // 网络超时配置
      networkTimeout: project.config.networkTimeout,

      // 调试模式
      debug: project.config.debug || false,
    };

    // 移除undefined字段
    const cleanConfig = this.removeUndefined(config);

    return JSON.stringify(cleanConfig, null, 2);
  }

  /**
   * 生成project.config.json配置文件
   * @param project 项目对象
   * @returns JSON字符串
   */
  generateProjectConfigJson(project: MiniProgramProject): string {
    const config: ProjectConfigJson = {
      description: project.description || `${project.name} - 微信小程序`,

      // 打包配置
      packOptions: {
        ignore: [
          { type: 'file', value: '.eslintrc.js' },
          { type: 'file', value: '.gitignore' },
          { type: 'file', value: 'project.config.json' },
          { type: 'folder', value: 'node_modules' },
        ],
      },

      // 开发工具配置
      setting: {
        urlCheck: true,
        es6: true,
        postcss: true,
        minified: false,
        newFeature: true,
        coverView: true,
        autoAudits: false,
        checkInvalidKey: true,
        checkSiteMap: true,
        uploadWithSourceMap: true,
        babelSetting: {
          ignore: [],
          disablePlugins: [],
          outputPath: '',
        },
      },

      // 编译类型
      compileType: 'miniprogram',

      // 小程序AppID
      appid: project.appId || '',

      // 项目名称
      projectname: project.name,

      // 模拟器类型
      simulatorType: 'wechat',

      // 条件编译
      condition: {
        miniprogram: {
          current: 0,
          list: project.pages.slice(0, 5).map((page, index) => ({
            id: index,
            name: page.name,
            pathName: page.path,
            query: '',
          })),
        },
      },
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 生成sitemap.json配置文件
   * @returns JSON字符串
   */
  generateSitemapJson(): string {
    const config: SitemapJson = {
      rules: [
        {
          action: 'allow',
          page: '*',
        },
      ],
    };

    return JSON.stringify(config, null, 2);
  }

  /**
   * 生成页面配置文件
   * @param page 页面对象
   * @returns JSON字符串
   */
  generatePageJson(page: Page): string {
    const config: any = {
      // 页面窗口配置
      navigationBarTitleText: page.config?.window?.navigationBarTitleText || page.name,
      navigationBarBackgroundColor:
        page.config?.window?.navigationBarBackgroundColor,
      navigationBarTextStyle: page.config?.window?.navigationBarTextStyle,
      backgroundColor: page.config?.window?.backgroundColor,
      backgroundTextStyle: page.config?.window?.backgroundTextStyle,
      enablePullDownRefresh: page.config?.window?.enablePullDownRefresh,
      onReachBottomDistance: page.config?.window?.onReachBottomDistance,

      // 页面自定义组件
      usingComponents: this.extractPageComponents(page),
    };

    // 移除undefined字段
    const cleanConfig = this.removeUndefined(config);

    return JSON.stringify(cleanConfig, null, 2);
  }

  /**
   * 生成app.js文件
   * @param project 项目对象
   * @returns JavaScript代码
   */
  generateAppJs(project: MiniProgramProject): string {
    const globalVariables = project.globalVariables || [];

    const code = `/**
 * ${project.name} - 小程序入口
 * 自动生成的代码
 */

App({
  /**
   * 全局数据
   */
  globalData: {
${globalVariables
  .map(
    (variable) =>
      `    ${variable.name}: ${JSON.stringify(variable.defaultValue)}, // ${variable.description || ''}`
  )
  .join('\n')}
  },

  /**
   * 小程序初始化
   */
  onLaunch(options) {
    console.log('小程序启动', options);

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;

    // 检查更新
    this.checkUpdate();
  },

  /**
   * 小程序显示
   */
  onShow(options) {
    console.log('小程序显示', options);
  },

  /**
   * 小程序隐藏
   */
  onHide() {
    console.log('小程序隐藏');
  },

  /**
   * 小程序错误
   */
  onError(error) {
    console.error('小程序错误:', error);
  },

  /**
   * 页面不存在
   */
  onPageNotFound(res) {
    console.warn('页面不存在:', res.path);
    // 跳转到首页
    wx.redirectTo({
      url: '/${project.pages[0]?.path || 'pages/index/index'}',
    });
  },

  /**
   * 检查更新
   */
  checkUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();

      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(() => {
            wx.showModal({
              title: '更新提示',
              content: '新版本已经准备好,是否重启应用?',
              success: (res) => {
                if (res.confirm) {
                  updateManager.applyUpdate();
                }
              },
            });
          });

          updateManager.onUpdateFailed(() => {
            wx.showModal({
              title: '更新失败',
              content: '新版本下载失败,请检查网络',
              showCancel: false,
            });
          });
        }
      });
    }
  },
});
`;

    return code;
  }

  /**
   * 生成app.wxss文件
   * @param project 项目对象
   * @returns WXSS代码
   */
  generateAppWxss(project: MiniProgramProject): string {
    const code = `/**
 * ${project.name} - 全局样式
 * 自动生成的代码
 */

/* 全局样式重置 */
page {
  height: 100%;
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
}

/* 通用容器 */
.container {
  padding: 20rpx;
  box-sizing: border-box;
}

/* 通用按钮样式 */
.btn-primary {
  background-color: #07c160;
  color: #ffffff;
  border-radius: 8rpx;
  padding: 24rpx 40rpx;
  font-size: 32rpx;
  text-align: center;
}

.btn-secondary {
  background-color: #ffffff;
  color: #333333;
  border: 2rpx solid #e5e5e5;
  border-radius: 8rpx;
  padding: 24rpx 40rpx;
  font-size: 32rpx;
  text-align: center;
}

/* 通用文本样式 */
.text-primary {
  color: #333333;
  font-size: 32rpx;
}

.text-secondary {
  color: #999999;
  font-size: 28rpx;
}

.text-small {
  font-size: 24rpx;
  color: #999999;
}

/* 通用间距 */
.mt-10 { margin-top: 10rpx; }
.mt-20 { margin-top: 20rpx; }
.mt-30 { margin-top: 30rpx; }
.mb-10 { margin-bottom: 10rpx; }
.mb-20 { margin-bottom: 20rpx; }
.mb-30 { margin-bottom: 30rpx; }
.ml-10 { margin-left: 10rpx; }
.ml-20 { margin-left: 20rpx; }
.mr-10 { margin-right: 10rpx; }
.mr-20 { margin-right: 20rpx; }

/* Flex布局 */
.flex {
  display: flex;
}

.flex-row {
  flex-direction: row;
}

.flex-column {
  flex-direction: column;
}

.flex-center {
  justify-content: center;
  align-items: center;
}

.flex-between {
  justify-content: space-between;
  align-items: center;
}

.flex-wrap {
  flex-wrap: wrap;
}

/* 通用卡片 */
.card {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}
`;

    return code;
  }

  /**
   * 提取页面使用的组件
   * @param page 页面对象
   * @returns 组件映射
   */
  private extractPageComponents(page: Page): Record<string, string> | undefined {
    const components = new Set<string>();

    // 递归遍历组件树
    const traverse = (component: Component) => {
      // 如果是自定义组件(不是小程序内置组件)
      if (this.isCustomComponent(component.type)) {
        components.add(component.type);
      }

      // 遍历子组件
      if (component.children) {
        component.children.forEach(traverse);
      }
    };

    // 遍历页面所有组件
    page.components.forEach(traverse);

    // 生成组件路径映射
    if (components.size > 0) {
      return Object.fromEntries(
        Array.from(components).map((name) => [
          name,
          `/components/${name}/${name}`,
        ])
      );
    }

    return undefined;
  }

  /**
   * 判断是否是自定义组件
   * @param type 组件类型
   * @returns 是否自定义组件
   */
  private isCustomComponent(type: string): boolean {
    // 微信小程序内置组件列表
    const builtInComponents = [
      'view',
      'scroll-view',
      'swiper',
      'swiper-item',
      'movable-view',
      'movable-area',
      'cover-view',
      'cover-image',
      'icon',
      'text',
      'rich-text',
      'progress',
      'button',
      'checkbox',
      'checkbox-group',
      'form',
      'input',
      'label',
      'picker',
      'picker-view',
      'picker-view-column',
      'radio',
      'radio-group',
      'slider',
      'switch',
      'textarea',
      'navigator',
      'audio',
      'image',
      'video',
      'camera',
      'live-player',
      'live-pusher',
      'map',
      'canvas',
      'open-data',
      'web-view',
      'ad',
      'official-account',
    ];

    return !builtInComponents.includes(type);
  }

  /**
   * 移除对象中的undefined字段
   * @param obj 对象
   * @returns 清理后的对象
   */
  private removeUndefined<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeUndefined(item)) as any;
    }

    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = this.removeUndefined(value);
      }
    }

    return cleaned;
  }
}
