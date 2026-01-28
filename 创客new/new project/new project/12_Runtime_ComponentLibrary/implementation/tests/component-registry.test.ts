/**
 * 组件注册表测试套件
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentRegistry } from '../component-registry';
import { ComponentCategory, PropertyType, ComponentDefinition } from '../types';

describe('ComponentRegistry', () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  describe('基础注册功能', () => {
    it('应该能注册单个组件', () => {
      const component: ComponentDefinition = {
        id: 'test-view',
        name: 'view',
        label: 'View',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
      };

      registry.register(component);
      expect(registry.has('test-view')).toBe(true);
    });

    it('应该能获取已注册的组件', () => {
      const component: ComponentDefinition = {
        id: 'test-button',
        name: 'button',
        label: 'Button',
        category: ComponentCategory.Form,
        canHaveChildren: true,
        isContainer: true,
        isInline: true,
        properties: [],
        events: [],
      };

      registry.register(component);
      const retrieved = registry.get('test-button');
      expect(retrieved).toEqual(component);
    });

    it('应该抛出错误当重复注册相同ID的组件', () => {
      const component: ComponentDefinition = {
        id: 'duplicate',
        name: 'test',
        label: 'Test',
        category: ComponentCategory.BasicContent,
        canHaveChildren: false,
        isContainer: false,
        isInline: true,
        properties: [],
        events: [],
      };

      registry.register(component);
      expect(() => registry.register(component)).toThrow();
    });

    it('应该在覆盖模式下重新注册组件', () => {
      const component: ComponentDefinition = {
        id: 'override-test',
        name: 'test',
        label: 'Test',
        category: ComponentCategory.BasicContent,
        canHaveChildren: false,
        isContainer: false,
        isInline: true,
        properties: [],
        events: [],
      };

      registry.register(component);

      const updated: ComponentDefinition = {
        ...component,
        label: 'Updated Test',
      };

      registry.register(updated, { override: true });
      const retrieved = registry.get('override-test');
      expect(retrieved?.label).toBe('Updated Test');
    });
  });

  describe('分类和分组功能', () => {
    beforeEach(() => {
      const viewComponent: ComponentDefinition = {
        id: 'cat-view',
        name: 'view',
        label: 'View',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
        tags: ['container', 'layout'],
      };

      const textComponent: ComponentDefinition = {
        id: 'cat-text',
        name: 'text',
        label: 'Text',
        category: ComponentCategory.BasicContent,
        canHaveChildren: false,
        isContainer: false,
        isInline: true,
        properties: [],
        events: [],
        tags: ['text', 'content'],
      };

      registry.register(viewComponent);
      registry.register(textComponent);
    });

    it('应该按分类查询组件', () => {
      const components = registry.getByCategory(ComponentCategory.ViewContainer);
      expect(components.length).toBeGreaterThan(0);
      expect(components.some((c) => c.id === 'cat-view')).toBe(true);
    });

    it('应该按标签查询组件', () => {
      const components = registry.getByTag('container');
      expect(components.some((c) => c.id === 'cat-view')).toBe(true);
    });

    it('应该获取所有分类', () => {
      const categories = registry.getCategories();
      expect(categories.includes(ComponentCategory.ViewContainer)).toBe(true);
      expect(categories.includes(ComponentCategory.BasicContent)).toBe(true);
    });
  });

  describe('查询和搜索功能', () => {
    beforeEach(() => {
      const components: ComponentDefinition[] = [
        {
          id: 'search-button',
          name: 'button',
          label: 'Button',
          category: ComponentCategory.Form,
          canHaveChildren: true,
          isContainer: true,
          isInline: true,
          properties: [],
          events: [],
          tags: ['form', 'interactive'],
        },
        {
          id: 'search-input',
          name: 'input',
          label: 'Input',
          category: ComponentCategory.Form,
          canHaveChildren: false,
          isContainer: false,
          isInline: true,
          properties: [],
          events: [],
          tags: ['form', 'input'],
        },
      ];

      components.forEach((c) => registry.register(c));
    });

    it('应该按关键词搜索组件', () => {
      const result = registry.search({ keyword: 'button' });
      expect(result.items.some((c) => c.name === 'button')).toBe(true);
    });

    it('应该支持分页搜索', () => {
      const result = registry.search({ pageSize: 1, page: 0 });
      expect(result.pageSize).toBe(1);
      expect(result.page).toBe(0);
    });

    it('应该支持排序', () => {
      const result = registry.search({ sortBy: 'name', sortOrder: 'asc' });
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('应该支持多条件查询', () => {
      const result = registry.search({
        category: ComponentCategory.Form,
        isContainer: true,
      });
      expect(result.items.every((c) => c.category === ComponentCategory.Form)).toBe(true);
      expect(result.items.every((c) => c.isContainer === true)).toBe(true);
    });
  });

  describe('批量操作', () => {
    it('应该批量注册组件', () => {
      const components: ComponentDefinition[] = [
        {
          id: 'batch-1',
          name: 'comp1',
          label: 'Component 1',
          category: ComponentCategory.ViewContainer,
          canHaveChildren: true,
          isContainer: true,
          isInline: false,
          properties: [],
          events: [],
        },
        {
          id: 'batch-2',
          name: 'comp2',
          label: 'Component 2',
          category: ComponentCategory.BasicContent,
          canHaveChildren: false,
          isContainer: false,
          isInline: true,
          properties: [],
          events: [],
        },
      ];

      const result = registry.registerBatch(components);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('应该处理批量操作中的失败', () => {
      const validComponent: ComponentDefinition = {
        id: 'valid',
        name: 'valid',
        label: 'Valid',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
      };

      const invalidComponent: any = {
        id: 'invalid',
        // 缺少必需字段
      };

      const result = registry.registerBatch([validComponent, invalidComponent]);
      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
      expect(result.failures.length).toBe(1);
    });
  });

  describe('注册回调', () => {
    it('应该在注册时调用回调', () => {
      const callback = () => {};
      const spy = { callback: callback };

      const component: ComponentDefinition = {
        id: 'callback-test',
        name: 'test',
        label: 'Test',
        category: ComponentCategory.ViewContainer,
        canHaveChildren: true,
        isContainer: true,
        isInline: false,
        properties: [],
        events: [],
      };

      let callbackCalled = false;
      registry.register(component, {
        onRegistered: () => {
          callbackCalled = true;
        },
      });

      expect(callbackCalled).toBe(true);
    });
  });

  describe('数据初始化', () => {
    it('应该使用内置组件初始化', () => {
      registry.registerBuiltinComponents();
      expect(registry.getAll().length).toBeGreaterThan(0);
    });

    it('应该包含常见的微信小程序组件', () => {
      registry.registerBuiltinComponents();
      expect(registry.get('wechat-view')).toBeDefined();
      expect(registry.get('wechat-button')).toBeDefined();
      expect(registry.get('wechat-input')).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该抛出错误当获取不存在的组件', () => {
      expect(() => registry.getOrThrow('non-existent')).toThrow();
    });

    it('应该返回 undefined 当获取不存在的组件（非严格模式）', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });

    it('应该验证组件定义', () => {
      const invalidComponent: any = {
        // 缺少必需字段
        name: 'invalid',
      };

      expect(() => {
        registry.register(invalidComponent, { validate: true });
      }).toThrow();
    });
  });

  describe('文档生成', () => {
    beforeEach(() => {
      registry.registerBuiltinComponents();
    });

    it('应该生成单个组件的文档', () => {
      const component = registry.get('wechat-view');
      if (component) {
        const doc = registry.generateDocumentation(component);
        expect(doc.component).toEqual(component);
        expect(doc.markdown).toContain(component.label);
        expect(doc.generatedAt).toBeInstanceOf(Date);
      }
    });

    it('应该生成所有组件的文档', () => {
      const docs = registry.generateAllDocumentation();
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.every((d) => d.markdown.length > 0)).toBe(true);
    });
  });
});
