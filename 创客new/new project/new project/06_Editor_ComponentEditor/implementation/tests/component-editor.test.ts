/**
 * 组件编辑器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ComponentEditor,
  ComponentEditorManager,
  ComponentEditorError,
  ComponentData,
} from '../component-editor';
import { EventBindingType, EventActionType } from '../types';

describe('ComponentEditor', () => {
  let editor: ComponentEditor;
  let component: ComponentData;

  beforeEach(() => {
    component = {
      id: 'test-button',
      type: 'button',
      name: '测试按钮',
      properties: { type: 'primary' },
      styles: {},
      events: [],
      children: [],
    };

    editor = new ComponentEditor(component);
  });

  // ==========================================================================
  // 基本操作测试
  // ==========================================================================

  describe('基本操作', () => {
    it('应该能获取组件数据', () => {
      const comp = editor.getComponent();
      expect(comp.id).toBe('test-button');
      expect(comp.type).toBe('button');
    });

    it('应该能获取组件定义', () => {
      const def = editor.getDefinition();
      expect(def).toBeDefined();
      expect(def.id).toBe('button');
    });

    it('应该能获取属性编辑器', () => {
      const propEditor = editor.getPropertyEditor();
      expect(propEditor).toBeDefined();
    });
  });

  // ==========================================================================
  // 属性操作测试
  // ==========================================================================

  describe('属性操作', () => {
    it('应该能更新属性', () => {
      editor.updateProperty('size', 'mini');
      expect(editor.getPropertyValue('size')).toBe('mini');
    });

    it('应该能批量更新属性', () => {
      editor.updateProperties({
        size: 'mini',
        type: 'warn',
      });

      expect(editor.getPropertyValue('size')).toBe('mini');
      expect(editor.getPropertyValue('type')).toBe('warn');
    });

    it('应该能获取属性值', () => {
      const value = editor.getPropertyValue('type');
      expect(value).toBe('primary');
    });
  });

  // ==========================================================================
  // 样式操作测试
  // ==========================================================================

  describe('样式操作', () => {
    it('应该能更新样式', () => {
      editor.updateStyle('color', 'red');
      expect(editor.getStyleValue('color')).toBe('red');
    });

    it('应该能批量更新样式', () => {
      editor.updateStyles({
        color: 'red',
        fontSize: '16px',
      });

      expect(editor.getStyleValue('color')).toBe('red');
      expect(editor.getStyleValue('fontSize')).toBe('16px');
    });

    it('应该能获取样式值', () => {
      editor.updateStyle('color', 'blue');
      const value = editor.getStyleValue('color');
      expect(value).toBe('blue');
    });
  });

  // ==========================================================================
  // 事件绑定测试
  // ==========================================================================

  describe('事件绑定', () => {
    it('应该能添加事件绑定', () => {
      const binding = editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleTap',
      });

      expect(binding.id).toBeDefined();
      expect(binding.eventName).toBe('bindtap');
      expect(binding.handlerName).toBe('handleTap');
    });

    it('应该能更新事件绑定', () => {
      const binding = editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleTap',
      });

      const updated = editor.updateEventBinding(binding.id, {
        handlerName: 'handleNewTap',
      });

      expect(updated.handlerName).toBe('handleNewTap');
    });

    it('应该能删除事件绑定', () => {
      const binding = editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleTap',
      });

      expect(editor.removeEventBinding(binding.id)).toBe(true);
      expect(editor.getEventBinding(binding.id)).toBeUndefined();
    });

    it('删除不存在的事件绑定应返回 false', () => {
      const result = editor.removeEventBinding('non-existent-id');
      expect(result).toBe(false);
    });

    it('应该能获取事件绑定', () => {
      const binding = editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleTap',
      });

      const retrieved = editor.getEventBinding(binding.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(binding.id);
    });

    it('应该能获取所有事件绑定', () => {
      editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleTap',
      });

      editor.addEventBinding({
        eventName: 'bindlongtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleLongtap',
      });

      const bindings = editor.getEventBindings();
      expect(bindings).toHaveLength(2);
    });

    it('应该能按事件名称获取绑定', () => {
      editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleTap',
      });

      editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Function,
        handlerName: 'handleAnotherTap',
      });

      const bindings = editor.getEventBindingsByName('bindtap');
      expect(bindings).toHaveLength(2);
    });

    it('添加不存在的事件应抛出错误', () => {
      expect(() => {
        editor.addEventBinding({
          eventName: 'non-existent-event',
          bindingType: EventBindingType.Function,
          handlerName: 'handler',
        });
      }).toThrow(ComponentEditorError);
    });

    it('更新不存在的事件绑定应抛出错误', () => {
      expect(() => {
        editor.updateEventBinding('non-existent-id', {});
      }).toThrow(ComponentEditorError);
    });
  });

  // ==========================================================================
  // 事件动作测试
  // ==========================================================================

  describe('事件动作绑定', () => {
    it('应该能添加带动作的事件绑定', () => {
      const binding = editor.addEventBinding({
        eventName: 'bindtap',
        bindingType: EventBindingType.Actions,
        actions: [
          {
            id: 'action-1',
            type: EventActionType.ShowToast,
            params: { message: '点击了按钮' },
          },
        ],
      });

      expect(binding.actions).toHaveLength(1);
      expect(binding.actions![0].type).toBe(EventActionType.ShowToast);
    });
  });

  // ==========================================================================
  // 验证测试
  // ==========================================================================

  describe('验证', () => {
    it('有效的组件应该通过验证', () => {
      const result = editor.validate();
      expect(result.valid).toBe(true);
    });

    it('不允许子组件的组件应该在验证时报错', () => {
      // 使用 input 组件,它不允许子组件
      const inputComponent: ComponentData = {
        id: 'test-input',
        type: 'input',
        properties: {},
        styles: {},
        events: [],
        children: [
          {
            id: 'child',
            type: 'text',
            properties: {},
            styles: {},
            events: [],
            children: [],
          },
        ],
      };

      const editor2 = new ComponentEditor(inputComponent);
      const result = editor2.validate();
      expect(result.valid).toBe(false);
    });
  });

  // ==========================================================================
  // 克隆测试
  // ==========================================================================

  describe('克隆', () => {
    it('应该能克隆组件', () => {
      editor.updateProperty('size', 'mini');
      editor.updateStyle('color', 'red');

      const cloned = editor.clone();

      expect(cloned.id).toBe(component.id);
      expect(cloned.type).toBe(component.type);
      expect(cloned.properties.size).toBe('mini');
      expect(cloned.styles.color).toBe('red');
    });

    it('克隆后的组件应该是独立的', () => {
      const cloned = editor.clone();
      cloned.properties.size = 'mini';

      expect(editor.getPropertyValue('size')).not.toBe('mini');
    });
  });

  // ==========================================================================
  // JSON 序列化测试
  // ==========================================================================

  describe('JSON 序列化', () => {
    it('应该能导出为 JSON', () => {
      editor.updateProperty('size', 'mini');
      const json = editor.toJSON();

      expect(typeof json).toBe('string');
      const data = JSON.parse(json);
      expect(data.type).toBe('button');
      expect(data.properties.size).toBe('mini');
    });
  });
});

// =============================================================================
// 组件编辑器管理器测试
// =============================================================================

describe('ComponentEditorManager', () => {
  let manager: ComponentEditorManager;

  beforeEach(() => {
    manager = new ComponentEditorManager();
  });

  // ==========================================================================
  // 组件创建测试
  // ==========================================================================

  describe('组件创建', () => {
    it('应该能创建组件', () => {
      const component = manager.createComponent('button');

      expect(component).toBeDefined();
      expect(component.id).toBeDefined();
      expect(component.type).toBe('button');
      expect(component.properties).toBeDefined();
    });

    it('创建的组件应该有默认属性值', () => {
      const component = manager.createComponent('button');

      expect(component.properties.size).toBe('default');
      expect(component.properties.type).toBe('default');
    });

    it('应该能创建组件并自定义属性', () => {
      const component = manager.createComponent('button', {
        size: 'mini',
        type: 'warn',
      });

      expect(component.properties.size).toBe('mini');
      expect(component.properties.type).toBe('warn');
    });

    it('创建不存在的组件类型应抛出错误', () => {
      expect(() => {
        manager.createComponent('non-existent-type');
      }).toThrow(ComponentEditorError);
    });

    it('应该能创建多个组件', () => {
      const components = manager.createComponents(['button', 'input', 'text']);

      expect(components).toHaveLength(3);
      expect(components[0].type).toBe('button');
      expect(components[1].type).toBe('input');
      expect(components[2].type).toBe('text');
    });
  });

  // ==========================================================================
  // 编辑器管理测试
  // ==========================================================================

  describe('编辑器管理', () => {
    it('应该能创建编辑器', () => {
      const component = manager.createComponent('button');
      const editor = manager.createEditor(component);

      expect(editor).toBeDefined();
      expect(manager.getEditor(component.id)).toBe(editor);
    });

    it('应该能获取编辑器', () => {
      const component = manager.createComponent('button');
      const editor = manager.createEditor(component);

      const retrieved = manager.getEditor(component.id);
      expect(retrieved).toBe(editor);
    });

    it('获取不存在的编辑器应返回 undefined', () => {
      const editor = manager.getEditor('non-existent-id');
      expect(editor).toBeUndefined();
    });

    it('应该能移除编辑器', () => {
      const component = manager.createComponent('button');
      const editor = manager.createEditor(component);

      expect(manager.removeEditor(component.id)).toBe(true);
      expect(manager.getEditor(component.id)).toBeUndefined();
    });

    it('移除不存在的编辑器应返回 false', () => {
      const result = manager.removeEditor('non-existent-id');
      expect(result).toBe(false);
    });

    it('应该能清空所有编辑器', () => {
      const comp1 = manager.createComponent('button');
      const comp2 = manager.createComponent('input');

      manager.createEditor(comp1);
      manager.createEditor(comp2);

      manager.clearEditors();

      expect(manager.getEditor(comp1.id)).toBeUndefined();
      expect(manager.getEditor(comp2.id)).toBeUndefined();
    });
  });
});
