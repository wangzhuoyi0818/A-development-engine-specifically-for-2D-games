/**
 * 行为系统测试套件
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorManager, createDraggableBehavior, createSelectableBehavior } from '../behavior-system';
import { PropertyType } from '../types';

describe('BehaviorManager', () => {
  let behaviorManager: BehaviorManager;

  beforeEach(() => {
    behaviorManager = new BehaviorManager();
  });

  describe('行为注册', () => {
    it('应该注册新行为', () => {
      const behavior = createDraggableBehavior();
      behaviorManager.register(behavior);
      expect(behaviorManager.has('draggable')).toBe(true);
    });

    it('应该批量注册行为', () => {
      const behaviors = [createDraggableBehavior(), createSelectableBehavior()];
      behaviorManager.registerBatch(behaviors);
      expect(behaviorManager.has('draggable')).toBe(true);
      expect(behaviorManager.has('selectable')).toBe(true);
    });

    it('应该抛出错误当行为名称缺失', () => {
      const invalidBehavior = {
        name: '', // 空名称
        label: 'Invalid',
      };

      expect(() => behaviorManager.register(invalidBehavior as any)).toThrow();
    });

    it('应该获取已注册的行为', () => {
      const behavior = createDraggableBehavior();
      behaviorManager.register(behavior);
      const retrieved = behaviorManager.get('draggable');
      expect(retrieved?.name).toBe('draggable');
    });

    it('应该获取所有行为', () => {
      const behaviors = behaviorManager.getAllBehaviors();
      expect(behaviors.length).toBeGreaterThan(0);
    });
  });

  describe('行为应用', () => {
    it('应该应用行为到组件', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
      };

      behaviorManager.applyBehavior(component, 'draggable');
      expect(component.behaviors).toContain('draggable');
      expect(component.properties.length).toBeGreaterThan(0);
    });

    it('应该添加行为属性', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
      };

      behaviorManager.applyBehavior(component, 'draggable');
      const dragProp = component.properties.find((p: any) => p.name === 'draggable');
      expect(dragProp).toBeDefined();
      expect(dragProp.type).toBe(PropertyType.Boolean);
    });

    it('应该添加行为事件', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
      };

      behaviorManager.applyBehavior(component, 'draggable');
      expect(component.events.some((e: any) => e.name === 'dragstart')).toBe(true);
      expect(component.events.some((e: any) => e.name === 'dragmove')).toBe(true);
      expect(component.events.some((e: any) => e.name === 'dragend')).toBe(true);
    });

    it('应该不重复应用相同的行为', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
        behaviors: ['draggable'],
      };

      const initialCount = component.properties.length;
      behaviorManager.applyBehavior(component, 'draggable');
      expect(component.properties.length).toBe(initialCount);
    });

    it('应该应用多个行为', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
      };

      behaviorManager.applyBehaviors(component, ['draggable', 'selectable']);
      expect(component.behaviors).toContain('draggable');
      expect(component.behaviors).toContain('selectable');
    });

    it('应该抛出错误当应用不存在的行为', () => {
      const component: any = { id: 'test-comp' };
      expect(() => behaviorManager.applyBehavior(component, 'non-existent')).toThrow();
    });
  });

  describe('行为移除', () => {
    it('应该从组件移除行为', () => {
      const component: any = {
        id: 'test-comp',
        properties: [{ name: 'draggable', type: PropertyType.Boolean }],
        events: [{ name: 'dragstart' }],
        behaviors: ['draggable'],
        behaviorConfig: {
          draggable: {},
        },
      };

      behaviorManager.removeBehavior(component, 'draggable');
      expect(component.behaviors).not.toContain('draggable');
      expect(component.properties.some((p: any) => p.name === 'draggable')).toBe(false);
    });

    it('应该不报错当移除不存在的行为应用', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
        behaviors: [],
      };

      expect(() => behaviorManager.removeBehavior(component, 'draggable')).not.toThrow();
    });

    it('应该抛出错误当移除未注册的行为', () => {
      const component: any = { id: 'test-comp' };
      expect(() => behaviorManager.removeBehavior(component, 'non-existent')).toThrow();
    });

    it('应该移除行为配置', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
        behaviors: ['draggable'],
        behaviorConfig: {
          draggable: { config: 'value' },
        },
      };

      behaviorManager.removeBehavior(component, 'draggable');
      expect(component.behaviorConfig.draggable).toBeUndefined();
    });
  });

  describe('行为查询', () => {
    it('应该获取组件的行为列表', () => {
      const component: any = {
        id: 'test-comp',
        behaviors: ['draggable', 'selectable'],
      };

      const behaviors = behaviorManager.getComponentBehaviors(component);
      expect(behaviors).toContain('draggable');
      expect(behaviors).toContain('selectable');
    });

    it('应该检查组件是否有特定行为', () => {
      const component: any = {
        id: 'test-comp',
        behaviors: ['draggable'],
      };

      expect(behaviorManager.hasBehavior(component, 'draggable')).toBe(true);
      expect(behaviorManager.hasBehavior(component, 'selectable')).toBe(false);
    });

    it('应该返回空数组当组件没有行为', () => {
      const component: any = {
        id: 'test-comp',
      };

      const behaviors = behaviorManager.getComponentBehaviors(component);
      expect(behaviors).toEqual([]);
    });
  });

  describe('内置行为', () => {
    it('应该初始化内置的可拖拽行为', () => {
      const draggable = behaviorManager.get('draggable');
      expect(draggable).toBeDefined();
      expect(draggable?.addedProperties).toContainEqual(
        expect.objectContaining({ name: 'draggable' })
      );
      expect(draggable?.addedEvents?.some((e) => e.name === 'dragstart')).toBe(true);
    });

    it('应该初始化内置的可选择行为', () => {
      const selectable = behaviorManager.get('selectable');
      expect(selectable).toBeDefined();
      expect(selectable?.addedProperties).toContainEqual(
        expect.objectContaining({ name: 'selectable' })
      );
      expect(selectable?.addedEvents?.some((e) => e.name === 'select')).toBe(true);
    });

    it('应该初始化内置的可调整大小行为', () => {
      const resizable = behaviorManager.get('resizable');
      expect(resizable).toBeDefined();
      expect(resizable?.addedProperties).toContainEqual(
        expect.objectContaining({ name: 'resizable' })
      );
    });

    it('应该初始化内置的可旋转行为', () => {
      const rotatable = behaviorManager.get('rotatable');
      expect(rotatable).toBeDefined();
      expect(rotatable?.addedProperties).toContainEqual(
        expect.objectContaining({ name: 'rotatable' })
      );
    });

    it('应该初始化内置的响应式行为', () => {
      const responsive = behaviorManager.get('responsive');
      expect(responsive).toBeDefined();
      expect(responsive?.addedProperties).toContainEqual(
        expect.objectContaining({ name: 'responsive' })
      );
    });

    it('应该初始化内置的可动画行为', () => {
      const animatable = behaviorManager.get('animatable');
      expect(animatable).toBeDefined();
      expect(animatable?.addedProperties).toContainEqual(
        expect.objectContaining({ name: 'animation' })
      );
    });
  });

  describe('行为清空', () => {
    it('应该清空所有行为并重新注册内置行为', () => {
      const initialCount = behaviorManager.getAllBehaviors().length;
      behaviorManager.clear();
      const afterClearCount = behaviorManager.getAllBehaviors().length;
      expect(afterClearCount).toBeGreaterThan(0);
      expect(afterClearCount).toBe(initialCount); // 应该重新注册内置行为
    });
  });

  describe('行为属性配置', () => {
    it('应该在应用行为时保存行为配置', () => {
      const component: any = {
        id: 'test-comp',
        properties: [],
        events: [],
      };

      behaviorManager.applyBehavior(component, 'resizable');
      expect(component.behaviorConfig).toBeDefined();
      expect(component.behaviorConfig.resizable).toBeDefined();
    });

    it('应该为不同的组件保持独立的行为配置', () => {
      const comp1: any = {
        id: 'comp1',
        properties: [],
        events: [],
      };

      const comp2: any = {
        id: 'comp2',
        properties: [],
        events: [],
      };

      behaviorManager.applyBehavior(comp1, 'draggable');
      behaviorManager.applyBehavior(comp2, 'selectable');

      expect(comp1.behaviorConfig.draggable).toBeDefined();
      expect(comp1.behaviorConfig.selectable).toBeUndefined();
      expect(comp2.behaviorConfig.selectable).toBeDefined();
      expect(comp2.behaviorConfig.draggable).toBeUndefined();
    });
  });

  describe('行为事件', () => {
    it('可拖拽行为应该有正确的事件定义', () => {
      const draggable = behaviorManager.get('draggable');
      expect(draggable?.addedEvents?.length).toBeGreaterThan(0);

      const dragstart = draggable?.addedEvents?.find((e) => e.name === 'dragstart');
      expect(dragstart?.params).toContainEqual(expect.objectContaining({ name: 'x' }));
      expect(dragstart?.params).toContainEqual(expect.objectContaining({ name: 'y' }));
    });

    it('可选择行为应该有正确的事件定义', () => {
      const selectable = behaviorManager.get('selectable');
      expect(selectable?.addedEvents?.some((e) => e.name === 'select')).toBe(true);
      expect(selectable?.addedEvents?.some((e) => e.name === 'deselect')).toBe(true);
    });

    it('可调整大小行为应该有正确的事件定义', () => {
      const resizable = behaviorManager.get('resizable');
      expect(resizable?.addedEvents?.some((e) => e.name === 'resizestart')).toBe(true);
      expect(resizable?.addedEvents?.some((e) => e.name === 'resize')).toBe(true);
      expect(resizable?.addedEvents?.some((e) => e.name === 'resizeend')).toBe(true);
    });
  });
});
