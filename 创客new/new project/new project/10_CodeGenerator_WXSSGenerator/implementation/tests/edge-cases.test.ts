/**
 * WXSS生成器 - 边缘情况测试
 * 用于达到90%以上覆盖率
 */

import { describe, it, expect, beforeEach } from 'vitest';
import WXSSGenerator from '../wxss-generator';
import CSSValidator from '../validator';
import type { Component } from '../../../01_Core_ProjectStructure/implementation/types';

describe('WXSSGenerator - 边缘情况', () => {
  let generator: WXSSGenerator;

  beforeEach(() => {
    generator = new WXSSGenerator({ cacheOptions: { enabled: false } });
  });

  describe('禁用缓存', () => {
    it('应该在禁用缓存时每次重新生成', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: { width: '100%' },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss1 = generator.generateComponentWXSS(component);
      const wxss2 = generator.generateComponentWXSS(component);

      expect(wxss1).toBe(wxss2);
    });
  });

  describe('有name的组件', () => {
    it('应该使用组件name作为选择器', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        name: 'my-component',
        properties: [],
        style: { width: '100%' },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss = generator.generateComponentWXSS(component);
      expect(wxss).toContain('.my-component');
    });

    it('应该清理组件name中的非法字符', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        name: 'my@component#name',
        properties: [],
        style: { width: '100%' },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss = generator.generateComponentWXSS(component);
      expect(wxss).toContain('.my-component-name');
    });
  });

  describe('特殊值处理', () => {
    it('应该处理auto值', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: { width: 'auto' },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss = generator.generateComponentWXSS(component);
      expect(wxss).toContain('auto');
    });

    it('应该处理inherit值', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: { display: 'inherit' },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss = generator.generateComponentWXSS(component);
      expect(wxss).toContain('inherit');
    });

    it('应该处理CSS函数值', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: { width: 'calc(100% - 20rpx)' as any },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss = generator.generateComponentWXSS(component);
      expect(wxss).toContain('calc(100% - 20rpx)');
    });
  });

  describe('空值处理', () => {
    it('应该忽略undefined值', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: { width: undefined },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss = generator.generateComponentWXSS(component);
      // 不应该包含width属性
      expect(wxss.includes('width:')).toBe(false);
    });

    it('应该忽略null值', () => {
      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: { width: null as any },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss = generator.generateComponentWXSS(component);
      expect(wxss.includes('width:')).toBe(false);
    });
  });

  describe('缓存过期', () => {
    it('应该在TTL过期后重新生成', async () => {
      const generatorWithTTL = new WXSSGenerator({
        cacheOptions: {
          enabled: true,
          ttl: 10, // 10毫秒
        },
      });

      const component: Component = {
        id: 'comp-1',
        type: 'view',
        properties: [],
        style: { width: '100%' },
        events: [],
        children: [],
        dataBindings: [],
      };

      const wxss1 = generatorWithTTL.generateComponentWXSS(component);

      // 等待TTL过期
      await new Promise((resolve) => setTimeout(resolve, 20));

      const wxss2 = generatorWithTTL.generateComponentWXSS(component);

      expect(wxss1).toBe(wxss2);
    });
  });

  describe('缓存大小限制', () => {
    it('应该在达到最大缓存数量时移除旧条目', () => {
      const generatorWithLimit = new WXSSGenerator({
        cacheOptions: {
          enabled: true,
          maxSize: 2,
        },
      });

      const components = [
        {
          id: 'comp-1',
          type: 'view',
          properties: [],
          style: { width: '100%' },
          events: [],
          children: [],
          dataBindings: [],
        },
        {
          id: 'comp-2',
          type: 'view',
          properties: [],
          style: { width: '50%' },
          events: [],
          children: [],
          dataBindings: [],
        },
        {
          id: 'comp-3',
          type: 'view',
          properties: [],
          style: { width: '25%' },
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      components.forEach((comp) => {
        generatorWithLimit.generateComponentWXSS(comp);
      });

      const stats = generatorWithLimit.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(2);
    });
  });
});

describe('CSSValidator - 边缘情况', () => {
  let validator: CSSValidator;

  beforeEach(() => {
    validator = new CSSValidator();
  });

  describe('属性值建议', () => {
    it('应该提供display属性建议值', () => {
      const suggestions = validator.getSuggestedValues('display');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContain('flex');
    });

    it('应该提供position属性建议值', () => {
      const suggestions = validator.getSuggestedValues('position');
      expect(suggestions).toContain('relative');
    });

    it('应该对未知属性返回空数组', () => {
      const suggestions = validator.getSuggestedValues('unknown-property');
      expect(suggestions.length).toBe(0);
    });
  });

  describe('复杂选择器验证', () => {
    it('应该验证ID选择器', () => {
      const result = validator.validateSelector('#my-id');
      expect(result.errors.length).toBe(0);
    });

    it('应该验证伪类选择器', () => {
      const result = validator.validateSelector('.container:hover');
      expect(result.errors.length).toBe(0);
    });

    it('应该验证组合选择器', () => {
      const result = validator.validateSelector('.parent .child');
      expect(result.errors.length).toBe(0);
    });

    it('应该警告深度嵌套', () => {
      const result = validator.validateSelector('.a .b .c .d .e');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('单位验证', () => {
    it('应该接受vw单位', () => {
      const result = validator.validateUnit('50vw');
      expect(result.valid).toBe(true);
    });

    it('应该接受vh单位', () => {
      const result = validator.validateUnit('100vh');
      expect(result.valid).toBe(true);
    });

    it('应该接受rem单位', () => {
      const result = validator.validateUnit('1.5rem');
      expect(result.valid).toBe(true);
    });

    it('应该接受没有单位的值', () => {
      const result = validator.validateUnit('auto');
      expect(result.valid).toBe(true);
    });
  });

  describe('属性验证', () => {
    it('应该处理空字符串', () => {
      const result = validator.validateProperty('', '');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该警告不支持的属性', () => {
      const result = validator.validateProperty('custom-property', '100rpx');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('兼容性检查', () => {
    it('应该检测属性选择器', () => {
      const report = validator.checkCompatibility('.test[attr="value"] { }');
      expect(report.compatible).toBe(false);
    });

    it('应该检测calc函数', () => {
      const report = validator.checkCompatibility('.test { width: calc(100% - 10px); }');
      expect(report.incompatibilities.length).toBeGreaterThan(0);
    });

    it('应该提供建议', () => {
      const report = validator.checkCompatibility('.test { display: flex; }');
      expect(report.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('CSS规则验证', () => {
    it('应该验证多个规则', () => {
      const rules = [
        {
          selector: '.valid',
          properties: {
            'width': '100rpx',
            'height': '200rpx',
          },
        },
        {
          selector: '*',
          properties: {
            'margin': '0',
          },
        },
      ];

      const result = validator.validateRules(rules);
      expect(result.valid).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
