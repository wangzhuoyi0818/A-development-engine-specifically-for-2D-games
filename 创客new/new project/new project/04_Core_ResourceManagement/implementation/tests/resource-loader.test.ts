/**
 * 资源加载器测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceLoader, ResourceLoadError } from '../resource-loader';
import { ResourceType } from '../types';
import type { Resource } from '../types';

describe('ResourceLoader', () => {
  let loader: ResourceLoader;

  beforeEach(() => {
    loader = new ResourceLoader();
  });

  // ==========================================================================
  // 基本功能测试
  // ==========================================================================

  describe('loadImage', () => {
    it('应该拒绝非图片资源', async () => {
      const audioResource: Resource = {
        id: 'test-id',
        name: 'test-audio',
        type: ResourceType.Audio,
        path: '/test.mp3',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(loader.loadImage(audioResource)).rejects.toThrow(
        ResourceLoadError
      );
    });

    it('应该使用缓存加载图片', async () => {
      const imageResource: Resource = {
        id: 'test-id',
        name: 'test-image',
        type: ResourceType.Image,
        path: '/test.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 第一次加载
      const result1 = await loader.loadImage(imageResource, { useCache: false });
      expect(result1).toBeDefined();

      // 第二次应该使用缓存
      const result2 = await loader.loadImage(imageResource);
      expect(result2).toBe(result1);
    });
  });

  describe('loadAudio', () => {
    it('应该拒绝非音频资源', async () => {
      const imageResource: Resource = {
        id: 'test-id',
        name: 'test-image',
        type: ResourceType.Image,
        path: '/test.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(loader.loadAudio(imageResource)).rejects.toThrow(
        ResourceLoadError
      );
    });
  });

  describe('loadVideo', () => {
    it('应该返回视频路径', async () => {
      const videoResource: Resource = {
        id: 'test-id',
        name: 'test-video',
        type: ResourceType.Video,
        path: '/test.mp4',
        pathType: 'local',
        size: 1024000,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await loader.loadVideo(videoResource);
      expect(result.path).toBe('/test.mp4');
    });
  });

  describe('preloadResources', () => {
    it('应该预加载资源列表', async () => {
      const resources: Resource[] = [
        {
          id: 'img1',
          name: 'image1',
          type: ResourceType.Image,
          path: '/img1.png',
          pathType: 'local',
          size: 1024,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'img2',
          name: 'image2',
          type: ResourceType.Image,
          path: '/img2.png',
          pathType: 'local',
          size: 1024,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = await loader.preloadResources(resources);
      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
    });

    it('应该按类型优先加载', async () => {
      const resources: Resource[] = [
        {
          id: 'audio1',
          name: 'audio1',
          type: ResourceType.Audio,
          path: '/audio1.mp3',
          pathType: 'local',
          size: 2048,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'img1',
          name: 'image1',
          type: ResourceType.Image,
          path: '/img1.png',
          pathType: 'local',
          size: 1024,
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = await loader.preloadResources(resources);
      expect(results).toHaveLength(2);

      // 图片应该优先加载(在结果中排在前面)
      expect(results[0].resourceId).toBe('img1');
      expect(results[1].resourceId).toBe('audio1');
    });

    it('应该支持并发控制', async () => {
      const resources: Resource[] = Array.from({ length: 10 }, (_, i) => ({
        id: `img${i}`,
        name: `image${i}`,
        type: ResourceType.Image,
        path: `/img${i}.png`,
        pathType: 'local' as const,
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const results = await loader.preloadResources(resources, {
        concurrency: 3,
      });

      expect(results).toHaveLength(10);
    });
  });

  describe('getResourceUrl', () => {
    it('应该返回网络资源的URL', () => {
      const resource: Resource = {
        id: 'test-id',
        name: 'network-image',
        type: ResourceType.Image,
        path: 'https://example.com/test.png',
        pathType: 'network',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const url = loader.getResourceUrl(resource);
      expect(url).toBe('https://example.com/test.png');
    });

    it('应该返回云存储资源的URL', () => {
      const resource: Resource = {
        id: 'test-id',
        name: 'cloud-image',
        type: ResourceType.Image,
        path: 'cloud://env-id/test.png',
        pathType: 'cloud',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const url = loader.getResourceUrl(resource);
      expect(url).toBe('cloud://env-id/test.png');
    });

    it('应该返回本地资源的路径', () => {
      const resource: Resource = {
        id: 'test-id',
        name: 'local-image',
        type: ResourceType.Image,
        path: '/local/test.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const url = loader.getResourceUrl(resource);
      expect(url).toBe('/local/test.png');
    });
  });

  // ==========================================================================
  // 缓存管理测试
  // ==========================================================================

  describe('缓存管理', () => {
    it('应该检查资源是否已缓存', async () => {
      const resource: Resource = {
        id: 'test-id',
        name: 'test-image',
        type: ResourceType.Image,
        path: '/test.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(loader.isCached('test-id')).toBe(false);

      await loader.loadImage(resource, { useCache: false });

      expect(loader.isCached('test-id')).toBe(true);
    });

    it('应该清除指定资源的缓存', async () => {
      const resource: Resource = {
        id: 'test-id',
        name: 'test-image',
        type: ResourceType.Image,
        path: '/test.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await loader.loadImage(resource, { useCache: false });
      expect(loader.isCached('test-id')).toBe(true);

      loader.clearCache('test-id');
      expect(loader.isCached('test-id')).toBe(false);
    });

    it('应该清除所有缓存', async () => {
      const resource1: Resource = {
        id: 'test-id-1',
        name: 'test-image-1',
        type: ResourceType.Image,
        path: '/test1.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const resource2: Resource = {
        id: 'test-id-2',
        name: 'test-image-2',
        type: ResourceType.Image,
        path: '/test2.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await loader.loadImage(resource1, { useCache: false });
      await loader.loadImage(resource2, { useCache: false });

      expect(loader.getCacheSize()).toBe(2);

      loader.clearCache();
      expect(loader.getCacheSize()).toBe(0);
    });

    it('应该返回正确的缓存大小', async () => {
      expect(loader.getCacheSize()).toBe(0);

      const resource1: Resource = {
        id: 'test-id-1',
        name: 'test-image-1',
        type: ResourceType.Image,
        path: '/test1.png',
        pathType: 'local',
        size: 1024,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await loader.loadImage(resource1, { useCache: false });
      expect(loader.getCacheSize()).toBe(1);
    });
  });
});
