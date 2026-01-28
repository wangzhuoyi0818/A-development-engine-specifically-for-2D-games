/**
 * 资源管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ResourceManager,
  ResourceNotFoundError,
  ResourceAlreadyExistsError,
  ResourceValidationError,
} from '../resource-manager';
import { ResourceType } from '../types';

describe('ResourceManager', () => {
  let manager: ResourceManager;

  beforeEach(() => {
    manager = new ResourceManager();
  });

  // ==========================================================================
  // 基本功能测试
  // ==========================================================================

  describe('addResource', () => {
    it('应该成功添加资源', () => {
      const resource = manager.addResource({
        name: 'test-image',
        type: ResourceType.Image,
        path: '/images/test.png',
        size: 1024,
      });

      expect(resource).toBeDefined();
      expect(resource.id).toBeDefined();
      expect(resource.name).toBe('test-image');
      expect(resource.type).toBe(ResourceType.Image);
      expect(resource.path).toBe('/images/test.png');
      expect(resource.size).toBe(1024);
    });

    it('应该自动检测路径类型', () => {
      const localResource = manager.addResource({
        name: 'local',
        type: ResourceType.Image,
        path: '/images/test.png',
        size: 1024,
      });
      expect(localResource.pathType).toBe('local');

      const cloudResource = manager.addResource({
        name: 'cloud',
        type: ResourceType.Image,
        path: 'cloud://env-id/test.png',
        size: 1024,
      });
      expect(cloudResource.pathType).toBe('cloud');

      const networkResource = manager.addResource({
        name: 'network',
        type: ResourceType.Image,
        path: 'https://example.com/test.png',
        size: 1024,
      });
      expect(networkResource.pathType).toBe('network');
    });

    it('应该拒绝空名称', () => {
      expect(() => {
        manager.addResource({
          name: '',
          type: ResourceType.Image,
          path: '/test.png',
          size: 1024,
        });
      }).toThrow(ResourceValidationError);
    });

    it('应该拒绝过长的名称', () => {
      const longName = 'a'.repeat(101);
      expect(() => {
        manager.addResource({
          name: longName,
          type: ResourceType.Image,
          path: '/test.png',
          size: 1024,
        });
      }).toThrow(ResourceValidationError);
    });

    it('应该拒绝重复的名称', () => {
      manager.addResource({
        name: 'test',
        type: ResourceType.Image,
        path: '/test.png',
        size: 1024,
      });

      expect(() => {
        manager.addResource({
          name: 'test',
          type: ResourceType.Image,
          path: '/test2.png',
          size: 1024,
        });
      }).toThrow(ResourceAlreadyExistsError);
    });

    it('应该拒绝超过大小限制的文件', () => {
      expect(() => {
        manager.addResource({
          name: 'huge-image',
          type: ResourceType.Image,
          path: '/test.png',
          size: 20 * 1024 * 1024, // 20MB
        });
      }).toThrow(ResourceValidationError);
    });

    it('应该拒绝不支持的文件格式', () => {
      expect(() => {
        manager.addResource({
          name: 'invalid',
          type: ResourceType.Image,
          path: '/test.bmp',
          size: 1024,
        });
      }).toThrow(ResourceValidationError);
    });
  });

  describe('removeResource', () => {
    it('应该成功删除资源', () => {
      const resource = manager.addResource({
        name: 'test',
        type: ResourceType.Image,
        path: '/test.png',
        size: 1024,
      });

      manager.removeResource(resource.id);
      expect(manager.hasResource(resource.id)).toBe(false);
      expect(manager.hasResourceByName('test')).toBe(false);
    });

    it('应该在删除不存在的资源时抛出错误', () => {
      expect(() => {
        manager.removeResource('non-existent-id');
      }).toThrow(ResourceNotFoundError);
    });
  });

  describe('getResource', () => {
    it('应该成功获取资源', () => {
      const added = manager.addResource({
        name: 'test',
        type: ResourceType.Image,
        path: '/test.png',
        size: 1024,
      });

      const retrieved = manager.getResource(added.id);
      expect(retrieved).toEqual(added);
    });

    it('应该在资源不存在时抛出错误', () => {
      expect(() => {
        manager.getResource('non-existent-id');
      }).toThrow(ResourceNotFoundError);
    });
  });

  describe('getResourceByName', () => {
    it('应该通过名称获取资源', () => {
      const resource = manager.addResource({
        name: 'test',
        type: ResourceType.Image,
        path: '/test.png',
        size: 1024,
      });

      const found = manager.getResourceByName('test');
      expect(found).toEqual(resource);
    });

    it('应该在资源不存在时返回 null', () => {
      const found = manager.getResourceByName('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('renameResource', () => {
    it('应该成功重命名资源', () => {
      const resource = manager.addResource({
        name: 'old-name',
        type: ResourceType.Image,
        path: '/test.png',
        size: 1024,
      });

      manager.renameResource(resource.id, 'new-name');

      const updated = manager.getResource(resource.id);
      expect(updated.name).toBe('new-name');
      expect(manager.hasResourceByName('old-name')).toBe(false);
      expect(manager.hasResourceByName('new-name')).toBe(true);
    });

    it('应该拒绝重复的新名称', () => {
      const resource1 = manager.addResource({
        name: 'name1',
        type: ResourceType.Image,
        path: '/test1.png',
        size: 1024,
      });

      manager.addResource({
        name: 'name2',
        type: ResourceType.Image,
        path: '/test2.png',
        size: 1024,
      });

      expect(() => {
        manager.renameResource(resource1.id, 'name2');
      }).toThrow(ResourceAlreadyExistsError);
    });
  });

  describe('listResources', () => {
    it('应该返回所有资源', () => {
      manager.addResource({
        name: 'resource1',
        type: ResourceType.Image,
        path: '/test1.png',
        size: 1024,
      });

      manager.addResource({
        name: 'resource2',
        type: ResourceType.Audio,
        path: '/test2.mp3',
        size: 2048,
      });

      const list = manager.listResources();
      expect(list).toHaveLength(2);
    });

    it('应该返回空数组当没有资源时', () => {
      const list = manager.listResources();
      expect(list).toHaveLength(0);
    });
  });

  describe('findResourcesByType', () => {
    it('应该按类型筛选资源', () => {
      manager.addResource({
        name: 'image1',
        type: ResourceType.Image,
        path: '/test1.png',
        size: 1024,
      });

      manager.addResource({
        name: 'audio1',
        type: ResourceType.Audio,
        path: '/test.mp3',
        size: 2048,
      });

      manager.addResource({
        name: 'image2',
        type: ResourceType.Image,
        path: '/test2.png',
        size: 1024,
      });

      const images = manager.findResourcesByType(ResourceType.Image);
      expect(images).toHaveLength(2);
      expect(images.every((r) => r.type === ResourceType.Image)).toBe(true);

      const audios = manager.findResourcesByType(ResourceType.Audio);
      expect(audios).toHaveLength(1);
      expect(audios[0].type).toBe(ResourceType.Audio);
    });
  });

  describe('queryResources', () => {
    beforeEach(() => {
      manager.addResource({
        name: 'large-image',
        type: ResourceType.Image,
        path: '/large.png',
        size: 5000,
        tags: ['large', 'banner'],
      });

      manager.addResource({
        name: 'small-audio',
        type: ResourceType.Audio,
        path: '/small.mp3',
        size: 1000,
        tags: ['small', 'bgm'],
      });

      manager.addResource({
        name: 'medium-image',
        type: ResourceType.Image,
        path: '/medium.png',
        size: 3000,
        tags: ['medium'],
      });
    });

    it('应该按类型查询', () => {
      const results = manager.queryResources({
        type: ResourceType.Image,
      });
      expect(results).toHaveLength(2);
    });

    it('应该按标签查询', () => {
      const results = manager.queryResources({
        tags: ['large'],
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('large-image');
    });

    it('应该按名称模糊匹配', () => {
      const results = manager.queryResources({
        namePattern: 'image',
      });
      expect(results).toHaveLength(2);
    });

    it('应该按大小范围查询', () => {
      const results = manager.queryResources({
        minSize: 2000,
        maxSize: 4000,
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('medium-image');
    });

    it('应该支持组合查询', () => {
      const results = manager.queryResources({
        type: ResourceType.Image,
        minSize: 4000,
      });
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('large-image');
    });
  });

  describe('getResourceCount', () => {
    it('应该返回正确的资源数量', () => {
      expect(manager.getResourceCount()).toBe(0);

      manager.addResource({
        name: 'test1',
        type: ResourceType.Image,
        path: '/test1.png',
        size: 1024,
      });
      expect(manager.getResourceCount()).toBe(1);

      manager.addResource({
        name: 'test2',
        type: ResourceType.Audio,
        path: '/test2.mp3',
        size: 2048,
      });
      expect(manager.getResourceCount()).toBe(2);
    });
  });

  describe('getResourceCountByType', () => {
    it('应该返回按类型统计的资源数量', () => {
      manager.addResource({
        name: 'image1',
        type: ResourceType.Image,
        path: '/test1.png',
        size: 1024,
      });

      manager.addResource({
        name: 'image2',
        type: ResourceType.Image,
        path: '/test2.png',
        size: 1024,
      });

      manager.addResource({
        name: 'audio1',
        type: ResourceType.Audio,
        path: '/test.mp3',
        size: 2048,
      });

      expect(manager.getResourceCountByType(ResourceType.Image)).toBe(2);
      expect(manager.getResourceCountByType(ResourceType.Audio)).toBe(1);
      expect(manager.getResourceCountByType(ResourceType.Video)).toBe(0);
    });
  });

  // ==========================================================================
  // 序列化测试
  // ==========================================================================

  describe('toJSON / fromJSON', () => {
    it('应该成功序列化和反序列化', () => {
      manager.addResource({
        name: 'test1',
        type: ResourceType.Image,
        path: '/test1.png',
        size: 1024,
      });

      manager.addResource({
        name: 'test2',
        type: ResourceType.Audio,
        path: '/test2.mp3',
        size: 2048,
      });

      const json = manager.toJSON();
      expect(json).toBeDefined();

      const newManager = new ResourceManager();
      newManager.fromJSON(json);

      expect(newManager.getResourceCount()).toBe(2);
      expect(newManager.hasResourceByName('test1')).toBe(true);
      expect(newManager.hasResourceByName('test2')).toBe(true);
    });

    it('应该保留资源的所有属性', () => {
      const resource = manager.addResource({
        name: 'test',
        type: ResourceType.Image,
        path: '/test.png',
        size: 1024,
        metadata: {
          width: 1920,
          height: 1080,
        },
        tags: ['tag1', 'tag2'],
      });

      const json = manager.toJSON();
      const newManager = new ResourceManager();
      newManager.fromJSON(json);

      const restored = newManager.getResource(resource.id);
      expect(restored.metadata.width).toBe(1920);
      expect(restored.metadata.height).toBe(1080);
      expect(restored.tags).toEqual(['tag1', 'tag2']);
    });
  });

  // ==========================================================================
  // 清空测试
  // ==========================================================================

  describe('clear', () => {
    it('应该清空所有资源', () => {
      manager.addResource({
        name: 'test1',
        type: ResourceType.Image,
        path: '/test1.png',
        size: 1024,
      });

      manager.addResource({
        name: 'test2',
        type: ResourceType.Audio,
        path: '/test2.mp3',
        size: 2048,
      });

      expect(manager.getResourceCount()).toBe(2);

      manager.clear();

      expect(manager.getResourceCount()).toBe(0);
      expect(manager.listResources()).toHaveLength(0);
    });
  });
});
