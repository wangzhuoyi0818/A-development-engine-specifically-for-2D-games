/**
 * 微信小程序可视化开发平台 - 命令管理器
 *
 * 实现命令模式,支持撤销/重做功能
 */

import type { Command, BatchCommand, UpdateComponentFunction, UpdatePageFunction } from './types';

// ============================================================================
// 命令基类
// ============================================================================

/**
 * 基础命令类
 */
export abstract class BaseCommand implements Command {
  abstract execute(): void;
  abstract undo(): void;
  abstract description: string;
}

// ============================================================================
// 内置命令
// ============================================================================

/**
 * 移动组件命令
 */
export class MoveCommand implements Command {
  description = '移动组件';

  constructor(
    private componentIds: string[],
    private oldPositions: Map<string, { x: number; y: number }>,
    private newPositions: Map<string, { x: number; y: number }>,
    private updateFn: UpdateComponentFunction
  ) {}

  execute(): void {
    for (const componentId of this.componentIds) {
      const newPos = this.newPositions.get(componentId);
      if (newPos) {
        this.updateFn(componentId, {
          style: {
            left: String(newPos.x),
            top: String(newPos.y),
          },
        } as any);
      }
    }
  }

  undo(): void {
    for (const componentId of this.componentIds) {
      const oldPos = this.oldPositions.get(componentId);
      if (oldPos) {
        this.updateFn(componentId, {
          style: {
            left: String(oldPos.x),
            top: String(oldPos.y),
          },
        } as any);
      }
    }
  }
}

/**
 * 缩放组件命令
 */
export class ResizeCommand implements Command {
  description = '调整大小';

  constructor(
    private componentId: string,
    private oldBounds: { width: number; height: number },
    private newBounds: { width: number; height: number },
    private updateFn: UpdateComponentFunction
  ) {}

  execute(): void {
    this.updateFn(this.componentId, {
      style: {
        width: String(this.newBounds.width),
        height: String(this.newBounds.height),
      },
    } as any);
  }

  undo(): void {
    this.updateFn(this.componentId, {
      style: {
        width: String(this.oldBounds.width),
        height: String(this.oldBounds.height),
      },
    } as any);
  }
}

/**
 * 删除组件命令
 */
export class DeleteCommand implements Command {
  description = '删除组件';

  constructor(
    private parentId: string | null,
    private index: number,
    private component: any,
    private onDelete: (parentId: string | null, index: number) => void,
    private onRestore: (parentId: string | null, index: number, component: any) => void
  ) {}

  execute(): void {
    this.onDelete(this.parentId, this.index);
  }

  undo(): void {
    this.onRestore(this.parentId, this.index, this.component);
  }
}

/**
 * 添加组件命令
 */
export class AddCommand implements Command {
  description = '添加组件';

  constructor(
    private component: any,
    private parentId: string | null,
    private index: number,
    private onAdd: (component: any, parentId: string | null, index: number) => void,
    private onRemove: (parentId: string | null, index: number) => void
  ) {}

  execute(): void {
    this.onAdd(this.component, this.parentId, this.index);
  }

  undo(): void {
    this.onRemove(this.parentId, this.index);
  }
}

/**
 * 更新属性命令
 */
export class UpdatePropertiesCommand implements Command {
  description = '更新属性';

  constructor(
    private componentId: string,
    private oldProperties: any,
    private newProperties: any,
    private updateFn: UpdateComponentFunction
  ) {}

  execute(): void {
    this.updateFn(this.componentId, this.newProperties);
  }

  undo(): void {
    this.updateFn(this.componentId, this.oldProperties);
  }
}

/**
 * 批量命令 (宏命令)
 */
export class BatchCommandImpl implements BatchCommand {
  description: string;
  commands: Command[];

  constructor(commands: Command[], description?: string) {
    this.commands = commands;
    this.description = description || `批量操作 (${commands.length} 个)`;
  }

  execute(): void {
    for (const command of this.commands) {
      command.execute();
    }
  }

  undo(): void {
    // 逆序撤销
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }
}

// ============================================================================
// 命令管理器
// ============================================================================

/**
 * 命令管理器
 *
 * 职责:
 * - 执行命令
 * - 管理撤销/重做栈
 * - 提供查询接口
 */
export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private readonly maxStackSize: number;

  constructor(maxStackSize: number = 50) {
    this.maxStackSize = maxStackSize;
  }

  /**
   * 执行命令
   */
  execute(command: Command): boolean {
    try {
      command.execute();
      this.undoStack.push(command);
      this.redoStack = []; // 清空重做栈
      this.trimStack();
      return true;
    } catch (error) {
      console.error('命令执行失败:', error);
      return false;
    }
  }

  /**
   * 撤销
   */
  undo(): boolean {
    if (this.undoStack.length === 0) {
      return false;
    }

    try {
      const command = this.undoStack.pop()!;
      command.undo();
      this.redoStack.push(command);
      return true;
    } catch (error) {
      console.error('撤销失败:', error);
      return false;
    }
  }

  /**
   * 重做
   */
  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false;
    }

    try {
      const command = this.redoStack.pop()!;
      command.execute();
      this.undoStack.push(command);
      return true;
    } catch (error) {
      console.error('重做失败:', error);
      return false;
    }
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * 获取撤销描述
   */
  getUndoDescription(): string | null {
    if (this.undoStack.length === 0) {
      return null;
    }
    return this.undoStack[this.undoStack.length - 1].description;
  }

  /**
   * 获取重做描述
   */
  getRedoDescription(): string | null {
    if (this.redoStack.length === 0) {
      return null;
    }
    return this.redoStack[this.redoStack.length - 1].description;
  }

  /**
   * 清空历史
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * 修剪栈大小
   */
  private trimStack(): void {
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack = this.undoStack.slice(-this.maxStackSize);
    }
  }

  /**
   * 获取撤销栈大小
   */
  getUndoStackSize(): number {
    return this.undoStack.length;
  }

  /**
   * 获取重做栈大小
   */
  getRedoStackSize(): number {
    return this.redoStack.length;
  }
}

// ============================================================================
// 命令工厂
// ============================================================================

/**
 * 命令工厂,便于创建常用命令
 */
export class CommandFactory {
  /**
   * 创建移动命令
   */
  static createMoveCommand(
    componentIds: string[],
    oldPositions: Map<string, { x: number; y: number }>,
    newPositions: Map<string, { x: number; y: number }>,
    updateFn: UpdateComponentFunction
  ): MoveCommand {
    return new MoveCommand(componentIds, oldPositions, newPositions, updateFn);
  }

  /**
   * 创建缩放命令
   */
  static createResizeCommand(
    componentId: string,
    oldBounds: { width: number; height: number },
    newBounds: { width: number; height: number },
    updateFn: UpdateComponentFunction
  ): ResizeCommand {
    return new ResizeCommand(componentId, oldBounds, newBounds, updateFn);
  }

  /**
   * 创建删除命令
   */
  static createDeleteCommand(
    parentId: string | null,
    index: number,
    component: any,
    onDelete: (parentId: string | null, index: number) => void,
    onRestore: (parentId: string | null, index: number, component: any) => void
  ): DeleteCommand {
    return new DeleteCommand(parentId, index, component, onDelete, onRestore);
  }

  /**
   * 创建添加命令
   */
  static createAddCommand(
    component: any,
    parentId: string | null,
    index: number,
    onAdd: (component: any, parentId: string | null, index: number) => void,
    onRemove: (parentId: string | null, index: number) => void
  ): AddCommand {
    return new AddCommand(component, parentId, index, onAdd, onRemove);
  }

  /**
   * 创建属性更新命令
   */
  static createUpdatePropertiesCommand(
    componentId: string,
    oldProperties: any,
    newProperties: any,
    updateFn: UpdateComponentFunction
  ): UpdatePropertiesCommand {
    return new UpdatePropertiesCommand(componentId, oldProperties, newProperties, updateFn);
  }

  /**
   * 创建批量命令
   */
  static createBatchCommand(
    commands: Command[],
    description?: string
  ): BatchCommandImpl {
    return new BatchCommandImpl(commands, description);
  }
}

// ============================================================================
// 导出
// ============================================================================

export default CommandManager;
