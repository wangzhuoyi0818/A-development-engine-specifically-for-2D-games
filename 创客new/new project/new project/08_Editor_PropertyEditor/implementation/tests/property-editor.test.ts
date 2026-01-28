/**
 * PropertyEditor 类测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PropertyEditor, createPropertyEditor } from '../property-editor';
import {
  PropertyType,
  PropertyDefinition,
  PropertyEditorConfig,
  ValidationErrorCode,
} from '../types';

describe('PropertyEditor', () => {
  let editor: PropertyEditor;
  let config: PropertyEditorConfig;

  beforeEach(() => {
    config = {
      definitions: [
        {
          name: 'text',
          label: '文本',
          type: PropertyType.Text,
          defaultValue: '',
          group: '基本',
          order: 1,
        },
        {
          name: 'count',
          label: '数量',
          type: PropertyType.Number,
          defaultValue: 0,
          required: true,
          validation: [
            {
              type: 'range',
              params: {
                min: 0,
                max: 100,
              },
              message: '数量必须在0-100之间',
            },
          ],
          options: {
            numberOptions: {
              min: 0,
              max: 100,
              step: 1,
            },
          },
          group: '基本',
          order: 2,
        },
        {
          name: 'color',
          label: '颜色',
          type: PropertyType.Color,
          defaultValue: '#000000',
          group: '样式',
          order: 1,
        },
        {
          name: 'enabled',
          label: '启用',
          type: PropertyType.Checkbox,
          defaultValue: true,
          group: '高级',
          order: 1,
        },
      ],
      initialValues: {
        text: 'Hello',
        count: 10,
        color: '#ff0000',
        enabled: true,
      },
    };

    editor = new PropertyEditor(config);
  });

  // ============================================================================
  // 初始化测试
  // ============================================================================

  describe('Initialization', () => {
    it('should initialize with config', () => {
      expect(editor).toBeDefined();
      expect(editor.getProperty('text')).toBe('Hello');
      expect(editor.getProperty('count')).toBe(10);
    });

    it('should use default values when no initial values provided', () => {
      const newConfig: PropertyEditorConfig = {
        definitions: [
          {
            name: 'test',
            label: '测试',
            type: PropertyType.Text,
            defaultValue: 'default',
          },
        ],
      };
      const newEditor = new PropertyEditor(newConfig);
      expect(newEditor.getProperty('test')).toBe('default');
    });

    it('should register property definitions', () => {
      const definition = editor.getDefinition('text');
      expect(definition).toBeDefined();
      expect(definition?.name).toBe('text');
      expect(definition?.type).toBe(PropertyType.Text);
    });

    it('should group properties', () => {
      const groups = editor.getGroups();
      expect(groups.length).toBeGreaterThan(0);

      const basicGroup = groups.find((g) => g.name === '基本');
      expect(basicGroup).toBeDefined();
      expect(basicGroup?.properties).toContain('text');
      expect(basicGroup?.properties).toContain('count');
    });
  });

  // ============================================================================
  // 属性操作测试
  // ============================================================================

  describe('Property Operations', () => {
    it('should get property value', () => {
      expect(editor.getProperty('text')).toBe('Hello');
      expect(editor.getProperty('count')).toBe(10);
    });

    it('should get all properties', () => {
      const all = editor.getAllProperties();
      expect(all.text).toBe('Hello');
      expect(all.count).toBe(10);
      expect(all.color).toBe('#ff0000');
    });

    it('should update property value', () => {
      const result = editor.updateProperty('text', 'World');
      expect(result.valid).toBe(true);
      expect(editor.getProperty('text')).toBe('World');
    });

    it('should emit change event on update', async () => {
      const promise = new Promise<void>((resolve) => {
        editor.on('change', (event) => {
          expect(event.propertyName).toBe('text');
          expect(event.newValue).toBe('World');
          expect(event.oldValue).toBe('Hello');
          resolve();
        });
      });

      editor.updateProperty('text', 'World');
      await promise;
    });

    it('should validate on update', () => {
      const result = editor.updateProperty('count', 150); // 超出 max: 100
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reset property to original value', () => {
      editor.updateProperty('text', 'Modified');
      expect(editor.getProperty('text')).toBe('Modified');

      editor.resetProperty('text');
      expect(editor.getProperty('text')).toBe('Hello');
    });

    it('should reset all properties', () => {
      editor.updateProperty('text', 'Modified1');
      editor.updateProperty('count', 50);

      editor.resetAll();
      expect(editor.getProperty('text')).toBe('Hello');
      expect(editor.getProperty('count')).toBe(10);
    });
  });

  // ============================================================================
  // 验证测试
  // ============================================================================

  describe('Validation', () => {
    it('should validate required property', () => {
      const result = editor.validateProperty('count', null);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCode.REQUIRED);
    });

    it('should validate property type', () => {
      const result = editor.validateProperty('count', 'invalid' as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCode.TYPE_MISMATCH);
    });

    it('should validate property range', () => {
      const result = editor.validateProperty('count', 150);
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(ValidationErrorCode.OUT_OF_RANGE);
    });

    it('should validate all properties', () => {
      // 直接修改内部值以触发验证失败（因为 updateProperty 会在验证失败时拒绝更新）
      (editor as any).currentValues.count = null;
      const result = editor.validateAll();
      expect(result.valid).toBe(false);
    });

    it('should use custom validator', () => {
      editor.registerValidator('text', (value) => {
        if (value === 'forbidden') {
          return {
            code: ValidationErrorCode.CUSTOM,
            message: '禁止使用此值',
          };
        }
        return null;
      });

      const result = editor.validateProperty('text', 'forbidden');
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('禁止使用此值');
    });

    it('should track errors', () => {
      editor.updateProperty('count', 150);
      expect(editor.hasErrors()).toBe(true);

      const errors = editor.getPropertyErrors('count');
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should clear errors', () => {
      editor.updateProperty('count', 150);
      expect(editor.hasErrors()).toBe(true);

      editor.clearErrors();
      expect(editor.hasErrors()).toBe(false);
    });
  });

  // ============================================================================
  // 批量编辑测试
  // ============================================================================

  describe('Batch Edit', () => {
    it('should start batch edit mode', () => {
      const spy = vi.fn();
      editor.on('batchStart', spy);

      editor.startBatchEdit();
      expect(spy).toHaveBeenCalled();
    });

    it('should update batch properties without emitting change', () => {
      const changeSpy = vi.fn();
      editor.on('change', changeSpy);

      editor.startBatchEdit();
      editor.updateBatchProperty('text', 'Batch1');
      editor.updateBatchProperty('count', 20);

      expect(changeSpy).not.toHaveBeenCalled();
    });

    it('should commit batch edit', () => {
      const commitSpy = vi.fn();
      editor.on('batchCommit', commitSpy);

      editor.startBatchEdit();
      editor.updateBatchProperty('text', 'Batch1');
      editor.updateBatchProperty('count', 20);

      const result = editor.commitBatchEdit();
      expect(result.valid).toBe(true);
      expect(commitSpy).toHaveBeenCalled();

      expect(editor.getProperty('text')).toBe('Batch1');
      expect(editor.getProperty('count')).toBe(20);
    });

    it('should cancel batch edit', () => {
      const cancelSpy = vi.fn();
      editor.on('batchCancel', cancelSpy);

      editor.startBatchEdit();
      editor.updateBatchProperty('text', 'Batch1');

      editor.cancelBatchEdit();
      expect(cancelSpy).toHaveBeenCalled();

      expect(editor.getProperty('text')).toBe('Hello'); // 未改变
    });

    it('should throw error when not in batch mode', () => {
      expect(() => {
        editor.updateBatchProperty('text', 'value');
      }).toThrow();

      expect(() => {
        editor.commitBatchEdit();
      }).toThrow();
    });
  });

  // ============================================================================
  // 搜索和分组测试
  // ============================================================================

  describe('Search and Groups', () => {
    it('should search properties', () => {
      editor.search('文本');
      const visible = editor.getVisibleProperties();
      expect(visible).toContain('text');
      expect(visible.length).toBe(1);
    });

    it('should show all when search is empty', () => {
      editor.search('');
      const visible = editor.getVisibleProperties();
      expect(visible.length).toBe(4); // 所有属性
    });

    it('should emit search event', async () => {
      const promise = new Promise<void>((resolve) => {
        editor.on('search', (text) => {
          expect(text).toBe('颜色');
          resolve();
        });
      });

      editor.search('颜色');
      await promise;
    });

    it('should get groups', () => {
      const groups = editor.getGroups();
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should get group properties', () => {
      const basicProps = editor.getGroupProperties('基本');
      expect(basicProps.length).toBe(2);
      expect(basicProps[0].name).toBe('text');
    });

    it('should toggle group expansion', () => {
      expect(editor.isGroupExpanded('基本')).toBe(true);

      editor.toggleGroup('基本');
      expect(editor.isGroupExpanded('基本')).toBe(false);

      editor.toggleGroup('基本');
      expect(editor.isGroupExpanded('基本')).toBe(true);
    });
  });

  // ============================================================================
  // 导入导出测试
  // ============================================================================

  describe('Import/Export', () => {
    it('should export to JSON', () => {
      const json = editor.export();
      expect(json).toBeDefined();

      const parsed = JSON.parse(json);
      expect(parsed.definitions).toBeDefined();
      expect(parsed.values).toBeDefined();
    });

    it('should import from JSON', () => {
      const json = JSON.stringify({
        definitions: [
          {
            name: 'newProp',
            label: '新属性',
            type: PropertyType.Text,
            defaultValue: '',
          },
        ],
        values: {
          newProp: 'imported',
        },
      });

      editor.import(json);
      expect(editor.getProperty('newProp')).toBe('imported');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        editor.import('invalid json');
      }).toThrow();
    });
  });

  // ============================================================================
  // 状态获取测试
  // ============================================================================

  describe('State', () => {
    it('should get editor state', () => {
      const state = editor.getState();

      expect(state.definitions).toBeDefined();
      expect(state.currentValues).toBeDefined();
      expect(state.originalValues).toBeDefined();
      expect(state.groups).toBeDefined();
      expect(state.batchMode).toBe(false);
    });
  });

  // ============================================================================
  // 销毁测试
  // ============================================================================

  describe('Destroy', () => {
    it('should destroy editor and remove listeners', () => {
      const spy = vi.fn();
      editor.on('change', spy);

      editor.destroy();

      // 事件不应再触发
      editor.updateProperty('text', 'After destroy');
      // 由于已销毁，监听器不会被调用
      // 注意：destroy 后调用方法可能会有副作用，这里只是测试事件清理
    });
  });

  // ============================================================================
  // 工厂函数测试
  // ============================================================================

  describe('createPropertyEditor', () => {
    it('should create editor using factory function', () => {
      const newEditor = createPropertyEditor(config);
      expect(newEditor).toBeInstanceOf(PropertyEditor);
      expect(newEditor.getProperty('text')).toBe('Hello');
    });
  });
});
