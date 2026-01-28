/**
 * 参数字段测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ParameterFieldManager,
  VariablePicker,
  ExpressionEditorHelper,
} from '../parameter-fields';
import { Variable } from '../../../02_Core_EventSystem/implementation/types';

describe('ParameterFieldManager', () => {
  let manager: ParameterFieldManager;

  beforeEach(() => {
    manager = new ParameterFieldManager();
  });

  describe('表达式创建', () => {
    it('应该创建默认常量表达式', () => {
      const config = { name: 'test', type: 'string' as const, defaultValue: 'hello' };
      const expression = manager.createDefaultExpression(config, 'constant');

      expect(expression.value).toBe('hello');
      expect(expression.type).toBe('literal');
    });

    it('应该创建变量表达式', () => {
      const config = { name: 'test', type: 'variable' as const };
      const expression = manager.createDefaultExpression(config, 'variable');

      expect(expression.type).toBe('variable');
    });
  });

  describe('值来源切换', () => {
    it('应该能切换值来源', () => {
      const current = { value: 'test', type: 'literal' as const };
      const config = { name: 'test', type: 'expression' as const };

      const newExpr = manager.switchValueSource(current, 'expression', config);
      expect(newExpr.type).toBe('expression');
      expect(newExpr.value).toBe('test');
    });
  });

  describe('值验证', () => {
    it('应该验证必需参数', () => {
      const config = { name: 'test', type: 'string' as const, optional: false };
      const result = manager.validateValue('', config);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该验证数字类型', () => {
      const config = { name: 'test', type: 'number' as const };

      const valid = manager.validateValue('123', config);
      expect(valid.valid).toBe(true);

      const invalid = manager.validateValue('abc', config);
      expect(invalid.valid).toBe(false);
    });

    it('应该验证数字范围', () => {
      const config = { name: 'test', type: 'number' as const, min: 0, max: 10 };

      const tooSmall = manager.validateValue('-1', config);
      expect(tooSmall.valid).toBe(false);

      const tooLarge = manager.validateValue('11', config);
      expect(tooLarge.valid).toBe(false);

      const valid = manager.validateValue('5', config);
      expect(valid.valid).toBe(true);
    });
  });

  describe('显示值格式化', () => {
    it('应该格式化变量表达式', () => {
      const expression = { value: 'data.count', type: 'variable' as const };
      const variables: Variable[] = [
        { id: '1', name: 'data.count', type: 'number', initialValue: 0 },
      ];

      const formatted = manager.formatDisplayValue(expression, variables);
      expect(formatted).toBe('{{data.count}}');
    });

    it('应该格式化表达式', () => {
      const expression = { value: 'data.count + 1', type: 'expression' as const };
      const formatted = manager.formatDisplayValue(expression, []);

      expect(formatted).toBe('= data.count + 1');
    });
  });
});

describe('VariablePicker', () => {
  let picker: VariablePicker;
  let variables: Variable[];

  beforeEach(() => {
    picker = new VariablePicker();
    variables = [
      { id: '1', name: 'data.count', type: 'number', initialValue: 0 },
      { id: '2', name: 'data.name', type: 'string', initialValue: '' },
      { id: '3', name: 'global.userId', type: 'string', initialValue: '' },
    ];
  });

  describe('变量过滤', () => {
    it('应该根据搜索词过滤', () => {
      const filtered = picker.filterVariables(variables, 'count');
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('data.count');
    });

    it('应该根据类型过滤', () => {
      const filtered = picker.filterVariables(variables, '', 'string');
      expect(filtered.length).toBe(2);
      expect(filtered.every(v => v.type === 'string')).toBe(true);
    });
  });

  describe('变量分组', () => {
    it('应该按作用域分组', () => {
      const groups = picker.groupByScope(variables);
      expect(groups['页面数据'].length).toBe(2);
      expect(groups['全局变量'].length).toBe(1);
    });
  });
});

describe('ExpressionEditorHelper', () => {
  let helper: ExpressionEditorHelper;

  beforeEach(() => {
    helper = new ExpressionEditorHelper();
  });

  describe('变量引用提取', () => {
    it('应该提取表达式中的变量', () => {
      const expression = 'data.count + global.userId';
      const references = helper.extractVariableReferences(expression);

      expect(references).toContain('data.count');
      expect(references).toContain('global.userId');
    });

    it('应该去除重复的变量', () => {
      const expression = 'data.count + data.count';
      const references = helper.extractVariableReferences(expression);

      expect(references.length).toBe(1);
    });
  });

  describe('语法验证', () => {
    it('应该验证有效表达式', () => {
      const result = helper.validateSyntax('1 + 2');
      expect(result.valid).toBe(true);
    });

    it('应该检测空表达式', () => {
      const result = helper.validateSyntax('');
      expect(result.valid).toBe(false);
    });

    it('应该检测括号不匹配', () => {
      const result = helper.validateSyntax('(1 + 2');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('括号');
    });

    it('应该检测语法错误', () => {
      const result = helper.validateSyntax('1 +');
      expect(result.valid).toBe(false);
    });
  });

  describe('词法分析', () => {
    it('应该正确分词', () => {
      const tokens = helper.tokenize('data.count + 1');
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some(t => t.type === 'variable')).toBe(true);
      expect(tokens.some(t => t.type === 'operator')).toBe(true);
      expect(tokens.some(t => t.type === 'number')).toBe(true);
    });
  });
});
