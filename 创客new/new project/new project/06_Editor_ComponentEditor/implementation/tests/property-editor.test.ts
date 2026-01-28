/**
 * 属性编辑器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PropertyEditor,
  PropertyEditorFactory,
  PropertyValidationError,
} from '../property-editor';
import { PropertyType } from '../types';

describe('PropertyEditor', () => {
  let editor: PropertyEditor;

  beforeEach(() => {
    editor = PropertyEditorFactory.createEditor(
      'test-component',
      'button',
      {
        size: 'default',
        type: 'primary',
        disabled: false,
      },
    );
  });

  // ==========================================================================
  // 基本操作测试
  // ==========================================================================

  describe('基本操作', () => {
    it('应该能获取属性值', () => {
      const value = editor.getPropertyValue('size');
      expect(value).toBe('default');
    });

    it('应该能获取所有属性值', () => {
      const values = editor.getAllValues();
      expect(values).toHaveProperty('size', 'default');
      expect(values).toHaveProperty('type', 'primary');
      expect(values).toHaveProperty('disabled', false);
    });
  });

  // ==========================================================================
  // 更新操作测试
  // ==========================================================================

  describe('更新操作', () => {
    it('应该能更新属性值', () => {
      const change = editor.updateProperty('size', 'mini');
      expect(change.property).toBe('size');
      expect(change.oldValue).toBe('default');
      expect(change.newValue).toBe('mini');
      expect(editor.getPropertyValue('size')).toBe('mini');
    });

    it('应该能批量更新属性', () => {
      const changes = editor.updateProperties({
        size: 'mini',
        type: 'warn',
      });

      expect(changes).toHaveLength(2);
      expect(editor.getPropertyValue('size')).toBe('mini');
      expect(editor.getPropertyValue('type')).toBe('warn');
    });

    it('更新不存在的属性应抛出错误', () => {
      expect(() => {
        editor.updateProperty('non-existent-property', 'value');
      }).toThrow(PropertyValidationError);
    });
  });

  // ==========================================================================
  // 验证测试
  // ==========================================================================

  describe('验证', () => {
    it('应该验证枚举类型', () => {
      expect(() => {
        editor.updateProperty('size', 'invalid-size');
      }).toThrow(PropertyValidationError);
    });

    it('应该验证布尔值类型', () => {
      expect(() => {
        editor.updateProperty('disabled', 'not-a-boolean');
      }).toThrow(PropertyValidationError);
    });

    it('应该能识别数字属性', () => {
      const editor2 = PropertyEditorFactory.createEditor(
        'test-component',
        'input',
        {
          maxlength: 100,
        },
      );

      const change = editor2.updateProperty('maxlength', 200);
      expect(change.newValue).toBe(200);
    });

    it('应该验证数字范围', () => {
      const editor2 = PropertyEditorFactory.createEditor(
        'test-component',
        'input',
        {
          maxlength: 100,
        },
      );

      expect(() => {
        editor2.updateProperty('maxlength', -5);
      }).toThrow(PropertyValidationError);
    });

    it('应该验证必填属性', () => {
      const editor2 = PropertyEditorFactory.createEditor(
        'test-component',
        'button',
        {
          type: '',
        },
      );

      expect(() => {
        editor2.updateProperty('type', '');
      }).toThrow(PropertyValidationError);
    });
  });

  // ==========================================================================
  // 重置测试
  // ==========================================================================

  describe('重置', () => {
    it('应该能重置单个属性', () => {
      editor.updateProperty('size', 'mini');
      expect(editor.getPropertyValue('size')).toBe('mini');

      const change = editor.resetProperty('size');
      expect(change.newValue).toBe('default');
      expect(editor.getPropertyValue('size')).toBe('default');
    });

    it('应该能重置所有属性', () => {
      editor.updateProperties({
        size: 'mini',
        type: 'warn',
      });

      expect(editor.getPropertyValue('size')).toBe('mini');
      expect(editor.getPropertyValue('type')).toBe('warn');

      editor.resetAll();

      expect(editor.getPropertyValue('size')).toBe('default');
      expect(editor.getPropertyValue('type')).toBe('primary');
    });
  });

  // ==========================================================================
  // 变更跟踪测试
  // ==========================================================================

  describe('变更跟踪', () => {
    it('应该能追踪属性变更', () => {
      editor.updateProperty('size', 'mini');
      editor.updateProperty('type', 'warn');

      const changes = editor.getChanges();
      expect(changes).toHaveLength(2);
      expect(changes[0].property).toBe('size');
      expect(changes[1].property).toBe('type');
    });

    it('应该能清空变更历史', () => {
      editor.updateProperty('size', 'mini');
      expect(editor.getChanges()).toHaveLength(1);

      editor.clearChanges();
      expect(editor.getChanges()).toHaveLength(0);
    });

    it('变更应该包含时间戳', () => {
      const change = editor.updateProperty('size', 'mini');
      expect(change.timestamp).toBeInstanceOf(Date);
    });

    it('变更应该包含组件ID', () => {
      const change = editor.updateProperty('size', 'mini');
      expect(change.componentId).toBe('test-component');
    });
  });

  // ==========================================================================
  // 回调测试
  // ==========================================================================

  describe('回调', () => {
    it('应该在属性变更时调用 onChange 回调', () => {
      let called = false;
      let lastProperty = '';
      let lastValue: any;

      const editor2 = PropertyEditorFactory.createEditor(
        'test-component',
        'button',
        { size: 'default', type: 'primary' },
        (property, value) => {
          called = true;
          lastProperty = property;
          lastValue = value;
        },
      );

      editor2.updateProperty('size', 'mini');

      expect(called).toBe(true);
      expect(lastProperty).toBe('size');
      expect(lastValue).toBe('mini');
    });
  });

  // ==========================================================================
  // 属性分组测试
  // ==========================================================================

  describe('属性分组', () => {
    it('应该能获取属性分组', () => {
      const groups = editor.getPropertyGroups();
      expect(groups.length).toBeGreaterThan(0);
      expect(groups).toContain('基础');
    });

    it('应该能按分组获取属性', () => {
      const properties = editor.getPropertiesByGroup('基础');
      expect(properties.length).toBeGreaterThan(0);
    });

    it('获取不存在的分组应返回空数组', () => {
      const properties = editor.getPropertiesByGroup('non-existent-group');
      expect(properties).toEqual([]);
    });
  });

  // ==========================================================================
  // JSON 序列化测试
  // ==========================================================================

  describe('JSON 序列化', () => {
    it('应该能导出为 JSON', () => {
      const json = editor.toJSON();
      expect(typeof json).toBe('string');

      const data = JSON.parse(json);
      expect(data).toHaveProperty('componentId', 'test-component');
      expect(data).toHaveProperty('componentType', 'button');
      expect(data).toHaveProperty('values');
    });
  });

  // ==========================================================================
  // 颜色验证测试
  // ==========================================================================

  describe('颜色验证', () => {
    it('应该验证十六进制颜色', () => {
      const editor2 = PropertyEditorFactory.createEditor(
        'test-component',
        'icon',
        { color: '#000000' },
      );

      expect(() => {
        editor2.updateProperty('color', '#ff0000');
      }).not.toThrow();
    });

    it('应该拒绝无效的颜色值', () => {
      const editor2 = PropertyEditorFactory.createEditor(
        'test-component',
        'icon',
        { color: '#000000' },
      );

      expect(() => {
        editor2.updateProperty('color', 'invalid-color');
      }).toThrow(PropertyValidationError);
    });
  });
});

// =============================================================================
// 工厂模式测试
// =============================================================================

describe('PropertyEditorFactory', () => {
  it('应该能为 button 创建编辑器', () => {
    const editor = PropertyEditorFactory.createEditor(
      'test-button',
      'button',
      {},
    );

    expect(editor).toBeDefined();
  });

  it('应该能为 input 创建编辑器', () => {
    const editor = PropertyEditorFactory.createEditor(
      'test-input',
      'input',
      {},
    );

    expect(editor).toBeDefined();
  });

  it('为不存在的组件类型创建编辑器应抛出错误', () => {
    expect(() => {
      PropertyEditorFactory.createEditor(
        'test-component',
        'non-existent-type',
        {},
      );
    }).toThrow();
  });
});
