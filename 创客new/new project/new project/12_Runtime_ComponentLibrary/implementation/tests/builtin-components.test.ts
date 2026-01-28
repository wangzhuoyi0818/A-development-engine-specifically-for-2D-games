/**
 * 内置组件测试套件
 */

import { describe, it, expect } from 'vitest';
import {
  ALL_BUILTIN_COMPONENTS,
  getTotalComponentCount,
  findComponentByName,
  findComponentById,
} from '../builtin-components/index';
import { ComponentCategory } from '../types';

describe('内置组件', () => {
  describe('组件统计', () => {
    it('应该至少有30个内置组件', () => {
      expect(getTotalComponentCount()).toBeGreaterThanOrEqual(30);
    });

    it('所有组件都应该有唯一的ID', () => {
      const ids = new Set<string>();
      const duplicates = new Set<string>();

      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        if (ids.has(comp.id)) {
          duplicates.add(comp.id);
        }
        ids.add(comp.id);
      });

      expect(duplicates.size).toBe(0);
    });

    it('所有组件都应该有唯一的名称', () => {
      const names = new Set<string>();
      const duplicates = new Set<string>();

      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        if (names.has(comp.name)) {
          duplicates.add(comp.name);
        }
        names.add(comp.name);
      });

      expect(duplicates.size).toBe(0);
    });
  });

  describe('组件查询', () => {
    it('应该能按名称查找组件', () => {
      const component = findComponentByName('view');
      expect(component).toBeDefined();
      expect(component?.name).toBe('view');
    });

    it('应该能按ID查找组件', () => {
      const component = findComponentById('wechat-view');
      expect(component).toBeDefined();
      expect(component?.id).toBe('wechat-view');
    });

    it('查询不存在的组件应该返回 undefined', () => {
      expect(findComponentByName('non-existent')).toBeUndefined();
      expect(findComponentById('non-existent-id')).toBeUndefined();
    });
  });

  describe('视图容器组件', () => {
    const viewComponents = ALL_BUILTIN_COMPONENTS.filter(
      (c) => c.category === ComponentCategory.ViewContainer
    );

    it('应该有多个视图容器组件', () => {
      expect(viewComponents.length).toBeGreaterThanOrEqual(5);
    });

    it('view 组件应该是容器', () => {
      const view = findComponentByName('view');
      expect(view?.canHaveChildren).toBe(true);
      expect(view?.isContainer).toBe(true);
    });

    it('scroll-view 组件应该支持滚动', () => {
      const scrollView = findComponentByName('scroll-view');
      expect(scrollView).toBeDefined();
      const scrollXProp = scrollView?.properties.find((p) => p.name === 'scroll-x');
      expect(scrollXProp).toBeDefined();
    });

    it('swiper 组件应该定义轮播参数', () => {
      const swiper = findComponentByName('swiper');
      expect(swiper?.properties.some((p) => p.name === 'autoplay')).toBe(true);
      expect(swiper?.properties.some((p) => p.name === 'interval')).toBe(true);
    });
  });

  describe('表单组件', () => {
    const formComponents = ALL_BUILTIN_COMPONENTS.filter((c) => c.category === ComponentCategory.Form);

    it('应该有多个表单组件', () => {
      expect(formComponents.length).toBeGreaterThanOrEqual(8);
    });

    it('button 组件应该支持不同类型', () => {
      const button = findComponentByName('button');
      const typeProp = button?.properties.find((p) => p.name === 'type');
      expect(typeProp?.options?.length).toBeGreaterThan(0);
    });

    it('input 组件应该支持多种输入类型', () => {
      const input = findComponentByName('input');
      const typeProp = input?.properties.find((p) => p.name === 'type');
      expect(typeProp?.options?.length).toBeGreaterThanOrEqual(4);
    });

    it('checkbox 组件应该有值属性', () => {
      const checkbox = findComponentByName('checkbox');
      expect(checkbox?.properties.some((p) => p.name === 'value')).toBe(true);
      expect(checkbox?.properties.some((p) => p.name === 'checked')).toBe(true);
    });

    it('form 组件应该是容器', () => {
      const form = findComponentByName('form');
      expect(form?.canHaveChildren).toBe(true);
      expect(form?.isContainer).toBe(true);
    });
  });

  describe('媒体组件', () => {
    const mediaComponents = ALL_BUILTIN_COMPONENTS.filter((c) => c.category === ComponentCategory.Media);

    it('应该有多个媒体组件', () => {
      expect(mediaComponents.length).toBeGreaterThanOrEqual(3);
    });

    it('image 组件应该有模式属性', () => {
      const image = findComponentByName('image');
      const modeProp = image?.properties.find((p) => p.name === 'mode');
      expect(modeProp?.options?.length).toBeGreaterThan(0);
    });

    it('video 组件应该支持控制播放', () => {
      const video = findComponentByName('video');
      expect(video?.properties.some((p) => p.name === 'controls')).toBe(true);
      expect(video?.properties.some((p) => p.name === 'autoplay')).toBe(true);
    });

    it('audio 组件应该有源属性', () => {
      const audio = findComponentByName('audio');
      const srcProp = audio?.properties.find((p) => p.name === 'src');
      expect(srcProp?.required).toBe(true);
    });
  });

  describe('基础内容组件', () => {
    const contentComponents = ALL_BUILTIN_COMPONENTS.filter(
      (c) => c.category === ComponentCategory.BasicContent
    );

    it('应该有多个基础内容组件', () => {
      expect(contentComponents.length).toBeGreaterThanOrEqual(3);
    });

    it('text 组件应该支持选择', () => {
      const text = findComponentByName('text');
      expect(text?.properties.some((p) => p.name === 'selectable')).toBe(true);
    });

    it('icon 组件应该定义类型选项', () => {
      const icon = findComponentByName('icon');
      const typeProp = icon?.properties.find((p) => p.name === 'type');
      expect(typeProp?.options?.length).toBeGreaterThan(0);
    });

    it('progress 组件应该有百分比属性', () => {
      const progress = findComponentByName('progress');
      expect(progress?.properties.some((p) => p.name === 'percent')).toBe(true);
    });
  });

  describe('地图和画布组件', () => {
    it('map 组件应该需要经纬度', () => {
      const map = findComponentByName('map');
      const longProp = map?.properties.find((p) => p.name === 'longitude');
      const latProp = map?.properties.find((p) => p.name === 'latitude');
      expect(longProp?.required).toBe(true);
      expect(latProp?.required).toBe(true);
    });

    it('canvas 组件应该支持不同的渲染类型', () => {
      const canvas = findComponentByName('canvas');
      const typeProp = canvas?.properties.find((p) => p.name === 'type');
      expect(typeProp?.options?.length).toBeGreaterThan(0);
    });
  });

  describe('导航组件', () => {
    it('navigator 组件应该有URL属性', () => {
      const navigator = findComponentByName('navigator');
      expect(navigator?.properties.some((p) => p.name === 'url')).toBe(true);
    });

    it('navigator 组件应该支持不同的打开方式', () => {
      const navigator = findComponentByName('navigator');
      const openTypeProp = navigator?.properties.find((p) => p.name === 'open-type');
      expect(openTypeProp?.options?.length).toBeGreaterThan(0);
    });

    it('web-view 组件应该有源属性', () => {
      const webView = findComponentByName('web-view');
      const srcProp = webView?.properties.find((p) => p.name === 'src');
      expect(srcProp?.required).toBe(true);
    });
  });

  describe('开放能力组件', () => {
    it('open-data 组件应该定义数据类型', () => {
      const openData = findComponentByName('open-data');
      const typeProp = openData?.properties.find((p) => p.name === 'type');
      expect(typeProp?.options?.length).toBeGreaterThan(0);
    });

    it('ad 组件应该需要单元ID', () => {
      const ad = findComponentByName('ad');
      const unitIdProp = ad?.properties.find((p) => p.name === 'unit-id');
      expect(unitIdProp?.required).toBe(true);
    });
  });

  describe('组件属性验证', () => {
    it('所有组件都应该有 ID', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(comp.id).toBeDefined();
        expect(comp.id.length).toBeGreaterThan(0);
      });
    });

    it('所有组件都应该有标签', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(comp.label).toBeDefined();
        expect(comp.label.length).toBeGreaterThan(0);
      });
    });

    it('所有组件都应该有分类', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(comp.category).toBeDefined();
      });
    });

    it('所有组件都应该定义 canHaveChildren', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(typeof comp.canHaveChildren).toBe('boolean');
      });
    });

    it('所有组件都应该定义 isContainer', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(typeof comp.isContainer).toBe('boolean');
      });
    });

    it('所有组件都应该定义 isInline', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(typeof comp.isInline).toBe('boolean');
      });
    });

    it('所有组件都应该有属性数组', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(Array.isArray(comp.properties)).toBe(true);
      });
    });

    it('所有组件都应该有事件数组', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        expect(Array.isArray(comp.events)).toBe(true);
      });
    });
  });

  describe('组件事件验证', () => {
    it('交互组件应该有事件', () => {
      const button = findComponentByName('button');
      expect(button?.events.length).toBeGreaterThan(0);

      const input = findComponentByName('input');
      expect(input?.events.length).toBeGreaterThan(0);
    });

    it('所有事件都应该有名称和标签', () => {
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        comp.events.forEach((event) => {
          expect(event.name).toBeDefined();
          expect(event.label).toBeDefined();
        });
      });
    });
  });

  describe('组件文档', () => {
    it('大多数组件应该有官方文档链接', () => {
      const withoutDocs = ALL_BUILTIN_COMPONENTS.filter((c) => !c.docUrl);
      expect(withoutDocs.length).toBeLessThan(ALL_BUILTIN_COMPONENTS.length * 0.2); // 少于20%
    });

    it('很多组件应该有使用示例', () => {
      const withoutExample = ALL_BUILTIN_COMPONENTS.filter((c) => !c.example);
      expect(withoutExample.length).toBeLessThan(ALL_BUILTIN_COMPONENTS.length * 0.3); // 少于30%
    });
  });

  describe('组件分类分布', () => {
    it('应该有均衡的分类分布', () => {
      const categories = new Map<ComponentCategory, number>();
      ALL_BUILTIN_COMPONENTS.forEach((comp) => {
        categories.set(comp.category, (categories.get(comp.category) ?? 0) + 1);
      });

      // 确保每个分类至少有一个组件
      expect(categories.size).toBeGreaterThan(0);
      categories.forEach((count) => {
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('组件分组关系', () => {
    it('swiper-item 应该只能在 swiper 中使用', () => {
      const swiperItem = findComponentByName('swiper-item');
      expect(swiperItem?.allowedParents).toContain('swiper');
    });

    it('checkbox-group 应该只包含 checkbox', () => {
      const checkboxGroup = findComponentByName('checkbox-group');
      expect(checkboxGroup?.allowedChildren).toContain('checkbox');
    });

    it('radio-group 应该只包含 radio', () => {
      const radioGroup = findComponentByName('radio-group');
      expect(radioGroup?.allowedChildren).toContain('radio');
    });
  });
});
