/**
 * 组件树管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComponentTreeManager,
  ComponentNotFoundError,
  ValidationError,
} from '../component-tree';
import type { Page, Component } from '../types';

describe('ComponentTreeManager', () => {
  let manager: ComponentTreeManager;
  let page: Page;

  beforeEach(() => {
    manager = new ComponentTreeManager();
    page = {
      id: 'test-page',
      name: '测试页面',
      path: 'pages/test/test',
      config: {},
      components: [],
      data: {},
      variables: [],
      lifecycleEvents: [],
      customEvents: [],
    };
  });

  // ==========================================================================
  // 添加组件测试
  // ==========================================================================

  describe('addComponent', () => {
    it('应该能添加组件到根级别', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);

      expect(page.components).toHaveLength(1);
      expect(page.components[0].id).toBe('comp1');
    });

    it('应该能添加组件到指定位置', () => {
      const comp1: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const comp2: Component = {
        id: 'comp2',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, comp1);
      manager.addComponent(page, comp2, undefined, 0); // 插入到第一个位置

      expect(page.components[0].id).toBe('comp2');
      expect(page.components[1].id).toBe('comp1');
    });

    it('应该能添加子组件', () => {
      const parent: Component = {
        id: 'parent',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent);
      manager.addComponent(page, child, 'parent');

      expect(page.components[0].children).toHaveLength(1);
      expect(page.components[0].children[0].id).toBe('child');
    });

    it('应该拒绝添加到不存在的父组件', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      expect(() => {
        manager.addComponent(page, component, 'non-existent');
      }).toThrow(ComponentNotFoundError);
    });

    it('应该拒绝添加子组件到不允许有子组件的组件类型', () => {
      const input: Component = {
        id: 'input',
        type: 'input',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, input);

      expect(() => {
        manager.addComponent(page, child, 'input');
      }).toThrow(ValidationError);
    });

    it('应该自动生成组件ID', () => {
      const component: Component = {
        id: '',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);

      expect(page.components[0].id).toBeDefined();
      expect(page.components[0].id.length).toBeGreaterThan(0);
    });

    it('应该拒绝超过最大嵌套深度', () => {
      // 创建深度为11的嵌套结构
      const createNestedComponents = (depth: number): Component => {
        if (depth === 0) {
          return {
            id: `comp-${depth}`,
            type: 'text',
            properties: [],
            style: {},
            events: [],
            children: [],
            dataBindings: [],
          };
        }

        return {
          id: `comp-${depth}`,
          type: 'view',
          properties: [],
          style: {},
          events: [],
          children: [createNestedComponents(depth - 1)],
          dataBindings: [],
        };
      };

      const deepComponent = createNestedComponents(11);

      expect(() => {
        manager.addComponent(page, deepComponent);
      }).toThrow(ValidationError);
    });
  });

  // ==========================================================================
  // 移除组件测试
  // ==========================================================================

  describe('removeComponent', () => {
    it('应该能移除根级别组件', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);
      const result = manager.removeComponent(page, 'comp1');

      expect(result).toBe(true);
      expect(page.components).toHaveLength(0);
    });

    it('应该能移除嵌套组件', () => {
      const parent: Component = {
        id: 'parent',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent);
      manager.addComponent(page, child, 'parent');

      const result = manager.removeComponent(page, 'child');

      expect(result).toBe(true);
      expect(page.components[0].children).toHaveLength(0);
    });

    it('移除不存在的组件应返回false', () => {
      const result = manager.removeComponent(page, 'non-existent');
      expect(result).toBe(false);
    });

    it('移除组件应同时移除其所有子组件', () => {
      const parent: Component = {
        id: 'parent',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child1: Component = {
        id: 'child1',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child2: Component = {
        id: 'child2',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent);
      manager.addComponent(page, child1, 'parent');
      manager.addComponent(page, child2, 'parent');

      manager.removeComponent(page, 'parent');

      expect(page.components).toHaveLength(0);
      expect(manager.findComponent(page.components, 'child1')).toBeNull();
      expect(manager.findComponent(page.components, 'child2')).toBeNull();
    });
  });

  // ==========================================================================
  // 移动组件测试
  // ==========================================================================

  describe('moveComponent', () => {
    it('应该能移动组件到新父组件', () => {
      const parent1: Component = {
        id: 'parent1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const parent2: Component = {
        id: 'parent2',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent1);
      manager.addComponent(page, parent2);
      manager.addComponent(page, child, 'parent1');

      manager.moveComponent(page, 'child', 'parent2');

      expect(page.components[0].children).toHaveLength(0);
      expect(page.components[1].children).toHaveLength(1);
      expect(page.components[1].children[0].id).toBe('child');
    });

    it('应该能移动组件到根级别', () => {
      const parent: Component = {
        id: 'parent',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent);
      manager.addComponent(page, child, 'parent');

      manager.moveComponent(page, 'child');

      expect(page.components).toHaveLength(2);
      expect(page.components[1].id).toBe('child');
      expect(page.components[0].children).toHaveLength(0);
    });

    it('应该拒绝移动到不存在的组件', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);

      expect(() => {
        manager.moveComponent(page, 'comp1', 'non-existent');
      }).toThrow(ComponentNotFoundError);
    });

    it('应该拒绝移动组件到自己下面', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);

      expect(() => {
        manager.moveComponent(page, 'comp1', 'comp1');
      }).toThrow(ValidationError);
    });

    it('应该拒绝移动组件到其子孙组件下面', () => {
      const parent: Component = {
        id: 'parent',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const grandchild: Component = {
        id: 'grandchild',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent);
      manager.addComponent(page, child, 'parent');
      manager.addComponent(page, grandchild, 'child');

      expect(() => {
        manager.moveComponent(page, 'parent', 'grandchild');
      }).toThrow(ValidationError);
    });

    it('移动组件应保持其子组件完整', () => {
      const parent1: Component = {
        id: 'parent1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const parent2: Component = {
        id: 'parent2',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const grandchild: Component = {
        id: 'grandchild',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent1);
      manager.addComponent(page, parent2);
      manager.addComponent(page, child, 'parent1');
      manager.addComponent(page, grandchild, 'child');

      manager.moveComponent(page, 'child', 'parent2');

      const movedChild = manager.findComponent(page.components, 'child');
      expect(movedChild).toBeDefined();
      expect(movedChild!.children).toHaveLength(1);
      expect(movedChild!.children[0].id).toBe('grandchild');
    });
  });

  // ==========================================================================
  // 更新组件测试
  // ==========================================================================

  describe('updateComponent', () => {
    it('应该能更新组件属性', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        name: '旧名称',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);

      const updated = manager.updateComponent(page, 'comp1', {
        name: '新名称',
        type: 'text',
      });

      expect(updated.name).toBe('新名称');
      expect(updated.type).toBe('text');
    });

    it('应该能更新组件样式', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: { color: 'red' },
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);

      const updated = manager.updateComponent(page, 'comp1', {
        style: { fontSize: '16px' },
      });

      expect(updated.style.color).toBe('red');
      expect(updated.style.fontSize).toBe('16px');
    });

    it('更新不存在的组件应抛出错误', () => {
      expect(() => {
        manager.updateComponent(page, 'non-existent', {});
      }).toThrow(ComponentNotFoundError);
    });
  });

  // ==========================================================================
  // 查询测试
  // ==========================================================================

  describe('查询操作', () => {
    beforeEach(() => {
      const parent: Component = {
        id: 'parent',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child1: Component = {
        id: 'child1',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child2: Component = {
        id: 'child2',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent);
      manager.addComponent(page, child1, 'parent');
      manager.addComponent(page, child2, 'parent');
    });

    it('应该能查找组件', () => {
      const found = manager.findComponent(page.components, 'child1');
      expect(found).toBeDefined();
      expect(found!.id).toBe('child1');
    });

    it('查找不存在的组件应返回null', () => {
      const found = manager.findComponent(page.components, 'non-existent');
      expect(found).toBeNull();
    });

    it('应该能按类型查找组件', () => {
      const views = manager.findComponentsByType(page.components, 'view');
      expect(views).toHaveLength(2);

      const texts = manager.findComponentsByType(page.components, 'text');
      expect(texts).toHaveLength(1);
    });

    it('应该能获取组件路径', () => {
      const path = manager.getComponentPath(page.components, 'child1');
      expect(path).toEqual(['parent', 'child1']);
    });

    it('获取不存在组件的路径应返回null', () => {
      const path = manager.getComponentPath(page.components, 'non-existent');
      expect(path).toBeNull();
    });

    it('应该能获取组件的父组件', () => {
      const parent = manager.getComponentParent(page, 'child1');
      expect(parent).toBeDefined();
      expect(parent!.id).toBe('parent');
    });

    it('根级组件的父组件应为null', () => {
      const parent = manager.getComponentParent(page, 'parent');
      expect(parent).toBeNull();
    });

    it('应该能获取组件深度', () => {
      const depth1 = manager.getComponentDepth(page.components, 'parent');
      expect(depth1).toBe(1);

      const depth2 = manager.getComponentDepth(page.components, 'child1');
      expect(depth2).toBe(2);
    });
  });

  // ==========================================================================
  // 遍历测试
  // ==========================================================================

  describe('遍历操作', () => {
    it('应该能遍历组件树', () => {
      const parent: Component = {
        id: 'parent',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      const child: Component = {
        id: 'child',
        type: 'text',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, parent);
      manager.addComponent(page, child, 'parent');

      const visited: string[] = [];

      manager.traverseComponents(page.components, (comp, depth) => {
        visited.push(`${comp.id}-${depth}`);
      });

      expect(visited).toEqual(['parent-0', 'child-1']);
    });
  });

  // ==========================================================================
  // 验证测试
  // ==========================================================================

  describe('验证', () => {
    it('有效的组件树应通过验证', () => {
      const component: Component = {
        id: 'comp1',
        type: 'view',
        properties: [],
        style: {},
        events: [],
        children: [],
        dataBindings: [],
      };

      manager.addComponent(page, component);

      const result = manager.validateComponentTree(page.components);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('应该检测重复ID', () => {
      // 手动创建重复ID(绕过正常添加流程)
      page.components = [
        {
          id: 'duplicate',
          type: 'view',
          properties: [],
          style: {},
          events: [],
          children: [],
          dataBindings: [],
        },
        {
          id: 'duplicate',
          type: 'text',
          properties: [],
          style: {},
          events: [],
          children: [],
          dataBindings: [],
        },
      ];

      const result = manager.validateComponentTree(page.components);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_ID')).toBe(true);
    });

    it('应该检测无效的容器', () => {
      // 手动创建无效的子组件(绕过正常添加流程)
      page.components = [
        {
          id: 'input',
          type: 'input',
          properties: [],
          style: {},
          events: [],
          children: [
            {
              id: 'child',
              type: 'text',
              properties: [],
              style: {},
              events: [],
              children: [],
              dataBindings: [],
            },
          ],
          dataBindings: [],
        },
      ];

      const result = manager.validateComponentTree(page.components);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_CHILDREN')).toBe(true);
    });
  });
});
