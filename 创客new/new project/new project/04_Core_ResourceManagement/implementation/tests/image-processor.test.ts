/**
 * 图片处理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ImageProcessor,
  ImageProcessError,
  UnsupportedImageFormatError,
} from '../image-processor';

describe('ImageProcessor', () => {
  let processor: ImageProcessor;

  beforeEach(() => {
    processor = new ImageProcessor();
  });

  // ==========================================================================
  // 基本功能测试
  // ==========================================================================

  describe('resize', () => {
    it('应该拒绝无效参数', async () => {
      await expect(processor.resize('', 100, 100)).rejects.toThrow(
        ImageProcessError
      );
      await expect(processor.resize('/test.png', 0, 100)).rejects.toThrow(
        ImageProcessError
      );
      await expect(processor.resize('/test.png', 100, 0)).rejects.toThrow(
        ImageProcessError
      );
    });

    it('应该拒绝超出限制的尺寸', async () => {
      await expect(processor.resize('/test.png', 3000, 3000)).rejects.toThrow(
        ImageProcessError
      );
    });

    it('应该返回处理后的路径', async () => {
      const result = await processor.resize('/test.png', 100, 100);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('crop', () => {
    it('应该拒绝无效的裁剪参数', async () => {
      await expect(
        processor.crop('/test.png', { x: -1, y: 0, width: 100, height: 100 })
      ).rejects.toThrow(ImageProcessError);

      await expect(
        processor.crop('/test.png', { x: 0, y: -1, width: 100, height: 100 })
      ).rejects.toThrow(ImageProcessError);

      await expect(
        processor.crop('/test.png', { x: 0, y: 0, width: 0, height: 100 })
      ).rejects.toThrow(ImageProcessError);

      await expect(
        processor.crop('/test.png', { x: 0, y: 0, width: 100, height: 0 })
      ).rejects.toThrow(ImageProcessError);
    });

    it('应该返回处理后的路径', async () => {
      const result = await processor.crop('/test.png', {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('compress', () => {
    it('应该拒绝无效的质量参数', async () => {
      await expect(processor.compress('/test.png', -1)).rejects.toThrow(
        ImageProcessError
      );

      await expect(processor.compress('/test.png', 101)).rejects.toThrow(
        ImageProcessError
      );
    });

    it('应该接受有效的质量参数', async () => {
      const result1 = await processor.compress('/test.png', 0);
      expect(result1).toBeDefined();

      const result2 = await processor.compress('/test.png', 50);
      expect(result2).toBeDefined();

      const result3 = await processor.compress('/test.png', 100);
      expect(result3).toBeDefined();
    });

    it('应该使用默认质量', async () => {
      const result = await processor.compress('/test.png');
      expect(result).toBeDefined();
    });
  });

  describe('getImageInfo', () => {
    it('应该返回图片信息', async () => {
      const info = await processor.getImageInfo('/test.png');
      expect(info).toBeDefined();
      expect(info.width).toBeDefined();
      expect(info.height).toBeDefined();
      expect(info.format).toBeDefined();
      expect(info.size).toBeDefined();
    });

    it('应该正确识别图片格式', async () => {
      const infoPng = await processor.getImageInfo('/test.png');
      expect(infoPng.format).toBe('png');

      const infoJpg = await processor.getImageInfo('/test.jpg');
      expect(infoJpg.format).toBe('jpg');

      const infoGif = await processor.getImageInfo('/test.gif');
      expect(infoGif.format).toBe('gif');
    });
  });

  describe('rotate', () => {
    it('应该拒绝无效的旋转角度', async () => {
      await expect(processor.rotate('/test.png', 45)).rejects.toThrow(
        ImageProcessError
      );

      await expect(processor.rotate('/test.png', 30)).rejects.toThrow(
        ImageProcessError
      );
    });

    it('应该接受有效的旋转角度', async () => {
      const result0 = await processor.rotate('/test.png', 0);
      expect(result0).toBe('/test.png'); // 0度不需要处理

      const result90 = await processor.rotate('/test.png', 90);
      expect(result90).toBeDefined();

      const result180 = await processor.rotate('/test.png', 180);
      expect(result180).toBeDefined();

      const result270 = await processor.rotate('/test.png', 270);
      expect(result270).toBeDefined();
    });
  });

  describe('convert', () => {
    it('应该拒绝不支持的格式', async () => {
      await expect(
        processor.convert('/test.png', 'bmp' as any)
      ).rejects.toThrow(UnsupportedImageFormatError);
    });

    it('应该支持 JPG 和 PNG 格式', async () => {
      const resultJpg = await processor.convert('/test.png', 'jpg');
      expect(resultJpg).toBeDefined();

      const resultPng = await processor.convert('/test.jpg', 'png');
      expect(resultPng).toBeDefined();
    });
  });

  // ==========================================================================
  // 自定义配置测试
  // ==========================================================================

  describe('自定义配置', () => {
    it('应该支持自定义最大尺寸', async () => {
      const customProcessor = new ImageProcessor(1000, 1000);

      await expect(
        customProcessor.resize('/test.png', 1500, 1500)
      ).rejects.toThrow(ImageProcessError);

      const result = await customProcessor.resize('/test.png', 800, 800);
      expect(result).toBeDefined();
    });
  });
});
