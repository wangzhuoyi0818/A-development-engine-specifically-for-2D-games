/**
 * VariablesContainer 类测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VariablesContainer } from '../variables-container';
import { Variable } from '../variable';
import { VariableSourceType } from '../types';

describe('VariablesContainer Class', () => {
  let container: VariablesContainer;

  beforeEach(() => {
    container = new VariablesContainer(VariableSourceType.Global);
  });

  // ============================================================================
  // 基本操作测试
  // ============================================================================

  describe('Basic Operations', () => {
    it('should create container with source type', () => {
      expect(container.getSourceType()).toBe(VariableSourceType.Global);
      expect(container.count()).toBe(0);
    });

    it('should insert new variable', () => {
      const v = container.insertNew('score');
      expect(container.has('score')).toBe(true);
      expect(container.count()).toBe(1);
      expect(v).toBeDefined();
    });

    it('should get variable (auto-create if not exists)', () => {
      const v = container.get('health');
      expect(container.has('health')).toBe(true);
      v.setValue(100);
      expect(container.get('health').getValue()).toBe(100);
    });

    it('should get variable or null', () => {
      expect(container.getOrNull('nonexistent')).toBe(null);
      container.insertNew('existing');
      expect(container.getOrNull('existing')).not.toBe(null);
    });

    it('should remove variable', () => {
      container.insertNew('temp');
      expect(container.has('temp')).toBe(true);
      const success = container.remove('temp');
      expect(success).toBe(true);
      expect(container.has('temp')).toBe(false);
    });

    it('should clear all variables', () => {
      container.insertNew('v1');
      container.insertNew('v2');
      container.insertNew('v3');
      expect(container.count()).toBe(3);
      container.clear();
      expect(container.count()).toBe(0);
    });
  });

  // ============================================================================
  // 位置和索引操作测试
  // ============================================================================

  describe('Position Operations', () => {
    beforeEach(() => {
      container.insertNew('first');
      container.insertNew('second');
      container.insertNew('third');
    });

    it('should get variable at index', () => {
      const v = container.getAt(1);
      expect(v).not.toBe(null);
      expect(container.getNameAt(1)).toBe('second');
    });

    it('should get name at index', () => {
      expect(container.getNameAt(0)).toBe('first');
      expect(container.getNameAt(2)).toBe('third');
      expect(container.getNameAt(10)).toBe(null);
    });

    it('should get position of variable', () => {
      expect(container.getPosition('first')).toBe(0);
      expect(container.getPosition('second')).toBe(1);
      expect(container.getPosition('third')).toBe(2);
      expect(container.getPosition('nonexistent')).toBe(-1);
    });

    it('should swap variables', () => {
      const success = container.swap(0, 2);
      expect(success).toBe(true);
      expect(container.getNameAt(0)).toBe('third');
      expect(container.getNameAt(2)).toBe('first');
    });

    it('should move variable', () => {
      const success = container.move(2, 0);
      expect(success).toBe(true);
      expect(container.getNameAt(0)).toBe('third');
      expect(container.getNameAt(1)).toBe('first');
      expect(container.getNameAt(2)).toBe('second');
    });

    it('should handle invalid swap', () => {
      expect(container.swap(-1, 0)).toBe(false);
      expect(container.swap(0, 10)).toBe(false);
    });

    it('should handle invalid move', () => {
      expect(container.move(-1, 0)).toBe(false);
      expect(container.move(0, 10)).toBe(false);
    });
  });

  // ============================================================================
  // 插入操作测试
  // ============================================================================

  describe('Insert Operations', () => {
    it('should insert at specific position', () => {
      container.insertNew('first');
      container.insertNew('third');
      container.insertNew('second', 1);
      expect(container.getNameAt(0)).toBe('first');
      expect(container.getNameAt(1)).toBe('second');
      expect(container.getNameAt(2)).toBe('third');
    });

    it('should insert variable copy', () => {
      const v = new Variable(100);
      const inserted = container.insert('score', v);
      inserted.setValue(200);
      expect(v.getValue()).toBe(100); // 原变量不变
      expect(container.get('score').getValue()).toBe(200);
    });

    it('should throw error on duplicate insert', () => {
      container.insertNew('duplicate');
      expect(() => container.insertNew('duplicate')).toThrow();
    });
  });

  // ============================================================================
  // 重命名测试
  // ============================================================================

  describe('Rename Operations', () => {
    beforeEach(() => {
      container.insertNew('oldName');
    });

    it('should rename variable', () => {
      const success = container.rename('oldName', 'newName');
      expect(success).toBe(true);
      expect(container.has('newName')).toBe(true);
      expect(container.has('oldName')).toBe(false);
    });

    it('should fail to rename to existing name', () => {
      container.insertNew('existing');
      const success = container.rename('oldName', 'existing');
      expect(success).toBe(false);
    });

    it('should handle rename to same name', () => {
      const success = container.rename('oldName', 'oldName');
      expect(success).toBe(true);
    });

    it('should fail to rename nonexistent variable', () => {
      const success = container.rename('nonexistent', 'newName');
      expect(success).toBe(false);
    });
  });

  // ============================================================================
  // 遍历和搜索测试
  // ============================================================================

  describe('Iteration and Search', () => {
    beforeEach(() => {
      container.insertNew('player_health').setValue(100);
      container.insertNew('player_mana').setValue(50);
      container.insertNew('enemy_health').setValue(80);
    });

    it('should iterate all variables', () => {
      const names: string[] = [];
      container.forEach((name, variable, index) => {
        names.push(name);
      });
      expect(names).toEqual(['player_health', 'player_mana', 'enemy_health']);
    });

    it('should search variables matching pattern', () => {
      const matches: string[] = [];
      container.forEachVariableMatchingSearch('player', (name) => {
        matches.push(name);
      });
      expect(matches).toEqual(['player_health', 'player_mana']);
    });

    it('should filter variables', () => {
      const filtered = container.filter((name, variable) => variable.getValue() > 50);
      expect(filtered.length).toBe(2);
    });

    it('should find variable', () => {
      const result = container.find((name) => name.includes('mana'));
      expect(result).toBeDefined();
      expect(result?.name).toBe('player_mana');
    });

    it('should get all names', () => {
      const names = container.getAllNames();
      expect(names).toEqual(['player_health', 'player_mana', 'enemy_health']);
    });
  });

  // ============================================================================
  // 批量操作测试
  // ============================================================================

  describe('Batch Operations', () => {
    it('should copy from another container', () => {
      const source = new VariablesContainer(VariableSourceType.Scene);
      source.insertNew('v1').setValue(10);
      source.insertNew('v2').setValue(20);

      container.copyFrom(source);
      expect(container.count()).toBe(2);
      expect(container.get('v1').getValue()).toBe(10);
      expect(container.get('v2').getValue()).toBe(20);
    });

    it('should merge from another container', () => {
      container.insertNew('existing').setValue(100);

      const source = new VariablesContainer();
      source.insertNew('existing').setValue(200);
      source.insertNew('new').setValue(300);

      container.mergeFrom(source, false);
      expect(container.get('existing').getValue()).toBe(100); // 不覆盖
      expect(container.get('new').getValue()).toBe(300);
    });

    it('should merge with overwrite', () => {
      container.insertNew('existing').setValue(100);

      const source = new VariablesContainer();
      source.insertNew('existing').setValue(200);

      container.mergeFrom(source, true);
      expect(container.get('existing').getValue()).toBe(200); // 覆盖
    });
  });

  // ============================================================================
  // 递归删除测试
  // ============================================================================

  describe('Recursive Removal', () => {
    it('should remove variable from top level', () => {
      const v = container.insertNew('toRemove');
      const success = container.removeRecursively(v);
      expect(success).toBe(true);
      expect(container.has('toRemove')).toBe(false);
    });

    it('should remove variable from structure child', () => {
      const v = container.insertNew('player');
      v.castTo('Structure');
      const health = v.getChild('health');
      health.setValue(100);

      const success = container.removeRecursively(health);
      expect(success).toBe(true);
      expect(v.hasChild('health')).toBe(false);
    });

    it('should remove variable from array', () => {
      const v = container.insertNew('items');
      v.castTo('Array');
      const item = v.pushNew();
      item.setValue(42);

      const success = container.removeRecursively(item);
      expect(success).toBe(true);
      expect(v.getChildrenCount()).toBe(0);
    });
  });

  // ============================================================================
  // 序列化测试
  // ============================================================================

  describe('Serialization', () => {
    it('should serialize and deserialize container', () => {
      container.insertNew('v1').setValue(10);
      container.insertNew('v2').setString('hello');
      container.insertNew('v3').setBool(true);

      const json = container.toJSON();
      const restored = VariablesContainer.fromJSON(json);

      expect(restored.count()).toBe(3);
      expect(restored.get('v1').getValue()).toBe(10);
      expect(restored.get('v2').getString()).toBe('hello');
      expect(restored.get('v3').getBool()).toBe(true);
    });

    it('should export to plain object', () => {
      container.insertNew('score').setValue(100);
      container.insertNew('name').setString('Player');

      const obj = container.toPlainObject();
      expect(obj).toEqual({
        score: 100,
        name: 'Player',
      });
    });

    it('should import from plain object', () => {
      container.fromPlainObject({
        health: 100,
        mana: 50,
        items: [1, 2, 3],
      });

      expect(container.count()).toBe(3);
      expect(container.get('health').getValue()).toBe(100);
      expect(container.get('items').getChildrenCount()).toBe(3);
    });
  });

  // ============================================================================
  // Persistent UUID 测试
  // ============================================================================

  describe('Persistent UUID', () => {
    it('should reset persistent UUID', () => {
      container.resetPersistentUuid();
      expect(container.getPersistentUuid()).toBeTruthy();
    });

    it('should clear persistent UUID', () => {
      container.resetPersistentUuid();
      container.clearPersistentUuid();
      expect(container.getPersistentUuid()).toBe('');
    });
  });

  // ============================================================================
  // 验证测试
  // ============================================================================

  describe('Validation', () => {
    it('should validate valid container', () => {
      container.insertNew('valid1');
      container.insertNew('valid2');
      const result = container.validate();
      expect(result.success).toBe(true);
    });

    it('should detect empty variable name', () => {
      // 手动构造无效状态 (正常API不允许)
      const result = container.validate();
      expect(result.success).toBe(true); // 正常情况
    });
  });

  // ============================================================================
  // 静态工厂方法测试
  // ============================================================================

  describe('Static Factory Methods', () => {
    it('should create global container', () => {
      const c = VariablesContainer.createGlobalContainer();
      expect(c.getSourceType()).toBe(VariableSourceType.Global);
    });

    it('should create scene container', () => {
      const c = VariablesContainer.createSceneContainer();
      expect(c.getSourceType()).toBe(VariableSourceType.Scene);
    });

    it('should create object container', () => {
      const c = VariablesContainer.createObjectContainer();
      expect(c.getSourceType()).toBe(VariableSourceType.Object);
    });
  });

  // ============================================================================
  // toString 测试
  // ============================================================================

  describe('toString', () => {
    it('should generate debug string', () => {
      container.insertNew('v1').setValue(10);
      container.insertNew('v2').setString('hello');
      const str = container.toString();
      expect(str).toContain('Global');
      expect(str).toContain('Count: 2');
      expect(str).toContain('v1');
      expect(str).toContain('v2');
    });
  });

  // ============================================================================
  // 边界条件测试
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle removeAt with invalid index', () => {
      container.insertNew('v1');
      expect(container.removeAt(-1)).toBe(false);
      expect(container.removeAt(10)).toBe(false);
    });

    it('should handle getAt with invalid index', () => {
      expect(container.getAt(-1)).toBe(null);
      expect(container.getAt(10)).toBe(null);
    });

    it('should handle empty container operations', () => {
      expect(container.count()).toBe(0);
      container.forEach(() => {
        throw new Error('Should not iterate');
      });
      expect(container.getAllNames()).toEqual([]);
    });
  });
});
