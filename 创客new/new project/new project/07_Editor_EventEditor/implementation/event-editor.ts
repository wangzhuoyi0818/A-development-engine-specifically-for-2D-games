/**
 * 事件编辑器核心
 *
 * 提供事件树的管理功能,包括:
 * - 事件的增删改查
 * - 拖拽排序
 * - 历史记录(撤销/重做)
 * - 验证
 */

import { v4 as uuid } from 'uuid';
import {
  BaseEvent,
  StandardEvent,
  Condition,
  Action,
  ValidationError,
  ValidationWarning,
} from '../../02_Core_EventSystem/implementation/types';
import { EditorSnapshot, OperationResult, DeepPartial } from './types';

/**
 * 事件编辑器
 * 负责管理事件树的核心操作
 */
export class EventEditor {
  private events: BaseEvent[] = [];
  private history: EditorSnapshot[] = [];
  private historyIndex = -1;
  private maxHistorySize = 50;
  private validationErrors: Map<string, ValidationError[]> = new Map();

  constructor(initialEvents: BaseEvent[] = []) {
    this.events = JSON.parse(JSON.stringify(initialEvents));
    this.createSnapshot('初始化编辑器');
  }

  // ============================================================================
  // 事件基本操作
  // ============================================================================

  /**
   * 获取所有事件
   */
  getEvents(): BaseEvent[] {
    return JSON.parse(JSON.stringify(this.events));
  }

  /**
   * 设置所有事件
   */
  setEvents(events: BaseEvent[]): OperationResult {
    try {
      this.events = JSON.parse(JSON.stringify(events));
      this.createSnapshot('设置事件');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SET_EVENTS_FAILED',
          message: error instanceof Error ? error.message : '设置事件失败',
        },
      };
    }
  }

  /**
   * 添加事件
   */
  addEvent(parentId: string | null, eventData: DeepPartial<BaseEvent> = {}): OperationResult<BaseEvent> {
    try {
      const newEvent: StandardEvent = {
        id: uuid(),
        type: 'standard',
        conditions: [],
        actions: [],
        disabled: false,
        folded: false,
        ...eventData,
      } as StandardEvent;

      if (parentId === null) {
        // 添加到根级别
        this.events.push(newEvent);
      } else {
        // 添加到子事件
        const parentEvent = this.findEvent(parentId);
        if (!parentEvent) {
          return {
            success: false,
            error: {
              code: 'PARENT_NOT_FOUND',
              message: `未找到父事件: ${parentId}`,
            },
          };
        }

        if (!('subEvents' in parentEvent)) {
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_SUBEVENT',
              message: `事件类型 ${parentEvent.type} 不支持子事件`,
            },
          };
        }

        if (!parentEvent.subEvents) {
          parentEvent.subEvents = [];
        }

        parentEvent.subEvents.push(newEvent);
      }

      this.createSnapshot('添加事件');
      return {
        success: true,
        data: newEvent,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_EVENT_FAILED',
          message: error instanceof Error ? error.message : '添加事件失败',
        },
      };
    }
  }

  /**
   * 删除事件
   */
  removeEvent(eventId: string): OperationResult {
    try {
      if (!this.findEvent(eventId)) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件: ${eventId}`,
          },
        };
      }

      this.events = this.removeEventRecursive(this.events, eventId);
      this.createSnapshot('删除事件');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_EVENT_FAILED',
          message: error instanceof Error ? error.message : '删除事件失败',
        },
      };
    }
  }

  /**
   * 更新事件
   */
  updateEvent(eventId: string, updates: DeepPartial<BaseEvent>): OperationResult {
    try {
      const event = this.findEvent(eventId);
      if (!event) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件: ${eventId}`,
          },
        };
      }

      // 浅合并更新 (不更新 id 和 type)
      Object.assign(event, {
        ...updates,
        id: event.id,
        type: event.type,
      });

      this.createSnapshot('更新事件');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_EVENT_FAILED',
          message: error instanceof Error ? error.message : '更新事件失败',
        },
      };
    }
  }

  /**
   * 查找事件
   */
  findEvent(eventId: string): BaseEvent | null {
    return this.findEventRecursive(this.events, eventId);
  }

  /**
   * 获取事件在树中的位置
   */
  getEventPosition(eventId: string): { parentId: string | null; index: number } | null {
    // 在根级别查找
    const rootIndex = this.events.findIndex((e) => e.id === eventId);
    if (rootIndex !== -1) {
      return { parentId: null, index: rootIndex };
    }

    // 递归在子事件中查找
    const search = (events: BaseEvent[]): { parentId: string | null; index: number } | null => {
      for (const event of events) {
        if ('subEvents' in event && event.subEvents) {
          const index = event.subEvents.findIndex((e) => e.id === eventId);
          if (index !== -1) {
            return { parentId: event.id, index };
          }

          const result = search(event.subEvents);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };

    return search(this.events);
  }

  /**
   * 获取事件的所有路径 (用于面包屑导航)
   */
  getEventPath(eventId: string): BaseEvent[] {
    const path: BaseEvent[] = [];

    const search = (events: BaseEvent[]): boolean => {
      for (const event of events) {
        if (event.id === eventId) {
          path.push(event);
          return true;
        }

        if ('subEvents' in event && event.subEvents) {
          const found = search(event.subEvents);
          if (found) {
            path.unshift(event);
            return true;
          }
        }
      }
      return false;
    };

    search(this.events);
    return path;
  }

  // ============================================================================
  // 拖拽排序
  // ============================================================================

  /**
   * 移动事件
   */
  moveEvent(
    eventId: string,
    newParentId: string | null,
    newIndex: number,
  ): OperationResult {
    try {
      const event = this.findEvent(eventId);
      if (!event) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件: ${eventId}`,
          },
        };
      }

      // 防止事件拖拽到自己或自己的子事件下
      if (newParentId === eventId || this.isDescendant(eventId, newParentId)) {
        return {
          success: false,
          error: {
            code: 'INVALID_MOVE',
            message: '不能将事件移动到自己或自己的子事件下',
          },
        };
      }

      // 1. 从原位置删除
      this.events = this.removeEventRecursive(this.events, eventId);

      // 2. 插入到新位置
      if (newParentId === null) {
        // 插入到根级别
        this.events.splice(newIndex, 0, event);
      } else {
        // 插入到父事件的子事件
        const parentEvent = this.findEvent(newParentId);
        if (!parentEvent || !('subEvents' in parentEvent)) {
          return {
            success: false,
            error: {
              code: 'INVALID_PARENT',
              message: `无效的父事件: ${newParentId}`,
            },
          };
        }

        if (!parentEvent.subEvents) {
          parentEvent.subEvents = [];
        }

        parentEvent.subEvents.splice(newIndex, 0, event);
      }

      this.createSnapshot('移动事件');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOVE_EVENT_FAILED',
          message: error instanceof Error ? error.message : '移动事件失败',
        },
      };
    }
  }

  // ============================================================================
  // 条件操作
  // ============================================================================

  /**
   * 添加条件到事件
   */
  addCondition(eventId: string, condition: DeepPartial<Condition> = {}): OperationResult<Condition> {
    try {
      const event = this.findEvent(eventId) as any;
      if (!event) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件: ${eventId}`,
          },
        };
      }

      if (!('conditions' in event)) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_CONDITIONS',
            message: `事件类型 ${event.type} 不支持条件`,
          },
        };
      }

      const newCondition: Condition = {
        id: uuid(),
        type: 'comparison',
        parameters: [],
        ...condition,
      } as Condition;

      if (!event.conditions) {
        event.conditions = [];
      }

      event.conditions.push(newCondition);
      this.createSnapshot('添加条件');

      return {
        success: true,
        data: newCondition,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_CONDITION_FAILED',
          message: error instanceof Error ? error.message : '添加条件失败',
        },
      };
    }
  }

  /**
   * 删除条件
   */
  removeCondition(eventId: string, conditionId: string): OperationResult {
    try {
      const event = this.findEvent(eventId) as any;
      if (!event || !('conditions' in event)) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件或事件不支持条件: ${eventId}`,
          },
        };
      }

      const index = event.conditions.findIndex((c: Condition) => c.id === conditionId);
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'CONDITION_NOT_FOUND',
            message: `未找到条件: ${conditionId}`,
          },
        };
      }

      event.conditions.splice(index, 1);
      this.createSnapshot('删除条件');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_CONDITION_FAILED',
          message: error instanceof Error ? error.message : '删除条件失败',
        },
      };
    }
  }

  /**
   * 更新条件
   */
  updateCondition(
    eventId: string,
    conditionId: string,
    updates: DeepPartial<Condition>,
  ): OperationResult {
    try {
      const event = this.findEvent(eventId) as any;
      if (!event || !('conditions' in event)) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件或事件不支持条件: ${eventId}`,
          },
        };
      }

      const condition = event.conditions.find((c: Condition) => c.id === conditionId);
      if (!condition) {
        return {
          success: false,
          error: {
            code: 'CONDITION_NOT_FOUND',
            message: `未找到条件: ${conditionId}`,
          },
        };
      }

      // 不更新 id 和 type
      Object.assign(condition, {
        ...updates,
        id: condition.id,
        type: condition.type,
      });

      this.createSnapshot('更新条件');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_CONDITION_FAILED',
          message: error instanceof Error ? error.message : '更新条件失败',
        },
      };
    }
  }

  // ============================================================================
  // 动作操作
  // ============================================================================

  /**
   * 添加动作到事件
   */
  addAction(eventId: string, action: DeepPartial<Action> = {}): OperationResult<Action> {
    try {
      const event = this.findEvent(eventId) as any;
      if (!event) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件: ${eventId}`,
          },
        };
      }

      if (!('actions' in event)) {
        return {
          success: false,
          error: {
            code: 'UNSUPPORTED_ACTIONS',
            message: `事件类型 ${event.type} 不支持动作`,
          },
        };
      }

      const newAction: Action = {
        id: uuid(),
        type: 'setData',
        parameters: [],
        ...action,
      } as Action;

      if (!event.actions) {
        event.actions = [];
      }

      event.actions.push(newAction);
      this.createSnapshot('添加动作');

      return {
        success: true,
        data: newAction,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_ACTION_FAILED',
          message: error instanceof Error ? error.message : '添加动作失败',
        },
      };
    }
  }

  /**
   * 删除动作
   */
  removeAction(eventId: string, actionId: string): OperationResult {
    try {
      const event = this.findEvent(eventId) as any;
      if (!event || !('actions' in event)) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件或事件不支持动作: ${eventId}`,
          },
        };
      }

      const index = event.actions.findIndex((a: Action) => a.id === actionId);
      if (index === -1) {
        return {
          success: false,
          error: {
            code: 'ACTION_NOT_FOUND',
            message: `未找到动作: ${actionId}`,
          },
        };
      }

      event.actions.splice(index, 1);
      this.createSnapshot('删除动作');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_ACTION_FAILED',
          message: error instanceof Error ? error.message : '删除动作失败',
        },
      };
    }
  }

  /**
   * 更新动作
   */
  updateAction(
    eventId: string,
    actionId: string,
    updates: DeepPartial<Action>,
  ): OperationResult {
    try {
      const event = this.findEvent(eventId) as any;
      if (!event || !('actions' in event)) {
        return {
          success: false,
          error: {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件或事件不支持动作: ${eventId}`,
          },
        };
      }

      const action = event.actions.find((a: Action) => a.id === actionId);
      if (!action) {
        return {
          success: false,
          error: {
            code: 'ACTION_NOT_FOUND',
            message: `未找到动作: ${actionId}`,
          },
        };
      }

      // 不更新 id 和 type
      Object.assign(action, {
        ...updates,
        id: action.id,
        type: action.type,
      });

      this.createSnapshot('更新动作');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ACTION_FAILED',
          message: error instanceof Error ? error.message : '更新动作失败',
        },
      };
    }
  }

  // ============================================================================
  // 历史记录 (撤销/重做)
  // ============================================================================

  /**
   * 撤销
   */
  undo(): OperationResult {
    if (!this.canUndo()) {
      return {
        success: false,
        error: {
          code: 'NO_UNDO_HISTORY',
          message: '没有可撤销的操作',
        },
      };
    }

    this.historyIndex--;
    const snapshot = this.history[this.historyIndex];
    if (snapshot) {
      this.events = JSON.parse(JSON.stringify(snapshot.events));
    }

    return { success: true };
  }

  /**
   * 重做
   */
  redo(): OperationResult {
    if (!this.canRedo()) {
      return {
        success: false,
        error: {
          code: 'NO_REDO_HISTORY',
          message: '没有可重做的操作',
        },
      };
    }

    this.historyIndex++;
    const snapshot = this.history[this.historyIndex];
    if (snapshot) {
      this.events = JSON.parse(JSON.stringify(snapshot.events));
    }

    return { success: true };
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /**
   * 获取历史记录
   */
  getHistory(): EditorSnapshot[] {
    return this.history.map((s) => ({ ...s }));
  }

  // ============================================================================
  // 验证
  // ============================================================================

  /**
   * 验证事件
   */
  validateEvent(eventId: string): { valid: boolean; errors: ValidationError[] } {
    const event = this.findEvent(eventId);
    if (!event) {
      return {
        valid: false,
        errors: [
          {
            code: 'EVENT_NOT_FOUND',
            message: `未找到事件: ${eventId}`,
          },
        ],
      };
    }

    const errors: ValidationError[] = [];

    // 检查事件是否有条件或动作
    const hasConditions = 'conditions' in event && (event.conditions as any[]).length > 0;
    const hasActions = 'actions' in event && (event.actions as any[]).length > 0;

    if (!hasConditions && !hasActions && event.type === 'standard') {
      errors.push({
        code: 'EMPTY_EVENT',
        message: '事件必须至少有一个条件或一个动作',
      });
    }

    // 验证条件
    if (hasConditions) {
      const conditions = (event.conditions as any[]) || [];
      for (let i = 0; i < conditions.length; i++) {
        const conditionErrors = this.validateCondition(conditions[i]);
        errors.push(
          ...conditionErrors.map((e) => ({
            ...e,
            path: `${eventId}.conditions[${i}]`,
          })),
        );
      }
    }

    // 验证动作
    if (hasActions) {
      const actions = (event.actions as any[]) || [];
      for (let i = 0; i < actions.length; i++) {
        const actionErrors = this.validateAction(actions[i]);
        errors.push(
          ...actionErrors.map((e) => ({
            ...e,
            path: `${eventId}.actions[${i}]`,
          })),
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 验证条件
   */
  private validateCondition(condition: Condition): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!condition.type) {
      errors.push({
        code: 'MISSING_TYPE',
        message: '条件必须有类型',
      });
    }

    if (!condition.parameters) {
      errors.push({
        code: 'MISSING_PARAMETERS',
        message: '条件必须有参数',
      });
    }

    return errors;
  }

  /**
   * 验证动作
   */
  private validateAction(action: Action): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!action.type) {
      errors.push({
        code: 'MISSING_TYPE',
        message: '动作必须有类型',
      });
    }

    if (!action.parameters) {
      errors.push({
        code: 'MISSING_PARAMETERS',
        message: '动作必须有参数',
      });
    }

    return errors;
  }

  /**
   * 验证整个事件树
   */
  validateAllEvents(): { valid: boolean; errors: Map<string, ValidationError[]> } {
    const errors = new Map<string, ValidationError[]>();

    const validate = (events: BaseEvent[]) => {
      for (const event of events) {
        const result = this.validateEvent(event.id);
        if (!result.valid) {
          errors.set(event.id, result.errors);
        }

        if ('subEvents' in event && event.subEvents) {
          validate((event.subEvents as any[]) || []);
        }
      }
    };

    validate(this.events);

    return {
      valid: errors.size === 0,
      errors,
    };
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  /**
   * 递归查找事件
   */
  private findEventRecursive(events: BaseEvent[], eventId: string): BaseEvent | null {
    for (const event of events) {
      if (event.id === eventId) {
        return event;
      }

      if ('subEvents' in event && event.subEvents) {
        const found = this.findEventRecursive(event.subEvents as BaseEvent[], eventId);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  /**
   * 递归删除事件
   */
  private removeEventRecursive(events: BaseEvent[], eventId: string): BaseEvent[] {
    return events.filter((event) => {
      if (event.id === eventId) {
        return false;
      }

      if ('subEvents' in event && event.subEvents) {
        event.subEvents = this.removeEventRecursive(event.subEvents as BaseEvent[], eventId);
      }

      return true;
    });
  }

  /**
   * 检查是否是后代
   */
  private isDescendant(ancestorId: string, potentialDescendantId: string | null): boolean {
    if (potentialDescendantId === null) {
      return false;
    }

    const ancestor = this.findEvent(ancestorId);
    if (!ancestor || !('subEvents' in ancestor)) {
      return false;
    }

    const descendants = (ancestor.subEvents as BaseEvent[]) || [];

    for (const descendant of descendants) {
      if (descendant.id === potentialDescendantId) {
        return true;
      }

      if (this.isDescendant(descendant.id, potentialDescendantId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 创建历史快照
   */
  private createSnapshot(description: string): void {
    // 删除当前索引之后的快照 (因为新操作)
    if (this.historyIndex < this.history.length - 1) {
      this.history.splice(this.historyIndex + 1);
    }

    // 创建新快照
    const snapshot: EditorSnapshot = {
      events: JSON.parse(JSON.stringify(this.events)),
      timestamp: Date.now(),
      description,
    };

    this.history.push(snapshot);
    this.historyIndex = this.history.length - 1;

    // 限制历史大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }
}
