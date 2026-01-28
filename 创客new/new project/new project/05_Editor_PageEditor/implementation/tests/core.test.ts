/**
 * 页面编辑器 - 单元测试
 *
 * 测试覆盖:
 * - CanvasRenderer: 渲染逻辑、布局计算
 * - SelectionManager: 选择操作
 * - TransformManager: 变换计算
 * - CommandManager: 撤销/重做
 */

import { describe, it, expect, beforeEach } from 'vitest';
import CanvasRenderer from '../canvas-renderer';
import SelectionManager from '../selection-manager';
import TransformManager from '../transform-manager';
import CommandManager, { MoveCommand, ResizeCommand, BatchCommandImpl } from '../editor-commands';
import type {
  Rectangle,
  Point,
  RenderContext,
  CanvasState,
  SelectionState,
  Command,
} from '../types';

// ============================================================================
// 测试数据工厂
// ============================================================================

function createMockCanvasState(): CanvasState {
  return {
    zoom: 1,
    offset: { x: 0, y: 0 },
    deviceType: 'mobile',
    deviceWidth: 375,
    showGrid: false,
    gridSize: 8,
    showRulers: false,
    showAlignmentGuides: false,
    alignmentThreshold: 5,
    snapToGrid: false,
    snapToComponents: false,
  };
}

function createMockSelectionState(): SelectionState {
  return {
    selectedIds: [],
    isMultiSelect: false,
    selectionBox: null,
    alignmentGuides: [],
  };
}

function createMockRenderContext(canvasState?: CanvasState): RenderContext {
  return {
    canvasState: canvasState || createMockCanvasState(),
    selectionState: createMockSelectionState(),
    depth: 0,
  };
}

function createMockComponent(id: string, left = 0, top = 0, width = 100, height = 100) {
  return {
    id,
    type: 'view',
    name: `Component ${id}`,
    properties: [],
    style: {
      left: String(left),
      top: String(top),
      width: String(width),
      height: String(height),
    },
    events: [],
    children: [],
    dataBindings: [],
  };
}

// ============================================================================
// CanvasRenderer 测试
// ============================================================================

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;

  beforeEach(() => {
    renderer = new CanvasRenderer();
  });

  it('应该渲染单个组件', () => {
    const components = [createMockComponent('1', 10, 20, 100, 100)];
    const context = createMockRenderContext();

    const rendered = renderer.renderComponents(components, context);

    expect(rendered).toHaveLength(1);
    expect(rendered[0].id).toBe('1');
    expect(rendered[0].bounds.left).toBe(10);
    expect(rendered[0].bounds.top).toBe(20);
    expect(rendered[0].bounds.width).toBe(100);
    expect(rendered[0].bounds.height).toBe(100);
  });

  it('应该渲染嵌套组件', () => {
    const childComponent = createMockComponent('2', 5, 5, 50, 50);
    const parentComponent = createMockComponent('1', 10, 20, 100, 100);
    parentComponent.children = [childComponent];

    const components = [parentComponent];
    const context = createMockRenderContext();

    const rendered = renderer.renderComponents(components, context);

    expect(rendered).toHaveLength(1);
    expect(rendered[0].children).toHaveLength(1);
    expect(rendered[0].children[0].id).toBe('2');
    // 子组件的绝对位置应该是相对于父级的
    expect(rendered[0].children[0].bounds.left).toBe(15); // 10 + 5
    expect(rendered[0].children[0].bounds.top).toBe(25);  // 20 + 5
  });

  it('应该计算组件边界', () => {
    const component = createMockComponent('1', 50, 60, 200, 150);
    const canvasState = createMockCanvasState();

    const bounds = renderer.calculateBounds(component, undefined, canvasState);

    expect(bounds.left).toBe(50);
    expect(bounds.top).toBe(60);
    expect(bounds.width).toBe(200);
    expect(bounds.height).toBe(150);
  });

  it('应该渲染网格', () => {
    const gridLines = renderer.renderGrid(375, 667, 8);

    expect(gridLines.vertical.length).toBeGreaterThan(0);
    expect(gridLines.horizontal.length).toBeGreaterThan(0);
    expect(gridLines.vertical[0]).toBe(0);
    expect(gridLines.vertical[gridLines.vertical.length - 1]).toBe(Math.ceil(375 / 8) * 8);
  });

  it('应该渲染标尺', () => {
    const rulers = renderer.renderRulers(375, 667, 1);

    expect(rulers.horizontal).toBeDefined();
    expect(rulers.vertical).toBeDefined();
    expect(rulers.horizontal.length).toBeGreaterThan(0);
    expect(rulers.vertical.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// SelectionManager 测试
// ============================================================================

describe('SelectionManager', () => {
  let selectionManager: SelectionManager;

  beforeEach(() => {
    selectionManager = new SelectionManager();
  });

  it('应该选择单个组件', () => {
    selectionManager.selectComponent('1', { multiSelect: false });

    expect(selectionManager.isSelected('1')).toBe(true);
    expect(selectionManager.getSelectedIds()).toEqual(['1']);
  });

  it('应该多选组件', () => {
    selectionManager.selectComponent('1', { multiSelect: false });
    selectionManager.selectComponent('2', { multiSelect: true });
    selectionManager.selectComponent('3', { multiSelect: true });

    expect(selectionManager.getSelectedIds()).toEqual(expect.arrayContaining(['1', '2', '3']));
    expect(selectionManager.getSelectionCount()).toBe(3);
  });

  it('应该切换组件选择状态', () => {
    selectionManager.selectComponent('1', { toggle: true });
    expect(selectionManager.isSelected('1')).toBe(true);

    selectionManager.selectComponent('1', { toggle: true });
    expect(selectionManager.isSelected('1')).toBe(false);
  });

  it('应该清空选择', () => {
    selectionManager.selectComponent('1');
    selectionManager.selectComponent('2', { multiSelect: true });

    selectionManager.clearSelection();

    expect(selectionManager.getSelectionCount()).toBe(0);
  });

  it('应该取消选择单个组件', () => {
    selectionManager.selectComponents(['1', '2', '3']);

    selectionManager.unselectComponent('2');

    expect(selectionManager.getSelectedIds()).toEqual(expect.arrayContaining(['1', '3']));
    expect(selectionManager.isSelected('2')).toBe(false);
  });

  it('应该查找对齐辅助线', () => {
    const movingBounds: Rectangle = {
      left: 100,
      top: 100,
      width: 50,
      height: 50,
    };

    const allComponents = [createMockComponent('1', 100, 150, 50, 50)];

    const guides = selectionManager.findAlignmentGuides(movingBounds, allComponents, 5);

    // 应该找到左边缘对齐
    expect(guides.some((g) => g.type === 'vertical' && g.edge === 'left')).toBe(true);
  });

  it('应该应用对齐吸附', () => {
    const bounds: Rectangle = {
      left: 100,
      top: 100,
      width: 50,
      height: 50,
    };

    const guides = [
      { type: 'vertical' as const, position: 110, edge: 'left' as const },
    ];

    const snappedBounds = selectionManager.applyAlignmentSnap(bounds, guides);

    expect(snappedBounds.left).toBe(110);
  });
});

// ============================================================================
// TransformManager 测试
// ============================================================================

describe('TransformManager', () => {
  let transformManager: TransformManager;

  beforeEach(() => {
    transformManager = new TransformManager();
  });

  it('应该计算拖拽位移', () => {
    const dragState = transformManager.startDrag(
      ['1'],
      { x: 10, y: 20 },
      new Map([['1', { left: 100, top: 100, width: 50, height: 50 }]])
    );

    const newBounds = transformManager.updateDrag(
      {
        ...dragState,
        currentPosition: { x: 40, y: 50 },
      },
      { x: 40, y: 50 }
    );

    const bounds = newBounds.get('1')!;
    expect(bounds.left).toBe(130); // 100 + (40 - 10)
    expect(bounds.top).toBe(130);  // 100 + (50 - 20)
  });

  it('应该应用网格吸附', () => {
    const newBounds = transformManager.updateDrag(
      {
        componentIds: ['1'],
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        originalBounds: new Map([['1', { left: 0, top: 0, width: 100, height: 100 }]]),
      },
      { x: 13, y: 21 },
      { gridSize: 8, snapToGrid: true }
    );

    const bounds = newBounds.get('1')!;
    expect(bounds.left).toBe(16); // Math.round(13 / 8) * 8
    expect(bounds.top).toBe(24);  // Math.round(21 / 8) * 8
  });

  it('应该应用键盘移动', () => {
    const currentBounds: Rectangle = { left: 100, top: 100, width: 50, height: 50 };

    let newBounds = transformManager.moveByKeyboard('left', 10, currentBounds);
    expect(newBounds.left).toBe(90);

    newBounds = transformManager.moveByKeyboard('right', 10, currentBounds);
    expect(newBounds.left).toBe(110);

    newBounds = transformManager.moveByKeyboard('up', 10, currentBounds);
    expect(newBounds.top).toBe(90);

    newBounds = transformManager.moveByKeyboard('down', 10, currentBounds);
    expect(newBounds.top).toBe(110);
  });

  it('应该计算缩放', () => {
    const resizeState = transformManager.startResize(
      '1',
      'se',
      { x: 100, y: 100 },
      { left: 50, top: 50, width: 100, height: 100 },
      false
    );

    const newBounds = transformManager.updateResize(
      {
        ...resizeState,
        currentPosition: { x: 120, y: 130 },
      },
      { x: 120, y: 130 },
      { minWidth: 10, minHeight: 10 }
    );

    expect(newBounds.width).toBe(120); // 100 + (120 - 100)
    expect(newBounds.height).toBe(130); // 100 + (130 - 100)
  });

  it('应该保持宽高比', () => {
    const resizeState = transformManager.startResize(
      '1',
      'se',
      { x: 100, y: 100 },
      { left: 50, top: 50, width: 100, height: 100 },
      true // maintainAspectRatio
    );

    const newBounds = transformManager.updateResize(
      {
        ...resizeState,
        currentPosition: { x: 150, y: 100 },
      },
      { x: 150, y: 100 },
      { minWidth: 10, minHeight: 10 }
    );

    // 宽高比应该保持 1:1
    expect(newBounds.width).toBe(newBounds.height);
  });

  it('应该应用网格吸附到边界', () => {
    const bounds: Rectangle = { left: 15, top: 21, width: 33, height: 45 };

    const snappedBounds = transformManager.snapBoundsToGrid(bounds, 8);

    expect(snappedBounds.left).toBe(16);
    expect(snappedBounds.top).toBe(24);
    expect(snappedBounds.width).toBe(32);
    expect(snappedBounds.height).toBe(48);
  });
});

// ============================================================================
// CommandManager 测试
// ============================================================================

describe('CommandManager', () => {
  let commandManager: CommandManager;

  beforeEach(() => {
    commandManager = new CommandManager(50);
  });

  it('应该执行命令', () => {
    let executed = false;
    const mockCommand: Command = {
      execute: () => {
        executed = true;
      },
      undo: () => {
        executed = false;
      },
      description: '测试命令',
    };

    commandManager.execute(mockCommand);

    expect(executed).toBe(true);
    expect(commandManager.canUndo()).toBe(true);
    expect(commandManager.canRedo()).toBe(false);
  });

  it('应该撤销命令', () => {
    let state = 0;
    const mockCommand: Command = {
      execute: () => {
        state = 1;
      },
      undo: () => {
        state = 0;
      },
      description: '测试命令',
    };

    commandManager.execute(mockCommand);
    expect(state).toBe(1);

    commandManager.undo();
    expect(state).toBe(0);
    expect(commandManager.canRedo()).toBe(true);
  });

  it('应该重做命令', () => {
    let state = 0;
    const mockCommand: Command = {
      execute: () => {
        state = 1;
      },
      undo: () => {
        state = 0;
      },
      description: '测试命令',
    };

    commandManager.execute(mockCommand);
    commandManager.undo();

    commandManager.redo();

    expect(state).toBe(1);
    expect(commandManager.canRedo()).toBe(false);
  });

  it('应该清空重做栈当执行新命令时', () => {
    let state = 0;
    const cmd1: Command = {
      execute: () => { state = 1; },
      undo: () => { state = 0; },
      description: '命令1',
    };

    const cmd2: Command = {
      execute: () => { state = 2; },
      undo: () => { state = 1; },
      description: '命令2',
    };

    commandManager.execute(cmd1);
    commandManager.undo();
    expect(commandManager.canRedo()).toBe(true);

    commandManager.execute(cmd2);
    expect(commandManager.canRedo()).toBe(false);
  });

  it('应该限制撤销栈大小', () => {
    const manager = new CommandManager(3);

    for (let i = 0; i < 5; i++) {
      const cmd: Command = {
        execute: () => {},
        undo: () => {},
        description: `命令 ${i}`,
      };
      manager.execute(cmd);
    }

    expect(manager.getUndoStackSize()).toBe(3);
  });

  it('应该获取命令描述', () => {
    const mockCommand: Command = {
      execute: () => {},
      undo: () => {},
      description: '移动组件',
    };

    commandManager.execute(mockCommand);

    expect(commandManager.getUndoDescription()).toBe('移动组件');
    expect(commandManager.getRedoDescription()).toBeNull();

    commandManager.undo();

    expect(commandManager.getUndoDescription()).toBeNull();
    expect(commandManager.getRedoDescription()).toBe('移动组件');
  });

  it('应该执行批量命令', () => {
    const commands: Command[] = [];
    const values: number[] = [];

    for (let i = 0; i < 3; i++) {
      commands.push({
        execute: () => { values.push(i); },
        undo: () => { values.pop(); },
        description: `命令 ${i}`,
      });
    }

    const batchCmd = new BatchCommandImpl(commands, '批量操作');
    commandManager.execute(batchCmd);

    expect(values).toEqual([0, 1, 2]);
    expect(commandManager.getUndoDescription()).toBe('批量操作');

    commandManager.undo();

    expect(values).toEqual([]);
  });

  it('应该清空历史', () => {
    const mockCommand: Command = {
      execute: () => {},
      undo: () => {},
      description: '测试',
    };

    commandManager.execute(mockCommand);
    commandManager.undo();

    expect(commandManager.canUndo()).toBe(true);
    expect(commandManager.canRedo()).toBe(true);

    commandManager.clear();

    expect(commandManager.canUndo()).toBe(false);
    expect(commandManager.canRedo()).toBe(false);
  });
});

// ============================================================================
// 集成测试
// ============================================================================

describe('Integration Tests', () => {
  it('应该支持完整的编辑流程: 选择 -> 拖拽 -> 撤销 -> 重做', () => {
    const selectionManager = new SelectionManager();
    const transformManager = new TransformManager();
    const commandManager = new CommandManager();

    // 1. 选择组件
    selectionManager.selectComponent('1');
    expect(selectionManager.isSelected('1')).toBe(true);

    // 2. 拖拽组件
    const originalBounds = { left: 100, top: 100, width: 50, height: 50 };
    const dragState = transformManager.startDrag(
      ['1'],
      { x: 100, y: 100 },
      new Map([['1', originalBounds]])
    );

    const newBounds = transformManager.updateDrag(
      {
        ...dragState,
        currentPosition: { x: 120, y: 130 },
      },
      { x: 120, y: 130 }
    );

    // 3. 创建移动命令
    const moveCmd = new MoveCommand(
      ['1'],
      new Map([['1', { x: 100, y: 100 }]]),
      new Map([['1', { x: 120, y: 130 }]]),
      () => {} // mock updateFn
    );

    commandManager.execute(moveCmd);
    expect(commandManager.canUndo()).toBe(true);

    // 4. 撤销
    commandManager.undo();
    expect(commandManager.canRedo()).toBe(true);

    // 5. 重做
    commandManager.redo();
    expect(commandManager.canUndo()).toBe(true);
  });
});
