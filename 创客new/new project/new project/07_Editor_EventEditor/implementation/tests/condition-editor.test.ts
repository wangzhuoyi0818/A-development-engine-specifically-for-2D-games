/**
 * 条件编辑器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConditionEditor, DEFAULT_CONDITION_TYPES } from '../condition-editor';
import { Condition } from '../../../02_Core_EventSystem/implementation/types';

describe('ConditionEditor', () => {
  let editor: ConditionEditor;

  beforeEach(() => {
    editor = new ConditionEditor(DEFAULT_CONDITION_TYPES);
  });

  describe('条件类型注册', () => {
    it('应该正确加载默认条件类型', () => {
      const types = editor.getAvailableConditionTypes();
      expect(types.length).toBeGreaterThan(0);
      expect(types.some(t => t.type === 'comparison')).toBe(true);
    });

    it('应该能注册新的条件类型', () => {
      editor.registerConditionType({
        type: 'custom' as any,
        label: '自定义条件',
        category: '自定义',
        parameters: [],
      });

      const metadata = editor.getConditionTypeMetadata('custom');
      expect(metadata).toBeDefined();
      expect(metadata?.label).toBe('自定义条件');
    });
  });

  describe('条件创建', () => {
    it('应该能创建比较条件', () => {
      const result = editor.createCondition('comparison');
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('comparison');
      expect(result.data?.parameters).toBeDefined();
    });

    it('创建未知类型应该失败', () => {
      const result = editor.createCondition('unknown-type');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_CONDITION_TYPE');
    });

    it('应该能克隆条件', () => {
      const original = editor.createCondition('comparison').data!;
      const cloned = editor.cloneCondition(original);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.type).toBe(original.type);
    });
  });

  describe('条件组合', () => {
    it('应该能创建AND复合条件', () => {
      const composite = editor.createCompositeCondition('AND');
      expect(composite.type).toBe('logical');
      expect(composite.logicalOperator).toBe('AND');
      expect(composite.subConditions).toEqual([]);
    });

    it('应该能添加子条件', () => {
      const composite = editor.createCompositeCondition('OR');
      const subCondition = editor.createCondition('comparison').data!;

      const result = editor.addSubCondition(composite, subCondition);
      expect(result.success).toBe(true);
      expect(composite.subConditions?.length).toBe(1);
    });

    it('应该能删除子条件', () => {
      const composite = editor.createCompositeCondition('AND');
      const subCondition = editor.createCondition('comparison').data!;
      editor.addSubCondition(composite, subCondition);

      const result = editor.removeSubCondition(composite, subCondition.id);
      expect(result.success).toBe(true);
      expect(composite.subConditions?.length).toBe(0);
    });
  });

  describe('条件验证', () => {
    it('应该验证有效条件', () => {
      const condition: Condition = {
        id: '1',
        type: 'comparison',
        parameters: [
          { value: '1', type: 'literal' },
          { value: '>', type: 'literal' },
          { value: '0', type: 'literal' },
        ],
      };

      const result = editor.validateCondition(condition);
      expect(result.valid).toBe(true);
    });

    it('应该检测参数数量不匹配', () => {
      const condition: Condition = {
        id: '1',
        type: 'comparison',
        parameters: [], // 应该有3个参数
      };

      const result = editor.validateCondition(condition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === 'PARAMETER_COUNT_MISMATCH')).toBe(true);
    });

    it('应该检测必需参数缺失', () => {
      const condition: Condition = {
        id: '1',
        type: 'comparison',
        parameters: [
          { value: '', type: 'literal' },
          { value: '>', type: 'literal' },
          { value: '0', type: 'literal' },
        ],
      };

      const result = editor.validateCondition(condition);
      expect(result.valid).toBe(false);
    });
  });
});
