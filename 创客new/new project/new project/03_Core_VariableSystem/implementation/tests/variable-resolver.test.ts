/**
 * VariableResolver 类测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VariableResolver } from '../variable-resolver';
import { VariablesContainer } from '../variables-container';
import { Variable } from '../variable';
import { PathSegmentType } from '../types';

describe('VariableResolver Class', () => {
  let container: VariablesContainer;
  let resolver: VariableResolver;

  beforeEach(() => {
    container = VariablesContainer.createGlobalContainer();
    resolver = new VariableResolver(container);

    // 设置测试数据
    container.insertNew('score').setValue(100);
    container.insertNew('name').setString('Player');

    const player = container.insertNew('player');
    player.castTo('Structure');
    player.getChild('health').setValue(100);
    player.getChild('mana').setValue(50);

    const inventory = player.getChild('inventory');
    inventory.castTo('Structure');
    const items = inventory.getChild('items');
    items.castTo('Array');
    items.pushNew().setString('sword');
    items.pushNew().setString('shield');
    items.pushNew().setString('potion');

    const enemies = container.insertNew('enemies');
    enemies.castTo('Array');
    const enemy1 = enemies.pushNew();
    enemy1.castTo('Structure');
    enemy1.getChild('name').setString('Goblin');
    enemy1.getChild('health').setValue(50);
  });

  // ============================================================================
  // 路径解析测试
  // ============================================================================

  describe('Path Parsing', () => {
    it('should parse simple variable name', () => {
      const parsed = resolver.parsePath('score');
      expect(parsed.root).toBe('score');
      expect(parsed.segments.length).toBe(0);
    });

    it('should parse dot notation', () => {
      const parsed = resolver.parsePath('player.health');
      expect(parsed.root).toBe('player');
      expect(parsed.segments.length).toBe(1);
      expect(parsed.segments[0].type).toBe(PathSegmentType.Property);
      expect(parsed.segments[0].value).toBe('health');
    });

    it('should parse array index', () => {
      const parsed = resolver.parsePath('items[0]');
      container.insertNew('items');
      expect(parsed.root).toBe('items');
      expect(parsed.segments.length).toBe(1);
      expect(parsed.segments[0].type).toBe(PathSegmentType.Index);
      expect(parsed.segments[0].value).toBe(0);
    });

    it('should parse bracket string notation', () => {
      const parsed = resolver.parsePath('obj["key"]');
      expect(parsed.root).toBe('obj');
      expect(parsed.segments[0].type).toBe(PathSegmentType.Property);
      expect(parsed.segments[0].value).toBe('key');
    });

    it('should parse complex nested path', () => {
      const parsed = resolver.parsePath('player.inventory.items[0]');
      expect(parsed.root).toBe('player');
      expect(parsed.segments.length).toBe(3);
      expect(parsed.segments[0].value).toBe('inventory');
      expect(parsed.segments[1].value).toBe('items');
      expect(parsed.segments[2].value).toBe(0);
    });

    it('should throw on invalid path', () => {
      expect(() => resolver.parsePath('')).toThrow();
      expect(() => resolver.parsePath('123invalid')).toThrow();
      expect(() => resolver.parsePath('var.')).toThrow();
      expect(() => resolver.parsePath('var[')).toThrow();
    });
  });

  // ============================================================================
  // 变量解析测试
  // ============================================================================

  describe('Variable Resolution', () => {
    it('should resolve simple variable', () => {
      const v = resolver.resolve('score');
      expect(v).not.toBe(null);
      expect(v!.getValue()).toBe(100);
    });

    it('should resolve nested property', () => {
      const v = resolver.resolve('player.health');
      expect(v).not.toBe(null);
      expect(v!.getValue()).toBe(100);
    });

    it('should resolve array element', () => {
      const v = resolver.resolve('player.inventory.items[1]');
      expect(v).not.toBe(null);
      expect(v!.getString()).toBe('shield');
    });

    it('should resolve deeply nested path', () => {
      const v = resolver.resolve('enemies[0].health');
      expect(v).not.toBe(null);
      expect(v!.getValue()).toBe(50);
    });

    it('should return null for nonexistent path', () => {
      const v = resolver.resolve('nonexistent.path', false);
      expect(v).toBe(null);
    });

    it('should auto-create path if requested', () => {
      const v = resolver.resolve('new.nested.path', true);
      expect(v).not.toBe(null);
      expect(container.has('new')).toBe(true);
    });
  });

  // ============================================================================
  // 值访问测试
  // ============================================================================

  describe('Value Access', () => {
    it('should get value', () => {
      expect(resolver.getValue('score')).toBe(100);
      expect(resolver.getValue('player.health')).toBe(100);
      expect(resolver.getValue('player.inventory.items[0]')).toBe('sword');
    });

    it('should return default value for nonexistent', () => {
      expect(resolver.getValue('nonexistent', 42)).toBe(42);
    });

    it('should set value', () => {
      const result = resolver.setValue('score', 200);
      expect(result.success).toBe(true);
      expect(resolver.getValue('score')).toBe(200);
    });

    it('should set nested value', () => {
      const result = resolver.setValue('player.health', 80);
      expect(result.success).toBe(true);
      expect(resolver.getValue('player.health')).toBe(80);
    });

    it('should auto-create when setting', () => {
      const result = resolver.setValue('new.nested.value', 42);
      expect(result.success).toBe(true);
      expect(resolver.getValue('new.nested.value')).toBe(42);
    });
  });

  // ============================================================================
  // 存在性检查测试
  // ============================================================================

  describe('Existence Check', () => {
    it('should check if path exists', () => {
      expect(resolver.exists('score')).toBe(true);
      expect(resolver.exists('player.health')).toBe(true);
      expect(resolver.exists('nonexistent')).toBe(false);
    });
  });

  // ============================================================================
  // 删除测试
  // ============================================================================

  describe('Deletion', () => {
    it('should delete root variable', () => {
      const result = resolver.delete('score');
      expect(result.success).toBe(true);
      expect(resolver.exists('score')).toBe(false);
    });

    it('should delete nested property', () => {
      const result = resolver.delete('player.health');
      expect(result.success).toBe(true);
      expect(resolver.exists('player.health')).toBe(false);
      expect(resolver.exists('player')).toBe(true);
    });

    it('should delete array element', () => {
      const result = resolver.delete('player.inventory.items[1]');
      expect(result.success).toBe(true);
      const items = resolver.resolve('player.inventory.items')!;
      expect(items.getChildrenCount()).toBe(2);
    });

    it('should fail to delete nonexistent', () => {
      const result = resolver.delete('nonexistent');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 路径工具测试
  // ============================================================================

  describe('Path Utilities', () => {
    it('should normalize path', () => {
      expect(resolver.normalizePath('obj["key"]')).toBe('obj.key');
      expect(resolver.normalizePath('items[0]')).toBe('items[0]');
    });

    it('should split path', () => {
      const split = resolver.splitPath('player.health');
      expect(split).not.toBe(null);
      expect(split!.parent).toBe('player');
      expect(split!.child).toBe('health');
    });

    it('should return null for root split', () => {
      const split = resolver.splitPath('score');
      expect(split).toBe(null);
    });

    it('should validate path', () => {
      expect(resolver.validatePath('player.health').success).toBe(true);
      expect(resolver.validatePath('invalid..path').success).toBe(false);
    });

    it('should describe path', () => {
      const desc = resolver.describePath('player.inventory.items[0]');
      expect(desc).toContain('Root: player');
      expect(desc).toContain('Property: inventory');
      expect(desc).toContain('Index: 0');
    });

    it('should list children', () => {
      const children = resolver.listChildren('player');
      expect(children).toContain('health');
      expect(children).toContain('mana');
      expect(children).toContain('inventory');
    });

    it('should list array indices', () => {
      const children = resolver.listChildren('player.inventory.items');
      expect(children).toEqual(['0', '1', '2']);
    });
  });

  // ============================================================================
  // 批量操作测试
  // ============================================================================

  describe('Batch Operations', () => {
    it('should get multiple values', () => {
      const values = resolver.getValues(['score', 'name', 'player.health']);
      expect(values['score']).toBe(100);
      expect(values['name']).toBe('Player');
      expect(values['player.health']).toBe(100);
    });

    it('should set multiple values', () => {
      const result = resolver.setValues({
        score: 200,
        name: 'Hero',
        'player.health': 120,
      });
      expect(result.success).toBe(true);
      expect(resolver.getValue('score')).toBe(200);
      expect(resolver.getValue('name')).toBe('Hero');
      expect(resolver.getValue('player.health')).toBe(120);
    });
  });

  // ============================================================================
  // 复制和移动测试
  // ============================================================================

  describe('Copy and Move', () => {
    it('should copy variable', () => {
      const result = resolver.copy('player.health', 'player.maxHealth');
      expect(result.success).toBe(true);
      expect(resolver.getValue('player.maxHealth')).toBe(100);

      // 修改副本不影响原变量
      resolver.setValue('player.maxHealth', 150);
      expect(resolver.getValue('player.health')).toBe(100);
    });

    it('should move variable', () => {
      const result = resolver.move('player.health', 'player.hp');
      expect(result.success).toBe(true);
      expect(resolver.exists('player.hp')).toBe(true);
      expect(resolver.exists('player.health')).toBe(false);
    });

    it('should fail to copy nonexistent', () => {
      const result = resolver.copy('nonexistent', 'target');
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // 容器切换测试
  // ============================================================================

  describe('Container Switching', () => {
    it('should switch container', () => {
      const newContainer = VariablesContainer.createSceneContainer();
      newContainer.insertNew('sceneVar').setValue(999);

      resolver.setContainer(newContainer);
      expect(resolver.getValue('sceneVar')).toBe(999);
      expect(resolver.exists('score')).toBe(false);
    });

    it('should get container', () => {
      expect(resolver.getContainer()).toBe(container);
    });
  });

  // ============================================================================
  // 边界条件测试
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty path segments', () => {
      expect(() => resolver.parsePath('var..prop')).toThrow();
    });

    it('should handle unclosed brackets', () => {
      expect(() => resolver.parsePath('arr[0')).toThrow();
    });

    it('should handle invalid bracket content', () => {
      expect(() => resolver.parsePath('arr[invalid]')).toThrow();
    });

    it('should handle deeply nested paths', () => {
      const deepPath = 'a.b.c.d.e.f.g.h.i.j';
      resolver.setValue(deepPath, 42, true);
      expect(resolver.getValue(deepPath)).toBe(42);
    });

    it('should handle mixed array and object access', () => {
      resolver.setValue('data[0].values[1].name', 'test', true);
      expect(resolver.getValue('data[0].values[1].name')).toBe('test');
    });
  });

  // ============================================================================
  // 错误处理测试
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle setValue failure gracefully', () => {
      // 尝试设置无效路径
      const result = resolver.setValue('', 42, false);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle delete failure gracefully', () => {
      const result = resolver.delete('nonexistent.path');
      expect(result.success).toBe(false);
    });
  });
});
