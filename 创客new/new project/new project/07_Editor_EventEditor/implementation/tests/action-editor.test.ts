/**
 * 动作编辑器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ActionEditor, DEFAULT_ACTION_TYPES } from '../action-editor';

describe('ActionEditor', () => {
  let editor: ActionEditor;

  beforeEach(() => {
    editor = new ActionEditor(DEFAULT_ACTION_TYPES);
  });

  describe('动作创建', () => {
    it('应该能创建setData动作', () => {
      const result = editor.createAction('setData');
      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('setData');
    });

    it('应该能创建navigateTo动作', () => {
      const result = editor.createAction('navigateTo');
      expect(result.success).toBe(true);
      expect(result.data?.async).toBe(true);
    });

    it('创建未知类型应该失败', () => {
      const result = editor.createAction('unknown-action');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('UNKNOWN_ACTION_TYPE');
    });
  });

  describe('动作克隆', () => {
    it('应该能克隆动作', () => {
      const original = editor.createAction('setData').data!;
      const cloned = editor.cloneAction(original);

      expect(cloned.id).not.toBe(original.id);
      expect(cloned.type).toBe(original.type);
      expect(cloned.async).toBe(original.async);
    });
  });
});
