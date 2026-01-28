/**
 * JavaScript生成器测试
 */

import { describe, it, expect } from 'vitest';
import { JSGenerator } from '../js-generator';
import type { Page, Component } from '../../../../01_Core_ProjectStructure/implementation/types';

describe('JSGenerator', () => {
  describe('generatePageCode', () => {
    it('should generate basic page code', () => {
      const generator = new JSGenerator();

      const page: Page = {
        id: 'page-1',
        name: '首页',
        path: 'pages/index/index',
        config: {},
        components: [],
        data: {},
        variables: [
          {
            id: 'var-1',
            name: 'title',
            type: 'string',
            initialValue: '欢迎',
          },
          {
            id: 'var-2',
            name: 'count',
            type: 'number',
            initialValue: 0,
          },
        ],
        lifecycleEvents: [
          {
            name: 'onLoad',
            actions: [],
          },
        ],
        customEvents: [],
      };

      const result = generator.generatePageCode(page);

      expect(result.success).toBe(true);
      expect(result.code).toBeTruthy();
      expect(result.code).toContain('Page({');
      expect(result.code).toContain('data:');
      expect(result.code).toContain('title');
      expect(result.code).toContain('count');
      expect(result.code).toContain('onLoad');
    });

    it('should generate page with lifecycle events', () => {
      const generator = new JSGenerator();

      const page: Page = {
        id: 'page-1',
        name: '测试页',
        path: 'pages/test/test',
        config: {},
        components: [],
        data: {},
        variables: [],
        lifecycleEvents: [
          {
            name: 'onLoad',
            actions: [
              {
                type: 'setData',
                params: { key: 'loaded', value: 'true' },
              } as any,
            ],
          },
          {
            name: 'onShow',
            actions: [],
          },
        ],
        customEvents: [],
      };

      const result = generator.generatePageCode(page);

      expect(result.success).toBe(true);
      expect(result.code).toContain('onLoad');
      expect(result.code).toContain('onShow');
      expect(result.stats.lifecycleCount).toBe(2);
    });

    it('should generate page with custom events', () => {
      const generator = new JSGenerator();

      const page: Page = {
        id: 'page-1',
        name: '测试页',
        path: 'pages/test/test',
        config: {},
        components: [],
        data: {},
        variables: [],
        lifecycleEvents: [],
        customEvents: [
          {
            id: 'event-1',
            name: 'handleTap',
            params: [],
            actions: [
              {
                type: 'showToast',
                params: { title: '点击了' },
              } as any,
            ],
          },
        ],
      };

      const result = generator.generatePageCode(page);

      expect(result.success).toBe(true);
      expect(result.code).toContain('handleTap');
      expect(result.stats.eventHandlerCount).toBe(1);
    });

    it('should handle empty page', () => {
      const generator = new JSGenerator();

      const page: Page = {
        id: 'page-1',
        name: '空页面',
        path: 'pages/empty/empty',
        config: {},
        components: [],
        data: {},
        variables: [],
        lifecycleEvents: [],
        customEvents: [],
      };

      const result = generator.generatePageCode(page);

      expect(result.success).toBe(true);
      expect(result.code).toContain('Page({');
      expect(result.code).toContain('})');
    });
  });

  describe('generateComponentCode', () => {
    it('should generate basic component code', () => {
      const generator = new JSGenerator();

      const component: Component = {
        id: 'comp-1',
        type: 'custom',
        name: 'MyComponent',
        properties: [
          {
            name: 'title',
            value: '',
            type: 'string',
          },
        ],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const result = generator.generateComponentCode(component);

      expect(result.success).toBe(true);
      expect(result.code).toBeTruthy();
      expect(result.code).toContain('Component({');
      expect(result.code).toContain('properties:');
      expect(result.code).toContain('title');
    });

    it('should generate component with events', () => {
      const generator = new JSGenerator();

      const component: Component = {
        id: 'comp-1',
        type: 'custom',
        name: 'MyComponent',
        properties: [],
        style: {},
        events: [
          {
            name: 'tap',
            handler: 'handleTap',
            actions: [],
          },
        ],
        children: [],
        dataBindings: [],
      };

      const result = generator.generateComponentCode(component);

      expect(result.success).toBe(true);
      expect(result.code).toContain('methods:');
      expect(result.code).toContain('handleTap');
    });

    it('should handle component without properties', () => {
      const generator = new JSGenerator();

      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const result = generator.generateComponentCode(component);

      expect(result.success).toBe(true);
      expect(result.code).toContain('Component({');
    });
  });

  describe('configuration', () => {
    it('should respect custom configuration', () => {
      const generator = new JSGenerator({
        indentSize: 4,
        useSingleQuotes: false,
        includeComments: false,
      });

      expect(generator.getConfig().indentSize).toBe(4);
      expect(generator.getConfig().useSingleQuotes).toBe(false);
    });

    it('should allow updating configuration', () => {
      const generator = new JSGenerator();

      generator.setConfig({
        indentSize: 4,
      });

      expect(generator.getConfig().indentSize).toBe(4);
    });
  });

  describe('error handling', () => {
    it('should handle generation errors gracefully', () => {
      const generator = new JSGenerator();

      // 传入无效数据
      const invalidPage = null as any;

      const result = generator.generatePageCode(invalidPage);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('stats', () => {
    it('should provide generation statistics', () => {
      const generator = new JSGenerator();

      const page: Page = {
        id: 'page-1',
        name: '测试',
        path: 'pages/test/test',
        config: {},
        components: [],
        data: {},
        variables: [{ id: '1', name: 'v1', type: 'string', initialValue: '' }],
        lifecycleEvents: [{ name: 'onLoad', actions: [] }],
        customEvents: [{ id: '1', name: 'handleTap', params: [], actions: [] }],
      };

      const result = generator.generatePageCode(page);

      expect(result.stats).toBeDefined();
      expect(result.stats.lines).toBeGreaterThan(0);
      expect(result.stats.size).toBeGreaterThan(0);
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.lifecycleCount).toBe(1);
      expect(result.stats.eventHandlerCount).toBe(1);
    });
  });
});
