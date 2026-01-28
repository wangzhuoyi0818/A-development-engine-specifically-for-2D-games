import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { MiniProgramProject, Page } from '@/types/miniprogram';
import WXMLGenerator from './codeGenerator/wxml';
import WXSSGenerator from './codeGenerator/wxss';
import JSGenerator from './codeGenerator/js';

export interface ExportOptions {
  includeComments?: boolean;
  minify?: boolean;
  format?: 'zip' | 'folder';
}

export class MiniProgramExporter {
  private wxmlGen = WXMLGenerator;
  private wxssGen = WXSSGenerator;
  private jsGen = JSGenerator;

  /**
   * 导出完整的小程序项目
   */
  async exportProject(
    project: MiniProgramProject,
    _options: ExportOptions = {}
  ): Promise<Blob> {
    const zip = new JSZip();

    // 生成 app.js
    zip.file('app.js', this.jsGen.generateAppJs());

    // 生成 app.json
    zip.file('app.json', this.jsGen.generateAppJson(project));

    // 生成 app.wxss (全局样式)
    zip.file('app.wxss', this.wxssGen.generateGlobalStyles(project.globalStyles || {}));

    // 生成 project.config.json
    zip.file('project.config.json', this.generateProjectConfig(project));

    // 生成 sitemap.json
    zip.file('sitemap.json', this.generateSitemap());

    // 生成每个页面
    for (const page of project.pages) {
      await this.exportPage(zip, page);
    }

    // 生成自定义组件
    if (project.customComponents && project.customComponents.length > 0) {
      const componentsFolder = zip.folder('components');
      for (const comp of project.customComponents) {
        if (componentsFolder) {
          await this.exportCustomComponent(componentsFolder, comp);
        }
      }
    }

    // 生成 utils 目录
    const utilsFolder = zip.folder('utils');
    if (utilsFolder) {
      utilsFolder.file('util.js', this.generateUtilJs());
    }

    // 生成 Blob
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    return blob;
  }

  /**
   * 导出并下载项目
   */
  async downloadProject(
    project: MiniProgramProject,
    options: ExportOptions = {}
  ): Promise<void> {
    const blob = await this.exportProject(project, options);
    const fileName = `${project.name || 'miniprogram'}_${Date.now()}.zip`;
    saveAs(blob, fileName);
  }

  /**
   * 导出单个页面
   */
  private async exportPage(zip: JSZip, page: Page): Promise<void> {
    // 解析页面路径
    const pathParts = page.path.split('/');
    const pageName = pathParts[pathParts.length - 1];
    const pageDir = pathParts.slice(0, -1).join('/');

    // 创建页面目录
    const folder = zip.folder(pageDir);
    if (!folder) return;

    // 生成 WXML
    folder.file(`${pageName}.wxml`, this.wxmlGen.generatePage(page));

    // 生成 WXSS
    folder.file(`${pageName}.wxss`, this.wxssGen.generatePage(page));

    // 生成 JS
    folder.file(`${pageName}.js`, this.jsGen.generatePage(page));

    // 生成 JSON
    folder.file(`${pageName}.json`, this.jsGen.generatePageJson(page));
  }

  /**
   * 导出自定义组件
   */
  private async exportCustomComponent(
    folder: JSZip,
    component: any
  ): Promise<void> {
    const compFolder = folder.folder(component.name);
    if (!compFolder) return;

    compFolder.file(`${component.name}.wxml`, component.template || '');
    compFolder.file(`${component.name}.wxss`, component.style || '');
    compFolder.file(`${component.name}.js`, component.script || this.generateComponentJs(component));
    compFolder.file(`${component.name}.json`, JSON.stringify({
      component: true,
      usingComponents: {}
    }, null, 2));
  }

  /**
   * 生成 project.config.json
   */
  private generateProjectConfig(project: MiniProgramProject): string {
    return JSON.stringify({
      description: project.description || '微信小程序',
      packOptions: {
        ignore: [],
        include: []
      },
      setting: {
        urlCheck: true,
        es6: true,
        enhance: true,
        postcss: true,
        preloadBackgroundData: false,
        minified: true,
        newFeature: true,
        coverView: true,
        nodeModules: false,
        autoAudits: false,
        showShadowRootInWxmlPanel: true,
        scopeDataCheck: false,
        uglifyFileName: false,
        checkInvalidKey: true,
        checkSiteMap: true,
        uploadWithSourceMap: true,
        compileHotReLoad: false,
        lazyloadPlaceholderEnable: false,
        useMultiFrameRuntime: true,
        useApiHook: true,
        useApiHostProcess: true,
        babelSetting: {
          ignore: [],
          disablePlugins: [],
          outputPath: ''
        },
        bundle: false,
        useIsolateContext: true,
        userConfirmedBundleSwitch: false,
        packNpmManually: false,
        packNpmRelationList: [],
        minifyWXSS: true,
        showES6CompileOption: false,
        minifyWXML: true
      },
      compileType: 'miniprogram',
      libVersion: '2.30.0',
      appid: project.appId || '',
      projectname: project.name,
      condition: {
        search: {
          list: []
        },
        conversation: {
          list: []
        },
        game: {
          list: []
        },
        plugin: {
          list: []
        },
        gamePlugin: {
          list: []
        },
        miniprogram: {
          list: []
        }
      }
    }, null, 2);
  }

  /**
   * 生成 sitemap.json
   */
  private generateSitemap(): string {
    return JSON.stringify({
      desc: '关于本文件的更多信息，请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html',
      rules: [{
        action: 'allow',
        page: '*'
      }]
    }, null, 2);
  }

  /**
   * 生成组件 JS
   */
  private generateComponentJs(_component: any): string {
    return `Component({
  properties: {},
  data: {},
  methods: {}
});
`;
  }

  /**
   * 生成工具函数文件
   */
  private generateUtilJs(): string {
    return `/**
 * 工具函数
 * Generated by MiniProgram Studio
 */

/**
 * 格式化时间
 */
const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('/') + ' ' +
    [hour, minute, second].map(formatNumber).join(':');
};

const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

/**
 * 显示加载提示
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({ title, mask: true });
};

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading();
};

/**
 * 显示提示
 */
const showToast = (title, icon = 'none') => {
  wx.showToast({ title, icon });
};

/**
 * 显示模态框
 */
const showModal = (options) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: options.title || '提示',
      content: options.content || '',
      showCancel: options.showCancel !== false,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定',
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
};

/**
 * 发起请求
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
};

module.exports = {
  formatTime,
  formatNumber,
  showLoading,
  hideLoading,
  showToast,
  showModal,
  request
};
`;
  }

  /**
   * 预览生成的代码（返回代码字符串而不是文件）
   */
  previewCode(project: MiniProgramProject): Record<string, string> {
    const files: Record<string, string> = {};

    // app 文件
    files['app.js'] = this.jsGen.generateAppJs();
    files['app.json'] = this.jsGen.generateAppJson(project);
    files['app.wxss'] = this.wxssGen.generateGlobalStyles(project.globalStyles || {});

    // 页面文件
    for (const page of project.pages) {
      const basePath = page.path;
      files[`${basePath}.wxml`] = this.wxmlGen.generatePage(page);
      files[`${basePath}.wxss`] = this.wxssGen.generatePage(page);
      files[`${basePath}.js`] = this.jsGen.generatePage(page);
      files[`${basePath}.json`] = this.jsGen.generatePageJson(page);
    }

    return files;
  }
}

export default new MiniProgramExporter();
