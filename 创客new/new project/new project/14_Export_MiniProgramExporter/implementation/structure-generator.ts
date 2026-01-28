/**
 * 目录结构生成器
 *
 * 负责生成微信小程序的标准目录结构
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  MiniProgramProject,
  Resource,
} from '../../01_Core_ProjectStructure/implementation/types';
import type { ProjectStructure } from './types';
import { DEFAULT_PROJECT_STRUCTURE } from './types';

/**
 * 目录结构生成器
 */
export class StructureGenerator {
  private structure: ProjectStructure;

  constructor(structure: ProjectStructure = DEFAULT_PROJECT_STRUCTURE) {
    this.structure = structure;
  }

  /**
   * 生成项目目录结构
   * @param project 项目对象
   * @param outputPath 输出路径
   */
  async generateStructure(
    project: MiniProgramProject,
    outputPath: string
  ): Promise<void> {
    // 创建根目录
    await this.ensureDir(outputPath);

    // 创建pages目录
    const pagesDir = path.join(outputPath, this.structure.pages);
    await this.ensureDir(pagesDir);

    // 为每个页面创建目录
    for (const page of project.pages) {
      const pagePath = this.getPageDirectory(page.path);
      const pageDir = path.join(outputPath, pagePath);
      await this.ensureDir(pageDir);
    }

    // 创建components目录
    const componentsDir = path.join(outputPath, this.structure.components);
    await this.ensureDir(componentsDir);

    // 为每个全局组件创建目录
    for (const component of project.globalComponents) {
      const componentDir = path.join(componentsDir, component.name);
      await this.ensureDir(componentDir);
    }

    // 创建utils目录
    const utilsDir = path.join(outputPath, this.structure.utils);
    await this.ensureDir(utilsDir);

    // 创建assets目录结构
    await this.ensureDir(path.join(outputPath, this.structure.assets.root));
    await this.ensureDir(path.join(outputPath, this.structure.assets.images));
    await this.ensureDir(path.join(outputPath, this.structure.assets.icons));
    await this.ensureDir(path.join(outputPath, this.structure.assets.audio));
    await this.ensureDir(path.join(outputPath, this.structure.assets.video));
    await this.ensureDir(path.join(outputPath, this.structure.assets.fonts));
  }

  /**
   * 复制资源文件
   * @param resources 资源列表
   * @param projectRoot 项目根目录
   * @param outputPath 输出路径
   */
  async copyResources(
    resources: Resource[],
    projectRoot: string,
    outputPath: string
  ): Promise<{ copied: number; failed: string[] }> {
    let copied = 0;
    const failed: string[] = [];

    for (const resource of resources) {
      try {
        // 跳过远程资源
        if (resource.url) {
          continue;
        }

        // 确定目标目录
        const targetDir = this.getResourceDirectory(resource.type);
        const targetPath = path.join(
          outputPath,
          targetDir,
          path.basename(resource.path)
        );

        // 确保目标目录存在
        await this.ensureDir(path.dirname(targetPath));

        // 复制文件
        const sourcePath = path.isAbsolute(resource.path)
          ? resource.path
          : path.join(projectRoot, resource.path);

        await fs.copyFile(sourcePath, targetPath);
        copied++;
      } catch (error) {
        failed.push(resource.path);
        console.warn(`复制资源失败: ${resource.path}`, error);
      }
    }

    return { copied, failed };
  }

  /**
   * 生成工具文件
   * @param outputPath 输出路径
   */
  async generateUtilFiles(outputPath: string): Promise<void> {
    const utilsDir = path.join(outputPath, this.structure.utils);

    // 生成util.js
    const utilCode = this.generateUtilJs();
    await fs.writeFile(path.join(utilsDir, 'util.js'), utilCode, 'utf-8');

    // 生成request.js (网络请求封装)
    const requestCode = this.generateRequestJs();
    await fs.writeFile(path.join(utilsDir, 'request.js'), requestCode, 'utf-8');
  }

  /**
   * 获取页面目录路径
   * @param pagePath 页面路径 (如 'pages/index/index')
   * @returns 目录路径 (如 'pages/index')
   */
  private getPageDirectory(pagePath: string): string {
    // 移除文件名部分,只保留目录
    const parts = pagePath.split('/');
    return parts.slice(0, -1).join('/');
  }

  /**
   * 根据资源类型获取目标目录
   * @param type 资源类型
   * @returns 目标目录路径
   */
  private getResourceDirectory(
    type: 'image' | 'audio' | 'video' | 'font'
  ): string {
    switch (type) {
      case 'image':
        return this.structure.assets.images;
      case 'audio':
        return this.structure.assets.audio;
      case 'video':
        return this.structure.assets.video;
      case 'font':
        return this.structure.assets.fonts;
      default:
        return this.structure.assets.root;
    }
  }

  /**
   * 确保目录存在,不存在则创建
   * @param dir 目录路径
   */
  private async ensureDir(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * 生成util.js工具文件
   * @returns JavaScript代码
   */
  private generateUtilJs(): string {
    return `/**
 * 通用工具函数
 */

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @param {string} format 格式 (如 'YYYY-MM-DD HH:mm:ss')
 * @returns {string} 格式化后的时间
 */
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return format
    .replace('YYYY', year)
    .replace('MM', padZero(month))
    .replace('DD', padZero(day))
    .replace('HH', padZero(hour))
    .replace('mm', padZero(minute))
    .replace('ss', padZero(second));
}

/**
 * 数字补零
 * @param {number} num 数字
 * @returns {string} 补零后的字符串
 */
function padZero(num) {
  return num < 10 ? '0' + num : '' + num;
}

/**
 * 防抖函数
 * @param {Function} fn 要防抖的函数
 * @param {number} delay 延迟时间(毫秒)
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

/**
 * 节流函数
 * @param {Function} fn 要节流的函数
 * @param {number} delay 延迟时间(毫秒)
 * @returns {Function} 节流后的函数
 */
function throttle(fn, delay = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/**
 * 深拷贝
 * @param {any} obj 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj);
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }

  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * 显示加载提示
 * @param {string} title 提示文本
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true,
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * 显示成功提示
 * @param {string} title 提示文本
 */
function showSuccess(title = '操作成功') {
  wx.showToast({
    title,
    icon: 'success',
    duration: 2000,
  });
}

/**
 * 显示错误提示
 * @param {string} title 提示文本
 */
function showError(title = '操作失败') {
  wx.showToast({
    title,
    icon: 'none',
    duration: 2000,
  });
}

/**
 * 确认对话框
 * @param {Object} options 配置项
 * @returns {Promise<boolean>} 是否确认
 */
function confirm(options = {}) {
  return new Promise((resolve) => {
    wx.showModal({
      title: options.title || '提示',
      content: options.content || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      success: (res) => {
        resolve(res.confirm);
      },
      fail: () => {
        resolve(false);
      },
    });
  });
}

module.exports = {
  formatTime,
  padZero,
  debounce,
  throttle,
  deepClone,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  confirm,
};
`;
  }

  /**
   * 生成request.js网络请求封装
   * @returns JavaScript代码
   */
  private generateRequestJs(): string {
    return `/**
 * 网络请求封装
 */

// API基础地址
const BASE_URL = 'https://api.example.com';

// 请求超时时间
const TIMEOUT = 10000;

/**
 * 发起网络请求
 * @param {Object} options 请求配置
 * @returns {Promise} 请求结果
 */
function request(options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header,
      },
      timeout: options.timeout || TIMEOUT,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(\`请求失败: \${res.statusCode}\`));
        }
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * GET请求
 * @param {string} url 请求地址
 * @param {Object} data 请求参数
 * @param {Object} options 其他配置
 * @returns {Promise} 请求结果
 */
function get(url, data = {}, options = {}) {
  return request({
    url,
    method: 'GET',
    data,
    ...options,
  });
}

/**
 * POST请求
 * @param {string} url 请求地址
 * @param {Object} data 请求数据
 * @param {Object} options 其他配置
 * @returns {Promise} 请求结果
 */
function post(url, data = {}, options = {}) {
  return request({
    url,
    method: 'POST',
    data,
    ...options,
  });
}

/**
 * PUT请求
 * @param {string} url 请求地址
 * @param {Object} data 请求数据
 * @param {Object} options 其他配置
 * @returns {Promise} 请求结果
 */
function put(url, data = {}, options = {}) {
  return request({
    url,
    method: 'PUT',
    data,
    ...options,
  });
}

/**
 * DELETE请求
 * @param {string} url 请求地址
 * @param {Object} data 请求数据
 * @param {Object} options 其他配置
 * @returns {Promise} 请求结果
 */
function del(url, data = {}, options = {}) {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options,
  });
}

/**
 * 上传文件
 * @param {string} url 上传地址
 * @param {string} filePath 文件路径
 * @param {Object} options 其他配置
 * @returns {Promise} 上传结果
 */
function uploadFile(url, filePath, options = {}) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE_URL + url,
      filePath,
      name: options.name || 'file',
      formData: options.formData || {},
      header: options.header || {},
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (error) {
            resolve(res.data);
          }
        } else {
          reject(new Error(\`上传失败: \${res.statusCode}\`));
        }
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
}

/**
 * 下载文件
 * @param {string} url 下载地址
 * @param {Object} options 其他配置
 * @returns {Promise} 下载结果
 */
function downloadFile(url, options = {}) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: BASE_URL + url,
      header: options.header || {},
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
        } else {
          reject(new Error(\`下载失败: \${res.statusCode}\`));
        }
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  uploadFile,
  downloadFile,
};
`;
  }
}
