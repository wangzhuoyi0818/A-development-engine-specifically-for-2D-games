/**
 * Variable 类测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Variable } from '../variable';
import { VariableType } from '../types';

describe('Variable Class', () => {
  // ============================================================================
  // 基本类型测试
  // ============================================================================

  describe('Number Type', () => {
    it('should create a number variable with default value', () => {
      const v = new Variable();
      expect(v.getType()).toBe(VariableType.Number);
      expect(v.getValue()).toBe(0);
    });

    it('should set and get number value', () => {
      const v = new Variable(42);
      expect(v.getValue()).toBe(42);
      expect(v.getType()).toBe(VariableType.Number);
    });

    it('should handle NaN by converting to 0', () => {
      const v = new Variable(NaN);
      expect(v.getValue()).toBe(0);
    });

    it('should support arithmetic operations', () => {
      const v = new Variable(10);
      v.setValue(v.getValue() + 5);
      expect(v.getValue()).toBe(15);
    });
  });

  describe('String Type', () => {
    it('should create a string variable', () => {
      const v = new Variable('hello');
      expect(v.getType()).toBe(VariableType.String);
      expect(v.getString()).toBe('hello');
    });

    it('should convert number to string', () => {
      const v = new Variable(42);
      const s = v.getString();
      expect(s).toBe('42');
    });

    it('should concatenate strings', () => {
      const v = new Variable('hello');
      v.setString(v.getString() + ' world');
      expect(v.getString()).toBe('hello world');
    });
  });

  describe('Boolean Type', () => {
    it('should create a boolean variable', () => {
      const v = new Variable(true);
      expect(v.getType()).toBe(VariableType.Boolean);
      expect(v.getBool()).toBe(true);
    });

    it('should convert number to boolean', () => {
      const v1 = new Variable(1);
      expect(v1.getBool()).toBe(true);

      const v2 = new Variable(0);
      expect(v2.getBool()).toBe(false);
    });

    it('should convert string to boolean', () => {
      const v1 = new Variable('hello');
      expect(v1.getBool()).toBe(true);

      const v2 = new Variable('');
      expect(v2.getBool()).toBe(false);

      const v3 = new Variable('false');
      expect(v3.getBool()).toBe(false);
    });
  });

  // ============================================================================
  // 类型转换测试
  // ============================================================================

  describe('Type Casting', () => {
    it('should cast number to string', () => {
      const v = new Variable(42);
      v.castTo(VariableType.String);
      expect(v.getType()).toBe(VariableType.String);
      expect(v.getString()).toBe('42');
    });

    it('should cast string to number', () => {
      const v = new Variable('42');
      v.castTo(VariableType.Number);
      expect(v.getType()).toBe(VariableType.Number);
      expect(v.getValue()).toBe(42);
    });

    it('should cast to structure and clear primitives', () => {
      const v = new Variable(42);
      v.castTo(VariableType.Structure);
      expect(v.getType()).toBe(VariableType.Structure);
      expect(v.getChildrenCount()).toBe(0);
    });

    it('should cast to array and clear primitives', () => {
      const v = new Variable('hello');
      v.castTo(VariableType.Array);
      expect(v.getType()).toBe(VariableType.Array);
      expect(v.getChildrenCount()).toBe(0);
    });
  });

  // ============================================================================
  // 结构体操作测试
  // ============================================================================

  describe('Structure Operations', () => {
    let v: Variable;

    beforeEach(() => {
      v = new Variable();
      v.castTo(VariableType.Structure);
    });

    it('should create structure from object', () => {
      const v = new Variable({ name: 'John', age: 30 });
      expect(v.getType()).toBe(VariableType.Structure);
      expect(v.hasChild('name')).toBe(true);
      expect(v.hasChild('age')).toBe(true);
    });

    it('should add and get children', () => {
      const child = v.getChild('health');
      child.setValue(100);
      expect(v.hasChild('health')).toBe(true);
      expect(v.getChild('health').getValue()).toBe(100);
    });

    it('should get all children names', () => {
      v.getChild('health').setValue(100);
      v.getChild('mana').setValue(50);
      const names = v.getAllChildrenNames();
      expect(names).toContain('health');
      expect(names).toContain('mana');
      expect(names.length).toBe(2);
    });

    it('should remove child', () => {
      v.getChild('health').setValue(100);
      expect(v.hasChild('health')).toBe(true);
      const success = v.removeChild('health');
      expect(success).toBe(true);
      expect(v.hasChild('health')).toBe(false);
    });

    it('should rename child', () => {
      v.getChild('health').setValue(100);
      const success = v.renameChild('health', 'hp');
      expect(success).toBe(true);
      expect(v.hasChild('hp')).toBe(true);
      expect(v.hasChild('health')).toBe(false);
    });

    it('should convert structure to object', () => {
      v.getChild('name').setString('John');
      v.getChild('age').setValue(30);
      const obj = v.getAsValue();
      expect(obj).toEqual({ name: 'John', age: 30 });
    });

    it('should prevent removing non-existent child', () => {
      const success = v.removeChild('nonexistent');
      expect(success).toBe(false);
    });

    it('should prevent renaming to existing name', () => {
      v.getChild('health').setValue(100);
      v.getChild('mana').setValue(50);
      const success = v.renameChild('health', 'mana');
      expect(success).toBe(false);
    });

    it('should clear all children', () => {
      v.getChild('health').setValue(100);
      v.getChild('mana').setValue(50);
      v.clearChildren();
      expect(v.getChildrenCount()).toBe(0);
    });
  });

  // ============================================================================
  // 数组操作测试
  // ============================================================================

  describe('Array Operations', () => {
    let v: Variable;

    beforeEach(() => {
      v = new Variable();
      v.castTo(VariableType.Array);
    });

    it('should create array from values', () => {
      const v = new Variable([1, 2, 3]);
      expect(v.getType()).toBe(VariableType.Array);
      expect(v.getChildrenCount()).toBe(3);
    });

    it('should get and set array elements', () => {
      v.getAtIndex(0).setValue(10);
      v.getAtIndex(1).setValue(20);
      expect(v.getAtIndex(0).getValue()).toBe(10);
      expect(v.getAtIndex(1).getValue()).toBe(20);
    });

    it('should auto-fill array to index', () => {
      v.getAtIndex(5);
      expect(v.getChildrenCount()).toBe(6);
    });

    it('should push new elements', () => {
      const elem1 = v.pushNew();
      elem1.setValue(100);
      const elem2 = v.pushNew();
      elem2.setValue(200);
      expect(v.getChildrenCount()).toBe(2);
      expect(v.getAtIndex(0).getValue()).toBe(100);
      expect(v.getAtIndex(1).getValue()).toBe(200);
    });

    it('should remove element at index', () => {
      v.pushNew().setValue(10);
      v.pushNew().setValue(20);
      v.pushNew().setValue(30);
      const success = v.removeAtIndex(1);
      expect(success).toBe(true);
      expect(v.getChildrenCount()).toBe(2);
      expect(v.getAtIndex(1).getValue()).toBe(30);
    });

    it('should insert element at index', () => {
      v.pushNew().setValue(10);
      v.pushNew().setValue(30);
      const newElem = new Variable(20);
      v.insertAtIndex(newElem, 1);
      expect(v.getChildrenCount()).toBe(3);
      expect(v.getAtIndex(1).getValue()).toBe(20);
    });

    it('should move element in array', () => {
      v.pushNew().setValue(10);
      v.pushNew().setValue(20);
      v.pushNew().setValue(30);
      const success = v.moveChildInArray(0, 2);
      expect(success).toBe(true);
      expect(v.getAtIndex(0).getValue()).toBe(20);
      expect(v.getAtIndex(1).getValue()).toBe(30);
      expect(v.getAtIndex(2).getValue()).toBe(10);
    });

    it('should convert array to array value', () => {
      v.pushNew().setValue(10);
      v.pushNew().setValue(20);
      v.pushNew().setValue(30);
      const arr = v.getAsValue();
      expect(arr).toEqual([10, 20, 30]);
    });

    it('should clear all elements', () => {
      v.pushNew();
      v.pushNew();
      v.clearChildren();
      expect(v.getChildrenCount()).toBe(0);
    });
  });

  // ============================================================================
  // 克隆测试
  // ============================================================================

  describe('Clone', () => {
    it('should clone primitive variable', () => {
      const v1 = new Variable(42);
      const v2 = v1.clone();
      expect(v2.getValue()).toBe(42);
      v2.setValue(50);
      expect(v1.getValue()).toBe(42);
    });

    it('should clone structure deeply', () => {
      const v1 = new Variable({ name: 'John', age: 30 });
      const v2 = v1.clone();
      v2.getChild('name').setString('Jane');
      expect(v1.getChild('name').getString()).toBe('John');
    });

    it('should clone array deeply', () => {
      const v1 = new Variable([1, 2, 3]);
      const v2 = v1.clone();
      v2.getAtIndex(0).setValue(100);
      expect(v1.getAtIndex(0).getValue()).toBe(1);
    });
  });

  // ============================================================================
  // 比较测试
  // ============================================================================

  describe('Equality', () => {
    it('should compare equal numbers', () => {
      const v1 = new Variable(42);
      const v2 = new Variable(42);
      expect(v1.equals(v2)).toBe(true);
    });

    it('should compare different numbers', () => {
      const v1 = new Variable(42);
      const v2 = new Variable(50);
      expect(v1.equals(v2)).toBe(false);
    });

    it('should compare equal structures', () => {
      const v1 = new Variable({ name: 'John', age: 30 });
      const v2 = new Variable({ name: 'John', age: 30 });
      expect(v1.equals(v2)).toBe(true);
    });

    it('should compare equal arrays', () => {
      const v1 = new Variable([1, 2, 3]);
      const v2 = new Variable([1, 2, 3]);
      expect(v1.equals(v2)).toBe(true);
    });
  });

  // ============================================================================
  // 序列化测试
  // ============================================================================

  describe('Serialization', () => {
    it('should serialize and deserialize number', () => {
      const v1 = new Variable(42);
      const json = v1.toJSON();
      const v2 = Variable.fromJSON(json);
      expect(v2.getValue()).toBe(42);
      expect(v2.getType()).toBe(VariableType.Number);
    });

    it('should serialize and deserialize string', () => {
      const v1 = new Variable('hello');
      const json = v1.toJSON();
      const v2 = Variable.fromJSON(json);
      expect(v2.getString()).toBe('hello');
    });

    it('should serialize and deserialize structure', () => {
      const v1 = new Variable({ name: 'John', age: 30 });
      const json = v1.toJSON();
      const v2 = Variable.fromJSON(json);
      expect(v2.getChild('name').getString()).toBe('John');
      expect(v2.getChild('age').getValue()).toBe(30);
    });

    it('should serialize and deserialize array', () => {
      const v1 = new Variable([1, 'two', true]);
      const json = v1.toJSON();
      const v2 = Variable.fromJSON(json);
      expect(v2.getAtIndex(0).getValue()).toBe(1);
      expect(v2.getAtIndex(1).getString()).toBe('two');
      expect(v2.getAtIndex(2).getBool()).toBe(true);
    });
  });

  // ============================================================================
  // 边界条件测试
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null initialization', () => {
      const v = new Variable(null);
      expect(v.getValue()).toBe(0);
    });

    it('should handle undefined initialization', () => {
      const v = new Variable(undefined);
      expect(v.getValue()).toBe(0);
    });

    it('should handle invalid index access', () => {
      const v = new Variable([1, 2, 3]);
      const child = v.getAtIndexOrNull(-1);
      expect(child).toBe(null);
    });

    it('should handle invalid child access', () => {
      const v = new Variable({ a: 1 });
      const child = v.getChildOrNull('nonexistent');
      expect(child).toBe(null);
    });

    it('should handle removeAtIndex with invalid index', () => {
      const v = new Variable([1, 2, 3]);
      expect(v.removeAtIndex(-1)).toBe(false);
      expect(v.removeAtIndex(10)).toBe(false);
    });

    it('should handle nested complex structure', () => {
      const v = new Variable({
        player: {
          name: 'John',
          inventory: {
            items: [
              { id: 1, name: 'sword' },
              { id: 2, name: 'shield' },
            ],
          },
        },
      });

      expect(v.getChild('player').getChild('name').getString()).toBe('John');
      const item = v
        .getChild('player')
        .getChild('inventory')
        .getChild('items')
        .getAtIndex(0);
      expect(item.getChild('name').getString()).toBe('sword');
    });
  });

  // ============================================================================
  // Persistent UUID 测试
  // ============================================================================

  describe('Persistent UUID', () => {
    it('should reset persistent UUID', () => {
      const v = new Variable();
      v.resetPersistentUuid();
      expect(v.getPersistentUuid()).toBeTruthy();
      expect(v.getPersistentUuid().length).toBe(36); // UUID v4 format
    });

    it('should clear persistent UUID', () => {
      const v = new Variable();
      v.resetPersistentUuid();
      v.clearPersistentUuid();
      expect(v.getPersistentUuid()).toBe('');
    });
  });

  // ============================================================================
  // 原始值转换测试
  // ============================================================================

  describe('Value Conversion', () => {
    it('should convert from value', () => {
      const v = new Variable();
      v.setFromValue(42);
      expect(v.getValue()).toBe(42);

      v.setFromValue('hello');
      expect(v.getString()).toBe('hello');

      v.setFromValue(true);
      expect(v.getBool()).toBe(true);

      v.setFromValue([1, 2, 3]);
      expect(v.getChildrenCount()).toBe(3);
    });

    it('should get as value', () => {
      const v = new Variable(42);
      expect(v.getAsValue()).toBe(42);

      const v2 = new Variable({ a: 1, b: 2 });
      expect(v2.getAsValue()).toEqual({ a: 1, b: 2 });
    });
  });
});
