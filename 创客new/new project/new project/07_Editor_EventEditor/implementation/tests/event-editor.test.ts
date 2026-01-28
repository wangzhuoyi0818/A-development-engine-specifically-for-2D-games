/**
 * 事件编辑器核心测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EventEditor } from '../event-editor';
import { BaseEvent, StandardEvent } from '../../../02_Core_EventSystem/implementation/types';

describe('EventEditor', () => {
  let editor: EventEditor;

  beforeEach(() => {
    editor = new EventEditor();
  });

  describe('基本操作', () => {
    it('应该正确初始化空编辑器', () => {
      const events = editor.getEvents();
      expect(events).toEqual([]);
      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(false);
    });

    it('应该能添加根级事件', () => {
      const result = editor.addEvent(null, { type: 'standard' });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.type).toBe('standard');

      const events = editor.getEvents();
      expect(events.length).toBe(1);
      expect(events[0].id).toBe(result.data?.id);
    });

    it('应该能添加子事件', () => {
      const parentResult = editor.addEvent(null, { type: 'standard' });
      const parentId = parentResult.data!.id;

      const childResult = editor.addEvent(parentId, { type: 'standard' });
      expect(childResult.success).toBe(true);

      const parentEvent = editor.findEvent(parentId) as StandardEvent;
      expect(parentEvent.subEvents).toBeDefined();
      expect(parentEvent.subEvents?.length).toBe(1);
      expect(parentEvent.subEvents?.[0].id).toBe(childResult.data?.id);
    });

    it('应该能删除事件', () => {
      const result = editor.addEvent(null, { type: 'standard' });
      const eventId = result.data!.id;

      const deleteResult = editor.removeEvent(eventId);
      expect(deleteResult.success).toBe(true);

      const events = editor.getEvents();
      expect(events.length).toBe(0);
    });

    it('应该能更新事件', () => {
      const result = editor.addEvent(null, { type: 'standard' });
      const eventId = result.data!.id;

      const updateResult = editor.updateEvent(eventId, { disabled: true });
      expect(updateResult.success).toBe(true);

      const event = editor.findEvent(eventId);
      expect(event?.disabled).toBe(true);
    });

    it('删除不存在的事件应该返回错误', () => {
      const result = editor.removeEvent('non-existent-id');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EVENT_NOT_FOUND');
    });
  });

  describe('查找功能', () => {
    it('应该能找到根级事件', () => {
      const result = editor.addEvent(null, { type: 'standard' });
      const eventId = result.data!.id;

      const found = editor.findEvent(eventId);
      expect(found).toBeDefined();
      expect(found?.id).toBe(eventId);
    });

    it('应该能找到嵌套事件', () => {
      const parentResult = editor.addEvent(null, { type: 'standard' });
      const childResult = editor.addEvent(parentResult.data!.id, { type: 'standard' });

      const found = editor.findEvent(childResult.data!.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(childResult.data?.id);
    });

    it('应该能获取事件路径', () => {
      const parentResult = editor.addEvent(null, { type: 'standard' });
      const childResult = editor.addEvent(parentResult.data!.id, { type: 'standard' });

      const path = editor.getEventPath(childResult.data!.id);
      expect(path.length).toBe(2);
      expect(path[0].id).toBe(parentResult.data?.id);
      expect(path[1].id).toBe(childResult.data?.id);
    });

    it('应该能获取事件位置', () => {
      const result1 = editor.addEvent(null, { type: 'standard' });
      const result2 = editor.addEvent(null, { type: 'standard' });

      const position = editor.getEventPosition(result2.data!.id);
      expect(position).toBeDefined();
      expect(position?.parentId).toBe(null);
      expect(position?.index).toBe(1);
    });
  });

  describe('拖拽排序', () => {
    it('应该能移动事件到新位置', () => {
      const result1 = editor.addEvent(null, { type: 'standard' });
      const result2 = editor.addEvent(null, { type: 'standard' });
      const eventId = result1.data!.id;

      const moveResult = editor.moveEvent(eventId, null, 1);
      expect(moveResult.success).toBe(true);

      const position = editor.getEventPosition(eventId);
      expect(position?.index).toBe(1);
    });

    it('应该能将事件移动到另一个事件下', () => {
      const parent = editor.addEvent(null, { type: 'standard' });
      const child = editor.addEvent(null, { type: 'standard' });

      const moveResult = editor.moveEvent(child.data!.id, parent.data!.id, 0);
      expect(moveResult.success).toBe(true);

      const parentEvent = editor.findEvent(parent.data!.id) as StandardEvent;
      expect(parentEvent.subEvents?.length).toBe(1);
      expect(parentEvent.subEvents?.[0].id).toBe(child.data?.id);
    });

    it('应该防止将事件移动到自己下面', () => {
      const result = editor.addEvent(null, { type: 'standard' });
      const eventId = result.data!.id;

      const moveResult = editor.moveEvent(eventId, eventId, 0);
      expect(moveResult.success).toBe(false);
      expect(moveResult.error?.code).toBe('INVALID_MOVE');
    });
  });

  describe('条件操作', () => {
    it('应该能添加条件到事件', () => {
      const eventResult = editor.addEvent(null, { type: 'standard' });
      const eventId = eventResult.data!.id;

      const conditionResult = editor.addCondition(eventId, { type: 'comparison' });
      expect(conditionResult.success).toBe(true);

      const event = editor.findEvent(eventId) as StandardEvent;
      expect(event.conditions.length).toBe(1);
      expect(event.conditions[0].id).toBe(conditionResult.data?.id);
    });

    it('应该能删除条件', () => {
      const eventResult = editor.addEvent(null, { type: 'standard' });
      const eventId = eventResult.data!.id;
      const conditionResult = editor.addCondition(eventId);
      const conditionId = conditionResult.data!.id;

      const deleteResult = editor.removeCondition(eventId, conditionId);
      expect(deleteResult.success).toBe(true);

      const event = editor.findEvent(eventId) as StandardEvent;
      expect(event.conditions.length).toBe(0);
    });

    it('应该能更新条件', () => {
      const eventResult = editor.addEvent(null, { type: 'standard' });
      const conditionResult = editor.addCondition(eventResult.data!.id);
      const conditionId = conditionResult.data!.id;

      const updateResult = editor.updateCondition(
        eventResult.data!.id,
        conditionId,
        { inverted: true },
      );
      expect(updateResult.success).toBe(true);

      const event = editor.findEvent(eventResult.data!.id) as StandardEvent;
      expect(event.conditions[0].inverted).toBe(true);
    });
  });

  describe('动作操作', () => {
    it('应该能添加动作到事件', () => {
      const eventResult = editor.addEvent(null, { type: 'standard' });
      const eventId = eventResult.data!.id;

      const actionResult = editor.addAction(eventId, { type: 'setData' });
      expect(actionResult.success).toBe(true);

      const event = editor.findEvent(eventId) as StandardEvent;
      expect(event.actions.length).toBe(1);
      expect(event.actions[0].id).toBe(actionResult.data?.id);
    });

    it('应该能删除动作', () => {
      const eventResult = editor.addEvent(null, { type: 'standard' });
      const eventId = eventResult.data!.id;
      const actionResult = editor.addAction(eventId);
      const actionId = actionResult.data!.id;

      const deleteResult = editor.removeAction(eventId, actionId);
      expect(deleteResult.success).toBe(true);

      const event = editor.findEvent(eventId) as StandardEvent;
      expect(event.actions.length).toBe(0);
    });
  });

  describe('历史记录', () => {
    it('应该能撤销操作', () => {
      editor.addEvent(null, { type: 'standard' });
      expect(editor.getEvents().length).toBe(1);

      const undoResult = editor.undo();
      expect(undoResult.success).toBe(true);
      expect(editor.getEvents().length).toBe(0);
    });

    it('应该能重做操作', () => {
      editor.addEvent(null, { type: 'standard' });
      editor.undo();

      const redoResult = editor.redo();
      expect(redoResult.success).toBe(true);
      expect(editor.getEvents().length).toBe(1);
    });

    it('没有历史时撤销应该失败', () => {
      const result = editor.undo();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NO_UNDO_HISTORY');
    });

    it('应该正确管理历史索引', () => {
      expect(editor.canUndo()).toBe(false);

      editor.addEvent(null, { type: 'standard' });
      expect(editor.canUndo()).toBe(true);
      expect(editor.canRedo()).toBe(false);

      editor.undo();
      expect(editor.canUndo()).toBe(false);
      expect(editor.canRedo()).toBe(true);
    });
  });

  describe('验证', () => {
    it('应该验证空事件为无效', () => {
      const eventResult = editor.addEvent(null, { type: 'standard' });
      const validation = editor.validateEvent(eventResult.data!.id);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.code === 'EMPTY_EVENT')).toBe(true);
    });

    it('应该验证有条件的事件为有效', () => {
      const eventResult = editor.addEvent(null, { type: 'standard' });
      editor.addCondition(eventResult.data!.id, {
        type: 'comparison',
        parameters: [
          { value: '1', type: 'literal' },
          { value: '2', type: 'literal' },
        ],
      });

      const validation = editor.validateEvent(eventResult.data!.id);
      expect(validation.valid).toBe(true);
    });

    it('应该验证整个事件树', () => {
      editor.addEvent(null, { type: 'standard' });
      editor.addEvent(null, { type: 'standard' });

      const validation = editor.validateAllEvents();
      expect(validation.valid).toBe(false);
      expect(validation.errors.size).toBe(2);
    });
  });
});
