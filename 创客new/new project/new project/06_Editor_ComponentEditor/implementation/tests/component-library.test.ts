/**
 * 组件库测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WxComponentLibrary,
  wxComponentLibrary,
} from '../component-library';
import { ComponentCategory, PropertyType } from '../types';

describe('WxComponentLibrary', () => {
  let library: WxComponentLibrary;

  beforeEach(() => {
    library = new WxComponentLibrary();
  });

  // ==========================================================================
  // 基本操作测试
  // ==========================================================================

  describe('基本操作', () => {
    it('应该能获取组件', () => {
      const component = library.getComponent('view');
      expect(component).toBeDefined();
      expect(component?.id).toBe('view');
      expect(component?.label).toBe('视图容器');
    });

    it('获取不存在的组件应返回 undefined', () => {
      const component = library.getComponent('non-existent');
      expect(component).toBeUndefined();
    });

    it('应该能获取所有组件', () => {
      const components = library.getAllComponents();
      expect(components.length).toBeGreaterThan(0);
      expect(components.some((c) => c.id === 'view')).toBe(true);
      expect(components.some((c) => c.id === 'text')).toBe(true);
      expect(components.some((c) => c.id === 'button')).toBe(true);
    });
  });

  // ==========================================================================
  // 分类操作测试
  // ==========================================================================

  describe('分类操作', () => {
    it('应该能按分类获取组件', () => {
      const containers = library.getComponentsByCategory(ComponentCategory.ViewContainer);
      expect(containers.length).toBeGreaterThan(0);
      expect(containers.some((c) => c.id === 'view')).toBe(true);
    });

    it('应该能获取所有分类', () => {
      const categories = library.getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.includes(ComponentCategory.ViewContainer)).toBe(true);
    });

    it('获取不存在的分类应返回空数组', () => {
      const components = library.getComponentsByCategory('non-existent' as any);
      expect(components).toEqual([]);
    });
  });

  // ==========================================================================
  // 标签操作测试
  // ==========================================================================

  describe('标签操作', () => {
    it('应该能按标签获取组件', () => {
      const components = library.getComponentsByTag('容器');
      expect(components.length).toBeGreaterThan(0);
    });

    it('应该能获取所有标签', () => {
      const tags = library.getTags();
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.includes('容器')).toBe(true);
    });

    it('获取不存在的标签应返回空数组', () => {
      const components = library.getComponentsByTag('non-existent-tag');
      expect(components).toEqual([]);
    });
  });

  // ==========================================================================
  // 搜索测试
  // ==========================================================================

  describe('搜索', () => {
    it('应该能按名称搜索', () => {
      const results = library.searchComponents('view');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.id === 'view')).toBe(true);
    });

    it('应该能按标签搜索', () => {
      const results = library.searchComponents('表单');
      expect(results.length).toBeGreaterThan(0);
    });

    it('应该能按描述搜索', () => {
      const results = library.searchComponents('容器');
      expect(results.length).toBeGreaterThan(0);
    });

    it('搜索不存在的内容应返回空数组', () => {
      const results = library.searchComponents('非常不存在的组件名称');
      expect(results).toEqual([]);
    });

    it('搜索应该不区分大小写', () => {
      const results = library.searchComponents('VIEW');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.id === 'view')).toBe(true);
    });
  });

  // ==========================================================================
  // 组件属性测试
  // ==========================================================================

  describe('组件属性', () => {
    it('view 组件应该有正确的属性', () => {
      const component = library.getComponent('view');
      expect(component).toBeDefined();
      expect(component!.properties.length).toBeGreaterThan(0);

      const idProp = component!.properties.find((p) => p.name === 'id');
      expect(idProp).toBeDefined();
      expect(idProp?.type).toBe(PropertyType.String);
    });

    it('text 组件应该有正确的属性', () => {
      const component = library.getComponent('text');
      expect(component).toBeDefined();

      const selectableProp = component!.properties.find((p) => p.name === 'selectable');
      expect(selectableProp).toBeDefined();
      expect(selectableProp?.type).toBe(PropertyType.Boolean);
    });

    it('button 组件应该有类型属性', () => {
      const component = library.getComponent('button');
      expect(component).toBeDefined();

      const typeProp = component!.properties.find((p) => p.name === 'type');
      expect(typeProp).toBeDefined();
      expect(typeProp?.type).toBe(PropertyType.Enum);
      expect(typeProp?.options).toBeDefined();
      expect(typeProp!.options!.length).toBeGreaterThan(0);
    });

    it('input 组件应该有必填属性', () => {
      const component = library.getComponent('input');
      expect(component).toBeDefined();

      const typeProp = component!.properties.find((p) => p.name === 'type');
      expect(typeProp?.required).toBe(true);
    });
  });

  // ==========================================================================
  // 组件事件测试
  // ==========================================================================

  describe('组件事件', () => {
    it('view 组件应该有点击事件', () => {
      const component = library.getComponent('view');
      expect(component).toBeDefined();
      expect(component!.events.length).toBeGreaterThan(0);

      const tapEvent = component!.events.find((e) => e.name === 'bindtap');
      expect(tapEvent).toBeDefined();
      expect(tapEvent?.label).toBe('点击');
    });

    it('button 组件应该有点击事件', () => {
      const component = library.getComponent('button');
      expect(component).toBeDefined();
      expect(component!.events.length).toBeGreaterThan(0);

      const tapEvent = component!.events.find((e) => e.name === 'bindtap');
      expect(tapEvent).toBeDefined();
    });

    it('input 组件应该有输入事件', () => {
      const component = library.getComponent('input');
      expect(component).toBeDefined();

      const inputEvent = component!.events.find((e) => e.name === 'bindinput');
      expect(inputEvent).toBeDefined();
      expect(inputEvent?.params?.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 组件容器属性测试
  // ==========================================================================

  describe('组件容器属性', () => {
    it('view 组件应该允许有子组件', () => {
      const component = library.getComponent('view');
      expect(component).toBeDefined();
      expect(component!.canHaveChildren).toBe(true);
      expect(component!.isContainer).toBe(true);
    });

    it('text 组件应该不是容器', () => {
      const component = library.getComponent('text');
      expect(component).toBeDefined();
      expect(component!.isContainer).toBe(false);
    });

    it('text 组件应该是内联组件', () => {
      const component = library.getComponent('text');
      expect(component).toBeDefined();
      expect(component!.isInline).toBe(true);
    });

    it('input 组件应该不允许有子组件', () => {
      const component = library.getComponent('input');
      expect(component).toBeDefined();
      expect(component!.canHaveChildren).toBe(false);
    });
  });

  // ==========================================================================
  // 默认实例测试
  // ==========================================================================

  describe('默认实例', () => {
    it('默认实例应该可用', () => {
      expect(wxComponentLibrary).toBeDefined();
    });

    it('默认实例应该能获取组件', () => {
      const component = wxComponentLibrary.getComponent('view');
      expect(component).toBeDefined();
    });
  });
});
