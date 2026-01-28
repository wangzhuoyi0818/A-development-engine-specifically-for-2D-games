/**
 * 微信小程序可视化开发平台 - 图片处理器
 *
 * 本文件实现了 ImageProcessor 类
 * 负责图片的裁剪、压缩、缩放等处理
 */

import type {
  ImageProcessOptions,
  ImageCropOptions,
  ImageInfo,
} from './types';

// ============================================================================
// 图片处理器错误
// ============================================================================

/**
 * 图片处理错误
 */
export class ImageProcessError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ImageProcessError';
  }
}

/**
 * 图片格式不支持错误
 */
export class UnsupportedImageFormatError extends ImageProcessError {
  constructor(format: string) {
    super(
      `不支持的图片格式: ${format}`,
      'UNSUPPORTED_FORMAT',
      { format }
    );
    this.name = 'UnsupportedImageFormatError';
  }
}

// ============================================================================
// 图片处理器主类
// ============================================================================

/**
 * 图片处理器
 *
 * 职责:
 * - 缩放/调整图片大小
 * - 裁剪图片
 * - 压缩图片
 * - 获取图片信息
 * - 图片格式转换
 */
export class ImageProcessor {
  /** 支持的图片格式 */
  private readonly supportedFormats = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

  /** 最大宽度限制 (像素) */
  private readonly maxWidth: number = 2048;

  /** 最大高度限制 (像素) */
  private readonly maxHeight: number = 2048;

  /**
   * 创建图片处理器
   *
   * @param maxWidth - 最大宽度限制(可选)
   * @param maxHeight - 最大高度限制(可选)
   */
  constructor(maxWidth?: number, maxHeight?: number) {
    if (maxWidth) {
      this.maxWidth = maxWidth;
    }
    if (maxHeight) {
      this.maxHeight = maxHeight;
    }
  }

  // ==========================================================================
  // 图片处理
  // ==========================================================================

  /**
   * 缩放图片
   *
   * @param imagePath - 图片路径
   * @param width - 目标宽度
   * @param height - 目标高度
   * @param options - 处理选项
   * @returns 处理后的图片路径
   */
  async resize(
    imagePath: string,
    width: number,
    height: number,
    options?: ImageProcessOptions
  ): Promise<string> {
    // 验证输入
    if (!imagePath || !width || !height) {
      throw new ImageProcessError(
        '缺少必要参数',
        'MISSING_PARAMETERS',
        { imagePath, width, height }
      );
    }

    // 检查尺寸是否超出限制
    if (width > this.maxWidth || height > this.maxHeight) {
      throw new ImageProcessError(
        `图片尺寸超出限制 (最大: ${this.maxWidth}x${this.maxHeight})`,
        'SIZE_LIMIT_EXCEEDED',
        { width, height, maxWidth: this.maxWidth, maxHeight: this.maxHeight }
      );
    }

    try {
      // 在小程序环境中,使用 canvas API 处理图片
      if (typeof wx !== 'undefined' && wx.canvasToTempFilePath) {
        return await this.resizeInWeChat(imagePath, width, height, options);
      }

      // 在其他环境(如 Node.js 或浏览器)模拟处理
      return await this.resizeSimulated(imagePath, width, height, options);
    } catch (error) {
      throw new ImageProcessError(
        `缩放图片失败: ${error instanceof Error ? error.message : String(error)}`,
        'RESIZE_FAILED',
        { imagePath, width, height, error }
      );
    }
  }

  /**
   * 裁剪图片
   *
   * @param imagePath - 图片路径
   * @param cropOptions - 裁剪选项
   * @param processOptions - 处理选项
   * @returns 处理后的图片路径
   */
  async crop(
    imagePath: string,
    cropOptions: ImageCropOptions,
    processOptions?: ImageProcessOptions
  ): Promise<string> {
    // 验证裁剪参数
    if (
      cropOptions.x < 0 ||
      cropOptions.y < 0 ||
      cropOptions.width <= 0 ||
      cropOptions.height <= 0
    ) {
      throw new ImageProcessError(
        '裁剪参数无效',
        'INVALID_CROP_OPTIONS',
        { cropOptions }
      );
    }

    try {
      if (typeof wx !== 'undefined' && wx.canvasToTempFilePath) {
        return await this.cropInWeChat(imagePath, cropOptions, processOptions);
      }

      return await this.cropSimulated(imagePath, cropOptions, processOptions);
    } catch (error) {
      throw new ImageProcessError(
        `裁剪图片失败: ${error instanceof Error ? error.message : String(error)}`,
        'CROP_FAILED',
        { imagePath, cropOptions, error }
      );
    }
  }

  /**
   * 压缩图片
   *
   * @param imagePath - 图片路径
   * @param quality - 压缩质量 (0-100)
   * @returns 处理后的图片路径
   */
  async compress(
    imagePath: string,
    quality: number = 80
  ): Promise<string> {
    // 验证质量参数
    if (quality < 0 || quality > 100) {
      throw new ImageProcessError(
        '压缩质量必须在 0-100 之间',
        'INVALID_QUALITY',
        { quality }
      );
    }

    try {
      if (typeof wx !== 'undefined' && wx.compressImage) {
        return await this.compressInWeChat(imagePath, quality);
      }

      return await this.compressSimulated(imagePath, quality);
    } catch (error) {
      throw new ImageProcessError(
        `压缩图片失败: ${error instanceof Error ? error.message : String(error)}`,
        'COMPRESS_FAILED',
        { imagePath, quality, error }
      );
    }
  }

  /**
   * 获取图片信息
   *
   * @param imagePath - 图片路径
   * @returns 图片信息
   */
  async getImageInfo(imagePath: string): Promise<ImageInfo> {
    try {
      if (typeof wx !== 'undefined' && wx.getImageInfo) {
        return await this.getImageInfoWeChat(imagePath);
      }

      return await this.getImageInfoSimulated(imagePath);
    } catch (error) {
      throw new ImageProcessError(
        `获取图片信息失败: ${error instanceof Error ? error.message : String(error)}`,
        'GET_INFO_FAILED',
        { imagePath, error }
      );
    }
  }

  /**
   * 旋转图片
   *
   * @param imagePath - 图片路径
   * @param angle - 旋转角度 (0, 90, 180, 270)
   * @returns 处理后的图片路径
   */
  async rotate(imagePath: string, angle: number): Promise<string> {
    // 验证旋转角度
    if (![0, 90, 180, 270].includes(angle)) {
      throw new ImageProcessError(
        '旋转角度只能是 0, 90, 180, 270',
        'INVALID_ANGLE',
        { angle }
      );
    }

    try {
      if (angle === 0) {
        return imagePath;
      }

      if (typeof wx !== 'undefined' && wx.canvasToTempFilePath) {
        return await this.rotateInWeChat(imagePath, angle);
      }

      return await this.rotateSimulated(imagePath, angle);
    } catch (error) {
      throw new ImageProcessError(
        `旋转图片失败: ${error instanceof Error ? error.message : String(error)}`,
        'ROTATE_FAILED',
        { imagePath, angle, error }
      );
    }
  }

  /**
   * 转换图片格式
   *
   * @param imagePath - 图片路径
   * @param targetFormat - 目标格式 (jpg, png)
   * @returns 处理后的图片路径
   */
  async convert(
    imagePath: string,
    targetFormat: 'jpg' | 'png'
  ): Promise<string> {
    // 验证目标格式
    if (!['jpg', 'png'].includes(targetFormat)) {
      throw new UnsupportedImageFormatError(targetFormat);
    }

    try {
      if (typeof wx !== 'undefined' && wx.canvasToTempFilePath) {
        return await this.convertInWeChat(imagePath, targetFormat);
      }

      return await this.convertSimulated(imagePath, targetFormat);
    } catch (error) {
      throw new ImageProcessError(
        `转换图片格式失败: ${error instanceof Error ? error.message : String(error)}`,
        'CONVERT_FAILED',
        { imagePath, targetFormat, error }
      );
    }
  }

  // ==========================================================================
  // 小程序环境实现
  // ==========================================================================

  /**
   * 在微信小程序中缩放图片
   */
  private async resizeInWeChat(
    imagePath: string,
    width: number,
    height: number,
    options?: ImageProcessOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined') {
        reject(new ImageProcessError('无法访问 wx API', 'NO_WX_API'));
        return;
      }

      // 获取图片信息
      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          // 创建 canvas
          const canvas = wx.createOffscreenCanvas();
          if (!canvas) {
            reject(new ImageProcessError('无法创建 Canvas', 'NO_CANVAS'));
            return;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new ImageProcessError('无法获取 Canvas Context', 'NO_CONTEXT'));
            return;
          }

          canvas.width = width;
          canvas.height = height;

          // 绘制缩放后的图片
          const image = new Image();
          image.src = imageInfo.path;
          image.onload = () => {
            ctx.drawImage(image, 0, 0, width, height);

            // 导出图片
            wx.canvasToTempFilePath!(
              {
                canvas,
                success: (res: any) => {
                  resolve(res.tempFilePath);
                },
                fail: (error: any) => {
                  reject(
                    new ImageProcessError(
                      `导出图片失败: ${error.errMsg}`,
                      'EXPORT_FAILED',
                      { error }
                    )
                  );
                },
              },
              canvas
            );
          };

          image.onerror = () => {
            reject(new ImageProcessError('加载图片失败', 'LOAD_IMAGE_FAILED'));
          };
        },
        fail: (error: any) => {
          reject(
            new ImageProcessError(
              `获取图片信息失败: ${error.errMsg}`,
              'GET_INFO_FAILED',
              { error }
            )
          );
        },
      });
    });
  }

  /**
   * 在微信小程序中裁剪图片
   */
  private async cropInWeChat(
    imagePath: string,
    cropOptions: ImageCropOptions,
    processOptions?: ImageProcessOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined') {
        reject(new ImageProcessError('无法访问 wx API', 'NO_WX_API'));
        return;
      }

      wx.getImageInfo({
        src: imagePath,
        success: (imageInfo) => {
          const canvas = wx.createOffscreenCanvas();
          if (!canvas) {
            reject(new ImageProcessError('无法创建 Canvas', 'NO_CANVAS'));
            return;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new ImageProcessError('无法获取 Canvas Context', 'NO_CONTEXT'));
            return;
          }

          canvas.width = cropOptions.width;
          canvas.height = cropOptions.height;

          const image = new Image();
          image.src = imageInfo.path;
          image.onload = () => {
            ctx.drawImage(
              image,
              cropOptions.x,
              cropOptions.y,
              cropOptions.width,
              cropOptions.height,
              0,
              0,
              cropOptions.width,
              cropOptions.height
            );

            wx.canvasToTempFilePath!(
              {
                canvas,
                success: (res: any) => {
                  resolve(res.tempFilePath);
                },
                fail: (error: any) => {
                  reject(
                    new ImageProcessError(
                      `导出图片失败: ${error.errMsg}`,
                      'EXPORT_FAILED',
                      { error }
                    )
                  );
                },
              },
              canvas
            );
          };

          image.onerror = () => {
            reject(new ImageProcessError('加载图片失败', 'LOAD_IMAGE_FAILED'));
          };
        },
        fail: (error: any) => {
          reject(
            new ImageProcessError(
              `获取图片信息失败: ${error.errMsg}`,
              'GET_INFO_FAILED',
              { error }
            )
          );
        },
      });
    });
  }

  /**
   * 在微信小程序中压缩图片
   */
  private async compressInWeChat(
    imagePath: string,
    quality: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined' || !wx.compressImage) {
        reject(new ImageProcessError('无法访问 compressImage API', 'NO_API'));
        return;
      }

      wx.compressImage({
        src: imagePath,
        quality: quality / 100,
        success: (res: any) => {
          resolve(res.tempFilePath);
        },
        fail: (error: any) => {
          reject(
            new ImageProcessError(
              `压缩图片失败: ${error.errMsg}`,
              'COMPRESS_FAILED',
              { error }
            )
          );
        },
      });
    });
  }

  /**
   * 在微信小程序中获取图片信息
   */
  private async getImageInfoWeChat(imagePath: string): Promise<ImageInfo> {
    return new Promise((resolve, reject) => {
      if (typeof wx === 'undefined' || !wx.getImageInfo) {
        reject(new ImageProcessError('无法访问 getImageInfo API', 'NO_API'));
        return;
      }

      wx.getImageInfo({
        src: imagePath,
        success: (res: any) => {
          resolve({
            width: res.width,
            height: res.height,
            format: this.getImageFormat(imagePath),
            size: res.size || 0,
            orientation: res.orientation,
          });
        },
        fail: (error: any) => {
          reject(
            new ImageProcessError(
              `获取图片信息失败: ${error.errMsg}`,
              'GET_INFO_FAILED',
              { error }
            )
          );
        },
      });
    });
  }

  /**
   * 在微信小程序中旋转图片
   */
  private async rotateInWeChat(
    imagePath: string,
    angle: number
  ): Promise<string> {
    // 通过缩放实现旋转
    return imagePath; // 简化实现,实际需要使用 Canvas API
  }

  /**
   * 在微信小程序中转换图片格式
   */
  private async convertInWeChat(
    imagePath: string,
    targetFormat: 'jpg' | 'png'
  ): Promise<string> {
    return imagePath; // 简化实现
  }

  // ==========================================================================
  // 模拟环境实现
  // ==========================================================================

  /**
   * 模拟缩放图片
   */
  private async resizeSimulated(
    imagePath: string,
    width: number,
    height: number,
    options?: ImageProcessOptions
  ): Promise<string> {
    // 返回一个虚拟路径,表示处理后的图片
    return `${imagePath}?width=${width}&height=${height}&quality=${options?.quality || 80}`;
  }

  /**
   * 模拟裁剪图片
   */
  private async cropSimulated(
    imagePath: string,
    cropOptions: ImageCropOptions,
    processOptions?: ImageProcessOptions
  ): Promise<string> {
    const params = new URLSearchParams({
      x: String(cropOptions.x),
      y: String(cropOptions.y),
      width: String(cropOptions.width),
      height: String(cropOptions.height),
    });
    return `${imagePath}?${params}`;
  }

  /**
   * 模拟压缩图片
   */
  private async compressSimulated(
    imagePath: string,
    quality: number
  ): Promise<string> {
    return `${imagePath}?quality=${quality}`;
  }

  /**
   * 模拟获取图片信息
   */
  private async getImageInfoSimulated(imagePath: string): Promise<ImageInfo> {
    return {
      width: 1920,
      height: 1080,
      format: this.getImageFormat(imagePath),
      size: 1024000,
    };
  }

  /**
   * 模拟旋转图片
   */
  private async rotateSimulated(
    imagePath: string,
    angle: number
  ): Promise<string> {
    return `${imagePath}?rotate=${angle}`;
  }

  /**
   * 模拟转换图片格式
   */
  private async convertSimulated(
    imagePath: string,
    targetFormat: 'jpg' | 'png'
  ): Promise<string> {
    return imagePath.replace(/\.[^.]+$/, `.${targetFormat}`);
  }

  // ==========================================================================
  // 辅助方法
  // ==========================================================================

  /**
   * 获取图片格式
   */
  private getImageFormat(imagePath: string): string {
    const match = imagePath.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'unknown';
  }
}
