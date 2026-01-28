/**
 * 编辑器存储 (Zustand Store)
 * 管理编辑器状态，包括选中组件、撤销栈等
 */

import { create } from 'zustand';
import type { Component, EditorState, EditorAction, EditorMode, EditorTool } from '../types';

interface EditorStore extends EditorState {
  // 操作方法
  setMode: (mode: EditorMode) => void;
  selectComponent: (componentId?: string) => void;
  setTool: (tool: EditorTool) => void;
  setZoom: (level: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: (enabled?: boolean) => void;
  toggleRulers: (enabled?: boolean) => void;

  // 撤销重做
  pushAction: (action: EditorAction) => void;
  undo: () => EditorAction | undefined;
  redo: () => EditorAction | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // 重置
  reset: () => void;
}

const initialState: EditorState = {
  currentMode: 'design',
  currentTool: 'select',
  zoomLevel: 1,
  panX: 0,
  panY: 0,
  isGridEnabled: true,
  gridSize: 20,
  showRulers: true,
  undoStack: [],
  redoStack: [],
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ currentMode: mode }),

  selectComponent: (componentId) => set({ selectedComponentId: componentId }),

  setTool: (tool) => set({ currentTool: tool }),

  setZoom: (level) => set({ zoomLevel: Math.max(0.1, Math.min(level, 5)) }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  toggleGrid: (enabled) =>
    set((state) => ({
      isGridEnabled: enabled !== undefined ? enabled : !state.isGridEnabled,
    })),

  toggleRulers: (enabled) =>
    set((state) => ({
      showRulers: enabled !== undefined ? enabled : !state.showRulers,
    })),

  pushAction: (action) => {
    set((state) => ({
      undoStack: [...state.undoStack, action],
      redoStack: [], // 清空重做栈
    }));
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return undefined;

    const action = undoStack[undoStack.length - 1];
    set({
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, action],
    });
    return action;
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return undefined;

    const action = redoStack[redoStack.length - 1];
    set({
      undoStack: [...undoStack, action],
      redoStack: redoStack.slice(0, -1),
    });
    return action;
  },

  canUndo: () => get().undoStack.length > 0,

  canRedo: () => get().redoStack.length > 0,

  clearHistory: () => set({ undoStack: [], redoStack: [] }),

  reset: () => set(initialState),
}));
